'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export interface CaseWithRelations {
  id: string;
  id_paciente: string;
  centro: string;
  vaso_diana: string;
  tecnica_purga_oct: string;
  ffr_oct: number | null;
  calcio_ia: boolean;
  placa_lipida_ia: boolean;
  arco_lipidico_estimado: number | null;
  landing_zone: string;
  diametro: number | null;
  modifico_estrategia: boolean;
  expansion: number | null;
  malaposicion_struts: boolean;
  diseccion_bordes: boolean;
  contraste_ml: number | null;
  hospital_id: string | null;
  created_by: string;
  created_at: string;
  expected_contrast_ml: number | null;
  actual_contrast_ml: number | null;
  contrast_reduction_percent: number | null;
  zero_contrast_completed: boolean;
  hospitals: { name: string } | null;
  opstar_strategy_changes?: Array<{
    id: string;
    case_id: string;
    modified_strategy: boolean;
    change_magnitude: 'minor' | 'moderate' | 'major' | null;
    change_description: string | null;
    changed_stent_diameter: boolean;
    changed_stent_length: boolean;
    changed_landing_zone_proximal: boolean;
    changed_landing_zone_distal: boolean;
    required_plaque_preparation: boolean;
    used_nc_balloon: boolean;
    used_scoring_cutting_balloon: boolean;
    used_ivl: boolean;
    used_atherectomy: boolean;
    decided_no_stent: boolean;
    treated_edge: boolean;
    additional_postdilatation: boolean;
    global_strategy_change: boolean;
    other_change: boolean;
  }> | null;
  opstar_optimization_results?: Array<{
    id: string;
    case_id: string;
    post_stent_msa_mm2: number | null;
    stent_expansion_percent: number | null;
    adequate_expansion: 'yes' | 'no' | 'na' | null;
    significant_malapposition: 'yes' | 'no' | 'na' | null;
    malapposition_length_mm: number | null;
    requires_malapposition_correction: boolean;
    proximal_edge_dissection: boolean;
    distal_edge_dissection: boolean;
    proximal_dissection_length_mm: number | null;
    distal_dissection_length_mm: number | null;
    significant_flap_gt_3mm: boolean;
    requires_edge_treatment: boolean;
    opstar_score: number | null;
    opstar_score_category: string | null;
  }> | null;
}

interface AnalyticsClientProps {
  initialCases: CaseWithRelations[];
  profile: {
    fullName: string;
    role: string;
    hospitalId: string;
    hospitalName: string;
  };
  hospitals: { id: string; name: string }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED COUNTER HOOK
// ─────────────────────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1200, start = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return value;
}

