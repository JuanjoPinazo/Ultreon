import PDFDocument from 'pdfkit';

interface CongressSummaryData {
  caseCode: string;
  center: string;
  segment: string;
  procedureDate: string;
  zeroContrastCompleted: boolean;
  ffrOct: number | null;
  calciumSevere: boolean | null;
  lipidPlaque: boolean | null;
  eel: number | null;
  strategyModified: boolean;
  strategyChangeMagnitude?: string;
  strategyChangeDescription?: string;
  msa?: number;
  stentExpansionPercent?: number;
  malappositionLength?: number;
  dissection?: boolean;
  opstarScore?: number;
  expectedContrast?: number;
  actualContrast?: number;
  followups?: Array<{
    type: string;
    date: string;
    mace: boolean;
  }>;
  keyImageUrls?: {
    preOct?: string;
    postOct?: string;
    ultreon?: string;
  };
}

export async function generateCongressSummaryPDF(data: CongressSummaryData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // === HEADER ===
    doc.fontSize(24).font('Helvetica-Bold').text('OPSTAR-AI Levante Registry');
    doc.fontSize(14).font('Helvetica').text('Congress Case Summary');
    doc.moveTo(40, 80).lineTo(555, 80).stroke('#00D9FF');
    doc.moveDown(0.5);

    // === CASE OVERVIEW ===
    doc.fontSize(12).font('Helvetica-Bold').text('Case Overview', { underline: true });
    doc.fontSize(10).font('Helvetica');

    doc.text(`Case Code: ${data.caseCode}`);
    doc.text(`Center: ${data.center}`);
    doc.text(`Vessel/Segment: ${data.segment}`);
    doc.text(`Procedure Date: ${new Date(data.procedureDate).toLocaleDateString('en-US')}`);
    doc.text(`Zero-Contrast Protocol: ${data.zeroContrastCompleted ? 'Completed' : 'Not completed'}`);
    doc.moveDown(0.5);

    // === PRE-PCI ASSESSMENT ===
    doc.fontSize(12).font('Helvetica-Bold').text('Pre-PCI Assessment', { underline: true });
    doc.fontSize(10).font('Helvetica');

    doc.text(`FFR-OCT: ${data.ffrOct !== null ? data.ffrOct.toFixed(2) : 'Not available'}`);
    doc.text(`Severe Calcium: ${data.calciumSevere ? 'Yes' : data.calciumSevere === false ? 'No' : 'Not assessed'}`);
    doc.text(`Lipid Plaque: ${data.lipidPlaque ? 'Yes' : data.lipidPlaque === false ? 'No' : 'Not assessed'}`);
    doc.text(`External Elastic Lamina (mm): ${data.eel !== null ? data.eel.toFixed(2) : 'Not measured'}`);
    doc.moveDown(0.5);

    // === STRATEGY MODIFICATION ===
    doc.fontSize(12).font('Helvetica-Bold').text('Strategy Modification', { underline: true });
    doc.fontSize(10).font('Helvetica');

    doc.text(`Modified by ULTREON™: ${data.strategyModified ? 'Yes' : 'No'}`);
    if (data.strategyModified) {
      if (data.strategyChangeMagnitude) {
        doc.text(`Magnitude: ${data.strategyChangeMagnitude}`);
      }
      if (data.strategyChangeDescription) {
        doc.text(`Description: ${data.strategyChangeDescription}`);
      }
    }
    doc.moveDown(0.5);

    // === POST-PCI OPTIMIZATION ===
    doc.fontSize(12).font('Helvetica-Bold').text('Post-PCI Optimization (Tríada ULTREON™)', { underline: true });
    doc.fontSize(10).font('Helvetica');

    doc.text(`Minimum Stent Area (mm²): ${data.msa !== undefined ? data.msa.toFixed(2) : 'Not measured'}`);
    doc.text(`Stent Expansion (%): ${data.stentExpansionPercent !== undefined ? data.stentExpansionPercent.toFixed(1) : 'Not calculated'}`);
    doc.text(`Malapposition Length (mm): ${data.malappositionLength !== undefined ? data.malappositionLength.toFixed(2) : 'None detected'}`);
    doc.text(`Edge Dissection: ${data.dissection ? 'Detected' : 'Not detected'}`);
    doc.text(`OPSTAR Score: ${data.opstarScore !== undefined ? `${data.opstarScore.toFixed(1)}/100` : 'Not calculated'}`);
    doc.moveDown(0.5);

    // === CONTRAST METRICS ===
    if (data.expectedContrast !== undefined || data.actualContrast !== undefined) {
      doc.fontSize(12).font('Helvetica-Bold').text('Contrast Utilization', { underline: true });
      doc.fontSize(10).font('Helvetica');

      const expectedContrast = data.expectedContrast || 0;
      const actualContrast = data.actualContrast || 0;
      const reduction = expectedContrast > 0 ? ((expectedContrast - actualContrast) / expectedContrast) * 100 : 0;

      doc.text(`Expected Contrast (mL): ${expectedContrast.toFixed(1)}`);
      doc.text(`Actual Contrast Used (mL): ${actualContrast.toFixed(1)}`);
      doc.text(`Reduction (%): ${reduction.toFixed(1)}`);
      doc.moveDown(0.5);
    }

    // === FOLLOW-UP ===
    if (data.followups && data.followups.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').text('Clinical Follow-up', { underline: true });
      doc.fontSize(10).font('Helvetica');

      data.followups.forEach((fu) => {
        const maceStatus = fu.mace ? '⚠ MACE' : '✓ No MACE';
        doc.text(`${fu.type}: ${maceStatus}`);
      });

      doc.moveDown(0.5);
    }

    // === KEY IMAGES (Placeholder) ===
    if (data.keyImageUrls && (data.keyImageUrls.preOct || data.keyImageUrls.postOct)) {
      doc.fontSize(12).font('Helvetica-Bold').text('Key Images', { underline: true });
      doc.fontSize(9).font('Helvetica').text('Images available in clinical platform', { oblique: true });
      doc.moveDown(0.5);
    }

    // === FOOTER / DISCLAIMER ===
    doc.moveTo(40, 750).lineTo(555, 750).stroke('#E2E8F0');
    doc.fontSize(8).font('Helvetica').fillColor('#666666');
    doc.text(
      'Anonymized scientific summary for congress presentation. All clinical decisions remain under the responsibility of the interventional cardiologist. Data generated from OPSTAR-AI Levante Registry.',
      40,
      760,
      { width: 515 }
    );

    doc.end();
  });
}
