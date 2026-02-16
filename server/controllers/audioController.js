const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

exports.convertAudio = (req, res) => {
    if (!req.file) {
        console.error('❌ Request received but no file uploaded.');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const { format } = req.body;
    const inputPath = req.file.path;
    const outputFilename = `${path.parse(req.file.originalname).name}_converted.${format}`;
    const outputPath = path.join('uploads', outputFilename);

    console.log('--- Audio Conversion Request ---');
    console.log(`📂 Input File: ${req.file.originalname}`);
    console.log(`⚖️  Size: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🎯 Target Format: ${format.toUpperCase()}`);
    console.log('🔄 Processing with FFmpeg...');

    ffmpeg(inputPath)
        .toFormat(format)
        .on('end', () => {
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
        })
        .on('error', (err) => {
            console.error('❌ Audio conversion error:', err);
            fs.unlink(inputPath, () => { });
            if (!res.headersSent) {
                res.status(500).json({ error: 'Audio conversion failed', details: err.message });
            }
        })
        .save(outputPath);
};
