const { PDFDocument } = require('pdf-lib');
const packageJson = require('./package.json');

console.log('Package.json version spec:', packageJson.dependencies['pdf-lib']);

try {
    const pdfLibInfo = require('pdf-lib/package.json');
    console.log('Actual installed version:', pdfLibInfo.version);
} catch (e) {
    console.log('Could not read node_modules/pdf-lib/package.json');
}

console.log('PDFDocument.prototype.encrypt exists?', typeof PDFDocument.prototype.encrypt);

(async () => {
    const doc = await PDFDocument.create();
    console.log('Instance .encrypt exists?', typeof doc.encrypt);
})();
