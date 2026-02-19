"use client";

import { useState, useRef } from "react";
import { BottomNav } from "@/components/ui/BottomNav";
import { ArrowLeft, Plus, Camera, X, Trash2, Shirt, Scissors, Footprints, Watch } from "lucide-react";
import Link from "next/link";
import { useUser, ClothingItem } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";

import { describeClothingItem } from "@/lib/gemini";
import { Loader2 } from "lucide-react";

export default function MyClothes() {
    const { myClothes, addClothingItem, removeClothingItem, isLoading } = useUser();
    const [isAdding, setIsAdding] = useState(false);
    const [newImage, setNewImage] = useState<string | null>(null);
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState<ClothingItem['category']>('superior');
    const [isSaving, setIsSaving] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [showSourceMenu, setShowSourceMenu] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const categories = [
        { id: 'superior', label: 'Superior', icon: Shirt },
        { id: 'inferior', label: 'Inferior', icon: Scissors },
        { id: 'shoes', label: 'Zapatos', icon: Footprints },
        { id: 'accessories', label: 'Accesorios', icon: Watch },
    ];

    const generateDescription = async (base64Image: string) => {
        setIsAnalyzing(true);
        try {
            const result = await describeClothingItem(base64Image);
            setDescription(result.description);
            if (result.category) {
                setCategory(result.category as any);
            }
        } catch (error) {
            console.error("Failed to generate description", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setNewImage(base64);
                setIsAdding(true);
                setShowSourceMenu(false);
                generateDescription(base64);
            };
            reader.readAsDataURL(file);
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 1280 } }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsCameraOpen(true);
            setShowSourceMenu(false);
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("No se pudo acceder a la cámara. Por favor, verifica los permisos.");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraOpen(false);
    };

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const size = Math.min(video.videoWidth, video.videoHeight);
            canvas.width = size;
            canvas.height = size;

            const ctx = canvas.getContext("2d");
            if (ctx) {
                const sx = (video.videoWidth - size) / 2;
                const sy = (video.videoHeight - size) / 2;
                ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

                const base64Image = canvas.toDataURL("image/jpeg", 0.8);
                setNewImage(base64Image);
                stopCamera();
                setIsAdding(true);
                generateDescription(base64Image);
            }
        }
    };

    const handleSave = async () => {
        if (!newImage || !description) return;
        setIsSaving(true);
        try {
            await addClothingItem({
                imageBase64: newImage,
                category,
                description
            });
            setIsAdding(false);
            setNewImage(null);
            setDescription("");
            setCategory('superior');
        } catch (error) {
            console.error("Failed to save item", error);
        } finally {
            setIsSaving(false);
        }
    };

    const groupedClothes = myClothes.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, ClothingItem[]>);

    return (
        <main className="min-h-screen bg-black text-white pb-32">
            {/* ... existing header and modals ... */}

            {/* Full Screen Image Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedItem(null)}
                        className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-xl flex items-center justify-center overflow-hidden"
                    >
                        <div className="absolute top-6 right-6 flex gap-4 z-50">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm("¿Eliminar esta prenda?")) {
                                        removeClothingItem(selectedItem.id);
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

                        <div className="absolute bottom-10 left-0 right-0 p-6 text-center pointer-events-none">
                            <p className="text-white/80 text-sm font-medium bg-black/50 backdrop-blur-md inline-block px-4 py-2 rounded-full">
                                {selectedItem.description}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="px-6 space-y-8">
                {myClothes.length === 0 && !isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center opacity-50">
                        <Shirt className="w-16 h-16" />
                        <p>No has agregado ropa aún.</p>
                        <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="mt-4">
                            Agregar Primera Prenda
                        </Button>
                    </div>
                ) : (
                    categories.map(cat => {
                        const items = groupedClothes[cat.id] || [];
                        if (items.length === 0) return null;

                        return (
                            <div key={cat.id} className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                    <cat.icon className="w-4 h-4" />
                                    {cat.label}
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {items.map(item => (
                                        <motion.div
                                            layoutId={item.id}
                                            key={item.id}
                                            onClick={() => setSelectedItem(item)}
                                            className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 cursor-pointer"
                                        >
                                            <img src={item.url} alt={item.description} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                                <p className="text-xs text-white line-clamp-2 mb-2">{item.description}</p>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm("¿Eliminar esta prenda?")) {
                                                            removeClothingItem(item.id);
                                                        }
                                                    }}
                                                    className="self-end p-2 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

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
