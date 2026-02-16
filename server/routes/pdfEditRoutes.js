const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfEditController = require('../controllers/pdfEditController');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

router.post('/rotate', upload.single('file'), pdfEditController.rotatePDF);
router.post('/watermark', upload.single('file'), pdfEditController.watermarkPDF);
router.post('/pagenumbers', upload.single('file'), pdfEditController.addPageNumbers);
router.post('/organize', upload.single('file'), pdfEditController.organizePDF);

module.exports = router;
