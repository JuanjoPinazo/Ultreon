export const clinicalDemoCase = {
  patient: {
    code: 'PAC-9912',
    hospital: 'Hospital Clínico Demo',
    operator: 'Dr. Vicente Bodí'
  },
  procedure: {
    segment: 'LAD Proximal',
    saline_protocol: '100%',
    syringe: 'Luer-Lock 10/20 mL',
    pullback: 'Fast Pullback 1 segundo',
    contrast_ml: 0,
    wash_quality: 'Excelente'
  },
  oct_images: {
    pre_oct: '/demo/oct/pre-oct/case-001-pre-oct.png',
    ultreon: '/demo/oct/ultreon/case-001-ultreon.png',
    strategy_change: '/demo/oct/strategy-change/case-001-strategy.png',
    post_oct: '/demo/oct/post-oct/case-001-post-oct.png',
    angiography: '/demo/oct/angiography/case-001-angio.png'
  },
  ultreon_findings: {
    calcium: 'Arco >180° detectado',
    eel: 'Identificada en 360°',
    mla: '2.4 mm²',
    proximal_ref: '3.5 mm',
    distal_ref: '3.0 mm'
  },
  strategy_change: {
    initial_plan: {
      diameter: '3.0 mm',
      length: '33 mm',
      prep: 'Predilatación estándar'
    },
    modified_plan: {
      diameter: '3.5 mm',
      length: '38 mm',
      prep: 'Rotablator (Calcio Severo)'
    }
  },
  final_result: {
    score: 92,
    message: 'Procedimiento finalizado con éxito bajo protocolo Zero-Contrast. Resumen científico guardado.'
  }
};
