const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const imageController = require('../controllers/imageController');

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
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

router.post('/convert/image', upload.single('file'), imageController.convertImage);

module.exports = router;
