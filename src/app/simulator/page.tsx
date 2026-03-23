"use client";

import { useReducer, useState, useEffect, useRef } from "react";
import { BottomNav } from "@/components/ui/BottomNav";
import { Toast } from "@/components/ui/Toast";
import { Sparkles, ArrowLeft, Heart, ThumbsUp, ThumbsDown, X, Wand2, Palette, CheckCircle } from "lucide-react";
import { useUser, FavoriteItem } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { generateOutfit } from "@/lib/gemini";
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from "framer-motion";

// Z-index hierarchy
const Z = {
    OVERLAY: "z-20",
    MODAL: "z-50",
    ZOOM: "z-[100]",
    TOAST: "z-[150]",
} as const;

type Occasion = "trabajo" | "cita" | "gala" | "casual" | "deporte" | "viaje" | "fiesta" | "boda";
type Time = "dia" | "atardecer" | "noche";
type GenerationStep = "palette" | "designing" | "finishing" | null;

const OCCASIONS: { id: Occasion; label: string; emoji: string }[] = [
    { id: "trabajo", label: "Trabajo", emoji: "💼" },
    { id: "cita", label: "Cita", emoji: "🌹" },
    { id: "gala", label: "Gala", emoji: "✨" },
    { id: "casual", label: "Casual", emoji: "☀️" },
    { id: "deporte", label: "Deporte", emoji: "🏃" },
    { id: "viaje", label: "Viaje", emoji: "✈️" },
    { id: "fiesta", label: "Fiesta", emoji: "🎉" },
    { id: "boda", label: "Boda", emoji: "💍" },
];

const TIMES: { id: Time; label: string }[] = [
    { id: "dia", label: "Día" },
    { id: "atardecer", label: "Atardecer" },
    { id: "noche", label: "Noche" },
];

const GENERATION_STEPS: { id: GenerationStep; label: string; icon: typeof Palette }[] = [
    { id: "palette", label: "Analizando tu paleta...", icon: Palette },
    { id: "designing", label: "Diseñando el outfit...", icon: Wand2 },
    { id: "finishing", label: "Finalizando detalles...", icon: CheckCircle },
];

// ─── Reducer ─────────────────────────────────────────────────────────

type SimulatorState = {
    isGenerating: boolean;
    generationStep: GenerationStep;
    generationProgress: number;
    generatedImage: string | null;
    generatedColors: { name: string; hex: string }[];
    currentFavoriteId: string | null;
    currentFeedback: 'like' | 'dislike' | null;
    toast: { message: string; type: "success" | "error" | "info" } | null;
};

type SimulatorAction =
    | { type: 'START_GENERATION' }
    | { type: 'SET_PROGRESS'; step: GenerationStep; progress: number }
    | { type: 'COMPLETE_GENERATION'; image: string; colors: { name: string; hex: string }[] }
    | { type: 'FAIL_GENERATION' }
    | { type: 'SET_FAVORITE_ID'; id: string | null }
    | { type: 'SET_FEEDBACK'; feedback: 'like' | 'dislike' }
    | { type: 'SHOW_TOAST'; message: string; toastType: "success" | "error" | "info" }
    | { type: 'CLEAR_TOAST' };

const initialState: SimulatorState = {
    isGenerating: false,
    generationStep: null,
    generationProgress: 0,
    generatedImage: null,
    generatedColors: [],
    currentFavoriteId: null,
    currentFeedback: null,
    toast: null,
};

function simulatorReducer(state: SimulatorState, action: SimulatorAction): SimulatorState {
    switch (action.type) {
        case 'START_GENERATION':
            return { ...state, isGenerating: true, generationStep: "palette", generationProgress: 0, currentFavoriteId: null, currentFeedback: null };
        case 'SET_PROGRESS':
            return { ...state, generationStep: action.step, generationProgress: action.progress };
        case 'COMPLETE_GENERATION':
            return { ...state, isGenerating: false, generationStep: null, generationProgress: 0, generatedImage: action.image, generatedColors: action.colors };
        case 'FAIL_GENERATION':
            return { ...state, isGenerating: false, generationStep: null, generationProgress: 0 };
        case 'SET_FAVORITE_ID':
            return { ...state, currentFavoriteId: action.id };
        case 'SET_FEEDBACK':
            return { ...state, currentFeedback: action.feedback };
        case 'SHOW_TOAST':
            return { ...state, toast: { message: action.message, type: action.toastType } };
        case 'CLEAR_TOAST':
            return { ...state, toast: null };
        default:
            return state;
    }
}

