const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const officeController = require('../controllers/officeController');
const ocrController = require('../controllers/ocrController');
// OCR
router.post('/scan', upload.single('file'), ocrController.ocrScan);

module.exports = router;
