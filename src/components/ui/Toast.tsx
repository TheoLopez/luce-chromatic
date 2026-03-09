import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

interface ToastProps {
    message: string;
    isVisible: boolean;
    onClose: () => void;
    type?: "error" | "success" | "info";
    duration?: number;
}

const toastStyles = {
    error: "bg-red-900/90 border-red-800 text-white",
    success: "bg-emerald-900/90 border-emerald-800 text-white",
    info: "bg-zinc-900/90 border-zinc-800 text-white",
};

function ToastIcon({ type }: { type: "error" | "success" | "info" }) {
    if (type === "success") return <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />;
    if (type === "error") return <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />;
    return <Info className="h-4 w-4 text-white/60 shrink-0" />;
}

export function Toast({ message, isVisible, onClose, type = "info", duration = 3000 }: ToastProps) {
    React.useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose, duration]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-[150] w-full max-w-sm px-4"
                    role="alert"
                    aria-live="polite"
                >
                    <div className={cn(
                        "flex items-center gap-3 justify-between rounded-2xl px-4 py-3 shadow-lg backdrop-blur-md border",
                        toastStyles[type]
                    )}>
                        <ToastIcon type={type} />
                        <span className="text-sm font-medium flex-1">{message}</span>
                        <button onClick={onClose} aria-label="Cerrar notificación" className="ml-2 text-white/60 hover:text-white shrink-0">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
