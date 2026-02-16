import { useState } from 'react';
import ToolUI from '../components/ToolUI';
import { api } from '../services/api';

export default function OfficeToPdf() {
    const [result, setResult] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleConvert = async (file, onProgress) => {
        setProcessing(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/tools/pdf/extra/word-to-pdf', formData, {
                responseType: 'blob',
                onUploadProgress: onProgress
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
            title="Word to PDF"
            description="Convert Word documents (.docx) to PDF."
            accept={{ 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }}
            onConvert={handleConvert}
            processing={processing}
            result={result}
            onReset={() => setResult(null)}
            downloadExtension="pdf"
        />
    );
}
