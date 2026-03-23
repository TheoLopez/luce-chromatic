"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from "react";
import { auth, db, storage, googleProvider } from "@/lib/firebase";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL, getBytes } from "firebase/storage";

// ─── Types ───────────────────────────────────────────────────────────

interface AnalysisResult {
    season: string;
    description: string;
    gender: string;
    age: number;
    weight?: number;
    height?: number;
    glasses?: string;
    features?: string;
    bodyType: string;
    powerColors: { name: string; hex: string; usage: string }[];
    neutralColors: { name: string; hex: string; usage: string }[];
    blockedColors: { name: string; hex: string; reason: string }[];
    winningCombinations: { name: string; colors: string[] }[];
    luceScore: number;
}

interface UserContextType {
    user: User | null;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    userImage: string | null;
    setUserImage: (image: string | null) => void;
    selectedStyles: string[];
    setSelectedStyles: (styles: string[]) => void;
    analysis: AnalysisResult | null;
    setAnalysis: (analysis: AnalysisResult | null) => void;
    savedSimulations: string[];
    saveSimulation: (image: string) => Promise<void>;
    favorites: FavoriteItem[];
    toggleFavorite: (item: FavoriteItem) => Promise<void>;
    setFeedback: (itemId: string, feedback: 'like' | 'dislike') => Promise<void>;
    updateProfile: (data: Partial<AnalysisResult>) => Promise<void>;
    myClothes: ClothingItem[];
    addClothingItem: (item: Omit<ClothingItem, "id" | "timestamp" | "url"> & { imageBase64: string }) => Promise<void>;
    updateClothingItem: (itemId: string, updates: Partial<Omit<ClothingItem, "id" | "url" | "timestamp">>) => Promise<void>;
    removeClothingItem: (itemId: string) => Promise<void>;
    isLoading: boolean;
}

export interface FavoriteItem {
    id: string;
    url: string;
    occasion: string;
    timestamp: number;
    feedback?: 'like' | 'dislike';
}

export interface ClothingItem {
    id: string;
    url: string;
    category: 'superior' | 'inferior' | 'shoes' | 'accessories' | 'other';
    name: string;
    description: string;
    color: string;
    material: string;
    texture: string;
    type: string;
    timestamp: number;
}

// ─── localStorage Cache Layer ────────────────────────────────────────

const LS_KEY = "luce_user_data";
const LS_IMAGE_KEY = "luce_userImage_b64";

interface CachedUserData {
    uid: string;
    analysis: AnalysisResult | null;
    selectedStyles: string[];
    userImage: string | null;
    favorites: FavoriteItem[];
    myClothes: ClothingItem[];
    savedSimulations: string[]; // only URLs, not base64
    updatedAt: number;
}

function readCache(uid: string): CachedUserData | null {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw) as CachedUserData;
        if (data.uid !== uid) return null;
        return data;
    } catch {
        return null;
    }
}

function writeCache(data: CachedUserData) {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(data));
    } catch { /* quota exceeded — non-critical */ }
}

function clearCache() {
    try {
        localStorage.removeItem(LS_KEY);
        localStorage.removeItem(LS_IMAGE_KEY);
    } catch { /* ignore */ }
}

/** Cache user photo base64 separately (used by simulator to avoid CORS) */
function cacheImageB64(dataUrl: string) {
    try {
        localStorage.setItem(LS_IMAGE_KEY, dataUrl);
    } catch { /* quota exceeded */ }
}

