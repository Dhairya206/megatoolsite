import React from 'react';
import { useAuth } from './AuthContext';

interface ToolGridProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const ToolGrid: React.FC<ToolGridProps> = ({ darkMode, setDarkMode }) => {
  const { user, logout } = useAuth();
  
  const tools = [
    { name: 'Image Compressor', desc: 'Fast image resizing' },
    { name: 'QR Code Gen', desc: 'Create custom QR codes' },
    { name: 'PDF Merger', desc: 'Combine multiple PDFs' },
    { name: 'Password Gen', desc: 'Secure passwords' },
    { name: 'JSON Formatter', desc: 'Clean your code' },
    { name: 'Text Converter', desc: 'Upper to lower case' }
  ];

  return (
    <div className={darkMode ? 'bg-gray-900 text-white min-h-screen p-8' : 'bg-gray-50 text-black min-h-screen p-8'}>
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold">MegaTool Dashboard</h1>
        <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg bg-gray-700 text-white">
          Toggle Theme
        </button>
      </div>

      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg flex justify-between items-center">
        <span>Logged in as: <strong>{user?.displayName || 'Guest User'}</strong></span>
        <button onClick={logout} className="text-red-400 font-bold hover:underline">Logout</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <div key={tool.name} className="p-6 border rounded-xl shadow-sm hover:shadow-md transition bg-white dark:bg-gray-800">
            <h3 className="text-xl font-semibold mb-2">{tool.name}</h3>
            <p className="text-gray-500 dark:text-gray-400">{tool.desc}</p>
            <button className="mt-4 w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Open Tool</button>
          </div>
        ))}
      </div>
    </div>
  );
};
