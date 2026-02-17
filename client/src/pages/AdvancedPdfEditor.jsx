import React, { useState, useEffect, useRef } from 'react';
import * as fabric from 'fabric';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMousePointer, faFont, faImage, faPen, faEraser,
    faUndo, faRedo, faDownload, faTrash, faArrowLeft,
    faArrowRight, faSave, faFilePdf, faExchangeAlt, faSearchPlus, faSearchMinus
} from '@fortawesome/free-solid-svg-icons';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const AdvancedPdfEditor = () => {
    const [file, setFile] = useState(null);
    const [filePath, setFilePath] = useState('');
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageOrder, setPageOrder] = useState([]); // Array of original page indices [0, 1, 2...]

    // View State
    const [scale, setScale] = useState(1.0);

    // State per page
    const [pageStates, setPageStates] = useState({}); // { [pageIndex]: JSON }
    const [history, setHistory] = useState({}); // { [pageIndex]: { undo: [], redo: [] } }

    // Canvas Refs
    const canvasRef = useRef(null); // Fabric canvas element
    const pdfCanvasRef = useRef(null); // PDF render canvas element
    const containerRef = useRef(null);
    const fabricInstance = useRef(null); // Store fabric instance in ref to avoid closure staleness

    // Tools
    const [activeTool, setActiveTool] = useState('select');
    const [color, setColor] = useState('#000000');
    const [fontSize, setFontSize] = useState(20);
    const [brushSize, setBrushSize] = useState(5);
    const [selectedObject, setSelectedObject] = useState(null);
    const fileInputRef = useRef(null); // For image upload
    const replaceInputRef = useRef(null); // For image replace

    // --- Initialization ---

    // Upload Handler
    const handleFileUpload = async (e) => {
        const uploadedFile = e.target.files[0];
        if (!uploadedFile) return;

        const formData = new FormData();
        formData.append('file', uploadedFile);

        try {
            const res = await axios.post('http://localhost:5000/api/tools/pdf/advanced-editor/upload', formData);
            setFilePath(res.data.filePath);

            const fileReader = new FileReader();
            fileReader.onload = async function () {
                const typedarray = new Uint8Array(this.result);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                setNumPages(pdf.numPages);
                setFile(pdf);
                // Initialize page order [0, 1, 2, ...]
                const order = Array.from({ length: pdf.numPages }, (_, i) => i);
                setPageOrder(order);
                setCurrentPage(1);
                setScale(1.0);
            };
            fileReader.readAsArrayBuffer(uploadedFile);
        } catch (err) {
            console.error("Error uploading file", err);
            alert("Failed to upload file");
        }
    };

    // --- Rendering ---

    useEffect(() => {
        if (file && pageOrder.length > 0) {
            renderPage();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, file, pageOrder, scale]);

    const renderPage = async () => {
        if (!file) return;

        // Get original page index
        const originalPageIndex = pageOrder[currentPage - 1];
        if (originalPageIndex === undefined) return;

        const page = await file.getPage(originalPageIndex + 1);
        const viewport = page.getViewport({ scale: scale });

        // 1. Render PDF to Bottom Canvas
        const pdfCanvas = pdfCanvasRef.current;
        if (!pdfCanvas) return;

        const pdfContext = pdfCanvas.getContext('2d');
        pdfCanvas.height = viewport.height;
        pdfCanvas.width = viewport.width;

        await page.render({ canvasContext: pdfContext, viewport: viewport }).promise;

        // 2. Initialize/Update Fabric Canvas (Top Layer)
        // Check if we need to dispose old instance
        if (fabricInstance.current) {
            fabricInstance.current.dispose();
        }

        const newCanvas = new fabric.Canvas(canvasRef.current, {
            height: viewport.height,
            width: viewport.width,
            isDrawingMode: activeTool === 'draw' || activeTool === 'eraser',
            backgroundColor: 'rgba(0,0,0,0)', // Transparent
        });

        // Load State if exists
        if (pageStates[originalPageIndex]) {
            newCanvas.loadFromJSON(pageStates[originalPageIndex], newCanvas.renderAll.bind(newCanvas));
        }

        // Attach Events
        newCanvas.on('selection:created', (e) => setSelectedObject(e.selected[0]));
        newCanvas.on('selection:updated', (e) => setSelectedObject(e.selected[0]));
        newCanvas.on('selection:cleared', () => setSelectedObject(null));

        newCanvas.on('object:modified', () => saveHistory(originalPageIndex, newCanvas));
        newCanvas.on('object:added', () => saveHistory(originalPageIndex, newCanvas));
        newCanvas.on('object:removed', () => {
            saveHistory(originalPageIndex, newCanvas);
            setSelectedObject(null);
        });

        updateBrush(newCanvas, activeTool, color, brushSize);
        fabricInstance.current = newCanvas;
    };

    const updateBrush = (canv, tool, col, size) => {
        if (!canv) return;
        canv.isDrawingMode = (tool === 'draw' || tool === 'eraser');
        if (canv.isDrawingMode) {
            canv.freeDrawingBrush = new fabric.PencilBrush(canv);
            canv.freeDrawingBrush.width = size;
            canv.freeDrawingBrush.color = tool === 'eraser' ? '#ffffff' : col;
        }
    };

    // Keep active tool synced
    useEffect(() => {
        if (fabricInstance.current) {
            const canv = fabricInstance.current;
            // Save state before switching tools just in case? object:modified handles most.
            updateBrush(canv, activeTool, color, brushSize);
        }
    }, [activeTool, color, brushSize]);

    // --- History (Undo/Redo) ---
    const saveHistory = (pageIdx, canv) => {
        const json = canv.toJSON();
        setPageStates(prev => ({ ...prev, [pageIdx]: json }));

        setHistory(prev => {
            const pageHist = prev[pageIdx] || { undo: [], redo: [] };
            const newUndo = [...pageHist.undo, json].slice(-20);
            return { ...prev, [pageIdx]: { undo: newUndo, redo: [] } };
        });
    };

    const handleUndo = () => {
        if (!fabricInstance.current) return;
        const origIdx = pageOrder[currentPage - 1];
        const pageHist = history[origIdx];
        if (!pageHist || pageHist.undo.length === 0) return;

        const newUndo = [...pageHist.undo];
        const currentState = newUndo.pop(); // Pop current
        const stateToLoad = newUndo[newUndo.length - 1]; // Previous

        if (stateToLoad) {
            fabricInstance.current.loadFromJSON(stateToLoad, fabricInstance.current.renderAll.bind(fabricInstance.current));
            setHistory(prev => ({
                ...prev,
                [origIdx]: { undo: newUndo, redo: [...pageHist.redo, currentState] }
            }));
        } else {
            // If explicit empty state ?
            fabricInstance.current.clear();
            setHistory(prev => ({
                ...prev,
                [origIdx]: { undo: [], redo: [...pageHist.redo, currentState] }
            }));
        }
    };

    const handleRedo = () => {
        if (!fabricInstance.current) return;
        const origIdx = pageOrder[currentPage - 1];
        const pageHist = history[origIdx];
        if (!pageHist || pageHist.redo.length === 0) return;

        const stateToLoad = pageHist.redo[pageHist.redo.length - 1];
        const newRedo = [...pageHist.redo];
        newRedo.pop();

        fabricInstance.current.loadFromJSON(stateToLoad, fabricInstance.current.renderAll.bind(fabricInstance.current));
        setHistory(prev => ({
            ...prev,
            [origIdx]: { undo: [...pageHist.undo, stateToLoad], redo: newRedo }
        }));
    };

    // --- Tools ---
    const addText = () => {
        if (!fabricInstance.current) return;
        setActiveTool('select');
        const text = new fabric.IText('Text', {
            left: 50, top: 50, fill: color, fontSize: fontSize, fontFamily: 'Helvetica'
        });
        fabricInstance.current.add(text);
        fabricInstance.current.setActiveObject(text);
    };

    const addImage = (e) => {
        const file = e.target.files[0];
        if (!file || !fabricInstance.current) return;
        const reader = new FileReader();
        reader.onload = (f) => {
            fabric.Image.fromURL(f.target.result, (img) => {
                img.set({ left: 50, top: 50 });
                img.scaleToWidth(200);
                fabricInstance.current.add(img);
                fabricInstance.current.setActiveObject(img);
            });
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const replaceImage = (e) => {
        const file = e.target.files[0];
        if (!file || !fabricInstance.current || !selectedObject || selectedObject.type !== 'image') return;

        const reader = new FileReader();
        reader.onload = (f) => {
            selectedObject.setSrc(f.target.result, () => {
                fabricInstance.current.renderAll();
                fabricInstance.current.fire('object:modified');
            });
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const deleteSelected = () => {
        if (fabricInstance.current && selectedObject) {
            fabricInstance.current.remove(selectedObject);
            fabricInstance.current.discardActiveObject();
        }
    };

    // --- Page Ops ---
    const deleteCurrentPage = () => {
        if (numPages <= 1) return alert("Cannot delete only page");
        if (!confirm("Delete page?")) return;
        const newOrder = [...pageOrder];
        newOrder.splice(currentPage - 1, 1);
        setPageOrder(newOrder);
        setNumPages(prev => prev - 1);
        setCurrentPage(prev => Math.min(prev, newOrder.length));
    };

    const movePage = (dir) => {
        const idx = currentPage - 1;
        const newIdx = idx + dir;
        if (newIdx < 0 || newIdx >= pageOrder.length) return;
        const newOrder = [...pageOrder];
        [newOrder[idx], newOrder[newIdx]] = [newOrder[newIdx], newOrder[idx]];
        setPageOrder(newOrder);
        setCurrentPage(newIdx + 1);
    };

    // --- Download ---
    const handleDownload = async () => {
        if (fabricInstance.current && pageOrder[currentPage - 1] !== undefined) {
            const origIdx = pageOrder[currentPage - 1];
            setPageStates(prev => ({ ...prev, [origIdx]: fabricInstance.current.toJSON() }));
        }

        const payload = {
            filePath,
            changes: {
                pages: pageStates,
                pageOrder,
                uiScale: scale
            }
        };

        try {
            const res = await axios.post('http://localhost:5000/api/tools/pdf/advanced-editor/apply-changes', payload);
            if (res.data.success) window.open(`http://localhost:5000${res.data.downloadUrl}`, '_blank');
        } catch (e) { console.error(e); alert("Generation Failed"); }
    };

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* Sidebar (No Changes in structure) */}
            <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-4 shadow-sm z-10">
                <button onClick={() => setActiveTool('select')} className={`p-3 rounded-lg ${activeTool === 'select' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}><FontAwesomeIcon icon={faMousePointer} /></button>
                <button onClick={addText} className="p-3 rounded-lg text-gray-600 hover:bg-gray-100"><FontAwesomeIcon icon={faFont} /></button>
                <label className="p-3 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer"><FontAwesomeIcon icon={faImage} /><input type="file" hidden accept="image/*" ref={fileInputRef} onChange={addImage} /></label>
                <button onClick={() => setActiveTool('draw')} className={`p-3 rounded-lg ${activeTool === 'draw' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}><FontAwesomeIcon icon={faPen} /></button>
                <button onClick={() => setActiveTool('eraser')} className={`p-3 rounded-lg ${activeTool === 'eraser' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}><FontAwesomeIcon icon={faEraser} /></button>
                <div className="h-px w-8 bg-gray-300 my-2"></div>
                <button onClick={handleUndo} className="p-3 rounded-lg text-gray-600 hover:bg-gray-100"><FontAwesomeIcon icon={faUndo} /></button>
                <button onClick={handleRedo} className="p-3 rounded-lg text-gray-600 hover:bg-gray-100"><FontAwesomeIcon icon={faRedo} /></button>
            </div>

            {/* Main */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Top Bar */}
                <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-xl font-bold text-gray-800 flex items-center"><FontAwesomeIcon icon={faFilePdf} className="mr-2 text-red-500" /> PDF Editor</h1>
                        {!file && <input type="file" accept="application/pdf" className="text-sm text-gray-500 file:mr-4 file:py-2 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" onChange={handleFileUpload} />}
                    </div>

                    {file && (
                        <div className="flex items-center space-x-4 bg-gray-100 rounded-lg px-2 py-1">
                            <div className="flex items-center pr-4 border-r border-gray-300 mr-4">
                                <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-2 text-gray-600 hover:text-blue-600"><FontAwesomeIcon icon={faSearchMinus} /></button>
                                <span className="text-xs font-mono w-12 text-center">{Math.round(scale * 100)}%</span>
                                <button onClick={() => setScale(s => Math.min(3.0, s + 0.1))} className="p-2 text-gray-600 hover:text-blue-600"><FontAwesomeIcon icon={faSearchPlus} /></button>
                            </div>

                            <button onClick={() => movePage(-1)} className="p-2 text-gray-600 hover:text-blue-600"><FontAwesomeIcon icon={faExchangeAlt} className="rotate-180" /></button>
                            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1} className="p-2 text-gray-600 hover:text-blue-600 disabled:opacity-30"><FontAwesomeIcon icon={faArrowLeft} /></button>
                            <span className="text-sm font-medium">Page {currentPage} of {numPages}</span>
                            <button onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))} disabled={currentPage >= numPages} className="p-2 text-gray-600 hover:text-blue-600 disabled:opacity-30"><FontAwesomeIcon icon={faArrowRight} /></button>
                            <button onClick={() => movePage(1)} className="p-2 text-gray-600 hover:text-blue-600"><FontAwesomeIcon icon={faExchangeAlt} /></button>
                            <button onClick={deleteCurrentPage} className="p-2 text-red-500 hover:text-red-700 ml-2"><FontAwesomeIcon icon={faTrash} /></button>
                        </div>
                    )}

                    <div>
                        <button onClick={handleDownload} disabled={!file} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium shadow-sm flex items-center disabled:opacity-50">
                            <FontAwesomeIcon icon={faDownload} className="mr-2" /> Download
                        </button>
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 overflow-auto bg-gray-200 p-8 flex justify-center relative" ref={containerRef}>
                    <div className="relative shadow-xl border border-gray-300 bg-white" style={{ width: 'fit-content', height: 'fit-content' }}>
                        {/* PDF Render Layer */}
                        <canvas ref={pdfCanvasRef} className="block" />
                        {/* Fabric Overlay Layer */}
                        <div className="absolute top-0 left-0 z-10 w-full h-full">
                            <canvas ref={canvasRef} />
                        </div>
                        {!file && <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">Upload a PDF to start</div>}
                    </div>
                </div>
            </div>

            {/* Properties Panel (Same as before) */}
            <div className="w-72 bg-white border-l border-gray-200 p-6 flex flex-col overflow-y-auto">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Properties</h3>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                        <div className="flex items-center space-x-2">
                            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-10 p-0 border-0 rounded cursor-pointer" />
                            <span className="text-sm text-gray-500 uppercase">{color}</span>
                        </div>
                    </div>
                    {(activeTool === 'select' && selectedObject && (selectedObject.type === 'i-text' || selectedObject.type === 'text')) && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                            <input type="range" min="8" max="72" value={selectedObject.fontSize || fontSize} onChange={e => {
                                const val = Number(e.target.value);
                                setFontSize(val);
                                selectedObject.set('fontSize', val);
                                fabricInstance.current.requestRenderAll();
                                fabricInstance.current.fire('object:modified');
                            }} className="w-full" />
                        </div>
                    )}
                    {(activeTool === 'draw' || activeTool === 'eraser') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Brush Size</label>
                            <input type="range" min="1" max="50" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-full" />
                        </div>
                    )}
                    {selectedObject && selectedObject.type === 'image' && (
                        <div className="pt-4 border-t border-gray-100">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Image Options</label>
                            <button onClick={() => replaceInputRef.current.click()} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded text-sm font-medium mb-2">Replace Image</button>
                            <input type="file" accept="image/*" hidden ref={replaceInputRef} onChange={replaceImage} />
                        </div>
                    )}
                    {selectedObject && (
                        <div className="pt-4 border-t border-gray-100 mt-auto">
                            <button onClick={deleteSelected} className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded text-sm font-medium border border-red-200 flex items-center justify-center"><FontAwesomeIcon icon={faTrash} className="mr-2" /> Delete Element</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdvancedPdfEditor;
