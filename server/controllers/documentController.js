const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');
const pdfParse = require('pdf-parse');
const puppeteer = require('puppeteer');
const puppeteerCleanup = require('../utils/puppeteerCleanup');

const md = new MarkdownIt();

exports.markdownToPdf = async (req, res) => {
  if (!req.file) {
    console.error('❌ Request received but no file uploaded.');
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const inputPath = req.file.path;
  const outputFilename = `${path.parse(req.file.originalname).name}.pdf`;
  const outputPath = path.join('uploads', outputFilename);

  console.log('--- Markdown to PDF Request ---');
  console.log(`📂 Input File: ${req.file.originalname}`);
  console.log(`⚖️  Size: ${(req.file.size / 1024).toFixed(2)} KB`);

  try {
    console.log('🔄 Reading file and generating HTML...');
    const markdownContent = fs.readFileSync(inputPath, 'utf-8');
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
            pre { background: #f4f4f4; padding: 1rem; border-radius: 5px; overflow-x: auto; }
            code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 3px; }
            img { max-width: 100%; }
          </style>
        </head>
        <body>
          ${md.render(markdownContent)}
        </body>
      </html>
    `;

    console.log('🔄 Launching Puppeteer...');
    // Use managed cleanup
    const instance = await puppeteerCleanup.launch({ headless: 'new' });
    const browser = instance.browser;
    const jobDir = instance.jobDir;

    try {
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      await page.pdf({ path: outputPath, format: 'A4', printBackground: true });
    } finally {
      await puppeteerCleanup.close(browser, jobDir);
    }

    // Browser is closed now

    console.log(`✅ Conversion Successful: ${outputFilename}`);
    console.log('⬇️  Sending file to client...');

    res.download(outputPath, outputFilename, (err) => {
      fs.unlink(inputPath, () => { });
      fs.unlink(outputPath, () => { });
      if (err) {
        console.error('❌ Download error:', err);
      } else {
        console.log('✨ Transaction Complete.');
      }
    });

  } catch (error) {
    console.error('MD to PDF error:', error);
    fs.unlink(inputPath, () => { });
    res.status(500).json({ error: 'Conversion failed', details: error.message });
  }
};

exports.pdfToMarkdown = async (req, res) => {
  if (!req.file) {
    console.error('❌ Request received but no file uploaded.');
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const inputPath = req.file.path;
  const outputFilename = `${path.parse(req.file.originalname).name}.md`;
  const outputPath = path.join('uploads', outputFilename);

  console.log('--- PDF to Markdown Request ---');
  console.log(`📂 Input File: ${req.file.originalname}`);
  console.log(`⚖️  Size: ${(req.file.size / 1024).toFixed(2)} KB`);

  try {
    console.log('🔄 Parsing PDF...');
    const dataBuffer = fs.readFileSync(inputPath);
    const data = await pdfParse(dataBuffer);

    // Simple text extraction for now. Complex PDF to MD is very hard.
    const markdownContent = data.text;

    fs.writeFileSync(outputPath, markdownContent);

    console.log(`✅ Conversion Successful: ${outputFilename}`);
    console.log('⬇️  Sending file to client...');

    res.download(outputPath, outputFilename, (err) => {
      fs.unlink(inputPath, () => { });
      fs.unlink(outputPath, () => { });
      if (err) {
        console.error('❌ Download error:', err);
      } else {
        console.log('✨ Transaction Complete.');
      }
    });

  } catch (error) {
    console.error('❌ PDF to MD error:', error);
    fs.unlink(inputPath, () => { });
    res.status(500).json({ error: 'Conversion failed', details: error.message });
  }
};
