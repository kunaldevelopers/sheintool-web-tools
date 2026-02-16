import { useState } from 'react';
import ToolUI from '../components/ToolUI';
import { api } from '../services/api';

export default function WatermarkPdf() {
    const [result, setResult] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [text, setText] = useState('CONFIDENTIAL');

    const handleConvert = async (file, onProgress) => {
        setProcessing(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('text', text);

        try {
            const response = await api.post('/tools/pdf/edit/watermark', formData, {
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

    const Options = (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Watermark Text</label>
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
            />
        </div>
    );

    return (
        <ToolUI
            title="Watermark PDF"
            description="Add text watermark to your PDF pages."
            accept={{ 'application/pdf': ['.pdf'] }}
            optionsComponent={Options}
            onConvert={handleConvert}
            processing={processing}
            result={result}
            onReset={() => setResult(null)}
            downloadExtension="pdf"
        />
    );
}
