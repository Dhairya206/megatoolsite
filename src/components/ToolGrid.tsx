import React from 'react';
import { useAuth } from './AuthContext';

export const ToolGrid: React.FC<{darkMode: boolean, setDarkMode: (v: boolean) => void}> = ({ darkMode, setDarkMode }) => {
  const { user, loginWithGoogle, logout } = useAuth();
  
  return (
    <div className={darkMode ? 'bg-gray-900 text-white min-h-screen p-6' : 'bg-gray-50 text-black min-h-screen p-6'}>
      <h1 className="text-2xl font-bold">MegaTool Dashboard</h1>
      <div className="mt-10">
        {!user ? (
          <button onClick={loginWithGoogle} className="bg-blue-500 text-white px-4 py-2 rounded">
            Login
          </button>
        ) : (
          <div>
            <p>Welcome, {user.displayName}!</p>
            <button onClick={logout} className="text-red-500 underline">Logout</button>
          </div>
        )}
      </div>
    </div>
  );
};
