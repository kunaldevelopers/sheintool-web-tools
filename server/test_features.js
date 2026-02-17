const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:5000/api';
const REPORT_FILE = 'test_report.md';

// Ensure we are in the server directory context or adjust paths
// We assume this script is run from sheintool/server/ or sheintool/ with node server/test_features.js
// But paths to samples need to be correct. 
// Let's resolve specific sample paths.

const SAMPLES = {
    audio: path.resolve(__dirname, 'tests/samples/test_sample.mp3'),
    video: path.resolve(__dirname, 'tests/samples/test_sample.mp4'),
    // valid jpg image
    image: path.resolve(__dirname, 'tests/test_output/converted.jpg'),
    pdf: path.resolve(__dirname, 'test_unlocked.pdf'), // Use unlocked PDF for core tests
    docx: path.resolve(__dirname, 'tests/samples/test_sample.docx'),
    md: path.resolve(__dirname, '../README.md'),
    protectedPdf: path.resolve(__dirname, 'test_protected.pdf'),
};

// Ensure samples exist
if (!fs.existsSync(SAMPLES.pdf)) {
    // Fallback to searching for any pdf if explicit unlocked one is missing
    const files = fs.readdirSync(__dirname);
    const pdf = files.find(f => f.endsWith('.pdf') && !f.includes('protected'));
    if (pdf) SAMPLES.pdf = path.resolve(__dirname, pdf);
}
if (!fs.existsSync(SAMPLES.image)) {
    // fallback to a png in node_modules if needed, or create a dummy?
    // Let's just hope the found one exists or use a dummy file
}

const logBuffer = [];

function log(message, type = 'INFO') {
    const timestamp = new Date().toLocaleTimeString();
    const logMsg = `[${timestamp}] [${type}] ${message}`;
    console.log(logMsg);
    logBuffer.push(logMsg);
}

function addToReport(feature, status, details = '') {
    const entry = `| ${feature} | ${status} | ${details} |`;
    reportEntries.push(entry);
}

const reportEntries = [];

