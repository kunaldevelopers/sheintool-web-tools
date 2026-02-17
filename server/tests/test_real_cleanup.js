const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const os = require('os');

// Configuration
const BASE_URL = 'http://localhost:5000/api'; // Adjust if needed
const BASE_TEMP_DIR = path.join(os.tmpdir(), 'puppeteer-jobs'); // Must match utils

// Samples - Ensure these exist or create minimal ones
const DO_SAMPLES_EXIST = true; // We'll create temporary ones if needed
const SAMPLE_MD = path.join(__dirname, 'temp_test.md');
const SAMPLE_DOCX = path.join(__dirname, 'samples/test_sample.docx'); // Assuming this exists from test_features.js
const SAMPLE_PDF = path.join(__dirname, 'temp_test.pdf'); // For OCR

// Helper: Create dummy file
function createDummyMd() {
    fs.writeFileSync(SAMPLE_MD, '# Hello World\nThis is a test markdown file.');
}

// Helper: Check temp dir count
function countPuppeteerJobs() {
    if (!fs.existsSync(BASE_TEMP_DIR)) return 0;
    return fs.readdirSync(BASE_TEMP_DIR).length;
}

// Helper: Upload file
async function uploadFile(endpoint, filePath) {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    try {
        const res = await axios.post(`${BASE_URL}${endpoint}`, form, {
            headers: form.getHeaders(),
            responseType: 'arraybuffer' // We expect a file download
        });
        return { success: true, size: res.data.length };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function runRealWorldTest() {
    console.log('--- STARTING REAL-WORLD INTEGRATION TEST ---');
    console.log(`Target: ${BASE_URL}`);

    // 1. Setup
    createDummyMd();
    const initialJobs = countPuppeteerJobs();
    console.log(`Initial Jobs in Temp: ${initialJobs}`);

    // 2. Test Markdown to PDF (Uses Puppeteer)
    console.log('\n[TEST] Converting Markdown to PDF...');

    // We launch the request asynchronously
    const reqPromise = uploadFile('/tools/document/convert/md-to-pdf', SAMPLE_MD);

    // Wait a bit to see if job folder appears (1 sec)
    await new Promise(r => setTimeout(r, 1000));
    const currentJobs = countPuppeteerJobs();
    console.log(`   Jobs during execution: ${currentJobs} (Expected > ${initialJobs})`);

    if (currentJobs <= initialJobs) {
        console.warn('   ⚠️  WARNING: No new job folder detected during execution. Is it too fast?');
    } else {
        console.log('   ✅ Job folder verified during execution.');
    }

    // Wait for completion
    const result = await reqPromise;

    if (result.success) {
        console.log(`   ✅ Conversion Successful. Downloaded ${result.size} bytes.`);
    } else {
        console.error(`   ❌ Conversion Failed: ${result.error}`);
        // process.exit(1); // Don't exit, check cleanup anyway
    }

    // 3. Verify Cleanup
    // Wait a moment for cleanup to finish
    await new Promise(r => setTimeout(r, 2000));

    const finalJobs = countPuppeteerJobs();
    console.log(`FINAL Jobs in Temp: ${finalJobs}`);

    if (finalJobs > initialJobs) {
        console.error(`❌ FAILURE: Cleanup NOT performed. Leaked ${finalJobs - initialJobs} job(s).`);

        // List them
        const files = fs.readdirSync(BASE_TEMP_DIR);
        console.log('Leaked files:', files);
    } else {
        console.log('✅ SUCCESS: Cleanup verified. No leaked jobs.');
    }

    // Cleanup local temp file
    if (fs.existsSync(SAMPLE_MD)) fs.unlinkSync(SAMPLE_MD);

    console.log('\n--- TEST COMPLETE ---');
}

runRealWorldTest().catch(console.error);
