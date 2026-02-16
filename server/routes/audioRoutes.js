const express = require('express');
const router = express.Router();
const multer = require('multer');
const audioController = require('../controllers/audioController');

const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 100 * 1024 * 1024 }
});

router.post('/convert/audio', upload.single('file'), audioController.convertAudio);

module.exports = router;
