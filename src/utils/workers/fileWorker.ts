/**
 * File processing Web Worker
 * Offloads heavy image pixel calculations, base64 operations, and document analysis from the main thread.
 * Ensures consistent 60fps UX during large-file computations.
 */

// Custom types for worker messaging
export type WorkerAction = 'brightness_contrast' | 'chroma_key_mask' | 'heavy_text_analytics' | 'base64_encode_chunk';

export interface WorkerMessagePayload {
  action: WorkerAction;
  id: string; // Message callback tracking ID
  imageBuffer?: Uint8ClampedArray;
  width?: number;
  height?: number;
  options?: any;
  textContent?: string;
  binaryChunk?: ArrayBuffer;
}

self.addEventListener('message', async (event: MessageEvent<WorkerMessagePayload>) => {
  const { action, id, imageBuffer, width, height, options, textContent, binaryChunk } = event.data;

  try {
    switch (action) {
      case 'brightness_contrast': {
        if (!imageBuffer || !width || !height) {
          throw new Error('Image data is required for brightness_contrast adjustments');
        }
        
        // Heavy pixel matrix processing
        const brightness = options?.brightness ?? 0; // -100 to 100
        const contrast = options?.contrast ?? 0; // -100 to 100
        
        // Pre-calculate contrast factor
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        const pixels = new Uint8ClampedArray(imageBuffer);

        for (let i = 0; i < pixels.length; i += 4) {
          // Skip transparency / alpha modifications
          for (let c = 0; c < 3; c++) {
            let val = pixels[i + c];
            // Apply brightness
            val += brightness;
            // Apply contrast
            val = factor * (val - 128) + 128;
            pixels[i + c] = Math.min(255, Math.max(0, val));
          }
        }

        // Return processed Uint8ClampedArray as a transferable object back to parent thread
        self.postMessage({ id, success: true, imageBuffer: pixels }, [pixels.buffer] as any);
        break;
      }

      case 'chroma_key_mask': {
        if (!imageBuffer || !width || !height) {
          throw new Error('Chroma-key background removal expects valid pixel matrix data');
        }

        const targetColor = options?.color ?? [255, 255, 255]; // [R, G, B] - Default to white background removal
        const tolerance = options?.tolerance ?? 35; // Sensitivity parameter
        const maskScale = options?.maskScale ?? 10; // Smoothing factor
        
        const pixels = new Uint8ClampedArray(imageBuffer);

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];

          // Calculate euclidean distance to color key in 3D RGB space
          const rDiff = r - targetColor[0];
          const gDiff = g - targetColor[1];
          const bDiff = b - targetColor[2];
          const score = Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);

          if (score < tolerance) {
            // Smooth transparency drop-off
            const alphaFactor = Math.max(0, Math.min(1, (score - (tolerance - maskScale)) / maskScale));
            pixels[i + 3] = Math.round(pixels[i + 3] * alphaFactor);
          }
        }

        self.postMessage({ id, success: true, imageBuffer: pixels }, [pixels.buffer] as any);
        break;
      }

      case 'heavy_text_analytics': {
        if (textContent === undefined) {
          throw new Error('Valid text content is required for deep analysis');
        }

        const text = textContent;
        const words = text.match(/\b\w+\b/g) || [];
        const totalWords = words.length;
        const totalChars = text.length;
        const charsNoSpaces = text.replace(/\s+/g, '').length;
        
        // Heavy: Word frequency mapping & sorting
        const wordFrequency: Record<string, number> = {};
        for (const w of words) {
          const wordLower = w.toLowerCase();
          wordFrequency[wordLower] = (wordFrequency[wordLower] || 0) + 1;
        }

        const topWords = Object.entries(wordFrequency)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 50)
          .map(([word, count]) => ({ word, count }));

        // Readability formulas (e.g. Flesch-Kincaid estimations, syllable counts)
        let syllables = 0;
        let sentences = text.split(/[.!?]+/).filter(Boolean).length || 1;
        
        for (const word of words) {
          const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
          let syllableCount = 0;
          if (cleanWord.length > 0) {
            if (cleanWord.length <= 3) syllableCount = 1;
            else {
              const matches = cleanWord.match(/[aeiouy]{1,2}/g);
              syllableCount = matches ? matches.length : 1;
              if (cleanWord.endsWith('e')) syllableCount--;
            }
          }
          syllables += Math.max(1, syllableCount);
        }

        // Flesch Reading Ease Formula: 206.835 - 1.015 * (totalWords / sentences) - 84.6 * (syllables / totalWords)
        const fleschEase = totalWords > 0 
          ? Math.round((206.835 - 1.015 * (totalWords / sentences) - 84.6 * (syllables / totalWords)) * 10) / 10
          : 100;

        self.postMessage({
          id,
          success: true,
          analytics: {
            totalWords,
            totalChars,
            charsNoSpaces,
            sentences,
            fleschEase,
            topWords,
          }
        });
        break;
      }

      case 'base64_encode_chunk': {
        if (!binaryChunk) {
          throw new Error('Valid ArrayBuffer chunk is required for encoding');
        }

        const bytes = new Uint8Array(binaryChunk);
        let binaryStr = '';
        const len = bytes.byteLength;
        
        // Loop index splitting to avoid Call Stack Range error on massive arrays
        const step = 8192;
        for (let i = 0; i < len; i += step) {
          const chunk = bytes.subarray(i, i + step);
          binaryStr += String.fromCharCode.apply(null, chunk as any);
        }

        const base64 = btoa(binaryStr);
        self.postMessage({ id, success: true, base64 });
        break;
      }

      default:
        throw new Error(`Unhandled worker action requested: ${action}`);
    }
  } catch (err: any) {
    self.postMessage({ id, success: false, error: err?.message || String(err) });
  }
});
