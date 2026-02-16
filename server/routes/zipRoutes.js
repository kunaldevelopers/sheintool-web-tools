const express = require('express');
const router = express.Router();
const multer = require('multer');
const zipController = require('../controllers/zipController');

const upload = multer({ dest: 'uploads/' });

router.post('/create', upload.array('files'), zipController.createZip);
router.post('/extract', upload.single('file'), zipController.extractZip);

module.exports = router;
