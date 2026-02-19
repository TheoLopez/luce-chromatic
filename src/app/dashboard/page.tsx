
"use client";

import { useState } from "react";
import { BottomNav } from "@/components/ui/BottomNav";
import { ArrowLeft, Share2, Edit2, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const { analysis, isLoading } = useUser();
    const router = useRouter();

    const handleShare = async () => {
        if (!analysis) return;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Mi Análisis de Color - LUCE',
                    text: `¡Descubrí que soy ${analysis.season} ! 🎨✨`,
                    url: window.location.href,
                });
            } catch (error) {
                console.log('Error sharing', error);
            }
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(`¡Descubrí que soy ${analysis.season} ! 🎨✨`);
            alert("¡Texto copiado al portapapeles!");
        }
    };

    const handleEditClick = () => {
        router.push("/camera");
    };

    if (isLoading) {
        return (
            <main className="h-screen bg-black text-white flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
            </main>
        );
    }

    if (!analysis) {
        return (
            <main className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-white/50" />
                    <p className="text-sm text-gray-500">Esperando análisis...</p>
                    <Link href="/camera">
                        <button className="text-xs font-bold underline">Ir a Cámara</button>
                    </Link>
                </div>
            </main>
        );
    }

    const userAnalysis = analysis;

    return (
        <main className="min-h-screen bg-black text-white pb-32">
            {/* Header */}
            <header className="p-6 flex justify-between items-center sticky top-0 z-10 bg-black/80 backdrop-blur-md">
                <div className="w-10 h-10" /> {/* Spacer to keep alignment */}
                <div className="flex gap-3">
                    <button
                        onClick={handleShare}
                        className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white hover:bg-zinc-800 transition-colors"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleEditClick}
                        className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                        <Edit2 className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="px-6 space-y-8">
                {/* Classification */}
                <div className="space-y-2">
                    <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500">
                        TU CLASIFICACIÓN
                    </h2>
                    <h1 className="text-4xl font-bold leading-tight">
                        {userAnalysis.season.split(" ").map((word, i) => (
                            <span key={i} className="block">{word}</span>
                        ))}
                    </h1>
                    <div className="max-h-32 overflow-y-auto pr-2 scrollbar-hide">
                        <p className="text-gray-400 text-sm leading-relaxed max-w-xs pt-2">
                            {userAnalysis.description}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                        <div className="px-3 py-1 rounded-full border border-white/20 text-[10px] font-bold tracking-wider uppercase text-white/70">
                            {userAnalysis.gender}
                        </div>
                        <div className="px-3 py-1 rounded-full border border-white/20 text-[10px] font-bold tracking-wider uppercase text-white/70">
                            {userAnalysis.age} AÑOS (EST.)
                        </div>
                        {userAnalysis.bodyType && (
                            <div className="px-3 py-1 rounded-full border border-white/20 text-[10px] font-bold tracking-wider uppercase text-white/70">
                                {userAnalysis.bodyType}
                            </div>
                        )}
                    </div>
                </div>

                {/* Power Colors */}
                <section className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="bg-white text-black text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                POWER COLORS
                            </span>
                            <CheckCircle2 className="w-4 h-4 text-white/50" />
                        </div>
                        <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                    </div>

                    <h3 className="text-xl font-bold">Esenciales</h3>

                    <div className="grid grid-cols-4 gap-4">
                        {userAnalysis.powerColors.map((color, index) => (
                            <ColorBlock key={index} color={color.hex} name={color.name} usage={color.usage} />
                        ))}
                    </div>
                </section>

                {/* Neutral Colors */}
                {userAnalysis.neutralColors && (
                    <section className="space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="bg-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                NEUTROS
                            </span>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            {userAnalysis.neutralColors.map((color, index) => (
                                <ColorBlock key={index} color={color.hex} name={color.name} usage={color.usage} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Winning Combinations */}
                {userAnalysis.winningCombinations && (
                    <section className="space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="bg-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                COMBINACIONES
                            </span>
                        </div>
                        <div className="space-y-3">
                            {userAnalysis.winningCombinations.map((combo, idx) => (
                                <div key={idx} className="bg-zinc-900/50 rounded-2xl p-4 border border-white/5">
                                    <h4 className="text-sm font-bold mb-3">{combo.name}</h4>
                                    <div className="flex h-12 rounded-lg overflow-hidden">
                                        {combo.colors.map((hex, i) => (
                                            <div key={i} className="flex-1" style={{ backgroundColor: hex }} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Blocked Colors */}
                <section className="bg-zinc-900/50 rounded-3xl p-6 space-y-4 border border-white/5">
                    <div className="flex items-center gap-2">
                        <span className="bg-zinc-800 text-gray-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                            BLOQUEADOS
                        </span>
                    </div>

                    <div className="flex justify-between items-end">
                        <div>
                            <h3 className="text-xl font-bold text-gray-200">Evitar</h3>
                            <div className="space-y-1 mt-2">
                                {userAnalysis.blockedColors.map((color, index) => (
                                    <p key={index} className="text-xs text-gray-500 max-w-[150px]">
                                        <span className="text-gray-300 font-medium">{color.name}:</span> {color.reason}
                                    </p>
                                ))}
                            </div>
                        </div>

                        <div className="flex -space-x-4">
                            {userAnalysis.blockedColors.slice(0, 2).map((color, index) => (
                                <div key={index} className="w-16 h-16 rounded-full border-4 border-black flex items-center justify-center" style={{ backgroundColor: color.hex }}>
                                    <XCircle className="w-6 h-6 text-black/50" />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            <BottomNav />
        </main>
    );
}

function ColorBlock({ color, name, usage }: { color: string, name: string, usage: string }) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="relative group">
            <button
                className="w-full aspect-square rounded-full shadow-lg transition-transform active:scale-95 focus:outline-none border-2 border-white/20"
                style={{ backgroundColor: color }}
                onPointerDown={() => setShowTooltip(true)}
                onPointerUp={() => setShowTooltip(false)}
                onPointerLeave={() => setShowTooltip(false)}
                onTouchStart={() => setShowTooltip(true)}
                onTouchEnd={() => setShowTooltip(false)}
            />

            <AnimatePresence>
                {showTooltip && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-32 bg-white text-black p-3 rounded-xl shadow-xl z-10 pointer-events-none"
                    >
                        <div className="text-xs font-bold mb-1">{name}</div>
                        <div className="text-[10px] leading-tight text-gray-600">{usage}</div>
                        <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

