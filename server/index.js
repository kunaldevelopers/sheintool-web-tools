const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (if needed for temp storage access, though usually we stream)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const imageRoutes = require('./routes/imageRoutes');
const videoRoutes = require('./routes/videoRoutes');
const audioRoutes = require('./routes/audioRoutes');
const documentRoutes = require('./routes/documentRoutes');
const qrRoutes = require('./routes/qrRoutes');
const zipRoutes = require('./routes/zipRoutes');

app.use('/api', imageRoutes);
app.use('/api', videoRoutes);
app.use('/api', audioRoutes);
app.use('/api', documentRoutes);
app.use('/api', qrRoutes);
app.use('/api', zipRoutes);


app.get('/', (req, res) => {
    res.send('SheinTool Backend is Running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
