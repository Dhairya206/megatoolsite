import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../components/AuthContext';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy, 
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';

export interface ToolHistoryItem {
  id: string;
  toolId: string;
  toolName: string;
  timestamp: string; // ISO String
  status: 'success' | 'failed';
  details: string; // e.g. "Compressed image 1.5MB to 820KB"
  fileDetails?: {
    inputName?: string;
    inputSize?: number;
    outputSize?: number;
    format?: string;
  };
}

export const useToolHistory = () => {
  const { user, isFirebaseActive } = useAuth();
  const [history, setHistory] = useState<ToolHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Local Storage key format
  const getGuestLocalStorageKey = useCallback(() => 'megatool-guest-history', []);

  /**
   * Fetch history logs based on active authentication state.
   */
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      if (isFirebaseActive && user && !user.isGuest) {
        // Logged in with Firebase: Load from users/{uid}/history collection
        const db = getFirestore();
        const historyRef = collection(db, 'users', user.uid, 'history');
        const q = query(historyRef, orderBy('createdAt', 'desc'));
        
        const querySnapshot = await getDocs(q);
        const fbHistory: ToolHistoryItem[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fbHistory.push({
            id: docSnap.id,
            toolId: data.toolId || '',
            toolName: data.toolName || '',
            timestamp: data.timestamp || new Date().toISOString(),
            status: data.status || 'success',
            details: data.details || '',
            fileDetails: data.fileDetails || undefined,
          });
        });
        setHistory(fbHistory);
      } else {
        // Guest mode: load from localStorage
        const stored = localStorage.getItem(getGuestLocalStorageKey());
        if (stored) {
          setHistory(JSON.parse(stored) as ToolHistoryItem[]);
        } else {
          setHistory([]);
        }
      }
    } catch (err) {
      console.error('Error fetching tool history logs:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isFirebaseActive, getGuestLocalStorageKey]);

  // Initial fetch on mount / auth context swap
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  /**
   * Add a new item to the history record.
   */
  const addToHistory = useCallback(async (
    toolId: string,
    toolName: string,
    status: 'success' | 'failed',
    details: string,
    fileDetails?: ToolHistoryItem['fileDetails']
  ) => {
    const newItem: Omit<ToolHistoryItem, 'id'> = {
      toolId,
      toolName,
      timestamp: new Date().toISOString(),
      status,
      details,
      fileDetails,
    };

    try {
      if (isFirebaseActive && user && !user.isGuest) {
        // Authenticated write to Firebase Firestore
        const db = getFirestore();
        const historyRef = collection(db, 'users', user.uid, 'history');
        const docRef = await addDoc(historyRef, {
          ...newItem,
          createdAt: serverTimestamp(), // Secure server timestamp for sorting
        });

        const loggedItem: ToolHistoryItem = {
          ...newItem,
          id: docRef.id,
        };

        setHistory((prev) => [loggedItem, ...prev]);
      } else {
        // Anonymous/Guest write to Browser local persistence
        const guestKey = getGuestLocalStorageKey();
        const itemWithId: ToolHistoryItem = {
          ...newItem,
          id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        };

        const currentGuestHistory = localStorage.getItem(guestKey);
        let updatedHistory: ToolHistoryItem[] = [];

        if (currentGuestHistory) {
          updatedHistory = JSON.parse(currentGuestHistory) as ToolHistoryItem[];
        }

        updatedHistory = [itemWithId, ...updatedHistory];
        
        // Prevent unbounded localStorage bloat - keep up to 100 history items locally
        if (updatedHistory.length > 100) {
          updatedHistory = updatedHistory.slice(0, 100);
        }

        localStorage.setItem(guestKey, JSON.stringify(updatedHistory));
        setHistory(updatedHistory);
      }
    } catch (err) {
      console.error('Error adding tool execution log to history:', err);
    }
  }, [user, isFirebaseActive, getGuestLocalStorageKey]);

  /**
   * Migrate guest history records to the cloud database upon login.
   */
  const migrateGuestHistory = useCallback(async (targetUid: string) => {
    if (!isFirebaseActive) return;

    const guestKey = getGuestLocalStorageKey();
    const guestData = localStorage.getItem(guestKey);
    if (!guestData) return;

    try {
      const guestItems = JSON.parse(guestData) as ToolHistoryItem[];
      if (guestItems.length === 0) return;

      console.log(`Migrating ${guestItems.length} guest logs to cloud database for User ID: ${targetUid}...`);
      
      const db = getFirestore();
      const userHistoryRef = collection(db, 'users', targetUid, 'history');
      
      // Use Firestore WriteBatch to write up to 500 documents atomically
      const batch = writeBatch(db);
      
      // Select the last 25 elements to avoid exceeding Firestore batch quota or limits (500 docs) in one go
      const itemsToMigrate = guestItems.slice(0, 100);

      itemsToMigrate.forEach((item) => {
        const itemDocRef = doc(userHistoryRef);
        batch.set(itemDocRef, {
          toolId: item.toolId,
          toolName: item.toolName,
          timestamp: item.timestamp,
          status: item.status,
          details: item.details,
          fileDetails: item.fileDetails || null,
          createdAt: serverTimestamp(),
        });
      });

      await batch.commit();
      
      // Clean up localStorage guest logs after successful migration
      localStorage.removeItem(guestKey);
      console.log('Guest history migration completed successfully.');
      
      // Reload history to visual state
      await fetchHistory();
    } catch (err) {
      console.error('Error migrating guest history state to Firestore:', err);
    }
  }, [isFirebaseActive, getGuestLocalStorageKey, fetchHistory]);

  /**
   * Clear all records in history depending on active session.
   */
  const clearHistory = useCallback(async () => {
    try {
      if (isFirebaseActive && user && !user.isGuest) {
        const db = getFirestore();
        const historyRef = collection(db, 'users', user.uid, 'history');
        const querySnapshot = await getDocs(historyRef);

        const batch = writeBatch(db);
        querySnapshot.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        
        await batch.commit();
        setHistory([]);
      } else {
        localStorage.removeItem(getGuestLocalStorageKey());
        setHistory([]);
      }
    } catch (err) {
      console.error('Error wiping history records:', err);
    }
  }, [user, isFirebaseActive, getGuestLocalStorageKey]);

  return {
    history,
    loading,
    addToHistory,
    clearHistory,
    migrateGuestHistory,
    refreshHistory: fetchHistory,
  };
};
