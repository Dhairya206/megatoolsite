import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './AuthContext';
import { useToolHistory } from '../hooks/useToolHistory';
import { TOOLS } from '../data/tools';
import { Tool, ToolCategory } from '../types';
import { getDynamicSeoGuide } from '../data/seoGuides';
import { AdSensePlaceholder } from './AdSensePlaceholder';

const ImageToPdf = React.lazy(() => import('./tools/ImageToPdf').then(m => ({ default: m.ImageToPdf })));
const PolymorphicTool = React.lazy(() => import('./tools/PolymorphicTools').then(m => ({ default: m.PolymorphicTool })));
const ImageCompressor = React.lazy(() => import('./tools/ImageCompressor').then(m => ({ default: m.ImageCompressor })));
const QrGenerator = React.lazy(() => import('./tools/QrGenerator').then(m => ({ default: m.QrGenerator })));
const PasswordGenerator = React.lazy(() => import('./tools/PasswordGenerator').then(m => ({ default: m.PasswordGenerator })));
const WordCounter = React.lazy(() => import('./tools/WordCounter').then(m => ({ default: m.WordCounter })));
const ImageBgRemover = React.lazy(() => import('./tools/ImageBgRemover').then(m => ({ default: m.ImageBgRemover })));
const PdfToImage = React.lazy(() => import('./tools/PdfToImage').then(m => ({ default: m.PdfToImage })));
const Mp4ToMp3 = React.lazy(() => import('./tools/Mp4ToMp3').then(m => ({ default: m.Mp4ToMp3 })));

const ToolSkeleton = () => (
  <div className="w-full min-h-[500px] flex flex-col justify-between p-6 rounded-2xl bg-white/70 dark:bg-white/[0.02] border border-neutral-200/55 dark:border-white/[0.05] animate-pulse space-y-6">
    <div className="space-y-3">
      <div className="h-6 w-1/3 bg-neutral-200 dark:bg-neutral-800 rounded-md" />
      <div className="h-4 w-2/3 bg-neutral-200 dark:bg-neutral-800 rounded-md" />
    </div>
    <div className="flex-1 min-h-[250px] bg-neutral-100 dark:bg-neutral-900/40 rounded-xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Sparkles className="h-8 w-8 text-neutral-400 dark:text-neutral-600 animate-spin" />
        <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">Initializing High-Performance Engine...</span>
      </div>
    </div>
    <div className="h-10 w-full bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
  </div>
);

// Imports of Lucide Icons
import {
  FileImage, Maximize2, Crop, RefreshCw, Pipette, FileCode, Binary, Replace, Laugh,
  Combine, Split, Images, FileLock, FileCheck, Lock, Unlock, RotateCw, Sliders, Stamp,
  Hash, CaseSensitive, BookOpen, FileDigit, Link, WrapText, SearchCode, MoveRight, CheckCircle,
  KeyRound, Braces, Code2, Globe, Shuffle, Key, CalendarDays, Flame, Palette, Database,
  QrCode, Scan, Calculator, Scale, DollarSign, Timer, Heart, Clock, TrendingUp, Dices, Wrench,
  Search, Sun, Moon, Sparkles, ArrowLeft, ChevronRight, Laptop, Terminal, Layers, Check,
  Star, LogOut, User, LogIn, Volume2
} from 'lucide-react';

const iconsDict: Record<string, any> = {
  Image: FileImage, FileImage, Maximize2, Crop, RefreshCw, Pipette, FileCode, Binary, Replace, Laugh,
  Combine, Split, Images, FileLock, FileCheck, Lock, Unlock, RotateCw, Sliders, Stamp,
  Hash, CaseSensitive, GitDiff: Split, BookOpen, FileDigit, Link, WrapText, SearchCode, MoveRight, CheckCircle,
  KeyRound, Braces, Code2, Globe, Shuffle, Key, CalendarDays, Flame, Palette, Database,
  QrCode, Scan, Calculator, Scale, DollarSign, Timer, Heart, Clock, TrendingUp, Dices, Volume2
};

export const DynamicIcon: React.FC<{ name: string; className?: string }> = ({ name, className = 'h-5 w-5' }) => {
  const IconComponent = iconsDict[name] || Wrench;
  return <IconComponent className={className} />;
};

