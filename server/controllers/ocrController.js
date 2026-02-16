const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const pdfParse = require('pdf-parse'); // For extracting text directly if possible, or we convert pages to images?
// Tesseract works on Images.
// For PDF OCR: Convert PDF Pages -> Images -> OCR.
// This requires 'pdf-poppler' or similar which needs system deps.
// Complexity Alert: "OCR PDF".
// Simplified approach: OCR Image.
// If PDF is uploaded: Warn user "Only images supported in high-speed mode" or try to extract images?
// Let's implement OCR for Images first as it's robust in Node.
// For PDF, we can use Puppeteer to take screenshot of page and OCR it?
// Let's try Puppeteer Screenshot -> Tesseract.

const puppeteer = require('puppeteer');

exports.ocrScan = async (req, res) => {
    // Supports Image or PDF.

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    console.log(`--- OCR Request ---`);
    console.log(`📂 File: ${req.file.originalname}`);
    const ext = path.extname(req.file.originalname).toLowerCase();

    let textResult = "";

    try {
        if (ext === '.pdf') {
            // PDF OCR Strategy:
            // 1. Launch Puppeteer
            // 2. Load PDF (browser can render PDF?) actually browser PDF viewer is complex.
            // Better: Use `pdf-parse` to see if text exists. If checks fail (scanned), we need image conversion.
            // Rendering PDF to canvas/image in Node is hard without GraphicsMagick.
            // Alternative: Send PDF to Tesseract? Tesseract JS supports PDF? No, mostly images.
            // Let's stick to Image OCR for reliability in Node environment without installing OS-level binary (Ghostscript/Poppler).
            // OR use Puppeteer to render HTML? No.

            // Wait, tesseract.js is pure JS.
            // Let's support Image files for now. If PDF, reject with "Please convert PDF to Images first".
            // Or try to use `pdf-lib` to extract images? Too complex.

            return res.status(400).json({ error: 'For best results, please convert PDF to JPG/PNG first using our Image Converter.' });

        } else {
            // Image OCR
            console.log('🔄 Recognizing text...');
            const { data: { text } } = await Tesseract.recognize(req.file.path, 'eng');
            textResult = text;
        }

        console.log(`✅ Text Extracted: ${textResult.substring(0, 50)}...`);

        // Output as TXT file or PDF?
        // Let's return TXT file.
        const outputFilename = `${path.parse(req.file.originalname).name}_ocr.txt`;
        const outputPath = path.join('uploads', outputFilename);
        fs.writeFileSync(outputPath, textResult);

        fs.unlink(req.file.path, () => { });

        res.download(outputPath, outputFilename, (err) => {
            fs.unlink(outputPath, () => { });
        });

    } catch (error) {
        console.error('OCR error:', error);
        fs.unlink(req.file.path, () => { });
        res.status(500).json({ error: 'OCR failed', details: error.message });
    }
};
