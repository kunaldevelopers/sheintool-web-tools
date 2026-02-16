const QRCode = require('qrcode');

exports.generateQR = async (req, res) => {
    const { text } = req.body;
    if (!text) {
        console.error('❌ QR Request received but no text provided.');
        return res.status(400).json({ error: 'Text is required' });
    }

    console.log('--- QR Code Generation Request ---');
    console.log(`📝 Content: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);

    try {
        console.log('🔄 Generating QR Code...');
        const qrImage = await QRCode.toDataURL(text);
        console.log('✅ QR Code Generated Successfully.');
        res.json({ qrImage });
    } catch (error) {
        console.error('❌ QR Gen error:', error);
        res.status(500).json({ error: 'Generation failed' });
    }
};
