const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');

router.post('/tools/qr', qrController.generateQR);

module.exports = router;
