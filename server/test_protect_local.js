const muhammara = require('muhammara');
const fs = require('fs');
const path = require('path');

const testFile = 'C:\\Users\\Kunal\\Downloads\\New folder (40)\\sheintool\\testpdf.pdf';
const outputFile = './test_protected.pdf';
const password = '123';

console.log('Testing PDF Protection with Muhammara...');

if (!fs.existsSync(testFile)) {
    console.error('Test file not found:', testFile);
    // Create a dummy PDF if user file missing
    const { PDFDocument } = require('pdf-lib');
    (async () => {
        const doc = await PDFDocument.create();
        doc.addPage();
        const bytes = await doc.save();
        fs.writeFileSync('dummy.pdf', bytes);
        runTest('dummy.pdf');
    })();
} else {
    runTest(testFile);
}

function runTest(filePath) {
    try {
        muhammara.recrypt(
            filePath,
            outputFile,
            {
                userPassword: password,
                ownerPassword: password,
                userProtectionFlag: 4 // print allowed
            }
        );
        console.log('✅ Protection successful! Output:', outputFile);
        if (fs.existsSync(outputFile)) {
            console.log('File created.');
        }
    } catch (e) {
        console.error('❌ Protection failed:', e);
    }
}
