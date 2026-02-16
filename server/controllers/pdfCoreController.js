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

exports.compressPDF = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }

        const pdfBytes = await fs.readFileSync(req.file.path);
        const pdfDoc = await PDFDocument.load(pdfBytes);

        // Basic optimization: re-saving with pdf-lib often reduces size by removing unused objects
        // For better compression, we would need ghostscript or similar binaries which might be too heavy/complex for this setup.
        const compressedBytes = await pdfDoc.save({ useObjectStreams: false });

        const filename = `compressed_${Date.now()}.pdf`;
        const outputPath = path.join(__dirname, '../../client/public/downloads', filename);

        // Ensure directory exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        await fs.writeFileSync(outputPath, compressedBytes);

        // Clean up uploaded file
        await fs.unlinkSync(req.file.path);

        res.json({ downloadUrl: `/downloads/${filename}` });
    } catch (error) {
        console.error('Compress PDF Error:', error);
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
        const muhammara = require('muhammara');

        // Use muhammara.recrypt to add password
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

        // Cleanup input
        fs.unlink(req.file.path, () => { });

        res.download(outputFile, (err) => {
            if (err) console.error('Download error:', err);
            // Cleanup output after download? Maybe delay it.
            // fs.unlink(outputFile, () => {}); 
            // For now, let's keep it simple or use a timeout.
            setTimeout(() => {
                if (fs.existsSync(outputFile)) fs.unlink(outputFile, () => { });
            }, 60000); // 1 min cleanup
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
        const muhammara = require('muhammara');

        // To unlock, we create a new PDF and copy pages from the encrypted one using the password
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

        // Cleanup input
        fs.unlink(req.file.path, () => { });

        res.download(outputFile, (err) => {
            if (err) console.error('Download error:', err);
            setTimeout(() => {
                if (fs.existsSync(outputFile)) fs.unlink(outputFile, () => { });
            }, 60000);
        });

    } catch (error) {
        console.error('Unlock error:', error);
        if (fs.existsSync(req.file.path)) fs.unlink(req.file.path, () => { });
        res.status(500).json({ error: 'Unlock failed (Wrong password?)', details: error.message });
    }
};
