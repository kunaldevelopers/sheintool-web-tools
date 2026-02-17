const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const pidusage = require('pidusage');

const API_URL = 'http://localhost:5000/api';
const SAMPLES_DIR = path.join(__dirname, 'samples');
const DURATION_MS = 5 * 60 * 1000; // 5 minutes test
// To change users, pass argument: node stress_test.js 100
const CONCURRENT_USERS = parseInt(process.argv[2]) || 100;

console.log(`🚀 Starting Load Test with ${CONCURRENT_USERS} concurrent users for ${(DURATION_MS / 1000 / 60).toFixed(1)} minutes...`);

/* 
  Distribution:
  - 40% PDF (Merge, Split, Compress)
  - 25% Image (Image to PDF, Convert)
  - 15% Audio (Convert MP3)
  - 10% Video (Convert MP4)
  - 10% OCR / Word (Puppeteer)
*/

const stats = {
    totalRequests: 0,
    success: 0,
    failures: 0,
    errors: {},
    responseTimes: [],
    toolUsage: {}
};

// Helper: Pick random task based on prob
const TASKS = [
    { name: 'Merge PDF', weight: 15, fn: runMergePdf },
    { name: 'Split PDF', weight: 10, fn: runSplitPdf },
    { name: 'Compress PDF', weight: 15, fn: runCompressPdf },
    { name: 'Image to PDF', weight: 15, fn: runImageToPdf },
    { name: 'Convert Image', weight: 10, fn: runConvertImage },
    { name: 'Convert Audio', weight: 15, fn: runConvertAudio }, // Heavy FFmpeg
    { name: 'Convert Video', weight: 10, fn: runConvertVideo }, // Super Heavy FFmpeg
    { name: 'OCR Image', weight: 5, fn: runOcrImage },          // Heavy Tesseract
    { name: 'Word to PDF', weight: 5, fn: runWordToPdf }        // Heavy Puppeteer
];

function pickTask() {
    const totalWeight = TASKS.reduce((acc, t) => acc + t.weight, 0); // Should be 100
    let random = Math.random() * totalWeight;
    for (const task of TASKS) {
        if (random < task.weight) return task;
        random -= task.weight;
    }
    return TASKS[0];
}

async function uploadFile(endpoint, filePath, fieldName = 'file', extraFields = {}) {
    try {
        const form = new FormData();
        form.append(fieldName, fs.createReadStream(filePath));
        for (const [key, value] of Object.entries(extraFields)) {
            form.append(key, value);
        }

        const start = Date.now();
        const response = await axios.post(`${API_URL}${endpoint}`, form, {
            headers: { ...form.getHeaders() },
            responseType: 'arraybuffer',
            timeout: 60000 // 60s timeout for heavy tasks
        });
        const duration = Date.now() - start;
        return { success: true, duration, status: response.status };
    } catch (error) {
        const duration = Date.now() - (error.config?.metadata?.startTime || Date.now());
        return {
            success: false,
            duration,
            status: error.response?.status || 0,
            message: error.message,
            data: error.response?.data ? error.response.data.toString() : null
        };
    }
}

// Task Implementations
async function runMergePdf() {
    const form = new FormData();
    form.append('files', fs.createReadStream(path.join(SAMPLES_DIR, 'test_sample.pdf')));
    form.append('files', fs.createReadStream(path.join(SAMPLES_DIR, 'test_sample_2.pdf')));
    const start = Date.now();
    try {
        await axios.post(`${API_URL}/tools/pdf/core/merge`, form, { headers: form.getHeaders(), responseType: 'arraybuffer', timeout: 30000 });
        return { success: true, duration: Date.now() - start };
    } catch (e) { return { success: false, duration: Date.now() - start, message: e.message }; }
}

async function runSplitPdf() {
    return uploadFile('/tools/pdf/core/split', path.join(SAMPLES_DIR, 'test_sample_2.pdf'));
}

async function runCompressPdf() {
    return uploadFile('/tools/pdf/core/compress', path.join(SAMPLES_DIR, 'test_sample.pdf'));
}

async function runImageToPdf() {
    const form = new FormData();
    form.append('files', fs.createReadStream(path.join(SAMPLES_DIR, 'test_sample.png')));
    const start = Date.now();
    try {
        await axios.post(`${API_URL}/tools/pdf/extra/image-to-pdf`, form, { headers: form.getHeaders(), responseType: 'arraybuffer', timeout: 30000 });
        return { success: true, duration: Date.now() - start };
    } catch (e) { return { success: false, duration: Date.now() - start, message: e.message }; }
}

