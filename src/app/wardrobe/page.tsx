"use client";

import { useState, useRef } from "react";
import { BottomNav } from "@/components/ui/BottomNav";
import { ArrowLeft, Grid, Folder, ChevronRight, X, Maximize2, ThumbsUp, ThumbsDown, Trash2 } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function Wardrobe() {
    const { favorites, setFeedback, toggleFavorite, isLoading } = useUser();
    const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);

    const groupedFavorites = favorites.reduce((acc, item) => {
        const key = item.occasion;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {} as Record<string, typeof favorites>);

    const occasions = Object.keys(groupedFavorites);

    const handleDelete = async (item: any) => {
        if (confirm("¿Estás seguro de que quieres eliminar este look?")) {
            await toggleFavorite(item); // Toggle removes if exists
            setSelectedItem(null);
        }
    };

    return (
        <main className="min-h-screen bg-black text-white pb-32">
            <header className="p-6 flex justify-between items-center sticky top-0 z-10 bg-black/80 backdrop-blur-md">
                {selectedOccasion ? (
                    <button
                        onClick={() => setSelectedOccasion(null)}
                        className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white hover:bg-zinc-800 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                ) : (
                    <Link href="/dashboard">
                        <button className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white hover:bg-zinc-800 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    </Link>
                )}
                <span className="text-xs font-bold tracking-[0.2em] uppercase">
                    {selectedOccasion ? selectedOccasion.toUpperCase() : "TU ARMARIO"}
                </span>
                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white">
                    <Grid className="w-5 h-5" />
                </div>
            </header>

            <div className="px-6 space-y-6">
                {isLoading ? (
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="aspect-[3/4] rounded-2xl bg-zinc-900 animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-gray-600">
                            <Folder className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-lg font-bold">Tu armario está vacío</p>
                            <p className="text-sm text-gray-400">Guarda tus looks favoritos para verlos aquí.</p>
                        </div>
                    </div>
                ) : selectedOccasion ? (
                    // Detail View (Grid of Outfits)
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {groupedFavorites[selectedOccasion].map((item) => (
                            <motion.button
                                key={item.id}
                                layoutId={item.id}
                                onClick={() => setSelectedItem(item)}
                                className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 group text-left w-full"
                            >
                                <img src={item.url} alt={item.occasion} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                    <Maximize2 className="w-5 h-5 text-white" />
                                </div>
                            </motion.button>
                        ))}
                    </div>
                ) : (
                    // Folder View (Creative Drawers)
                    // Pinterest-style Grid View
                    <div className="grid grid-cols-2 gap-4">
                        {occasions.map((occasion, index) => {
                            const items = groupedFavorites[occasion];
                            const previewImage = items[0]?.url;
                            const count = items.length;

                            return (
                                <motion.button
                                    key={occasion}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    onClick={() => setSelectedOccasion(occasion)}
                                    className="relative group aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900 border border-white/10"
                                >
                                    {/* Preview Image */}
                                    {previewImage ? (
                                        <div className="absolute inset-0">
                                            <img
                                                src={previewImage}
                                                alt={occasion}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                            {/* Dark overlay for text readability */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                                            <Folder className="w-10 h-10 text-white/20" />
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="absolute inset-x-0 bottom-0 p-4 text-left">
                                        <h3 className="font-bold capitalize text-lg text-white leading-tight mb-1">
                                            {occasion}
                                        </h3>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                {count} {count === 1 ? 'Look' : 'Looks'}
                                            </span>
                                            <div className="w-6 h-6 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ChevronRight className="w-3 h-3 text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Full Screen Image Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedItem(null)}
                        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center overflow-hidden"
                    >
                        <div className="absolute top-6 right-6 flex gap-4 z-50">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm("¿Estás seguro de que quieres eliminar este look?")) {
                                        toggleFavorite(selectedItem);
                                        setSelectedItem(null);
                                    }
                                }}
                                className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                            >
                                <Trash2 className="w-6 h-6" />
                            </button>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Image Container */}
                        <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                            <ZoomableImage src={selectedItem.url} id={selectedItem.id} />
                        </div>

                        {/* Feedback Controls */}
                        <div className="absolute bottom-10 flex gap-4 z-50 pointer-events-auto">
                            <button
                                onClick={(e) => { e.stopPropagation(); setFeedback(selectedItem.id, 'dislike'); }}
                                className={cn(
                                    "w-14 h-14 rounded-full flex items-center justify-center transition-all border",
                                    selectedItem.feedback === 'dislike'
                                        ? "bg-red-500/20 text-red-500 border-red-500"
                                        : "bg-zinc-900 text-gray-400 border-white/10 hover:bg-zinc-800"
                                )}
                            >
                                <ThumbsDown className="w-6 h-6" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setFeedback(selectedItem.id, 'like'); }}
                                className={cn(
                                    "w-14 h-14 rounded-full flex items-center justify-center transition-all border",
                                    selectedItem.feedback === 'like'
                                        ? "bg-green-500/20 text-green-500 border-green-500"
                                        : "bg-zinc-900 text-gray-400 border-white/10 hover:bg-zinc-800"
                                )}
                            >
                                <ThumbsUp className="w-6 h-6" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <BottomNav />
        </main>
    );
}

import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

function ZoomableImage({ src, id }: { src: string, id: string }) {
    return (
        <div className="w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <TransformWrapper
                initialScale={1}
                minScale={1}
                maxScale={4}
                centerOnInit
                wheel={{ step: 0.1 }}
            >
                {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                        <TransformComponent
                            wrapperStyle={{ width: "100%", height: "100%" }}
                            contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                            <img
                                src={src}
                                alt="Full screen"
                                className="max-w-full max-h-full object-contain"
                            />
                        </TransformComponent>

                        {/* Zoom Controls */}
                        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/50 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 z-50 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => zoomOut()} className="text-white hover:text-gray-300 text-xl font-bold px-2">-</button>
                            <button onClick={() => resetTransform()} className="text-xs text-gray-300 hover:text-white uppercase tracking-wider">Reset</button>
                            <button onClick={() => zoomIn()} className="text-white hover:text-gray-300 text-xl font-bold px-2">+</button>
                        </div>
                    </>
                )}
            </TransformWrapper>
        </div>
    );
}
