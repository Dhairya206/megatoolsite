import React, { useState, useRef } from 'react';
import { Upload, Download, Eye, FileText, CheckCircle, Sliders, RefreshCw, ZoomIn, Grid } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Set secure cloud CDN web worker to guarantee iframe compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';

interface RenderedPage {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

export const PdfToImage: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [renderedPages, setRenderedPages] = useState<RenderedPage[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [scale, setScale] = useState<number>(2); // 2x default for beautiful retina rendering
  const [outputFormat, setOutputFormat] = useState<'image/png' | 'image/jpeg'>('image/png');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processPdf(e.target.files[0]);
    }
  };

  const processPdf = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      alert('Please select a valid PDF file.');
      return;
    }
    setPdfFile(file);
    setRenderedPages([]);
    setSuccessMsg('');
    setPreviewImage(null);
    setPageCount(0);
  };

  const startExtraction = async () => {
    if (!pdfFile) return;
    setIsProcessing(true);
    setCurrentProgress(0);
    setSuccessMsg('');

    try {
      const fileReader = new FileReader();
      
      const fileDataPromise = new Promise<ArrayBuffer>((resolve, reject) => {
        fileReader.onload = () => resolve(fileReader.result as ArrayBuffer);
        fileReader.onerror = () => reject(new Error('Failed to read PDF file.'));
      });
      
      fileReader.readAsArrayBuffer(pdfFile);
      const arrayBuffer = await fileDataPromise;
      
      // Load PDF using PDF.js
      const typedarray = new Uint8Array(arrayBuffer);
      const loadingTask = pdfjsLib.getDocument({ data: typedarray });
      
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;
      setPageCount(totalPages);

      const list: RenderedPage[] = [];

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        // Render pages on dynamic canvas
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (context) {
          // Render page background white for transparent sections (especially for JPEG output)
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({
            canvasContext: context,
            viewport: viewport,
          } as any).promise;

          const dataUrl = canvas.toDataURL(outputFormat, outputFormat === 'image/jpeg' ? 0.95 : undefined);
          list.push({
            pageNumber: pageNum,
            dataUrl,
            width: viewport.width,
            height: viewport.height,
          });
        }

        // Update progress dynamically
        const progress = Math.round((pageNum / totalPages) * 100);
        setCurrentProgress(progress);
      }

      setRenderedPages(list);
      setSuccessMsg(`Successfully rendered all ${totalPages} pages at ${scale}x scale!`);
    } catch (err) {
      console.error('PDF JS Rendering Error: ', err);
      alert('Error extracting pages. This may be due to PDF password protection or incompatible format.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPage = (page: RenderedPage) => {
    const ext = outputFormat === 'image/png' ? 'png' : 'jpg';
    const link = document.createElement('a');
    link.href = page.dataUrl;
    link.download = `${pdfFile?.name.replace('.pdf', '')}_Page_${page.pageNumber}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllPages = async () => {
    if (renderedPages.length === 0) return;
    
    // Download sequential page tags
    renderedPages.forEach((page, idx) => {
      setTimeout(() => {
        downloadPage(page);
      }, idx * 250); // delay triggers to prevent pop-up block blockers
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processPdf(e.dataTransfer.files[0]);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6" id="tool-pdf-to-image">
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
          PDF to Image Converter
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 font-normal">
          Convert academic papers, slide decks, or reports from PDF into presentation-ready, high-resolution JPEG or PNG images. Run completely local on your browser.
        </p>

        {/* File Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={triggerUpload}
          className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-800 hover:border-emerald-500 dark:hover:border-emerald-500 py-10 px-6 text-center cursor-pointer transition-colors bg-neutral-50/50 dark:bg-neutral-900/30"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
            <FileText className="h-5.5 w-5.5" />
          </div>
          <span className="mt-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {pdfFile ? pdfFile.name : 'Drag and drop your PDF here, or click to browse'}
          </span>
          <span className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
            {pdfFile ? `${(pdfFile.size / (1024 * 1024)).toFixed(2)} MB • PDF File` : 'Supports multi-page standard files'}
          </span>
        </div>

        {/* Settings Bar */}
        {pdfFile && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-neutral-150 dark:border-neutral-900 bg-neutral-50/40 dark:bg-neutral-900/10 p-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5 flex items-center gap-1">
                <Sliders className="h-3 w-3" />
                <span>Pixel Density (Rendering Quality)</span>
              </label>
              <select
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 focus:outline-emerald-500 focus:outline focus:outline-1 cursor-pointer"
              >
                <option value={1}>Standard Resolution (1x DPI - Fastest)</option>
                <option value={1.5}>Medium Resolution (1.5x DPI)</option>
                <option value={2}>High Resolution (2x DPI - HD Quality)</option>
                <option value={3}>Ultra-Retina Resolution (3x DPI - Crisp Text)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5 flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                <span>Output Image Format</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOutputFormat('image/png')}
                  className={`flex-1 rounded-lg border text-xs py-2 px-3 text-center font-bold tracking-wide cursor-pointer transition-all ${
                    outputFormat === 'image/png'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50'
                  }`}
                >
                  PNG (Lossless & Crisp)
                </button>
                <button
                  type="button"
                  onClick={() => setOutputFormat('image/jpeg')}
                  className={`flex-1 rounded-lg border text-xs py-2 px-3 text-center font-bold tracking-wide cursor-pointer transition-all ${
                    outputFormat === 'image/jpeg'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50'
                  }`}
                >
                  JPEG (Optimized File Size)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Process Triggers */}
        {pdfFile && renderedPages.length === 0 && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={startExtraction}
              disabled={isProcessing}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 shadow-md transition cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing Page Records ({currentProgress}%)</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin-slow" />
                  <span>Render & Extract PDF Pages</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Render Progress Bar */}
        {isProcessing && (
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs text-neutral-500 font-mono font-bold">
              <span>Rasterizing page canvases...</span>
              <span>{currentProgress}%</span>
            </div>
            <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${currentProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="mt-4 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3 border border-emerald-100 dark:border-emerald-950/50">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button
              onClick={downloadAllPages}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-md cursor-pointer transition"
            >
              <Download className="h-3 w-3" />
              <span>Download All</span>
            </button>
          </div>
        )}

        {/* Gallery View Grid */}
        {renderedPages.length > 0 && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-105 dark:border-neutral-900 pb-2">
              <Grid className="h-4 w-4" />
              <span>Extracted Pages ({renderedPages.length})</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto p-1 scrollbar-thin">
              {renderedPages.map((page) => (
                <div
                  key={page.pageNumber}
                  className="group relative flex flex-col rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/10 overflow-hidden shadow-xs hover:shadow-md transition-all p-1.5"
                >
                  <div className="relative aspect-3/4 overflow-hidden rounded-lg bg-white border border-neutral-100 dark:border-neutral-900">
                    <img
                      src={page.dataUrl}
                      alt={`Page ${page.pageNumber}`}
                      className="h-full w-full object-contain object-top"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Hover Utilities Overlay */}
                    <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => setPreviewImage(page.dataUrl)}
                        className="p-2 rounded-full bg-white text-neutral-800 hover:bg-emerald-50 hover:text-emerald-600 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition cursor-pointer"
                        title="Zoom Page Image"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => downloadPage(page)}
                        className="p-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition cursor-pointer"
                        title="Download Page Image"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Footing detail */}
                  <div className="mt-2.5 px-1.5 pb-1 flex items-center justify-between text-[10px] text-neutral-500 font-mono font-bold uppercase">
                    <span>Page {page.pageNumber}</span>
                    <span>{page.width}x{page.height}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox / Zoom Modal Overlay */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 cursor-zoom-out animate-in fade-in duration-200"
        >
          <div className="relative max-w-4xl max-h-[90vh] rounded-xl overflow-hidden shadow-2xl bg-white p-1">
            <img
              src={previewImage}
              alt="High-resolution Preview"
              className="max-h-[85vh] max-w-full object-contain rounded"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 h-9 w-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white cursor-pointer select-none"
            >
              <ZoomIn className="h-4 w-4 transform rotate-45" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
