const mammoth = require('mammoth');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const jobQueue = require('../services/jobQueue');

exports.wordToPdf = async (req, res) => {
    // Word (Docx) -> HTML -> Puppeteer PDF.

    if (!req.file) return res.status(400).json({ error: 'No Word file uploaded' });

    try {
        await jobQueue.addPuppeteerJob(req, () => {
            return new Promise(async (resolve, reject) => {
                const outputFilename = `${path.parse(req.file.originalname).name}.pdf`;
                const outputPath = path.join('uploads', outputFilename);

                try {
                    console.log(`--- Word to PDF Request (Job Started) ---`);
                    console.log(`📂 File: ${req.file.originalname}`);

                    // 1. Convert Docx to HTML
                    const result = await mammoth.convertToHtml({ path: req.file.path });
                    const html = `
                        <html>
                            <head>
                                <style>
                                    body { font-family: sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; line-height: 1.6; }
                                    table { border-collapse: collapse; width: 100%; margin-bottom: 1em; }
                                    td, th { border: 1px solid #ddd; padding: 8px; }
                                    img { max-width: 100%; height: auto; }
                                </style>
                            </head>
                            <body>
                                ${result.value}
                            </body>
                        </html>
                    `;

                    // 2. HTML to PDF via Puppeteer
                    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
                    const page = await browser.newPage();
                    await page.setContent(html, { waitUntil: 'networkidle0' });

                    await page.pdf({
                        path: outputPath,
                        format: 'A4',
                        printBackground: true,
                        margin: { top: '2cm', bottom: '2cm', left: '2cm', right: '2cm' }
                    });

                    await browser.close();

                    console.log(`✅ Conversion Successful: ${outputFilename}`);

                    // Cleanup input
                    fs.unlink(req.file.path, () => { });

                    res.download(outputPath, outputFilename, (err) => {
                        if (err) console.error('Download error:', err);
                        // Cleanup output
                        fs.unlink(outputPath, () => { });
                        resolve();
                    });

                } catch (error) {
                    console.error('Word to PDF error:', error);
                    if (fs.existsSync(req.file.path)) fs.unlink(req.file.path, () => { });
                    reject(error);
                }
            });
        });

    } catch (error) {
        if (!res.headersSent) {
            const status = error.status || 500;
            res.status(status).json({ error: 'Conversion failed', details: error.message });
        }
    }
};
