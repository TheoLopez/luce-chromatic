"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Palette, User, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

function HangerIcon({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7l8 6a1.5 1.5 0 0 1-.9 2.7H3.9A1.5 1.5 0 0 1 3 13l8-6V5.73A2 2 0 0 1 12 2z" />
            <path d="M3 20h18" />
        </svg>
    );
}

const items = [
    { icon: Home, label: "Inicio", href: "/dashboard" },
    { icon: Palette, label: "Simulador", href: "/simulator" },
    { icon: HangerIcon, label: "Mi Ropa", href: "/my-clothes" },
    { icon: Heart, label: "Mi Baúl", href: "/wardrobe" },
    { icon: User, label: "Perfil", href: "/profile" },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav
            role="navigation"
            aria-label="Navegación principal"
            className="fixed bottom-6 left-6 right-6 h-16 bg-white rounded-full flex items-center justify-between px-8 shadow-2xl z-50"
        >
            {items.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        aria-label={item.label}
                        aria-current={isActive ? "page" : undefined}
                    >
                        <div className={cn(
                            "flex flex-col items-center justify-center w-10 h-10 transition-colors",
                            isActive ? "text-black" : "text-gray-400 hover:text-gray-600"
                        )}>
                            <item.icon
                                className={cn("w-6 h-6", isActive && "fill-current")}
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            {isActive && <div className="absolute -bottom-1 w-1 h-1 bg-black rounded-full" />}
                        </div>
                    </Link>
                );
            })}
        </nav>
    );
}
