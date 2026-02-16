import { useState } from 'react';
import ToolUI from '../components/ToolUI';
import axios from 'axios';
import { faCompress } from '@fortawesome/free-solid-svg-icons';

export default function CompressPdf() {
    const [result, setResult] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleConvert = async (file, onProgress) => {
        setProcessing(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('http://localhost:5000/api/tools/pdf/core/compress', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: onProgress
            });
            setResult(response.data.downloadUrl);
        } catch (error) {
            console.error(error);
            alert('Compression failed');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <ToolUI
            title="Compress PDF"
            description="Reduce the file size of your PDF documents while maintaining the best possible quality."
            accept={{ 'application/pdf': ['.pdf'] }}
            onConvert={handleConvert}
            processing={processing}
            result={result}
            onReset={() => setResult(null)}
            downloadExtension="pdf"
        />
    );
}
