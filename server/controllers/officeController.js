const mammoth = require('mammoth');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

exports.wordToPdf = async (req, res) => {
    // Word (Docx) -> HTML -> Puppeteer PDF.
    // Excel -> HTML -> PDF (Using 'xlsx' to HTML? user didn't ask for excel explicit library, 
    // but plan said Office -> PDF. For now implement Word. Excel is complex without libreoffice).
    // Sticking to Word for MVP as per mammoth capabilities.

    if (!req.file) return res.status(400).json({ error: 'No Word file uploaded' });

    console.log(`--- Word to PDF Request ---`);
    console.log(`📂 File: ${req.file.originalname}`);

    try {
        // 1. Convert Docx to HTML
        const result = await mammoth.convertToHtml({ path: req.file.path });
        const html = `
            <html>
                <head>
                    <style>
                        body { font-family: sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; line-height: 1.6; }
                        table { border-collapse: collapse; width: 100%; }
                        td, th { border: 1px solid #ddd; padding: 8px; }
                        img { max-width: 100%; }
                    </style>
                </head>
                <body>
                    ${result.value}
                </body>
            </html>
        `;

        // 2. HTML to PDF via Puppeteer
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const outputFilename = `${path.parse(req.file.originalname).name}.pdf`;
        const outputPath = path.join('uploads', outputFilename);

        await page.pdf({ path: outputPath, format: 'A4', printBackground: true, margin: { top: '2cm', bottom: '2cm', left: '2cm', right: '2cm' } });
        await browser.close();

        console.log(`✅ Conversion Successful`);

        // Cleanup input
        fs.unlink(req.file.path, () => { });

        res.download(outputPath, outputFilename, (err) => {
            fs.unlink(outputPath, () => { });
        });

    } catch (error) {
        console.error('Word to PDF error:', error);
        fs.unlink(req.file.path, () => { });
        res.status(500).json({ error: 'Conversion failed', details: error.message });
    }
};
