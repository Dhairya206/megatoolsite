import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

interface AdSensePlaceholderProps {
  type: 'leaderboard' | 'sidebar' | 'inline';
  className?: string;
}

export const AdSensePlaceholder: React.FC<AdSensePlaceholderProps> = ({ type, className = '' }) => {
  const [adBlockActive, setAdBlockActive] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkAdBlock = async () => {
      // 1. DOM Honeypot check
      const testAd = document.createElement('div');
      testAd.innerHTML = '&nbsp;';
      testAd.className = 'adsbox ads google-ads ad-zone banner-ad';
      testAd.setAttribute('style', 'position: absolute; left: -9999px; top: -9999px; width: 1px; height: 1px;');
      document.body.appendChild(testAd);
      
      // Delay check slightly to let extension process the element
      await new Promise(resolve => setTimeout(resolve, 80));
      
      if (!isMounted) {
        if (testAd.parentNode) document.body.removeChild(testAd);
        return;
      }

      if (testAd.offsetHeight === 0 || testAd.clientHeight === 0) {
        setAdBlockActive(true);
        if (testAd.parentNode) document.body.removeChild(testAd);
        return;
      }
      if (testAd.parentNode) document.body.removeChild(testAd);

      // 2. Script load network attempt
      try {
        const url = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        const response = await fetch(new Request(url, { method: 'HEAD', mode: 'no-cors' }));
        if (isMounted) {
          setAdBlockActive(false);
        }
      } catch (e) {
        if (isMounted) {
          setAdBlockActive(true);
        }
      }
    };

    checkAdBlock();
    return () => {
      isMounted = false;
    };
  }, []);

  if (type === 'leaderboard' && !adBlockActive) {
    return <div id="adsense-slot-leaderboard" className="hidden"></div>;
  }

  // Dimension definitions
  let dims = '';
  let layoutClasses = '';
  let sampleTitle = '';
  let sampleDesc = '';
  let sampleUrl = '';

  switch (type) {
    case 'leaderboard':
      dims = '728 x 90';
      layoutClasses = 'h-[90px] max-w-[728px] w-full';
      sampleTitle = 'Cloud VPS Hosting — High Performance Starting at $4.99/mo';
      sampleDesc = 'Get ultra-fast NVMe SSD storage, 99.9% uptime SLA, and root server authority. Deploy in 55 seconds globally!';
      sampleUrl = 'www.hostcloud.example.com/vps';
      break;
    case 'sidebar':
      dims = '300 x 250';
      layoutClasses = 'h-[250px] w-full max-w-[300px] flex-col';
      sampleTitle = 'Design assets for Developers';
      sampleDesc = 'Download templates, vector icons, SVG illustrations, and premium UI packs for commercial React prototypes.';
      sampleUrl = 'www.ui-crafts.example/vectors';
      break;
    case 'inline':
      dims = '728 x 90 or 300 x 250 (CTR Max)';
      layoutClasses = 'min-h-[110px] w-full';
      sampleTitle = 'Supercharge Code with AI Copilot Extensions';
      sampleDesc = 'Refactor functions, generate tests, and document modules with our secure visual neural network model library.';
      sampleUrl = 'www.codepilot.example/download';
      break;
  }

  // Beautiful Dark-Theme Whitelist Fallback Banners when AdBlocker is detected
  if (adBlockActive) {
    if (type === 'leaderboard') {
      return (
        <div 
          id={`adsense-slot-leaderboard-fallback`}
          className={`relative mx-auto flex items-center justify-between overflow-hidden rounded-xl border border-rose-500/25 bg-neutral-950 p-4 text-left select-none ${layoutClasses} ${className}`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950 pointer-events-none opacity-90" />
          <div className="relative z-10 flex items-center gap-3.5 w-full">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
              <Heart className="h-4.5 w-4.5 text-rose-500 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-extrabold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">Adblock Active</span>
                <span className="text-xs font-bold text-neutral-200">Support MegaTool!</span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5 truncate pr-6 font-medium">
                Please whitelist us to keep these 50+ tools 100% free and client-side.
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-neutral-900 text-neutral-300 text-[10px] font-semibold border border-neutral-800 hover:border-neutral-700 transition duration-200 shrink-0 font-mono">
              Whitelist instructions 🛡️
            </div>
          </div>
        </div>
      );
    }

    if (type === 'sidebar') {
      return (
        <div 
          id={`adsense-slot-sidebar-fallback`}
          className={`relative mx-auto flex flex-col justify-between overflow-hidden rounded-2xl border border-rose-500/25 bg-neutral-950 p-5 text-center select-none ${layoutClasses} ${className}`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950 pointer-events-none opacity-90" />
          
          <div className="relative z-10 flex flex-col items-center justify-center py-2 h-full">
            <div className="p-3 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-3">
              <Heart className="h-5.5 w-5.5 text-rose-500 animate-pulse" />
            </div>
            <div className="inline-flex py-0.5 px-2 rounded-full bg-rose-500/10 border border-rose-500/25 text-[8px] tracking-widest font-bold uppercase text-rose-400 font-mono mb-2">
              Adblock Detected
            </div>
            <h4 className="text-xs font-bold text-neutral-100 tracking-tight">
              Support MegaTool!
            </h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed mt-1.5 px-1 max-w-[220px]">
              Please whitelist us to keep these 50+ tools 100% free and client-side.
            </p>
          </div>

          <div className="relative z-10 mt-2 pt-2.5 border-t border-white/[0.05]">
            <div className="w-full flex items-center justify-center py-2 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-neutral-250 text-[11px] font-bold transition duration-200 cursor-pointer">
              How to Whitelist 🛡️
            </div>
          </div>
        </div>
      );
    }

    if (type === 'inline') {
      return (
        <div 
          id={`adsense-slot-inline-fallback`}
          className={`relative mx-auto flex items-center justify-between overflow-hidden rounded-xl border border-rose-500/25 bg-neutral-950 px-5 py-4 select-none ${layoutClasses} ${className}`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950 pointer-events-none opacity-90" />
          <div className="relative z-10 flex items-center gap-4 w-full">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
              <Heart className="h-5 w-5 text-rose-450 animate-pulse" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] font-mono font-extrabold text-rose-450 bg-rose-500/10 px-2 py-0.5 rounded uppercase tracking-wider">Adblock Enabled</span>
                <span className="text-xs font-bold text-neutral-100 font-sans">Support Free Utility Engine</span>
              </div>
              <p className="text-[11.5px] text-neutral-400 mt-1 max-w-xl leading-relaxed font-normal">
                Please whitelist us to keep these 50+ tools free and running purely client-side. We rely on unintrusive ads to keep servers running.
              </p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 text-neutral-200 text-xs font-bold transition duration-200 shrink-0 font-sans cursor-pointer whitespace-nowrap">
              Support Whitelist 🛡️
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div 
      className={`relative mx-auto flex items-center justify-between overflow-hidden rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 px-4 py-2 select-none ${layoutClasses} ${className}`}
      id={`adsense-slot-${type}`}
    >
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:24px_24px] opacity-[0.25] dark:bg-[linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)] dark:opacity-30"></div>

      {/* Ad Badge */}
      <div className="absolute top-1.5 left-2.5 z-10 flex items-center gap-1.5">
        <span className="rounded bg-neutral-200 dark:bg-neutral-800 px-1 text-[8px] font-bold tracking-widest text-neutral-500 dark:text-neutral-400">
          SPONSORED
        </span>
        <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
          ({dims})
        </span>
      </div>

      {/* Ad text content */}
      <div className="relative z-10 flex flex-col justify-center h-full pt-3 text-left w-full pr-12">
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer truncate">
          {sampleTitle}
        </span>
        <span className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug line-clamp-2 mt-0.5 font-sans">
          {sampleDesc}
        </span>
        <span className="text-[10px] text-emerald-700/80 dark:text-emerald-500/80 mt-1 truncate font-mono">
          ↗ {sampleUrl}
        </span>
      </div>

      {/* AdSense Indicator Icon or Action */}
      <div className="relative z-10 hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/60 dark:bg-neutral-800/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
        <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 font-mono">ADS</span>
      </div>
    </div>
  );
};
