const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const muhammara = require('muhammara');

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
    if (!req.file) return res.status(400).json({ error: 'No PDF uploaded' });

    console.log('--- Split PDF Request ---');
    console.log(`📂 File: ${req.file.originalname}`);

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

exports.compressPDF = async (req, res) => {
    // Improved Compression using Muhammara to rewrite the PDF structure.
    // This often removes unused objects and defragments the file.

    if (!req.file) {
        return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    console.log('--- Compress PDF Request ---');
    console.log(`📂 File: ${req.file.originalname}`);
    console.log(`Original Size: ${(req.file.size / 1024).toFixed(2)} KB`);

    const filename = `compressed_${Date.now()}.pdf`;
    const outputPath = path.join('uploads', filename);

    try {
        // Method 1: Use Muhammara to rewrite (fast and effective for messy PDFs)
        // This is equivalent to "Save As" which drops garbage.

        // We create a new PDF copying pages from the old one.
        const pdfWriter = muhammara.createWriter(outputPath);

        // Copying requests
        pdfWriter.appendPDFPagesFromPDF(req.file.path);

        pdfWriter.end();

        // Check new size
        const newStats = fs.statSync(outputPath);
        console.log(`Compressed Size: ${(newStats.size / 1024).toFixed(2)} KB`);

        // If compression didn't help (or made it bigger), fallback to pdf-lib with object streams?
        // Actually for now, this is the "Strong" structural compression achievable without GS.

        // Clean up uploaded file
        fs.unlink(req.file.path, () => { });

        res.download(outputPath, filename, (err) => {
            fs.unlink(outputPath, () => { });
            if (err) console.error('Download error:', err);
        });

    } catch (error) {
        console.error('Compress PDF Error:', error);
        if (fs.existsSync(req.file.path)) fs.unlink(req.file.path, () => { });
        res.status(500).json({ error: 'Compression failed' });
    }
};

exports.protectPDF = async (req, res) => {
    if (!req.file || !req.body.password) {
        return res.status(400).json({ error: 'File and password are required' });
    }

    console.log('--- Protect PDF Request (Muhammara) ---');
    console.log(`Input: ${req.file.path}`);
    const outputFile = path.join('uploads', `protected_${req.file.originalname}`);

    try {
        muhammara.recrypt(
            req.file.path,
            outputFile,
            {
                userPassword: req.body.password,
                ownerPassword: req.body.password,
                userProtectionFlag: 4 // Allow printing
            }
        );

        console.log(`✅ Protected: ${outputFile}`);
        fs.unlink(req.file.path, () => { });

        res.download(outputFile, (err) => {
            if (err) console.error('Download error:', err);
            fs.unlink(outputFile, () => { });
        });

    } catch (error) {
        console.error('Protect error:', error);
        if (fs.existsSync(req.file.path)) fs.unlink(req.file.path, () => { });
        res.status(500).json({ error: 'Protection failed', details: error.message });
    }
};

exports.unlockPDF = async (req, res) => {
    if (!req.file || !req.body.password) {
        return res.status(400).json({ error: 'File and password are required' });
    }

    console.log('--- Unlock PDF Request (Muhammara) ---');
    console.log(`Input: ${req.file.path}`);
    const outputFile = path.join('uploads', `unlocked_${req.file.originalname}`);

    try {
        const writer = muhammara.createWriter(outputFile);
        const context = writer.createPDFCopyingContext(req.file.path, { password: req.body.password });
        const parser = context.getSourceDocumentParser();
        const pageCount = parser.getPagesCount();

        console.log(`Unlocking ${pageCount} pages...`);

        for (let i = 0; i < pageCount; i++) {
            context.appendPDFPageFromPDF(i);
        }

        writer.end();

        console.log(`✅ Unlocked: ${outputFile}`);
        fs.unlink(req.file.path, () => { });

        res.download(outputFile, (err) => {
            if (err) console.error('Download error:', err);
            fs.unlink(outputFile, () => { });
        });

    } catch (error) {
        console.error('Unlock error:', error);
        if (fs.existsSync(req.file.path)) fs.unlink(req.file.path, () => { });
        res.status(500).json({ error: 'Unlock failed (Wrong password?)', details: error.message });
    }
};
