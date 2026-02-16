const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

exports.convertImage = async (req, res) => {
    if (!req.file) {
        console.error('❌ Request received but no file uploaded.');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const { format } = req.body;
    const inputPath = req.file.path;
    const outputFilename = `${path.parse(req.file.originalname).name}_converted.${format}`;
    const outputPath = path.join('uploads', outputFilename);

    console.log('--- Image Conversion Request ---');
    console.log(`📂 Input File: ${req.file.originalname}`);
    console.log(`⚖️  Size: ${(req.file.size / 1024).toFixed(2)} KB`);
    console.log(`🎯 Target Format: ${format.toUpperCase()}`);

    try {
        console.log('🔄 Processing...');
        // Basic image processing with Sharp
        await sharp(inputPath)
            .toFormat(format)
            .toFile(outputPath);

        console.log(`✅ Conversion Successful: ${outputFilename}`);
        console.log('⬇️  Sending file to client...');

        res.download(outputPath, outputFilename, (err) => {
            // Cleanup files after download (or error)
            fs.unlink(inputPath, () => { });
            fs.unlink(outputPath, () => { });
            if (err) {
                console.error('❌ Download error:', err);
            } else {
                console.log('✨ Transaction Complete.');
            }
        });

    } catch (error) {
        console.error('❌ Conversion error:', error);
        fs.unlink(inputPath, () => { }); // Cleanup input on error
        res.status(500).json({ error: 'Image conversion failed', details: error.message });
    }
};
