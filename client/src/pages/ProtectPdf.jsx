import { useState } from 'react';
import ToolUI from '../components/ToolUI';
import { api } from '../services/api';

export default function ProtectPdf() {
    const [result, setResult] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [password, setPassword] = useState('');

    const handleConvert = async (file, onProgress) => {
        if (!password) {
            alert('Please enter a password');
            return;
        }

        setProcessing(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('password', password);

        try {
            const response = await api.post('/tools/pdf/core/protect', formData, {
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
            <label className="block text-sm font-medium text-gray-700">Set Password</label>
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password to protect PDF"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
            />
        </div>
    );

    return (
        <ToolUI
            title="Protect PDF"
            description="Encrypt your PDF file with a password."
            accept={{ 'application/pdf': ['.pdf'] }}
            optionsComponent={Options}
            onConvert={handleConvert}
            processing={processing}
            result={result}
            onReset={() => { setResult(null); setPassword(''); }}
            downloadExtension="pdf"
        />
    );
}
