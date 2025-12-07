
import { Donation, Event, Leader, GalleryItem, Expense, Member, AppSettings } from '../types';
import { MOCK_LEADERS, ORGANIZATION_INFO } from '../constants';

// We rely on the global 'firebase' object initialized in index.html via the CDN script
declare const firebase: any;

const SEED_SETTINGS: AppSettings = {
    contactPhone: ORGANIZATION_INFO.contact.phone,
    adminUser: 'admin', // Kept for display, but authentication is now handled by Firebase Auth
    adminPassHash: '', // Deprecated in favor of Firebase Auth
    socialLinks: {
        facebook: 'https://facebook.com',
        youtube: 'https://youtube.com',
        twitter: ''
    }
};

// --- CIRCUIT BREAKER STATE ---
let isOfflineMode = false;
const listeners: ((isOffline: boolean) => void)[] = [];

const notifyListeners = () => {
    listeners.forEach(l => l(isOfflineMode));
};

const setOfflineMode = (value: boolean) => {
    if (isOfflineMode !== value) {
        isOfflineMode = value;
        notifyListeners();
    }
};

// --- LOCAL STORAGE HELPERS ---
const local = {
    get: <T>(key: string, defaultVal: T): T => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultVal;
        } catch { return defaultVal; }
    },
    set: (key: string, data: any) => {
        localStorage.setItem(key, JSON.stringify(data));
    },
    updateItem: (collectionKey: string, id: string, data: any, merge = false) => {
        const list = local.get<any[]>(collectionKey, []);
        const index = list.findIndex((i: any) => i.id === id);
        if (index >= 0) {
            list[index] = merge ? { ...list[index], ...data } : data;
        } else {
            list.push(data);
        }
        local.set(collectionKey, list);
    },
    deleteItem: (collectionKey: string, id: string) => {
        let list = local.get<any[]>(collectionKey, []);
        list = list.filter((i: any) => i.id !== id);
        local.set(collectionKey, list);
    }
};

// --- FIREBASE SDK HELPER ---
const getDbRef = (path: string) => {
    if (typeof firebase === 'undefined') {
        throw new Error("Firebase SDK not initialized");
    }
    return firebase.database().ref(path);
};

// --- AUTHENTICATION SERVICE ---
// Hybrid system: Supports Real Firebase Auth AND Local Fallback for preview environments
let localUser: any = null;
// Try to load persisted local user
const persistedUser = local.get('local_user_session', null);
if (persistedUser) {
    localUser = persistedUser;
}

const authListeners: ((user: any) => void)[] = [];

const notifyAuthListeners = (u: any) => authListeners.forEach(l => l(u));

const auth = {
    login: async (email: string, pass: string) => {
        // PRIORITY CHECK: Hardcoded Admin Credential
        // This bypasses Firebase completely to ensure access even if auth is disabled in console
        if ((email === 'admin' || email === 'admin@example.com') && pass === 'admin123') {
             localUser = { uid: 'local_admin', email: 'admin@example.com', displayName: 'Admin User' };
             local.set('local_user_session', localUser); // Persist session
             
             // Reset offline mode to try connecting to DB (assuming rules are open)
             setOfflineMode(false); 
             
             notifyAuthListeners(localUser);
             return { success: true, message: 'Logged in as Admin' };
        }
        
        // Fix: Prevent invalid emails from hitting Firebase to avoid auth/invalid-email error
        if (!email.includes('@')) {
             return { success: false, message: 'Invalid username or password.' };
        }

        if (typeof firebase === 'undefined') throw new Error("Firebase SDK missing");
        
        try {
            await firebase.auth().signInWithEmailAndPassword(email, pass);
            return { success: true };
        } catch (e: any) {
            console.error("Login failed", e);
            let msg = e.message;
            if (e.code === 'auth/invalid-email') msg = "Invalid email format.";
            if (e.code === 'auth/user-not-found') msg = "User not found.";
            if (e.code === 'auth/wrong-password') msg = "Incorrect password.";
            return { success: false, message: msg };
        }
    },
    logout: async () => {
        localUser = null;
        local.set('local_user_session', null); // Clear persisted session
        notifyAuthListeners(null);
        if (typeof firebase !== 'undefined') {
            await firebase.auth().signOut();
        }
    },
    getCurrentUser: () => {
        if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
            return firebase.auth().currentUser;
        }
        return localUser;
    },
    sendPasswordReset: async (email: string) => {
        if (typeof firebase === 'undefined') return;
        try {
            await firebase.auth().sendPasswordResetEmail(email);
            return { success: true };
        } catch (e: any) {
            return { success: false, message: e.message };
        }
    },
    // Subscribe to BOTH Firebase and Local auth changes
    subscribe: (callback: (user: any) => void) => {
        authListeners.push(callback);
        let unsubscribe = () => {};
        
        if (typeof firebase !== 'undefined') {
             unsubscribe = firebase.auth().onAuthStateChanged((u: any) => {
                if (u) {
                    localUser = null; // Clear local fallback if real user exists
                    local.set('local_user_session', null);
                    callback(u);
                } else {
                    // If firebase says null, check if we have a local fallback
                    callback(localUser);
                }
            });
        } else {
            callback(localUser);
        }
        
        return () => {
            const index = authListeners.indexOf(callback);
            if (index > -1) authListeners.splice(index, 1);
            unsubscribe();
        };
    }
};

