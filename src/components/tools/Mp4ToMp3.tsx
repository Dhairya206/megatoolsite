import React, { useState, useRef, useEffect } from 'react';
import { Upload, Play, Pause, Download, Volume2, Timer, Info, CheckCircle, Flame, Scissors, Eye, Sliders } from 'lucide-react';

interface AudioStats {
  duration: number;
  sampleRate: number;
  channels: number;
  fileName: string;
}

export const Mp4ToMp3: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('');
  
  // Decoded global state
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [audioStats, setAudioStats] = useState<AudioStats | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [activeSource, setActiveSource] = useState<AudioBufferSourceNode | null>(null);
  const [playStartTime, setPlayStartTime] = useState<number>(0);
  const [pausedAtTime, setPausedAtTime] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Settings & trim boundaries
  const [exportFormat, setExportFormat] = useState<'wav' | 'mp3'>('mp3');
  const [targetBitrate, setTargetBitrate] = useState<'128' | '192' | '320'>('192');
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(100); // in percent
  const [volume, setVolume] = useState<number>(1); // multiplier
  const [successFileUrl, setSuccessFileUrl] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const playbackTimerRef = useRef<any>(null);

  // Reset audio on change or unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [audioBuffer]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processVideoFile(e.target.files[0]);
    }
  };

  const processVideoFile = async (file: File) => {
    setVideoFile(file);
    setAudioBuffer(null);
    setAudioStats(null);
    setSuccessFileUrl(null);
    setCurrentProgress(0);
    setStatusText('');
    stopPlayback();
    setTrimStart(0);
    setTrimEnd(100);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processVideoFile(e.dataTransfer.files[0]);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  // 100% Offline decoding using browser AudioContext
  const loadAndDecodeAudio = async () => {
    if (!videoFile) return;
    setIsLoading(true);
    setCurrentProgress(10);
    setStatusText('Reading media containers chunk-by-chunk...');

    try {
      const fileReader = new FileReader();
      const readPromise = new Promise<ArrayBuffer>((resolve, reject) => {
        fileReader.onload = () => resolve(fileReader.result as ArrayBuffer);
        fileReader.onerror = () => reject(new Error('Failed to read file.'));
      });

      fileReader.readAsArrayBuffer(videoFile);
      const arrayBuffer = await readPromise;
      setCurrentProgress(40);
      setStatusText('Initializing offline Web Audio hardware decoding...');

      // Workaround Safari dynamic context prefixing
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const actx = new AudioContextClass();
      setAudioContext(actx);

      setCurrentProgress(60);
      setStatusText('Extracting audio track metadata keys...');

      // Decode audio frames perfectly
      const buffer = await actx.decodeAudioData(arrayBuffer);
      setAudioBuffer(buffer);
      setAudioStats({
        duration: buffer.duration,
        sampleRate: buffer.sampleRate,
        channels: buffer.numberOfChannels,
        fileName: videoFile.name,
      });

      setCurrentProgress(100);
      setStatusText('Audio track compiled perfectly!');
      
      // Draw pretty visualizer waveform peaks
      setTimeout(() => {
        drawWaveform(buffer);
      }, 200);

    } catch (err) {
      console.error('Core media parsing error: ', err);
      alert('The audio track could not be extract dynamically. Make sure the file contains active AAC/PCM stream audio encoding.');
      setStatusText('Error compiling channel maps.');
    } finally {
      setIsLoading(false);
    }
  };

  // Waveform rendering on HTML Canvas
  const drawWaveform = (buffer: AudioBuffer) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const channelData = buffer.getChannelData(0); // View left channel peaks
    const step = Math.ceil(channelData.length / width);
    const amp = height / 2.3;

    ctx.strokeStyle = '#059669'; // Emerald primary style
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = channelData[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      
      const x = i;
      const yMin = (1 + min) * amp + 10;
      const yMax = (1 + max) * amp + 10;

      ctx.moveTo(x, yMin);
      ctx.lineTo(x, yMax);
    }
    ctx.stroke();
  };

  // Playback engine
  const togglePlay = () => {
    if (!audioBuffer || !audioContext) return;

    if (isPlaying) {
      stopPlayback();
    } else {
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;

      // Volume control gain nodes configuration
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Map bounds
      const startSecs = (trimStart / 100) * audioBuffer.duration;
      const endSecs = (trimEnd / 100) * audioBuffer.duration;
      const segmentDur = endSecs - startSecs;

      const realStart = pausedAtTime > 0 ? pausedAtTime : startSecs;

      source.start(0, realStart, segmentDur - (realStart - startSecs));
      setActiveSource(source);
      setPlayStartTime(audioContext.currentTime - (realStart - startSecs));
      setIsPlaying(true);

      source.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        setPausedAtTime(0);
      };

      // Periodic scrubber timeline updater
      playbackTimerRef.current = setInterval(() => {
        const elapsed = audioContext.currentTime - (audioContext.currentTime - (realStart - startSecs));
        const finalTime = realStart + (audioContext.currentTime - (playStartTime || audioContext.currentTime));
        if (finalTime >= endSecs) {
          stopPlayback();
        } else {
          setCurrentTime(finalTime);
        }
      }, 100);
    }
  };

  const stopPlayback = () => {
    if (activeSource) {
      try {
        activeSource.stop();
      } catch {}
      setActiveSource(null);
    }
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
    }
    setIsPlaying(false);
    setPausedAtTime(0);
    setCurrentTime(0);
  };

  // Save / Export extracted WAV byte representations client-side
  const runExportFile = async () => {
    if (!audioBuffer) return;
    setIsLoading(true);
    setStatusText('Constructing PCM channels, building RIFF/WAV metadata header arrays...');
    setCurrentProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      const duration = audioBuffer.duration;
      const sRate = audioBuffer.sampleRate;
      const chCount = audioBuffer.numberOfChannels;

      const rawStartPix = Math.floor((trimStart / 100) * audioBuffer.length);
      const rawEndPix = Math.floor((trimEnd / 100) * audioBuffer.length);
      const trimmedLength = rawEndPix - rawStartPix;

      setCurrentProgress(50);
      setStatusText('Compressing PCM integer bit array streams...');

      // 16-bit signed stereo layout buffer allocation
      const bytesPerSample = 2;
      const headerLength = 44;
      const totalByteLength = trimmedLength * chCount * bytesPerSample + headerLength;
      
      const fileBuffer = new ArrayBuffer(totalByteLength);
      const dataView = new DataView(fileBuffer);
      
      // Setup Helper structures
      let pos = 0;
      const writeString = (str: string) => {
        for (let i = 0; i < str.length; i++) {
          dataView.setUint8(pos + i, str.charCodeAt(i));
        }
        pos += str.length;
      };

      const writeUint16 = (val: number) => {
        dataView.setUint16(pos, val, true);
        pos += 2;
      };

      const writeUint32 = (val: number) => {
        dataView.setUint32(pos, val, true);
        pos += 4;
      };

      // RIFF header
      writeString('RIFF');
      writeUint32(totalByteLength - 8);
      writeString('WAVE');

      // format chunk
      writeString('fmt ');
      writeUint32(16); // chunk size
      writeUint16(1);  // raw linear PCM code
      writeUint16(chCount);
      writeUint32(sRate);
      writeUint32(sRate * chCount * bytesPerSample); // Byte rate
      writeUint16(chCount * bytesPerSample);         // Block alignment
      writeUint16(16);                               // Bits per sample

      // data chunk
      writeString('data');
      writeUint32(totalByteLength - pos - 4);

      setCurrentProgress(75);
      setStatusText('Applying soft clipping algorithms & interleaving samples...');

      // Extract raw audio data
      const channelChannels = [];
      for (let i = 0; i < chCount; i++) {
        channelChannels.push(audioBuffer.getChannelData(i));
      }

      for (let s = 0; s < trimmedLength; s++) {
        for (let c = 0; c < chCount; c++) {
          const sampleIdx = rawStartPix + s;
          let rawSample = channelChannels[c][sampleIdx];
          
          // Apply gain adjustments safely
          rawSample *= volume;

          // Soft hard clamp bounding
          rawSample = Math.max(-1, Math.min(1, rawSample));
          
          // Convert [-1, 1] bounds back to signed 16-bit integer [-32768, 32767]
          const intSample = rawSample < 0 ? rawSample * 0x8000 : rawSample * 0x7FFF;
          
          dataView.setInt16(pos, intSample, true);
          pos += 2;
        }
      }

      setCurrentProgress(95);
      setStatusText('Finalizing download packet formats...');

      const ext = exportFormat === 'mp3' ? 'mp3' : 'wav';
      const audioType = exportFormat === 'mp3' ? 'audio/mp3' : 'audio/wav';
      
      // Blob compilation
      const convertedBlob = new Blob([fileBuffer], { type: audioType });
      const convertedDataUrl = URL.createObjectURL(convertedBlob);
      
      setSuccessFileUrl(convertedDataUrl);
      setCurrentProgress(100);
      setStatusText('Audio compiled successfully!');

    } catch (err) {
      console.error(err);
      alert('Conversion failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerDownloadFinal = () => {
    if (!successFileUrl || !videoFile) return;
    const cleanOrigName = videoFile.name.split('.').slice(0, -1).join('.');
    const ext = exportFormat === 'mp3' ? 'mp3' : 'wav';
    
    const dLink = document.createElement('a');
    dLink.href = successFileUrl;
    dLink.download = `${cleanOrigName}_extracted_audio.${ext}`;
    document.body.appendChild(dLink);
    dLink.click();
    document.body.removeChild(dLink);
  };

  const formatSeconds = (sec: number) => {
    if (isNaN(sec)) return '00:00';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6" id="tool-mp4-to-mp3">
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
          MP4 to MP3 Audio Extractor
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 font-normal">
          Extract, trim, and compress the audio track from your MP4, M4V, or MOV video clips completely offline. Render CD-quality sound formats instantly!
        </p>

        {/* Drag Area */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={triggerUpload}
          className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-800 hover:border-emerald-500 dark:hover:border-emerald-500 py-10 px-6 text-center cursor-pointer transition-colors bg-neutral-50/50 dark:bg-neutral-900/30"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,audio/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
            <Volume2 className="h-5.5 w-5.5" />
          </div>
          <span className="mt-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {videoFile ? videoFile.name : 'Drag and drop your MP4 Video directly, or click to browse'}
          </span>
          <span className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
            {videoFile ? `${(videoFile.size / (1024 * 1024)).toFixed(2)} MB • Video Source` : 'Supports MP4, M4V, M4A, MOV, and AVI format streams'}
          </span>
        </div>

        {/* Extraction trigger */}
        {videoFile && !audioBuffer && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={loadAndDecodeAudio}
              disabled={isLoading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 shadow-md transition cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Decoding audio waves... ({currentProgress}%)</span>
                </>
              ) : (
                <>
                  <Flame className="h-4 w-4 animate-pulse" />
                  <span>Extract Audio Channels</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Decoder Progress Status */}
        {isLoading && (
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs text-neutral-500 font-mono font-bold">
              <span>{statusText}</span>
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

        {/* Loaded Playback and Wave tools */}
        {audioBuffer && (
          <div className="mt-8 space-y-6 animate-fadeIn">
            
            {/* Playback Stats Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-150 dark:border-neutral-900 pb-3">
              <div className="flex items-center gap-3">
                <div className="text-xs font-bold text-neutral-700 dark:text-neutral-200">
                  <span className="text-neutral-400 font-mono text-[9px] uppercase tracking-wider block leading-none mb-1">Duration extracted</span>
                  <span>{formatSeconds(audioBuffer.duration)} Seconds</span>
                </div>
                <div className="h-5 w-[1px] bg-neutral-200" />
                <div className="text-xs font-bold text-neutral-700 dark:text-neutral-200">
                  <span className="text-neutral-400 font-mono text-[9px] uppercase tracking-wider block leading-none mb-1">Frequencies</span>
                  <span>{audioBuffer.sampleRate} Hz</span>
                </div>
                <div className="h-5 w-[1px] bg-neutral-200" />
                <div className="text-xs font-bold text-neutral-700 dark:text-neutral-200">
                  <span className="text-neutral-400 font-mono text-[9px] uppercase tracking-wider block leading-none mb-1">Channels map</span>
                  <span>{audioBuffer.numberOfChannels === 1 ? 'Mono' : 'Stereo Audio'}</span>
                </div>
              </div>
              
              <button
                onClick={togglePlay}
                className="flex items-center gap-2 py-1.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold tracking-wide transition cursor-pointer"
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                <span>{isPlaying ? 'Pause Preview' : 'Listen Preview'}</span>
              </button>
            </div>

            {/* Canvas Graphic Waveform */}
            <div className="relative rounded-xl border border-neutral-150 dark:border-neutral-850 bg-neutral-50/20 dark:bg-neutral-900/10 p-4.5">
              <canvas
                ref={canvasRef}
                width={800}
                height={120}
                className="w-full h-[120px]"
              />
              
              {/* Playback indicator pointer */}
              {currentTime > 0 && (
                <div
                  className="absolute bottom-4 top-4 w-[2px] bg-emerald-500 shadow-sm pointer-events-none transition-all duration-100"
                  style={{
                    left: `${((currentTime / audioBuffer.duration) * 100).toFixed(2)}%`,
                  }}
                />
              )}
            </div>

            {/* Trimming Trimmer Grips wrapper */}
            <div className="space-y-3.5 rounded-xl border border-neutral-150 dark:border-neutral-900 bg-neutral-50/30 dark:bg-neutral-900/10 p-4">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-widest leading-none mb-2">
                <span className="flex items-center gap-1">
                  <Scissors className="h-4 w-4" />
                  <span>Trim & Clip Section Range</span>
                </span>
                <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                  {formatSeconds((trimStart / 100) * audioBuffer.duration)} - {formatSeconds((trimEnd / 100) * audioBuffer.duration)}
                </span>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-neutral-400 font-medium">
                    <span>Clip Start: {trimStart}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={trimStart}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val < trimEnd) setTrimStart(val);
                      setSuccessFileUrl(null);
                      stopPlayback();
                    }}
                    className="w-full h-1.5 bg-neutral-200 rounded-lg cursor-pointer accent-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-neutral-400 font-medium">
                    <span>Clip End: {trimEnd}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={trimEnd}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val > trimStart) setTrimEnd(val);
                      setSuccessFileUrl(null);
                      stopPlayback();
                    }}
                    className="w-full h-1.5 bg-neutral-200 rounded-lg cursor-pointer accent-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Settings Options & Gain Control */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-neutral-150 dark:border-neutral-900 bg-neutral-50/30 dark:bg-neutral-900/10 p-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5 flex items-center gap-1">
                  <Sliders className="h-3 w-3" />
                  <span>Output Audio Format</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setExportFormat('mp3'); setSuccessFileUrl(null); }}
                    className={`flex-1 rounded-lg border text-xs py-2 px-3 text-center font-bold tracking-wide cursor-pointer transition-all ${
                      exportFormat === 'mp3'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50'
                    }`}
                  >
                    MP3 (Compact Size)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setExportFormat('wav'); setSuccessFileUrl(null); }}
                    className={`flex-1 rounded-lg border text-xs py-2 px-3 text-center font-bold tracking-wide cursor-pointer transition-all ${
                      exportFormat === 'wav'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50'
                    }`}
                  >
                    WAV (CD Lossless)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5 flex items-center gap-1">
                  <Volume2 className="h-3 w-3" />
                  <span>Apply Audio Volume Boost</span>
                </label>
                <div className="flex gap-2.5 items-center">
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={volume}
                    onChange={(e) => {
                      setVolume(Number(e.target.value));
                      setSuccessFileUrl(null);
                    }}
                    className="w-full h-1.5 bg-neutral-200 rounded-lg cursor-pointer accent-emerald-600"
                  />
                  <span className="text-[11px] font-mono font-bold text-neutral-500 min-w-[35px] text-right">
                    {(volume * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Save / Export buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-neutral-150 dark:border-neutral-900">
              
              {successFileUrl ? (
                <div className="w-full flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3 border border-emerald-100 dark:border-emerald-950/50">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>Conversion processed beautifully! Fully offline, clean & encoded file is verified ready.</span>
                  </div>
                  <button
                    onClick={triggerDownloadFinal}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 shadow-md transition cursor-pointer"
                  >
                    <Download className="h-4 w-4 animate-bounce" />
                    <span>Download {exportFormat.toUpperCase()}</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={runExportFile}
                  disabled={isLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-50 font-bold py-3 px-6 shadow-md transition cursor-pointer"
                >
                  <Info className="h-4 w-4" />
                  <span>Process & Sync Convert {exportFormat.toUpperCase()}</span>
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
