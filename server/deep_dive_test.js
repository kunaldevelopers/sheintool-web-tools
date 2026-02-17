const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:5000/api';
const REPORT_FILE = 'deep_dive_report.md';

const SAMPLES = {
    audio: path.resolve(__dirname, 'tests/samples/test_sample.mp3'),
    video: path.resolve(__dirname, 'tests/samples/test_sample.mp4'),
    image: path.resolve(__dirname, 'tests/test_output/converted.jpg'),
    pdf: path.resolve(__dirname, 'test_unlocked.pdf'),
    docx: path.resolve(__dirname, 'tests/samples/test_sample.docx'),
    md: path.resolve(__dirname, '../README.md'),
    protectedPdf: path.resolve(__dirname, 'test_protected.pdf'), // Password '123'
};

// Fallback logic
if (!fs.existsSync(SAMPLES.pdf)) {
    const files = fs.readdirSync(__dirname);
    const pdf = files.find(f => f.endsWith('.pdf') && !f.includes('protected'));
    if (pdf) SAMPLES.pdf = path.resolve(__dirname, pdf);
}

const logBuffer = [];
const reportEntries = [];

function log(message, type = 'INFO') {
    const timestamp = new Date().toLocaleTimeString();
    const logMsg = `[${timestamp}] [${type}] ${message}`;
    console.log(logMsg);
    logBuffer.push(logMsg);
}

function addToReport(category, feature, status, details = '') {
    // Escape pipes for markdown table
    const cleanDetails = details.replace(/\|/g, '\\|').replace(/\n/g, ' ');
    const entry = `| ${category} | ${feature} | ${status} | ${cleanDetails} |`;
    reportEntries.push(entry);
}

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
            headers: { ...form.getHeaders() },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        return { success: true, data: response.data };
    } catch (error) {
        let errMsg = error.message;
        if (error.response && error.response.data) {
            errMsg = JSON.stringify(error.response.data);
        }
        return { success: false, error: errMsg };
    }
}

// --- Test Suites ---

async function runMediaTests() {
    log('--- Media Tests ---');

    // Audio Formats
    const audioFormats = ['wav', 'ogg', 'm4a', 'flac', 'mp3']; // Testing re-conversion to mp3 too
    for (const fmt of audioFormats) {
        log(`Testing Audio -> ${fmt.toUpperCase()}...`);
        const res = await uploadFile('/convert/audio', SAMPLES.audio, 'file', { format: fmt });
        addToReport('Audio', `Convert to ${fmt.toUpperCase()}`, res.success ? 'PASS' : 'FAIL', res.error);
    }

    // Video Formats
    const videoFormats = ['mp4', 'avi', 'mov', 'flv', 'mkv', 'wmv'];
    for (const fmt of videoFormats) {
        log(`Testing Video -> ${fmt.toUpperCase()}...`);
        const res = await uploadFile('/convert/video', SAMPLES.video, 'file', { format: fmt });
        addToReport('Video', `Convert to ${fmt.toUpperCase()}`, res.success ? 'PASS' : 'FAIL', res.error);
    }

    // Image Formats
    const imageFormats = ['png', 'webp', 'gif', 'tiff', 'jpg'];
    for (const fmt of imageFormats) {
        log(`Testing Image -> ${fmt.toUpperCase()}...`);
        const res = await uploadFile('/convert/image', SAMPLES.image, 'file', { format: fmt });
        addToReport('Image', `Convert to ${fmt.toUpperCase()}`, res.success ? 'PASS' : 'FAIL', res.error);
    }
}

async function runPdfEditTests() {
    log('--- PDF Edit Tests ---');

    // Rotate
    const angles = [90, 180, 270];
    for (const angle of angles) {
        log(`Testing PDF Rotate ${angle}...`);
        const res = await uploadFile('/tools/pdf/edit/rotate', SAMPLES.pdf, 'file', { angle: angle });
        addToReport('PDF Edit', `Rotate ${angle}°`, res.success ? 'PASS' : 'FAIL', res.error);
    }

    // Watermark
    log('Testing PDF Watermark (Text/Opacity)...');
    const resWater = await uploadFile('/tools/pdf/edit/watermark', SAMPLES.pdf, 'file', {
        text: 'DEEP DIVE TEST',
        opacity: 0.3,
        size: 60
    });
    addToReport('PDF Edit', 'Watermark (Custom)', resWater.success ? 'PASS' : 'FAIL', resWater.error);

    // Page Numbers
    const positions = ['bottom-center', 'bottom-right'];
    for (const pos of positions) {
        log(`Testing PDF Page Numbers (${pos})...`);
        const res = await uploadFile('/tools/pdf/edit/pagenumbers', SAMPLES.pdf, 'file', { position: pos });
        addToReport('PDF Edit', `Page Numbers (${pos})`, res.success ? 'PASS' : 'FAIL', res.error);
    }

    // Organize
    log('Testing PDF Organize (Reorder)...');
    // Using simple reorder "1,1" to duplicate first page as test
    const resOrg = await uploadFile('/tools/pdf/edit/organize', SAMPLES.pdf, 'file', { pages: '1,1' });
    addToReport('PDF Edit', 'Organize (Reorder 1,1)', resOrg.success ? 'PASS' : 'FAIL', resOrg.error);
}

