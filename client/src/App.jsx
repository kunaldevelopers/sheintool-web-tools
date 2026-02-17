import ImageConverter from './pages/ImageConverter';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';

import VideoConverter from './pages/VideoConverter';
import AudioConverter from './pages/AudioConverter';
import MarkdownToPdf from './pages/MarkdownToPdf';
import PdfToMarkdown from './pages/PdfToMarkdown';
import QrGenerator from './pages/QrGenerator';
import ZipManager from './pages/ZipManager';

import MergePdf from './pages/MergePdf';
import SplitPdf from './pages/SplitPdf';
import CompressPdf from './pages/CompressPdf';
import ProtectPdf from './pages/ProtectPdf';
import UnlockPdf from './pages/UnlockPdf';
import RotatePdf from './pages/RotatePdf';
import WatermarkPdf from './pages/WatermarkPdf';
import PageNumbersPdf from './pages/PageNumbersPdf';
import OrganizePdf from './pages/OrganizePdf';
import OfficeToPdf from './pages/OfficeToPdf';
import OcrPdf from './pages/OcrPdf';
import AdvancedPdfEditor from './pages/AdvancedPdfEditor';
import ImageToPdf from './pages/ImageToPdf';

// Placeholder for tool pages (will implement later)
const ToolPlaceholder = ({ name }) => (
  <div className="text-center py-20">
    <h2 className="text-2xl font-bold mb-4">{name}</h2>
    <p className="text-gray-500">This tool is under construction 🚧</p>
  </div>
);

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Image Tools */}
        <Route path="/tools/image-converter" element={<ImageConverter />} />
        <Route path="/tools/image-to-pdf" element={<ImageToPdf />} />

        {/* Video & Audio */}
        <Route path="/tools/video-converter" element={<VideoConverter />} />
        <Route path="/tools/audio-converter" element={<AudioConverter />} />

        {/* PDF Core */}
        <Route path="/tools/merge-pdf" element={<MergePdf />} />
        <Route path="/tools/split-pdf" element={<SplitPdf />} />
        <Route path="/tools/compress-pdf" element={<CompressPdf />} />
        <Route path="/tools/protect-pdf" element={<ProtectPdf />} />
        <Route path="/tools/unlock-pdf" element={<UnlockPdf />} />

        {/* PDF Editing */}
        <Route path="/tools/rotate-pdf" element={<RotatePdf />} />
        <Route path="/tools/watermark-pdf" element={<WatermarkPdf />} />
        <Route path="/tools/page-numbers" element={<PageNumbersPdf />} />
        <Route path="/tools/organize-pdf" element={<OrganizePdf />} />
        <Route path="/tools/advanced-pdf-editor" element={<AdvancedPdfEditor />} />

        {/* Converters */}
        <Route path="/tools/word-to-pdf" element={<OfficeToPdf />} />
        <Route path="/tools/markdown-to-pdf" element={<MarkdownToPdf />} />
        <Route path="/tools/pdf-to-markdown" element={<PdfToMarkdown />} />
        <Route path="/tools/ocr-pdf" element={<OcrPdf />} />

        {/* Utilities */}
        <Route path="/tools/qr-generator" element={<QrGenerator />} />
        <Route path="/tools/zip-manager" element={<ZipManager />} />

        <Route path="*" element={<div className="text-center py-20">Page Not Found</div>} />
      </Routes>
    </Layout>
  );
}

export default App;
