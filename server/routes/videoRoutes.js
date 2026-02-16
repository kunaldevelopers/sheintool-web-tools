const express = require('express');
const router = express.Router();
const multer = require('multer');
const videoController = require('../controllers/videoController');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    // Video files can be large, set 500MB limit for demo
    limits: { fileSize: 500 * 1024 * 1024 }
});

router.post('/convert/video', upload.single('file'), videoController.convertVideo);

module.exports = router;
