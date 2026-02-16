import { useState } from 'react';
import ToolUI from '../components/ToolUI';
import { api } from '../services/api';
import { faImage } from '@fortawesome/free-solid-svg-icons';

export default function ImageToPdf() {
    const [result, setResult] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleConvert = async (files, onProgress) => {
        setProcessing(true);
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        try {
            const response = await api.post('/tools/pdf/extra/image-to-pdf', formData, {
                responseType: 'blob',
                onUploadProgress: onProgress
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            setResult(url);
        } catch (error) {
            console.error(error);
            alert('Conversion failed');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <ToolUI
            title="Image to PDF"
            description="Convert multiple images (JPG, PNG) into a single PDF file."
            accept={{ 'image/*': ['.jpg', '.jpeg', '.png'] }}
            onConvert={handleConvert}
            processing={processing}
            result={result}
            multiple={true}
            onReset={() => setResult(null)}
            downloadExtension="pdf"
        />
    );
}
