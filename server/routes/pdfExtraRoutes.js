const express = require('express');
const router = express.Router();
const multer = require('multer');
const officeController = require('../controllers/officeController');
const ocrController = require('../controllers/ocrController');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// Office
router.post('/word-to-pdf', upload.single('file'), officeController.wordToPdf);

// OCR
router.post('/scan', upload.single('file'), ocrController.ocrScan);

module.exports = router;
