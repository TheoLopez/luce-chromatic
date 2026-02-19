"use client";

import { useState, useEffect, useRef } from "react";
import { BottomNav } from "@/components/ui/BottomNav";
import { Sparkles, ArrowLeft, Download, Share2, RefreshCw, Star, ThumbsUp, ThumbsDown, X } from "lucide-react";
import { useUser, FavoriteItem } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { generateOutfit } from "@/lib/gemini";
import { v4 as uuidv4 } from 'uuid';
import { motion } from "framer-motion";

type Occasion = "trabajo" | "cita" | "gala" | "casual" | "deporte" | "viaje" | "fiesta" | "boda";
type Time = "dia" | "atardecer" | "noche";

export default function Simulator() {
    const { userImage, analysis, saveSimulation, toggleFavorite, favorites, isLoading, setFeedback, myClothes } = useUser();
    const [occasion, setOccasion] = useState<Occasion>("trabajo");
    const [time, setTime] = useState<Time>("dia");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [generatedColors, setGeneratedColors] = useState<{ name: string; hex: string }[]>([]);
    const [currentFavoriteId, setCurrentFavoriteId] = useState<string | null>(null);
    const [currentFeedback, setCurrentFeedback] = useState<'like' | 'dislike' | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [selectedClothes, setSelectedClothes] = useState<string[]>([]); // IDs of selected clothes
    const [showClothesModal, setShowClothesModal] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);

    const showNotification = (message: string) => {
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const handleFeedback = async (type: 'like' | 'dislike') => {
        if (!generatedImage) return;

        if (type === 'like') {
            if (!currentFavoriteId) {
                await handleToggleFavorite();
            }
            showNotification("¡Guardado en favoritos! 👍");
        } else {
            showNotification("Gracias por tu opinión 👎");
        }

        setCurrentFeedback(type);

        if (currentFavoriteId) {
            await setFeedback(currentFavoriteId, type);
        }
    };

    const OCCASIONS: { id: Occasion; label: string }[] = [
        { id: "trabajo", label: "Trabajo" },
        { id: "cita", label: "Cita" },
        { id: "gala", label: "Gala" },
        { id: "casual", label: "Casual" },
        { id: "deporte", label: "Deporte" },
        { id: "viaje", label: "Viaje" },
        { id: "fiesta", label: "Fiesta" },
        { id: "boda", label: "Boda" },
    ];

    const TIMES: { id: Time; label: string }[] = [
        { id: "dia", label: "Día" },
        { id: "atardecer", label: "Atardecer" },
        { id: "noche", label: "Noche" },
    ];

    const handleGenerate = async () => {
        if (!analysis) return;

        setIsGenerating(true);
        setCurrentFavoriteId(null);
        try {
            const selectedItems = myClothes.filter(c => selectedClothes.includes(c.id));
            if (!userImage) return;
            const { image, colors } = await generateOutfit(analysis, occasion, time, selectedItems, userImage);
            setGeneratedImage(image);
            setGeneratedColors(colors);
            saveSimulation(image);
        } catch (error) {
            console.error("Generation failed:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleToggleFavorite = async () => {
        const imageToSave = generatedImage || userImage;
        if (!imageToSave) return;

        // If already saved (currentFavoriteId exists), remove it
        if (currentFavoriteId) {
            const itemToRemove = favorites.find(f => f.id === currentFavoriteId);
            if (itemToRemove) {
                await toggleFavorite(itemToRemove);
                setCurrentFavoriteId(null);
                showNotification("Eliminado de favoritos");
            }
            return;
        }

        // If not saved, save it
        const id = uuidv4();
        const item: FavoriteItem = {
            id,
            url: imageToSave,
            occasion: occasion,
            timestamp: Date.now()
        };

        await toggleFavorite(item);
        setCurrentFavoriteId(id);
        showNotification("¡Guardado en favoritos!");
    };

    // Determine if the current image is favorited based on currentFavoriteId
    // We trust currentFavoriteId as the source of truth for the current session's generated image
    // For the initial userImage, we might need to check the favorites array
    useEffect(() => {
        if (!generatedImage && userImage) {
            // Check if userImage is in favorites
            const fav = favorites.find(f => f.url === userImage);
            if (fav) setCurrentFavoriteId(fav.id);
        }
    }, [userImage, generatedImage, favorites]);

    const isFavorite = !!currentFavoriteId;
    const displayImage = generatedImage || userImage;
    const displayColors = generatedImage && generatedColors.length > 0
        ? generatedColors
        : (analysis?.powerColors.slice(0, 4) || []);

    const toggleClothingItem = (id: string) => {
        setSelectedClothes(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    if (isLoading) {
        return (
            <main className="h-screen bg-black text-white flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
            </main>
        );
    }

    if (!userImage) {
        return (
            <main className="h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-gray-400">No hay imagen para simular</p>
                    <Link href="/camera">
                        <button className="text-sm font-bold underline">Ir a Cámara</button>
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="h-screen bg-black text-white flex flex-col overflow-hidden relative">
            {/* Zoom Modal */}
            {isZoomed && displayImage && (
                <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center animate-in fade-in duration-200 overflow-hidden">
                    <button
                        onClick={() => setIsZoomed(false)}
                        className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Image Container */}
                    <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <ZoomableImage src={displayImage} id="main-simulation-image" />
                    </div>
                </div>
            )}

            {/* Clothes Selection Modal */}
            {showClothesModal && (
                <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl p-6 flex flex-col animate-in fade-in slide-in-from-bottom-10">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold">Selecciona tus prendas</h2>
                        <button onClick={() => setShowClothesModal(false)} className="p-2">
                            <ArrowLeft className="w-6 h-6" />
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
                </div>
            )}

            {/* Toast Notification */}
            {showToast && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-xs font-bold z-50 animate-in fade-in slide-in-from-top-4 shadow-xl">
                    {toastMessage}
                </div>
            )}

            {/* Header - Compact */}
            <header className="px-4 py-3 flex justify-between items-center bg-black/50 backdrop-blur-md z-10 absolute top-0 left-0 right-0">
                <Link href="/dashboard">
                    <button className="w-8 h-8 rounded-full bg-zinc-900/80 flex items-center justify-center text-white">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                </Link>
                <h1 className="text-xs font-bold tracking-widest uppercase">Espejo IA</h1>
                {generatedImage && (
                    <button
                        onClick={handleToggleFavorite}
                        className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                            isFavorite ? "bg-yellow-500 text-black" : "bg-zinc-900/80 text-white"
                        )}
                    >
                        <Star className={cn("w-4 h-4", isFavorite && "fill-black")} />
                    </button>
                )}
                {!generatedImage && <div className="w-8 h-8" />} {/* Spacer */}
            </header>

            {/* Main Image Area - Maximized */}
            <div className="flex-1 relative w-full h-full">
                <div className="absolute inset-0 cursor-zoom-in" onClick={() => setIsZoomed(true)}>
                    <motion.img
                        layoutId="main-simulation-image"
                        src={displayImage!}
                        alt="Simulation"
                        className="w-full h-full object-cover"
                    />
                    {/* Gradient Overlay for Controls */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

                    {/* Used Palette Overlay */}
                    {displayColors.length > 0 && (
                        <div className="absolute top-20 right-4 flex flex-col gap-2 z-20 pointer-events-none">
                            {displayColors.map((color, index) => (
                                <div
                                    key={index}
                                    className="w-6 h-6 rounded-full border border-white/20 shadow-lg backdrop-blur-sm"
                                    style={{ backgroundColor: color.hex }}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Controls - Floating at Bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4 pb-24 space-y-4 z-20 pointer-events-none">
                    <div className="pointer-events-auto space-y-4">

                        {/* My Clothes Selection */}
                        <div className="space-y-1">
                            <div className="flex justify-between items-center px-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mis Prendas</p>
                                <button onClick={() => setShowClothesModal(true)} className="text-[10px] font-bold text-white underline">
                                    {selectedClothes.length > 0 ? 'Editar' : 'Seleccionar'}
                                </button>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mask-fade-right">
                                <button
                                    onClick={() => setShowClothesModal(true)}
                                    className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 hover:bg-white/20 transition-colors"
                                >
                                    <Sparkles className="w-5 h-5 text-white/50" />
                                </button>
                                {selectedClothes.map(id => {
                                    const item = myClothes.find(c => c.id === id);
                                    if (!item) return null;
                                    return (
                                        <div key={id} className="w-12 h-12 rounded-xl overflow-hidden border border-white/50 flex-shrink-0 relative">
                                            <img src={item.url} alt="selected" className="w-full h-full object-cover" />
                                            <button
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

                        {/* Occasions - Horizontal Scroll */}
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Ocasión</p>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mask-fade-right">
                                {OCCASIONS.map((occ) => (
                                    <button
                                        key={occ.id}
                                        onClick={() => setOccasion(occ.id)}
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

                        {/* Time Selection - Compact */}
                        <div className="flex justify-between items-center bg-zinc-900/80 backdrop-blur-md rounded-full p-1 border border-white/10">
                            {TIMES.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTime(t.id)}
                                    className={cn(
                                        "flex-1 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all",
                                        time === t.id ? "bg-white text-black shadow-lg" : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Feedback & Generate Buttons */}
                        <div className="flex gap-3 items-center">
                            {/* Feedback Buttons (Only when generated image exists) */}
                            {generatedImage && (
                                <div className="flex gap-2 bg-zinc-900/80 backdrop-blur-md rounded-full p-1 border border-white/10">
                                    <button
                                        onClick={() => handleFeedback('dislike')}
                                        className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                            currentFeedback === 'dislike' ? "bg-red-500/20 text-red-500" : "text-gray-400 hover:text-white"
                                        )}
                                    >
                                        <ThumbsDown className="w-4 h-4" />
                                    </button>
                                    <button
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

                            {/* Generate Button */}
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="flex-1 bg-white text-black h-10 rounded-full font-bold text-sm tracking-wide hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 shadow-xl disabled:opacity-70"
                            >
                                {isGenerating ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        GENERANDO...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        GENERAR
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <BottomNav />
        </main>
    );
}

function ZoomableImage({ src, id }: { src: string, id: string }) {
    const [scale, setScale] = useState(1);
    const constraintsRef = useRef(null);

    return (
        <>
            <motion.div
                ref={constraintsRef}
                className="w-full h-full flex items-center justify-center overflow-hidden"
            >
                <motion.img
                    src={src}
                    alt="Full screen"
                    className="max-w-none max-h-none object-contain"
                    style={{
                        width: '100%',
                        height: '100%',
                        cursor: scale > 1 ? 'grab' : 'default'
                    }}
                    layoutId={id}
                    drag={scale > 1}
                    dragConstraints={constraintsRef}
                    dragElastic={0.1}
                    animate={{ scale: scale }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            </motion.div>

            {/* Zoom Controls */}
            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/50 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 z-50" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setScale(Math.max(1, scale - 0.5))} className="text-white hover:text-gray-300">-</button>
                <input
                    type="range"
                    min="1"
                    max="4"
                    step="0.1"
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="w-32 accent-white h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
                <button onClick={() => setScale(Math.min(4, scale + 0.5))} className="text-white hover:text-gray-300">+</button>
            </div>
        </>
    );
}

