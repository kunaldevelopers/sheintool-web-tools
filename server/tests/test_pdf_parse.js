const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const pdfPath = path.join(__dirname, 'samples', 'test_sample.pdf');

(async () => {
    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdf(dataBuffer);
        console.log('PDF Text:', data.text);
    } catch (error) {
        console.error('PDF Parse Error:', error);
    }
})();
