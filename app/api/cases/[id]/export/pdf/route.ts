import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { generateCongressSummaryPDF } from '@/lib/pdf/congress-summary';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile and hospital
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, hospital_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 401 });
    }

    // Fetch case data
    const { data: caseRecord, error: caseError } = await supabase
      .from('ecrf_opstar_records')
      .select(`
        id,
        id_paciente,
        centro,
        vaso_diana,
        created_at,
        hospital_id,
        calcio_ia,
        placa_lipida_ia,
        ffr_oct,
        expected_contrast_ml,
        actual_contrast_ml,
        zero_contrast_completed,
        opstar_strategy_changes(*),
        opstar_optimization_results(*)
      `)
      .eq('id', id)
      .single();

    if (caseError || !caseRecord) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Access control: hospital_user can only export their own hospital cases
    if (profile.role === 'hospital_user' && caseRecord.hospital_id !== profile.hospital_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only admin, monitor, and hospital_user can export
    if (!['admin', 'monitor', 'hospital_user'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Fetch follow-ups
    const { data: followups } = await supabase
      .from('opstar_followup')
      .select('followup_type, followup_date, mace')
      .eq('case_id', id)
      .order('followup_date', { ascending: true });

    // Fetch hospital name
    const { data: hospital } = await supabase
      .from('hospitals')
      .select('name')
      .eq('id', caseRecord.hospital_id)
      .single();

    // Fetch key images metadata (for reference only, not included in PDF)
    const { data: keyImages } = await supabase
      .from('opstar_case_media')
      .select('id, media_category, acquisition_phase, is_key_image')
      .eq('case_id', id)
      .eq('is_key_image', true)
      .limit(3);

    // Extract strategy changes and optimization
    const strategyChanges = (caseRecord.opstar_strategy_changes as any[])?.[0];
    const optimization = (caseRecord.opstar_optimization_results as any[])?.[0];

    // Generate pseudonymized case code
    const caseCode = `OPSTAR-${caseRecord.hospital_id?.substring(0, 4).toUpperCase()}-${id.substring(0, 8).toUpperCase()}`;

    // Prepare PDF data (anonymized)
    const pdfData = {
      caseCode,
      center: hospital?.name || 'Center (Anonymized)',
      segment: caseRecord.vaso_diana || 'Not specified',
      procedureDate: caseRecord.created_at || new Date().toISOString(),
      zeroContrastCompleted: caseRecord.zero_contrast_completed || false,
      ffrOct: caseRecord.ffr_oct,
      calciumSevere: caseRecord.calcio_ia,
      lipidPlaque: caseRecord.placa_lipida_ia,
      eel: (strategyChanges as any)?.eel,
      strategyModified: (strategyChanges as any)?.cambio_estrategia || false,
      strategyChangeMagnitude: (strategyChanges as any)?.change_magnitude,
      strategyChangeDescription: (strategyChanges as any)?.cambio_descripcion,
      msa: (optimization as any)?.msa,
      stentExpansionPercent: (optimization as any)?.stent_expansion_percent,
      malappositionLength: (optimization as any)?.malapposition_length,
      dissection: (optimization as any)?.edge_dissection,
      opstarScore: (optimization as any)?.opstar_score,
      expectedContrast: caseRecord.expected_contrast_ml,
      actualContrast: caseRecord.actual_contrast_ml,
      followups: followups?.map((f) => ({
        type: f.followup_type || 'Unknown',
        date: f.followup_date || '',
        mace: f.mace || false,
      })) || [],
      keyImageUrls: {
        preOct: keyImages?.find((img) => img.acquisition_phase === 'pre_pci') ? 'Available' : undefined,
        postOct: keyImages?.find((img) => img.acquisition_phase === 'post_pci') ? 'Available' : undefined,
        ultreon: keyImages?.find((img) => img.media_category === 'ultreon_screenshot') ? 'Available' : undefined,
      },
    };

    // Generate PDF
    const pdfBuffer = await generateCongressSummaryPDF(pdfData);

    // Return PDF with appropriate headers
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="congress-summary-${caseCode}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: error?.message || 'Error generating PDF' },
      { status: 500 }
    );
  }
}