async function uploadFile(endpoint, filePath, fieldName = 'file', extraFields = {}) {
    if (!fs.existsSync(filePath)) {
        return { success: false, error: `File not found: ${filePath}` };
    }

    const form = new FormData();
    form.append(fieldName, fs.createReadStream(filePath));
    for (const [key, value] of Object.entries(extraFields)) {
        form.append(key, value);
    }

    try {
        const response = await axios.post(`${BASE_URL}${endpoint}`, form, {
            headers: {
                ...form.getHeaders(),
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        return { success: true, data: response.data, headers: response.headers };
    } catch (error) {
        return {
            success: false,
            error: error.response ? `${error.response.status} ${error.response.statusText} - ${JSON.stringify(error.response.data)}` : error.message
        };
    }
}

async function testAudio() {
    log('Testing Audio Conversion...');
    const result = await uploadFile('/convert/audio', SAMPLES.audio, 'file', { format: 'wav' });
    if (result.success) {
        log('Audio Conversion PASS', 'SUCCESS');
        addToReport('Audio Conversion', 'PASS', 'Converted successfully');
    } else {
        log(`Audio Conversion FAIL: ${result.error}`, 'ERROR');
        addToReport('Audio Conversion', 'FAIL', result.error);
    }
}

async function testVideo() {
    log('Testing Video Conversion...');

    // MP4
    log('Testing Video -> MP4...');
    const resultMp4 = await uploadFile('/convert/video', SAMPLES.video, 'file', { format: 'mp4' });
    if (resultMp4.success) {
        log('Video -> MP4 PASS', 'SUCCESS');
        addToReport('Video Conversion (MP4)', 'PASS', 'Converted successfully');
    } else {
        log(`Video -> MP4 FAIL: ${resultMp4.error}`, 'ERROR');
        addToReport('Video Conversion (MP4)', 'FAIL', resultMp4.error);
    }

    // MKV
    log('Testing Video -> MKV...');
    const resultMkv = await uploadFile('/convert/video', SAMPLES.video, 'file', { format: 'mkv' });
    if (resultMkv.success) {
        log('Video -> MKV PASS', 'SUCCESS');
        addToReport('Video Conversion (MKV)', 'PASS', 'Converted successfully');
    } else {
        log(`Video -> MKV FAIL: ${resultMkv.error}`, 'ERROR');
        addToReport('Video Conversion (MKV)', 'FAIL', resultMkv.error);
    }

    // WMV
    log('Testing Video -> WMV...');
    const resultWmv = await uploadFile('/convert/video', SAMPLES.video, 'file', { format: 'wmv' });
    if (resultWmv.success) {
        log('Video -> WMV PASS', 'SUCCESS');
        addToReport('Video Conversion (WMV)', 'PASS', 'Converted successfully');
    } else {
        log(`Video -> WMV FAIL: ${resultWmv.error}`, 'ERROR');
        addToReport('Video Conversion (WMV)', 'FAIL', resultWmv.error);
    }
}

async function testImage() {
    log('Testing Image Conversion...');
    // endpoint is /convert/image but mounted at /api so /api/convert/image ? 
    // server.js: app.use('/api', imageRoutes); -> imageRoutes has router.post('/convert/image'...)
    // So url is /api/convert/image
    const result = await uploadFile('/convert/image', SAMPLES.image, 'file', { format: 'png' });
    if (result.success) {
        log('Image Conversion PASS', 'SUCCESS');
        addToReport('Image Conversion', 'PASS', 'Converted successfully');
    } else {
        log(`Image Conversion FAIL: ${result.error}`, 'ERROR');
        addToReport('Image Conversion', 'FAIL', result.error);
    }
}

async function testPdfCore() {
    log('Testing PDF Core Features...');

    // Split
    log('Testing PDF Split...');
    const splitResult = await uploadFile('/tools/pdf/core/split', SAMPLES.pdf);
    if (splitResult.success) addToReport('PDF Split', 'PASS');
    else addToReport('PDF Split', 'FAIL', splitResult.error);

    // Compress
    log('Testing PDF Compress...');
    const compressResult = await uploadFile('/tools/pdf/core/compress', SAMPLES.pdf);
    if (compressResult.success) addToReport('PDF Compress', 'PASS');
    else addToReport('PDF Compress', 'FAIL', compressResult.error);

    // Protect
    log('Testing PDF Protect...');
    const protectResult = await uploadFile('/tools/pdf/core/protect', SAMPLES.pdf, 'file', { password: 'testpassword' });
    if (protectResult.success) addToReport('PDF Protect', 'PASS');
    else addToReport('PDF Protect', 'FAIL', protectResult.error);

    // Unlock
    log('Testing PDF Unlock...');
    // We need a protected pdf. If we generated one, we could use it, but for now specific sample or skip
    if (fs.existsSync(SAMPLES.protectedPdf)) {
        const unlockResult = await uploadFile('/tools/pdf/core/unlock', SAMPLES.protectedPdf, 'file', { password: '123' }); // Password logic found in test_protect_local.js
        if (unlockResult.success) addToReport('PDF Unlock', 'PASS');
        else addToReport('PDF Unlock', 'FAIL', unlockResult.error);
    } else {
        addToReport('PDF Unlock', 'SKIP', 'No protected PDF sample found');
    }
}

async function testPdfEdit() {
    log('Testing PDF Edit Features...');

    // Rotate
    const rotateResult = await uploadFile('/tools/pdf/edit/rotate', SAMPLES.pdf, 'file', { angle: 90 });
    addToReport('PDF Rotate', rotateResult.success ? 'PASS' : 'FAIL', rotateResult.error);

    // Watermark
    const waterResult = await uploadFile('/tools/pdf/edit/watermark', SAMPLES.pdf, 'file', { text: 'TEST', opacity: 0.5 });
    addToReport('PDF Watermark', waterResult.success ? 'PASS' : 'FAIL', waterResult.error);

    // Page Numbers
    const numResult = await uploadFile('/tools/pdf/edit/pagenumbers', SAMPLES.pdf);
    addToReport('PDF Page Numbers', numResult.success ? 'PASS' : 'FAIL', numResult.error);
}

async function testMarkdownToPdf() {
    log('Testing MD to PDF...');
    const result = await uploadFile('/tools/document/convert/md-to-pdf', SAMPLES.md);
    addToReport('MD to PDF', result.success ? 'PASS' : 'FAIL', result.error);
}

async function testWordToPdf() {
    log('Testing Word to PDF...');
    const result = await uploadFile('/tools/pdf/extra/word-to-pdf', SAMPLES.docx);
    addToReport('Docxc to PDF', result.success ? 'PASS' : 'FAIL', result.error);
}

async function testQr() {
    log('Testing QR Generator...');
    try {
        const response = await axios.post(`${BASE_URL}/tools/qr`, { text: 'https://example.com' });
        if (response.data && response.data.qrImage) {
            addToReport('QR Generator', 'PASS');
        } else {
            addToReport('QR Generator', 'FAIL', 'No QR image in response');
        }
    } catch (e) {
        addToReport('QR Generator', 'FAIL', e.message);
    }
}

async function main() {
    log('--- Starting Comprehensive Server Test ---');
    log(`Base URL: ${BASE_URL}`);

    // Verify samples exist
    for (const [key, pathUrl] of Object.entries(SAMPLES)) {
        if (fs.existsSync(pathUrl)) {
            log(`Sample [${key}] found: ${pathUrl}`);
        } else {
            log(`Sample [${key}] MISSING: ${pathUrl}`, 'WARNING');
        }
    }

    await testAudio();
    await testVideo();
    await testImage();
    await testPdfCore();
    await testPdfEdit();
    await testMarkdownToPdf();
    await testWordToPdf();
    await testQr();

    log('--- All Tests Completed ---');

    // Generate Report
    const reportContent = `
# Backend Feature Test Report
Date: ${new Date().toLocaleString()}

| Feature | Status | Details |
| :--- | :--- | :--- |
${reportEntries.join('\n')}

## Logs
\`\`\`
${logBuffer.join('\n')}
\`\`\`
`;
    fs.writeFileSync(REPORT_FILE, reportContent);
    console.log(`Report saved to ${REPORT_FILE}`);
}

main().catch(console.error);
