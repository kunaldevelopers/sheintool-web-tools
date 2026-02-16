import { useState } from 'react';
import ToolUI from '../components/ToolUI';
import { api } from '../services/api';

export default function RotatePdf() {
    const [result, setResult] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [angle, setAngle] = useState(90);

    const handleConvert = async (file, onProgress) => {
        setProcessing(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('angle', angle);

        try {
            const response = await api.post('/tools/pdf/edit/rotate', formData, {
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
            <label className="block text-sm font-medium text-gray-700">Rotation Angle</label>
            <div className="flex gap-4">
                {[90, 180, 270].map((a) => (
                    <button
                        key={a}
                        onClick={() => setAngle(a)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${angle === a ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        {a}°
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <ToolUI
            title="Rotate PDF"
            description="Rotate all pages in your PDF document."
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
