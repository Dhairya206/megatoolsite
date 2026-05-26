import React, { createContext, useContext, useState, useEffect } from 'react';

// Auth context ka structure define kar rahe hain
const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // App load hote hi loading khatam kar do
  useEffect(() => {
    setLoading(false);
  }, []);

  // Simple Guest Login (No Firebase, No 2FA required)
  const loginAsGuest = () => {
    setUser({ name: "Guest User", email: "guest@megatool.com", isGuest: true });
  };

  // Google login ko dummy bana diya hai kyunki 2FA nahi chahiye
  const loginWithGoogle = () => {
    console.log("Google Login clicked - Skipping 2FA and using Guest login instead.");
    loginAsGuest();
  };

  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    loading,
    loginWithGoogle,
    loginAsGuest,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook taaki dusre components mein use kar sako
export const useAuth = () => useContext(AuthContext);
