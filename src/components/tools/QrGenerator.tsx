import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { QrCode, Download, RefreshCw, Copy, Check } from 'lucide-react';

export const QrGenerator: React.FC = () => {
  const [text, setText] = useState<string>('https://ai.studio/build');
  const [size, setSize] = useState<number>(300);
  const [darkColor, setDarkColor] = useState<string>('#0f172a'); // default slate-900
  const [lightColor, setLightColor] = useState<string>('#ffffff');
  const [errorCorrection, setErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  
  const generateQr = async () => {
    if (!text.trim()) {
      setQrCodeDataUrl('');
      return;
    }
    
    setIsGenerating(true);
    try {
      const options: QRCode.QRCodeToDataURLOptions = {
        width: size,
        margin: 2,
        errorCorrectionLevel: errorCorrection,
        color: {
          dark: darkColor,
          light: lightColor,
        },
      };

      const url = await QRCode.toDataURL(text, options);
      setQrCodeDataUrl(url);
    } catch (err) {
      console.error('Error generating QR Code', err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      generateQr();
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [text, size, darkColor, lightColor, errorCorrection]);

  const handleDownload = () => {
    if (!qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.download = `qr-code.png`;
    link.href = qrCodeDataUrl;
    link.click();
  };

  const handleCopy = async () => {
    if (!qrCodeDataUrl) return;
    try {
      // Decode Base64 dataURL to blob to write to clipboard as an image
      const response = await fetch(qrCodeDataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard copy image failed', err);
      // Fallback: Copy as a text string URL if canvas fails
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6" id="tool-qr-generator">
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
          QR Code Builder & Designer
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 font-normal">
          Generate clean, customizable, and high-fidelity QR Code graphics instantly. Modify dimensions and code node alignments.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Configurations Column */}
          <div className="lg:col-span-7 space-y-5">
            {/* Input Content */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Data / Redirect URL
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter a website URL, email, or textual message to encode..."
                rows={3}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3.5 py-3 text-sm text-neutral-800 dark:text-neutral-200 focus:outline-emerald-500 focus:border-emerald-500 focus:outline focus:outline-1 font-mono"
              />
            </div>

            {/* Visual Customizations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Dark Node Color Picker */}
              <div className="rounded-lg border border-neutral-100 dark:border-neutral-900 p-3 bg-neutral-50/20 dark:bg-neutral-900/10">
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
                  Node Color (Slate)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={darkColor}
                    onChange={(e) => setDarkColor(e.target.value)}
                    className="h-9 w-9 border-0 rounded cursor-pointer shrink-0 bg-transparent p-0"
                  />
                  <input
                    type="text"
                    value={darkColor}
                    onChange={(e) => setDarkColor(e.target.value)}
                    maxLength={7}
                    className="w-full rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 py-1 text-sm text-neutral-800 dark:text-neutral-250 font-mono focus:outline-emerald-500 focus:outline focus:outline-1"
                  />
                </div>
              </div>

              {/* Light Background Color Picker */}
              <div className="rounded-lg border border-neutral-100 dark:border-neutral-900 p-3 bg-neutral-50/20 dark:bg-neutral-900/10">
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
                  Canvas Background
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={lightColor}
                    onChange={(e) => setLightColor(e.target.value)}
                    className="h-9 w-9 border-0 rounded cursor-pointer shrink-0 bg-transparent p-0"
                  />
                  <input
                    type="text"
                    value={lightColor}
                    onChange={(e) => setLightColor(e.target.value)}
                    maxLength={7}
                    className="w-full rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 py-1 text-sm text-neutral-800 dark:text-neutral-250 font-mono focus:outline-emerald-500 focus:outline focus:outline-1"
                  />
                </div>
              </div>
            </div>

            {/* Error correction and scale range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4.5 rounded-lg border border-neutral-100 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-900/10">
              {/* Size scale */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="font-semibold">Grid Resolution</span>
                  <span className="font-mono">{size} x {size}px</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="800"
                  step="50"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              {/* Error correction levels */}
              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  Fault Tolerances (ECC)
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {(['L', 'M', 'Q', 'H'] as const).map((level) => {
                    let levelLabel = 'S';
                    if (level === 'L') levelLabel = 'Low (7%)';
                    if (level === 'M') levelLabel = 'Med (15%)';
                    if (level === 'Q') levelLabel = 'High (25%)';
                    if (level === 'H') levelLabel = 'Max (30%)';

                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setErrorCorrection(level)}
                        className={`text-xs py-1.5 px-1 font-medium rounded transition-colors ${
                          errorCorrection === level
                            ? 'bg-emerald-600 text-white'
                            : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}
                        title={levelLabel}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Results Output Canvas Column */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 border border-neutral-100 dark:border-neutral-900 rounded-xl bg-neutral-50/20 dark:bg-neutral-950/20 max-w-sm mx-auto w-full">
            <div className="text-[10px] font-bold tracking-wider uppercase text-neutral-400 dark:text-neutral-500 mb-4 text-center">
              Active Render Preview
            </div>

            <div className="relative rounded-lg p-4 bg-white shadow-md border border-neutral-200 overflow-hidden h-[240px] w-[240px] flex items-center justify-center">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-emerald-500 animate-spin" />
                  <span className="text-[11px] text-neutral-400">Redrawing QR...</span>
                </div>
              ) : qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="QR Code"
                  className="h-full w-full object-contain select-none"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex flex-col items-center text-center px-4">
                  <QrCode className="h-8 w-8 text-neutral-300 mb-2" />
                  <span className="text-xs text-neutral-400 leading-normal">
                    Enter valid message parameters to load QR preview.
                  </span>
                </div>
              )}
            </div>

            {qrCodeDataUrl && !isGenerating && (
              <div className="mt-6 flex flex-col gap-2 w-full">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 text-sm font-medium transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Save PNG Barcode
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-850 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900 py-2 text-xs font-semibold transition-colors"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        Copied Grid!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy Image
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setText('');
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-850 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900 py-2 text-xs font-semibold transition-colors"
                  >
                    Clear Input
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
