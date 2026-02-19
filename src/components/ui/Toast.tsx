import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ToastProps {
    message: string;
    isVisible: boolean;
    onClose: () => void;
    type?: "error" | "success" | "info";
}

export function Toast({ message, isVisible, onClose, type = "info" }: ToastProps) {
    React.useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(onClose, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
                >
                    <div
                        className={cn(
                            "flex items-center justify-between rounded-lg px-4 py-3 shadow-lg backdrop-blur-md border",
                            type === "error" ? "bg-red-900/80 border-red-800 text-white" : "bg-zinc-900/90 border-zinc-800 text-white"
                        )}
                    >
                        <span className="text-sm font-medium">{message}</span>
                        <button onClick={onClose} className="ml-4 text-white/70 hover:text-white">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
