import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { Upload, ArrowUp, ArrowDown, Trash2, FileCode, CheckCircle, HelpCircle } from 'lucide-react';

interface ImageFile {
  id: string;
  name: string;
  dataUrl: string;
  size: string;
}

export const ImageToPdf: React.FC = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'fit'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [margin, setMargin] = useState<number>(10); // in mm
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const processFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const sizeKB = Math.round(file.size / 1024);
            const sizeStr = sizeKB > 1000 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
            
            setImages((prev) => [
              ...prev,
              {
                id: Math.random().toString(36).substr(2, 9),
                name: file.name,
                dataUrl: event.target!.result as string,
                size: sizeStr,
              },
            ]);
            setSuccessMsg('');
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const arr = [...prev];
      const temp = arr[index];
      arr[index] = arr[index - 1];
      arr[index - 1] = temp;
      return arr;
    });
  };

  const moveDown = (index: number) => {
    if (index === images.length - 1) return;
    setImages((prev) => {
      const arr = [...prev];
      const temp = arr[index];
      arr[index] = arr[index + 1];
      arr[index + 1] = temp;
      return arr;
    });
  };

  const generatePdf = async () => {
    if (images.length === 0) return;
    setIsCompiling(true);
    setSuccessMsg('');

    // Wait a brief tick to allow loaders to render
    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      // Dimensions in mm
      // A4 is 210 x 297 mm
      // Letter is 215.9 x 279.4 mm
      const doc = new jsPDF({
        orientation: orientation === 'portrait' ? 'p' : 'l',
        unit: 'mm',
        format: pageSize === 'fit' ? 'a4' : pageSize, // default fit handles dynamically
      });

      const mmPageWidth = orientation === 'portrait' ? 210 : 297;
      const mmPageHeight = orientation === 'portrait' ? 297 : 210;

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        
        // Add new page for subsequent images
        if (i > 0) {
          doc.addPage(
            pageSize === 'fit' ? 'a4' : pageSize, 
            orientation === 'portrait' ? 'p' : 'l'
          );
        }

        // We load image to get native resolution to fit or crop appropriately
        const imageElement = new Image();
        imageElement.src = img.dataUrl;
        await new Promise((resolve) => {
          imageElement.onload = resolve;
        });

        const nativeW = imageElement.width || 100;
        const nativeH = imageElement.height || 100;

        let targetW = mmPageWidth - margin * 2;
        let targetH = mmPageHeight - margin * 2;

        const ratio = nativeW / nativeH;

        if (pageSize === 'fit') {
          // Adjust page bounds to fit image aspect ratio
          // letter values
          const idealW = nativeW * 0.264583; // convert px to mm roughly
          const idealH = nativeH * 0.264583;
          
          targetW = idealW;
          targetH = idealH;
          
          // Re-create page to match exact image scale
          doc.setPage(i + 1);
        } else {
          // Standard A4 / Letter resizing maintaining ratio
          if (targetW / ratio <= targetH) {
            targetH = targetW / ratio;
          } else {
            targetW = targetH * ratio;
          }
        }

        // Center the image in the page content area
        const xOffset = margin + (mmPageWidth - margin * 2 - targetW) / 2;
        const yOffset = margin + (mmPageHeight - margin * 2 - targetH) / 2;

        // Auto-detect image compression type out of canvas format
        let format = 'JPEG';
        if (img.dataUrl.includes('image/png')) {
          format = 'PNG';
        } else if (img.dataUrl.includes('image/webp')) {
          format = 'WEBP';
        }

        doc.addImage(img.dataUrl, format, xOffset, yOffset, targetW, targetH);
      }

      doc.save('compiled-images.pdf');
      setSuccessMsg('PDF Compiled & downloaded successfully!');
    } catch (err) {
      console.error(err);
      alert('Error generating PDF.');
    } finally {
      setIsCompiling(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6" id="tool-image-to-pdf">
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
          Image to PDF Compiler
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
          Merge any PNG, JPG, JPEG, or WebP images into a single professional PDF file. Reorder pages, select aspect ratios, and export instantly.
        </p>

        {/* Drag Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={triggerUpload}
          className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-800 hover:border-emerald-500 dark:hover:border-emerald-500 py-10 px-6 text-center cursor-pointer transition-colors bg-neutral-50/50 dark:bg-neutral-900/30"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
            <Upload className="h-5.5 w-5.5" />
          </div>
          <span className="mt-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Drag and drop images here, or <span className="text-emerald-600 dark:text-emerald-400 underline">browse</span>
          </span>
          <span className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
            Supports PNG, JPG, JPEG, and WebP. Max 20MB per file.
          </span>
        </div>

        {/* Configurations Bar */}
        {images.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl border border-neutral-100 dark:border-neutral-900 bg-neutral-50/60 dark:bg-neutral-900/10 p-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                Page Size
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as any)}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 focus:outline-emerald-500 focus:border-emerald-500 focus:outline focus:outline-1"
              >
                <option value="a4">Standard A4 (210 x 297 mm)</option>
                <option value="letter">US Letter (215.9 x 279.4 mm)</option>
                <option value="fit">Original Fit (Adapts page size)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                Orientation
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`flex-1 rounded-lg border text-sm py-2 px-3 text-center font-medium ${
                    orientation === 'portrait'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  Portrait
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`flex-1 rounded-lg border text-sm py-2 px-3 text-center font-medium ${
                    orientation === 'landscape'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  Landscape
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                Page Margins
              </label>
              <select
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 focus:outline-emerald-500 focus:border-emerald-500 focus:outline focus:outline-1"
              >
                <option value={0}>No Margins (0mm)</option>
                <option value={5}>Border Small (5mm)</option>
                <option value={10}>Border Medium (10mm)</option>
                <option value={20}>Border Large (20mm)</option>
              </select>
            </div>
          </div>
        )}

        {/* Uploaded Files Sort List */}
        {images.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Uploaded Images ({images.length})
              </span>
              <button
                type="button"
                onClick={() => setImages([])}
                className="text-xs font-medium text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                Clear All
              </button>
            </div>

            <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {images.map((img, idx) => (
                <div
                  key={img.id}
                  className="group flex items-center justify-between gap-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/40 p-2.5 transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
                >
                  <div className="flex items-center gap-3 truncate">
                    {/* Thumbnail */}
                    <img
                      src={img.dataUrl}
                      alt="Thumbnail"
                      referrerPolicy="no-referrer"
                      className="h-10 w-10 shrink-0 rounded object-cover border border-neutral-200 dark:border-neutral-800"
                    />
                    <div className="flex flex-col truncate">
                      <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate pr-6">
                        {img.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono mt-0.5">
                        Page {idx + 1} • {img.size}
                      </span>
                    </div>
                  </div>

                  {/* Ordering Controls & Delete */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveUp(idx)}
                      className="p-1 rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-500 disabled:opacity-35 transition-colors"
                      title="Move page up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === images.length - 1}
                      onClick={() => moveDown(idx)}
                      className="p-1 rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-500 disabled:opacity-35 transition-colors"
                      title="Move page down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="p-1 rounded bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors ml-1"
                      title="Remove image"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action button */}
        {images.length > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-end gap-3.5 border-t border-neutral-100 dark:border-neutral-900 pt-6">
            <button
              onClick={generatePdf}
              disabled={isCompiling}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-6 font-medium shadow-md transition-all ${
                isCompiling ? 'opacity-80 cursor-loading' : ''
              }`}
            >
              {isCompiling ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Compiling PDF...
                </>
              ) : (
                <>
                  <FileCode className="h-4 w-4" />
                  Save as Compiled PDF
                </>
              )}
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3 border border-emerald-100 dark:border-emerald-950/50 animate-fadeIn">
            <CheckCircle className="h-4 w-4 shrink-0" />
            {successMsg}
          </div>
        )}
      </div>
    </div>
  );
};
