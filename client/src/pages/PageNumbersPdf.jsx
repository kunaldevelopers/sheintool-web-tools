import { useState } from 'react';
import ToolUI from '../components/ToolUI';
import { api } from '../services/api';

export default function PageNumbersPdf() {
    const [result, setResult] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleConvert = async (file, onProgress) => {
        setProcessing(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/tools/pdf/edit/pagenumbers', formData, {
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
            title="Page Numbers"
            description="Add page numbers to your PDF document."
            accept={{ 'application/pdf': ['.pdf'] }}
            onConvert={handleConvert}
            processing={processing}
            result={result}
            onReset={() => setResult(null)}
            downloadExtension="pdf"
        />
    );
}
