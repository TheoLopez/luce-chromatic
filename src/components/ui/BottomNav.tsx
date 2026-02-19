"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Palette, Shirt, User, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
    const pathname = usePathname();

    const items = [
        { icon: Home, label: "Home", href: "/dashboard" },
        { icon: Palette, label: "Simulator", href: "/simulator" },
        { icon: Shirt, label: "Mi Ropa", href: "/my-clothes" },
        { icon: Heart, label: "Favoritos", href: "/wardrobe" },
        { icon: User, label: "Profile", href: "/profile" },
    ];

    return (
        <div className="fixed bottom-6 left-6 right-6 h-16 bg-white rounded-full flex items-center justify-between px-8 shadow-2xl z-50">
            {items.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link key={item.href} href={item.href}>
                        <div className={cn(
                            "flex flex-col items-center justify-center w-10 h-10 transition-colors",
                            isActive ? "text-black" : "text-gray-400 hover:text-gray-600"
                        )}>
                            <item.icon className={cn("w-6 h-6", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />
                            {isActive && <div className="absolute -bottom-1 w-1 h-1 bg-black rounded-full" />}
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
