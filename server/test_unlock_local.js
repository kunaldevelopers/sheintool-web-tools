const muhammara = require('muhammara');
const fs = require('fs');
const path = require('path');

// User provided file and password
const testFile = 'C:\\Users\\Kunal\\Downloads\\New folder (40)\\sheintool\\merged_converted (1)_converted.pdf';
const outputFile = './test_unlocked.pdf';
const password = '1122';

console.log('Testing PDF Unlock with Muhammara...');

if (!fs.existsSync(testFile)) {
    console.error('Test file not found:', testFile);
    process.exit(1);
}

try {
    // muhammara.recrypt can be used to changes security settings. 
    // passing no protection settings *should* remove encryption if we provide the correct password?
    // Actually, recrypt takes (sourcePath, destPath, encryptionOptions).
    // If encryptionOptions is usually to ADD security. How to REMOVE?
    // With recrypt, if we don't pass protection options but pass the input password...
    // Wait, muhammara documentation says to remove security, we might need to recreate the file.

    // Let's try recrypt with empty new security?
    // Or maybe just create a new PDF, copy pages from encrypted one (supplied with password).

    // Approach 1: Recrypt
    /*
    muhammara.recrypt(
        testFile,
        outputFile,
        // options
        {
           password: password // input password?? No, recrypt arg 3 is NEW protection.
        }
    );
    */

    // Correct Approach likely:
    // Create a writer for a new file.
    // Create a copying context from the old file (with password).
    // Copy all pages.
    // End PDF.

    const writer = muhammara.createWriter(outputFile);
    const context = writer.createPDFCopyingContext(testFile, { password: password });

    // Get page count
    // muhammara doesn't have a simple getPageCount on the copying context directly easily exposed same as modifying?
    // We can parse it.

    const parser = context.getSourceDocumentParser();
    const pageCount = parser.getPagesCount();

    console.log(`Unlocking ${pageCount} pages...`);

    for (let i = 0; i < pageCount; i++) {
        context.appendPDFPageFromPDF(i);
    }

    writer.end();

    console.log('✅ Unlock successful! Output:', outputFile);
    if (fs.existsSync(outputFile)) {
        console.log('File created.');
    }

} catch (e) {
    console.error('❌ Unlock failed:', e);
}
