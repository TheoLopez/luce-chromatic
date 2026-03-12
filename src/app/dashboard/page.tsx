"use client";

import { useState } from "react";
import { BottomNav } from "@/components/ui/BottomNav";
import { Toast } from "@/components/ui/Toast";
import { Share2, Edit2, CheckCircle2, XCircle, Loader2, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const { analysis, isLoading } = useUser();
    const router = useRouter();
    const [copied, setCopied] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
    const [expandDesc, setExpandDesc] = useState(false);

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

    return (
        <main className="min-h-screen bg-black text-white pb-32">
            {toast && (
                <Toast message={toast.message} isVisible type={toast.type} onClose={() => setToast(null)} />
            )}

            {/* Header */}
            <header className="px-5 pt-12 pb-3 flex justify-end items-center sticky top-0 z-10 bg-black/80 backdrop-blur-md">
                <div className="flex gap-2">
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

            <div className="px-5 space-y-5">
                {/* Hero */}
                <div className="space-y-3">
                    <p className="text-[11px] font-semibold tracking-[0.2em] text-gray-500 uppercase">
                        TU CLASIFICACIÓN
                    </p>
                    <div className="flex items-start justify-between gap-4">
                        <h1 className="text-[42px] font-black leading-none tracking-tight">
                            {analysis.season}
                        </h1>
                        {analysis.luceScore > 0 && (
                            <div className="shrink-0 bg-white text-black rounded-2xl px-3 py-2 text-center min-w-[56px]">
                                <div className="text-2xl font-black leading-none">{analysis.luceScore}</div>
                                <div className="text-[9px] font-bold tracking-wider uppercase mt-0.5 text-gray-500">
                                    SCORE
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Expandable description */}
                    <button
                        onClick={() => setExpandDesc(v => !v)}
                        className="text-left w-full group"
                        aria-expanded={expandDesc}
                    >
                        <p className={cn(
                            "text-sm text-gray-400 leading-relaxed",
                            !expandDesc && "line-clamp-2"
                        )}>
                            {analysis.description}
                        </p>
                        <span className="flex items-center gap-0.5 text-[11px] text-gray-600 mt-1 group-hover:text-gray-400 transition-colors">
                            {expandDesc
                                ? <><ChevronUp className="w-3 h-3" />Ver menos</>
                                : <><ChevronDown className="w-3 h-3" />Ver más</>
                            }
                        </span>
                    </button>

                    {/* Profile chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {[analysis.gender, `${analysis.age} años (est.)`, analysis.bodyType]
                            .filter(Boolean)
                            .map((label, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1 rounded-full border border-white/15 text-[10px] font-bold tracking-wider uppercase text-white/60"
                                >
                                    {label}
                                </span>
                            ))
                        }
                    </div>
                </div>

                {/* Color Palette Card — Power + Neutros */}
                <section
                    aria-label="Paleta de colores"
                    className="bg-zinc-900/60 rounded-3xl p-5 space-y-5 border border-white/5"
                >
                    {/* Power Colors */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="bg-white text-black text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                                POWER COLORS
                            </span>
                            <CheckCircle2 className="w-4 h-4 text-white/30" />
                        </div>
                        <div className="flex gap-3 flex-wrap">
                            {analysis.powerColors.map((color, i) => (
                                <ColorSwatch key={i} color={color} />
                            ))}
                        </div>
                    </div>

                    {/* Neutral Colors */}
                    {analysis.neutralColors?.length > 0 && (
                        <>
                            <div className="border-t border-white/5" />
                            <div className="space-y-3">
                                <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-500">
                                    NEUTROS
                                </span>
                                <div className="flex gap-3 flex-wrap">
                                    {analysis.neutralColors.map((color, i) => (
                                        <ColorSwatch key={i} color={color} />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </section>

                {/* Winning Combinations */}
                {analysis.winningCombinations?.length > 0 && (
                    <section aria-label="Combinaciones ganadoras" className="space-y-3">
                        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-500">
                            COMBINACIONES
                        </span>
                        <div className="space-y-2">
                            {analysis.winningCombinations.map((combo, i) => (
                                <div
                                    key={i}
                                    className="rounded-2xl overflow-hidden border border-white/5"
                                >
                                    <div
                                        className="flex h-11"
                                        role="img"
                                        aria-label={`Paleta ${combo.name}`}
                                    >
                                        {combo.colors.map((hex, j) => (
                                            <div key={j} className="flex-1" style={{ backgroundColor: hex }} />
                                        ))}
                                    </div>
                                    <div className="px-4 py-2.5 bg-zinc-900/60">
                                        <p className="text-xs font-bold">{combo.name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Blocked Colors */}
                <section
                    aria-label="Colores a evitar"
                    className="bg-zinc-900/40 rounded-3xl p-5 border border-white/5"
                >
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-600">
                            EVITAR
                        </span>
                        <div className="flex -space-x-2" aria-hidden="true">
                            {analysis.blockedColors.slice(0, 3).map((color, i) => (
                                <div
                                    key={i}
                                    className="w-6 h-6 rounded-full border-2 border-zinc-900 flex items-center justify-center"
                                    style={{ backgroundColor: color.hex }}
                                >
                                    {i === 0 && <XCircle className="w-3.5 h-3.5 text-black/40" />}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                        {analysis.blockedColors.map((color, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <div
                                    className="w-3 h-3 rounded-full shrink-0 mt-0.5"
                                    style={{ backgroundColor: color.hex }}
                                />
                                <div className="min-w-0">
                                    <p className="text-[11px] font-semibold text-gray-300 truncate">{color.name}</p>
                                    <p className="text-[10px] text-gray-600 leading-tight">{color.reason}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Copy summary */}
                <button
                    onClick={() => copyToClipboard(`Mi paleta LUCE: ${analysis.season}. Power colors: ${analysis.powerColors.map(c => c.name).join(', ')}.`)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/10 text-xs font-bold text-gray-500 hover:text-white hover:border-white/20 transition-colors"
                >
                    <Copy className="w-3.5 h-3.5" />
                    Copiar resumen de paleta
                </button>
            </div>

            <BottomNav />
        </main>
    );
}

function ColorSwatch({ color }: { color: { hex: string; name: string; usage: string } }) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="relative flex flex-col items-center gap-1.5">
            <button
                className="w-14 h-14 rounded-full shadow-lg transition-transform active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                style={{ backgroundColor: color.hex }}
                aria-label={`${color.name}: ${color.usage}`}
                onPointerDown={() => setShowTooltip(true)}
                onPointerUp={() => setShowTooltip(false)}
                onPointerLeave={() => setShowTooltip(false)}
                onFocus={() => setShowTooltip(true)}
                onBlur={() => setShowTooltip(false)}
            />
            <span className="text-[10px] text-gray-400 text-center w-16 leading-tight truncate">
                {color.name}
            </span>
            <AnimatePresence>
                {showTooltip && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.9 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 bg-white text-black p-3 rounded-xl shadow-xl z-10 pointer-events-none"
                        role="tooltip"
                    >
                        <div className="text-xs font-bold mb-1">{color.name}</div>
                        <div className="text-[10px] leading-tight text-gray-600">{color.usage}</div>
                        <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white rotate-45" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
