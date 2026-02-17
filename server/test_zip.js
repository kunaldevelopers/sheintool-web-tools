const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:5000/api';
const SAMPLE_ZIP = path.resolve(__dirname, 'tests/samples/test_zip_sample.zip');
const DUMMY_FILE = path.resolve(__dirname, 'tests/samples/dummy.txt');

async function testZipExtraction() {
    console.log('--- Testing Zip Extraction & Download ---');

    // 1. Create a dummy zip file for testing
    if (!fs.existsSync(path.dirname(DUMMY_FILE))) fs.mkdirSync(path.dirname(DUMMY_FILE), { recursive: true });
    fs.writeFileSync(DUMMY_FILE, 'This is a test file for zip extraction.');

    // We need to create a zip first. Let's use the 'create' endpoint for that too, or just mock it if we had a zip.
    // Let's assume we can create one using the previously tested create endpoint.
    console.log('1. Creating a temporary zip file...');
    const formCreate = new FormData();
    formCreate.append('files', fs.createReadStream(DUMMY_FILE));

    let zipPath = SAMPLE_ZIP;

    try {
        const createRes = await axios.post(`${BASE_URL}/tools/zip/create`, formCreate, {
            headers: createResHeaders = formCreate.getHeaders(),
            responseType: 'arraybuffer'
        });
        fs.writeFileSync(zipPath, createRes.data);
        console.log('✅ Temporary zip created.');
    } catch (err) {
        console.error('❌ Failed to create temp zip:', err.message);
        return;
    }

    // 2. Upload and Extract
    console.log('2. Uploading Zip for Extraction...');
    const formExtract = new FormData();
    formExtract.append('file', fs.createReadStream(zipPath));

    try {
        const res = await axios.post(`${BASE_URL}/tools/zip/extract`, formExtract, {
            headers: formExtract.getHeaders()
        });

        console.log('✅ Extraction Response Received.');
        console.log(JSON.stringify(res.data, null, 2));

        if (res.data.files && res.data.files.length > 0 && res.data.files[0].url) {
            console.log('✅ URL found in response.');
            const fileUrl = res.data.files[0].url;

            // 3. Verify Download
            console.log(`3. Verifying Download from URL: ${fileUrl}`);
            const dlRes = await axios.get(fileUrl);
            if (dlRes.status === 200) {
                console.log('✅ Download Successful! Feature Verified.');
            } else {
                console.log(`❌ Download Failed with status: ${dlRes.status}`);
            }

        } else {
            console.error('❌ No files or URLs found in response.');
        }

    } catch (err) {
        console.error('❌ Extraction Test Failed:', err.message);
        if (err.response) console.error(err.response.data);
    }

    // Cleanup
    if (fs.existsSync(DUMMY_FILE)) fs.unlinkSync(DUMMY_FILE);
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
}

testZipExtraction();
