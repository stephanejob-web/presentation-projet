/**
 * generate-pdf.js — Export PDF professionnel via Puppeteer
 *
 * Usage :
 *   node generate-pdf.js
 *
 * Prérequis :
 *   npm install puppeteer
 *   (télécharge Chromium automatiquement ~170 Mo)
 *
 * Résultat : lightchurch-presentation.pdf dans le même dossier
 */

const puppeteer = require('puppeteer');
const path      = require('path');
const fs        = require('fs');

async function generatePDF() {
  const inputFile  = path.resolve(__dirname, 'index.html');
  const outputFile = path.resolve(__dirname, 'lightchurch-presentation.pdf');

  if (!fs.existsSync(inputFile)) {
    console.error('Fichier introuvable :', inputFile);
    process.exit(1);
  }

  console.log('Lancement de Chromium...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Charger le fichier HTML local
  await page.goto('file://' + inputFile, {
    waitUntil: 'networkidle0',
    timeout: 60000,
  });

  // Attendre que les animations reveal soient résolues
  await new Promise(r => setTimeout(r, 1500));

  // Forcer toutes les animations reveal à leur état final
  await page.evaluate(() => {
    document.querySelectorAll('.reveal').forEach(el => {
      el.style.opacity    = '1';
      el.style.transform  = 'none';
      el.style.transition = 'none';
    });
    // Masquer nav et progress bar
    const nav = document.querySelector('nav');
    const prog = document.querySelector('#progress');
    if (nav)  nav.style.display  = 'none';
    if (prog) prog.style.display = 'none';
  });

  console.log('Génération du PDF A4...');
  await page.pdf({
    path:               outputFile,
    format:             'A4',
    printBackground:    true,    // Fonds colorés (code windows, hero)
    preferCSSPageSize:  true,    // Respecte @page CSS
    margin: {
      top:    '14mm',
      right:  '12mm',
      bottom: '14mm',
      left:   '12mm',
    },
    displayHeaderFooter: false,  // Pas d'en-têtes Chrome
  });

  await browser.close();

  const size = (fs.statSync(outputFile).size / 1024 / 1024).toFixed(1);
  console.log(`PDF généré : ${outputFile}`);
  console.log(`Taille     : ${size} Mo`);
}

generatePDF().catch(err => {
  console.error('Erreur :', err.message);
  process.exit(1);
});
