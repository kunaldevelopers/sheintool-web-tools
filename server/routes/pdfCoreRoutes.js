const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const pdfCoreController = require('../controllers/pdfCoreController');

// Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Routes
router.post('/merge', upload.array('files', 20), pdfCoreController.mergePDFs);
router.post('/split', upload.single('file'), pdfCoreController.splitPDF);
router.post('/compress', upload.single('file'), pdfCoreController.compressPDF);
router.post('/protect', upload.single('file'), pdfCoreController.protectPDF);
router.post('/unlock', upload.single('file'), pdfCoreController.unlockPDF);

module.exports = router;
