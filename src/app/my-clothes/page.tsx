"use client";

import { useState, useRef } from "react";
import { BottomNav } from "@/components/ui/BottomNav";
import { Toast } from "@/components/ui/Toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ArrowLeft, Plus, Camera, X, Trash2, Shirt, Scissors, Footprints, Watch, Upload, AlertCircle, Settings } from "lucide-react";
import Link from "next/link";
import { useUser, ClothingItem } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { describeClothingItem } from "@/lib/gemini";
import { Loader2 } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const categories = [
    { id: 'superior' as const, label: 'Superior', icon: Shirt },
    { id: 'inferior' as const, label: 'Inferior', icon: Scissors },
    { id: 'shoes' as const, label: 'Zapatos', icon: Footprints },
    { id: 'accessories' as const, label: 'Accesorios', icon: Watch },
];

type CameraError = "permission_denied" | "not_available" | "generic" | null;

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
    const [cameraError, setCameraError] = useState<CameraError>(null);
    const [confirmDelete, setConfirmDelete] = useState<ClothingItem | null>(null);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
        setToast({ message, type });
    };

    const generateDescription = async (base64Image: string) => {
        setIsAnalyzing(true);
        try {
            const result = await describeClothingItem(base64Image);
            setDescription(result.description);
            if (result.category) {
                setCategory(result.category as ClothingItem['category']);
            }
        } catch (error) {
            console.error("Failed to generate description", error);
            // Continue with empty description — user can fill it in
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
        setCameraError(null);
        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraError("not_available");
            setShowSourceMenu(false);
            return;
        }
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
            const error = err as DOMException;
            if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
                setCameraError("permission_denied");
            } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
                setCameraError("not_available");
            } else {
                setCameraError("generic");
            }
            setShowSourceMenu(false);
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
            await addClothingItem({ imageBase64: newImage, category, description });
            setIsAdding(false);
            setNewImage(null);
            setDescription("");
            setCategory('superior');
            showToast("Prenda guardada correctamente.", "success");
        } catch (error) {
            console.error("Failed to save item", error);
            showToast("No se pudo guardar la prenda. Intenta de nuevo.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!confirmDelete) return;
        try {
            await removeClothingItem(confirmDelete.id);
            if (selectedItem?.id === confirmDelete.id) setSelectedItem(null);
            showToast("Prenda eliminada.", "info");
        } catch {
            showToast("No se pudo eliminar la prenda.", "error");
        } finally {
            setConfirmDelete(null);
        }
    };

    const groupedClothes = myClothes.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, ClothingItem[]>);

    const cameraErrorMessages: Record<NonNullable<CameraError>, { title: string; body: string }> = {
        permission_denied: {
            title: "Permiso denegado",
            body: "Ve a Configuración > Privacidad > Cámara y permite el acceso a esta app.",
        },
        not_available: {
            title: "Cámara no disponible",
            body: "Tu dispositivo no tiene cámara disponible. Usa la opción de archivo.",
        },
        generic: {
            title: "Error de cámara",
            body: "No se pudo iniciar la cámara. Intenta de nuevo o usa un archivo.",
        },
    };

    return (
        <main className="min-h-screen bg-black text-white pb-32">
            {toast && (
                <Toast message={toast.message} isVisible type={toast.type} onClose={() => setToast(null)} />
            )}

            <ConfirmModal
                isOpen={!!confirmDelete}
                title="Eliminar prenda"
                message="¿Estás seguro de que quieres eliminar esta prenda? Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
                danger
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmDelete(null)}
            />

            {/* Header */}
            <header className="p-6 flex justify-between items-center sticky top-0 z-10 bg-black/80 backdrop-blur-md">
                <Link href="/dashboard">
                    <button aria-label="Volver al inicio" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white hover:bg-zinc-800 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                </Link>
                <span className="text-xs font-bold tracking-[0.2em] uppercase">MI ROPA</span>
                <button
                    aria-label="Agregar prenda"
                    onClick={() => setShowSourceMenu(true)}
                    className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </header>

            {/* Camera Error Banner */}
            {cameraError && (
                <div className="mx-6 mb-4 p-4 bg-amber-900/20 border border-amber-700/30 rounded-2xl flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-amber-300">{cameraErrorMessages[cameraError].title}</p>
                        <p className="text-xs text-amber-400/80 leading-relaxed">{cameraErrorMessages[cameraError].body}</p>
                        <div className="flex gap-3 pt-2">
                            {cameraError === "permission_denied" && (
                                <button
                                    onClick={() => window.open("app-settings:", "_blank")}
                                    className="text-xs text-amber-300 font-bold flex items-center gap-1 underline"
                                >
                                    <Settings className="w-3 h-3" /> Abrir Configuración
                                </button>
                            )}
                            <button
                                onClick={() => { setCameraError(null); fileInputRef.current?.click(); }}
                                className="text-xs text-white font-bold flex items-center gap-1 underline"
                            >
                                <Upload className="w-3 h-3" /> Usar archivo
                            </button>
                            <button onClick={() => setCameraError(null)} className="text-xs text-gray-400">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Source Menu Modal */}
            <AnimatePresence>
                {showSourceMenu && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end"
                        onClick={() => setShowSourceMenu(false)}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="w-full bg-zinc-900 rounded-t-3xl p-6 space-y-4 border-t border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Agregar Prenda</p>
                            <button
                                onClick={startCamera}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                    <Camera className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm">Tomar Foto</p>
                                    <p className="text-xs text-gray-400">Usa la cámara del dispositivo</p>
                                </div>
                            </button>
                            <button
                                onClick={() => { setShowSourceMenu(false); fileInputRef.current?.click(); }}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                    <Upload className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm">Subir Archivo</p>
                                    <p className="text-xs text-gray-400">Selecciona desde la galería</p>
                                </div>
                            </button>
                            <button
                                onClick={() => setShowSourceMenu(false)}
                                className="w-full py-3 text-sm text-gray-400 font-medium"
                            >
                                Cancelar
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Camera Modal */}
            <AnimatePresence>
                {isCameraOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black flex flex-col"
                    >
                        <div className="absolute top-6 right-6 z-10">
                            <button
                                aria-label="Cerrar cámara"
                                onClick={stopCamera}
                                className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="absolute bottom-16 left-0 right-0 flex justify-center">
                            <button
                                aria-label="Capturar foto"
                                onClick={handleCapture}
                                className="w-20 h-20 rounded-full bg-white border-4 border-white/30 shadow-2xl hover:scale-95 transition-transform active:scale-90"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Item Form Modal */}
            <AnimatePresence>
                {isAdding && newImage && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed inset-0 z-50 bg-black flex flex-col"
                    >
                        <header className="p-6 flex justify-between items-center">
                            <button
                                aria-label="Cancelar"
                                onClick={() => { setIsAdding(false); setNewImage(null); setDescription(""); }}
                                className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <span className="text-xs font-bold tracking-[0.2em] uppercase">Nueva Prenda</span>
                            <div className="w-10 h-10" />
                        </header>

                        <div className="flex-1 overflow-y-auto px-6 pb-32 space-y-6">
                            {/* Image Preview */}
                            <div className="aspect-square rounded-2xl overflow-hidden bg-zinc-900">
                                <img src={newImage} alt="Nueva prenda" className="w-full h-full object-cover" />
                            </div>

                            {/* Category */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Categoría</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setCategory(cat.id)}
                                            aria-pressed={category === cat.id}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-xl border transition-all",
                                                category === cat.id
                                                    ? "bg-white text-black border-white"
                                                    : "bg-zinc-900 text-gray-400 border-white/10"
                                            )}
                                        >
                                            <cat.icon className="w-4 h-4" />
                                            <span className="text-sm font-medium">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-3">
                                <label htmlFor="description" className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    Descripción
                                    {isAnalyzing && <span className="ml-2 text-white/50 normal-case font-normal">Analizando con IA...</span>}
                                </label>
                                {isAnalyzing ? (
                                    <div className="flex items-center gap-3 p-4 bg-zinc-900 rounded-xl border border-white/10">
                                        <Loader2 className="w-4 h-4 animate-spin text-white/50" />
                                        <span className="text-sm text-gray-400">Generando descripción...</span>
                                    </div>
                                ) : (
                                    <textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Ej: Camisa azul marino de algodón, estilo formal"
                                        rows={3}
                                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 placeholder:text-gray-600 resize-none"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-black/80 backdrop-blur-md">
                            <Button
                                onClick={handleSave}
                                disabled={isSaving || isAnalyzing || !description}
                                isLoading={isSaving}
                                className="w-full"
                            >
                                GUARDAR PRENDA
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                                aria-label="Eliminar prenda"
                                onClick={(e) => { e.stopPropagation(); setConfirmDelete(selectedItem); }}
                                className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                            >
                                <Trash2 className="w-6 h-6" />
                            </button>
                            <button
                                aria-label="Cerrar vista"
                                onClick={() => setSelectedItem(null)}
                                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                            <ZoomableImage src={selectedItem.url} />
                        </div>

                        <div className="absolute bottom-10 left-0 right-0 p-6 text-center pointer-events-none">
                            <p className="text-white/80 text-sm font-medium bg-black/50 backdrop-blur-md inline-block px-4 py-2 rounded-full">
                                {selectedItem.description}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Main Content */}
            <div className="px-6 space-y-8">
                {isLoading ? (
                    /* Skeleton loaders */
                    <div className="space-y-8">
                        {[0, 1].map(section => (
                            <div key={section} className="space-y-4">
                                <div className="h-4 w-24 bg-zinc-800 rounded-full animate-pulse" />
                                <div className="grid grid-cols-2 gap-4">
                                    {[0, 1, 2, 3].map(i => (
                                        <div key={i} className="aspect-[3/4] rounded-2xl bg-zinc-900 animate-pulse" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : myClothes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center opacity-50">
                        <Shirt className="w-16 h-16" />
                        <p className="text-sm">No has agregado ropa aún.</p>
                        <Button onClick={() => setShowSourceMenu(true)} variant="outline" className="mt-4">
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
                                                    aria-label={`Eliminar ${item.description}`}
                                                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(item); }}
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

function ZoomableImage({ src }: { src: string }) {
    return (
        <div className="w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <TransformWrapper initialScale={1} minScale={1} maxScale={4} centerOnInit wheel={{ step: 0.1 }}>
                {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                        <TransformComponent
                            wrapperStyle={{ width: "100%", height: "100%" }}
                            contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                            <img src={src} alt="Vista completa de la prenda" className="max-w-full max-h-full object-contain" />
                        </TransformComponent>
                        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/50 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 z-50 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => zoomOut()} aria-label="Alejar" className="text-white hover:text-gray-300 text-xl font-bold px-2">-</button>
                            <button onClick={() => resetTransform()} aria-label="Restablecer zoom" className="text-xs text-gray-300 hover:text-white uppercase tracking-wider">Reset</button>
                            <button onClick={() => zoomIn()} aria-label="Acercar" className="text-white hover:text-gray-300 text-xl font-bold px-2">+</button>
                        </div>
                    </>
                )}
            </TransformWrapper>
        </div>
    );
}
