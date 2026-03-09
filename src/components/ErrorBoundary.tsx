"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error("[ErrorBoundary]", error, info.componentStack);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-lg font-bold">Algo salió mal</h2>
                        <p className="text-sm text-gray-400 max-w-xs">
                            Ocurrió un error inesperado. Por favor recarga la página o intenta de nuevo.
                        </p>
                    </div>
                    <button
                        onClick={this.handleReset}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-2xl font-bold text-sm hover:bg-gray-100 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Intentar de nuevo
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
