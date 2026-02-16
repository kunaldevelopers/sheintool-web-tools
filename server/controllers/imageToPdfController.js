const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

exports.imagesToPdf = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No images uploaded' });
        }

        const pdfDoc = await PDFDocument.create();

        for (const file of req.files) {
            const imgBytes = await fs.readFile(file.path);
            let image;

            if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
                image = await pdfDoc.embedJpg(imgBytes);
            } else if (file.mimetype === 'image/png') {
                image = await pdfDoc.embedPng(imgBytes);
            } else {
                continue; // Skip unsupported formats provided they are filtered by multer, but good safety
            }

            const page = pdfDoc.addPage([image.width, image.height]);
            page.drawImage(image, {
                x: 0,
                y: 0,
                width: image.width,
                height: image.height,
            });

            // Clean up uploaded file
            await fs.unlink(file.path).catch(console.error);
        }

        const pdfBytes = await pdfDoc.save();
        const filename = `images_merged_${Date.now()}.pdf`;
        const outputPath = path.join(__dirname, '../../client/public/downloads', filename);

        await fs.writeFile(outputPath, pdfBytes);

        res.json({ downloadUrl: `/downloads/${filename}` });
    } catch (error) {
        console.error('Image to PDF Error:', error);
        res.status(500).json({ error: 'Conversion failed' });
    }
};