async function runConvertImage() {
    return uploadFile('/convert/image', path.join(SAMPLES_DIR, 'test_sample.png'), 'file', { format: 'jpg' });
}

async function runConvertAudio() {
    return uploadFile('/convert/audio', path.join(SAMPLES_DIR, 'test_sample.mp3'), 'file', { format: 'wav' });
}

async function runConvertVideo() {
    return uploadFile('/convert/video', path.join(SAMPLES_DIR, 'test_sample.mp4'), 'file', { format: 'avi' });
}

async function runOcrImage() {
    return uploadFile('/tools/pdf/extra/scan', path.join(SAMPLES_DIR, 'test_sample.png'));
}

async function runWordToPdf() {
    // We don't have a docx sample in standard setup_samples? Wait, we added one. 'test_sample.docx'
    // But setup_samples said "Minimal valid docx... risky". Let's assume it works since Audit passed.
    return uploadFile('/tools/pdf/extra/word-to-pdf', path.join(SAMPLES_DIR, 'test_sample.docx'));
}

// Simulation Loop
const startTime = Date.now();
const endTime = startTime + DURATION_MS;
let activeUsers = 0;

async function simulateUser(id) {
    activeUsers++;
    while (Date.now() < endTime) {
        const task = pickTask();
        // Log usage (approx)
        if (!stats.toolUsage[task.name]) stats.toolUsage[task.name] = 0;
        stats.toolUsage[task.name]++;

        // Execute
        const result = await task.fn();

        stats.totalRequests++;
        if (result.success) {
            stats.success++;
            stats.responseTimes.push(result.duration);
        } else {
            stats.failures++;
            // Log status code if available
            const errorKey = result.status ? `Status ${result.status}` : (result.message || 'Unknown Error');
            if (!stats.errors[errorKey]) stats.errors[errorKey] = 0;
            stats.errors[errorKey]++;

            // Debug first 5 errors to console
            if (stats.failures < 5) {
                console.log('--- Failure Debug ---');
                console.log(result);
            }
        }

        // Slight Random Delay between requests (0.5s - 2s) to be realistic
        await new Promise(r => setTimeout(r, 500 + Math.random() * 1500));
    }
    activeUsers--;
}

// Start Users
(async () => {
    // Launch users in bursts
    const promises = [];
    for (let i = 0; i < CONCURRENT_USERS; i++) {
        promises.push(simulateUser(i));
        // Stagger start slightly to avoid instant death spike
        if (i % 10 === 0) await new Promise(r => setTimeout(r, 200));
    }

    // Monitor Loop
    const monitorInterval = setInterval(async () => {
        const elapsed = (Date.now() - startTime) / 1000;
        const avg = stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length || 0;

        console.log(`[${elapsed.toFixed(0)}s] Users: ${activeUsers} | Req: ${stats.totalRequests} | Fail: ${stats.failures} | Avg Resp: ${avg.toFixed(0)}ms`);

        // Try to get server PID stats if possible?
        // We assume server is running on port 5000. Finding PID is hard from pure node client without specific lookup tool.
        // We'll skip process monitoring inside this script for now and rely on "Response Time spike" as proxy for load.
    }, 5000);

    await Promise.all(promises);
    clearInterval(monitorInterval);

    console.log('\n--- LOAD TEST COMPLETE ---');
    console.log(`Duration: ${(Date.now() - startTime) / 1000}s`);
    console.log(`Concurrent Users: ${CONCURRENT_USERS}`);
    console.log(`Total Requests: ${stats.totalRequests}`);
    console.log(`Success: ${stats.success}`);
    console.log(`Failures: ${stats.failures}`);
    console.log(`Avg Response Time: ${(stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length || 0).toFixed(0)}ms`);

    console.log('\nError Breakdown:');
    console.log(stats.errors);

    console.log('\nTool Usage:');
    console.log(stats.toolUsage);

    // Save report to file
    const report = {
        users: CONCURRENT_USERS,
        total: stats.totalRequests,
        success: stats.success,
        failures: stats.failures,
        avgResponse: (stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length || 0).toFixed(0),
        errors: stats.errors,
        toolUsage: stats.toolUsage
    };
    fs.writeFileSync(`load_test_results_${CONCURRENT_USERS}.json`, JSON.stringify(report, null, 2));

})();
