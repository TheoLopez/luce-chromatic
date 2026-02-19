import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "outline";
    size?: "sm" | "md" | "lg" | "icon";
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
        const variants = {
            primary: "bg-white text-black hover:bg-gray-200 border border-transparent",
            secondary: "bg-gray-800 text-white hover:bg-gray-700 border border-transparent",
            outline: "bg-transparent text-white border border-white hover:bg-white/10",
            ghost: "bg-transparent text-white hover:bg-white/10 border border-transparent",
        };

        const sizes = {
            sm: "h-8 px-3 text-xs",
            md: "h-12 px-6 text-sm font-medium",
            lg: "h-14 px-8 text-base",
            icon: "h-10 w-10 p-2",
        };

        return (
            <button
                className={cn(
                    "inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:pointer-events-none disabled:opacity-50",
                    variants[variant],
                    sizes[size],
                    className
                )}
                ref={ref}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";

export { Button };
