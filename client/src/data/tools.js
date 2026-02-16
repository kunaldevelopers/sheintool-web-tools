
import {
    faImage, faFilePdf, faVideo, faMusic, faQrcode, faFileArchive, faFileCode
} from '@fortawesome/free-solid-svg-icons';

export const TOOLS = [
    {
        category: "Image & File Conversion",
        items: [
            { id: 'img-converter', name: 'Image Converter', icon: faImage, desc: 'Convert JPG, PNG, WEBP, HEIC & more.', path: '/tools/image-converter' },
            { id: 'img-to-pdf', name: 'Image to PDF', icon: faFilePdf, desc: 'Convert images to PDF document.', path: '/tools/image-to-pdf' },
            { id: 'pdf-to-img', name: 'PDF to Image', icon: faImage, desc: 'Extract images from PDF files.', path: '/tools/pdf-to-image' },
        ]
    },
    {
        category: "Video Tools",
        items: [
            { id: 'video-converter', name: 'Video Converter', icon: faVideo, desc: 'Convert MP4, MKV, AVI, & more.', path: '/tools/video-converter' },
            { id: 'video-to-gif', name: 'Video to GIF', icon: faVideo, desc: 'Create GIFs from video clips.', path: '/tools/video-to-gif' },
            { id: 'video-to-audio', name: 'Video to Audio', icon: faMusic, desc: 'Extract audio (MP3) from video.', path: '/tools/video-to-audio' },
        ]
    },
    {
        category: "Audio Tools",
        items: [
            { id: 'audio-converter', name: 'Audio Converter', icon: faMusic, desc: 'Convert audio files to different formats.', path: '/tools/audio-converter' },
            { id: 'audio-cutter', name: 'Audio Cutter', icon: faMusic, desc: 'Trim and cut audio files.', path: '/tools/audio-cutter' },
        ]
    },
    {
        category: "Document & Text",
        items: [
            { id: 'md-to-pdf', name: 'Markdown to PDF', icon: faFileCode, desc: 'Convert Markdown text to PDF.', path: '/tools/markdown-to-pdf' },
            { id: 'pdf-to-md', name: 'PDF to Markdown', icon: faFileCode, desc: 'Convert PDF to Markdown text.', path: '/tools/pdf-to-markdown' },
        ]
    },
    {
        category: "Utilities",
        items: [
            { id: 'qr-generator', name: 'QR Code Generator', icon: faQrcode, desc: 'Generate QR codes for links and text.', path: '/tools/qr-generator' },
            { id: 'zip-manager', name: 'Zip Manager', icon: faFileArchive, desc: 'Create and extract ZIP archives.', path: '/tools/zip-manager' },
        ]
    }
];
