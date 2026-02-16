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

        {/* We will map these routes properly once components are built */}
        <Route path="/tools/image-converter" element={<ImageConverter />} />
        <Route path="/tools/image-to-pdf" element={<ToolPlaceholder name="Image to PDF" />} />
        <Route path="/tools/video-converter" element={<VideoConverter />} />
        <Route path="/tools/audio-converter" element={<AudioConverter />} />
        <Route path="/tools/markdown-to-pdf" element={<MarkdownToPdf />} />
        <Route path="/tools/pdf-to-markdown" element={<PdfToMarkdown />} />
        <Route path="/tools/qr-generator" element={<QrGenerator />} />
        <Route path="/tools/zip-manager" element={<ZipManager />} />
        {/* Add catch-all or other routes */}
        <Route path="*" element={<div className="text-center py-20">Page Not Found</div>} />
      </Routes>
    </Layout>
  );
}

export default App;
