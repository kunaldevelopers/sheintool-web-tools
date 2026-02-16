import { useState } from 'react';
import ToolUI from '../components/ToolUI';
import { api } from '../services/api';

export default function ImageConverter() {
    const [format, setFormat] = useState('png');
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState(null);

    const handleConvert = async (file, onProgress) => {
        setProcessing(true);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('format', format);

        try {
            const response = await api.post('/convert/image', formData, {
                onUploadProgress: onProgress,
                responseType: 'blob',
            });

            // Create blob URL for download
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
                {['png', 'jpg', 'webp', 'avif', 'gif', 'bmp', 'tiff', 'ico'].map((fmt) => (
                    <button
                        key={fmt}
                        onClick={() => setFormat(fmt)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all
              ${format === fmt
                                ? 'bg-pink-600 text-white border-pink-600 shadow-md transform scale-105'
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
            title="Image Converter"
            description="Convert your images to PNG, JPG, WEBP, and more."
            accept={{
                'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.bmp', '.tiff', '.ico', '.heic']
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
