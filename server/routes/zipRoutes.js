const express = require('express');
const router = express.Router();
const multer = require('multer');
const zipController = require('../controllers/zipController');

const upload = multer({ dest: 'uploads/' });

router.post('/tools/zip/create', upload.array('files'), zipController.createZip);
router.post('/tools/zip/extract', upload.single('file'), zipController.extractZip);

module.exports = router;
