"use client";

import { useState, useEffect } from "react";
import { BottomNav } from "@/components/ui/BottomNav";
import { ArrowLeft, LogOut, Save, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const BODY_TYPES = ["Delgado", "Esbelto", "Atlético", "Grueso"];
const GENDERS = ["Hombre", "Mujer", "No binario"];
const STYLES = [
    "Casual", "Formal", "Trabajo", "Deportivo", "Elegante",
    "Cóctel", "Bohemio", "Minimalista", "Urbano", "Vintage"
];

export default function Profile() {
    const { user, analysis, selectedStyles, setSelectedStyles, updateProfile, logout, isLoading } = useUser();
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        age: 0,
        weight: 0,
        height: 0,
        gender: "",
        bodyType: "",
        glasses: "",
        features: "",
    });

    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (analysis) {
            setFormData({
                age: analysis.age,
                weight: analysis.weight || 0,
                height: analysis.height || 0,
                gender: analysis.gender,
                bodyType: analysis.bodyType,
                glasses: analysis.glasses || "",
                features: analysis.features || "",
            });
        }
    }, [analysis]);

    const handleSave = async () => {
        await updateProfile({
            age: Number(formData.age),
            weight: Number(formData.weight),
            height: Number(formData.height),
            gender: formData.gender,
            bodyType: formData.bodyType,
            glasses: formData.glasses,
            features: formData.features,
        });
        setIsEditing(false);
    };

    const toggleStyle = (style: string) => {
        if (selectedStyles.includes(style)) {
            setSelectedStyles(selectedStyles.filter(s => s !== style));
        } else if (selectedStyles.length < 3) {
            setSelectedStyles([...selectedStyles, style]);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push("/");
    };

    if (isLoading || !user || !analysis) {
        return (
            <main className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white pb-32">
            {/* Header */}
            <header className="p-6 flex justify-between items-center sticky top-0 z-10 bg-black/80 backdrop-blur-md">
                <Link href="/dashboard">
                    <button className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white hover:bg-zinc-800 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                </Link>
                <span className="text-xs font-bold tracking-[0.2em] uppercase">TU PERFIL</span>
                <button
                    onClick={handleLogout}
                    className="w-10 h-10 rounded-full bg-red-900/20 text-red-500 flex items-center justify-center hover:bg-red-900/40 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </header>

            <div className="px-6 space-y-8">
                {/* User Info Card */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-white/5">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-2xl font-bold">
                        {user.displayName ? user.displayName[0] : <UserIcon />}
                    </div>
                    <div>
                        <h2 className="font-bold text-lg">{user.displayName || "Usuario"}</h2>
                        <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Datos Personales</h3>
                        <button
                            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                            className={cn(
                                "text-xs font-bold px-4 py-2 rounded-full transition-colors flex items-center gap-2",
                                isEditing ? "bg-white text-black" : "bg-zinc-900 text-white"
                            )}
                        >
                            {isEditing ? <><Save className="w-3 h-3" /> GUARDAR</> : "EDITAR"}
                        </button>
                    </div>

                    <div className="grid gap-4">
                        <div className="grid grid-cols-3 gap-4">
                            {/* Age */}
                            <div className="space-y-2">
                                <label className="text-xs text-gray-500">Edad</label>
                                <input
                                    type="number"
                                    value={formData.age}
                                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                                    disabled={!isEditing}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 disabled:opacity-50"
                                />
                            </div>
                            {/* Weight */}
                            <div className="space-y-2">
                                <label className="text-xs text-gray-500">Peso (kg)</label>
                                <input
                                    type="number"
                                    value={formData.weight}
                                    onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                                    disabled={!isEditing}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 disabled:opacity-50"
                                />
                            </div>
                            {/* Height */}
                            <div className="space-y-2">
                                <label className="text-xs text-gray-500">Altura (cm)</label>
                                <input
                                    type="number"
                                    value={formData.height}
                                    onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                                    disabled={!isEditing}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 disabled:opacity-50"
                                />
                            </div>
                        </div>

                        {/* Gender */}
                        <div className="space-y-2">
                            <label className="text-xs text-gray-500">Género</label>
                            <div className="flex gap-2">
                                {GENDERS.map(g => (
                                    <button
                                        key={g}
                                        onClick={() => isEditing && setFormData({ ...formData, gender: g })}
                                        disabled={!isEditing}
                                        className={cn(
                                            "flex-1 py-2 rounded-lg text-xs font-medium border transition-all",
                                            formData.gender === g
                                                ? "bg-white text-black border-white"
                                                : "bg-zinc-900 text-gray-400 border-transparent"
                                        )}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Body Type */}
                        <div className="space-y-2">
                            <label className="text-xs text-gray-500">Contextura</label>
                            <div className="grid grid-cols-2 gap-2">
                                {BODY_TYPES.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => isEditing && setFormData({ ...formData, bodyType: type })}
                                        disabled={!isEditing}
                                        className={cn(
                                            "py-2 rounded-lg text-xs font-medium border transition-all",
                                            formData.bodyType === type
                                                ? "bg-white text-black border-white"
                                                : "bg-zinc-900 text-gray-400 border-transparent"
                                        )}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Glasses */}
                        <div className="space-y-2">
                            <label className="text-xs text-gray-500">Gafas / Lentes</label>
                            <input
                                type="text"
                                value={formData.glasses}
                                onChange={(e) => setFormData({ ...formData, glasses: e.target.value })}
                                disabled={!isEditing}
                                placeholder="Ej: Montura negra rectangular, Ninguno"
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 disabled:opacity-50 placeholder:text-gray-600"
                            />
                        </div>

                        {/* Distinctive Features */}
                        <div className="space-y-2">
                            <label className="text-xs text-gray-500">Rasgos Distintivos</label>
                            <input
                                type="text"
                                value={formData.features}
                                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                                disabled={!isEditing}
                                placeholder="Ej: Lunar en mejilla izquierda, Barba corta"
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 disabled:opacity-50 placeholder:text-gray-600"
                            />
                        </div>
                    </div>
                </div>

                {/* Styles Selection */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Estilos Preferidos ({selectedStyles.length}/3)</h3>
                    <div className="flex flex-wrap gap-2">
                        {STYLES.map(style => (
                            <button
                                key={style}
                                onClick={() => toggleStyle(style)}
                                className={cn(
                                    "px-4 py-2 rounded-full text-xs font-bold border transition-all",
                                    selectedStyles.includes(style)
                                        ? "bg-white text-black border-white"
                                        : "bg-zinc-900 text-gray-400 border-white/10"
                                )}
                            >
                                {style}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <BottomNav />
        </main>
    );
}
