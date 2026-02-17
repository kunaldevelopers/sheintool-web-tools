const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

const jobQueue = require('../services/jobQueue');

exports.convertAudio = async (req, res) => {
    if (!req.file) {
        console.error('❌ Request received but no file uploaded.');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const { format } = req.body;
    let targetFormat = format.toLowerCase();

    // Map extensions to FFmpeg formats
    const formatMapping = {
        'm4a': 'ipod',
        // 'm4a': 'mp4', // Alternative if ipod fails, but ipod is standard for audio-only m4a
    };

    if (formatMapping[targetFormat]) {
        targetFormat = formatMapping[targetFormat];
    }

    const inputPath = req.file.path;
    const outputFilename = `${path.parse(req.file.originalname).name}_converted.${format}`;
    const outputPath = path.join('uploads', outputFilename);

    try {
        await jobQueue.addMediaJob(req, () => {
            return new Promise((resolve, reject) => {
                console.log('--- Audio Conversion Request (Job Started) ---');
                console.log(`📂 Input File: ${req.file.originalname}`);
                console.log(`⚖️  Size: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`);
                console.log(`🎯 Target Format: ${targetFormat.toUpperCase()} (File ext: ${format})`);
                console.log('🔄 Processing with FFmpeg...');

                // We must use 'fluent-ffmpeg' instance if not already
                // Current imports: const ffmpeg = require('fluent-ffmpeg');

                ffmpeg(inputPath)
                    .toFormat(targetFormat)
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
                            resolve();
                        });
                    })
                    .on('error', (err) => {
                        console.error('❌ Audio conversion error:', err);
                        fs.unlink(inputPath, () => { });
                        reject(err);
                    })
                    .save(outputPath);
            });
        });
    } catch (err) {
        if (!res.headersSent) {
            const status = err.status || 500;
            res.status(status).json({ error: 'Audio conversion failed', details: err.message });
        }
    }
};
