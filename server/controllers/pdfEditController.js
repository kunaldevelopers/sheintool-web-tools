const { PDFDocument, rgb, degrees, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

exports.rotatePDF = async (req, res) => {
    // Rotation: 90, 180, 270 degrees.
    // Body: { angle: 90 }

    if (!req.file) return res.status(400).json({ error: 'No PDF uploaded' });
    const angle = parseInt(req.body.angle) || 90;

    console.log(`--- Rotate PDF Request (${angle}°) ---`);
    console.log(`📂 File: ${req.file.originalname}`);

    try {
        const pdfBytes = fs.readFileSync(req.file.path);
        const pdf = await PDFDocument.load(pdfBytes);
        const pages = pdf.getPages();

        pages.forEach(page => {
            const currentRotation = page.getRotation().angle;
            page.setRotation(degrees(currentRotation + angle));
        });

        const rotatedBytes = await pdf.save();
        const downloadName = `rotated_${req.file.originalname}`;
        const outputPath = path.join('uploads', downloadName);
        fs.writeFileSync(outputPath, rotatedBytes);

        // Cleanup
        fs.unlink(req.file.path, () => { });

        console.log(`✅ Rotation Successful`);

        res.download(outputPath, downloadName, (err) => {
            fs.unlink(outputPath, () => { });
        });

    } catch (error) {
        console.error('Rotate error:', error);
        fs.unlink(req.file.path, () => { });
        res.status(500).json({ error: 'Rotate failed', details: error.message });
    }
};

exports.watermarkPDF = async (req, res) => {
    // Watermark text. Body: { text: "CONFIDENTIAL", opacity: 0.5, size: 50, color: "red" }
    // Ideally support image watermark too, but starting with text.

    if (!req.file || !req.body.text) return res.status(400).json({ error: 'File and text required' });

    const text = req.body.text;
    const opacity = parseFloat(req.body.opacity) || 0.5;
    const size = parseInt(req.body.size) || 50;

    console.log(`--- Watermark PDF Request ---`);
    console.log(`📝 Text: "${text}"`);

    try {
        const pdfBytes = fs.readFileSync(req.file.path);
        const pdf = await PDFDocument.load(pdfBytes);
        const helveticaFont = await pdf.embedFont(StandardFonts.HelveticaBold);
        const pages = pdf.getPages();

        pages.forEach(page => {
            const { width, height } = page.getSize();
            // Center the watermark, maybe rotate it 45 degrees
            page.drawText(text, {
                x: width / 2 - (size * text.length) / 4, // Rough centering
                y: height / 2,
                size: size,
                font: helveticaFont,
                color: rgb(0.8, 0, 0), // Reddish
                opacity: opacity,
                rotate: degrees(45),
            });
        });

        const newBytes = await pdf.save();
        const downloadName = `watermarked_${req.file.originalname}`;
        const outputPath = path.join('uploads', downloadName);
        fs.writeFileSync(outputPath, newBytes);

        fs.unlink(req.file.path, () => { });
        console.log(`✅ Watermark Successful`);

        res.download(outputPath, downloadName, (err) => {
            fs.unlink(outputPath, () => { });
        });

    } catch (error) {
        console.error('Watermark error:', error);
        fs.unlink(req.file.path, () => { });
        res.status(500).json({ error: 'Watermark failed', details: error.message });
    }
};

exports.addPageNumbers = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No PDF uploaded' });

    // Position: 'bottom-center', 'bottom-right'
    const position = req.body.position || 'bottom-center';

    console.log(`--- Page Numbers Request ---`);

    try {
        const pdfBytes = fs.readFileSync(req.file.path);
        const pdf = await PDFDocument.load(pdfBytes);
        const helveticaFont = await pdf.embedFont(StandardFonts.Helvetica);
        const pages = pdf.getPages();
        const total = pages.length;

        pages.forEach((page, idx) => {
            const { width, height } = page.getSize();
            const text = `${idx + 1} / ${total}`;
            const textSize = 12;
            const textWidth = helveticaFont.widthOfTextAtSize(text, textSize);

            let x, y;
            // Simplified positioning
            if (position === 'bottom-right') {
                x = width - textWidth - 20;
                y = 20;
            } else { // bottom-center
                x = (width - textWidth) / 2;
                y = 20;
            }

            page.drawText(text, {
                x,
                y,
                size: textSize,
                font: helveticaFont,
                color: rgb(0, 0, 0),
            });
        });

        const newBytes = await pdf.save();
        const downloadName = `numbered_${req.file.originalname}`;
        const outputPath = path.join('uploads', downloadName);
        fs.writeFileSync(outputPath, newBytes);

        fs.unlink(req.file.path, () => { });
        console.log(`✅ Page Numbers Added`);

        res.download(outputPath, downloadName, (err) => {
            fs.unlink(outputPath, () => { });
        });

    } catch (error) {
        console.error('Page Numbers error:', error);
        fs.unlink(req.file.path, () => { });
        res.status(500).json({ error: 'Page numbering failed', details: error.message });
    }
};

exports.organizePDF = async (req, res) => {
    // Reorder or Delete pages.
    // Body: { pages: "1,3,5-7" } -> Keep only these pages in this order.
    // This effectively creates a new PDF with selected pages.

    if (!req.file || !req.body.pages) return res.status(400).json({ error: 'Pages configuration required' });

    // Parse pages string: "1,3,5-7"
    // TODO: implement robust parsing. For MVP, assume comma separated list of 1-based indices.

    console.log(`--- Organize PDF Request ---`);
    const pageSelection = req.body.pages.split(',').map(p => parseInt(p.trim()) - 1).filter(p => !isNaN(p));

    try {
        const pdfBytes = fs.readFileSync(req.file.path);
        const pdf = await PDFDocument.load(pdfBytes);
        const newPdf = await PDFDocument.create();

        // Copy pages
        const copiedPages = await newPdf.copyPages(pdf, pageSelection);
        copiedPages.forEach(p => newPdf.addPage(p));

        const newBytes = await newPdf.save();
        const downloadName = `organized_${req.file.originalname}`;
        const outputPath = path.join('uploads', downloadName);
        fs.writeFileSync(outputPath, newBytes);

        fs.unlink(req.file.path, () => { });
        console.log(`✅ Organize Successful`);

        res.download(outputPath, downloadName, (err) => {
            fs.unlink(outputPath, () => { });
        });

    } catch (error) {
        console.error('Organize error:', error);
        fs.unlink(req.file.path, () => { });
        res.status(500).json({ error: 'Organize failed', details: error.message });
    }
};
