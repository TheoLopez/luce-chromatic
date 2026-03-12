"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function CameraError({ reset }: { reset: () => void }) {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center gap-6">
            <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <div className="space-y-2">
                <h2 className="text-lg font-bold">Error en la cámara</h2>
                <p className="text-sm text-gray-400 max-w-xs">
                    No se pudo iniciar la cámara o el análisis. Verifica los permisos e intenta de nuevo.
                </p>
            </div>
            <button
                onClick={reset}
                className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-2xl font-bold text-sm hover:bg-gray-100 transition-colors"
            >
                <RefreshCw className="w-4 h-4" />
                Intentar de nuevo
            </button>
        </div>
    );
}
