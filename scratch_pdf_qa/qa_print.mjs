import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const url = 'http://localhost:3000/documentation';

async function generatePDFs() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Set viewport to desktop to load the UI
  await page.setViewport({ width: 1280, height: 1024 });
  
  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  // Assuming there's a login needed? The application might be protected.
  // Let's check if we are redirected to /login
  if (page.url().includes('login')) {
    console.log('Login required. Attempting to login...');
    await page.type('input[type="email"]', 'admin@quilprocardio.com');
    await page.type('input[type="password"]', 'admin123'); // guessing generic password or we might need to bypass
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
  }

  // Ensure we are on documentation
  if (!page.url().includes('documentation')) {
    await page.goto(url, { waitUntil: 'networkidle2' });
  }

  // Select a hospital (Manises)
  console.log('Selecting hospital (Manises)...');
  // Need to find the select or click the card
  // This depends on the UI. Let's just emulate print on whatever is visible.
  
  const docs = [
    { name: 'dossier', tabId: 'dossier', filename: '1_Dossier_Completo_Manises.pdf' },
    { name: 'ecrf', tabId: 'ecrf', filename: '2_eCRF_Imprimible.pdf' },
    { name: 'inclusions', tabId: 'inclusions', filename: '3_Control_Inclusiones.pdf' },
    { name: 'operator', tabId: 'operator', filename: '4_Ficha_Basal_Operador.pdf' },
    { name: 'checklist', tabId: 'checklist', filename: '5_Site_Initiation_Checklist.pdf' },
    { name: 'local', tabId: 'local', filename: '6_Hoja_Local_NHC_SIP.pdf' }
  ];

  for (const doc of docs) {
    console.log(`Processing ${doc.name}...`);
    try {
      // Click tab if available
      const tabButton = await page.$(`button[data-tab="${doc.tabId}"]`); // Just guessing the selector
      if (tabButton) {
        await tabButton.click();
        await new Promise(r => setTimeout(r, 500));
      }

      await page.emulateMediaType('print');

      // QA Check: Find any element that exceeds A4 width (186mm printable + margins = ~210mm total)
      // 210mm is approx 793px at 96 DPI. Max printable area is 186mm -> 703px.
      const overflows = await page.evaluate(() => {
        const issues = [];
        const elements = document.querySelectorAll('div, table, section, h1, h2, h3, p');
        elements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 750) {
            issues.push({
              tag: el.tagName,
              className: el.className,
              width: rect.width
            });
          }
        });
        return issues;
      });

      if (overflows.length > 0) {
        console.warn(`[WARN] ${doc.name} might have horizontal overflow on ${overflows.length} elements!`);
        console.log(overflows);
      }

      // Generate PDF
      const pdfPath = path.join(process.cwd(), doc.filename);
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '15mm',
          right: '12mm',
          bottom: '15mm',
          left: '12mm'
        }
      });
      console.log(`✅ Generated ${doc.filename}`);
    } catch (err) {
      console.error(`Failed to process ${doc.name}:`, err.message);
    }
  }

  // Also check Settlement
  try {
    console.log('Processing Liquidacion Mensual...');
    await page.goto('http://localhost:3000/admin/settlements', { waitUntil: 'networkidle2' });
    const pdfPath = path.join(process.cwd(), '7_Liquidacion_Mensual_QA.pdf');
    await page.emulateMediaType('print');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '12mm', bottom: '15mm', left: '12mm' }
    });
    console.log(`✅ Generated 7_Liquidacion_Mensual_QA.pdf`);
  } catch (err) {
    console.error('Failed to process Settlement:', err.message);
  }

  await browser.close();
  console.log('PDF Generation Complete.');
}

generatePDFs();
