import { WorkerAction, WorkerMessagePayload } from '../workers/fileWorker';

interface PendingCallback {
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

export class HeavyTaskWorkerManager {
  private static workerInstance: Worker | null = null;
  private static pendingCallbacks = new Map<string, PendingCallback>();

  /**
   * Lazy initialization helper that safely instantiates the File Processing Web Worker client-side.
   */
  private static getWorker(): Worker {
    if (typeof window === 'undefined') {
      throw new Error('Web Workers are only operational in a browser environment');
    }

    if (!this.workerInstance) {
      // Native Vite module worker syntax
      this.workerInstance = new Worker(
        new URL('../workers/fileWorker.ts', import.meta.url),
        { type: 'module' }
      );

      this.workerInstance.addEventListener('message', (event: MessageEvent<any>) => {
        const { id, success, imageBuffer, analytics, base64, error } = event.data;
        const callbackEntry = this.pendingCallbacks.get(id);

        if (!callbackEntry) return;

        this.pendingCallbacks.delete(id);

        if (success) {
          if (imageBuffer !== undefined) callbackEntry.resolve(imageBuffer);
          else if (analytics !== undefined) callbackEntry.resolve(analytics);
          else if (base64 !== undefined) callbackEntry.resolve(base64);
          else callbackEntry.resolve(true);
        } else {
          callbackEntry.reject(new Error(error || 'An error transpired inside the Web Worker'));
        }
      });
    }

    return this.workerInstance;
  }

  /**
   * Run a brightness or contrast adjustment task in the Web Worker.
   */
  public static runBrightnessContrast(
    imageBuffer: Uint8ClampedArray,
    width: number,
    height: number,
    options: { brightness: number; contrast: number }
  ): Promise<Uint8ClampedArray> {
    return new Promise((resolve, reject) => {
      const id = `bc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const worker = this.getWorker();

      this.pendingCallbacks.set(id, { resolve, reject });

      const payload: WorkerMessagePayload = {
        action: 'brightness_contrast',
        id,
        imageBuffer,
        width,
        height,
        options,
      };

      // Transfer the buffer array to avoid memory clone performance penalties
      worker.postMessage(payload, [imageBuffer.buffer]);
    });
  }

  /**
   * Run a chroma-key background mask extraction on a remote background thread.
   */
  public static runChromaKeyMask(
    imageBuffer: Uint8ClampedArray,
    width: number,
    height: number,
    options: { color: [number, number, number]; tolerance: number; maskScale: number }
  ): Promise<Uint8ClampedArray> {
    return new Promise((resolve, reject) => {
      const id = `ck_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const worker = this.getWorker();

      this.pendingCallbacks.set(id, { resolve, reject });

      const payload: WorkerMessagePayload = {
        action: 'chroma_key_mask',
        id,
        imageBuffer,
        width,
        height,
        options,
      };

      // Transfer the buffer array to bypass replication delays in serialization
      worker.postMessage(payload, [imageBuffer.buffer]);
    });
  }

  /**
   * Execute comprehensive text readability and distribution profiling off-thread.
   */
  public static runTextAnalytics(textContent: string): Promise<{
    totalWords: number;
    totalChars: number;
    charsNoSpaces: number;
    sentences: number;
    fleschEase: number;
    topWords: Array<{ word: string; count: number }>;
  }> {
    return new Promise((resolve, reject) => {
      const id = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const worker = this.getWorker();

      this.pendingCallbacks.set(id, { resolve, reject });

      const payload: WorkerMessagePayload = {
        action: 'heavy_text_analytics',
        id,
        textContent,
      };

      worker.postMessage(payload);
    });
  }

  /**
   * Encode binary stream chunks into highly optimized Base64 representation.
   */
  public static runBase64Encode(binaryChunk: ArrayBuffer): Promise<string> {
    return new Promise((resolve, reject) => {
      const id = `b64_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const worker = this.getWorker();

      this.pendingCallbacks.set(id, { resolve, reject });

      const payload: WorkerMessagePayload = {
        action: 'base64_encode_chunk',
        id,
        binaryChunk,
      };

      worker.postMessage(payload, [binaryChunk]);
    });
  }

  /**
   * Terminate active worker pools and unload memories cleanly if needed.
   */
  public static terminate() {
    if (this.workerInstance) {
      this.workerInstance.terminate();
      this.workerInstance = null;
      this.pendingCallbacks.clear();
    }
  }
}
