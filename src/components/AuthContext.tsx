import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);

  const login = () => setUser({ displayName: 'Guest User' });
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle: login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
