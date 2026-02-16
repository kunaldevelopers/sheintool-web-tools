const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const API_URL = 'http://localhost:5000/api';
const SAMPLES_DIR = path.join(__dirname, 'samples');
const OUT_DIR = path.join(__dirname, 'test_output');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

const results = [];

async function runTest(name, category, fn) {
    process.stdout.write(`Testing ${category}: ${name}... `);
    const start = Date.now();
    try {
        await fn();
        const duration = Date.now() - start;
        console.log(`✅ PASS (${duration}ms)`);
        results.push({ name, category, status: 'PASS', duration });
    } catch (error) {
        const duration = Date.now() - start;
        console.log(`❌ FAIL (${duration}ms)`);
        console.error(`   Error: ${error.message}`);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data: ${JSON.stringify(error.response.data)}`);
        }
        results.push({ name, category, status: 'FAIL', duration, error: error.message });
    }
}

async function uploadFile(endpoint, filePath, fieldName = 'file', extraFields = {}) {
    const form = new FormData();
    form.append(fieldName, fs.createReadStream(filePath));
    for (const [key, value] of Object.entries(extraFields)) {
        form.append(key, value);
    }

    const response = await axios.post(`${API_URL}${endpoint}`, form, {
        headers: { ...form.getHeaders() },
        responseType: 'arraybuffer' // We expect files back
    });

    return response;
}

(async () => {
    console.log('🚀 Starting Audit Tests...\n');

    // --- PDF TOOLS ---
    await runTest('Merge PDF', 'PDF Tools', async () => {
        const form = new FormData();
        form.append('files', fs.createReadStream(path.join(SAMPLES_DIR, 'test_sample.pdf')));
        form.append('files', fs.createReadStream(path.join(SAMPLES_DIR, 'test_sample_2.pdf')));

        const res = await axios.post(`${API_URL}/tools/pdf/core/merge`, form, {
            headers: { ...form.getHeaders() },
            responseType: 'arraybuffer'
        });

        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        if (res.data.length === 0) throw new Error('Empty output');
        fs.writeFileSync(path.join(OUT_DIR, 'merged.pdf'), res.data);
    });

    await runTest('Split PDF', 'PDF Tools', async () => {
        const res = await uploadFile('/tools/pdf/core/split', path.join(SAMPLES_DIR, 'test_sample_2.pdf'));
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        // Should be a zip
        if (res.headers['content-type'] !== 'application/zip') throw new Error('Not a zip file');
        fs.writeFileSync(path.join(OUT_DIR, 'split.zip'), res.data);
    });

    await runTest('Compress PDF', 'PDF Tools', async () => {
        const res = await uploadFile('/tools/pdf/core/compress', path.join(SAMPLES_DIR, 'test_sample.pdf'));
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        // Backend returns JSON with download URL? No, controller sends download.
        // wait, previous view_file of compressPDF says: res.download OR res.json based on version?
        // Let's check recent implementation_plan: "Updated compressPDF... res.download(outputPath)"
        // So we expect binary.
        fs.writeFileSync(path.join(OUT_DIR, 'compressed.pdf'), res.data);
    });

    await runTest('Protect PDF', 'PDF Tools', async () => {
        const res = await uploadFile('/tools/pdf/core/protect', path.join(SAMPLES_DIR, 'test_sample.pdf'), 'file', { password: 'test' });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        fs.writeFileSync(path.join(OUT_DIR, 'protected.pdf'), res.data);
    });

    // Need protected file for Unlock test. Use output if exists, else skip with warning?
    // We can just rely on setup_samples if we created one, or assume protect works. 
    // Actually we just created 'protected.pdf' in tests.
    await runTest('Unlock PDF', 'PDF Tools', async () => {
        if (!fs.existsSync(path.join(OUT_DIR, 'protected.pdf'))) throw new Error('Protected PDF not found (Protect test failed?)');

        const res = await uploadFile('/tools/pdf/core/unlock', path.join(OUT_DIR, 'protected.pdf'), 'file', { password: 'test' });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        fs.writeFileSync(path.join(OUT_DIR, 'unlocked.pdf'), res.data);
    });

    await runTest('Rotate PDF', 'PDF Tools', async () => {
        const res = await uploadFile('/tools/pdf/edit/rotate', path.join(SAMPLES_DIR, 'test_sample.pdf'), 'file', { angle: 90 });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        fs.writeFileSync(path.join(OUT_DIR, 'rotated.pdf'), res.data);
    });

    // --- CONVERSION TOOLS ---
    await runTest('Markdown to PDF', 'Conversion', async () => {
        const res = await uploadFile('/tools/document/convert/md-to-pdf', path.join(SAMPLES_DIR, 'test_sample.md'));
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        fs.writeFileSync(path.join(OUT_DIR, 'md_converted.pdf'), res.data);
    });

    await runTest('PDF to Markdown', 'Conversion', async () => {
        const res = await uploadFile('/tools/document/convert/pdf-to-md', path.join(SAMPLES_DIR, 'test_sample.pdf'));
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        fs.writeFileSync(path.join(OUT_DIR, 'pdf_converted.md'), res.data);
    });

    await runTest('Word to PDF', 'Conversion', async () => {
        const res = await uploadFile('/tools/pdf/extra/word-to-pdf', path.join(SAMPLES_DIR, 'test_sample.docx'));
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        fs.writeFileSync(path.join(OUT_DIR, 'word_converted.pdf'), res.data);
    });

    await runTest('Image to PDF', 'Conversion', async () => {
        const form = new FormData();
        form.append('files', fs.createReadStream(path.join(SAMPLES_DIR, 'test_sample.png')));

        const res = await axios.post(`${API_URL}/tools/pdf/extra/image-to-pdf`, form, {
            headers: { ...form.getHeaders() },
            responseType: 'arraybuffer'
        });

        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        fs.writeFileSync(path.join(OUT_DIR, 'image_converted.pdf'), res.data);
    });

    // --- OCR ---
    await runTest('OCR (Image)', 'Conversion', async () => {
        const res = await uploadFile('/tools/pdf/extra/scan', path.join(SAMPLES_DIR, 'test_sample.png'));
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        fs.writeFileSync(path.join(OUT_DIR, 'ocr_output.txt'), res.data);
    });

    // OCR PDF
    await runTest('OCR (PDF)', 'Conversion', async () => {
        // Create a text pdf (which we have), render -> ocr.
        const res = await uploadFile('/tools/pdf/extra/scan', path.join(SAMPLES_DIR, 'test_sample.pdf'));
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        fs.writeFileSync(path.join(OUT_DIR, 'ocr_pdf_output.txt'), res.data);
    });


    // --- MEDIA TOOLS ---
    await runTest('Image Converter', 'Media', async () => {
        const res = await uploadFile('/convert/image', path.join(SAMPLES_DIR, 'test_sample.png'), 'file', { format: 'jpg' });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        fs.writeFileSync(path.join(OUT_DIR, 'converted.jpg'), res.data);
    });

    await runTest('Video Converter', 'Media', async () => {
        // Convert mp4 to avi
        const res = await uploadFile('/convert/video', path.join(SAMPLES_DIR, 'test_sample.mp4'), 'file', { format: 'avi' });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        fs.writeFileSync(path.join(OUT_DIR, 'converted.avi'), res.data);
    });

    await runTest('Audio Converter', 'Media', async () => {
        // Convert mp3 to wav
        const res = await uploadFile('/convert/audio', path.join(SAMPLES_DIR, 'test_sample.mp3'), 'file', { format: 'wav' });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        fs.writeFileSync(path.join(OUT_DIR, 'converted.wav'), res.data);
    });
    await runTest('Zip Create', 'Utilities', async () => {
        const form = new FormData();
        form.append('files', fs.createReadStream(path.join(SAMPLES_DIR, 'test_sample.png')));
        form.append('files', fs.createReadStream(path.join(SAMPLES_DIR, 'test_file.txt')));

        const res = await axios.post(`${API_URL}/tools/zip/create`, form, {
            headers: { ...form.getHeaders() },
            responseType: 'arraybuffer'
        });

        if (res.headers['content-type'] !== 'application/zip') throw new Error('Not a zip file');
        fs.writeFileSync(path.join(OUT_DIR, 'created.zip'), res.data);
    });

    await runTest('QR Generator', 'Utilities', async () => {
        const res = await axios.post(`${API_URL}/tools/qr`, { text: 'https://google.com' });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        if (!res.data.qrImage) throw new Error('No QR image in response');
        // It returns JSON { qrImage: dataUrl }
    });

    // All tests active.

    // REPORT
    console.log('\n--- AUDIT REPORT ---');
    console.log(`Total Tests: ${results.length}`);
    console.log(`Passed: ${results.filter(r => r.status === 'PASS').length}`);
    console.log(`Failed: ${results.filter(r => r.status === 'FAIL').length}`);

    fs.writeFileSync(path.join(OUT_DIR, 'audit_results.json'), JSON.stringify(results, null, 2));

})();
