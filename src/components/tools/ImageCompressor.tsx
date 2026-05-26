import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, FileImage, Sliders, CheckCircle } from 'lucide-react';
import { useToolHistory } from '../../hooks/useToolHistory';

export const ImageCompressor: React.FC = () => {
  const { addToHistory } = useToolHistory();
  const [originalImage, setOriginalImage] = useState<{
    name: string;
    dataUrl: string;
    size: number;
    type: string;
    width: number;
    height: number;
  } | null>(null);

  const [compressedImage, setCompressedImage] = useState<{
    dataUrl: string;
    size: number;
    reduction: number;
    width: number;
    height: number;
  } | null>(null);

  const [quality, setQuality] = useState<number>(75); // percent 0-100
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          const img = new Image();
          img.onload = () => {
            setOriginalImage({
              name: file.name,
              dataUrl: event.target!.result as string,
              size: file.size,
              type: file.type,
              width: img.width,
              height: img.height,
            });
            // Reset compressed image
            setCompressedImage(null);
          };
          img.src = event.target!.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompress = async () => {
    if (!originalImage) return;
    setIsCompressing(true);

    // wait for layout update
    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          setIsCompressing(false);
          return;
        }

        // Draw image fully onto canvas
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        // Convert canvas output to data URL running compression level (e.g., JPEG / WebP both support quality args)
        // PNG doesn't support built-in browser lossy quality, so we compress PNGs by transcoding to high compatibility JPEG/WEBP or downscaled buffers if preferred.
        // If PNG is uploaded, we transcode to JPEG for high efficiency lossy reduction unless user overrides
        const targetFormat = originalImage.type === 'image/png' ? 'image/jpeg' : originalImage.type;
        const targetQuality = quality / 100;

        const compressedDataUrl = canvas.toDataURL(targetFormat, targetQuality);

        // Calculate size from DataURL representation
        // Base64 string is ~33% larger than binary data, decode back to count actual binary bytes
        const stringLength = compressedDataUrl.split(',')[1].length;
        const binarySizeInBytes = Math.round(stringLength * 3 / 4) - (compressedDataUrl.endsWith('==') ? 2 : compressedDataUrl.endsWith('=') ? 1 : 0);

        const reductionPercentage = Math.max(0, Math.round(((originalImage.size - binarySizeInBytes) / originalImage.size) * 100));

        setCompressedImage({
          dataUrl: compressedDataUrl,
          size: binarySizeInBytes,
          reduction: reductionPercentage,
          width: img.width,
          height: img.height,
        });

        addToHistory(
          'image-compressor',
          'Image Compressor',
          'success',
          `Compressed image: "${originalImage.name}" from ${(originalImage.size / 1024).toFixed(1)}KB down to ${(binarySizeInBytes / 1024).toFixed(1)}KB (reduced by ${reductionPercentage}%)`
        );
      };
      img.src = originalImage.dataUrl;
    } catch (err) {
      console.error(err);
      alert('Failed to compress image due to file or browser capabilities.');
    } finally {
      setIsCompressing(false);
    }
  };

  // Auto-trigger compression when quality slider is adjusted or original changes
  useEffect(() => {
    if (originalImage) {
      handleCompress();
    }
  }, [quality, originalImage?.dataUrl]);

  const handleDownload = () => {
    if (!compressedImage || !originalImage) return;
    const link = document.createElement('a');
    
    // Choose appropriate file prefix extension
    const extension = originalImage.type === 'image/png' ? 'jpg' : originalImage.type.split('/')[1] || 'jpg';
    const cleanName = originalImage.name.substring(0, originalImage.name.lastIndexOf('.')) || originalImage.name;
    
    link.download = `${cleanName}-compressed.${extension}`;
    link.href = compressedImage.dataUrl;
    link.click();
  };

  const formatSize = (bytes: number): string => {
    const kb = bytes / 1024;
    return kb > 1000 ? `${(kb / 1024).toFixed(2)} MB` : `${Math.round(kb)} KB`;
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6" id="tool-image-compressor">
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
          Image Optimizer & Compressor
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 font-normal">
          Scale down heavy JPEGs, PNGs, and WebP graphics for mobile apps or webs. Select quality weights and watch file sizes reduce in real-time.
        </p>

        {/* Upload Zone */}
        {!originalImage ? (
          <div
            onClick={triggerUpload}
            className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-800 hover:border-emerald-500 dark:hover:border-emerald-500 py-12 px-6 text-center cursor-pointer transition-colors bg-neutral-50/50 dark:bg-neutral-900/30"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <Upload className="h-5.5 w-5.5" />
            </div>
            <span className="mt-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Select or drop image file here
            </span>
            <span className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
              Supports JPEG, JPG, PNG, and WebP formats.
            </span>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-900 pb-4">
              <div className="flex items-center gap-2 truncate">
                <FileImage className="h-4.5 w-4.5 text-neutral-400 shrink-0" />
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-xs">
                  {originalImage.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOriginalImage(null);
                  setCompressedImage(null);
                }}
                className="text-xs font-medium text-red-500 hover:text-red-650 transition-colors"
              >
                Choose Another Image
              </button>
            </div>

            {/* Slider Config panel */}
            <div className="rounded-xl border border-neutral-100 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-900/20 p-4.5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Settings & Quality
                </span>
                <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {quality}% Quality
                </span>
              </div>
              
              <div className="space-y-2">
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full h-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
                />
                <div className="flex justify-between text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">
                  <span>Extreme Compression (5%)</span>
                  <span>Balanced</span>
                  <span>Lossless (100%)</span>
                </div>
              </div>

              {originalImage.type === 'image/png' && (
                <div className="rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-400">
                  ⚠️ PNG transparency requires conversion to JPEG formats to achieve compression gains. Outputs will save with a white background.
                </div>
              )}
            </div>

            {/* Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original Card */}
              <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 bg-neutral-50/30 dark:bg-neutral-950/20 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-bold tracking-wider uppercase text-neutral-400 dark:text-neutral-500 mb-2">Original Canvas</div>
                  <div className="text-base font-bold font-mono text-neutral-800 dark:text-neutral-200">
                    {formatSize(originalImage.size)}
                  </div>
                  <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
                    Dimensions: {originalImage.width} x {originalImage.height}px
                  </div>
                </div>
                <div className="mt-4 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-900 h-44 flex items-center justify-center">
                  <img
                    src={originalImage.dataUrl}
                    alt="Original Preview"
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>

              {/* Compressed Card */}
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-950/50 p-4 bg-emerald-50/5 dark:bg-emerald-950/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-600/80 dark:text-emerald-400/80">Compressed Output</span>
                    {compressedImage && (
                      <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 text-[10px] font-bold">
                        -{compressedImage.reduction}% saved
                      </span>
                    )}
                  </div>
                  <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {isCompressing ? 'Encoding...' : compressedImage ? formatSize(compressedImage.size) : '---'}
                  </div>
                  <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
                    Dimensions: {originalImage.width} x {originalImage.height}px
                  </div>
                </div>

                <div className="mt-4 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-900 h-44 flex items-center justify-center relative">
                  {isCompressing ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                      <span className="text-[11px] text-neutral-400">Recalculating...</span>
                    </div>
                  ) : compressedImage ? (
                    <img
                      src={compressedImage.dataUrl}
                      alt="Compressed Preview"
                      referrerPolicy="no-referrer"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-neutral-400">Loading Preview...</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            {compressedImage && !isCompressing && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3.5 border-t border-neutral-100 dark:border-neutral-900 pt-5">
                <button
                  onClick={handleDownload}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-6 font-medium shadow-md transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  Download Compressed Image
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
