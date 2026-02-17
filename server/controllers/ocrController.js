const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const jobQueue = require('../services/jobQueue');

exports.ocrScan = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        await jobQueue.addPuppeteerJob(req, () => {
            return new Promise(async (resolve, reject) => {
                const outputFilename = `${path.parse(req.file.originalname).name}_ocr.txt`;
                const outputPath = path.join('uploads', outputFilename);
                const ext = path.extname(req.file.originalname).toLowerCase();
                let textResult = "";

                try {
                    console.log(`--- OCR Request (Job Started) ---`);
                    console.log(`📂 File: ${req.file.originalname}`);

                    if (ext === '.pdf') {
                        console.log('🔄 Processing PDF for OCR (Rendering pages via Puppeteer)...');

                        // 1. Read PDF as Base64 to inject into Puppeteer
                        const pdfData = fs.readFileSync(req.file.path).toString('base64');

                        // 2. Launch Puppeteer
                        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
                        const page = await browser.newPage();

                        // 3. Inject HTML with PDF.js
                        const pdfJsUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
                        const pdfWorkerUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

                        await page.setContent(`
                            <html>
                            <body>
                                <script src="${pdfJsUrl}"></script>
                                <script>
                                    pdfjsLib.GlobalWorkerOptions.workerSrc = '${pdfWorkerUrl}';
                                    
                                    async function renderPages(pdfBase64) {
                                        const pdf = await pdfjsLib.getDocument({ data: atob(pdfBase64) }).promise;
                                        const images = [];
                                        
                                        for (let i = 1; i <= pdf.numPages; i++) {
                                            const page = await pdf.getPage(i);
                                            const viewport = page.getViewport({ scale: 2.0 });
                                            const canvas = document.createElement('canvas');
                                            const context = canvas.getContext('2d');
                                            canvas.height = viewport.height;
                                            canvas.width = viewport.width;

                                            await page.render({ canvasContext: context, viewport: viewport }).promise;
                                            images.push(canvas.toDataURL('image/png'));
                                        }
                                        return images;
                                    }
                                </script>
                            </body>
                            </html>
                        `, { waitUntil: 'networkidle0' });

                        console.log(`📄 PDF loaded in browser, rendering pages...`);

                        // 4. Run the rendering function in browser context
                        const pageImages = await page.evaluate((data) => {
                            return window.renderPages(data);
                        }, pdfData);

                        await browser.close();

                        console.log(`🖼️  Rendered ${pageImages.length} pages. Starting Tesseract...`);

                        // 5. OCR each image
                        for (let i = 0; i < pageImages.length; i++) {
                            console.log(`Scanning page ${i + 1}/${pageImages.length}...`);
                            const imgBuffer = Buffer.from(pageImages[i].split(',')[1], 'base64');
                            const { data: { text } } = await Tesseract.recognize(imgBuffer, 'eng');
                            textResult += `--- Page ${i + 1} ---\n${text}\n\n`;
                        }

                    } else {
                        // Image OCR
                        console.log('🔄 Recognizing text from Image...');
                        const { data: { text } } = await Tesseract.recognize(req.file.path, 'eng');
                        textResult = text;
                    }

                    console.log(`✅ OCR Complete. Saving to ${outputFilename}`);
                    fs.writeFileSync(outputPath, textResult);

                    // Cleanup input
                    fs.unlink(req.file.path, () => { });

                    res.download(outputPath, outputFilename, (err) => {
                        if (err) console.error('Download error:', err);
                        fs.unlink(outputPath, () => { });
                        resolve(); // Job Done
                    });

                } catch (error) {
                    console.error('OCR error:', error);
                    if (fs.existsSync(req.file.path)) fs.unlink(req.file.path, () => { });
                    reject(error);
                }
            });
        });
    } catch (err) {
        if (!res.headersSent) {
            const status = err.status || 500;
            res.status(status).json({ error: 'OCR failed', details: err.message });
        }
    }
};