// ─── Component ────────────────────────────────────────────────────────

export default function Simulator() {
    const { userImage, analysis, saveSimulation, toggleFavorite, favorites, isLoading, setFeedback, myClothes } = useUser();
    const router = useRouter();

    // Redirect to camera if no user image after loading completes
    useEffect(() => {
        if (!isLoading && !userImage) {
            router.replace("/camera");
        }
    }, [isLoading, userImage, router]);
    const [state, dispatch] = useReducer(simulatorReducer, initialState);
    const { isGenerating, generationStep, generationProgress, generatedImage, generatedColors, currentFavoriteId, currentFeedback, toast } = state;

    // Simple UI state — no need for reducer
    const [occasion, setOccasion] = useState<Occasion>("trabajo");
    const [time, setTime] = useState<Time>("dia");
    const [selectedClothes, setSelectedClothes] = useState<string[]>([]);
    const [showClothesModal, setShowClothesModal] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const [isSavingFavorite, setIsSavingFavorite] = useState(false);
    const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

    const showNotification = (message: string, toastType: "success" | "error" | "info" = "info") => {
        dispatch({ type: 'SHOW_TOAST', message, toastType });
    };

    const startProgressSimulation = () => {
        let elapsed = 0;
        const totalTime = 30000;
        progressTimerRef.current = setInterval(() => {
            elapsed += 300;
            const raw = Math.min(elapsed / totalTime, 0.95);
            const step: GenerationStep = raw < 0.35 ? "palette" : raw < 0.75 ? "designing" : "finishing";
            dispatch({ type: 'SET_PROGRESS', step, progress: raw * 100 });
        }, 300);
    };

    const stopProgressSimulation = (success: boolean, image?: string, colors?: { name: string; hex: string }[]) => {
        if (progressTimerRef.current) {
            clearInterval(progressTimerRef.current);
            progressTimerRef.current = null;
        }
        if (success && image && colors) {
            dispatch({ type: 'COMPLETE_GENERATION', image, colors });
        } else {
            dispatch({ type: 'FAIL_GENERATION' });
        }
    };

    const handleFeedback = async (type: 'like' | 'dislike') => {
        if (!generatedImage || isSavingFavorite) return;
        dispatch({ type: 'SET_FEEDBACK', feedback: type });

        try {
            if (type === 'like') {
                if (!currentFavoriteId) {
                    setIsSavingFavorite(true);
                    const id = uuidv4();
                    const item: FavoriteItem = { id, url: generatedImage, occasion, timestamp: Date.now() };
                    await toggleFavorite(item);
                    dispatch({ type: 'SET_FAVORITE_ID', id });
                    await setFeedback(id, type);
                    setIsSavingFavorite(false);
                } else {
                    await setFeedback(currentFavoriteId, type);
                }
                showNotification("¡Guardado en favoritos!", "success");
            } else {
                if (currentFavoriteId) await setFeedback(currentFavoriteId, type);
                showNotification("Gracias por tu opinión", "info");
            }
        } catch (error) {
            console.error("Error saving feedback:", error);
            setIsSavingFavorite(false);
            showNotification("Error al guardar. Intenta de nuevo.", "error");
        }
    };

    const handleGenerate = async () => {
        if (!analysis || !userImage) return;
        dispatch({ type: 'START_GENERATION' });
        startProgressSimulation();
        try {
            const selectedItems = myClothes.filter(c => selectedClothes.includes(c.id));
            const { image, colors } = await generateOutfit(
                analysis as unknown as Record<string, unknown>,
                occasion, time, selectedItems, userImage
            );
            stopProgressSimulation(true, image, colors);
            saveSimulation(image);
        } catch (error) {
            stopProgressSimulation(false);
            const msg = error instanceof Error ? error.message : "Error al generar el outfit. Intenta de nuevo.";
            showNotification(msg, "error");
        }
    };

    const handleToggleFavorite = async () => {
        const imageToSave = generatedImage || userImage;
        if (!imageToSave || isSavingFavorite) return;

        setIsSavingFavorite(true);
        try {
            if (currentFavoriteId) {
                const itemToRemove = favorites.find(f => f.id === currentFavoriteId);
                if (itemToRemove) {
                    await toggleFavorite(itemToRemove);
                    dispatch({ type: 'SET_FAVORITE_ID', id: null });
                    showNotification("Eliminado de favoritos");
                }
                return;
            }

            const id = uuidv4();
            const item: FavoriteItem = { id, url: imageToSave, occasion, timestamp: Date.now() };
            await toggleFavorite(item);
            dispatch({ type: 'SET_FAVORITE_ID', id });
            showNotification("¡Guardado en favoritos!", "success");
        } catch (error) {
            console.error("Error toggling favorite:", error);
            showNotification("Error al guardar favorito. Intenta de nuevo.", "error");
        } finally {
            setIsSavingFavorite(false);
        }
    };

    useEffect(() => {
        if (!generatedImage && userImage) {
            const fav = favorites.find(f => f.url === userImage);
            if (fav) dispatch({ type: 'SET_FAVORITE_ID', id: fav.id });
        }
    }, [userImage, generatedImage, favorites]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setIsZoomed(false); };
        if (isZoomed) document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [isZoomed]);

    const isFavorite = !!currentFavoriteId;
    const displayImage = generatedImage || userImage;
    const displayColors = generatedImage && generatedColors.length > 0
        ? generatedColors
        : (analysis?.powerColors.slice(0, 4) || []);

    const toggleClothingItem = (id: string) => {
        setSelectedClothes(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    // While loading or about to redirect (no image)
    if (isLoading || !userImage) {
        return (
            <main className="h-screen bg-black text-white flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
            </main>
        );
    }

    return (
        <main className="h-screen bg-black text-white flex flex-col overflow-hidden relative">
            {/* Toast */}
            {toast && (
                <Toast message={toast.message} isVisible type={toast.type} onClose={() => dispatch({ type: 'CLEAR_TOAST' })} />
            )}

            {/* Zoom Modal */}
            <AnimatePresence>
                {isZoomed && displayImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`fixed inset-0 ${Z.ZOOM} bg-black flex items-center justify-center`}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Imagen en pantalla completa"
                    >
                        <button
                            aria-label="Cerrar vista ampliada"
                            onClick={() => setIsZoomed(false)}
                            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <ZoomableImage src={displayImage} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Clothes Selection Modal */}
            <AnimatePresence>
                {showClothesModal && (
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        className={`absolute inset-0 ${Z.MODAL} bg-black/95 backdrop-blur-xl p-6 flex flex-col`}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Seleccionar prendas"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold">Selecciona tus prendas</h2>
                            <button
                                aria-label="Cerrar selección de prendas"
                                onClick={() => setShowClothesModal(false)}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-4 pb-20">
                            {myClothes.length === 0 ? (
                                <div className="col-span-2 text-center py-10 text-gray-500">
                                    <p>No tienes ropa guardada.</p>
                                    <Link href="/my-clothes" className="text-white underline mt-2 block">Ir a Mi Ropa</Link>
                                </div>
                            ) : (
                                myClothes.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => toggleClothingItem(item.id)}
                                        aria-pressed={selectedClothes.includes(item.id)}
                                        aria-label={item.description}
                                        className={cn(
                                            "relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all",
                                            selectedClothes.includes(item.id) ? "border-white scale-95" : "border-transparent opacity-70"
                                        )}
                                    >
                                        <img src={item.url} alt={item.description} className="w-full h-full object-cover" />
                                        {selectedClothes.includes(item.id) && (
                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center">
                                                    <Sparkles className="w-4 h-4" />
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>

                        <button
                            onClick={() => setShowClothesModal(false)}
                            className="w-full bg-white text-black py-4 rounded-full font-bold mt-4"
                        >
                            LISTO ({selectedClothes.length})
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Generation Progress Screen */}
            <AnimatePresence>
                {isGenerating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`absolute inset-0 ${Z.MODAL} bg-black/90 backdrop-blur-lg flex flex-col items-center justify-center gap-8 px-8`}
                        aria-live="polite"
                        aria-label="Generando outfit"
                    >
                        {/* Animated gradient orb */}
                        <div className="relative w-32 h-32">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 opacity-80 animate-pulse blur-md" />
                            <div className="absolute inset-2 rounded-full bg-black flex items-center justify-center">
                                <Sparkles className="w-10 h-10 text-white animate-pulse" />
                            </div>
                        </div>

                        {/* Step labels */}
                        <div className="space-y-3 w-full max-w-xs">
                            {GENERATION_STEPS.map((step) => {
                                const stepIndex = GENERATION_STEPS.findIndex(s => s.id === generationStep);
                                const thisIndex = GENERATION_STEPS.findIndex(s => s.id === step.id);
                                const isActive = step.id === generationStep;
                                const isDone = thisIndex < stepIndex;

                                return (
                                    <div
                                        key={step.id}
                                        className={cn(
                                            "flex items-center gap-3 text-sm transition-all duration-300",
                                            isActive ? "text-white opacity-100" : isDone ? "text-emerald-400 opacity-80" : "text-gray-600 opacity-40"
                                        )}
                                    >
                                        <step.icon className={cn("w-4 h-4 shrink-0", isActive && "animate-pulse")} />
                                        <span className={cn("font-medium", isActive && "font-bold")}>{step.label}</span>
                                        {isDone && <CheckCircle className="w-3 h-3 text-emerald-400 ml-auto" />}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Progress bar */}
                        <div className="w-full max-w-xs space-y-2">
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                    animate={{ width: `${generationProgress}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 text-center">
                                {OCCASIONS.find(o => o.id === occasion)?.emoji} Creando look para {OCCASIONS.find(o => o.id === occasion)?.label.toLowerCase()}...
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className={`px-4 py-3 flex justify-between items-center bg-black/50 backdrop-blur-md ${Z.OVERLAY} absolute top-0 left-0 right-0`}>
                <Link href="/dashboard">
                    <button aria-label="Volver al inicio" className="w-8 h-8 rounded-full bg-zinc-900/80 flex items-center justify-center text-white">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                </Link>
                <h1 className="text-xs font-bold tracking-widest uppercase">Espejo IA</h1>
                {generatedImage ? (
                    <button
                        aria-label={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
                        aria-pressed={isFavorite}
                        onClick={handleToggleFavorite}
                        disabled={isSavingFavorite}
                        className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                            isSavingFavorite && "animate-pulse opacity-70",
                            isFavorite ? "bg-red-500 text-white" : "bg-zinc-900/80 text-white"
                        )}
                    >
                        <Heart className={cn("w-4 h-4", isFavorite && "fill-white")} />
                    </button>
                ) : (
                    <div className="w-8 h-8" />
                )}
            </header>

            {/* Main Image Area */}
            <div className="flex-1 relative w-full h-full">
                <button
                    className="absolute inset-0 cursor-zoom-in"
                    onClick={() => setIsZoomed(true)}
                    aria-label="Ampliar imagen"
                >
                    <motion.img
                        layoutId="main-simulation-image"
                        src={displayImage!}
                        alt={generatedImage ? `Outfit generado para ${occasion}` : "Tu foto de referencia"}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
                </button>

                {/* Color palette overlay */}
                {displayColors.length > 0 && (
                    <div className={`absolute top-20 right-4 flex flex-col gap-2 ${Z.OVERLAY} pointer-events-none`}>
                        {displayColors.map((color, index) => (
                            <div
                                key={index}
                                className="w-6 h-6 rounded-full border border-white/20 shadow-lg backdrop-blur-sm"
                                style={{ backgroundColor: color.hex }}
                                title={color.name}
                                aria-label={color.name}
                            />
                        ))}
                    </div>
                )}

                {/* Controls */}
                <div className={`absolute bottom-0 left-0 right-0 p-4 pb-24 space-y-4 ${Z.OVERLAY} pointer-events-none`}>
                    <div className="pointer-events-auto space-y-4">

                        {/* My Clothes */}
                        <div className="space-y-1">
                            <div className="flex justify-between items-center px-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mis Prendas</p>
                                <button
                                    onClick={() => setShowClothesModal(true)}
                                    className="text-[10px] font-bold text-white underline"
                                >
                                    {selectedClothes.length > 0 ? 'Editar' : 'Seleccionar'}
                                </button>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                <button
                                    onClick={() => setShowClothesModal(true)}
                                    aria-label="Seleccionar prendas"
                                    className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 hover:bg-white/20 transition-colors"
                                >
                                    <Sparkles className="w-5 h-5 text-white/50" />
                                </button>
                                {selectedClothes.map(id => {
                                    const item = myClothes.find(c => c.id === id);
                                    if (!item) return null;
                                    return (
                                        <div key={id} className="w-12 h-12 rounded-xl overflow-hidden border border-white/50 flex-shrink-0 relative">
                                            <img src={item.url} alt={item.description} className="w-full h-full object-cover" />
                                            <button
                                                aria-label={`Quitar ${item.description}`}
                                                onClick={(e) => { e.stopPropagation(); toggleClothingItem(id); }}
                                                className="absolute top-0 right-0 bg-black/50 p-0.5 rounded-bl-md"
                                            >
                                                <X className="w-3 h-3 text-white" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Occasions */}
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Ocasión</p>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" role="group" aria-label="Seleccionar ocasión">
                                {OCCASIONS.map((occ) => (
                                    <button
                                        key={occ.id}
                                        onClick={() => setOccasion(occ.id)}
                                        aria-pressed={occasion === occ.id}
                                        className={cn(
                                            "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border",
                                            occasion === occ.id
                                                ? "bg-white text-black border-white"
                                                : "bg-black/40 text-white border-white/20 backdrop-blur-sm"
                                        )}
                                    >
                                        {occ.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Time */}
                        <div className="flex justify-between items-center bg-zinc-900/80 backdrop-blur-md rounded-full p-1 border border-white/10" role="group" aria-label="Seleccionar momento del día">
                            {TIMES.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTime(t.id)}
                                    aria-pressed={time === t.id}
                                    className={cn(
                                        "flex-1 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all",
                                        time === t.id ? "bg-white text-black shadow-lg" : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Feedback & Generate */}
                        <div className="flex gap-3 items-center">
                            {generatedImage && (
                                <div className="flex gap-2 bg-zinc-900/80 backdrop-blur-md rounded-full p-1 border border-white/10">
                                    <button
                                        aria-label="No me gusta"
                                        aria-pressed={currentFeedback === 'dislike'}
                                        onClick={() => handleFeedback('dislike')}
                                        className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                            currentFeedback === 'dislike' ? "bg-red-500/20 text-red-500" : "text-gray-400 hover:text-white"
                                        )}
                                    >
                                        <ThumbsDown className="w-4 h-4" />
                                    </button>
                                    <button
                                        aria-label="Me gusta"
                                        aria-pressed={currentFeedback === 'like'}
                                        onClick={() => handleFeedback('like')}
                                        className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                            currentFeedback === 'like' ? "bg-green-500/20 text-green-500" : "text-gray-400 hover:text-white"
                                        )}
                                    >
                                        <ThumbsUp className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                aria-busy={isGenerating}
                                className="flex-1 bg-white text-black h-10 rounded-full font-bold text-sm tracking-wide hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 shadow-xl disabled:opacity-70"
                            >
                                <Sparkles className="w-4 h-4" />
                                {isGenerating ? "GENERANDO..." : "GENERAR"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <BottomNav />
        </main>
    );
}

function ZoomableImage({ src }: { src: string }) {
    const [scale, setScale] = useState(1);
    const constraintsRef = useRef(null);

    return (
        <>
            <motion.div ref={constraintsRef} className="w-full h-full flex items-center justify-center overflow-hidden">
                <motion.img
                    src={src}
                    alt="Imagen ampliada del outfit"
                    className="max-w-none max-h-none object-contain"
                    style={{ width: '100%', height: '100%', cursor: scale > 1 ? 'grab' : 'default' }}
                    drag={scale > 1}
                    dragConstraints={constraintsRef}
                    dragElastic={0.1}
                    animate={{ scale }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            </motion.div>

            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/50 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 z-50" onClick={(e) => e.stopPropagation()}>
                <button aria-label="Alejar" onClick={() => setScale(Math.max(1, scale - 0.5))} className="text-white hover:text-gray-300">-</button>
                <input
                    type="range" min="1" max="4" step="0.1" value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    aria-label="Nivel de zoom"
                    className="w-32 accent-white h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
                <button aria-label="Acercar" onClick={() => setScale(Math.min(4, scale + 0.5))} className="text-white hover:text-gray-300">+</button>
            </div>
        </>
    );
}