export default function AnalyticsClient({
  initialCases,
  profile,
  hospitals,
}: AnalyticsClientProps) {
  // Mounting check to prevent hydration mismatch in Recharts
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filter States
  const [filterHospital, setFilterHospital] = useState('');
  const [filterVessel, setFilterVessel] = useState('');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [filterOperator, setFilterOperator] = useState('');
  const [filterZeroContrast, setFilterZeroContrast] = useState(false);

  // Apply security locking on local state for hospital users
  useEffect(() => {
    if (profile.role === 'hospital_user' && profile.hospitalId) {
      setFilterHospital(profile.hospitalId);
    }
  }, [profile]);

  // Extract unique operators (created_by) from cases
  const uniqueOperators = useMemo(() => {
    const ops = new Set<string>();
    initialCases.forEach((c) => {
      if (c.created_by) ops.add(c.created_by);
    });
    return Array.from(ops);
  }, [initialCases]);

  // Filtered cases memoized
  const filteredCases = useMemo(() => {
    return initialCases.filter((c) => {
      // 1. Hospital Filter (locked if hospital_user)
      if (profile.role === 'hospital_user') {
        if (c.hospital_id !== profile.hospitalId) return false;
      } else if (filterHospital && c.hospital_id !== filterHospital) {
        return false;
      }

      // 2. Vaso Diana Filter
      if (filterVessel && c.vaso_diana !== filterVessel) return false;

      // 3. Operator Filter
      if (filterOperator && c.created_by !== filterOperator) return false;

      // 4. Zero-contrast filter
      if (filterZeroContrast) {
        const isZero = c.zero_contrast_completed || c.actual_contrast_ml === 0 || c.contraste_ml === 0;
        if (!isZero) return false;
      }

      // 5. Date Range Filter
      if (filterDateRange !== 'all' && c.created_at) {
        const recordDate = new Date(c.created_at);
        const now = new Date();
        if (filterDateRange === '30days') {
          const limit = new Date();
          limit.setDate(now.getDate() - 30);
          if (recordDate < limit) return false;
        } else if (filterDateRange === '90days') {
          const limit = new Date();
          limit.setDate(now.getDate() - 90);
          if (recordDate < limit) return false;
        } else if (filterDateRange === 'thisyear') {
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          if (recordDate < startOfYear) return false;
        }
      }

      return true;
    });
  }, [initialCases, filterHospital, filterVessel, filterOperator, filterZeroContrast, filterDateRange, profile]);

  // ─────────────────────────────────────────────────────────────────────────────
  // CALCULATE CLINICAL METRICS
  // ─────────────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = filteredCases.length;
    if (total === 0) {
      return {
        total,
        activeCenters: 0,
        zeroContrastCount: 0,
        zeroContrastRate: 0,
        strategyModCount: 0,
        strategyModRate: 0,
        meanOpstarScore: 0,
        meanContrastReduction: 0,
        plaquePrepRate: 0,
        octOptimizationRate: 0,
        contrastActualAvg: 0,
        contrastExpectedAvg: 0,
        triadExpansionRate: 0,
        triadMalappositionRate: 0,
        triadDissectionRate: 0,
        triadCompleteRate: 0,
      };
    }

    // Centros Activos
    const activeCentres = new Set(filteredCases.map((c) => c.hospital_id || c.centro).filter(Boolean)).size;

    // Zero-contrast count
    const zeroContrastCount = filteredCases.filter(
      (c) => c.zero_contrast_completed || c.actual_contrast_ml === 0 || c.contraste_ml === 0
    ).length;
    const zeroContrastRate = Math.round((zeroContrastCount / total) * 100);

    // Strategy modified count
    const strategyModCount = filteredCases.filter(
      (c) => c.modifico_estrategia || c.opstar_strategy_changes?.[0]?.modified_strategy
    ).length;
    const strategyModRate = Math.round((strategyModCount / total) * 100);

    // OPSTAR Score calculation
    const scores = filteredCases
      .map((c) => c.opstar_optimization_results?.[0]?.opstar_score)
      .filter((s): s is number => s !== null && s !== undefined);
    const meanOpstarScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    // Contrast Reduction
    const contrastReductions = filteredCases
      .map((c) => c.contrast_reduction_percent)
      .filter((cr): cr is number => cr !== null && cr !== undefined);
    const meanContrastReduction =
      contrastReductions.length > 0
        ? Math.round(contrastReductions.reduce((a, b) => a + b, 0) / contrastReductions.length)
        : 0;

    // Average expected & actual contrast
    const expectedContrasts = filteredCases
      .map((c) => c.expected_contrast_ml)
      .filter((v): v is number => v !== null && v !== undefined);
    const actualContrasts = filteredCases
      .map((c) => c.actual_contrast_ml ?? c.contraste_ml)
      .filter((v): v is number => v !== null && v !== undefined);

    const contrastExpectedAvg =
      expectedContrasts.length > 0
        ? Math.round((expectedContrasts.reduce((a, b) => a + b, 0) / expectedContrasts.length) * 10) / 10
        : 0;
    const contrastActualAvg =
      actualContrasts.length > 0
        ? Math.round((actualContrasts.reduce((a, b) => a + b, 0) / actualContrasts.length) * 10) / 10
        : 0;

    // Plaque preparation usage
    const plaquePrepCount = filteredCases.filter((c) => {
      const changes = c.opstar_strategy_changes?.[0];
      if (!changes) return false;
      return (
        changes.required_plaque_preparation ||
        changes.used_nc_balloon ||
        changes.used_scoring_cutting_balloon ||
        changes.used_ivl ||
        changes.used_atherectomy
      );
    }).length;
    const plaquePrepRate = Math.round((plaquePrepCount / total) * 100);

    // OCT Optimization Success (score >= 85)
    const optimalScoreCount = scores.filter((s) => s >= 85).length;
    const octOptimizationRate = scores.length > 0 ? Math.round((optimalScoreCount / scores.length) * 100) : 0;

    // Triad Metrics
    const results = filteredCases
      .map((c) => c.opstar_optimization_results?.[0])
      .filter((r): r is NonNullable<CaseWithRelations['opstar_optimization_results']>[0] => r !== null && r !== undefined);

    const triadExpansionCount = results.filter((r) => r.adequate_expansion === 'yes').length;
    const triadExpansionRate = results.length > 0 ? Math.round((triadExpansionCount / results.length) * 100) : 0;

    const triadMalappositionCount = results.filter((r) => r.significant_malapposition === 'yes').length;
    const triadMalappositionRate = results.length > 0 ? Math.round((triadMalappositionCount / results.length) * 100) : 0;

    const triadDissectionCount = results.filter((r) => r.proximal_edge_dissection || r.distal_edge_dissection).length;
    const triadDissectionRate = results.length > 0 ? Math.round((triadDissectionCount / results.length) * 100) : 0;

    // Triad complete: Expansion yes, Malappos no (or na), and no proximal/distal edge dissection
    const triadCompleteCount = results.filter(
      (r) =>
        r.adequate_expansion === 'yes' &&
        r.significant_malapposition !== 'yes' &&
        !r.proximal_edge_dissection &&
        !r.distal_edge_dissection
    ).length;
    const triadCompleteRate = results.length > 0 ? Math.round((triadCompleteCount / results.length) * 100) : 0;

    return {
      total,
      activeCenters: activeCentres,
      zeroContrastCount,
      zeroContrastRate,
      strategyModCount,
      strategyModRate,
      meanOpstarScore,
      meanContrastReduction,
      plaquePrepRate,
      octOptimizationRate,
      contrastActualAvg,
      contrastExpectedAvg,
      triadExpansionRate,
      triadMalappositionRate,
      triadDissectionRate,
      triadCompleteRate,
    };
  }, [filteredCases]);

  // ─────────────────────────────────────────────────────────────────────────────
  // CHARTS DATA PREPARATION
  // ─────────────────────────────────────────────────────────────────────────────
  const chartsData = useMemo(() => {
    // 1. Strategy changes distribution
    const strategyCounts = {
      diameter: 0,
      length: 0,
      landingZone: 0,
      plaquePrep: 0,
      postdilatation: 0,
      edgeTreatment: 0,
    };

    filteredCases.forEach((c) => {
      const changes = c.opstar_strategy_changes?.[0];
      if (changes) {
        if (changes.changed_stent_diameter) strategyCounts.diameter++;
        if (changes.changed_stent_length) strategyCounts.length++;
        if (changes.changed_landing_zone_proximal || changes.changed_landing_zone_distal) strategyCounts.landingZone++;
        if (
          changes.required_plaque_preparation ||
          changes.used_nc_balloon ||
          changes.used_scoring_cutting_balloon ||
          changes.used_ivl ||
          changes.used_atherectomy
        ) {
          strategyCounts.plaquePrep++;
        }
        if (changes.additional_postdilatation) strategyCounts.postdilatation++;
        if (changes.treated_edge || changes.other_change) strategyCounts.edgeTreatment++;
      }
    });

    const strategyData = [
      { name: 'Diámetro Stent', cantidad: strategyCounts.diameter },
      { name: 'Longitud Stent', cantidad: strategyCounts.length },
      { name: 'Zonas Anclaje', cantidad: strategyCounts.landingZone },
      { name: 'Prep. Placa', cantidad: strategyCounts.plaquePrep },
      { name: 'Postdilatación', cantidad: strategyCounts.postdilatation },
      { name: 'Tratam. Borde', cantidad: strategyCounts.edgeTreatment },
    ];

    // 2. AI Findings Prevalence
    let calciumCount = 0;
    let lipidCount = 0;
    let eelCount = 0;
    filteredCases.forEach((c) => {
      if (c.calcio_ia) calciumCount++;
      if (c.placa_lipida_ia) lipidCount++;
      if (c.landing_zone === 'GUIADO_IA_EEL') eelCount++;
    });

    const aiFindingsData = [
      { name: 'Calcio Severo', valor: calciumCount },
      { name: 'Placa Lipídica', valor: lipidCount },
      { name: 'Detección EEL', valor: eelCount },
    ];

    // 3. Purge Techniques Wash Quality
    let salinoBomba = 0;
    let salinoJeringa = 0;
    let mixto = 0;
    let contraste = 0;

    filteredCases.forEach((c) => {
      if (c.tecnica_purga_oct === 'SALINO_BOMBA') salinoBomba++;
      else if (c.tecnica_purga_oct === 'SALINO_50CC') salinoJeringa++;
      else if (c.tecnica_purga_oct === 'MIX_SALINO_CONTRASTE') mixto++;
      else if (c.tecnica_purga_oct === 'CONTRASTE_PURO') contraste++;
    });

    const washQualityData = [
      { name: 'Excelente (Salino Bomba)', value: salinoBomba, color: '#22d3ee' },
      { name: 'Aceptable (Jeringa Salino)', value: salinoJeringa, color: '#10b981' },
      { name: 'Mixto (Salino+Contraste)', value: mixto, color: '#f59e0b' },
      { name: 'Contraste Puro', value: contraste, color: '#f87171' },
    ].filter((d) => d.value > 0);

    // 4. Temporal recruitment and learning curve (chronological order)
    const sortedCases = [...filteredCases].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const temporalData = sortedCases.map((c, index) => {
      const date = new Date(c.created_at);
      const label = date.toLocaleDateString('es-ES', { month: 'short', day: '2-digit' });
      const opstarScore = c.opstar_optimization_results?.[0]?.opstar_score ?? null;

      // Moving average for learning curve (window size = 5)
      const prevScores = sortedCases
        .slice(Math.max(0, index - 4), index + 1)
        .map((x) => x.opstar_optimization_results?.[0]?.opstar_score)
        .filter((s): s is number => s !== null && s !== undefined);
      const learningCurveAvg =
        prevScores.length > 0 ? Math.round(prevScores.reduce((a, b) => a + b, 0) / prevScores.length) : null;

      return {
        idPaciente: c.id_paciente,
        fecha: label,
        casoNum: index + 1,
        esperado: c.expected_contrast_ml || 0,
        real: c.actual_contrast_ml ?? c.contraste_ml ?? 0,
        score: opstarScore,
        curvaAprendizaje: learningCurveAvg,
      };
    });

    return {
      strategyData,
      aiFindingsData,
      washQualityData,
      temporalData,
    };
  }, [filteredCases]);

  // ─────────────────────────────────────────────────────────────────────────────
  // CENTER PERFORMANCE CALCULATION
  // ─────────────────────────────────────────────────────────────────────────────
  const centerPerformance = useMemo(() => {
    // Map hospitals by id
    const hospitalMap: Record<string, { name: string; cases: CaseWithRelations[] }> = {};

    initialCases.forEach((c) => {
      const hId = c.hospital_id || 'unassigned';
      const hName = c.hospitals?.name || c.centro || 'Sin asignar';
      if (!hospitalMap[hId]) {
        hospitalMap[hId] = { name: hName, cases: [] };
      }
      hospitalMap[hId].cases.push(c);
    });

    return Object.entries(hospitalMap).map(([id, data]) => {
      const total = data.cases.length;
      const zeroContrastCount = data.cases.filter(
        (c) => c.zero_contrast_completed || c.actual_contrast_ml === 0 || c.contraste_ml === 0
      ).length;
      const zeroContrastRate = total > 0 ? Math.round((zeroContrastCount / total) * 100) : 0;

      const strategyModCount = data.cases.filter(
        (c) => c.modifico_estrategia || c.opstar_strategy_changes?.[0]?.modified_strategy
      ).length;
      const strategyModRate = total > 0 ? Math.round((strategyModCount / total) * 100) : 0;

      const scores = data.cases
        .map((c) => c.opstar_optimization_results?.[0]?.opstar_score)
        .filter((s): s is number => s !== null && s !== undefined);
      const meanScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      const actualContrasts = data.cases
        .map((c) => c.actual_contrast_ml ?? c.contraste_ml)
        .filter((v): v is number => v !== null && v !== undefined);
      const meanContrast =
        actualContrasts.length > 0 ? Math.round(actualContrasts.reduce((a, b) => a + b, 0) / actualContrasts.length) : 0;

      return {
        id,
        nombre: data.name,
        casos: total,
        opstarScore: meanScore,
        zeroContrastRate,
        contrastUsed: meanContrast,
        strategyModRate,
      };
    });
  }, [initialCases]);

  // ─────────────────────────────────────────────────────────────────────────────
  // QUALITY AUDIT / CONTROL STATS
  // ─────────────────────────────────────────────────────────────────────────────
  const auditWarnings = useMemo(() => {
    const warnings: Array<{
      id: string;
      idPaciente: string;
      centro: string;
      tipo: 'warning' | 'danger' | 'info';
      mensaje: string;
    }> = [];

    filteredCases.forEach((c) => {
      const opt = c.opstar_optimization_results?.[0];
      const hName = c.hospitals?.name || c.centro || 'Sin Centro';

      // 1. Incomplete cases
      if (!opt) {
        warnings.push({
          id: `${c.id}-incomplete`,
          idPaciente: c.id_paciente,
          centro: hName,
          tipo: 'info',
          mensaje: 'Ficha eCRF incompleta (Falta módulo de optimización post-stent).',
        });
        return;
      }

      // 2. High contrast values (outlier > 150ml)
      const contrast = c.actual_contrast_ml ?? c.contraste_ml;
      if (contrast !== null && contrast > 120) {
        warnings.push({
          id: `${c.id}-contrast-outlier`,
          idPaciente: c.id_paciente,
          centro: hName,
          tipo: 'warning',
          mensaje: `Consumo elevado de contraste real: ${contrast} mL.`,
        });
      }

      // 3. FFR-OCT low but no strategy change
      if (c.ffr_oct !== null && c.ffr_oct < 0.75 && !c.modifico_estrategia) {
        warnings.push({
          id: `${c.id}-ffr-nochange`,
          idPaciente: c.id_paciente,
          centro: hName,
          tipo: 'warning',
          mensaje: `FFR-OCT patológico (${c.ffr_oct}) sin cambio de estrategia registrado.`,
        });
      }

      // 4. Low OCT expansion (< 70%)
      if (opt.stent_expansion_percent !== null && opt.stent_expansion_percent < 70) {
        warnings.push({
          id: `${c.id}-low-expansion`,
          idPaciente: c.id_paciente,
          centro: hName,
          tipo: 'danger',
          mensaje: `Expansión del stent crítica por OCT: ${opt.stent_expansion_percent}%.`,
        });
      }

      // 5. Significant edge dissection untreated
      if ((opt.proximal_edge_dissection || opt.distal_edge_dissection) && !opt.requires_edge_treatment) {
        warnings.push({
          id: `${c.id}-untreated-dissection`,
          idPaciente: c.id_paciente,
          centro: hName,
          tipo: 'danger',
          mensaje: 'Disección de bordes identificada por OCT pero marcada como sin tratamiento requerido.',
        });
      }
    });

    return warnings;
  }, [filteredCases]);

  // ─────────────────────────────────────────────────────────────────────────────
  // DATA EXPORTER LOGIC
  // ─────────────────────────────────────────────────────────────────────────────
  const exportCSV = (type: 'all' | 'excel' | 'dataset') => {
    // Columns mapping
    const headers = [
      'ID Registro',
      'ID Paciente',
      'Hospital',
      'Vaso Diana',
      'Técnica Purga OCT',
      'FFR-OCT',
      'Calcio Severo (IA)',
      'Placa Lipídica (IA)',
      'Arco Lipídico Estimado',
      'Landing Zone Método',
      'Diámetro Referencia',
      'Modificó Estrategia',
      'Contraste Esperado (mL)',
      'Contraste Real Usado (mL)',
      'Reducción Contraste (%)',
      'Zero-Contrast Éxito',
      'MSA Final (mm2)',
      'Expansión Stent (%)',
      'Expansión Adecuada',
      'Malaposición Struts',
      'Disección Bordes',
      'Score OPSTAR',
      'Score Categoría',
    ];

    const rows = filteredCases.map((c) => {
      const changes = c.opstar_strategy_changes?.[0];
      const opt = c.opstar_optimization_results?.[0];
      return [
        c.id,
        c.id_paciente,
        c.hospitals?.name || c.centro,
        c.vaso_diana,
        c.tecnica_purga_oct,
        c.ffr_oct !== null ? c.ffr_oct : '',
        c.calcio_ia ? 'SI' : 'NO',
        c.placa_lipida_ia ? 'SI' : 'NO',
        c.arco_lipidico_estimado !== null ? c.arco_lipidico_estimado : '',
        c.landing_zone,
        c.diametro !== null ? c.diametro : '',
        c.modifico_estrategia || changes?.modified_strategy ? 'SI' : 'NO',
        c.expected_contrast_ml !== null ? c.expected_contrast_ml : '',
        c.actual_contrast_ml !== null ? c.actual_contrast_ml : (c.contraste_ml !== null ? c.contraste_ml : ''),
        c.contrast_reduction_percent !== null ? c.contrast_reduction_percent : '',
        c.zero_contrast_completed ? 'SI' : 'NO',
        opt?.post_stent_msa_mm2 !== null ? opt?.post_stent_msa_mm2 : '',
        opt?.stent_expansion_percent !== null ? opt?.stent_expansion_percent : '',
        opt?.adequate_expansion === 'yes' ? 'SI' : 'NO',
        opt?.significant_malapposition === 'yes' ? 'SI' : 'NO',
        (opt?.proximal_edge_dissection || opt?.distal_edge_dissection) ? 'SI' : 'NO',
        opt?.opstar_score !== null ? opt?.opstar_score : '',
        opt?.opstar_score_category || '',
      ];
    });

    let filename = `opstar_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
    let separator = ',';

    if (type === 'excel') {
      separator = ';'; // Semicolon is better for auto-parsing in Spanish Excel
      filename = `opstar_analytics_excel_${new Date().toISOString().slice(0, 10)}.csv`;
    } else if (type === 'dataset') {
      filename = `opstar_publication_dataset_${new Date().toISOString().slice(0, 10)}.csv`;
    }

    // CSV format with UTF-8 BOM
    const csvContent =
      '\uFEFF' +
      [headers.join(separator), ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(separator))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to color/label score on dashboard
  const getScoreColorClass = (score: number) => {
    if (score >= 85) return 'text-cyan-400 border-cyan-800/40 bg-cyan-950/60';
    if (score >= 65) return 'text-yellow-400 border-yellow-800/40 bg-yellow-950/60';
    if (score >= 40) return 'text-orange-400 border-orange-850/40 bg-orange-950/60';
    return 'text-red-400 border-red-900/40 bg-red-950/60';
  };

  const getScoreCategoryText = (score: number) => {
    if (score >= 85) return 'Óptimo';
    if (score >= 65) return 'Subóptimo Leve';
    if (score >= 40) return 'Subóptimo Mod.';
    return 'Alto Riesgo';
  };

  const animatedTotalCases = useCountUp(stats.total);
  const animatedActiveCenters = useCountUp(stats.activeCenters);
  const animatedZeroContrastRate = useCountUp(stats.zeroContrastRate);
  const animatedStrategyModRate = useCountUp(stats.strategyModRate);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased font-sans">
      
      {/* Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-xs hover:opacity-90 transition-opacity">
            A
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">ULTREON™ 3.0</span>
              <span className="text-[8px] font-mono font-bold text-slate-500 uppercase">ANALÍTICA CIENTÍFICA</span>
            </div>
            <h1 className="text-base font-bold text-slate-50">OPSTAR-AI Scientific Analytics</h1>
          </div>
        </div>

        {/* User profile & Actions */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-200">{profile.fullName}</p>
            <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
              {profile.role === 'admin' ? 'Administrador' : profile.role === 'monitor' ? 'Monitor' : 'Investigador'} {profile.role === 'hospital_user' && `· ${profile.hospitalName}`}
            </p>
          </div>
          <div className="h-8 w-[1px] bg-slate-800" />
          
          <Link
            href="/dashboard"
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-medium transition-all"
          >
            Volver al Panel
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 p-6 md:p-8 max-w-[1600px] w-full mx-auto space-y-6">

        {/* ── HERO ANALYTICS HEADER ── */}
        <div className="relative bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-[450px] h-[300px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 left-1/4 w-[300px] h-[200px] bg-violet-600/3 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <span className="text-[9px] font-black font-mono tracking-[0.3em] text-cyan-400 uppercase">
                Estadísticas Multicéntricas en Tiempo Real
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-50 tracking-tight">
                OPSTAR-AI Scientific Analytics
              </h2>
              <p className="text-sm text-slate-400 font-light max-w-xl leading-relaxed">
                Visualización de optimizaciones coronarias guiadas por IA y purgas de suero fisiológico para angioplastias complejas (Zero-Contrast PCI).
              </p>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto flex-shrink-0">
              {/* Card Cases */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 min-w-[130px] flex flex-col justify-between">
                <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Casos Totales</span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-100">{animatedTotalCases}</span>
                  <span className="text-[9px] font-mono text-slate-500">PCI</span>
                </div>
              </div>

              {/* Card Active Centers */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 min-w-[130px] flex flex-col justify-between">
                <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Centros Activos</span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-100">{animatedActiveCenters}</span>
                  <span className="text-[9px] font-mono text-slate-500">Centros</span>
                </div>
              </div>

              {/* Card Zero-Contrast */}
              <div className="bg-slate-950/60 border border-emerald-900/30 rounded-2xl p-4 min-w-[130px] flex flex-col justify-between shadow-[0_0_15px_rgba(16,185,129,0.02)]">
                <span className="text-[9px] font-mono text-emerald-450 font-bold uppercase tracking-wider">Zero-Contraste</span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-emerald-400">{animatedZeroContrastRate}%</span>
                </div>
              </div>

              {/* Card Strategy Modification */}
              <div className="bg-slate-950/60 border border-violet-900/30 rounded-2xl p-4 min-w-[130px] flex flex-col justify-between shadow-[0_0_15px_rgba(139,92,246,0.02)]">
                <span className="text-[9px] font-mono text-violet-455 font-bold uppercase tracking-wider">Modific. Estrategia</span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-violet-450">{animatedStrategyModRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FILTER SYSTEM ── */}
        <div className="bg-slate-900 border border-slate-850 rounded-3xl p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          
          {/* Hospital Filter (Disabled/hidden for hospital users) */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Hospital</span>
            {profile.role === 'admin' || profile.role === 'monitor' ? (
              <select
                value={filterHospital}
                onChange={(e) => setFilterHospital(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 text-xs text-slate-300 outline-none cursor-pointer"
              >
                <option value="">Todos los Hospitales</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full px-3 py-2.5 rounded-xl bg-slate-950/50 border border-slate-850 text-xs text-slate-500 font-mono font-medium">
                {profile.hospitalName} (Fijado)
              </div>
            )}
          </div>

          {/* Vessel (Vaso Diana) */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Vaso Diana</span>
            <select
              value={filterVessel}
              onChange={(e) => setFilterVessel(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 text-xs text-slate-300 outline-none cursor-pointer"
            >
              <option value="">Todos los vasos</option>
              <option value="TCI">TCI (Tronco Común)</option>
              <option value="LAD">DA (Descendente Anterior)</option>
              <option value="LCx">CX (Circunfleja)</option>
              <option value="RCA">CD (Coronaria Derecha)</option>
            </select>
          </div>

          {/* Date Range Selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Periodo de Auditoría</span>
            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 text-xs text-slate-300 outline-none cursor-pointer"
            >
              <option value="all">Todo el Historial</option>
              <option value="30days">Últimos 30 días</option>
              <option value="90days">Últimos 90 días</option>
              <option value="thisyear">Año 2026</option>
            </select>
          </div>

          {/* Operator Selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Operador</span>
            <select
              value={filterOperator}
              onChange={(e) => setFilterOperator(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 text-xs text-slate-300 outline-none cursor-pointer"
            >
              <option value="">Todos los operadores</option>
              {uniqueOperators.map((opId, idx) => (
                <option key={opId} value={opId}>
                  Operador {idx + 1} ({opId.slice(0, 5)}...)
                </option>
              ))}
            </select>
          </div>

          {/* Zero-Contrast Checkbox */}
          <div className="flex items-center gap-3 h-full pt-4 pl-2">
            <input
              type="checkbox"
              id="zeroContrastFilter"
              checked={filterZeroContrast}
              onChange={(e) => setFilterZeroContrast(e.target.checked)}
              className="h-4.5 w-4.5 rounded bg-slate-950 border border-slate-800 accent-emerald-500 cursor-pointer"
            />
            <label htmlFor="zeroContrastFilter" className="text-xs font-bold font-mono text-slate-400 cursor-pointer select-none">
              Solo Zero-Contraste
            </label>
          </div>
        </div>

        {/* ── PRIMARY KPI SECTION ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          
          {/* KPI 1: Casos */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between min-h-[110px]">
            <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Casos Válidos</span>
            <span className="text-3xl font-black text-slate-100 mt-2">{stats.total}</span>
            <span className="text-[9px] font-mono text-slate-500">Muestra analizada</span>
          </div>

          {/* KPI 2: Mean OPSTAR Score */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between min-h-[110px]">
            <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Score OPSTAR Medio</span>
            <span className="text-3xl font-black text-cyan-400 mt-2">{stats.meanOpstarScore} <span className="text-xs text-slate-500 font-normal">/100</span></span>
            <span className="text-[9px] font-mono text-cyan-500">Cat: {getScoreCategoryText(stats.meanOpstarScore)}</span>
          </div>

          {/* KPI 3: Strategy Modification Rate */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between min-h-[110px]">
            <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Modific. Estrategia</span>
            <span className="text-3xl font-black text-violet-400 mt-2">{stats.strategyModRate}%</span>
            <span className="text-[9px] font-mono text-violet-500">Inducido por OCT</span>
          </div>

          {/* KPI 4: Zero-Contrast Success */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between min-h-[110px]">
            <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Tasa Zero-Contraste</span>
            <span className="text-3xl font-black text-emerald-400 mt-2">{stats.zeroContrastRate}%</span>
            <span className="text-[9px] font-mono text-emerald-500">Éxito procedimental</span>
          </div>

          {/* KPI 5: Mean Contrast Reduction */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between min-h-[110px]">
            <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Reducción Contraste</span>
            <span className="text-3xl font-black text-sky-400 mt-2">{stats.meanContrastReduction}%</span>
            <span className="text-[9px] font-mono text-sky-500">Vs Estimado por Angio</span>
          </div>

          {/* KPI 6: Plaque Preparation */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between min-h-[110px]">
            <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Prep. de Placa</span>
            <span className="text-3xl font-black text-amber-500 mt-2">{stats.plaquePrepRate}%</span>
            <span className="text-[9px] font-mono text-amber-500">IVL / Scoring / Aterect.</span>
          </div>

          {/* KPI 7: OCT Success */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between min-h-[110px]">
            <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Éxito de Optimización</span>
            <span className="text-3xl font-black text-rose-500 mt-2">{stats.octOptimizationRate}%</span>
            <span className="text-[9px] font-mono text-rose-500">Score Final ≥ 85</span>
          </div>

        </div>

        {/* ── CHARTS SECTION 1: AI IMPACT & STRATEGY ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Strategy Modification Chart */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 lg:col-span-2">
            <div className="mb-4">
              <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Métrica de Impacto IA</span>
              <h3 className="text-sm font-bold text-slate-200 mt-1">Distribución de Modificaciones en la Estrategia PCI</h3>
              <p className="text-[10px] text-slate-550 mt-0.5">Tipos de cambios procedimentales guiados por el análisis automatizado de OCT de ULTREON™.</p>
            </div>
            <div className="w-full h-[240px] flex items-center justify-center">
              {isMounted && filteredCases.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartsData.strategyData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={9} className="font-mono font-bold" tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={9} className="font-mono" tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      labelStyle={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#22d3ee', fontSize: '12px' }}
                    />
                    <Bar dataKey="cantidad" name="Casos modificados" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                      {chartsData.strategyData.map((entry, index) => {
                        const colors = ['#a78bfa', '#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#10b981'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-slate-500 font-mono">Sin datos suficientes</span>
              )}
            </div>
          </div>

          {/* AI Findings */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6">
            <div className="mb-4">
              <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Hallazgos Coronarios</span>
              <h3 className="text-sm font-bold text-slate-200 mt-1">Detecciones de IA en Landing Zones</h3>
              <p className="text-[10px] text-slate-550 mt-0.5">Prevalencia acumulada de calcificaciones graves y placas lipídicas.</p>
            </div>
            <div className="w-full h-[240px] flex items-center justify-center">
              {isMounted && filteredCases.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartsData.aiFindingsData} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={9} className="font-mono" tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={9} className="font-mono font-bold" tickLine={false} width={80} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      itemStyle={{ color: '#22d3ee', fontSize: '12px' }}
                    />
                    <Bar dataKey="valor" name="Casos detectados" fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={20}>
                      <Cell fill="#06b6d4" />
                      <Cell fill="#3b82f6" />
                      <Cell fill="#10b981" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-slate-500 font-mono">Sin datos suficientes</span>
              )}
            </div>
          </div>

        </div>

        {/* ── CHARTS SECTION 2: ZERO-CONTRAST & TRIAD ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Contrast Reduction Trend */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 lg:col-span-2">
            <div className="mb-4 flex justify-between items-start gap-4">
              <div>
                <span className="text-[9px] font-mono text-emerald-450 font-bold uppercase tracking-wider">Seguimiento de Contraste</span>
                <h3 className="text-sm font-bold text-slate-200 mt-1">Evolución de Volumen de Contraste: Esperado vs Real</h3>
                <p className="text-[10px] text-slate-550 mt-0.5">Comparativa del volumen angiográfico de referencia frente al consumo real final purgado con suero.</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-mono">Contraste Promedio</span>
                <div className="text-sm font-bold text-slate-200">{stats.contrastActualAvg} mL <span className="text-[10px] text-slate-500 font-normal">/ {stats.contrastExpectedAvg} mL</span></div>
              </div>
            </div>
            <div className="w-full h-[240px] flex items-center justify-center">
              {isMounted && chartsData.temporalData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartsData.temporalData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorEsperado" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="fecha" stroke="#64748b" fontSize={9} className="font-mono" tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={9} className="font-mono" tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      labelStyle={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Legend verticalAlign="top" height={36} iconSize={8} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                    <Area type="monotone" dataKey="esperado" name="Contraste Estimado Angio" stroke="#3b82f6" strokeWidth={1.5} fillOpacity={1} fill="url(#colorEsperado)" />
                    <Area type="monotone" dataKey="real" name="Contraste Real Purgado" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorReal)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-slate-500 font-mono">Sin datos suficientes</span>
              )}
            </div>
          </div>

          {/* Purge Quality Distribution */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="mb-4">
                <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Calidad de Imagen</span>
                <h3 className="text-sm font-bold text-slate-200 mt-1">Distribución de Técnica de Purga OCT</h3>
                <p className="text-[10px] text-slate-550 mt-0.5">Visualización del aclarado y calidad diagnóstica del lavado.</p>
              </div>
              <div className="w-full h-[180px] flex items-center justify-center relative">
                {isMounted && chartsData.washQualityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartsData.washQualityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {chartsData.washQualityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                        itemStyle={{ fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <span className="text-xs text-slate-500 font-mono">Sin datos de purga</span>
                )}
                {/* Overlay Counter inside Donut */}
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-slate-450 uppercase font-mono tracking-widest">Salino</span>
                  <span className="text-xl font-black text-slate-200 mt-0.5">
                    {Math.round(
                      ((filteredCases.filter(
                        (c) => c.tecnica_purga_oct === 'SALINO_BOMBA' || c.tecnica_purga_oct === 'SALINO_50CC'
                      ).length) /
                        (filteredCases.length || 1)) *
                        100
                    )}%
                  </span>
                </div>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="space-y-1.5 mt-4 border-t border-slate-850/60 pt-3">
              {chartsData.washQualityData.map((item) => (
                <div key={item.name} className="flex justify-between items-center text-[10px] font-mono">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-400">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-200">{item.value} ({Math.round((item.value / stats.total) * 100)}%)</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── TRIADA ULTREON COMPONENT ── */}
        <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div>
              <span className="text-[9px] font-black font-mono tracking-[0.3em] text-cyan-400 uppercase">
                Análisis de Optimización Post-Stent
              </span>
              <h3 className="text-lg font-black text-slate-50 tracking-tight mt-1">La Tríada ULTREON™ en Tiempo Real</h3>
              <p className="text-xs text-slate-450 mt-0.5">
                Cumplimiento combinado de los tres criterios clínicos del algoritmo de optimización inteligente.
              </p>
            </div>
            
            <div className="flex items-center gap-4 bg-slate-950/60 border border-slate-800 px-5 py-3 rounded-2xl">
              <div>
                <span className="text-[9px] font-bold font-mono text-slate-500 uppercase tracking-wider block">Tríada Completa</span>
                <span className="text-xs font-semibold text-slate-350">Éxito en 3 de 3 pilares</span>
              </div>
              <div className="h-10 w-[1px] bg-slate-850" />
              <span className="text-3xl font-black text-cyan-400 font-mono">{stats.triadCompleteRate}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Pilar 1: Expansion */}
            <div className="bg-slate-950/40 border border-slate-850/60 rounded-2xl p-5 flex flex-col justify-between min-h-[160px]">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[8px] font-mono text-cyan-400 border border-cyan-900/40 bg-cyan-950/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Pilar I</span>
                  <span className="text-2xl">📐</span>
                </div>
                <h4 className="text-sm font-bold text-slate-200 mt-3">Expansión del Stent</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                  Consecución de un Área Mínima del Stent (MSA) ≥ 80% comparado con el área de referencia.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-900/60 flex justify-between items-baseline">
                <span className="text-[10px] font-mono text-slate-550">Tasa de éxito</span>
                <span className="text-xl font-bold text-cyan-400 font-mono">{stats.triadExpansionRate}%</span>
              </div>
            </div>

            {/* Pilar 2: Malapposition */}
            <div className="bg-slate-950/40 border border-slate-850/60 rounded-2xl p-5 flex flex-col justify-between min-h-[160px]">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[8px] font-mono text-violet-400 border border-violet-900/40 bg-violet-950/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Pilar II</span>
                  <span className="text-2xl">🔭</span>
                </div>
                <h4 className="text-sm font-bold text-slate-200 mt-3">Ausencia de Malaposición</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                  Porcentaje de procedimientos que evitan la malaposición significativa de struts (&gt;0.4 mm).
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-900/60 flex justify-between items-baseline">
                <span className="text-[10px] font-mono text-slate-550">Sin malaposición</span>
                <span className="text-xl font-bold text-violet-400 font-mono">{100 - stats.triadMalappositionRate}%</span>
              </div>
            </div>

            {/* Pilar 3: Edge Integrity */}
            <div className="bg-slate-950/40 border border-slate-850/60 rounded-2xl p-5 flex flex-col justify-between min-h-[160px]">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[8px] font-mono text-emerald-400 border border-emerald-900/40 bg-emerald-950/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Pilar III</span>
                  <span className="text-2xl">🩺</span>
                </div>
                <h4 className="text-sm font-bold text-slate-200 mt-3">Integridad de Bordes</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                  Procedimientos que finalizan sin presentar disecciones de bordes proximales o distales relevantes.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-900/60 flex justify-between items-baseline">
                <span className="text-[10px] font-mono text-slate-550">Bordes intactos</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">{100 - stats.triadDissectionRate}%</span>
              </div>
            </div>

          </div>
        </div>

        {/* ── CHARTS SECTION 3: TEMPORAL ANALYTICS & LEARNING CURVE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Learning curve chart */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6">
            <div className="mb-4">
              <span className="text-[9px] font-mono text-cyan-405 font-bold uppercase tracking-wider">Optimización Procedural</span>
              <h3 className="text-sm font-bold text-slate-200 mt-1">Curva de Aprendizaje: Evolución de Puntuación OPSTAR</h3>
              <p className="text-[10px] text-slate-550 mt-0.5">Tendencia cronológica del score OPSTAR (promedio móvil de 5 casos) reflejando la curva de aprendizaje técnico de los operadores.</p>
            </div>
            <div className="w-full h-[240px] flex items-center justify-center">
              {isMounted && chartsData.temporalData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartsData.temporalData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="casoNum" stroke="#64748b" fontSize={9} className="font-mono" tickLine={false} label={{ value: 'Caso Clínico (Nº)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 9 }} />
                    <YAxis stroke="#64748b" fontSize={9} className="font-mono" tickLine={false} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      labelStyle={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Legend verticalAlign="top" height={36} iconSize={8} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                    <Line type="monotone" dataKey="score" name="Score OPSTAR del Caso" stroke="#334155" strokeWidth={1} dot={{ r: 3, fill: '#3b82f6' }} />
                    <Line type="monotone" dataKey="curvaAprendizaje" name="Tendencia (Promedio móvil)" stroke="#22d3ee" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-slate-500 font-mono">Sin datos cronológicos suficientes</span>
              )}
            </div>
          </div>

          {/* Center comparison chart (Only relevant if Admin/Monitor) */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6">
            <div className="mb-4">
              <span className="text-[9px] font-mono text-slate-505 font-bold uppercase tracking-wider">Comparativa Inter-Centros</span>
              <h3 className="text-sm font-bold text-slate-200 mt-1">Score OPSTAR vs % Zero-Contraste por Hospital</h3>
              <p className="text-[10px] text-slate-550 mt-0.5">Análisis multicéntrico de la calidad de la optimización por OCT y la tasa de éxito de infusión salina.</p>
            </div>
            <div className="w-full h-[240px] flex items-center justify-center">
              {isMounted && centerPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={centerPerformance} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="nombre" stroke="#64748b" fontSize={9} className="font-mono" tickLine={false} tickFormatter={(v) => v.slice(0, 10) + '...'} />
                    <YAxis stroke="#64748b" fontSize={9} className="font-mono" tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      labelStyle={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Legend verticalAlign="top" height={36} iconSize={8} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                    <Bar dataKey="opstarScore" name="Score OPSTAR Medio" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="zeroContrastRate" name="% Zero-Contraste" fill="#10b981" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-slate-500 font-mono">Sin datos multicéntricos suficientes</span>
              )}
            </div>
          </div>

        </div>

        {/* ── CENTER PERFORMANCE MATRIX ── */}
        {(profile.role === 'admin' || profile.role === 'monitor') && (
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6">
            <div className="mb-4">
              <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Mesa de Control Multicéntrica</span>
              <h3 className="text-sm font-bold text-slate-200 mt-1">Rendimiento Comparativo por Centro de Reclutamiento</h3>
              <p className="text-[10px] text-slate-550 mt-0.5">Indicadores clave desglosados para auditar la adherencia al protocolo en los 6 centros.</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-550 font-bold tracking-wider">
                    <th className="p-3 pl-4">Centro Hospitalario</th>
                    <th className="p-3 text-center">Casos Registrados</th>
                    <th className="p-3 text-center">Score OPSTAR Promedio</th>
                    <th className="p-3 text-center">Tasa Zero-Contraste</th>
                    <th className="p-3 text-center">Contraste Promedio</th>
                    <th className="p-3 text-center">Tasa Cambios Estrategia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/50">
                  {centerPerformance.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-950/30 transition-colors">
                      <td className="p-3 pl-4 font-bold text-slate-300">{c.nombre}</td>
                      <td className="p-3 text-center text-slate-400 font-bold">{c.casos}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold border text-[10px] ${getScoreColorClass(c.opstarScore)}`}>
                          {c.opstarScore}
                        </span>
                      </td>
                      <td className="p-3 text-center text-emerald-400 font-bold">{c.zeroContrastRate}%</td>
                      <td className="p-3 text-center text-slate-400">{c.contrastUsed} mL</td>
                      <td className="p-3 text-center text-violet-400 font-bold">{c.strategyModRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── QUALITY CONTROL PANEL (AUDIT) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Quality Panel */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="mb-4 flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-mono text-red-405 font-bold uppercase tracking-wider">Auditoría Científica</span>
                  <h3 className="text-sm font-bold text-slate-200 mt-1">Panel de Control de Calidad y Discrepancias</h3>
                  <p className="text-[10px] text-slate-550 mt-0.5">Alertas procedimentales automáticas y valores atípicos clínicos para monitorización del registro.</p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-red-950/55 text-red-400 border border-red-900/40">
                  {auditWarnings.length} Advertencias
                </span>
              </div>

              {/* Alertas scrollbox */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {auditWarnings.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl bg-slate-950/10">
                    ✅ No se han detectado inconsistencias o valores atípicos en el dataset activo.
                  </div>
                ) : (
                  auditWarnings.map((warn) => (
                    <div
                      key={warn.id}
                      className={`p-3 rounded-xl border text-xs flex justify-between items-center gap-3 ${
                        warn.tipo === 'danger'
                          ? 'border-red-950 bg-red-950/15 text-red-400'
                          : warn.tipo === 'warning'
                          ? 'border-yellow-950/50 bg-yellow-950/15 text-yellow-400'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-base leading-none">
                          {warn.tipo === 'danger' ? '🚨' : warn.tipo === 'warning' ? '⚠️' : 'ℹ️'}
                        </span>
                        <div>
                          <p className="font-bold">{warn.idPaciente} <span className="font-normal opacity-70">({warn.centro})</span></p>
                          <p className="text-[10px] opacity-90 mt-0.5">{warn.mensaje}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quality Summary Row */}
            <div className="mt-4 pt-3 border-t border-slate-850/60 grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-950/30 p-2.5 rounded-xl border border-slate-850">
                <span className="text-[8px] font-mono text-slate-500 uppercase block">Calidad Purgado</span>
                <span className="text-sm font-bold text-slate-200">
                  {Math.round(
                    ((filteredCases.filter(
                      (c) => c.tecnica_purga_oct === 'SALINO_BOMBA' || c.tecnica_purga_oct === 'SALINO_50CC'
                    ).length) /
                      (filteredCases.length || 1)) *
                      100
                  )}%
                </span>
              </div>
              <div className="bg-slate-950/30 p-2.5 rounded-xl border border-slate-850">
                <span className="text-[8px] font-mono text-slate-500 uppercase block">Fichas Completas</span>
                <span className="text-sm font-bold text-slate-200">
                  {Math.round(
                    ((filteredCases.filter((c) => c.opstar_optimization_results?.[0]).length) /
                      (filteredCases.length || 1)) *
                      100
                  )}%
                </span>
              </div>
              <div className="bg-slate-950/30 p-2.5 rounded-xl border border-slate-850">
                <span className="text-[8px] font-mono text-slate-500 uppercase block">Expansiones OK</span>
                <span className="text-sm font-bold text-slate-200">
                  {Math.round(
                    ((filteredCases.filter(
                      (c) => c.opstar_optimization_results?.[0]?.adequate_expansion === 'yes'
                    ).length) /
                      (filteredCases.length || 1)) *
                      100
                  )}%
                </span>
              </div>
            </div>

          </div>

          {/* Export Section */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <span className="text-[9px] font-mono text-cyan-405 font-bold uppercase tracking-wider">Exportación Científica</span>
              <h3 className="text-sm font-bold text-slate-200 mt-1">Exportar Base de Datos del Registro</h3>
              <p className="text-[10px] text-slate-550 mt-0.5">Descarga la información filtrada lista para análisis estadístico secundario o importación en herramientas analíticas.</p>
              
              <div className="space-y-2 mt-6">
                <button
                  onClick={() => exportCSV('excel')}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs transition-colors cursor-pointer group"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">📊</span>
                    Exportar para Excel (Separador ;)
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">↓</span>
                </button>

                <button
                  onClick={() => exportCSV('all')}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs transition-colors cursor-pointer group"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">📄</span>
                    Exportar CSV Estándar (Separador ,)
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">↓</span>
                </button>

                <button
                  onClick={() => exportCSV('dataset')}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-800/40 text-cyan-400 font-mono text-xs font-bold transition-colors cursor-pointer group"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">🎓</span>
                    Dataset Tidy para Publicación (R/SPSS)
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">↓</span>
                </button>
              </div>
            </div>

            <div className="text-[9px] font-mono text-slate-500 mt-4 leading-normal">
              La exportación respeta la anonimización de datos de los pacientes conforme a la RGPD.
            </div>
          </div>

        </div>

        {/* ── FUTURE AI INSIGHTS PLACEHOLDER ── */}
        <div className="bg-slate-900 border border-dashed border-slate-800 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/[0.015] rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-2.5 mb-5">
            <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-xs font-black font-mono tracking-widest text-cyan-400 uppercase">Predictive AI Insights</span>
            <span className="text-[8px] font-bold font-mono px-2 py-0.5 rounded-md bg-cyan-950/50 text-cyan-400 border border-cyan-800/40 uppercase ml-2">Future AI Module</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Future predictor 1 */}
            <div className="p-4 rounded-2xl bg-slate-950/30 border border-slate-850 opacity-60 hover:opacity-80 transition-opacity">
              <span className="text-xl">🧠</span>
              <h4 className="text-xs font-bold text-slate-300 mt-2 font-mono uppercase tracking-wider">Predicción de Subexpansión</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                Análisis predictivo de subexpansión del stent utilizando el ángulo de calcificación e índice de atenuación pre-PCI.
              </p>
              <div className="mt-3 text-[8px] font-mono text-cyan-500/80">DISPONIBLE EN V4.0</div>
            </div>

            {/* Future predictor 2 */}
            <div className="p-4 rounded-2xl bg-slate-950/30 border border-slate-850 opacity-60 hover:opacity-80 transition-opacity">
              <span className="text-xl">⚡</span>
              <h4 className="text-xs font-bold text-slate-300 mt-2 font-mono uppercase tracking-wider">Severidad de Calcio pre-PCI</h4>
              <p className="text-[10px] text-slate-550 leading-relaxed mt-1">
                Estimador automático del espesor de la placa calcificada profunda para predecir fallo en la dilatación y requerimiento de litotricia.
              </p>
              <div className="mt-3 text-[8px] font-mono text-cyan-500/80">DISPONIBLE EN V4.0</div>
            </div>

            {/* Future predictor 3 */}
            <div className="p-4 rounded-2xl bg-slate-950/30 border border-slate-850 opacity-60 hover:opacity-80 transition-opacity">
              <span className="text-xl">📐</span>
              <h4 className="text-xs font-bold text-slate-300 mt-2 font-mono uppercase tracking-wider">Sugerencias de Optimización</h4>
              <p className="text-[10px] text-slate-550 leading-relaxed mt-1">
                Recomendaciones automáticas en tiempo real sobre la presión óptima de inflado postdilatación basándose en el FFR-OCT distal.
              </p>
              <div className="mt-3 text-[8px] font-mono text-cyan-500/80">DISPONIBLE EN V4.0</div>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}
