import React, { useState, useEffect } from 'react';
import { KeyRound, Copy, Check, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';

export const PasswordGenerator: React.FC = () => {
  const [password, setPassword] = useState<string>('');
  const [length, setLength] = useState<number>(16);
  const [useUppercase, setUseUppercase] = useState<boolean>(true);
  const [useLowercase, setUseLowercase] = useState<boolean>(true);
  const [useNumbers, setUseNumbers] = useState<boolean>(true);
  const [useSymbols, setUseSymbols] = useState<boolean>(true);
  const [excludeSimilar, setExcludeSimilar] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [strength, setStrength] = useState<{
    score: number; // 0-4
    label: string;
    color: string;
  }>({ score: 0, label: 'Weak', color: 'bg-red-500' });

  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numberChars = '0123456789';
  const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  // Similar characters: i, l, O, 0, 1, I, o
  const similarCharsRegex = /[ilO01Io]/g;

  const generatePassword = () => {
    let charPool = '';
    
    if (useLowercase) charPool += lowercaseChars;
    if (useUppercase) charPool += uppercaseChars;
    if (useNumbers) charPool += numberChars;
    if (useSymbols) charPool += symbolChars;

    if (!charPool) {
      setPassword('Select at least one set of characters.');
      return;
    }

    if (excludeSimilar) {
      charPool = charPool.replace(similarCharsRegex, '');
    }

    if (!charPool) {
      setPassword('Selected constraints exclude too many characters!');
      return;
    }

    let generated = '';
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
      const idx = array[i] % charPool.length;
      generated += charPool[idx];
    }

    setPassword(generated);
    calculateStrength(generated);
  };

  const calculateStrength = (pwd: string) => {
    if (!pwd || pwd.startsWith('Select') || pwd.startsWith('Selected')) {
      setStrength({ score: 0, label: 'Invalid', color: 'bg-neutral-300' });
      return;
    }

    let score = 0;
    
    // Length contribution
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 14) score += 1;

    // Diversity contribution
    let variations = 0;
    if (/[a-z]/.test(pwd)) variations++;
    if (/[A-Z]/.test(pwd)) variations++;
    if (/[0-9]/.test(pwd)) variations++;
    if (/[^a-zA-Z0-9]/.test(pwd)) variations++;

    if (variations >= 3) score += 1;
    if (variations === 4 && pwd.length >= 12) score += 1;

    let label = 'Weak';
    let color = 'bg-red-500';

    if (score === 1) {
      label = 'Weak';
      color = 'bg-red-500';
    } else if (score === 2) {
      label = 'Moderate';
      color = 'bg-amber-500';
    } else if (score === 3) {
      label = 'Strong';
      color = 'bg-emerald-500';
    } else if (score === 4) {
      label = 'Military Grade';
      color = 'bg-emerald-600 animate-pulse';
    }

    setStrength({ score, label, color });
  };

  const handleCopy = async () => {
    if (!password || password.startsWith('Select') || password.startsWith('Selected')) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  useEffect(() => {
    generatePassword();
  }, [length, useUppercase, useLowercase, useNumbers, useSymbols, excludeSimilar]);

  return (
    <div className="space-y-6" id="tool-password-generator">
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
          Secure Password Generator
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 font-normal">
          Generate highly secure, cryptographically random passcodes offline to prevent identity compromises and brute force hacks.
        </p>

        {/* Display Password Block */}
        <div className="relative flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-4.5 pr-28 hover:border-emerald-500/40 transition-colors">
          <span className="text-sm font-mono tracking-wider text-neutral-800 dark:text-neutral-100 break-all select-all font-semibold leading-relaxed">
            {password}
          </span>
          <div className="absolute right-2.5 top-2.5 flex items-center gap-1 shrink-0">
            <button
              onClick={generatePassword}
              className="p-2.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 bg-white dark:bg-neutral-800 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-neutral-100 dark:border-neutral-700 transition"
              title="Re-generate code"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={handleCopy}
              className="p-2.5 rounded-lg text-neutral-500 hover:text-emerald-600 dark:text-neutral-300 dark:hover:text-emerald-400 bg-white dark:bg-neutral-800 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-neutral-100 dark:border-neutral-700 transition font-bold"
              title="Copy to clipboard"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Password Strength Meter */}
        {strength.score !== 0 && (
          <div className="mt-4 flex items-center justify-between gap-4 p-3 bg-neutral-50/20 dark:bg-neutral-900/10 rounded-lg border border-neutral-100 dark:border-neutral-900">
            <div className="flex items-center gap-2">
              {strength.score >= 3 ? (
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
              ) : (
                <ShieldAlert className="h-4.5 w-4.5 text-amber-500 shrink-0" />
              )}
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Security Evaluation: <span className="font-bold text-neutral-800 dark:text-neutral-200">{strength.label}</span>
              </span>
            </div>

            {/* Micro Rating Indicator Boxes */}
            <div className="flex gap-1.5 shrink-0">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-2.5 w-6 rounded-full transition-all duration-300 ${
                    step <= strength.score ? strength.color : 'bg-neutral-200 dark:bg-neutral-800'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Configuration Sliders & Checkboxes */}
        <div className="mt-6 space-y-5">
          {/* Slider Length */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Password Word Length
              </span>
              <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                {length} Characters
              </span>
            </div>
            <input
              type="range"
              min="4"
              max="128"
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
              <span>Short (4)</span>
              <span>Medium (16)</span>
              <span>Secure (32)</span>
              <span>Ultra Heavy (128)</span>
            </div>
          </div>

          <div className="border-t border-neutral-100 dark:border-neutral-900 pt-5">
            <span className="block text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3">
              Included Character Sets & Constraints
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Lowercase Option */}
              <label className="flex items-center gap-2.5 rounded-lg border border-neutral-150 dark:border-neutral-800 px-3.5 py-2.5 bg-neutral-50/20 dark:bg-neutral-950/20 text-sm font-medium text-neutral-700 dark:text-neutral-350 cursor-pointer select-none hover:bg-neutral-100/30 dark:hover:bg-neutral-900/40">
                <input
                  type="checkbox"
                  checked={useLowercase}
                  onChange={(e) => setUseLowercase(e.target.checked)}
                  className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500 h-4.5 w-4.5"
                />
                <div className="flex flex-col">
                  <span>Lowercase Letters</span>
                  <span className="text-[10px] text-neutral-400 font-mono mt-0.5">(a-z)</span>
                </div>
              </label>

              {/* Uppercase Option */}
              <label className="flex items-center gap-2.5 rounded-lg border border-neutral-150 dark:border-neutral-800 px-3.5 py-2.5 bg-neutral-50/20 dark:bg-neutral-950/20 text-sm font-medium text-neutral-700 dark:text-neutral-355 cursor-pointer select-none hover:bg-neutral-100/30 dark:hover:bg-neutral-900/40">
                <input
                  type="checkbox"
                  checked={useUppercase}
                  onChange={(e) => setUseUppercase(e.target.checked)}
                  className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500 h-4.5 w-4.5"
                />
                <div className="flex flex-col">
                  <span>Uppercase Letters</span>
                  <span className="text-[10px] text-neutral-400 font-mono mt-0.5">(A-Z)</span>
                </div>
              </label>

              {/* Numbers Option */}
              <label className="flex items-center gap-2.5 rounded-lg border border-neutral-150 dark:border-neutral-800 px-3.5 py-2.5 bg-neutral-50/20 dark:bg-neutral-950/20 text-sm font-medium text-neutral-700 dark:text-neutral-355 cursor-pointer select-none hover:bg-neutral-100/30 dark:hover:bg-neutral-900/40">
                <input
                  type="checkbox"
                  checked={useNumbers}
                  onChange={(e) => setUseNumbers(e.target.checked)}
                  className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500 h-4.5 w-4.5"
                />
                <div className="flex flex-col">
                  <span>Numeric Digits</span>
                  <span className="text-[10px] text-neutral-400 font-mono mt-0.5">(0-9)</span>
                </div>
              </label>

              {/* Symbols Option */}
              <label className="flex items-center gap-2.5 rounded-lg border border-neutral-150 dark:border-neutral-800 px-3.5 py-2.5 bg-neutral-50/20 dark:bg-neutral-950/20 text-sm font-medium text-neutral-700 dark:text-neutral-355 cursor-pointer select-none hover:bg-neutral-100/30 dark:hover:bg-neutral-900/40">
                <input
                  type="checkbox"
                  checked={useSymbols}
                  onChange={(e) => setUseSymbols(e.target.checked)}
                  className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500 h-4.5 w-4.5"
                />
                <div className="flex flex-col">
                  <span>Custom Symbols</span>
                  <span className="text-[10px] text-neutral-400 font-mono mt-0.5">(!@#$%^&*)</span>
                </div>
              </label>
            </div>

            {/* Excluding Similar Characters */}
            <div className="mt-4">
              <label className="flex items-start gap-2.5 rounded-lg border border-dashed border-neutral-200 dark:border-neutral-800 px-3.5 py-3 bg-neutral-50/20 dark:bg-neutral-950/20 text-xs font-medium text-neutral-700 dark:text-neutral-350 cursor-pointer select-none hover:bg-neutral-100/30 dark:hover:bg-neutral-900/40">
                <input
                  type="checkbox"
                  checked={excludeSimilar}
                  onChange={(e) => setExcludeSimilar(e.target.checked)}
                  className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500 h-4.5 w-4.5 mt-0.5"
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-300">Exclude Similar Characters</span>
                  <span className="text-neutral-400 mt-1 leading-normal font-normal">
                    Frees passcodes of confusing shapes like (i, l, O, o, 1, 0, I) so it is highly keyable manually.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
