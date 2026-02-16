const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const API_URL = 'http://localhost:5000/api';
const SAMPLES_DIR = path.join(__dirname, 'samples');

async function uploadFile(endpoint, filePath, fieldName = 'file', extraFields = {}) {
    try {
        const form = new FormData();
        form.append(fieldName, fs.createReadStream(filePath));
        for (const [key, value] of Object.entries(extraFields)) {
            form.append(key, value);
        }

        console.log(`Testing ${endpoint}...`);
        const response = await axios.post(`${API_URL}${endpoint}`, form, {
            headers: { ...form.getHeaders() },
            responseType: 'arraybuffer'
        });
        console.log(`✅ Success: ${response.status}`);
        return response;
    } catch (error) {
        console.error(`❌ Error in ${endpoint}:`);
        console.error(`Status: ${error.response?.status}`);
        if (error.response?.data) {
            const data = Buffer.isBuffer(error.response.data) ? error.response.data.toString() : error.response.data;
            try {
                const json = JSON.parse(data);
                const errorDetails = JSON.stringify(json, null, 2);
                console.error('Error Details:', errorDetails);
                fs.writeFileSync('debug_error_log.txt', errorDetails + '\n', { flag: 'a' });
            } catch (e) {
                console.error('Raw Data:', data);
                fs.writeFileSync('debug_error_log.txt', data + '\n', { flag: 'a' });
            }
        } else {
            console.error('Message:', error.message);
            fs.writeFileSync('debug_error_log.txt', error.message + '\n', { flag: 'a' });
        }
    }
}

(async () => {
    // Debug PDF to Markdown
    await uploadFile('/tools/document/convert/pdf-to-md', path.join(SAMPLES_DIR, 'test_sample.pdf'));

    // Debug Video Converter
    await uploadFile('/convert/video', path.join(SAMPLES_DIR, 'test_sample.mp4'), 'file', { format: 'avi' });

})();
