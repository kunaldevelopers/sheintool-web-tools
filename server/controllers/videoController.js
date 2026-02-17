const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const fs = require('fs');
const path = require('path');

// Set ffmpeg paths
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const jobQueue = require('../services/jobQueue');

exports.convertVideo = async (req, res) => {
    if (!req.file) {
        console.error('❌ Request received but no file uploaded.');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const { format } = req.body;
    let targetFormat = format.toLowerCase();

    // Map common extensions to FFmpeg format names if necessary
    const formatMapping = {
        'mkv': 'matroska',
        'wmv': 'asf', // WMV usually uses ASF container
        // add others if needed
    };

    if (formatMapping[targetFormat]) {
        targetFormat = formatMapping[targetFormat];
    }

    const inputPath = req.file.path;
    const outputFilename = `${path.parse(req.file.originalname).name}_converted.${format}`; // Keep original extension for filename
    const outputPath = path.join('uploads', outputFilename);

    // Queue Wrapper
    try {
        await jobQueue.addMediaJob(req, () => {
            return new Promise((resolve, reject) => {
                console.log('--- Video Conversion Request (Job Started) ---');
                console.log(`📂 Input File: ${req.file.originalname}`);
                console.log(`⚖️  Size: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`);
                console.log(`🎯 Target Format: ${targetFormat.toUpperCase()} (File ext: ${format})`);
                console.log('🔄 Processing with FFmpeg...');

                const command = ffmpeg(inputPath)
                    .toFormat(targetFormat)
                    .on('end', () => {
                        console.log(`✅ Conversion Successful: ${outputFilename}`);
                        console.log('⬇️  Sending file to client...');
                        res.download(outputPath, outputFilename, (err) => {
                            // Cleanup
                            fs.unlink(inputPath, () => { });
                            fs.unlink(outputPath, () => { });
                            if (err) {
                                console.error('❌ Download error:', err);
                                // We resolve anyway because the heavy lifting is done
                            } else {
                                console.log('✨ Transaction Complete.');
                            }
                            resolve(); // Release worker slot
                        });
                    })
                    .on('error', (err) => {
                        console.error('❌ FFmpeg error:', err);
                        fs.unlink(inputPath, () => { });
                        if (fs.existsSync(outputPath)) fs.unlink(outputPath, () => { });
                        reject(err);
                    });

                command.save(outputPath);
            });
        });
    } catch (err) {
        // Handle Queue Rejection (503) or FFmpeg Error (500)
        if (!res.headersSent) {
            const status = err.status || 500;
            res.status(status).json({ error: 'Video conversion failed', details: err.message });
        }
    }
};
