export const executiveDemoData = {
  hospitals: [
    { id: 'demo-hosp-1', name: 'Hospital Clínico Univ.', short_name: 'HCUV', is_active: true },
    { id: 'demo-hosp-2', name: 'Hospital Univ. La Fe', short_name: 'La Fe', is_active: true },
    { id: 'demo-hosp-3', name: 'Hospital General Univ. Alicante', short_name: 'HGUA', is_active: true },
    { id: 'demo-hosp-4', name: 'Hospital General Univ. Castellón', short_name: 'HGUCS', is_active: true }
  ],
  investigators: [
    { id: 'op-1', full_name: 'Dr. Demo Operador 1', hospital_id: 'demo-hosp-1' },
    { id: 'op-2', full_name: 'Dra. Demo Operadora 2', hospital_id: 'demo-hosp-2' },
    { id: 'op-3', full_name: 'Dr. Demo Operador 3', hospital_id: 'demo-hosp-3' }
  ],
  cases: Array.from({ length: 420 }).map((_, i) => ({
    id: `case-${i}`,
    hospital_id: i % 4 === 0 ? 'demo-hosp-1' : i % 3 === 0 ? 'demo-hosp-2' : 'demo-hosp-3',
    operator_id: i % 2 === 0 ? 'op-1' : 'op-2',
    created_at: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
    zero_contrast_completed: Math.random() > 0.25, // 75% adoption
    modifico_estrategia: Math.random() > 0.62, // 38% strategy changes
    calcio: Math.random() > 0.7 ? 'Severo' : 'Moderado',
    stent_length: 30 + Math.floor(Math.random() * 15),
    mla_post: 5 + (Math.random() * 3)
  })),
  variables: {
    price_cv: 1200,
    price_murcia: 1064.80,
    cost_current: 700,
    cost_future: 750,
    vat: 21,
    annual_goal: 1788,
    forecast_no_action: 1300,
    gap: 488
  }
};
