import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faFile, faCheckCircle, faTimesCircle, faSpinner, faDownload } from '@fortawesome/free-solid-svg-icons';
import { haptic } from '../utils/haptics';

export default function ToolUI({
    title,
    description,
    accept,
    onConvert,
    processing,
    result,
    optionsComponent,
    downloadExtension,
    onReset
}) {
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const onDrop = useCallback((acceptedFiles) => {
        haptic.selection();
        if (acceptedFiles?.length > 0) {
            setFile(acceptedFiles[0]);
            setError(null);
            setUploadProgress(0);
            if (onReset) onReset(); // Clear previous result on new drop if needed
        }
    }, [onReset]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        maxFiles: 1
    });

    const handleConvert = async () => {
        if (!file) return;
        haptic.tap();
        try {
            await onConvert(file, (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setUploadProgress(percentCompleted);
            });
            haptic.success();
        } catch (err) {
            console.error(err);
            setError('Conversion failed. Please try again.');
            haptic.error();
        }
    };

    const reset = () => {
        setFile(null);
        setUploadProgress(0);
        setError(null);
        if (onReset) onReset();
        haptic.tap();
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                <p className="text-gray-500">{description}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Upload Area */}
                {!file && !result ? (
                    <div
                        {...getRootProps()}
                        className={`p-10 border-2 border-dashed rounded-xl m-4 transition-colors duration-200 cursor-pointer flex flex-col items-center justify-center space-y-4
              ${isDragActive ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-300 hover:bg-gray-50'}`}
                    >
                        <input {...getInputProps()} />
                        <div className="p-4 bg-pink-100 text-pink-600 rounded-full">
                            <FontAwesomeIcon icon={faCloudUploadAlt} className="text-3xl" />
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-medium text-gray-700">
                                {isDragActive ? "Drop file here..." : "Drag & drop file here"}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">or click to browse</p>
                        </div>
                    </div>
                ) : (
                    <div className="p-8">
                        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                    <FontAwesomeIcon icon={faFile} />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 truncate max-w-xs">{file?.name}</p>
                                    <p className="text-xs text-gray-500">{(file?.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                            {!processing && !result && (
                                <button onClick={reset} className="text-gray-400 hover:text-red-500">
                                    <FontAwesomeIcon icon={faTimesCircle} />
                                </button>
                            )}
                        </div>

                        {/* Options */}
                        {optionsComponent && !processing && !result && (
                            <div className="mb-6 animate-fade-in">
                                {optionsComponent}
                            </div>
                        )}

                        {/* Actions */}
                        {!result && (
                            <div className="flex justify-center">
                                <button
                                    onClick={handleConvert}
                                    disabled={processing}
                                    className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transform transition-all active:scale-95 flex items-center gap-2
                      ${processing ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-pink-500 to-violet-600 hover:shadow-pink-500/30'}`}
                                >
                                    {processing ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} spin />
                                            <span>Processing {uploadProgress}%</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Convert Now</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Result */}
                        {result && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center space-y-4"
                            >
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-2">
                                    <FontAwesomeIcon icon={faCheckCircle} className="text-3xl" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Conversion Successful!</h3>

                                <a
                                    href={result}
                                    download={`${file.name.split('.')[0]}_converted.${downloadExtension || 'txt'}`}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-lg"
                                >
                                    <FontAwesomeIcon icon={faDownload} />
                                    Download File
                                </a>

                                <div className="mt-6">
                                    <button onClick={reset} className="text-sm text-gray-500 hover:text-pink-600 underline">
                                        Convert another file
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {error && (
                            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg text-center">
                                {error}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
