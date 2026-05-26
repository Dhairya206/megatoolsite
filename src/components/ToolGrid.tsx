import React, { useState } from 'react';
import { useAuth } from './AuthContext';

export const ToolGrid: React.FC<{darkMode: boolean, setDarkMode: (v: boolean) => void}> = ({ darkMode, setDarkMode }) => {
  const { user, loginAsGuest, logout } = useAuth();
  return (
    <div className={darkMode ? 'bg-gray-900 text-white min-h-screen p-6' : 'bg-gray-50 text-black min-h-screen p-6'}>
      <h1 className="text-2xl font-bold">MegaTool Dashboard</h1>
      <div className="mt-10 text-center p-10 border rounded-xl">
        {!user ? (
          <button onClick={loginAsGuest} className="bg-blue-600 text-white px-6 py-3 rounded-lg">
            Login as Guest
          </button>
        ) : (
          <div>
            <p>Welcome, User!</p>
            <button onClick={logout} className="text-red-500 mt-4">Logout</button>
          </div>
        )}
      </div>
    </div>
  );
};
