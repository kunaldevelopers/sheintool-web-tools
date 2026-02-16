const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

// Helper to cleanup files
const cleanup = (files) => {
    files.forEach(f => {
        if (fs.existsSync(f)) fs.unlink(f, () => { });
    });
};

exports.mergePDFs = async (req, res) => {
    if (!req.files || req.files.length < 2) {
        return res.status(400).json({ error: 'At least 2 PDF files are required' });
    }

    console.log('--- Merge PDF Request ---');
    console.log(`📂 Files: ${req.files.length}`);

    try {
        const mergedPdf = await PDFDocument.create();

        for (const file of req.files) {
            const pdfBytes = fs.readFileSync(file.path);
            const pdf = await PDFDocument.load(pdfBytes);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        const pdfBytes = await mergedPdf.save();
        const downloadName = `merged_${Date.now()}.pdf`;
        const outputPath = path.join('uploads', downloadName);

        fs.writeFileSync(outputPath, pdfBytes);

        console.log(`✅ Merge Successful: ${downloadName}`);

        req.files.forEach(f => fs.unlink(f.path, () => { })); // Cleanup inputs

        res.download(outputPath, downloadName, (err) => {
            fs.unlink(outputPath, () => { });
            if (err) console.error('Download error:', err);
        });

    } catch (error) {
        console.error('Merge error:', error);
        cleanup(req.files.map(f => f.path));
        res.status(500).json({ error: 'Merge failed', details: error.message });
    }
};

exports.splitPDF = async (req, res) => {
    // Splits all pages into individual files (zipped) or specific range?
    // User asked for "page range / extract pages".
    // For MVP, let's implement "Extract All Pages" into a Zip.

    if (!req.file) return res.status(400).json({ error: 'No PDF uploaded' });

    console.log('--- Split PDF Request ---');
    console.log(`📂 File: ${req.file.originalname}`);

    // TODO: Implement Split Logic (using adm-zip to package result)
    // NOTE: This requires 'adm-zip' which we have.
    const AdmZip = require('adm-zip');

    try {
        const pdfBytes = fs.readFileSync(req.file.path);
        const pdf = await PDFDocument.load(pdfBytes);
        const zip = new AdmZip();

        const pageCount = pdf.getPageCount();
        console.log(`📄 Pages: ${pageCount}`);

        for (let i = 0; i < pageCount; i++) {
            const newPdf = await PDFDocument.create();
            const [copiedPage] = await newPdf.copyPages(pdf, [i]);
            newPdf.addPage(copiedPage);
            const newPdfBytes = await newPdf.save();

            const pageName = `${path.parse(req.file.originalname).name}_page_${i + 1}.pdf`;
            zip.addFile(pageName, Buffer.from(newPdfBytes));
        }

        const zipBuffer = zip.toBuffer();
        const downloadName = `split_${Date.now()}.zip`;

        console.log(`✅ Split Successful: ${pageCount} pages`);
        fs.unlink(req.file.path, () => { });

        res.set('Content-Type', 'application/zip');
        res.set('Content-Disposition', `attachment; filename=${downloadName}`);
        res.send(zipBuffer);

    } catch (error) {
        console.error('Split error:', error);
        fs.unlink(req.file.path, () => { });
        res.status(500).json({ error: 'Split failed', details: error.message });
    }
};

exports.protectPDF = async (req, res) => {
    if (!req.file || !req.body.password) {
        return res.status(400).json({ error: 'File and password are required' });
    }

    console.log('--- Protect PDF Request ---');

    try {
        const pdfBytes = fs.readFileSync(req.file.path);
        const pdf = await PDFDocument.load(pdfBytes);

        // Encrypt logic
        pdf.encrypt({
            userPassword: req.body.password,
            ownerPassword: req.body.password,
            permissions: {
                printing: 'highResolution',
                modifying: false,
                copying: false,
                annotating: false,
                fillingForms: false,
                contentAccessibility: false,
                documentAssembly: false,
            },
        });

        const encryptedBytes = await pdf.save();
        const outputFilename = `protected_${req.file.originalname}`;
        const outputPath = path.join('uploads', outputFilename);

        fs.writeFileSync(outputPath, encryptedBytes);

        fs.unlink(req.file.path, () => { });

        res.download(outputPath, outputFilename, (err) => {
            fs.unlink(outputPath, () => { });
        });

    } catch (error) {
        console.error('Protect error:', error);
        fs.unlink(req.file.path, () => { });
        res.status(500).json({ error: 'Protection failed', details: error.message });
    }
};

exports.unlockPDF = async (req, res) => {
    // pdf-lib does NOT support unlocking (decrypting) PDFs with password easily if it's strongly encrypted?
    // Actually PDFDocument.load(bytes, { password: ... }) works.

    if (!req.file || !req.body.password) {
        return res.status(400).json({ error: 'File and password are required' });
    }

    console.log('--- Unlock PDF Request ---');

    try {
        const pdfBytes = fs.readFileSync(req.file.path);
        // Load with password
        const pdf = await PDFDocument.load(pdfBytes, { password: req.body.password });

        // Save without security
        const unlockedBytes = await pdf.save();

        const outputFilename = `unlocked_${req.file.originalname}`;
        const outputPath = path.join('uploads', outputFilename);

        fs.writeFileSync(outputPath, unlockedBytes);

        fs.unlink(req.file.path, () => { });

        res.download(outputPath, outputFilename, (err) => {
            fs.unlink(outputPath, () => { });
        });

    } catch (error) {
        console.error('Unlock error:', error);
        fs.unlink(req.file.path, () => { });
        res.status(500).json({ error: 'Unlock failed (Wrong password?)', details: error.message });
    }
};
