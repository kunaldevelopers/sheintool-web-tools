import { useState } from 'react';
import ToolUI from '../components/ToolUI';
import { api } from '../services/api';

export default function OrganizePdf() {
    const [result, setResult] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [pages, setPages] = useState('1, 2, 3');

    const handleConvert = async (file, onProgress) => {
        setProcessing(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('pages', pages);

        try {
            const response = await api.post('/tools/pdf/edit/organize', formData, {
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
            <label className="block text-sm font-medium text-gray-700">Pages to Keep (comma separated)</label>
            <input
                type="text"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                placeholder="e.g. 1,3,5-7"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
            />
            <p className="text-xs text-gray-500">Only specified pages will be kept in the new PDF.</p>
        </div>
    );

    return (
        <ToolUI
            title="Organize PDF"
            description="Reorder or delete pages from your PDF."
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
