"use client";

import { useState, useEffect } from "react";
import { BottomNav } from "@/components/ui/BottomNav";
import { Toast } from "@/components/ui/Toast";
import { Share2, Edit2, CheckCircle2, XCircle, Copy, Check, CalendarDays, Sparkles, BookOpen } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const { analysis, isLoading } = useUser();
    const router = useRouter();
    const [copied, setCopied] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

    // Redirect to camera once loading is confirmed done and no analysis exists
    useEffect(() => {
        if (!isLoading && !analysis) {
            router.replace("/camera");
        }
    }, [isLoading, analysis, router]);

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setToast({ message: "¡Copiado al portapapeles!", type: "success" });
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setToast({ message: "No se pudo copiar. Intenta de nuevo.", type: "error" });
        }
    };

    const handleShare = async () => {
        if (!analysis) return;
        const text = `¡Descubrí que soy ${analysis.season}! 🎨✨ Descúbrelo tú también en LUCE.`;

        if (navigator.share) {
            try {
                await navigator.share({ title: 'Mi Análisis de Color - LUCE', text, url: window.location.href });
            } catch (err) {
                if ((err as DOMException).name !== "AbortError") {
                    await copyToClipboard(text);
                }
            }
        } else {
            await copyToClipboard(text);
        }
    };

    // While loading OR redirecting (no analysis), show neutral spinner
    if (isLoading || !analysis) {
        return (
            <main className="h-screen bg-black text-white flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white pb-32">
            {toast && (
                <Toast message={toast.message} isVisible type={toast.type} onClose={() => setToast(null)} />
            )}

            {/* Header */}
            <header className="p-6 flex justify-between items-center sticky top-0 z-10 bg-black/80 backdrop-blur-md">
                <div className="flex gap-2">
                    <Link href="/planner">
                        <button aria-label="Planificador de outfits" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white hover:bg-zinc-800 transition-colors">
                            <CalendarDays className="w-5 h-5" />
                        </button>
                    </Link>
                    <Link href="/how-it-works">
                        <button aria-label="Cómo funciona" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white hover:bg-zinc-800 transition-colors">
                            <BookOpen className="w-5 h-5" />
                        </button>
                    </Link>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleShare}
                        aria-label={copied ? "Copiado" : "Compartir análisis"}
                        className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white hover:bg-zinc-800 transition-colors"
                    >
                        {copied
                            ? <Check className="w-5 h-5 text-emerald-400" />
                            : <Share2 className="w-5 h-5" />
                        }
                    </button>
                    <button
                        onClick={() => router.push("/camera")}
                        aria-label="Repetir análisis"
                        className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                        <Edit2 className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="px-6 space-y-8">
                {/* Classification */}
                <div className="space-y-2">
                    <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500">TU CLASIFICACIÓN</h2>
                    <h1 className="text-4xl font-bold leading-tight">
                        {analysis.season.split(" ").map((word, i) => (
                            <span key={i} className="block">{word}</span>
                        ))}
                    </h1>
                    <div className="max-h-32 overflow-y-auto pr-2 scrollbar-hide">
                        <p className="text-gray-400 text-sm leading-relaxed max-w-xs pt-2">{analysis.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                        <div className="px-3 py-1 rounded-full border border-white/20 text-[10px] font-bold tracking-wider uppercase text-white/70">
                            {analysis.gender}
                        </div>
                        <div className="px-3 py-1 rounded-full border border-white/20 text-[10px] font-bold tracking-wider uppercase text-white/70">
                            {analysis.age} AÑOS (EST.)
                        </div>
                        {analysis.bodyType && (
                            <div className="px-3 py-1 rounded-full border border-white/20 text-[10px] font-bold tracking-wider uppercase text-white/70">
                                {analysis.bodyType}
                            </div>
                        )}
                    </div>
                </div>

                {/* Power Colors */}
                <section aria-label="Colores potencia" className="space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="bg-white text-black text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                            POWER COLORS
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-white/50" />
                    </div>
                    <h3 className="text-xl font-bold">Esenciales</h3>
                    <div className="grid grid-cols-5 gap-2">
                        {analysis.powerColors.slice(0, 10).map((color, index) => (
                            <ColorBlock key={index} color={color.hex} name={color.name} usage={color.usage} />
                        ))}
                    </div>
                </section>

                {/* Neutral Colors */}
                {analysis.neutralColors && (
                    <section aria-label="Colores neutros" className="space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="bg-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                NEUTROS
                            </span>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            {analysis.neutralColors.map((color, index) => (
                                <ColorBlock key={index} color={color.hex} name={color.name} usage={color.usage} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Winning Combinations */}
                {analysis.winningCombinations && (
                    <section aria-label="Combinaciones ganadoras" className="space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="bg-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                COMBINACIONES
                            </span>
                        </div>
                        <div className="space-y-3">
                            {analysis.winningCombinations.map((combo, idx) => (
                                <div key={idx} className="bg-zinc-900/50 rounded-2xl p-4 border border-white/5">
                                    <h4 className="text-sm font-bold mb-3">{combo.name}</h4>
                                    <div className="flex h-12 rounded-lg overflow-hidden" role="img" aria-label={`Paleta ${combo.name}`}>
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
                <section aria-label="Colores a evitar" className="bg-zinc-900/50 rounded-3xl p-6 space-y-4 border border-white/5">
                    <div className="flex items-center gap-2">
                        <span className="bg-zinc-800 text-gray-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                            BLOQUEADOS
                        </span>
                    </div>
                    <div className="flex justify-between items-end">
                        <div>
                            <h3 className="text-xl font-bold text-gray-200">Evitar</h3>
                            <div className="space-y-1 mt-2">
                                {analysis.blockedColors.map((color, index) => (
                                    <p key={index} className="text-xs text-gray-500 max-w-[200px]">
                                        <span className="text-gray-300 font-medium">{color.name}:</span> {color.reason}
                                    </p>
                                ))}
                            </div>
                        </div>
                        <div className="flex -space-x-4" aria-hidden="true">
                            {analysis.blockedColors.slice(0, 2).map((color, index) => (
                                <div
                                    key={index}
                                    className="w-16 h-16 rounded-full border-4 border-black flex items-center justify-center"
                                    style={{ backgroundColor: color.hex }}
                                >
                                    <XCircle className="w-6 h-6 text-black/50" />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Outfit Planner CTA */}
                <Link href="/planner" className="block">
                    <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-3xl p-6 border border-white/10 hover:border-white/20 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors">
                                <CalendarDays className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-sm">Outfit Planner</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Planifica tus outfits de la semana con IA</p>
                            </div>
                            <Sparkles className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors shrink-0" />
                        </div>
                    </div>
                </Link>

                {/* Copy summary */}
                <button
                    onClick={() => copyToClipboard(`Mi paleta LUCE: ${analysis.season}. Power colors: ${analysis.powerColors.map(c => c.name).join(', ')}.`)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/10 text-xs font-bold text-gray-400 hover:text-white hover:border-white/20 transition-colors"
                >
                    <Copy className="w-3 h-3" />
                    Copiar resumen de paleta
                </button>
            </div>

            <BottomNav />
        </main>
    );
}

function ColorBlock({ color, name, usage }: { color: string; name: string; usage: string }) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="relative">
            <button
                className="w-full aspect-square rounded-lg shadow-md transition-transform active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                style={{ backgroundColor: color }}
                aria-label={`${name}: ${usage}`}
                onPointerDown={() => setShowTooltip(true)}
                onPointerUp={() => setShowTooltip(false)}
                onPointerLeave={() => setShowTooltip(false)}
                onFocus={() => setShowTooltip(true)}
                onBlur={() => setShowTooltip(false)}
            />
            <AnimatePresence>
                {showTooltip && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-36 bg-white text-black p-3 rounded-xl shadow-xl z-10 pointer-events-none"
                        role="tooltip"
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
