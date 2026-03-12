"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    danger?: boolean;
}

export function ConfirmModal({
    isOpen,
    title,
    message,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    onConfirm,
    onCancel,
    danger = false,
}: ConfirmModalProps) {
    const confirmRef = useRef<HTMLButtonElement>(null);
    const cancelRef = useRef<HTMLButtonElement>(null);

    // Focus first button on open
    useEffect(() => {
        if (isOpen) {
            cancelRef.current?.focus();
        }
    }, [isOpen]);

    // Keyboard: Escape to cancel, Tab trap
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onCancel();
                return;
            }
            if (e.key === "Tab") {
                const focusable = [cancelRef.current, confirmRef.current].filter(Boolean) as HTMLElement[];
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onCancel]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
                    onClick={onCancel}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="confirm-title"
                    aria-describedby="confirm-message"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 10 }}
                        transition={{ type: "spring", damping: 25, stiffness: 350 }}
                        className="bg-zinc-900 border border-white/10 rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {danger && (
                            <div className="w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center mx-auto">
                                <AlertTriangle className="w-6 h-6 text-red-400" />
                            </div>
                        )}

                        <div className="text-center space-y-2">
                            <h2 id="confirm-title" className="font-bold text-lg">{title}</h2>
                            <p id="confirm-message" className="text-sm text-gray-400 leading-relaxed">{message}</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                ref={cancelRef}
                                onClick={onCancel}
                                className="flex-1 py-3 rounded-2xl bg-zinc-800 text-white text-sm font-bold hover:bg-zinc-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                            >
                                {cancelLabel}
                            </button>
                            <button
                                ref={confirmRef}
                                onClick={onConfirm}
                                className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${danger
                                    ? "bg-red-600 text-white hover:bg-red-500"
                                    : "bg-white text-black hover:bg-gray-100"
                                    }`}
                            >
                                {confirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
