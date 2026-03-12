import React from "react";
import { render, screen } from "@testing-library/react";
import { BottomNav } from "@/components/ui/BottomNav";

// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock("framer-motion", () => require("../__mocks__/framer-motion"));
jest.mock("next/navigation", () => ({ usePathname: jest.fn() }));
jest.mock("next/link", () => {
    const Link = ({ children, href, ...props }: React.PropsWithChildren<{ href: string; [key: string]: unknown }>) =>
        <a href={href} {...props}>{children}</a>;
    Link.displayName = "Link";
    return Link;
});

import { usePathname } from "next/navigation";

describe("BottomNav", () => {
    beforeEach(() => {
        (usePathname as jest.Mock).mockReturnValue("/dashboard");
    });

    it("renders nav with correct role and aria-label", () => {
        render(<BottomNav />);
        const nav = screen.getByRole("navigation");
        expect(nav).toHaveAttribute("aria-label", "Navegación principal");
    });

    it("renders all 5 nav items", () => {
        render(<BottomNav />);
        const links = screen.getAllByRole("link");
        expect(links).toHaveLength(5);
    });

    it("marks active link with aria-current=page", () => {
        render(<BottomNav />);
        const activeLink = screen.getByLabelText("Inicio");
        expect(activeLink).toHaveAttribute("aria-current", "page");
    });

    it("does not mark inactive links with aria-current", () => {
        render(<BottomNav />);
        const inactiveLink = screen.getByLabelText("Perfil");
        expect(inactiveLink).not.toHaveAttribute("aria-current");
    });

    it("each link has an aria-label", () => {
        render(<BottomNav />);
        const labels = ["Inicio", "Simulador", "Mi Ropa", "Favoritos", "Perfil"];
        labels.forEach(label => {
            expect(screen.getByLabelText(label)).toBeInTheDocument();
        });
    });

    it("updates active item when pathname changes", () => {
        (usePathname as jest.Mock).mockReturnValue("/profile");
        render(<BottomNav />);
        expect(screen.getByLabelText("Perfil")).toHaveAttribute("aria-current", "page");
        expect(screen.getByLabelText("Inicio")).not.toHaveAttribute("aria-current");
    });
});