// ─── Context ─────────────────────────────────────────────────────────

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userImage, setUserImage] = useState<string | null>(null);
    const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [savedSimulations, setSavedSimulations] = useState<string[]>([]);
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [myClothes, setMyClothes] = useState<ClothingItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const isMountedRef = useRef(true);
    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    // Ref to always have latest state for cache writes without stale closures
    const stateRef = useRef({ analysis, selectedStyles, userImage, favorites, myClothes, savedSimulations });
    useEffect(() => {
        stateRef.current = { analysis, selectedStyles, userImage, favorites, myClothes, savedSimulations };
    }, [analysis, selectedStyles, userImage, favorites, myClothes, savedSimulations]);

    /** Persist current state snapshot to localStorage */
    const persistToCache = useCallback((uid: string, overrides?: Partial<CachedUserData>) => {
        const s = stateRef.current;
        // Filter savedSimulations to only keep URLs (not huge base64 strings)
        const safeSims = (overrides?.savedSimulations ?? s.savedSimulations).filter(sim => !sim.startsWith("data:"));
        writeCache({
            uid,
            analysis: overrides?.analysis !== undefined ? overrides.analysis : s.analysis,
            selectedStyles: overrides?.selectedStyles ?? s.selectedStyles,
            userImage: overrides?.userImage !== undefined ? overrides.userImage : s.userImage,
            favorites: overrides?.favorites ?? s.favorites,
            myClothes: overrides?.myClothes ?? s.myClothes,
            savedSimulations: safeSims,
            updatedAt: Date.now(),
        });
    }, []);

    // Download user image from Storage URL and cache base64 in localStorage (CORS-safe)
    const refreshUserImageCache = async (imageUrl: string) => {
        if (imageUrl.startsWith("data:")) {
            cacheImageB64(imageUrl);
            return;
        }
        try {
            const imageRef = ref(storage, imageUrl.includes("/o/") ? decodeURIComponent(imageUrl.split("/o/")[1].split("?")[0]) : imageUrl);
            const bytes = await getBytes(imageRef);
            const blob = new Blob([bytes], { type: "image/jpeg" });
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === "string") cacheImageB64(reader.result);
            };
            reader.readAsDataURL(blob);
        } catch (err) {
            console.warn("[UserContext] Could not cache user image (non-critical):", err);
        }
    };

    // ─── Hydrate state from a data object (localStorage or Firestore) ────
    const hydrateState = useCallback((data: {
        analysis?: AnalysisResult | null;
        selectedStyles?: string[];
        userImage?: string | null;
        favorites?: FavoriteItem[];
        myClothes?: ClothingItem[];
        savedSimulations?: string[];
    }) => {
        if (data.analysis) setAnalysis(data.analysis);
        if (data.selectedStyles) setSelectedStyles(data.selectedStyles);
        if (data.userImage) setUserImage(data.userImage);
        if (data.favorites) setFavorites(data.favorites);
        if (data.myClothes) setMyClothes(data.myClothes);
        if (data.savedSimulations) setSavedSimulations(data.savedSimulations);
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!isMountedRef.current) return;
            setUser(currentUser);

            if (currentUser) {
                const uid = currentUser.uid;
                const docRef = doc(db, "users", uid);

                // ── 1. Try localStorage cache first (instant, no network) ──
                const cached = readCache(uid);
                if (cached) {
                    hydrateState(cached);
                    // Refresh user image b64 cache in background if we have a URL
                    if (cached.userImage) refreshUserImageCache(cached.userImage);
                    // Show UI immediately from cache
                    if (isMountedRef.current) setIsLoading(false);
                }

                // ── 2. Fetch from Firestore (background sync / first login) ──
                try {
                    const docSnap = await getDoc(docRef);
                    if (!isMountedRef.current) return;
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        // Update state with Firestore data (source of truth)
                        hydrateState({
                            analysis: data.analysis as AnalysisResult | undefined,
                            selectedStyles: data.selectedStyles,
                            userImage: data.userImage,
                            favorites: data.favorites,
                            myClothes: data.myClothes,
                            savedSimulations: data.savedSimulations,
                        });
                        // Update localStorage cache with fresh Firestore data
                        writeCache({
                            uid,
                            analysis: data.analysis ?? null,
                            selectedStyles: data.selectedStyles ?? [],
                            userImage: data.userImage ?? null,
                            favorites: data.favorites ?? [],
                            myClothes: data.myClothes ?? [],
                            savedSimulations: (data.savedSimulations ?? []).filter((s: string) => !s.startsWith("data:")),
                            updatedAt: Date.now(),
                        });
                        // Refresh image cache if URL from Firestore
                        if (data.userImage) refreshUserImageCache(data.userImage);
                    }
                } catch (error) {
                    console.error("[UserContext] Error loading user data from Firestore:", error);
                    // If we had cache, we're already showing data — no problem.
                    // If no cache, user sees empty state (will be asked to scan).
                }

                // ── 3. Update metadata (fire-and-forget) ──
                setDoc(docRef, {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    displayName: currentUser.displayName,
                    photoURL: currentUser.photoURL,
                    updatedAt: Date.now(),
                }, { merge: true }).catch((error) => {
                    console.warn("[UserContext] Non-critical metadata update failed:", error);
                });
            } else {
                // Not logged in — clear cache
                clearCache();
            }

            if (isMountedRef.current) setIsLoading(false);
        });
        return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const login = async () => {
        await signInWithPopup(auth, googleProvider);
    };

    const logout = async () => {
        clearCache();
        setAnalysis(null);
        setUserImage(null);
        setSelectedStyles([]);
        setFavorites([]);
        setMyClothes([]);
        setSavedSimulations([]);
        setUser(null);
        await signOut(auth);
    };

    // ─── Mutators: update state + localStorage + Firestore ───────────────

    const handleSetUserImage = async (image: string | null) => {
        setUserImage(image);
        if (!user || !image) return;
        // Cache base64 for simulator
        if (image.startsWith("data:")) cacheImageB64(image);
        try {
            const imageRef = ref(storage, `users/${user.uid}/original.jpg`);
            await uploadString(imageRef, image, 'data_url');
            const downloadURL = await getDownloadURL(imageRef);
            if (isMountedRef.current) {
                await setDoc(doc(db, "users", user.uid), { userImage: downloadURL, updatedAt: Date.now() }, { merge: true });
                setUserImage(downloadURL);
                persistToCache(user.uid, { userImage: downloadURL });
            }
        } catch (error) {
            console.error("[UserContext] Error uploading user image:", error);
            throw error;
        }
    };

    const handleSetAnalysis = async (newAnalysis: AnalysisResult | null) => {
        setAnalysis(newAnalysis);
        if (user) persistToCache(user.uid, { analysis: newAnalysis });
        if (!user || !newAnalysis) return;
        try {
            await setDoc(doc(db, "users", user.uid), { analysis: newAnalysis, updatedAt: Date.now() }, { merge: true });
        } catch (error) {
            console.error("[UserContext] Error saving analysis:", error);
            throw error;
        }
    };

    const handleSetSelectedStyles = async (styles: string[]) => {
        setSelectedStyles(styles);
        if (user) persistToCache(user.uid, { selectedStyles: styles });
        if (!user) return;
        try {
            await setDoc(doc(db, "users", user.uid), { selectedStyles: styles, updatedAt: Date.now() }, { merge: true });
        } catch (error) {
            console.error("[UserContext] Error saving styles:", error);
            throw error;
        }
    };

    const saveSimulation = async (image: string) => {
        const newSimulations = [...savedSimulations, image];
        setSavedSimulations(newSimulations);
        if (user) persistToCache(user.uid, { savedSimulations: newSimulations });
        if (!user) return;
        try {
            await setDoc(doc(db, "users", user.uid), { savedSimulations: newSimulations, updatedAt: Date.now() }, { merge: true });
        } catch (error) {
            console.error("[UserContext] Error saving simulation:", error);
        }
    };

    const toggleFavorite = async (item: FavoriteItem) => {
        if (!user) return;
        const exists = favorites.some(f => f.id === item.id);
        let newFavorites: FavoriteItem[];

        if (exists) {
            newFavorites = favorites.filter(f => f.id !== item.id);
        } else {
            let finalUrl = item.url;
            if (item.url.startsWith('data:image')) {
                try {
                    const storageRef = ref(storage, `users/${user.uid}/favorites/${item.id}.jpg`);
                    await uploadString(storageRef, item.url, 'data_url');
                    finalUrl = await getDownloadURL(storageRef);
                } catch (uploadError) {
                    console.error("[UserContext] Error uploading favorite image:", uploadError);
                }
            }
            newFavorites = [...favorites, { ...item, url: finalUrl }];
        }

        setFavorites(newFavorites);
        persistToCache(user.uid, { favorites: newFavorites });
        try {
            await setDoc(doc(db, "users", user.uid), { favorites: newFavorites, updatedAt: Date.now() }, { merge: true });
        } catch (error) {
            console.error("[UserContext] Error saving favorites:", error);
            setFavorites(favorites); // rollback
            persistToCache(user.uid, { favorites }); // rollback cache
            throw error;
        }
    };

    const setFeedback = async (itemId: string, feedback: 'like' | 'dislike') => {
        if (!user) return;
        const newFavorites = favorites.map(f => f.id === itemId ? { ...f, feedback } : f);
        setFavorites(newFavorites);
        persistToCache(user.uid, { favorites: newFavorites });
        try {
            await setDoc(doc(db, "users", user.uid), { favorites: newFavorites, updatedAt: Date.now() }, { merge: true });
        } catch (error) {
            console.error("[UserContext] Error saving feedback:", error);
            setFavorites(favorites);
            persistToCache(user.uid, { favorites });
            throw error;
        }
    };

    const updateProfile = async (data: Partial<AnalysisResult>) => {
        if (!user || !analysis) return;
        const newAnalysis = { ...analysis, ...data };
        setAnalysis(newAnalysis);
        persistToCache(user.uid, { analysis: newAnalysis });
        try {
            await setDoc(doc(db, "users", user.uid), { analysis: newAnalysis, updatedAt: Date.now() }, { merge: true });
        } catch (error) {
            console.error("[UserContext] Error updating profile:", error);
            setAnalysis(analysis);
            persistToCache(user.uid, { analysis });
            throw error;
        }
    };

    const addClothingItem = async (item: Omit<ClothingItem, "id" | "timestamp" | "url"> & { imageBase64: string }) => {
        if (!user) return;
        const id = crypto.randomUUID();
        const timestamp = Date.now();

        // Step 1: Upload image to Storage
        const storageRefPath = `users/${user.uid}/clothes/${id}.jpg`;
        const storageRefObj = ref(storage, storageRefPath);
        await uploadString(storageRefObj, item.imageBase64, 'data_url');
        const downloadURL = await getDownloadURL(storageRefObj);

        // Step 2: Build item and update local state + cache immediately
        const newItem: ClothingItem = {
            id, url: downloadURL, category: item.category,
            name: item.name, description: item.description,
            color: item.color, material: item.material,
            texture: item.texture, type: item.type,
            timestamp,
        };
        const newClothes = [...myClothes, newItem];
        setMyClothes(newClothes);
        persistToCache(user.uid, { myClothes: newClothes });

        // Step 3: Persist to Firestore (non-blocking for UI)
        try {
            await setDoc(doc(db, "users", user.uid), { myClothes: newClothes, updatedAt: Date.now() }, { merge: true });
        } catch (error) {
            console.warn("[UserContext] Firestore sync failed for clothing item (saved locally):", error);
            // Don't throw — item is already in Storage + local state + cache
        }
    };

    const updateClothingItem = async (itemId: string, updates: Partial<Omit<ClothingItem, "id" | "url" | "timestamp">>) => {
        if (!user) return;
        const previousClothes = myClothes;
        const newClothes = myClothes.map(c => c.id === itemId ? { ...c, ...updates } : c);
        setMyClothes(newClothes);
        persistToCache(user.uid, { myClothes: newClothes });
        try {
            await setDoc(doc(db, "users", user.uid), { myClothes: newClothes, updatedAt: Date.now() }, { merge: true });
        } catch (error) {
            console.error("[UserContext] Error updating clothing item:", error);
            setMyClothes(previousClothes);
            persistToCache(user.uid, { myClothes: previousClothes });
            throw error;
        }
    };

    const removeClothingItem = async (itemId: string) => {
        if (!user) return;
        const previousClothes = myClothes;
        const newClothes = myClothes.filter(c => c.id !== itemId);
        setMyClothes(newClothes);
        persistToCache(user.uid, { myClothes: newClothes });
        try {
            await setDoc(doc(db, "users", user.uid), { myClothes: newClothes, updatedAt: Date.now() }, { merge: true });
        } catch (error) {
            console.error("[UserContext] Error removing clothing item:", error);
            setMyClothes(previousClothes);
            persistToCache(user.uid, { myClothes: previousClothes });
            throw error;
        }
    };

    return (
        <UserContext.Provider value={{
            user, login, logout,
            userImage, setUserImage: handleSetUserImage,
            selectedStyles, setSelectedStyles: handleSetSelectedStyles,
            analysis, setAnalysis: handleSetAnalysis,
            savedSimulations, saveSimulation,
            favorites, toggleFavorite, setFeedback,
            updateProfile,
            myClothes, addClothingItem, updateClothingItem, removeClothingItem,
            isLoading,
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}
