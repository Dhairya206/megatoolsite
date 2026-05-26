import React from 'react';
import { useAuth } from './AuthContext';

export const ToolGrid: React.FC<{darkMode: boolean, setDarkMode: (v: boolean) => void}> = ({ darkMode, setDarkMode }) => {
  const { user, logout } = useAuth();
  
  // Yahan tum apne 50 tools ki list update kar sakte ho
  const tools = Array.from({ length: 50 }, (_, i) => ({
    name: `Tool Number ${i + 1}`,
    desc: `Description for utility ${i + 1}`
  }));

  return (
    <div className={darkMode ? 'bg-gray-900 text-white min-h-screen p-8' : 'bg-gray-50 text-black min-h-screen p-8'}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">MegaTool (All 50 Utilities)</h1>
        <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded bg-gray-700 text-white">Theme</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {tools.map((tool) => (
          <div key={tool.name} className="p-4 border rounded shadow-sm bg-white dark:bg-gray-800 text-center">
            <h3 className="font-semibold text-sm mb-1">{tool.name}</h3>
            <button className="text-xs w-full py-1 bg-blue-600 text-white rounded">Open</button>
          </div>
        ))}
      </div>
    </div>
  );
};
