const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegPath);

ffmpeg.getAvailableFormats(function (err, formats) {
    if (err) {
        console.log('An error occurred: ' + err.message);
    } else {
        console.log('Format: mkv -> ' + (formats.mkv ? JSON.stringify(formats.mkv) : 'NOT FOUND'));
        console.log('Format: matroska -> ' + (formats.matroska ? JSON.stringify(formats.matroska) : 'NOT FOUND'));
        console.log('Format: wmv -> ' + (formats.wmv ? JSON.stringify(formats.wmv) : 'NOT FOUND'));
        console.log('Format: asf -> ' + (formats.asf ? JSON.stringify(formats.asf) : 'NOT FOUND'));
        console.log('Format: m4a -> ' + (formats.m4a ? JSON.stringify(formats.m4a) : 'NOT FOUND'));
        console.log('Format: ipod -> ' + (formats.ipod ? JSON.stringify(formats.ipod) : 'NOT FOUND'));
        console.log('Format: mp4 -> ' + (formats.mp4 ? JSON.stringify(formats.mp4) : 'NOT FOUND'));
    }
});
