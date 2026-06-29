export interface CoronaryPath {
  id: string;
  d: string;
  strokeWidth: number;
}

// Coordinate system: 0 0 800 800
// Aortic root roughly at 400, 200
// LM originates around 420, 250, goes left and down
// RCA originates around 380, 250, goes right and down

export const CORONARY_GEOMETRY: Record<string, CoronaryPath> = {
  // TCI (Left Main)
  'lm_ostial': { id: 'lm_ostial', d: 'M420,250 C440,250 450,260 460,270', strokeWidth: 14 },
  'lm_body': { id: 'lm_body', d: 'M460,270 C470,280 480,290 490,295', strokeWidth: 14 },
  'lm_distal': { id: 'lm_distal', d: 'M490,295 C500,300 510,305 515,310', strokeWidth: 14 },
  
  // DA (LAD) - goes down the middle/left
  'lad_ostial': { id: 'lad_ostial', d: 'M515,310 C510,330 505,350 500,370', strokeWidth: 12 },
  'lad_proximal': { id: 'lad_proximal', d: 'M500,370 C490,410 475,450 460,490', strokeWidth: 11 },
  'lad_mid': { id: 'lad_mid', d: 'M460,490 C440,540 420,580 410,630', strokeWidth: 9 },
  'lad_distal': { id: 'lad_distal', d: 'M410,630 C400,680 395,720 390,760', strokeWidth: 7 },
  
  // Diagonals (branch off LAD to the right/down)
  'd1': { id: 'd1', d: 'M495,390 C530,420 550,450 560,490', strokeWidth: 7 },
  'd2': { id: 'd2', d: 'M455,500 C490,530 510,570 520,610', strokeWidth: 6 },
  'd3': { id: 'd3', d: 'M425,560 C460,590 480,630 490,670', strokeWidth: 5 },

  // CX (LCX) - goes far left (anatomical left, so right on screen)
  'lcx_ostial': { id: 'lcx_ostial', d: 'M515,310 C535,305 555,305 575,310', strokeWidth: 11 },
  'lcx_proximal': { id: 'lcx_proximal', d: 'M575,310 C605,315 635,330 655,360', strokeWidth: 10 },
  'lcx_distal': { id: 'lcx_distal', d: 'M655,360 C680,395 690,440 680,480', strokeWidth: 8 },

  // Marginals (OM)
  'om1': { id: 'om1', d: 'M590,320 C620,350 630,390 620,440', strokeWidth: 7 },
  'om2': { id: 'om2', d: 'M630,340 C660,380 670,430 650,480', strokeWidth: 6 },
  'om3': { id: 'om3', d: 'M665,375 C695,415 700,460 680,510', strokeWidth: 5 },

  // CD (RCA) - goes right (anatomical right, so left on screen)
  'rca_ostial': { id: 'rca_ostial', d: 'M380,250 C360,240 330,240 310,255', strokeWidth: 12 },
  'rca_proximal': { id: 'rca_proximal', d: 'M310,255 C270,285 240,330 230,380', strokeWidth: 11 },
  'rca_mid': { id: 'rca_mid', d: 'M230,380 C215,440 220,500 240,550', strokeWidth: 10 },
  'rca_distal': { id: 'rca_distal', d: 'M240,550 C265,610 300,660 350,680', strokeWidth: 9 },

  // Ramas CD
  'pda': { id: 'pda', d: 'M350,680 C360,690 370,720 375,760', strokeWidth: 7 },
  'pl': { id: 'pl', d: 'M350,680 C330,700 290,730 250,750', strokeWidth: 7 },
};

export const AORTIC_ROOT_PATH = 'M400,100 C450,100 480,150 450,220 C420,280 380,280 350,220 C320,150 350,100 400,100 Z';
