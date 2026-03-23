"use client";

import { useState, useEffect } from "react";
import { BottomNav } from "@/components/ui/BottomNav";
import { Toast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, CalendarDays, Briefcase, Plane, Dumbbell, PartyPopper, GlassWater, Sparkles, ChevronDown, ChevronUp, Shirt, Scissors, Footprints, Watch, ShoppingBag, Lightbulb } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { planOutfits, OutfitPlan } from "@/lib/gemini";

const EVENT_TYPES = [
    { id: "oficina", label: "Oficina", emoji: "💼", icon: Briefcase, description: "Outfits para ir al trabajo" },
    { id: "viaje", label: "Viaje", emoji: "✈️", icon: Plane, description: "Looks para tu próximo viaje" },
    { id: "gimnasio", label: "Gimnasio", emoji: "🏋️", icon: Dumbbell, description: "Ropa deportiva combinada" },
    { id: "fiesta", label: "Fiesta / Evento", emoji: "🎉", icon: PartyPopper, description: "Looks para salir" },
    { id: "casual", label: "Casual / Fin de semana", emoji: "☀️", icon: GlassWater, description: "Outfits relajados" },
    { id: "citas", label: "Citas", emoji: "🌹", icon: Sparkles, description: "Looks para impresionar" },
];

const CATEGORY_ICONS: Record<string, typeof Shirt> = {
    superior: Shirt,
    inferior: Scissors,
    shoes: Footprints,
    accessories: Watch,
};

