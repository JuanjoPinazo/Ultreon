const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function simulateSaveAction(payload) {
    let generatedCode = payload.anonymous_code;
    let shouldGenerateCode = false;
    let prefix = 'CASE';
    
    if (!generatedCode || generatedCode.trim() === '' || generatedCode.includes('(Se generará')) {
      shouldGenerateCode = true;
      const { data: hosp } = await supabase.from('hospitals').select('short_name').eq('id', payload.hospital_id).single();
      prefix = hosp?.short_name || 'CASE';
    }

    let isInserted = false;
    let attempts = 0;
    let lastError = null;
    let finalCode = generatedCode;
    let insertedCase = null;

    while (!isInserted && attempts < 10) {
      attempts++;
      
      if (shouldGenerateCode) {
        const { count } = await supabase.from('ecrf_opstar_records').select('*', { count: 'exact', head: true }).eq('hospital_id', payload.hospital_id);
        const nextNum = (count || 0) + attempts;
        finalCode = `${prefix}-${nextNum.toString().padStart(4, '0')}`;
      }

      const insertData = {
        ...payload,
        anonymous_code: finalCode,
        created_by: '7eb4e1bd-139d-4731-9f2d-625841434cd6',
        updated_at: new Date().toISOString(),
      };

      const { data: attemptData, error: caseError } = await supabase
        .from('ecrf_opstar_records')
        .insert([insertData])
        .select('id')
        .maybeSingle();

      if (caseError) {
        if (caseError.code === '23505' && shouldGenerateCode) {
          lastError = caseError;
          console.log(`Attempt ${attempts} failed with 23505 (Code: ${finalCode}). Retrying...`);
          continue;
        } else {
          return { error: `Error al guardar en Supabase: ${caseError.message}`, details: caseError };
        }
      }
      insertedCase = attemptData;
      isInserted = true;
    }

    if (!isInserted) return { error: 'Error de concurrencia' };
    return { success: true, id: insertedCase?.id, code: finalCode };
}

(async () => {
    console.log("Simulating concurrent inserts...");
    const dummyRecord = {
        hospital_id: '6daf691c-3354-459f-94c5-70fd0e876d28',
        operator_id: '7eb4e1bd-139d-4731-9f2d-625841434cd6',
        procedure_date: '2026-09-15',
        case_status: 'completed',
        // removed is_demo: true
        anonymous_code: '(Se generará al guardar)',
        coronary_segment: 'Proximal',
        wash_quality: 'Good',
        contrast_during_oct_ml: 0,
        tecnica_purga_oct: 'test',
        ffr_oct: false,
        calcio_severo_ia: false,
        placa_lipidica_ia: false,
        landing_zone: 'test',
        diametro_referencia_vaso: 3,
        modifico_estrategia_ultreon: false,
        expansion_stent: 'test',
        malaposicion_struts: false,
        diseccion_bordes: false,
        contraste_ml: 0
    };
    
    const results = await Promise.all([simulateSaveAction(dummyRecord), simulateSaveAction(dummyRecord)]);
    console.log("Results:", results);
    
    if(results[0].id) await supabase.from('ecrf_opstar_records').delete().eq('id', results[0].id);
    if(results[1].id) await supabase.from('ecrf_opstar_records').delete().eq('id', results[1].id);
})();
