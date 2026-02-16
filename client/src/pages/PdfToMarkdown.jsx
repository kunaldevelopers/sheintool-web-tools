import { useState } from 'react';
import ToolUI from '../components/ToolUI';
import { api } from '../services/api';

export default function PdfToMarkdown() {
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState(null);

    const handleConvert = async (file, onProgress) => {
        setProcessing(true);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/convert/pdf-to-md', formData, {
                onUploadProgress: onProgress,
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            setResult(url);
        } catch (error) {
            throw error;
        } finally {
            setProcessing(false);
        }
    };

    return (
        <ToolUI
            title="PDF to Markdown"
            description="Extract text from PDF files and convert to Markdown."
            accept={{
                'application/pdf': ['.pdf']
            }}
            onConvert={handleConvert}
            processing={processing}
            result={result}
            downloadExtension="md"
            onReset={() => setResult(null)}
        />
    );
}