export default function Planner() {
    const { user, analysis, myClothes, isLoading } = useUser();
    const router = useRouter();

    const [eventType, setEventType] = useState("oficina");
    const [eventDetails, setEventDetails] = useState("");
    const [numberOfOutfits, setNumberOfOutfits] = useState(5);
    const [isPlanning, setIsPlanning] = useState(false);
    const [outfits, setOutfits] = useState<OutfitPlan[]>([]);
    const [expandedOutfit, setExpandedOutfit] = useState<number | null>(null);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace("/");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!isLoading && user && !analysis) {
            router.replace("/camera");
        }
    }, [user, analysis, isLoading, router]);

    const handlePlan = async () => {
        if (!analysis || myClothes.length === 0) return;
        setIsPlanning(true);
        setOutfits([]);
        setExpandedOutfit(null);

        try {
            const clothesData = myClothes.map(c => ({
                id: c.id,
                category: c.category,
                name: c.name || c.description,
                description: c.description,
                color: c.color || "",
                material: c.material || "",
                type: c.type || "",
            }));

            const selectedEvent = EVENT_TYPES.find(e => e.id === eventType);
            const details = eventDetails || selectedEvent?.description || eventType;

            const result = await planOutfits(
                analysis as unknown as Record<string, unknown>,
                clothesData,
                selectedEvent?.label || eventType,
                details,
                numberOfOutfits,
            );
            setOutfits(result);
            setExpandedOutfit(0);
        } catch (error) {
            console.error("Error planning outfits:", error);
            const msg = error instanceof Error ? error.message : "Error al planificar outfits. Intenta de nuevo.";
            setToast({ message: msg, type: "error" });
        } finally {
            setIsPlanning(false);
        }
    };

    const getClothingImage = (itemId: string) => {
        return myClothes.find(c => c.id === itemId);
    };

    if (isLoading || !user) {
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
                <Link href="/dashboard">
                    <button aria-label="Volver" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white hover:bg-zinc-800 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                </Link>
                <span className="text-xs font-bold tracking-[0.2em] uppercase">Outfit Planner</span>
                <div className="w-10 h-10 flex items-center justify-center">
                    <CalendarDays className="w-5 h-5 text-gray-400" />
                </div>
            </header>

            <div className="px-6 space-y-6">
                {myClothes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center opacity-60">
                        <Shirt className="w-16 h-16" />
                        <p className="text-sm">Primero agrega ropa a tu guardarropa.</p>
                        <Button onClick={() => router.push("/my-clothes")} variant="outline" className="mt-4">
                            Ir a Mi Ropa
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Event Type Selection */}
                        <div className="space-y-3">
                            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tipo de Evento</h2>
                            <div className="grid grid-cols-3 gap-2">
                                {EVENT_TYPES.map(evt => (
                                    <button
                                        key={evt.id}
                                        onClick={() => setEventType(evt.id)}
                                        className={cn(
                                            "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all",
                                            eventType === evt.id
                                                ? "bg-white text-black border-white"
                                                : "bg-zinc-900 text-gray-400 border-white/10 hover:border-white/20"
                                        )}
                                    >
                                        <evt.icon className="w-5 h-5" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{evt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-2">
                            <label htmlFor="details" className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                Detalles (opcional)
                            </label>
                            <input
                                id="details"
                                value={eventDetails}
                                onChange={(e) => setEventDetails(e.target.value)}
                                placeholder="Ej: Clima frío, reuniones formales, 3 días..."
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 placeholder:text-gray-600"
                            />
                        </div>

                        {/* Number of outfits */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                Cantidad de outfits
                            </label>
                            <div className="flex gap-2">
                                {[3, 5, 7].map(n => (
                                    <button
                                        key={n}
                                        onClick={() => setNumberOfOutfits(n)}
                                        className={cn(
                                            "flex-1 py-2 rounded-xl border text-sm font-bold transition-all",
                                            numberOfOutfits === n
                                                ? "bg-white text-black border-white"
                                                : "bg-zinc-900 text-gray-400 border-white/10"
                                        )}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="bg-zinc-900/50 rounded-2xl p-4 border border-white/5">
                            <p className="text-xs text-gray-400">
                                <span className="font-bold text-white">{myClothes.length} prendas</span> en tu guardarropa.
                                La IA seleccionará las mejores combinaciones basándose en tu temporada de color <span className="font-bold text-white">{analysis?.season}</span>.
                            </p>
                        </div>

                        {/* Generate Button */}
                        <Button
                            onClick={handlePlan}
                            disabled={isPlanning}
                            isLoading={isPlanning}
                            className="w-full"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            {isPlanning ? "PLANIFICANDO..." : "PLANIFICAR OUTFITS"}
                        </Button>

                        {/* Results */}
                        <AnimatePresence>
                            {outfits.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-4 pt-2"
                                >
                                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        Tu Plan ({outfits.length} outfits)
                                    </h2>

                                    {outfits.map((outfit, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="bg-zinc-900/80 rounded-2xl border border-white/10 overflow-hidden"
                                        >
                                            {/* Outfit header */}
                                            <button
                                                onClick={() => setExpandedOutfit(expandedOutfit === index ? null : index)}
                                                className="w-full p-4 flex items-center justify-between text-left"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold shrink-0">
                                                        {index + 1}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold truncate">{outfit.name}</p>
                                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">{outfit.day}</p>
                                                    </div>
                                                </div>
                                                {expandedOutfit === index ? (
                                                    <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                                                )}
                                            </button>

                                            {/* Expanded content */}
                                            <AnimatePresence>
                                                {expandedOutfit === index && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="px-4 pb-4 space-y-4">
                                                            {/* Description - conversational and motivational */}
                                                            <p className="text-sm text-gray-200 leading-relaxed">{outfit.description}</p>

                                                            {/* Items from wardrobe */}
                                                            {outfit.items && outfit.items.length > 0 && (
                                                                <div className="space-y-2">
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">De tu guardarropa</p>
                                                                    <div className="grid grid-cols-4 gap-2">
                                                                        {outfit.items.map((item, i) => {
                                                                            const clothingItem = getClothingImage(item.id);
                                                                            const CategoryIcon = CATEGORY_ICONS[item.category] || Shirt;
                                                                            return (
                                                                                <div key={i} className="space-y-1">
                                                                                    {clothingItem ? (
                                                                                        <div className="aspect-square rounded-xl overflow-hidden bg-zinc-800 border border-emerald-500/30">
                                                                                            <img
                                                                                                src={clothingItem.url}
                                                                                                alt={item.name}
                                                                                                className="w-full h-full object-cover"
                                                                                            />
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="aspect-square rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center">
                                                                                            <CategoryIcon className="w-6 h-6 text-gray-600" />
                                                                                        </div>
                                                                                    )}
                                                                                    <p className="text-[10px] text-gray-400 truncate text-center">{item.name}</p>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Suggestions - items user doesn't have */}
                                                            {outfit.suggestions && outfit.suggestions.length > 0 && (
                                                                <div className="bg-amber-900/10 rounded-xl p-3 border border-amber-700/20 space-y-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                                                                        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Te falta</p>
                                                                    </div>
                                                                    <ul className="space-y-1">
                                                                        {outfit.suggestions.map((s, i) => (
                                                                            <li key={i} className="text-xs text-amber-200/80 flex items-start gap-2">
                                                                                <span className="text-amber-500 mt-0.5">•</span>
                                                                                {s}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}

                                                            {/* Tip */}
                                                            <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex gap-2.5">
                                                                <Lightbulb className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tip de estilo</p>
                                                                    <p className="text-xs text-gray-300">{outfit.tip}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </div>

            <BottomNav />
        </main>
    );
}
