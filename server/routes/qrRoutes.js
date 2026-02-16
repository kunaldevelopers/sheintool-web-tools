const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');

// Route is mounted at /api/tools/qr
router.post('/', qrController.generateQR);

module.exports = router;
