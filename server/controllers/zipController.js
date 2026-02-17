const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');

exports.createZip = (req, res) => {
    if (!req.files || req.files.length === 0) {
        console.error('❌ Zip Request received but no files uploaded.');
        return res.status(400).json({ error: 'No files uploaded' });
    }

    console.log('--- Zip Creation Request ---');
    console.log(`📂 Files Count: ${req.files.length}`);
    req.files.forEach(f => console.log(`   - ${f.originalname} (${(f.size / 1024).toFixed(2)} KB)`));

    try {
        console.log('🔄 Creating Archive...');
        const zip = new AdmZip();
        req.files.forEach(file => {
            zip.addLocalFile(file.path, '', file.originalname);
        });

        const buffer = zip.toBuffer();
        const downloadName = `archive_${Date.now()}.zip`;

        console.log(`✅ Zip Created: ${downloadName}`);
        console.log('⬇️  Sending file to client...');

        // Cleanup input files
        req.files.forEach(file => {
            fs.unlink(file.path, () => { });
        });

        res.set('Content-Type', 'application/zip');
        res.set('Content-Disposition', `attachment; filename=${downloadName}`);
        res.set('Content-Length', buffer.length);
        res.send(buffer);
        console.log('✨ Transaction Complete.');

    } catch (error) {
        console.error('❌ Zip creation error:', error);
        res.status(500).json({ error: 'Failed to create zip' });
    }
};

exports.extractZip = (req, res) => {
    if (!req.file) {
        console.error('❌ Extract Request received but no zip uploaded.');
        return res.status(400).json({ error: 'No zip uploaded' });
    }

    console.log('--- Zip Extraction Request ---');
    console.log(`📂 Archive: ${req.file.originalname}`);
    console.log(`⚖️  Size: ${(req.file.size / 1024).toFixed(2)} KB`);

    try {
        console.log('🔄 Reading Archive...');
        const zip = new AdmZip(req.file.path);
        const zipEntries = zip.getEntries();

        // Create a unique folder for extraction to avoid collisions
        const extractDirName = `extracted_${Date.now()}`;
        const outputDir = path.join(__dirname, '../uploads', extractDirName);

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        console.log(`🔄 Extracting to: ${outputDir}`);
        zip.extractAllTo(outputDir, true);

        // Generate Download URLs
        const protocol = req.protocol;
        const host = req.get('host');
        const baseUrl = `${protocol}://${host}/uploads/${extractDirName}`;

        const fileList = zipEntries
            .filter(entry => !entry.isDirectory)
            .map(entry => {
                // Return object with name and url
                return {
                    name: entry.entryName,
                    url: `${baseUrl}/${entry.entryName}`
                };
            });

        console.log(`✅ Extracted ${fileList.length} files.`);

        // Cleanup uploaded zip
        fs.unlink(req.file.path, () => { });

        res.json({
            message: 'Extraction successful',
            base_url: baseUrl,
            files: fileList
        });
        console.log('✨ Transaction Complete.');

    } catch (error) {
        console.error('❌ Extract error:', error);
        if (fs.existsSync(req.file.path)) fs.unlink(req.file.path, () => { });
        res.status(500).json({ error: 'Failed to extract zip', details: error.message });
    }
};
