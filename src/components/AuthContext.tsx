import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, getDocFromServer, collection, writeBatch, serverTimestamp } from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(auth: any, error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  isGuest?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  favorites: string[];
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: (name: string) => void;
  logout: () => Promise<void>;
  toggleFavorite: (toolId: string) => Promise<void>;
  isFirebaseActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isFirebaseActive, setIsFirebaseActive] = useState<boolean>(false);

  // References to Firebase services initialized lazily
  const [authService, setAuthService] = useState<any>(null);
  const [dbService, setDbService] = useState<any>(null);

  // Attempt to load Firebase dynamically from the client
  useEffect(() => {
    const initFirebase = async () => {
      try {
        // Safe runtime retrieval that prevents Rollup compilation errors if config is missing
        let config: any = null;
        try {
          // First attempt: fetch static runtime configuration from route
          const response = await fetch('/firebase-applet-config.json');
          if (response.ok) {
            config = await response.json();
          }
        } catch (fetchErr) {
          console.log('Runtime config fetch offline. Trying relative layout dynamic import...');
        }

        if (!config) {
          try {
            // Secondary attempt: dynamic chunk import using variable pointer to bypass Rollup compile-time lookups
            const bundleConfigLocName = '../firebase-applet-config.json';
            const configModule = await import(/* @vite-ignore */ bundleConfigLocName);
            config = configModule.default || configModule;
          } catch (importErr) {
            // both failed
          }
        }

        if (config && config.apiKey && config.projectId) {
          const app = getApps().length === 0 ? initializeApp(config) : getApp();
          const auth = getAuth(app);
          const db = getFirestore(app, config.firestoreDatabaseId);
          
          setAuthService(auth);
          setDbService(db);
          setIsFirebaseActive(true);

          // Validate connection to Firestore immediately upon initialization
          try {
            await getDocFromServer(doc(db, 'test_connection', 'ping'));
          } catch (connErr) {
            if (connErr instanceof Error && connErr.message.includes('the client is offline')) {
              console.error("Please check your Firebase configuration: client is offline.");
            } else {
              console.log("Firestore connection diagnostics run completed.", connErr);
            }
          }

          // Listen to raw auth state changes
          onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
              // Validate session expiry (1 month / 30 days)
              const loginTime = localStorage.getItem('mega-tool-login-time');
              const oneMonthMs = 30 * 24 * 60 * 60 * 1000;
              if (loginTime && (Date.now() - parseInt(loginTime, 10)) > oneMonthMs) {
                console.log('Session has expired (older than 1 month). Auto logging out...');
                localStorage.removeItem('mega-tool-login-time');
                localStorage.removeItem('mega-tool-guest-user');
                try {
                  await signOut(auth);
                } catch (logoutErr) {
                  console.error('Auto logout error:', logoutErr);
                }
                setUser(null);
                setFavorites([]);
                setLoading(false);
                return;
              } else if (!loginTime) {
                localStorage.setItem('mega-tool-login-time', Date.now().toString());
              }

              const profile: UserProfile = {
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Member',
                email: firebaseUser.email || '',
                photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${firebaseUser.uid}`,
                isGuest: false,
              };
              setUser(profile);

              // Pull favorites from Firestore
              try {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                let userDoc;
                try {
                  userDoc = await getDoc(userDocRef);
                } catch (getErr) {
                  handleFirestoreError(auth, getErr, OperationType.GET, `users/${firebaseUser.uid}`);
                }

                if (userDoc && userDoc.exists()) {
                  setFavorites(userDoc.data().favorites || []);
                } else {
                  // Create user document if missing
                  const payload = {
                    uid: firebaseUser.uid,
                    displayName: profile.displayName,
                    email: profile.email,
                    favorites: [],
                    createdAt: new Date().toISOString(),
                  };
                  try {
                    await setDoc(userDocRef, payload);
                  } catch (setErr) {
                    handleFirestoreError(auth, setErr, OperationType.CREATE, `users/${firebaseUser.uid}`);
                  }
                  setFavorites([]);
                }

                // Clean migration strategy for guest history items
                const guestHistoryKey = 'megatool-guest-history';
                const guestHistoryRaw = localStorage.getItem(guestHistoryKey);
                if (guestHistoryRaw) {
                  try {
                    const guestHistory = JSON.parse(guestHistoryRaw);
                    if (Array.isArray(guestHistory) && guestHistory.length > 0) {
                      console.log(`Migrating ${guestHistory.length} local guest history items to Firebase for user: ${firebaseUser.uid}...`);
                      const batch = writeBatch(db);
                      const historyCollectionRef = collection(db, 'users', firebaseUser.uid, 'history');
                      
                      // Migrate up to 100 entries cleanly to fit within security and sizing quotas
                      guestHistory.slice(0, 100).forEach((item: any) => {
                        const newDocRef = doc(historyCollectionRef);
                        batch.set(newDocRef, {
                          toolId: item.toolId || 'unknown',
                          toolName: item.toolName || 'Unknown Tool',
                          timestamp: item.timestamp || new Date().toISOString(),
                          status: item.status || 'success',
                          details: item.details || '',
                          fileDetails: item.fileDetails || null,
                          createdAt: serverTimestamp(),
                        });
                      });
                      
                      try {
                        await batch.commit();
                        localStorage.removeItem(guestHistoryKey);
                        console.log('Guest history migration completed successfully.');
                      } catch (batchErr) {
                        handleFirestoreError(auth, batchErr, OperationType.WRITE, `users/${firebaseUser.uid}/history`);
                      }
                    }
                  } catch (migrateErr) {
                    console.error('Error during guest history migration:', migrateErr);
                  }
                }
              } catch (err) {
                console.warn('Error reading or setting Firestore profile:', err);
              }

            } else {
              // Not logged in to Firebase - check local storage for a guest session
              const guestLocal = localStorage.getItem('mega-tool-guest-user');
              if (guestLocal) {
                try {
                  const guestProfile = JSON.parse(guestLocal) as UserProfile;
                  
                  // Validate session expiry (1 month / 30 days) for guest users
                  const loginTime = localStorage.getItem('mega-tool-login-time');
                  const oneMonthMs = 30 * 24 * 60 * 60 * 1000;
                  if (loginTime && (Date.now() - parseInt(loginTime, 10)) > oneMonthMs) {
                    console.log('Guest session has expired (older than 1 month). Auto logging out...');
                    localStorage.removeItem('mega-tool-login-time');
                    localStorage.removeItem('mega-tool-guest-user');
                    setUser(null);
                    setFavorites([]);
                    setLoading(false);
                    return;
                  } else if (!loginTime) {
                    localStorage.setItem('mega-tool-login-time', Date.now().toString());
                  }

                  setUser(guestProfile);
                  const guestFavs = localStorage.getItem(`mega-tool-favs-${guestProfile.uid}`);
                  setFavorites(guestFavs ? JSON.parse(guestFavs) : []);
                } catch {
                  setUser(null);
                }
              } else {
                setUser(null);
                setFavorites([]);
              }
            }
            setLoading(false);
          });
        } else {
          throw new Error('Config file is incomplete');
        }
      } catch (err) {
        // Fallback to client-side localStorage session if Firebase config is missing or invalid
        console.log('Firebase config is absent or pending user setup. Activating full local guest authentication...');
        setIsFirebaseActive(false);
        
        // Read guest profile from localStorage
        const guestLocal = localStorage.getItem('mega-tool-guest-user');
        if (guestLocal) {
          try {
            const guestProfile = JSON.parse(guestLocal) as UserProfile;
            
            // Validate session expiry (1 month / 30 days) for fallback local guest
            const loginTime = localStorage.getItem('mega-tool-login-time');
            const oneMonthMs = 30 * 24 * 60 * 60 * 1000;
            if (loginTime && (Date.now() - parseInt(loginTime, 10)) > oneMonthMs) {
              console.log('Guest session has expired (older than 1 month). Auto logging out...');
              localStorage.removeItem('mega-tool-login-time');
              localStorage.removeItem('mega-tool-guest-user');
              setUser(null);
              setFavorites([]);
              setLoading(false);
              return;
            } else if (!loginTime) {
              localStorage.setItem('mega-tool-login-time', Date.now().toString());
            }

            setUser(guestProfile);
            const guestFavs = localStorage.getItem(`mega-tool-favs-${guestProfile.uid}`);
            setFavorites(guestFavs ? JSON.parse(guestFavs) : []);
          } catch {
            setUser(null);
          }
        }
        setLoading(false);
      }
    };

    initFirebase();
  }, []);

  const loginWithGoogle = async () => {
    if (isFirebaseActive && authService) {
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(authService, provider);
        localStorage.setItem('mega-tool-login-time', Date.now().toString());
      } catch (error) {
        console.error('Firebase Pop-up Auth Error: ', error);
        throw error;
      }
    } else {
      // If Firebase is inactive, simulate Google sign-in beautifully
      const seedName = `GoogleUser_${Math.floor(Math.random() * 900) + 100}`;
      const mockProfile: UserProfile = {
        uid: `google_mock_${Date.now()}`,
        displayName: 'Google Member',
        email: 'member@gmail.com',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&h=256&fit=crop',
        isGuest: false,
      };
      localStorage.setItem('mega-tool-guest-user', JSON.stringify(mockProfile));
      localStorage.setItem('mega-tool-login-time', Date.now().toString());
      setUser(mockProfile);
      setFavorites([]);
    }
  };

  const loginAsGuest = (name: string) => {
    const cleanName = name.trim() || 'Guest User';
    const guestProfile: UserProfile = {
      uid: `guest_${Date.now()}`,
      displayName: cleanName,
      email: 'guest@megatool.com',
      photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${cleanName}`,
      isGuest: true,
    };
    localStorage.setItem('mega-tool-guest-user', JSON.stringify(guestProfile));
    localStorage.setItem('mega-tool-login-time', Date.now().toString());
    setUser(guestProfile);
    
    // load virtual favorites
    const savedFavs = localStorage.getItem(`mega-tool-favs-${guestProfile.uid}`);
    setFavorites(savedFavs ? JSON.parse(savedFavs) : []);
  };

  const logout = async () => {
    if (isFirebaseActive && authService) {
      try {
        await signOut(authService);
      } catch (error) {
        console.error('Signout failed:', error);
      }
    }
    // Always clear localStorage guest sessions & login time
    localStorage.removeItem('mega-tool-guest-user');
    localStorage.removeItem('mega-tool-login-time');
    setUser(null);
    setFavorites([]);
  };

  const toggleFavorite = async (toolId: string) => {
    if (!user) return;

    const isFav = favorites.includes(toolId);
    const updatedFavorites = isFav
      ? favorites.filter((id) => id !== toolId)
      : [...favorites, toolId];

    setFavorites(updatedFavorites);

    // Save favorites target
    if (isFirebaseActive && dbService && !user.isGuest) {
      try {
        const userDocRef = doc(dbService, 'users', user.uid);
        try {
          await updateDoc(userDocRef, {
            favorites: isFav ? arrayRemove(toolId) : arrayUnion(toolId),
          });
        } catch (updateErr) {
          handleFirestoreError(authService, updateErr, OperationType.UPDATE, `users/${user.uid}`);
        }
      } catch (err) {
        console.error('Error updating favorites on cloud sync:', err);
      }
    } else {
      // Local Guest storage sync
      localStorage.setItem(`mega-tool-favs-${user.uid}`, JSON.stringify(updatedFavorites));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        favorites,
        loginWithGoogle,
        loginAsGuest,
        logout,
        toggleFavorite,
        isFirebaseActive,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};
