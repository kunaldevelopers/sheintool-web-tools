const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PDFDocument, rgb, degrees, StandardFonts } = require('pdf-lib');
const { v4: uuidv4 } = require('uuid');

// Configure multer for PDF uploads
const uploadDir = path.join(__dirname, '../uploads/advanced_pdf');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, `${uuidv4()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// Helper: Hex to RGB
function hexToRgb(hex) {
    if (!hex) return rgb(0, 0, 0);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? rgb(
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
    ) : rgb(0, 0, 0);
}

// 1. Upload PDF Endpoint
router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = `/uploads/advanced_pdf/${req.file.filename}`;
    res.json({
        success: true,
        fileUrl: fileUrl,
        filePath: req.file.path,
        filename: req.file.filename,
        originalName: req.file.originalname
    });
});

// 2. Fetch PDF - Handled by static middleware in server/index.js usually, 
// but we can add a specific download route if needed. 
// For now, we rely on the returned fileUrl from upload/apply-changes.

// 3. Apply Changes Endpoint
router.post('/apply-changes', async (req, res) => {
    try {
        const { filePath, changes } = req.body;
        // changes structure:
        // {
        //   pages: { [pageIndex]: { objects: [...] } },
        //   pageOps: [ { type: 'delete', index: 1 }, { type: 'move', from: 0, to: 2 }, ... ]
        // }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        const existingPdfBytes = fs.readFileSync(filePath);
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        // --- 1. Content Edits (Text, Image, Shapes) ---
        // We iterate current pages. Note: Page ops (delete/reorder) handled AFTER content edits 
        // to ensure we write to the correct original page before moving them.

        const pages = pdfDoc.getPages();
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // Map of pageIndex -> PageObject
        // We need to be careful: if we delete a page later, we must ensure we edited the right one first.
        // The 'changes.pages' keys refer to the ORIGINAL page indices (0-based) as the user saw them 
        // BEFORE any reordering/deletion in this session, OR we assume the frontend sends the state 
        // of the FINAL arrangement?
        // STRATEGY: Frontend should send content edits tied to "original page IDs" or we just apply edits 
        // to current pages at index X, assuming 'changes.pages' keys match current indices.
        // IF page operations (delete/move) happen, they should effectively happen LAST in the pipeline 
        // for `pdf-lib` to keep indices sane, OR we construct a new PDF.
        // EASIEST APPROACH: Apply content edits to pages by index, THEN perform page operations.

        for (const [pageIndexStr, pageData] of Object.entries(changes.pages || {})) {
            const pageIndex = parseInt(pageIndexStr);
            if (pageIndex < 0 || pageIndex >= pages.length) continue;

            const page = pages[pageIndex];
            const { width: pageWidth, height: pageHeight } = page.getSize();
            const objects = pageData.objects || [];

            for (const obj of objects) {
                // Skip objects marked as deleted (though frontend should ideally not send them)
                if (obj.isDeleted) continue;

                const { left, top, width, height, scaleX = 1, scaleY = 1, angle = 0, opacity = 1 } = obj;

                // Coordinate conversion:
                // Fabric (0,0) is Top-Left. PDF (0,0) is Bottom-Left.
                // x = left
                // y = pageHeight - top - (height * scaleY)  --- roughly. 
                // Rotation origin in Fabric is center, PDF is often bottom-left corner of bounding box unless specified.
                // We'll use more robust math if needed, but simple linear transform first.

                const pdfX = left;
                const pdfY = pageHeight - top - (height * scaleY);

                // --- Text ---
                if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
                    const color = hexToRgb(obj.fill);
                    const fontSize = obj.fontSize * scaleY; // Apply scaling
                    const text = obj.text || '';

                    // PDF-lib draws text from baseline. Fabric 'top' is top of bounding box.
                    // Approximate adjustment: subtract almost full height or use specialized font metrics.
                    // Simple heuristic: y = pageHeight - top - (fontSize * 0.8)

                    page.drawText(text, {
                        x: left,
                        y: pageHeight - top - (fontSize * 0.8),
                        size: fontSize,
                        font: helveticaFont, // TODO: Support other fonts if possible
                        color: color,
                        opacity: opacity,
                        rotate: degrees(-angle), // Fabric clockwise -> PDF counter-clockwise
                    });
                }

                // --- Image ---
                else if (obj.type === 'image') {
                    if (obj.src && obj.src.startsWith('data:image')) {
                        try {
                            const imageBytes = Buffer.from(obj.src.split(',')[1], 'base64');
                            let pdfImage;
                            if (obj.src.startsWith('data:image/png')) {
                                pdfImage = await pdfDoc.embedPng(imageBytes);
                            } else {
                                pdfImage = await pdfDoc.embedJpg(imageBytes);
                            }

                            page.drawImage(pdfImage, {
                                x: left,
                                y: pageHeight - top - (height * scaleY),
                                width: width * scaleX,
                                height: height * scaleY,
                                opacity: opacity,
                                rotate: degrees(-angle),
                            });
                        } catch (err) {
                            console.error(`Failed to embed image on page ${pageIndex}:`, err);
                        }
                    }
                }

                // --- Rect / Square (includes Whiteout) ---
                else if (obj.type === 'rect' || obj.type === 'square') {
                    const color = hexToRgb(obj.fill);
                    // If it's a whiteout, fill is likely 'white'.

                    page.drawRectangle({
                        x: left,
                        y: pageHeight - top - (height * scaleY),
                        width: width * scaleX,
                        height: height * scaleY,
                        color: color,
                        opacity: opacity,
                        rotate: degrees(-angle),
                    });
                }
                // --- Circle ---
                else if (obj.type === 'circle') {
                    const color = hexToRgb(obj.fill);
                    // Fabric 'radius' is unscaled. Actual radius = radius * scaleX.
                    const radius = obj.radius * scaleX;

                    // Fabric 'left/top' is top-left of bounding box. Center is left + radius, top + radius.
                    const centerX = left + radius;
                    const centerY = pageHeight - (top + radius); // PDF Y

                    page.drawCircle({
                        x: centerX,
                        y: centerY,
                        size: radius, // radius
                        color: color,
                        opacity: opacity,
                    });
                }

                // --- Path (Freehand Drawing) ---
                else if (obj.type === 'path') {
                    // Fabric paths are SVG commands 'M 0 0 L 10 10 ...'
                    // PDF-lib supports SVG paths!
                    const color = hexToRgb(obj.stroke);

                    // Coordinate mapping for path is tricky because the path commands are relative 
                    // to the path object's (left, top).
                    // We can draw the path directly if we transform coordinates.

                    // For now, simpler implementation: log warning that paths need more complex logic
                    // OR use simplified path/line drawing if needed.
                    // But pdf-lib drawSvgPath is powerful.

                    try {
                        page.drawSvgPath(obj.path.map(p => p.join(' ')).join(' '), {
                            x: left,
                            y: pageHeight - top - (height * scaleY), // Anchor point adjustment might be needed
                            scale: scaleX,
                            color: color,
                            borderColor: color,
                            borderWidth: obj.strokeWidth ? obj.strokeWidth * scaleX : 1,
                            rotate: degrees(-angle),
                        });
                    } catch (e) {
                        console.warn('Path drawing error', e);
                    }
                }
            }
        }

        // --- 2. Page Operations (Delete, Reorder, Rotate) ---
        // changes.pageOps = [ { type: 'delete', index: 1 }, { type: 'rotate', index: 0, angle: 90 } ]

        let finalDoc = pdfDoc;
        if (changes.pageOps && changes.pageOps.length > 0) {
            // If 'pageOrder' array is provided: [0, 2, 1, ...] (New index layout)
            if (changes.pageOrder) {
                const newDoc = await PDFDocument.create();
                const indices = changes.pageOrder; // array of original indices
                const copiedPages = await newDoc.copyPages(pdfDoc, indices);
                indices.forEach((_, i) => newDoc.addPage(copiedPages[i]));
                finalDoc = newDoc;
            } else {
                // Handle individual ops
                // Iterate backwards for deletes to avoid index shift issues
                const deletes = changes.pageOps.filter(op => op.type === 'delete').sort((a, b) => b.index - a.index);
                for (const op of deletes) {
                    finalDoc.removePage(op.index);
                }

                const rotates = changes.pageOps.filter(op => op.type === 'rotate');
                for (const op of rotates) {
                    const p = finalDoc.getPage(op.index);
                    const currentRotation = p.getRotation().angle;
                    p.setRotation(degrees(currentRotation + op.angle));
                }
            }
        }

        const pdfBytes = await finalDoc.save();
        const newFilename = `edited-${uuidv4()}.pdf`;
        const newFilePath = path.join(uploadDir, newFilename);

        fs.writeFileSync(newFilePath, pdfBytes);

        res.json({
            success: true,
            downloadUrl: `/uploads/advanced_pdf/${newFilename}`,
            filename: newFilename
        });

    } catch (error) {
        console.error('Apply Changes Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
