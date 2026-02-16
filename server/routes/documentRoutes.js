const express = require('express');
const router = express.Router();
const multer = require('multer');
const documentController = require('../controllers/documentController');

const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

router.post('/convert/md-to-pdf', upload.single('file'), documentController.markdownToPdf);
router.post('/convert/pdf-to-md', upload.single('file'), documentController.pdfToMarkdown);

module.exports = router;
