const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const puppeteerCleanup = require('./utils/puppeteerCleanup');

// Initialize Cleanup System
puppeteerCleanup.init();


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (if needed for temp storage access, though usually we stream)
// Static files - Force download for all files in uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, path) => {
        res.set('Content-Disposition', 'attachment');
    }
}));

// Routes
const imageRoutes = require('./routes/imageRoutes');
const videoRoutes = require('./routes/videoRoutes');
const audioRoutes = require('./routes/audioRoutes');
const documentRoutes = require('./routes/documentRoutes');
const qrRoutes = require('./routes/qrRoutes');
const zipRoutes = require('./routes/zipRoutes');
const pdfCoreRoutes = require('./routes/pdfCoreRoutes');
const pdfEditRoutes = require('./routes/pdfEditRoutes');
const pdfExtraRoutes = require('./routes/pdfExtraRoutes');



app.use('/api', imageRoutes);
app.use('/api', videoRoutes);
app.use('/api', audioRoutes);
app.use('/api/tools/document', documentRoutes);
app.use('/api/tools/qr', qrRoutes);
app.use('/api/tools/zip', zipRoutes);
app.use('/api/tools/pdf/core', pdfCoreRoutes);
app.use('/api/tools/pdf/edit', pdfEditRoutes);
app.use('/api/tools/pdf/extra', pdfExtraRoutes);




app.get('/', (req, res) => {
    res.send('SheinTool Backend is Running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Crash Handling
process.on('uncaughtException', (err) => {
    console.error('🔥 UNCAUGHT EXCEPTION:', err);
    // fs.appendFileSync('crash.log', `${new Date().toISOString()} - UNCAUGHT EXCEPTION: ${err.stack}\n`);
    // process.exit(1); // Optional: Nodemon will restart
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 UNHANDLED REJECTION:', reason);
    // fs.appendFileSync('crash.log', `${new Date().toISOString()} - UNHANDLED REJECTION: ${reason}\n`);
});
