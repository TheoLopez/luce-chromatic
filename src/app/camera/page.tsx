"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { Camera, Zap, User, Shirt, X, SlidersHorizontal, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { analyzeImage } from "@/lib/gemini";

export default function SmartCamera() {
    const router = useRouter();
    const { user, isLoading, setUserImage, setSelectedStyles, setAnalysis, userImage, analysis } = useUser();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push("/");
            }
            // Removed redirect for existing analysis to allow re-analysis
        }
    }, [user, isLoading, router]);

    const [checks, setChecks] = useState({
        light: false,
        reference: false,
        framing: false,
    });
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [showStylePopup, setShowStylePopup] = useState(false);
    const [tempStyles, setTempStyles] = useState<string[]>([]);

    const STYLES = [
        "Casual", "Formal", "Trabajo", "Deportivo", "Elegante",
        "Cóctel", "Bohemio", "Minimalista", "Urbano", "Vintage"
    ];

    useEffect(() => {
        // Don't start camera if we are analyzing, validating or showing popup
        if (isAnalyzing || isValidating || showStylePopup) return;

        // Initialize Camera
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }
                });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setToastMessage("Error al acceder a la cámara");
                setShowToast(true);
            }
        };

        startCamera();

        // Real-time validation loop
        const checkConditions = () => {
            // Stop loop if analyzing or showing popup
            if (isAnalyzing || isValidating || showStylePopup) return;

            if (videoRef.current && canvasRef.current) {
                const video = videoRef.current;
                const canvas = canvasRef.current;

                // Only check if video is playing
                if (video.readyState === 4) {
                    canvas.width = 100; // Small size for performance
                    canvas.height = 100;
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                        ctx.drawImage(video, 0, 0, 100, 100);
                        const frame = ctx.getImageData(0, 0, 100, 100);
                        const data = frame.data;

                        let totalBrightness = 0;
                        for (let i = 0; i < data.length; i += 4) {
                            // Simple luminance formula
                            totalBrightness += (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
                        }
                        const avgBrightness = totalBrightness / (data.length / 4);

                        // Thresholds: Too dark < 40, Too bright > 230 (approx)
                        const isLightOk = avgBrightness > 40 && avgBrightness < 230;

                        setChecks(prev => ({
                            ...prev,
                            light: isLightOk,
                            framing: true // Auto-pass framing for now
                        }));
                    }
                }
            }
            requestAnimationFrame(checkConditions);
        };

        const animationId = requestAnimationFrame(checkConditions);

        return () => {
            cancelAnimationFrame(animationId);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, [isAnalyzing, isValidating, showStylePopup]);

    const allChecksPassed = checks.light; // Framing is auto-true for now, mainly checking light

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const validateAndProceed = async (base64Image: string) => {
        setIsValidating(true);
        stopCamera();
        try {
            // Import dynamically to avoid circular deps if any, or just use the one imported at top
            const { validateImageForAnalysis } = await import("@/lib/gemini");
            const validation = await validateImageForAnalysis(base64Image);

            if (validation.isValid) {
                setUserImage(base64Image);
                setShowStylePopup(true);
            } else {
                setToastMessage(validation.issues[0] || "La imagen no cumple con los requisitos.");
                setShowToast(true);
                setTimeout(() => setShowToast(false), 4000);
                // Restart camera if needed, or let user try again
                // For now, we just stop validation state, effect will restart camera
            }
        } catch (error) {
            console.error("Validation error:", error);
            setToastMessage("Error al validar la imagen.");
            setShowToast(true);
        } finally {
            setIsValidating(false);
        }
    };

    const handleCaptureClick = () => {
        if (allChecksPassed && videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const base64Image = canvas.toDataURL("image/jpeg", 0.8);
                validateAndProceed(base64Image);
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                validateAndProceed(base64);
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleStyle = (style: string) => {
        if (tempStyles.includes(style)) {
            setTempStyles(prev => prev.filter(s => s !== style));
        } else if (tempStyles.length < 3) {
            setTempStyles(prev => [...prev, style]);
        }
    };

    const handleAnalyze = async () => {
        setShowStylePopup(false);
        setIsAnalyzing(true);
        setSelectedStyles(tempStyles);

        if (userImage) {
            try {
                const result = await analyzeImage(userImage, tempStyles);
                setAnalysis(result);
                router.push("/dashboard");
            } catch (error) {
                console.error("Analysis failed:", error);
                setIsAnalyzing(false);
                setToastMessage("Error en el análisis. Inténtalo de nuevo.");
                setShowToast(true);
            }
        }
    };

    return (
        <main className="relative h-screen w-full bg-black overflow-hidden flex flex-col">
            {/* Style Selection Popup */}
            <AnimatePresence>
                {showStylePopup && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 space-y-8"
                    >
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold text-white">Define tu Estilo</h2>
                            <p className="text-gray-400 text-sm">Selecciona 3 estilos que te identifiquen</p>
                        </div>

                        <div className="flex flex-wrap justify-center gap-3">
                            {STYLES.map(style => (
                                <button
                                    key={style}
                                    onClick={() => toggleStyle(style)}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-sm font-bold border transition-all",
                                        tempStyles.includes(style)
                                            ? "bg-white text-black border-white scale-105"
                                            : "bg-transparent text-white/50 border-white/20 hover:border-white/50"
                                    )}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>

                        <Button
                            onClick={handleAnalyze}
                            disabled={tempStyles.length !== 3}
                            className="w-full max-w-xs bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ANALIZAR COLORIMETRÍA
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Full Screen Loading Overlay */}
            <AnimatePresence>
                {(isAnalyzing || isValidating) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[60] bg-black flex flex-col items-center justify-center text-white space-y-6"
                    >
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full border-t-4 border-l-4 border-white animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 rounded-full bg-white animate-pulse" />
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold tracking-wider">{isValidating ? "VALIDANDO" : "ANALIZANDO"}</h2>
                            <p className="text-gray-400 text-sm animate-pulse">
                                {isValidating ? "Verificando calidad de imagen..." : "Descubriendo tu paleta única..."}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Top Bar - Simplified */}
            {!isAnalyzing && !isValidating && !showStylePopup && (
                <div className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-start">
                    <Link href="/">
                        <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
                            <X className="w-5 h-5" />
                        </button>
                    </Link>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-bold text-white uppercase tracking-wider hover:bg-white/10 transition-colors"
                    >
                        Subir Foto
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                    />
                </div>
            )}

            {/* Toast Notification */}
            <Toast
                message={toastMessage || "Luz insuficiente. Busca un lugar más iluminado."}
                isVisible={showToast || (!checks.light && !isAnalyzing && !isValidating && !showStylePopup)}
                onClose={() => setShowToast(false)}
                type="info"
            />

            {/* Camera Viewfinder */}
            <div className="absolute inset-0 z-0 bg-zinc-900">
                {showStylePopup && userImage ? (
                    <img
                        src={userImage}
                        alt="Captured"
                        className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                )}
                <canvas ref={canvasRef} className="hidden" />

                {/* Overlay Guide - Simplified */}
                {!isAnalyzing && !isValidating && !showStylePopup && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <svg width="100%" height="100%" viewBox="0 0 375 812" className="opacity-50">
                            <defs>
                                <mask id="face-mask">
                                    <rect width="100%" height="100%" fill="white" />
                                    <ellipse cx="187.5" cy="300" rx="120" ry="160" fill="black" />
                                </mask>
                            </defs>
                            <rect width="100%" height="100%" fill="black" mask="url(#face-mask)" fillOpacity="0.6" />
                            <ellipse cx="187.5" cy="300" rx="120" ry="160" stroke={checks.light ? "white" : "red"} strokeWidth="2" strokeDasharray="5 5" fill="none" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            {!isAnalyzing && !isValidating && !showStylePopup && (
                <div className="absolute bottom-0 left-0 right-0 z-20 pb-10 pt-20 px-6 bg-gradient-to-t from-black via-black/80 to-transparent">

                    {/* Indicators - Simplified */}
                    <div className="flex justify-center gap-3 mb-8">
                        <Indicator label="LUZ" icon={Zap} active={checks.light} />
                    </div>

                    {/* Capture Button */}
                    <div className="flex items-center justify-center px-4">
                        <button
                            onClick={handleCaptureClick}
                            disabled={!allChecksPassed || isAnalyzing || isValidating}
                            className={cn(
                                "w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all duration-300",
                                allChecksPassed && !isAnalyzing && !isValidating
                                    ? "border-white bg-white/20 scale-110"
                                    : "border-red-500/50 bg-transparent"
                            )}
                        >
                            {isAnalyzing || isValidating ? (
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            ) : (
                                <div className={cn("w-16 h-16 rounded-full bg-white transition-all duration-300", allChecksPassed ? "scale-100" : "scale-50 opacity-50")} />
                            )}
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}

function Indicator({ label, icon: Icon, active }: { label: string, icon: any, active: boolean }) {
    return (
        <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-500",
            active
                ? "bg-green-500 text-black border-green-500"
                : "bg-black/40 text-white/50 border-white/10"
        )}>
            {active && <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />}
            {!active && <Icon className="w-3 h-3" />}
            <span className="text-xs font-bold tracking-wider">{label}</span>
        </div>
    );
}

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}
