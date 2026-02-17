const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:5000/api/tools/pdf/advanced-editor';
const SAMPLE_PDF = path.resolve(__dirname, '../test_unlocked.pdf'); // Corrected path
const OUTPUT_DIR = path.resolve(__dirname, '../test_output');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function runTest() {
    console.log('--- Starting Advanced PDF Editor Backend Test ---');

    // 1. Upload
    console.log('1. Uploading PDF...');
    if (!fs.existsSync(SAMPLE_PDF)) {
        console.error('Sample PDF not found:', SAMPLE_PDF);
        return;
    }

    const form = new FormData();
    form.append('file', fs.createReadStream(SAMPLE_PDF));

    let uploadRes;
    try {
        uploadRes = await axios.post(`${BASE_URL}/upload`, form, { headers: form.getHeaders() });
        console.log('Upload Success:', uploadRes.data);
    } catch (e) {
        console.error('Upload Failed:', e.message);
        return;
    }

    const filePath = uploadRes.data.filePath;

    // 2. Apply Changes
    console.log('2. Applying Changes...');

    // Mock Payload replicating frontend structure
    const changes = {
        pages: {
            "0": { // Edit Page 1 (Index 0)
                objects: [
                    {
                        type: 'text',
                        text: 'TEST TITLE ADDED',
                        left: 50,
                        top: 50,
                        fontSize: 24,
                        fill: '#ff0000', // Red
                        angle: 0,
                        scaleX: 1, scaleY: 1
                    },
                    {
                        type: 'rect', // Whiteout
                        left: 100,
                        top: 200,
                        width: 200,
                        height: 50,
                        fill: '#ffffff', // White
                        angle: 0,
                        scaleX: 1, scaleY: 1
                    }
                ]
            }
        },
        pageOrder: [0] // Keep page 1, verify we can just save it. (Assuming sample has >= 1 page)
    };

    try {
        const applyRes = await axios.post(`${BASE_URL}/apply-changes`, {
            filePath: filePath,
            changes: changes
        });
        console.log('Apply Changes Success:', applyRes.data);
        console.log('Download URL:', `http://localhost:5000${applyRes.data.downloadUrl}`);
    } catch (e) {
        console.error('Apply Changes Failed:', e.response ? e.response.data : e.message);
    }
}

runTest();
