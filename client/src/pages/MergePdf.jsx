import React, { useState } from 'react';
import ToolUI from '../components/ToolUI';
import { api } from '../services/api';

export default function MergePdf() {
    const [result, setResult] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleConvert = async (files, onProgress) => {
        setProcessing(true);
        const formData = new FormData();
        files.forEach(f => formData.append('files', f));

        try {
            const response = await api.post('/tools/pdf/core/merge', formData, {
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
            title="Merge PDF"
            description="Combine multiple PDF files into one single document."
            accept={{ 'application/pdf': ['.pdf'] }}
            onConvert={handleConvert}
            processing={processing}
            result={result}
            onReset={() => setResult(null)}
            multiple={true}
            downloadExtension="pdf"
        />
    );
}
