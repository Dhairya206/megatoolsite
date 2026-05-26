/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ToolGrid } from './components/ToolGrid';
import { AuthProvider } from './components/AuthContext';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mega-tool-theme');
      if (saved) return saved === 'dark';
      return true; // Default to modern ultra-premium dark theme
    }
    return true;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.body.style.backgroundColor = '#030712'; // Slate-950/deep gray
      localStorage.setItem('mega-tool-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '#fafafa';
      localStorage.setItem('mega-tool-theme', 'light');
    }
  }, [darkMode]);

  return (
    <AuthProvider>
      <ToolGrid darkMode={darkMode} setDarkMode={setDarkMode} />
    </AuthProvider>
  );
}

