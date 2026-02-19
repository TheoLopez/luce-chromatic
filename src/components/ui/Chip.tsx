import * as React from "react";
import { cn } from "@/lib/utils";

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isSelected?: boolean;
}

const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
    ({ className, isSelected, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 border",
                    isSelected
                        ? "bg-white text-black border-white"
                        : "bg-transparent text-gray-400 border-gray-800 hover:text-white hover:border-gray-600",
                    className
                )}
                {...props}
            >
                {children}
            </button>
        );
    }
);
Chip.displayName = "Chip";

export { Chip };
