"use client";

import Link from "next/link";
import { Sparkles, LogIn } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, login, isLoading, analysis } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        if (analysis) {
          router.push("/dashboard");
        } else {
          router.push("/camera");
        }
      }
    }
  }, [user, isLoading, analysis, router]);

  if (isLoading) {
    return (
      <main className="h-screen w-full bg-black text-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
      </main>
    );
  }

  return (
    <main className="h-screen w-full bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Ambience - Neutral */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.05),_rgba(0,0,0,1))]" />
      <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] animate-pulse delay-1000" />

      <div className="relative z-10 flex flex-col items-center text-center space-y-12 max-w-sm w-full px-6">

        {/* Hero Section */}
        <div className="space-y-6 flex flex-col items-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-white/10 to-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
            <Sparkles className="w-10 h-10 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
          </div>

          <div className="space-y-2">
            <h1 className="text-6xl font-black tracking-tighter bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent">
              LUCE
            </h1>
            <div className="h-px w-12 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto" />
            <p className="text-gray-400 text-xs font-bold tracking-[0.3em] uppercase pt-2">
              Verdad Cromática
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-400 text-sm leading-relaxed max-w-[280px]">
          Descubre tu paleta ideal y visualiza tu mejor versión con inteligencia artificial.
        </p>

        {/* Actions */}
        <div className="w-full space-y-4">
          <button
            onClick={login}
            className="w-full bg-white text-black h-14 rounded-2xl font-bold tracking-wide hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
          >
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <LogIn className="w-4 h-4 text-black" />
            </div>
            CONTINUAR CON GOOGLE
          </button>

          <Link href="/camera" className="block">
            <button className="w-full h-12 rounded-2xl font-medium text-xs text-gray-500 hover:text-white hover:bg-white/5 transition-colors tracking-widest uppercase">
              Probar sin cuenta
            </button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-[10px] text-gray-600 font-medium tracking-widest uppercase">
        Powered by Gemini 2.0
      </div>
    </main>
  );
}
