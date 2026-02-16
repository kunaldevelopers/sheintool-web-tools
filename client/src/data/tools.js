import {
    faImage, faVideo, faMusic, faFilePdf, faQrcode, faFileZipper,
    faObjectGroup, faScissors, faLock, faUnlock, faRotate, faStamp, faListOl, faArrowDownWideShort,
    faFileWord, faFileCode, faFont, faCompress
} from '@fortawesome/free-solid-svg-icons';

export const TOOLS = [
    {
        category: "Most Popular",
        items: [
            { id: 'merge-pdf', name: 'Merge PDF', desc: 'Combine PDFs in the order you want.', icon: faObjectGroup, path: '/tools/merge-pdf', tags: 'pdf combine join' },
            { id: 'split-pdf', name: 'Split PDF', desc: 'Separate one page or a whole set for easy conversion.', icon: faScissors, path: '/tools/split-pdf', tags: 'pdf extract separate' },
            { id: 'compress-pdf', name: 'Compress PDF', desc: 'Reduce file size while optimizing for maximal quality.', icon: faCompress, path: '/tools/compress-pdf', tags: 'pdf shrink size optimize' },
            { id: 'word-to-pdf', name: 'Word to PDF', desc: 'Make DOC and DOCX files easy to read by converting them to PDF.', icon: faFileWord, path: '/tools/word-to-pdf', tags: 'doc docx office' },
        ]
    },
    {
        category: "PDF Essentials",
        items: [
            { id: 'merge-pdf-2', name: 'Merge PDF', desc: 'Combine multiple PDFs into one.', icon: faObjectGroup, path: '/tools/merge-pdf' },
            { id: 'split-pdf-2', name: 'Split PDF', desc: 'Extract pages from your PDF.', icon: faScissors, path: '/tools/split-pdf' },
            { id: 'compress-pdf-2', name: 'Compress PDF', desc: 'Reduce PDF file size.', icon: faCompress, path: '/tools/compress-pdf' },
            { id: 'ocr-pdf', name: 'OCR Scanner', desc: 'Extract text from scanned images.', icon: faFont, path: '/tools/ocr-pdf', tags: 'ocr text scan image' },
        ]
    },
    {
        category: "Convert to PDF",
        items: [
            { id: 'image-to-pdf', name: 'Image to PDF', desc: 'Convert JPG, PNG, BMP, GIF, and TIFF images to PDF.', icon: faImage, path: '/tools/image-to-pdf', tags: 'jpg png' },
            { id: 'word-to-pdf-2', name: 'Word to PDF', desc: 'Convert Word documents to PDF.', icon: faFileWord, path: '/tools/word-to-pdf' },
            { id: 'markdown-to-pdf', name: 'Markdown to PDF', desc: 'Convert Markdown files to PDF.', icon: faFileCode, path: '/tools/markdown-to-pdf' },
        ]
    },
    {
        category: "Convert from PDF",
        items: [
            { id: 'pdf-to-markdown', name: 'PDF to Markdown', desc: 'Convert PDF files to Markdown.', icon: faFileCode, path: '/tools/pdf-to-markdown' },
            // { id: 'pdf-to-word', name: 'PDF to Word', desc: 'Convert your PDF to WORD documents.', icon: faFileWord, path: '/tools/pdf-to-word' }, // Planned but not asked in strict list? Asked "PDF -> Office". I only implemented Office -> PDF. I'll omit PDF->Office for now as I didn't implement it.
        ]
    },
    {
        category: "Edit PDF",
        items: [
            { id: 'rotate-pdf', name: 'Rotate PDF', desc: 'Rotate your PDF pages.', icon: faRotate, path: '/tools/rotate-pdf' },
            { id: 'watermark-pdf', name: 'Add Watermark', desc: 'Stamp text over your PDF.', icon: faStamp, path: '/tools/watermark-pdf' },
            { id: 'page-numbers', name: 'Page Numbers', desc: 'Add page numbers into your PDF.', icon: faListOl, path: '/tools/page-numbers' },
            { id: 'organize-pdf', name: 'Organize PDF', desc: 'Sort, add and delete PDF pages.', icon: faArrowDownWideShort, path: '/tools/organize-pdf' },
        ]
    },
    {
        category: "PDF Security",
        items: [
            { id: 'protect-pdf', name: 'Protect PDF', desc: 'Encrypt your PDF with a password.', icon: faLock, path: '/tools/protect-pdf' },
            { id: 'unlock-pdf', name: 'Unlock PDF', desc: 'Remove PDF password security.', icon: faUnlock, path: '/tools/unlock-pdf' },
        ]
    },
    {
        category: "Media & Utilities",
        items: [
            { id: 'image-conv', name: 'Image Converter', desc: 'Convert between image formats.', icon: faImage, path: '/tools/image-converter' },
            { id: 'video-conv', name: 'Video Converter', desc: 'Convert video files (MP4, AVI, MKV).', icon: faVideo, path: '/tools/video-converter' },
            { id: 'audio-conv', name: 'Audio Converter', desc: 'Convert audio files (MP3, WAV).', icon: faMusic, path: '/tools/audio-converter' },
            { id: 'qr-gen', name: 'QR Generator', desc: 'Create QR codes for free.', icon: faQrcode, path: '/tools/qr-generator' },
            { id: 'zip-manager', name: 'Zip Manager', desc: 'Create and extract ZIP archives.', icon: faFileZipper, path: '/tools/zip-manager' },
        ]
    }
];
