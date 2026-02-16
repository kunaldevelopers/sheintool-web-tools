import { useState } from 'react';
import ToolUI from '../components/ToolUI';
import { api } from '../services/api';

export default function VideoConverter() {
    const [format, setFormat] = useState('mp4');
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState(null);

    const handleConvert = async (file, onProgress) => {
        setProcessing(true);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('format', format);

        try {
            const response = await api.post('/convert/video', formData, {
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

    const Options = (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Target Format</label>
            <div className="grid grid-cols-4 gap-2">
                {['mp4', 'mkv', 'webm', 'avi', 'mov', 'flv', 'wmv'].map((fmt) => (
                    <button
                        key={fmt}
                        onClick={() => setFormat(fmt)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all
              ${format === fmt
                                ? 'bg-violet-600 text-white border-violet-600 shadow-md transform scale-105'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                    >
                        {fmt.toUpperCase()}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <ToolUI
            title="Video Converter"
            description="Convert videos to MP4, MKV, AVI, and more."
            accept={{
                'video/*': ['.mp4', '.mkv', '.webm', '.avi', '.mov', '.flv', '.wmv', '.3gp', '.m4v']
            }}
            optionsComponent={Options}
            onConvert={handleConvert}
            processing={processing}
            result={result}
            downloadExtension={format}
            onReset={() => setResult(null)}
        />
    );
}