async function runPdfCoreTests() {
    log('--- PDF Core Tests ---');

    // Split
    const resSplit = await uploadFile('/tools/pdf/core/split', SAMPLES.pdf);
    addToReport('PDF Core', 'Split', resSplit.success ? 'PASS' : 'FAIL', resSplit.error);

    // Compress
    const resCompress = await uploadFile('/tools/pdf/core/compress', SAMPLES.pdf);
    addToReport('PDF Core', 'Compress', resCompress.success ? 'PASS' : 'FAIL', resCompress.error);

    // Protect
    const resProtect = await uploadFile('/tools/pdf/core/protect', SAMPLES.pdf, 'file', { password: 'safe' });
    addToReport('PDF Core', 'Protect (Set Pwd)', resProtect.success ? 'PASS' : 'FAIL', resProtect.error);

    // Unlock
    if (fs.existsSync(SAMPLES.protectedPdf)) {
        const resUnlock = await uploadFile('/tools/pdf/core/unlock', SAMPLES.protectedPdf, 'file', { password: '123' });
        addToReport('PDF Core', 'Unlock (Correct Pwd)', resUnlock.success ? 'PASS' : 'FAIL', resUnlock.error);

        // Negative Test: Wrong Password
        const resFail = await uploadFile('/tools/pdf/core/unlock', SAMPLES.protectedPdf, 'file', { password: 'wrong' });
        addToReport('PDF Core', 'Unlock (Wrong Pwd)', !resFail.success ? 'PASS' : 'FAIL', 'Expected Failure: ' + resFail.error);
    } else {
        addToReport('PDF Core', 'Unlock', 'SKIP', 'Missing protected sample');
    }
}

async function runUtilityTests() {
    log('--- Utility Tests ---');

    // QR
    try {
        const qrRes = await axios.post(`${BASE_URL}/tools/qr`, { text: 'https://sheintool.com' });
        addToReport('Utility', 'QR Generator', qrRes.data.qrImage ? 'PASS' : 'FAIL', '');
    } catch (e) {
        addToReport('Utility', 'QR Generator', 'FAIL', e.message);
    }

    // Zip Create
    // We need multiple files. Let's send audio and video samples
    if (fs.existsSync(SAMPLES.audio) && fs.existsSync(SAMPLES.video)) {
        const form = new FormData();
        form.append('files', fs.createReadStream(SAMPLES.audio));
        form.append('files', fs.createReadStream(SAMPLES.video));

        try {
            log('Testing Zip Creation...');
            await axios.post(`${BASE_URL}/tools/zip/create`, form, { headers: form.getHeaders() });
            addToReport('Utility', 'Zip Create', 'PASS', '');
        } catch (e) {
            addToReport('Utility', 'Zip Create', 'FAIL', e.message);
        }
    }

    // Doc conversion
    const resMD = await uploadFile('/tools/document/convert/md-to-pdf', SAMPLES.md);
    addToReport('Document', 'Markdown -> PDF', resMD.success ? 'PASS' : 'FAIL', resMD.error);

    const resWord = await uploadFile('/tools/pdf/extra/word-to-pdf', SAMPLES.docx);
    addToReport('Document', 'Word -> PDF', resWord.success ? 'PASS' : 'FAIL', resWord.error);

    // OCR
    const resOCR = await uploadFile('/tools/pdf/extra/scan', SAMPLES.image);
    addToReport('OCR', 'Scan Image', resOCR.success ? 'PASS' : 'FAIL', resOCR.error);
}

// --- Main Execution ---

async function main() {
    log('--- Starting Deep Dive Test Suite ---');

    await runMediaTests();
    await runPdfCoreTests();
    await runPdfEditTests();
    await runUtilityTests();

    // Generate Report
    const reportContent = `
# Deep Dive Analysis & Test Report
**Date**: ${new Date().toLocaleString()}

| Category | Feature / Sub-Feature | Status | Details |
| :--- | :--- | :--- | :--- |
${reportEntries.join('\n')}

## Raw Logs
\`\`\`
${logBuffer.join('\n')}
\`\`\`
`;
    fs.writeFileSync(REPORT_FILE, reportContent);
    console.log(`Deep Dive Report saved to ${REPORT_FILE}`);
}

main().catch(console.error);
