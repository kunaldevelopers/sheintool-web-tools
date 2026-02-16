const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

exports.imageToPdf = async (req, res) => {
    // Input: Multiple images (png, jpg).
    // Output: Single PDF with one image per page.

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No images uploaded' });
    }

    console.log(`--- Image to PDF Request ---`);
    console.log(`📂 Files: ${req.files.length}`);

    try {
        const pdfDoc = await PDFDocument.create();

        for (const file of req.files) {
            const imgBytes = fs.readFileSync(file.path);
            const ext = path.extname(file.originalname).toLowerCase();
            let image;

            if (ext === '.png') {
                image = await pdfDoc.embedPng(imgBytes);
            } else if (ext === '.jpg' || ext === '.jpeg') {
                image = await pdfDoc.embedJpg(imgBytes);
            } else {
                console.warn(`Skipping unsupported format: ${file.originalname}`);
                continue;
            }

            const { width, height } = image.scale(1);

            // Auto-size page to fit image OR fit image to A4?
            // "Fit to A4" is safer for "document" style, 
            // but "Image Size" is better for "just wrapping images".
            // Let's use Image Size for best quality, user can print to A4 if needed.
            const page = pdfDoc.addPage([width, height]);
            page.drawImage(image, {
                x: 0,
                y: 0,
                width: width,
                height: height,
            });
        }

        const pdfBytes = await pdfDoc.save();
        const downloadName = `images_combined_${Date.now()}.pdf`;
        const outputPath = path.join('uploads', downloadName);

        fs.writeFileSync(outputPath, pdfBytes);

        console.log(`✅ Conversion Successful: ${downloadName}`);

        // Cleanup inputs
        req.files.forEach(f => {
            if (fs.existsSync(f.path)) fs.unlink(f.path, () => { });
        });

        res.download(outputPath, downloadName, (err) => {
            if (err) console.error('Download error:', err);
            fs.unlink(outputPath, () => { });
        });

    } catch (error) {
        console.error('Image to PDF error:', error);
        // Cleanup inputs on error
        req.files.forEach(f => {
            if (fs.existsSync(f.path)) fs.unlink(f.path, () => { });
        });
        res.status(500).json({ error: 'Conversion failed', details: error.message });
    }
};
