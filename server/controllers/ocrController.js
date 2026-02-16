const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

exports.ocrScan = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    console.log(`--- OCR Request ---`);
    console.log(`📂 File: ${req.file.originalname}`);
    const ext = path.extname(req.file.originalname).toLowerCase();
    const outputFilename = `${path.parse(req.file.originalname).name}_ocr.txt`;
    const outputPath = path.join('uploads', outputFilename);

    let textResult = "";

    try {
        if (ext === '.pdf') {
            console.log('🔄 Processing PDF for OCR (Rendering pages via Puppeteer)...');

            // 1. Read PDF as Base64 to inject into Puppeteer
            const pdfData = fs.readFileSync(req.file.path).toString('base64');

            // 2. Launch Puppeteer
            const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
            const page = await browser.newPage();

            // 3. Inject HTML with PDF.js
            // We use a CDN for pdf.js. Ensure internet access is available.
            // If offline, this will fail. Assuming internet is OK for typical usage.
            // Using a specific version for stability.
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
                                const viewport = page.getViewport({ scale: 2.0 }); // Scale 2.0 for better OCR quality
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
            // Process sequentially to save memory
            for (let i = 0; i < pageImages.length; i++) {
                console.log(`Scanning page ${i + 1}/${pageImages.length}...`);
                // Buffer from base64
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
        });

    } catch (error) {
        console.error('OCR error:', error);
        if (fs.existsSync(req.file.path)) fs.unlink(req.file.path, () => { });
        res.status(500).json({ error: 'OCR failed', details: error.message });
    }
};