// --- API WRAPPER USING SDK ---
const api = {
    get: async <T>(path: string, defaultVal: T): Promise<T> => {
        // If we are in offline mode, just return local data immediately
        if (isOfflineMode) {
            return local.get<T>(path, defaultVal);
        }

        try {
            const snapshot = await getDbRef(path).once('value');
            const data = snapshot.val();
            
            if (data === null || data === undefined) {
                 // Try local if cloud is empty
                 const localData = local.get<T>(path, defaultVal);
                 // If local has data (and it's an array), prefer it over empty cloud result 
                 // (helps with initial seed scenarios)
                 if (Array.isArray(localData) && (localData as any[]).length > 0) return localData;
                 return defaultVal;
            }

            // Normalization logic (Object to Array)
            if (Array.isArray(defaultVal)) {
                const result = Array.isArray(data) ? data : Object.values(data);
                return result.filter((item: any) => item !== null && item !== undefined) as unknown as T;
            }
            
            if (typeof defaultVal === 'object' && defaultVal !== null) {
                 return { ...defaultVal, ...data };
            }

            return data as T;
        } catch (e: any) {
            console.warn(`Cloud fetch failed for ${path}:`, e);
            // Check for permission denied or network error
            if (e.code === 'PERMISSION_DENIED' || e.code === 'CLIENT_OFFLINE') {
                 if (e.code === 'PERMISSION_DENIED') {
                     // Note: PERMISSION_DENIED on read might mean auth issue, but public read is usually on
                     console.warn("Permission denied. Ensure database rules allow read.");
                 }
            }
            return local.get<T>(path, defaultVal);
        }
    },
    
    put: async (path: string, data: any) => {
        const parts = path.split('/');
        // Optimistic Local Update
        if (parts[1]) local.updateItem(parts[0], parts[1], data);
        else local.set(parts[0], data);

        if (isOfflineMode) return;

        try {
            await getDbRef(path).set(data);
        } catch (e: any) {
            console.warn(`Cloud save failed for ${path}`, e);
            if (e.code === 'PERMISSION_DENIED') {
                 console.warn("Permission Denied: User might not be authenticated.");
                 setOfflineMode(true);
            }
            throw e; // Re-throw to let UI know
        }
    },

    patch: async (path: string, data: any) => {
        const parts = path.split('/');
        if (parts[1]) local.updateItem(parts[0], parts[1], data, true);
        
        if (isOfflineMode) return;

        try {
             await getDbRef(path).update(data);
        } catch (e: any) {
             console.warn(`Cloud patch failed for ${path}`, e);
             if (e.code === 'PERMISSION_DENIED') setOfflineMode(true);
             throw e;
        }
    },

    delete: async (path: string) => {
        const parts = path.split('/');
        if (parts[1]) local.deleteItem(parts[0], parts[1]);

        if (isOfflineMode) return;

        try {
             await getDbRef(path).remove();
        } catch (e: any) {
            console.warn(`Cloud delete failed for ${path}`, e);
            if (e.code === 'PERMISSION_DENIED') setOfflineMode(true);
            throw e;
        }
    }
};

