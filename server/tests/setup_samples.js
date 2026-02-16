const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const sharp = require('sharp');
const AdmZip = require('adm-zip');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

const SAMPLES_DIR = path.join(__dirname, 'samples');

async function createSamples() {
    if (!fs.existsSync(SAMPLES_DIR)) {
        fs.mkdirSync(SAMPLES_DIR);
    }

    console.log('Generating Test Samples...');

    // 1. PDF & Text Samples (Use Puppeteer for better pdf-parse compatibility)
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({ headless: 'new' });
    const pageObj = await browser.newPage();
    await pageObj.setContent('<h1>Test PDF</h1><p>Content for testing pdf-parse.</p>');
    await pageObj.pdf({ path: path.join(SAMPLES_DIR, 'test_sample.pdf'), format: 'A4' });
    await browser.close();
    console.log('✅ Created test_sample.pdf (Puppeteer)');

    // For test_sample_2.pdf, we can still use pdf-lib or puppeteer. Let's use Puppeteer to be safe.
    const browser2 = await puppeteer.launch({ headless: 'new' });
    const page2 = await browser2.newPage();
    await page2.setContent('<h1>Page 2</h1><p>Merging test.</p>');
    await page2.pdf({ path: path.join(SAMPLES_DIR, 'test_sample_2.pdf'), format: 'A4' });
    await browser2.close();
    console.log('✅ Created test_sample_2.pdf (Puppeteer)');

    fs.writeFileSync(path.join(SAMPLES_DIR, 'test_sample.md'), '# Test Markdown');
    fs.writeFileSync(path.join(SAMPLES_DIR, 'test_file.txt'), 'Text content.');

    // 2. Image Sample
    await sharp({
        create: { width: 300, height: 200, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } }
    }).png().toFile(path.join(SAMPLES_DIR, 'test_sample.png'));

    // 3. Docx Sample
    try {
        const zip = new AdmZip();
        zip.addFile('[Content_Types].xml', Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`));
        zip.addFile('_rels/.rels', Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`));
        zip.addFile('word/document.xml', Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Hello World</w:t></w:r></w:p></w:body></w:document>`));
        zip.writeZip(path.join(SAMPLES_DIR, 'test_sample.docx'));
    } catch (e) {
        console.error('Docx gen failed', e);
    }

    // 4. Video Sample (.mp4)
    // Usage: Generate 2 seconds of test pattern
    console.log('Generating Video Sample (this may take a moment)...');
    await new Promise((resolve, reject) => {
        ffmpeg()
            .input('testsrc=size=320x240:rate=30')
            .inputFormat('lavfi')
            .duration(2)
            .output(path.join(SAMPLES_DIR, 'test_sample.mp4'))
            .on('end', resolve)
            .on('error', reject)
            .run();
    }).then(() => console.log('✅ Created test_sample.mp4'))
        .catch(e => console.error('❌ Video gen failed:', e.message));

    // 5. Audio Sample (.mp3)
    // Usage: Generate 2 seconds of sine wave
    console.log('Generating Audio Sample...');
    await new Promise((resolve, reject) => {
        ffmpeg()
            .input('sine=frequency=1000:duration=2')
            .inputFormat('lavfi')
            .output(path.join(SAMPLES_DIR, 'test_sample.mp3'))
            .on('end', resolve)
            .on('error', reject)
            .run();
    }).then(() => console.log('✅ Created test_sample.mp3'))
        .catch(e => console.error('❌ Audio gen failed:', e.message));

    console.log('All samples generated.');
}

createSamples();
