import { useState } from 'react';
import ToolUI from '../components/ToolUI';
import { api } from '../services/api';

export default function MarkdownToPdf() {
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState(null);

    const handleConvert = async (file, onProgress) => {
        setProcessing(true);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/convert/md-to-pdf', formData, {
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
            title="Markdown to PDF"
            description="Convert Markdown (.md) files to professional PDF documents."
            accept={{
                'text/markdown': ['.md', '.markdown']
            }}
            onConvert={handleConvert}
            processing={processing}
            result={result}
            downloadExtension="pdf"
            onReset={() => setResult(null)}
        />
    );
}