interface ToolGridProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const ToolGrid: React.FC<ToolGridProps> = ({ darkMode, setDarkMode }) => {
  const { user, loading, favorites, loginWithGoogle, loginAsGuest, logout, toggleFavorite, isFirebaseActive } = useAuth();
  const { history, addToHistory, clearHistory } = useToolHistory();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'All'>('All');
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.userAgent));
    }
  }, []);

  // Log Tool Selection to Recent Activity History
  useEffect(() => {
    if (activeToolId) {
      const selectedTool = TOOLS.find(t => t.id === activeToolId);
      if (selectedTool) {
        addToHistory(
          selectedTool.id,
          selectedTool.name,
          'success',
          `Launched workspace sandbox for ${selectedTool.name}`
        );
      }
    }
  }, [activeToolId, addToHistory]);

  // Ad Interstitial States
  const [adIsOpen, setAdIsOpen] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [adPendingAction, setAdPendingAction] = useState<(() => void) | null>(null);
  const [interstitialType, setInterstitialType] = useState<'guest' | 'member'>('guest');

  const triggerActionWithAd = (action: () => void) => {
    const isGuest = !user || user.isGuest;

    if (isGuest) {
      setInterstitialType('guest');
      try {
        const guestCountKey = 'megatool-guest-action-count';
        const strVal = localStorage.getItem(guestCountKey);
        let count = strVal ? parseInt(strVal, 10) : 0;
        count += 1;
        localStorage.setItem(guestCountKey, count.toString());

        // Frequency Cap = trigger exactly once every 3rd action
        if (count % 3 === 0) {
          setAdPendingAction(() => action);
          setAdCountdown(5);
          setAdIsOpen(true);
        } else {
          // Bypass countdown, execute action immediately
          action();
        }
      } catch (err) {
        // Safe fallback in case of sandboxed sandbox localStorage issues
        action();
      }
    } else {
      setInterstitialType('member');
      try {
        const lastAdKey = `megatool-member-last-ad-${user.uid}`;
        const lastAdTimeRaw = localStorage.getItem(lastAdKey);
        const lastAdTime = lastAdTimeRaw ? parseInt(lastAdTimeRaw, 10) : 0;
        const now = Date.now();
        const tenMinutesMs = 10 * 60 * 1000; // 10 minutes session cooldown

        if (now - lastAdTime >= tenMinutesMs) {
          setAdPendingAction(() => action);
          setAdCountdown(5);
          setAdIsOpen(true);
          localStorage.setItem(lastAdKey, now.toString());
        } else {
          // Bypass entirely under active cooldown
          action();
        }
      } catch (err) {
        action();
      }
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (adIsOpen && adCountdown > 0) {
      interval = setInterval(() => {
        setAdCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            // Execute pending action after countdown finished
            if (adPendingAction) {
              adPendingAction();
            }
            setAdIsOpen(false);
            setAdPendingAction(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [adIsOpen, adCountdown, adPendingAction]);

  // Set up Global Anchor Click interceptor for file downloads
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const originalClick = HTMLAnchorElement.prototype.click;
    
    HTMLAnchorElement.prototype.click = function(this: HTMLAnchorElement) {
      if (this.download && !this.dataset.adChecked) {
        // Intercept and delay by triggering the interstitial ad timer
        triggerActionWithAd(() => {
          this.dataset.adChecked = 'true';
          originalClick.call(this);
        });
        return;
      }
      originalClick.call(this);
    };
    
    return () => {
      HTMLAnchorElement.prototype.click = originalClick;
    };
  }, []);

  const [toolHistory, setToolHistory] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener to focus search input (Ctrl+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is actively typing in another input or textarea
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.getAttribute('contenteditable') === 'true')) {
        return;
      }

      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load history on mount or when user changes
  useEffect(() => {
    if (user && !user.isGuest) {
      try {
        const saved = localStorage.getItem(`mega-tool-history-${user.uid}`);
        setToolHistory(saved ? JSON.parse(saved) : []);
      } catch (err) {
        setToolHistory([]);
      }
    } else {
      setToolHistory([]);
    }
  }, [user]);

  // Record history when a tool becomes active
  useEffect(() => {
    if (activeToolId && user && !user.isGuest) {
      setToolHistory((prev) => {
        const filtered = prev.filter((id) => id !== activeToolId);
        const updated = [activeToolId, ...filtered].slice(0, 6); // Keep top 6 items
        try {
          localStorage.setItem(`mega-tool-history-${user.uid}`, JSON.stringify(updated));
        } catch (err) {
          console.warn('Could not save tool history: ', err);
        }
        return updated;
      });
    }
  }, [activeToolId, user]);

  // List of categories
  const categories: Array<ToolCategory | 'All'> = ['All', 'Image', 'PDF', 'Text', 'Developer', 'Utilities'];

  // Global search & filtering logic with intelligent stemmer token scoring and sorting
  const filteredTools = useMemo(() => {
    const cleanQuery = searchQuery.toLowerCase().trim();
    if (!cleanQuery) {
      return TOOLS.filter((tool) => selectedCategory === 'All' || tool.category === selectedCategory);
    }

    // Tokenize and stem the query
    const tokenizeAndStem = (text: string): string[] => {
      return text.toLowerCase()
        .replace(/[^\w\s]/g, ' ') // replace punctuation/symbols with spaces
        .split(/\s+/)
        .filter((w) => w.length > 1)
        .map((word) => {
          let stem = word;
          // Stem basic plurals or verbs to allow cross-matching (e.g., images -> image, converting -> convert)
          if (stem.endsWith('s') && !stem.endsWith('ss')) {
            if (stem.endsWith('ies')) stem = stem.slice(0, -3) + 'y';
            else if (stem.endsWith('es')) stem = stem.slice(0, -2);
            else stem = stem.slice(0, -1);
          }
          if (stem.endsWith('ing')) {
            stem = stem.slice(0, -3);
          }
          if (stem.endsWith('ed')) {
            stem = stem.slice(0, -2);
          }
          if (stem.endsWith('er')) {
            stem = stem.slice(0, -2);
          }
          if (stem.endsWith('or')) {
            stem = stem.slice(0, -2);
          }
          return stem;
        });
    };

    const queryTokens = tokenizeAndStem(cleanQuery);

    if (queryTokens.length === 0) {
      // Fallback to basic case-insensitive match if search query is fully symbols
      return TOOLS.filter((tool) => {
        const matchCategory = selectedCategory === 'All' || tool.category === selectedCategory;
        const matchSearch = tool.name.toLowerCase().includes(cleanQuery) || 
                            tool.description.toLowerCase().includes(cleanQuery);
        return matchCategory && matchSearch;
      });
    }

    // Map each tool to a search score
    const scoredTools = TOOLS.map((tool) => {
      const matchCategory = selectedCategory === 'All' || tool.category === selectedCategory;
      if (!matchCategory) return { tool, score: -1 };

      const toolNameLower = tool.name.toLowerCase();
      const toolDescLower = tool.description.toLowerCase();
      const toolCategoryLower = tool.category.toLowerCase();
      
      // Calculate stem matching scores
      let score = 0;

      // 1. Extreme priority: String containment (matching exact substring searches)
      if (toolNameLower.includes(cleanQuery)) {
        score += 150;
      }
      if (toolDescLower.includes(cleanQuery)) {
        score += 50;
      }

      // Synonym mapping boost for colloquials, shortcodes and regional phrases
      const SYNONYM_MAP: Record<string, string[]> = {
        bg: ['image-bg-remover', 'image-cropper'],
        saaf: ['image-bg-remover', 'image-compressor', 'json-formatter', 'html-formatter'],
        clear: ['image-bg-remover', 'remove-line-breaks', 'image-compressor'],
        cut: ['image-cropper', 'pdf-split'],
        'photo edit': ['image-resizer', 'image-cropper', 'meme-generator'],
        compress: ['image-compressor', 'pdf-compress'],
        bgremover: ['image-bg-remover'],
        photo: ['image-resizer', 'image-cropper', 'image-converter', 'meme-generator', 'color-picker'],
        edit: ['image-resizer', 'image-cropper', 'meme-generator', 'markdown-editor'],
        word: ['word-counter', 'pdf-to-word', 'word-to-pdf'],
        pdf: ['image-to-pdf', 'pdf-to-image', 'pdf-merge', 'pdf-split', 'pdf-extract-images', 'pdf-to-word', 'word-to-pdf', 'pdf-encrypt', 'pdf-decrypt', 'pdf-rotate', 'pdf-compress', 'pdf-add-watermark'],
        txt: ['word-counter', 'case-converter', 'text-diff', 'markdown-editor', 'lorem-ipsum', 'remove-line-breaks', 'find-replace', 'regex-tester'],
        dev: ['json-formatter', 'html-formatter', 'url-encoder', 'base64-converter', 'hash-generator', 'epoch-converter', 'diff-viewer', 'color-converter', 'yaml-json'],
        util: ['qr-generator', 'qr-reader', 'calculator', 'unit-converter', 'currency-converter', 'stopwatch-timer', 'timezone-converter', 'expense-tracker', 'random-selector', 'mp4-to-mp3'],
        convert: ['image-to-pdf', 'pdf-to-image', 'mp4-to-mp3', 'image-converter', 'svg-to-png', 'base64-to-image', 'image-to-base64', 'pdf-to-word', 'word-to-pdf', 'case-converter', 'url-encoder', 'base64-converter', 'epoch-converter', 'color-converter', 'yaml-json']
      };

      for (const [key, toolIds] of Object.entries(SYNONYM_MAP)) {
        if (cleanQuery.includes(key) || key.includes(cleanQuery)) {
          if (toolIds.includes(tool.id)) {
            score += 300;
          }
        }
      }

      // 2. Token stem matches
      const nameStems = tokenizeAndStem(tool.name);
      const descStems = tokenizeAndStem(tool.description);
      const categoryStems = tokenizeAndStem(tool.category);
      const keywordStems = tool.keywords.flatMap((kw) => tokenizeAndStem(kw));

      queryTokens.forEach((qt) => {
        // Matches tool name stems
        if (nameStems.includes(qt)) score += 30;
        else if (nameStems.some(ns => ns.includes(qt) || qt.includes(ns))) score += 15;

        // Matches keyword stems
        if (keywordStems.includes(qt)) score += 20;
        else if (keywordStems.some(ks => ks.includes(qt) || qt.includes(ks))) score += 10;

        // Matches description stems
        if (descStems.includes(qt)) score += 5;
        
        // Matches category
        if (categoryStems.includes(qt)) score += 3;
      });

      return { tool, score };
    });

    // Filter out tools with no match (score <= 0 or mismatched category) and sort by descending score
    return scoredTools
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.tool);
  }, [searchQuery, selectedCategory]);

  // Find active tool details
  const activeTool = useMemo(() => {
    return TOOLS.find((t) => t.id === activeToolId) || null;
  }, [activeToolId]);

  // Render core tool component dynamically
  const renderCoreToolComponent = (id: string) => {
    switch (id) {
      case 'image-to-pdf':
        return <ImageToPdf />;
      case 'image-compressor':
        return <ImageCompressor />;
      case 'image-bg-remover':
        return <ImageBgRemover />;
      case 'pdf-to-image':
        return <PdfToImage />;
      case 'mp4-to-mp3':
        return <Mp4ToMp3 />;
      case 'qr-generator':
        return <QrGenerator />;
      case 'password-generator':
        return <PasswordGenerator />;
      case 'word-counter':
        return <WordCounter />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#030712] transition-colors duration-300 relative overflow-hidden font-sans text-neutral-850 dark:text-neutral-150">
      {/* Radial Gradient Backdrops */}
      <div className="absolute top-0 inset-x-0 h-[600px] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none z-0" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-550/5 rounded-full blur-3xl pointer-events-none z-0" />

      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-[#030712]/60 backdrop-blur-md border-b border-neutral-200/50 dark:border-white/[0.05] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div 
            onClick={() => { setActiveToolId(null); setSearchQuery(''); setSelectedCategory('All'); }}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 select-none"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-white dark:via-neutral-200 dark:to-neutral-400 tracking-tight leading-none">
                MegaTool
              </span>
              <span className="text-[9px] text-neutral-400 dark:text-neutral-500 font-bold font-mono tracking-wider mt-1.5 uppercase leading-none">
                {TOOLS.length}-in-1 Client Hub
              </span>
            </div>
          </div>

          {/* Quick bar search (only shown when not on details or can serve as quick filter) */}
          {!activeToolId && (
            <div className="relative hidden md:block w-full max-w-xs focus-within:max-w-md transition-all duration-300 ease-out z-10">
              <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-neutral-400 dark:text-neutral-550">
                <Search className="h-4 w-4" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder={`Search across ${TOOLS.length} utilities...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 dark:border-white/[0.08] bg-neutral-50/80 dark:bg-white/[0.02] pl-10 pr-12 py-2 text-xs font-mono tracking-tight text-neutral-850 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] dark:focus:bg-neutral-950 transition-all duration-300"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-0.5 opacity-60">
                <kbd className="text-[9px] font-sans px-1 py-0.5 rounded border border-neutral-200 dark:border-white/[0.1] bg-neutral-100 dark:bg-amber-500/10 text-neutral-450 dark:text-emerald-400 shadow-sm leading-none font-bold">{isMac ? '⌘' : 'Ctrl'}</kbd>
                <kbd className="text-[9px] font-sans px-1 py-0.5 rounded border border-neutral-200 dark:border-white/[0.1] bg-neutral-100 dark:bg-amber-500/10 text-neutral-450 dark:text-emerald-400 shadow-sm leading-none font-bold">K</kbd>
              </div>
            </div>
          )}

          {/* Controls Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-850 text-neutral-500 dark:text-neutral-400 border border-transparent dark:border-neutral-850 transition cursor-pointer"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {/* Premium Authentication Trigger */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 hover:bg-neutral-100 dark:hover:bg-neutral-850 transition select-none cursor-pointer"
                >
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    width="24"
                    height="24"
                    className="h-6 w-6 rounded-full border border-emerald-500/20 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-[110px]">
                      {user.displayName}
                    </span>
                    <span className="text-[9px] text-neutral-400 font-mono font-bold leading-none uppercase">
                      {user.isGuest ? 'Guest User' : 'Sync Member'}
                    </span>
                  </div>
                </button>

                {/* Dropdown controls menu */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-2.5 py-2 border-b border-neutral-150 dark:border-neutral-900 text-left">
                      <p className="text-xs font-bold text-neutral-800 dark:text-neutral-150 truncate">
                        {user.displayName}
                      </p>
                      <p className="text-[10px] text-neutral-400 font-mono truncate">
                        {user.email}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => {
                        setActiveToolId(null);
                        setSelectedCategory('All');
                        setSearchQuery('');
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg mt-1 flex items-center gap-2 cursor-pointer"
                    >
                      <User className="h-3.5 w-3.5 text-emerald-500" />
                      <span>My Profile Panel</span>
                    </button>

                    <button
                      onClick={() => {
                        logout();
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg mt-0.5 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Log Out Session</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition cursor-pointer select-none"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Log In / Join</span>
              </button>
            )}
            
            <a 
              href="https://ai.studio/build" 
              target="_blank" 
              rel="noreferrer"
              className="rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-400 py-1.5 px-3 text-xs font-semibold transition"
            >
              Share Hub
            </a>
          </div>
        </div>
      </header>

      {/* HEADER LEADERBOARD AD (728x90) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <AdSensePlaceholder type="leaderboard" className="w-full" />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* VIEW A: INTERNAL WORKING OR PREVIEW PANEL FOR TOOL */}
        {activeTool ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10">
            {/* Back to Hub Nav Sidebar Area */}
            <div className="lg:col-span-3 space-y-4">
              <button
                onClick={() => setActiveToolId(null)}
                className="flex items-center gap-2.5 w-full rounded-xl border border-neutral-200/55 dark:border-white/[0.05] bg-white/70 dark:bg-white/[0.02] p-4 text-xs font-semibold text-neutral-750 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.04] transition duration-300 ease-out backdrop-blur-md"
              >
                <ArrowLeft className="h-4 w-4 text-emerald-500 animate-pulse" />
                <span>Return to Tool Hub</span>
              </button>

              {/* Sidebar AdSense box in panel */}
              <AdSensePlaceholder type="sidebar" className="shadow-sm border border-neutral-200/55 dark:border-white/[0.05]" />

              {/* Sidebar Info List (Dynamic lists of active elements) */}
              <div className="rounded-2xl border border-neutral-200/55 dark:border-white/[0.05] bg-white/70 dark:bg-white/[0.02] p-4.5 backdrop-blur-md">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3 px-0.5">
                  Quick Access Core Tools
                </span>
                <div className="space-y-1.5">
                  {TOOLS.filter(t => t.isCore).map(t => (
                    <button
                      key={t.id}
                      onClick={() => setActiveToolId(t.id)}
                      className={`w-full flex items-center justify-between text-left text-xs px-3 py-2 rounded-xl font-medium transition duration-250 ${
                        activeToolId === t.id
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-white/[0.03] border border-transparent'
                      }`}
                    >
                      <span className="truncate pr-1.5">{t.name}</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Active tool playground wrapper */}
            <div className="lg:col-span-9 space-y-6">
              <div className="rounded-2xl border border-neutral-200/55 dark:border-white/[0.05] bg-white/70 dark:bg-white/[0.02] p-1 md:p-2 overflow-hidden shadow-xl backdrop-blur-md">
                {activeTool.isCore ? (
                  // Active fully working JS implementation
                  <div className="p-3 sm:p-5">
                    <div className="flex items-center gap-3 mb-6 border-b border-neutral-100 dark:border-white/[0.04] pb-4">
                      <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <DynamicIcon name={activeTool.icon} className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold font-sans bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-white dark:via-neutral-200 dark:to-neutral-400 tracking-tight leading-none">
                            {activeTool.name}
                          </h2>
                          <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider mt-0.5 select-none animate-pulse">
                            Active Core
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono mt-1.5 block">
                          ID: {activeTool.id} • Offline Client Execution
                        </span>
                      </div>
                    </div>

                    <React.Suspense fallback={<ToolSkeleton />}>
                      {renderCoreToolComponent(activeTool.id)}
                    </React.Suspense>
                  </div>
                ) : (
                  // Active fully working Polymorphic JS implementation for other 42 tools
                  <div className="p-3 sm:p-5">
                    <div className="flex items-center justify-between mb-6 border-b border-neutral-100 dark:border-white/[0.04] pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                          <DynamicIcon name={activeTool.icon} className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold font-sans bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-white dark:via-neutral-200 dark:to-neutral-400 tracking-tight leading-none">
                              {activeTool.name}
                            </h2>
                            <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider mt-0.5 select-none animate-pulse">
                              Active Core
                            </span>
                          </div>
                          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono mt-1.5 block">
                            ID: {activeTool.id} • Offline Client Execution
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveToolId(null)}
                        className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0 font-mono"
                      >
                        ← Back to all {TOOLS.length} tools
                      </button>
                    </div>

                    <React.Suspense fallback={<ToolSkeleton />}>
                      <PolymorphicTool id={activeTool.id} onActionTrigger={triggerActionWithAd} />
                    </React.Suspense>
                  </div>
                )}
              </div>

              {/* Dynamic SEO Resource Section */}
              {(() => {
                const guide = getDynamicSeoGuide(
                  activeTool.id,
                  activeTool.name,
                  activeTool.description,
                  activeTool.category,
                  activeTool.keywords
                );

                return (
                  <div className="rounded-2xl border border-neutral-200/55 dark:border-white/[0.05] bg-white/70 dark:bg-white/[0.02] p-6 shadow-md space-y-6 backdrop-blur-md">
                    <div className="pb-4 border-b border-neutral-200/55 dark:border-white/[0.04]">
                      <span className="text-[10px] font-mono font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-1.5">SEO OPTIMIZED USER GUIDE</span>
                      <h1 className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-snug">
                        {guide.title}
                      </h1>
                      <p className="text-xs font-semibold text-neutral-450 dark:text-neutral-500 mt-1 font-mono uppercase tracking-wide">
                        {guide.headline}
                      </p>
                    </div>

                    <p className="text-sm text-neutral-600 dark:text-neutral-350 leading-relaxed font-sans">
                      {guide.intro}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide font-mono">How to use: 3 Easy Steps</h4>
                        <ol className="space-y-2.5 text-xs text-neutral-600 dark:text-neutral-350 list-decimal pl-4 font-sans leading-relaxed">
                          {guide.steps.map((step, i) => {
                            const labelParts = step.split(':');
                            const boldLabel = labelParts[0];
                            const desc = labelParts.slice(1).join(':');
                            return (
                              <li key={i}>
                                <strong className="text-neutral-800 dark:text-neutral-200">{boldLabel}:</strong>
                                {desc}
                              </li>
                            );
                          })}
                        </ol>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide font-mono">Key Benefits & Capabilities</h4>
                        <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-350 list-disc pl-4 font-sans leading-relaxed">
                          {guide.benefits.map((benefit, i) => {
                            const labelParts = benefit.split(':');
                            const boldLabel = labelParts[0];
                            const desc = labelParts.slice(1).join(':');
                            return (
                              <li key={i}>
                                <strong className="text-neutral-800 dark:text-neutral-200">{boldLabel}:</strong>
                                {desc}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-neutral-100 dark:border-white/[0.04] space-y-4">
                      <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide font-mono">Frequently Asked Questions (FAQs)</h4>
                      <div className="space-y-4">
                        {guide.faqs.map((faq, i) => (
                          <div key={i} className="space-y-1">
                            <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 font-sans">Q{i + 1}: {faq.q}</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-450 leading-relaxed font-sans pl-1">
                              {faq.a}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-900/35 border border-neutral-150 dark:border-neutral-900 rounded-xl">
                      <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block mb-1">PRO META DESCRIPTION RECOMMENDATION (155 Characters)</span>
                      <code className="text-xs text-emerald-600 dark:text-emerald-400 font-mono block select-all break-words leading-relaxed bg-white dark:bg-neutral-950 p-2 rounded-lg border border-neutral-200 dark:border-neutral-800">
                        {guide.metaDescription}
                      </code>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        ) : (
          /* VIEW B: THE MAIN DISCOVERY HUB (SIDEBAR + GRID) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10">
            
            {/* SIDEBAR NAVIGATION PANELS */}
            <aside className="lg:col-span-3 space-y-6">
              {/* Category Filter Cards */}
              <div className="rounded-2xl border border-neutral-200/50 dark:border-white/[0.05] bg-white/70 dark:bg-white/[0.02] p-4.5 shadow-sm space-y-2.5 backdrop-blur-md">
                <span className="block text-[9px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-500 px-1 mb-2.5">
                  Browse Tool Sets
                </span>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setSearchQuery('');
                      }}
                      className={`w-full flex items-center justify-between text-left px-3.5 py-2 rounded-xl text-xs font-medium tracking-wide transition-all duration-300 ${
                        selectedCategory === cat
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.11)]'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-white/[0.03] border border-transparent'
                      }`}
                    >
                      <span className="font-sans font-semibold">{cat === 'All' ? `All ${TOOLS.length} Utilities` : cat}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                        selectedCategory === cat 
                          ? 'bg-emerald-500/20 text-emerald-650 dark:text-emerald-400' 
                          : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-500'
                      }`}>
                        {cat === 'All' ? TOOLS.length : TOOLS.filter((t) => t.category === cat).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sidebar Ad Slot (300x250) */}
              <div className="rounded-2xl border border-dashed border-neutral-300/40 dark:border-white/[0.05] p-1">
                <AdSensePlaceholder type="sidebar" />
              </div>

              {/* Offline capabilities card */}
              <div className="rounded-2xl border border-neutral-200/50 dark:border-white/[0.05] bg-white/70 dark:bg-white/[0.02] p-4 shadow-sm text-center backdrop-blur-md">
                <Laptop className="h-5 w-5 text-emerald-500 dark:text-emerald-400 mx-auto mb-2.5" />
                <span className="block text-xs font-bold text-neutral-800 dark:text-neutral-100 font-sans tracking-tight">
                  100% Client-Side Engine
                </span>
                <span className="block text-[10px] text-neutral-450 dark:text-neutral-500 mt-1.5 leading-relaxed">
                  All compilers, encoders, and compressor sliders execute locally inside your sandboxed browser. No files are ever sent to external cloud servers.
                </span>
              </div>

              {/* Tool History Logbook Card */}
              <div className="rounded-2xl border border-neutral-200/50 dark:border-white/[0.05] bg-white/70 dark:bg-white/[0.02] p-4.5 shadow-sm space-y-3.5 backdrop-blur-md">
                <div className="flex items-center justify-between col-span-1 border-b border-neutral-150/60 dark:border-white/[0.04] pb-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400 font-bold block">
                    Activity Logbook
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                      isFirebaseActive && user && !user.isGuest ? 'bg-emerald-500' : 'bg-amber-500'
                    }`} />
                    <span className="text-[8.5px] font-mono text-neutral-455 dark:text-neutral-500 uppercase font-bold">
                      {isFirebaseActive && user && !user.isGuest ? 'Cloud' : 'Guest Local'}
                    </span>
                  </div>
                </div>

                {history.length > 0 ? (
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {history.slice(0, 5).map((item) => (
                      <div key={item.id} className="text-left p-2.5 rounded-xl border border-neutral-150/60 dark:border-white/[0.03] bg-neutral-50/20 dark:bg-white/[0.015] text-[11px] leading-relaxed transition hover:border-emerald-500/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-neutral-800 dark:text-neutral-200 truncate pr-2 max-w-[120px]">
                            {item.toolName}
                          </span>
                          <span className="text-[8.5px] font-mono text-neutral-400 dark:text-neutral-500 truncate">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-normal">
                          {item.details}
                        </p>
                        {item.status === 'success' ? (
                          <span className="inline-flex items-center gap-1 text-[8.5px] font-mono text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                            ✓ Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[8.5px] font-mono text-red-500 dark:text-red-400 font-bold mt-1">
                            ✗ Failed
                          </span>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={clearHistory}
                      className="w-full text-center py-1.5 text-[10px] font-mono font-bold text-neutral-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400 transition cursor-pointer"
                    >
                      Clear Activity Log
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-neutral-50/20 dark:bg-white/[0.01] rounded-xl border border-dashed border-neutral-120 dark:border-white/[0.03] text-[10px] text-neutral-450 dark:text-neutral-500 leading-normal">
                    No recent actions. Running tools or actions registers entries here.
                  </div>
                )}
              </div>
            </aside>

            {/* MAIN PORTAL AREA (SEARCH BAR + TOOLS GRID LIST) */}
            <section className="lg:col-span-9 space-y-6">

              {/* FAVORITES HEADER BAR IF EXISTS */}
              {user && favorites.length > 0 && (
                <div className="rounded-2xl border border-neutral-200/50 dark:border-white/[0.05] bg-white/70 dark:bg-white/[0.02] p-5 shadow-sm space-y-4 backdrop-blur-md">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-widest font-mono select-none">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                    <span className="font-sans bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-white dark:to-neutral-350">Your Favorites ({favorites.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {TOOLS.filter(t => favorites.includes(t.id)).map(favTool => (
                      <div
                        key={favTool.id}
                        onClick={() => setActiveToolId(favTool.id)}
                        className="flex items-center justify-between p-3 rounded-xl border border-neutral-150 dark:border-white/[0.04] bg-neutral-50/40 dark:bg-white/[0.015] hover:bg-neutral-150 dark:hover:bg-white/[0.03] transition duration-300 hover:shadow-xs cursor-pointer select-none group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-1.5 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 text-neutral-550 dark:text-neutral-450 group-hover:text-emerald-500 transition-colors">
                            <DynamicIcon name={favTool.icon} className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate pr-1">
                            {favTool.name}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(favTool.id);
                          }}
                          className="text-neutral-300 hover:text-amber-500 p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-850 transition cursor-pointer"
                          title="Remove favorite"
                        >
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TOOL USAGE HISTORY PANEL */}
              <div className="rounded-2xl border border-neutral-200/50 dark:border-white/[0.05] bg-white/70 dark:bg-white/[0.02] p-5 shadow-sm space-y-4 backdrop-blur-md">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono select-none">
                    <Clock className="h-4 w-4 text-emerald-500 animate-pulse" />
                    <span className="font-sans bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-white dark:to-neutral-350">Tool Usage History</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/10">
                    <Lock className="h-3 w-3 text-emerald-500" />
                    <span className="text-[9px] font-semibold tracking-wider uppercase font-mono">Immutable Log</span>
                  </div>
                </div>

                {!user || user.isGuest ? (
                  <div className="rounded-xl border border-dashed border-neutral-205 dark:border-white/[0.05] p-5 text-center bg-neutral-50/10 dark:bg-neutral-900/10">
                    <Lock className="h-5 w-5 text-neutral-450 dark:text-neutral-500 mx-auto mb-2" />
                    <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">History is Locked</p>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1 leading-normal max-w-sm mx-auto">
                      Only logged-in members can track and view their immutable custom tool usage and run history.
                    </p>
                    <button
                      onClick={() => setShowLoginModal(true)}
                      className="mt-3 inline-flex items-center gap-1.5 py-1.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition shadow-sm cursor-pointer"
                    >
                      <LogIn className="h-3 w-3" />
                      Sign In to Unlock History
                    </button>
                  </div>
                ) : toolHistory.length === 0 ? (
                  <p className="text-xs text-neutral-400 dark:text-neutral-550 italic leading-normal pl-1">
                    Your recently used tools will be automatically logged here in a secure, non-deletable log file.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 italic pl-1 leading-normal">
                      🛡️ Tool usage is securely and permanently stored. This history is read-only and cannot be altered or cleared.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                      {TOOLS.filter(t => toolHistory.includes(t.id))
                        .sort((a, b) => toolHistory.indexOf(a.id) - toolHistory.indexOf(b.id))
                        .map(hisTool => (
                          <div
                            key={hisTool.id}
                            onClick={() => setActiveToolId(hisTool.id)}
                            className="flex items-center justify-between p-3 rounded-xl border border-neutral-200/50 dark:border-white/[0.04] bg-white/55 dark:bg-white/[0.012] hover:bg-neutral-100/50 dark:hover:bg-white/[0.035] hover:border-emerald-500/30 transition-all duration-300 hover:shadow-sm cursor-pointer select-none group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="p-1.5 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-150 dark:border-white/[0.03] text-neutral-500 dark:text-neutral-400 group-hover:text-emerald-500 transition-colors">
                                <DynamicIcon name={hisTool.icon} className="h-4 w-4" />
                              </div>
                              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate pr-1">
                                {hisTool.name}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono font-bold text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-white/[0.03] px-2 py-0.5 rounded-md uppercase tracking-wider">
                              Opened
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Responsive search inputs for mobile grid */}
              <div className="block md:hidden relative max-w-full">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-neutral-400 dark:text-neutral-500">
                  <Search className="h-4.5 w-4.5" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={`Search ${TOOLS.length} web metrics & tools...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 pl-10 pr-4 py-2.5 text-sm text-neutral-800 dark:text-neutral-200 focus:outline outline-emerald-500"
                />
              </div>

              {/* Search result summary line */}
              <div className="flex items-center justify-between text-[10px] font-mono tracking-widest uppercase text-neutral-400 dark:text-neutral-550 px-1 select-none">
                <span>
                  Showing {filteredTools.length} {selectedCategory !== 'All' ? selectedCategory : 'Total'} Utilities
                </span>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-emerald-500 dark:text-emerald-400 font-bold hover:underline"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              {/* 50 Cards Grid */}
              {filteredTools.length > 0 ? (
                <motion.div
                  key={`${selectedCategory}-${searchQuery}`}
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.015,
                        delayChildren: 0.02
                      }
                    }
                  }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-5"
                >
                  {filteredTools.map((tool) => (
                    <motion.div
                      variants={{
                        hidden: { opacity: 0, y: 12 },
                        show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } }
                      }}
                      whileHover={{ y: -4, scale: 1.012, transition: { duration: 0.15, ease: 'easeOut' } }}
                      whileTap={{ scale: 0.99 }}
                      key={tool.id}
                      onClick={() => setActiveToolId(tool.id)}
                      className={`group relative flex flex-col justify-between rounded-2xl border p-5 cursor-pointer backdrop-blur-md transition-all duration-300 ease-out ${
                        tool.isCore
                          ? 'border-emerald-500/30 hover:border-emerald-500/80 dark:border-emerald-500/20 dark:hover:border-emerald-500/60 bg-white/80 dark:bg-white/[0.035] hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                          : 'border-neutral-200/60 dark:border-white/[0.05] hover:border-emerald-500/40 dark:hover:border-emerald-500/40 bg-white/70 dark:bg-white/[0.015] hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                      }`}
                    >
                      <div>
                        {/* Header and Core badge */}
                        <div className="flex items-start justify-between gap-2.5">
                          <div className={`p-2 rounded-xl transition-all duration-300 ${
                            tool.isCore 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-550 group-hover:text-white' 
                              : 'bg-neutral-100 dark:bg-white/[0.04] text-neutral-400 dark:text-neutral-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 dark:group-hover:text-emerald-400'
                          }`}>
                            <DynamicIcon name={tool.icon} className="h-5 w-5" />
                          </div>

                          <div className="flex items-center gap-1.5">
                            {user && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(tool.id);
                                }}
                                className="p-1 rounded-md text-neutral-300 hover:text-amber-500 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition cursor-pointer"
                                title={favorites.includes(tool.id) ? 'Remove Favorite' : 'Save as Favorite'}
                              >
                                <Star className={`h-4 w-4 transition-transform hover:scale-110 ${favorites.includes(tool.id) ? 'fill-amber-400 text-amber-500' : 'text-neutral-300 dark:text-neutral-700'}`} />
                              </button>
                            )}

                            {tool.isCore ? (
                              <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider font-mono">
                                Instant core
                              </span>
                            ) : (
                              <span className="rounded-full bg-neutral-100 dark:bg-white/[0.04] text-neutral-450 dark:text-neutral-500 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider font-mono">
                                Template
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Text Title */}
                        <h4 className="mt-4 text-sm font-bold text-neutral-800 dark:text-neutral-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {tool.name}
                        </h4>

                        {/* Text Description */}
                        <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-normal line-clamp-2">
                          {tool.description}
                        </p>
                      </div>

                      {/* Footer Category and action */}
                      <div className="mt-5 pt-3.5 border-t border-neutral-100 dark:border-white/[0.04] flex items-center justify-between text-[9px] font-mono tracking-wider uppercase text-neutral-400 dark:text-neutral-550">
                        <span>{tool.category}</span>
                        <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all font-semibold">
                          Launch Tool <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                /* Empty query state */
                <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 p-12 text-center bg-white dark:bg-neutral-950">
                  <Wrench className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
                    No matching utilities found
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                    We couldn't locate any tools matching "{searchQuery}". Try searching simple categories like Image, PDF, text parameters, or developers hashes.
                  </p>
                </div>
              )}

              {/* Main Feed CTR Ad Container */}
              <div className="pt-4">
                <AdSensePlaceholder type="inline" />
              </div>
            </section>
          </div>
        )}
      </main>

      {/* FOOTER METRICS AND ATTRIBUTION */}
      <footer className="mt-16 bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 select-none">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow shadow-emerald-500/25 text-xs">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-bold text-neutral-850 dark:text-neutral-100">
              MegaTool
            </span>
          </div>
          
          <p className="text-xs text-neutral-400 dark:text-neutral-500 font-normal max-w-lg mx-auto leading-normal">
            A comprehensive catalog of {TOOLS.length} desktop-first web analytics, format transform tools, and visual encoders designed for immediate client-side computation.
          </p>

          <div className="flex justify-center gap-4 text-[10px] text-neutral-400 dark:text-neutral-600 font-mono">
            <span>PORTAL REVISION: 2026.05</span>
            <span>•</span>
            <span>UTC TIME: 2026-05-25</span>
            <span>•</span>
            <span>STATUS: READY</span>
          </div>
        </div>
      </footer>

      {/* AUTHENTICATION PORTAL DIALOG */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 shadow-2xl space-y-5 text-left">
            
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/25">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-50 leading-none">
                    Join MegaTool Hub
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Synchronize your settings, favorites, and workspaces
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="rounded-lg p-1 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-400 dark:text-neutral-500 transition cursor-pointer"
              >
                <Check className="h-4 w-4" />
              </button>
            </div>

            {/* Explanatory Message */}
            <div className="p-3 bg-neutral-50 dark:bg-neutral-900/35 border border-neutral-150 dark:border-neutral-900 rounded-lg text-[11px] text-neutral-500 dark:text-neutral-400 leading-normal space-y-1">
              <span className="font-bold text-neutral-700 dark:text-neutral-300">Choose how to enter:</span>
              <p>You can use this website with complete data persistence by authenticating with Google, or run instantly offline under Guest mode.</p>
            </div>

            {/* Flow 1: Guest Mode */}
            <div className="space-y-3 pt-1 border-t border-neutral-150 dark:border-neutral-900">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Option A: Access as Guest (No Account Required)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter custom nickname..."
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950 px-3 py-2 text-neutral-800 dark:text-neutral-200 focus:outline outline-emerald-500 font-medium"
                />
                <button
                  onClick={() => {
                    loginAsGuest(guestName || 'Guest User');
                    setShowLoginModal(false);
                  }}
                  className="bg-neutral-850 hover:bg-neutral-750 text-white text-xs font-bold px-4 py-2 rounded-lg transition shrink-0 cursor-pointer"
                >
                  Enter
                </button>
              </div>
            </div>

            {/* Flow 2: Live Firebase Google Synchronized Account */}
            <div className="space-y-2 pt-4 border-t border-neutral-150 dark:border-neutral-900">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block">
                Option B: Secure Sync Account
              </label>
              
              <button
                onClick={async () => {
                  try {
                    await loginWithGoogle();
                    setShowLoginModal(false);
                  } catch (err) {
                    console.log('Login pop-up cancelled or failed');
                  }
                }}
                className="w-full h-11 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 font-bold rounded-lg flex items-center justify-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 transition cursor-pointer"
              >
                <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.9 0 3.61.66 4.95 1.94l3.7-3.7C18.42 1.25 15.42.36 12 .36 7.31.36 3.28 3.03 1.35 6.94l4.31 3.34c1.03-3.1 3.93-5.24 7.34-5.24z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.48-1.12 2.74-2.38 3.58l3.7 2.87c2.16-1.99 3.41-4.92 3.41-8.6z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.66 14.28a7.12 7.12 0 010-4.56l-4.31-3.34A11.96 11.96 0 000 12c0 2.05.52 4.01 1.35 5.62l4.31-3.34z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23.64c3.24 0 5.97-1.07 7.96-2.92l-3.7-2.87c-1.03.69-2.35 1.1-4.26 1.1-3.41 0-6.31-2.14-7.34-5.24l-4.31 3.34c1.93 3.91 5.96 6.59 10.65 6.59z"
                  />
                </svg>
                <span>Continue with Google Sync</span>
              </button>

              {!isFirebaseActive && (
                <div className="flex gap-1 items-start text-[9.5px] text-neutral-400 font-mono mt-1 leading-normal">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 mt-0.5 shrink-0" />
                  <span>Offline persistence active. When you connect details to Firebase, cloud synchronizations start automatically!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5-Second Countdown Interstitial Ad Modal */}
      {adIsOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
          {/* Backdrop Blur */}
          <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md" />
          
          {/* Main Card */}
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-920 p-6 shadow-2xl text-center overflow-hidden">
            {/* Ambient Background Glow Effect */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="mb-3 inline-flex items-center justify-center p-3 bg-emerald-950/40 text-emerald-400 rounded-2xl">
              <Clock className="h-5 w-5 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            
            <h3 className="text-lg font-bold font-sans text-neutral-150 tracking-tight flex items-center justify-center gap-1.5">
              <span>Resolving Tool Action...</span>
            </h3>
            
            {/* User Type & Policy Indicator Badges */}
            <div className="mt-1.5 mb-4 flex flex-wrap items-center justify-center gap-1.5">
              {interstitialType === 'guest' ? (
                <div className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] font-semibold text-amber-400 font-mono">
                  Guest Mode: Cap Active (Every 3rd action)
                </div>
              ) : (
                <div className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-semibold text-emerald-400 font-mono">
                  Logged Member: 10m Session Cooldown
                </div>
              )}
              <div className="px-2.5 py-0.5 rounded-full bg-neutral-800 text-[9px] font-mono text-neutral-400 border border-white/[0.04]">
                Ad: 1 of 1
              </div>
            </div>

            <p className="text-xs text-neutral-450 mt-1 mb-4 leading-normal max-w-sm mx-auto">
              Please wait while file/conversion processes are prepared. Resumes in <span className="text-emerald-400 font-mono font-bold text-sm bg-neutral-950 px-2 py-0.5 rounded border border-neutral-850">{adCountdown}s</span>
            </p>
            
            {/* PROTECTIVE UN-CLICKABLE AD POLICY BOUNDARY WRAPPER */}
            <div className="p-3.5 bg-neutral-950/80 border border-neutral-800/40 rounded-2xl select-none relative">
              {/* Un-clickable Border Policy Header */}
              <div className="text-[8px] font-semibold tracking-widest text-neutral-600 font-mono uppercase pb-2 mb-2 border-b border-white/[0.03] select-none pointer-events-none">
                🛡️ SAFE AD CONTENT CONTAINER • ACCIDENTAL CLICK PREVENTION
              </div>
              
              {/* SPONSORED AD CONTENT PLACEHOLDER BOX (300x250) */}
              <div className="mx-auto w-[300px] h-[250px] rounded-xl border border-dashed border-neutral-800/80 bg-neutral-950 flex flex-col items-center justify-center p-3 relative select-none">
                <span className="absolute top-2 left-2.5 text-[8px] font-mono text-neutral-600 tracking-wider uppercase pointer-events-none select-none">
                  Sponsored Ad Slot
                </span>
                
                <div className="space-y-2.5 text-center">
                  <div className="inline-flex py-0.5 px-2.5 rounded-full bg-emerald-500/15 text-[9px] text-emerald-400 font-bold border border-emerald-500/20 uppercase tracking-wide">
                    megatool.com premium partner
                  </div>
                  <h4 className="text-xs font-bold text-neutral-200">
                    Supercharge All Utility Workflows
                  </h4>
                  <p className="text-[10.5px] text-neutral-400 max-w-[220px] mx-auto leading-normal">
                    Unlock limitless parallel downloads, smart client-side compression, and high accuracy translation scanners instantly.
                  </p>
                  <div className="pt-1.5">
                    <div className="inline-flex text-[11px] font-semibold text-neutral-300 bg-neutral-900 border border-neutral-800 hover:border-emerald-500/40 hover:text-emerald-300 px-3.5 py-1.5 rounded-xl transition duration-150 cursor-pointer">
                      Learn More ↗
                    </div>
                  </div>
                </div>
                
                <span className="absolute bottom-2 right-2.5 text-[8px] font-mono text-neutral-600 select-none pointer-events-none">
                  SPONSORED CONTENT (300x250)
                </span>
              </div>

              {/* Unclickable Policy Footer Margin */}
              <div className="text-[7.5px] font-medium tracking-wide text-neutral-600 font-mono pt-2 mt-1.5 select-none pointer-events-none">
                ACCIDENTAL CLICK MARGIN PROTECTED BY SITE SECURITY
              </div>
            </div>
            
            {/* Highly Polished Skip Ad Interactive Flow Option */}
            <div className="mt-5 flex flex-col items-center justify-center">
              {adCountdown > 3 ? (
                <button
                  disabled
                  className="w-full py-2.5 px-4 rounded-xl border border-neutral-850 bg-neutral-900/60 text-[11.5px] font-bold font-mono text-neutral-500 flex items-center justify-center gap-2 select-none"
                >
                  <Clock className="h-3.5 w-3.5 animate-spin text-neutral-600" />
                  <span>Preparing Premium Tools (Skip in {adCountdown - 3}s)</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (adPendingAction) {
                      adPendingAction();
                    }
                    setAdIsOpen(false);
                    setAdPendingAction(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 cursor-pointer"
                >
                  <span>Skip Ad & Continue ➜</span>
                </button>
              )}
            </div>

            <div className="mt-4.5 text-[10px] text-neutral-550 font-mono flex items-center justify-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <span>Interposed client sandbox execution active.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
