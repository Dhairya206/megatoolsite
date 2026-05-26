import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, RefreshCw, Layers, Pipette, Sliders, CheckCircle, Info, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ImageBgRemover: React.FC = () => {
  const [imageFile, setImageFile] = useState<{
    name: string;
    dataUrl: string;
    width: number;
    height: number;
  } | null>(null);

  const [targetColor, setTargetColor] = useState<{ r: number; g: number; b: number }>({ r: 255, g: 255, b: 255 });
  const [colorHex, setColorHex] = useState<string>('#FFFFFF');
  const [useCornerDetect, setUseCornerDetect] = useState<boolean>(true);
  
  const [tolerance, setTolerance] = useState<number>(30);
  const [smoothness, setSmoothness] = useState<number>(15);
  const [invertMask, setInvertMask] = useState<boolean>(false);
  
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isPipetting, setIsPipetting] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Parse color from hex string
  const customHexChange = (hex: string) => {
    setColorHex(hex);
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      setTargetColor({ r, g, b });
      setUseCornerDetect(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          const img = new Image();
          img.onload = () => {
            setImageFile({
              name: file.name,
              dataUrl: event.target!.result as string,
              width: img.width,
              height: img.height,
            });
            // Detect top-left color by default
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, 1, 1);
              const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
              setTargetColor({ r, g, b });
              setColorHex('#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase());
              setUseCornerDetect(true);
            }
            setProcessedImageUrl(null);
          };
          img.src = event.target!.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Run the background removal algorithm
  const processImage = () => {
    if (!imageFile) return;
    setIsProcessing(true);

    const img = new Image();
    img.src = imageFile.dataUrl;
    img.onload = () => {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const len = data.length;

      const tc = targetColor;
      const tol = tolerance;
      const smooth = smoothness;

      for (let i = 0; i < len; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];

        // Euclidean distance in color space
        const distance = Math.sqrt(
          Math.pow(r - tc.r, 2) +
          Math.pow(g - tc.g, 2) +
          Math.pow(b - tc.b, 2)
        );

        if (!invertMask) {
          if (distance < tol) {
            // Smooth alpha blending
            if (smooth > 0 && distance > tol - smooth) {
              const alphaFactor = (distance - (tol - smooth)) / smooth;
              data[i+3] = Math.min(data[i+3], Math.floor(alphaFactor * 255));
            } else {
              data[i+3] = 0;
            }
          }
        } else {
          // Keep only matching colors, remove everything else
          if (distance > tol) {
            if (smooth > 0 && distance < tol + smooth) {
              const alphaFactor = (tol + smooth - distance) / smooth;
              data[i+3] = Math.min(data[i+3], Math.floor(alphaFactor * 255));
            } else {
              data[i+3] = 0;
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      setProcessedImageUrl(canvas.toDataURL('image/png'));
      setIsProcessing(false);
    };
  };

  // Re-run whenever variables change
  useEffect(() => {
    if (imageFile) {
      const timer = setTimeout(() => {
        processImage();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [imageFile, targetColor, tolerance, smoothness, invertMask]);

  // Click on original preview to pipette target background color
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageFile || !isPipetting) return;

    const imgElement = e.currentTarget;
    const rect = imgElement.getBoundingClientRect();
    
    // Exact pixels mapping of original sizes
    const clickX = ((e.clientX - rect.left) / rect.width) * imageFile.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * imageFile.height;

    const canvas = document.createElement('canvas');
    canvas.width = imageFile.width;
    canvas.height = imageFile.height;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const img = new Image();
      img.src = imageFile.dataUrl;
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        try {
          const pixel = ctx.getImageData(Math.floor(clickX), Math.floor(clickY), 1, 1).data;
          const r = pixel[0];
          const g = pixel[1];
          const b = pixel[2];
          setTargetColor({ r, g, b });
          setColorHex('#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase());
          setUseCornerDetect(false);
          setIsPipetting(false);
        } catch (err) {
          console.error('Failed to pipette color:', err);
        }
      };
    }
  };

  const downloadProcessed = () => {
    if (!processedImageUrl || !imageFile) return;
    const link = document.createElement('a');
    const originalName = imageFile.name.substring(0, imageFile.name.lastIndexOf('.')) || imageFile.name;
    link.download = `${originalName}_transparent.png`;
    link.href = processedImageUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto p-4 md:p-6 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 transition-colors">
      
      {/* Dynamic Checkerboard styling for alpha background */}
      <style>{`
        .checkerboard-bg {
          background-color: #ffffff;
          background-image: radial-gradient(#e5e7eb 20%, transparent 20%), radial-gradient(#e5e7eb 20%, #ffffff 20%);
          background-size: 16px 16px;
          background-position: 0 0, 8px 8px;
        }
        .dark .checkerboard-bg {
          background-color: #171717;
          background-image: radial-gradient(#262626 20%, transparent 20%), radial-gradient(#262626 20%, #171717 20%);
          background-size: 16px 16px;
          background-position: 0 0, 8px 8px;
        }
      `}</style>

      {/* Intro Header */}
      <div className="flex flex-col gap-1 md:flex-row md:items-center justify-between border-b border-neutral-200 dark:border-neutral-850 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <Layers className="h-5 w-5 text-emerald-500" />
            Background Remover (Chroma & Solid Colors)
          </h2>
          <p className="text-xs text-neutral-500 max-w-xl">
            Upload any product graphic, portrait, logotype, or banner. Select the background color with a pipette or custom values to make it transparent instantly offline.
          </p>
        </div>
        {imageFile && (
          <button
            onClick={() => {
              setImageFile(null);
              setProcessedImageUrl(null);
              setIsPipetting(false);
            }}
            className="text-xs px-2.5 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition mt-2 md:mt-0 font-medium self-start md:self-auto"
          >
            Clear Upload
          </button>
        )}
      </div>

      {!imageFile ? (
        /* Drag & Drop Area */
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer bg-neutral-50/50 dark:bg-neutral-950/20 hover:bg-neutral-100/30 dark:hover:bg-neutral-950/50 transition duration-350 select-none group"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          <div className="h-12 w-12 rounded-xl bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-500 dark:text-neutral-400 group-hover:scale-105 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-all duration-300 shadow-sm">
            <Upload className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-neutral-850 dark:text-neutral-100">
            Upload your source image
          </h3>
          <p className="mt-1 text-xs text-neutral-400 max-w-xs">
            Supports PNG, JPG, JPEG, and WebP up to 10MB. Transformed instantly completely client-side.
          </p>
        </div>
      ) : (
        /* Color selection & Editor workspace */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Controls Panel (4 columns) */}
          <div className="lg:col-span-4 flex flex-col gap-5 p-4 bg-neutral-50 dark:bg-neutral-900/45 border border-neutral-150 dark:border-neutral-850 rounded-xl">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-emerald-500" />
              Chroma Adjustments
            </h3>

            {/* Color sampling */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex justify-between">
                <span>Target Color to Remove:</span>
                <span className="text-[10px] text-neutral-400 font-mono">RGB: {targetColor.r},{targetColor.g},{targetColor.b}</span>
              </label>
              
              <div className="flex items-center gap-2">
                {/* Visual Color Preview block */}
                <div 
                  className="h-10 w-10 rounded-lg border border-neutral-300 dark:border-neutral-700 shadow-inner flex-shrink-0"
                  style={{ backgroundColor: `rgb(${targetColor.r},${targetColor.g},${targetColor.b})` }}
                  title="Target background color color definition"
                />

                <input
                  type="text"
                  value={colorHex}
                  onChange={(e) => customHexChange(e.target.value)}
                  placeholder="#FFFFFF"
                  className="w-full h-10 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs font-mono focus:outline outline-emerald-500"
                />

                <button
                  onClick={() => setIsPipetting(!isPipetting)}
                  className={`h-10 px-3 rounded-lg border flex items-center gap-1 text-xs font-medium transition ${
                    isPipetting 
                      ? 'bg-emerald-600 text-white border-emerald-600' 
                      : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-300'
                  }`}
                  title="Click to pipette color directly from the source image preview"
                >
                  <Pipette className="h-4 w-4" />
                  <span>Pipette</span>
                </button>
              </div>

              {/* Pipette instructions */}
              {isPipetting && (
                <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 p-2 rounded-md leading-relaxed">
                  <strong>Pipette active:</strong> Move your mouse to the <strong>Original Image Map</strong> below and click to pick any specific color to remove.
                </div>
              )}

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setTargetColor({ r: 255, g: 255, b: 255 });
                    setColorHex('#FFFFFF');
                    setUseCornerDetect(false);
                  }}
                  className="text-[10px] px-2 py-1 rounded border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 font-mono transition"
                >
                  White
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetColor({ r: 0, g: 0, b: 0 });
                    setColorHex('#000000');
                    setUseCornerDetect(false);
                  }}
                  className="text-[10px] px-2 py-1 rounded border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 font-mono transition"
                >
                  Black
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetColor({ r: 0, g: 255, b: 0 });
                    setColorHex('#00FF00');
                    setUseCornerDetect(false);
                  }}
                  className="text-[10px] px-2 py-1 rounded border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 font-mono transition"
                >
                  Green Screen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // corner sample estimation
                    const img = new Image();
                    img.src = imageFile.dataUrl;
                    img.onload = () => {
                      const canvas = document.createElement('canvas');
                      canvas.width = 1;
                      canvas.height = 1;
                      const ctx = canvas.getContext('2d');
                      if (ctx) {
                        ctx.drawImage(img, 0, 0, 1, 1);
                        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
                        setTargetColor({ r, g, b });
                        setColorHex('#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase());
                        setUseCornerDetect(true);
                      }
                    };
                  }}
                  className="text-[10px] px-2 py-1 rounded border border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 font-medium transition"
                >
                  Auto Corner
                </button>
              </div>
            </div>

            {/* Color Tolerance Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-medium text-neutral-700 dark:text-neutral-300">
                <span>Color Tolerance:</span>
                <span className="font-mono text-emerald-500">{tolerance}</span>
              </div>
              <input
                type="range"
                min="5"
                max="160"
                value={tolerance}
                onChange={(e) => setTolerance(parseInt(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[10px] text-neutral-400">
                Higher values remove colors similar to the target (for shadows/complex edges).
              </p>
            </div>

            {/* Edge Smoothness / Feather */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-medium text-neutral-700 dark:text-neutral-300">
                <span>Edge feathering / smoothness:</span>
                <span className="font-mono text-emerald-500">{smoothness}</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={smoothness}
                onChange={(e) => setSmoothness(parseInt(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[10px] text-neutral-400">
                Blends color boundaries gracefully with alpha gradients for professional edge matching.
              </p>
            </div>

            {/* Mode switch (Invert) */}
            <div className="flex items-center justify-between border-t border-b border-neutral-150 dark:border-neutral-850 py-3 mt-1">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Invert Masking</span>
                <span className="text-[10px] text-neutral-400">Keep only selected, remove all else</span>
              </div>
              <button
                type="button"
                onClick={() => setInvertMask(!invertMask)}
                className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                  invertMask ? 'bg-emerald-600' : 'bg-neutral-350 dark:bg-neutral-700'
                }`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${invertMask ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Download section */}
            <button
              onClick={downloadProcessed}
              disabled={!processedImageUrl}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-neutral-200 dark:disabled:bg-neutral-800 disabled:text-neutral-400 dark:disabled:text-neutral-600 font-bold rounded-lg flex items-center justify-center gap-2 text-sm shadow-md transition"
            >
              <Download className="h-4.5 w-4.5" />
              <span>Download Transparent PNG</span>
            </button>
          </div>

          {/* Dual Previews Grid (8 columns) */}
          <div className="lg:col-span-8 flex flex-col gap-6" ref={previewContainerRef}>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Left Column: Original Viewport */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  1. Original Source Image
                </span>
                <div 
                  className={`relative border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 shadow-inner flex items-center justify-center min-h-[280px] md:min-h-[340px] max-h-[460px] ${
                    isPipetting ? 'cursor-radial-picker cursor-crosshair border-amber-500 shadow border-2' : ''
                  }`}
                >
                  <img
                    src={imageFile.dataUrl}
                    alt="Original source layout"
                    onClick={handleImageClick}
                    className="max-w-full max-h-[340px] md:max-h-[400px] object-contain select-none"
                    referrerPolicy="no-referrer"
                  />
                  {isPipetting && (
                    <div className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-1">
                      <Pipette className="h-3 w-3 animate-pulse" />
                      <span>Pipette Active</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] text-neutral-400">
                    Source dimensions: <strong>{imageFile.width} x {imageFile.height} px</strong>
                  </span>
                  {useCornerDetect && (
                    <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-medium">
                      Auto-detected background
                    </span>
                  )}
                </div>
              </div>

              {/* Right Column: Matched Transparency Output */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  2. Transparent Result (PNG)
                </span>
                <div className="relative border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden checkerboard-bg shadow-inner flex items-center justify-center min-h-[280px] md:min-h-[340px] max-h-[460px]">
                  {processedImageUrl ? (
                    <img
                      src={processedImageUrl}
                      alt="Transparency output result visual"
                      className="max-w-full max-h-[340px] md:max-h-[400px] object-contain transition-all"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-neutral-400 dark:text-neutral-500 text-xs">
                      <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
                      <span>Rendering transparency alpha masks...</span>
                    </div>
                  )}

                  {isProcessing && (
                    <div className="absolute inset-0 bg-neutral-900/40 dark:bg-neutral-950/60 backdrop-blur-[1px] flex items-center justify-center">
                      <div className="bg-white dark:bg-neutral-900 px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 shadow-lg">
                        <RefreshCw className="h-4 w-4 animate-spin text-emerald-500" />
                        <span>Recalculating mask...</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] text-neutral-400">
                    Result format: <strong>image/png (Lossless alpha channel)</strong>
                  </span>
                  {processedImageUrl && (
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-medium flex items-center gap-1 leading-none">
                      <CheckCircle className="h-2.5 w-2.5" /> Ready
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* Technical Help Box */}
            <div className="bg-neutral-50 dark:bg-neutral-900/20 p-3 border border-neutral-150 dark:border-neutral-850 rounded-lg text-xs flex gap-2.5 text-neutral-500 dark:text-neutral-400 leading-normal">
              <Info className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">Tips for Best Results:</span>
                <ul className="list-disc pl-4 space-y-1 mt-1 text-[11px]">
                  <li>Click <strong>"Pipette"</strong> and select your image background directly.</li>
                  <li>In case of shadows or variations, increase the <strong>Color Tolerance</strong> slowly.</li>
                  <li>Enable <strong>Edge feathering</strong> to prevent jagged or hard pixelated outlines, resulting in clean, professional graphics.</li>
                </ul>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Offscreen canvas rendering pipeline */}
      <canvas ref={canvasRef} className="hidden" />

    </div>
  );
};
