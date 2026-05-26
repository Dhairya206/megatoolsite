import React, { useState, useEffect } from 'react';
import { AlignLeft, Copy, Check, Trash2, LayoutGrid, FileText, ChevronRight, HelpCircle } from 'lucide-react';

export const WordCounter: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  
  // Statistical States
  const [stats, setStats] = useState({
    characters: 0,
    charactersNoSpaces: 0,
    words: 0,
    sentences: 0,
    paragraphs: 0,
    readTime: 0, // seconds
    speakTime: 0, // seconds
  });

  const [keywordDensity, setKeywordDensity] = useState<Array<{ word: string; count: number; percentage: number }>>([]);

  const compileStats = (inputText: string) => {
    const chars = inputText.length;
    const charsNoSpaces = inputText.replace(/\s/g, '').length;
    
    const wordsArr = inputText.toLowerCase().match(/\b[a-z0-9'-]+\b/g) || [];
    const words = wordsArr.length;

    // Sentences boundary triggers
    const sentences = inputText.split(/[.!?]+/).filter(x => x.trim().length > 0).length;

    // Paragraphs trigger on Double Carriage Return
    const paragraphs = inputText.split(/\n\s*\n/).filter(x => x.trim().length > 0).length;

    // Speeds definitions
    // Read: 200 Words / min = 3.3 Words / sec
    // Speak: 130 Words / min = 2.1 Words / sec
    const readTime = Math.round((words / 200) * 60);
    const speakTime = Math.round((words / 130) * 60);

    setStats({
      characters: chars,
      charactersNoSpaces: charsNoSpaces,
      words,
      sentences,
      paragraphs,
      readTime,
      speakTime,
    });

    // Keyword percentages density compile
    if (wordsArr.length > 0) {
      const stopWords = new Set([
        'the', 'a', 'to', 'and', 'of', 'in', 'is', 'it', 'you', 'that', 'he', 'was', 'for', 'on', 'are', 'with', 'as', 'i', 'his', 'they', 'be', 'at', 'one', 'have', 'this', 'from', 'or', 'had', 'by', 'but', 'not', 'some', 'what', 'there', 'we', 'can', 'out', 'other', 'were', 'all', 'your', 'when', 'an'
      ]);

      const counts: Record<string, number> = {};
      wordsArr.forEach((w) => {
        if (w.length > 2 && !stopWords.has(w)) {
          counts[w] = (counts[w] || 0) + 1;
        }
      });

      const sorted = Object.entries(counts)
        .map(([word, count]) => ({
          word,
          count,
          percentage: Math.round((count / words) * 100),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setKeywordDensity(sorted);
    } else {
      setKeywordDensity([]);
    }
  };

  useEffect(() => {
    compileStats(text);
  }, [text]);

  const loadDemoText = () => {
    setText(
      'Google AI Studio is built to leverage advanced API capabilities server-side while maintaining high aesthetic rendering client-side. This layout combines powerful analytical tools and rich visual frameworks running 100% locally block inside your browser.\n\nCrafting an interface requires elegant typography, responsive spatial grids, and robust type structures. Clean code balances performance and accessibility parameters. By maintaining strict design tokens and clear negative boundaries, developers avoid visual clutter and deliver delightful digital solutions.'
    );
  };

  const handleCopy = async () => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const transformCase = (type: 'upper' | 'lower' | 'trim') => {
    if (!text) return;
    if (type === 'upper') {
      setText(text.toUpperCase());
    } else if (type === 'lower') {
      setText(text.toLowerCase());
    } else if (type === 'trim') {
      // Clean duplicate whitespace & line breaks
      const trimmed = text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n\s*\n/g, '\n\n').trim();
      setText(trimmed);
    }
  };

  const formatTime = (secs: number): string => {
    if (secs < 60) {
      return `${secs}s`;
    }
    const mins = Math.floor(secs / 60);
    const remainSecs = secs % 60;
    return remainSecs > 0 ? `${mins}m ${remainSecs}s` : `${mins}m`;
  };

  return (
    <div className="space-y-6" id="tool-word-counter">
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
          Word & Text Metrics Counter
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 font-normal">
          Inspect textual copy details off-network. Count sentences, density thresholds, and analyze estimated reading parameters in real-time.
        </p>

        {/* Real-time counters row widgets */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
          <div className="rounded-xl border border-neutral-100 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-900/15 p-3 text-center">
            <span className="block text-2xl font-bold font-mono text-neutral-800 dark:text-neutral-200">
              {stats.words}
            </span>
            <span className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 tracking-wider">
              Words
            </span>
          </div>

          <div className="rounded-xl border border-neutral-100 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-900/15 p-3 text-center">
            <span className="block text-2xl font-bold font-mono text-neutral-800 dark:text-neutral-200">
              {stats.characters}
            </span>
            <span className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 tracking-wider">
              Characters
            </span>
          </div>

          <div className="rounded-xl border border-neutral-100 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-900/15 p-3 text-center">
            <span className="block text-2xl font-bold font-mono text-neutral-800 dark:text-neutral-200">
              {stats.charactersNoSpaces}
            </span>
            <span className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 tracking-wider" title="Exclude spaces">
              No Spaces
            </span>
          </div>

          <div className="rounded-xl border border-neutral-100 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-900/15 p-3 text-center">
            <span className="block text-2xl font-bold font-mono text-neutral-800 dark:text-neutral-200">
              {stats.sentences}
            </span>
            <span className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 tracking-wider">
              Sentences
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 rounded-xl border border-neutral-100 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-900/15 p-3 text-center">
            <span className="block text-2xl font-bold font-mono text-neutral-800 dark:text-neutral-200">
              {stats.paragraphs}
            </span>
            <span className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 tracking-wider">
              Paragraphs
            </span>
          </div>
        </div>

        {/* Input Text Area panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              Type or Paste Content
            </span>
            <button
              onClick={loadDemoText}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Insert Demo Copypasta
            </button>
          </div>

          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste files, logs, paragraphs, and markdown documents here to count instantly..."
              rows={8}
              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 text-sm text-neutral-800 dark:text-neutral-200 focus:outline-emerald-500 focus:border-emerald-500 focus:outline focus:outline-1 leading-relaxed leading-normal"
            />

            {/* Float quick actions on bottom of text zone */}
            {text && (
              <div className="absolute right-3.5 bottom-3.5 flex gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setText('')}
                  className="rounded-lg p-2 bg-neutral-100/90 dark:bg-neutral-800/90 text-neutral-500 hover:text-red-500 hover:bg-neutral-200/90 transition-colors shadow-sm"
                  title="Clear all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-lg p-2 bg-neutral-100/90 dark:bg-emerald-600/15 text-neutral-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-neutral-200/90 transition-colors shadow-sm"
                  title="Copy text"
                >
                  {isCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Conversions Bars & Densities row */}
        {text.trim() && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5 pt-5 border-t border-neutral-100 dark:border-neutral-900">
            {/* Case conversion actions */}
            <div className="space-y-4">
              <span className="block text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Quick Text Case Formatters
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => transformCase('upper')}
                  className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  MAKE UPPERCASE
                </button>
                <button
                  onClick={() => transformCase('lower')}
                  className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  make lowercase
                </button>
                <button
                  onClick={() => transformCase('trim')}
                  className="rounded-lg border border-dashed border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/10 dark:bg-emerald-950/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                  title="Strip double breaks & inner spacing"
                >
                  Clean Extra Spacing
                </button>
              </div>

              {/* Read / Speak speed estimators */}
              <div className="rounded-xl border border-neutral-100 dark:border-neutral-950 p-4 bg-neutral-50/40 dark:bg-neutral-900/5 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500 dark:text-neutral-400">Silent Reading Pace (200wpm)</span>
                  <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">{formatTime(stats.readTime)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500 dark:text-neutral-400">Oral Speech Pace (130wpm)</span>
                  <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">{formatTime(stats.speakTime)}</span>
                </div>
              </div>
            </div>

            {/* Keyword Density List */}
            <div className="space-y-3">
              <span className="block text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Core Word Densities (Stripping Stops)
              </span>

              {keywordDensity.length > 0 ? (
                <div className="space-y-2">
                  {keywordDensity.map((item, idx) => (
                    <div key={item.word} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        <span className="flex items-center gap-1.5 font-mono truncate">
                          <ChevronRight className="h-3 w-3 text-emerald-500 shrink-0" />
                          {item.word}
                        </span>
                        <span className="text-[11px] text-neutral-400 pr-1">
                          {item.count} hits • {item.percentage}%
                        </span>
                      </div>
                      {/* Density Slider Line */}
                      <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(100, item.percentage * 5)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center p-6 border border-dashed border-neutral-150 dark:border-neutral-900 rounded-lg text-neutral-400 text-xs text-center leading-normal">
                  Write more multi-syllable terms to index key terms densities.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
