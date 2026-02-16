const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const fs = require('fs');
const path = require('path');

// Set ffmpeg paths
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

exports.convertVideo = (req, res) => {
    if (!req.file) {
        console.error('❌ Request received but no file uploaded.');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const { format } = req.body;
    const inputPath = req.file.path;
    const outputFilename = `${path.parse(req.file.originalname).name}_converted.${format}`;
    const outputPath = path.join('uploads', outputFilename);

    console.log('--- Video Conversion Request ---');
    console.log(`📂 Input File: ${req.file.originalname}`);
    console.log(`⚖️  Size: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🎯 Target Format: ${format.toUpperCase()}`);
    console.log('🔄 Processing with FFmpeg...');

    const command = ffmpeg(inputPath)
        .toFormat(format)
        .on('end', () => {
            console.log(`✅ Conversion Successful: ${outputFilename}`);
            console.log('⬇️  Sending file to client...');
            res.download(outputPath, outputFilename, (err) => {
                // Cleanup
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
            console.error('❌ FFmpeg error:', err);
            fs.unlink(inputPath, () => { });
            if (fs.existsSync(outputPath)) fs.unlink(outputPath, () => { });

            // Attempt to send error if headers not sent
            if (!res.headersSent) {
                res.status(500).json({ error: 'Video conversion failed', details: err.message });
            }
        });

    command.save(outputPath);
};