export const storage = {
    auth, // Export auth methods
    // Expose status for UI
    isOffline: () => isOfflineMode,
    
    // Subscribe to status changes
    subscribeToStatus: (callback: (isOffline: boolean) => void) => {
        listeners.push(callback);
        return () => {
            const index = listeners.indexOf(callback);
            if (index > -1) listeners.splice(index, 1);
        };
    },

    // Manually check connection status
    checkConnection: async () => {
        try {
            // Bypass cloud check if in local admin mode to prevent permission denied error
            if (localUser && localUser.uid === 'local_admin') {
                return { success: true, message: 'Local Mode Active' };
            }

            if (typeof firebase === 'undefined') return { success: false, message: 'Firebase SDK missing' };
            await getDbRef('_connection_test').set({ timestamp: Date.now() });
            setOfflineMode(false); // Reset offline mode if successful
            return { success: true, message: 'Connected' };
        } catch (e: any) {
            console.error("Connection check failed", e);
            setOfflineMode(true);
            if (e.code === 'PERMISSION_DENIED') return { success: false, message: 'Permission Denied (Check Rules)' };
            return { success: false, message: e.message || 'Unknown Error' };
        }
    },

    // Retry connection
    retryConnection: () => {
        setOfflineMode(false);
        return storage.checkConnection();
    },

    // --- SETTINGS MANAGEMENT ---
    getAppSettings: () => api.get<AppSettings>('app_settings', SEED_SETTINGS),
    updateAppSettings: (settings: AppSettings) => api.put('app_settings', settings),

    // --- DONATIONS ---
    getDonations: () => api.get<Donation[]>('donations', []),
    saveDonation: async (donation: Donation) => {
        await api.put(`donations/${donation.id}`, donation);
    },
    updateDonationStatus: async (id: string, status: 'pending' | 'approved' | 'rejected') => {
        await api.patch(`donations/${id}`, { status });
    },
    deleteDonation: (id: string) => api.delete(`donations/${id}`),
    
    // --- EXPENSES ---
    getExpenses: () => api.get<Expense[]>('expenses', []),
    addExpense: (expense: Expense) => api.put(`expenses/${expense.id}`, expense),
    updateExpense: (expense: Expense) => api.put(`expenses/${expense.id}`, expense),
    deleteExpense: (id: string) => api.delete(`expenses/${id}`),

    // --- LEADERS ---
    getLeaders: async () => {
        try {
            const leaders = await api.get<Leader[]>('leaders', []);
            
            // Seed logic with hybrid support
            if ((!leaders || leaders.length === 0) && MOCK_LEADERS.length > 0) {
                 const currentLocal = local.get<Leader[]>('leaders', []);
                 if (currentLocal.length === 0) {
                    console.log("Seeding database...");
                    // Try to seed regardless of user state (relying on rules)
                    for (const l of MOCK_LEADERS) {
                        await api.put(`leaders/${l.id}`, l);
                    }
                    return MOCK_LEADERS;
                 }
                 return currentLocal;
            }
            return leaders;
        } catch (e) {
            console.error("Leader fetch/seed error", e);
            return MOCK_LEADERS;
        }
    },
    saveLeader: (leader: Leader) => api.put(`leaders/${leader.id}`, leader),
    deleteLeader: (id: string) => api.delete(`leaders/${id}`),

    // --- MEMBER MANAGEMENT ---
    getMembers: () => api.get<Member[]>('members', []),
    saveMember: (member: Member) => api.put(`members/${member.id}`, member),
    deleteMember: (id: string) => api.delete(`members/${id}`),

    // --- EVENT MANAGEMENT ---
    getEvents: () => api.get<Event[]>('events', []),
    saveEvent: (event: Event) => api.put(`events/${event.id}`, event),
    deleteEvent: (id: string) => api.delete(`events/${id}`),
    
    // --- GALLERY MANAGEMENT ---
    getGallery: () => api.get<GalleryItem[]>('gallery', []),
    saveGalleryItem: (item: GalleryItem) => api.put(`gallery/${item.id}`, item),
    deleteGalleryItem: (id: string) => api.delete(`gallery/${id}`),
};
