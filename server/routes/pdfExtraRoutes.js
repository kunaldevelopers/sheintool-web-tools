const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const upload = multer({ dest: 'uploads/' });

const officeController = require('../controllers/officeController');
const ocrController = require('../controllers/ocrController');
const pdfExtraController = require('../controllers/pdfExtraController');

// Multer config for multiple files (used by Image to PDF)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const uploadMulti = multer({ storage: storage });

// OCR
router.post('/scan', upload.single('file'), ocrController.ocrScan);

// Word (Docx) to PDF
router.post('/word-to-pdf', upload.single('file'), officeController.wordToPdf);

// Image to PDF
// Note: Frontend sends 'files' as array
router.post('/image-to-pdf', uploadMulti.array('files'), pdfExtraController.imageToPdf);

module.exports = router;
