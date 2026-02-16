import { useState } from 'react';
import { api } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQrcode, faDownload, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { haptic } from '../utils/haptics';

export default function QrGenerator() {
    const [text, setText] = useState('');
    const [qrCode, setQrCode] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!text) return;

        haptic.tap();
        setProcessing(true);
        setQrCode(null);

        try {
            const response = await api.post('/tools/qr', { text });
            setQrCode(response.data.qrImage); // Expecting base64 data URL
            haptic.success();
        } catch (error) {
            console.error(error);
            alert('Failed to generate QR code');
            haptic.error();
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">QR Code Generator</h1>
                <p className="text-gray-500">Generate QR codes for links, text, or anything else.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <form onSubmit={handleGenerate} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Content (URL or Text)
                        </label>
                        <input
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={processing || !text}
                        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transform transition-all active:scale-95
              ${processing || !text ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-pink-500 to-violet-600 hover:shadow-pink-500/30'}`}
                    >
                        {processing ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faQrcode} />}
                        Generate QR Code
                    </button>
                </form>

                {qrCode && (
                    <div className="mt-8 text-center animate-fade-in">
                        <div className="bg-gray-50 p-6 rounded-xl inline-block border border-gray-100">
                            <img src={qrCode} alt="Generated QR" className="w-64 h-64 mx-auto" />
                        </div>
                        <div className="mt-6">
                            <a
                                href={qrCode}
                                download="qrcode.png"
                                className="inline-flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                                onClick={() => haptic.tap()}
                            >
                                <FontAwesomeIcon icon={faDownload} />
                                Download PNG
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
