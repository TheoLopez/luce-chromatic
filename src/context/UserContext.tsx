"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
import { auth, db, storage, googleProvider } from "@/lib/firebase";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

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
    saveSimulation: (image: string) => void;
    favorites: FavoriteItem[];
    toggleFavorite: (item: FavoriteItem) => Promise<void>;
    setFeedback: (itemId: string, feedback: 'like' | 'dislike') => Promise<void>;
    updateProfile: (data: Partial<AnalysisResult>) => Promise<void>;
    myClothes: ClothingItem[];
    addClothingItem: (item: Omit<ClothingItem, "id" | "timestamp" | "url"> & { imageBase64: string }) => Promise<void>;
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
    description: string;
    timestamp: number;
}

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

    // Prevents state updates after component unmount or mid-logout async ops
    const isMountedRef = useRef(true);
    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!isMountedRef.current) return;
            setUser(currentUser);

            if (currentUser) {
                const docRef = doc(db, "users", currentUser.uid);
                try {
                    const docSnap = await getDoc(docRef);

                    await setDoc(docRef, {
                        uid: currentUser.uid,
                        email: currentUser.email,
                        displayName: currentUser.displayName,
                        photoURL: currentUser.photoURL,
                        updatedAt: Date.now(),
                    }, { merge: true });

                    if (!isMountedRef.current) return;

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        if (data.analysis) setAnalysis(data.analysis as AnalysisResult);
                        if (data.selectedStyles) setSelectedStyles(data.selectedStyles);
                        if (data.userImage) setUserImage(data.userImage);
                        if (data.favorites) setFavorites(data.favorites);
                        if (data.myClothes) setMyClothes(data.myClothes);
                    }
                } catch (error) {
                    console.error("[UserContext] Error loading user data:", error);
                }
            }

            if (isMountedRef.current) setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = async () => {
        // Errors bubble up to callers — page.tsx shows Toast
        await signInWithPopup(auth, googleProvider);
    };

    const logout = async () => {
        // Clear local state before signOut to avoid stale reads from async onAuthStateChanged
        setAnalysis(null);
        setUserImage(null);
        setSelectedStyles([]);
        setFavorites([]);
        setMyClothes([]);
        setUser(null);
        await signOut(auth);
    };

    const handleSetUserImage = async (image: string | null) => {
        setUserImage(image);
        if (!user || !image) return;
        try {
            const imageRef = ref(storage, `users/${user.uid}/original.jpg`);
            await uploadString(imageRef, image, 'data_url');
            const downloadURL = await getDownloadURL(imageRef);
            if (isMountedRef.current) {
                await setDoc(doc(db, "users", user.uid), { userImage: downloadURL, updatedAt: Date.now() }, { merge: true });
            }
        } catch (error) {
            console.error("[UserContext] Error uploading user image:", error);
            throw error;
        }
    };

    const handleSetAnalysis = async (newAnalysis: AnalysisResult | null) => {
        setAnalysis(newAnalysis);
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
        if (!user) return;
        try {
            await setDoc(doc(db, "users", user.uid), { selectedStyles: styles, updatedAt: Date.now() }, { merge: true });
        } catch (error) {
            console.error("[UserContext] Error saving styles:", error);
            throw error;
        }
    };

    const saveSimulation = (image: string) => {
        setSavedSimulations(prev => [...prev, image]);
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
                    // Keep base64 as fallback — won't persist well but avoids losing the item
                }
            }
            newFavorites = [...favorites, { ...item, url: finalUrl }];
        }

        // Optimistic update
        setFavorites(newFavorites);
        try {
            await setDoc(doc(db, "users", user.uid), { favorites: newFavorites, updatedAt: Date.now() }, { merge: true });
        } catch (error) {
            console.error("[UserContext] Error saving favorites:", error);
            setFavorites(favorites); // rollback
            throw error;
        }
    };

    const setFeedback = async (itemId: string, feedback: 'like' | 'dislike') => {
        if (!user) return;
        const newFavorites = favorites.map(f => f.id === itemId ? { ...f, feedback } : f);
        setFavorites(newFavorites);
        try {
            await setDoc(doc(db, "users", user.uid), { favorites: newFavorites, updatedAt: Date.now() }, { merge: true });
        } catch (error) {
            console.error("[UserContext] Error saving feedback:", error);
            setFavorites(favorites); // rollback
            throw error;
        }
    };

    const updateProfile = async (data: Partial<AnalysisResult>) => {
        if (!user || !analysis) return;
        const newAnalysis = { ...analysis, ...data };
        setAnalysis(newAnalysis);
        try {
            await setDoc(doc(db, "users", user.uid), { analysis: newAnalysis, updatedAt: Date.now() }, { merge: true });
        } catch (error) {
            console.error("[UserContext] Error updating profile:", error);
            setAnalysis(analysis); // rollback
            throw error;
        }
    };

    const addClothingItem = async (item: Omit<ClothingItem, "id" | "timestamp" | "url"> & { imageBase64: string }) => {
        if (!user) return;
        const id = crypto.randomUUID();
        const timestamp = Date.now();
        try {
            const storageRef = ref(storage, `users/${user.uid}/clothes/${id}.jpg`);
            await uploadString(storageRef, item.imageBase64, 'data_url');
            const downloadURL = await getDownloadURL(storageRef);
            const newItem: ClothingItem = { id, url: downloadURL, category: item.category, description: item.description, timestamp };
            const newClothes = [...myClothes, newItem];
            setMyClothes(newClothes);
            await setDoc(doc(db, "users", user.uid), { myClothes: newClothes, updatedAt: Date.now() }, { merge: true });
        } catch (error) {
            console.error("[UserContext] Error adding clothing item:", error);
            throw error;
        }
    };

    const removeClothingItem = async (itemId: string) => {
        if (!user) return;
        const previousClothes = myClothes;
        const newClothes = myClothes.filter(c => c.id !== itemId);
        setMyClothes(newClothes);
        try {
            await setDoc(doc(db, "users", user.uid), { myClothes: newClothes, updatedAt: Date.now() }, { merge: true });
        } catch (error) {
            console.error("[UserContext] Error removing clothing item:", error);
            setMyClothes(previousClothes); // rollback
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
            myClothes, addClothingItem, removeClothingItem,
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
