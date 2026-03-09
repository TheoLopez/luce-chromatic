import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

// framer-motion is auto-mocked via moduleNameMapper in jest.config.ts

const defaultProps = {
    isOpen: true,
    title: "¿Eliminar?",
    message: "Esta acción no se puede deshacer.",
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
};

describe("ConfirmModal", () => {
    beforeEach(() => jest.clearAllMocks());

    it("renders title and message when open", () => {
        render(<ConfirmModal {...defaultProps} />);
        expect(screen.getByText("¿Eliminar?")).toBeInTheDocument();
        expect(screen.getByText("Esta acción no se puede deshacer.")).toBeInTheDocument();
    });

    it("does not render when closed", () => {
        render(<ConfirmModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByText("¿Eliminar?")).not.toBeInTheDocument();
    });

    it("calls onConfirm when confirm button clicked", () => {
        render(<ConfirmModal {...defaultProps} />);
        fireEvent.click(screen.getByText("Confirmar"));
        expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });

    it("calls onCancel when cancel button clicked", () => {
        render(<ConfirmModal {...defaultProps} />);
        fireEvent.click(screen.getByText("Cancelar"));
        expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    });

    it("calls onCancel when Escape key pressed", () => {
        render(<ConfirmModal {...defaultProps} />);
        fireEvent.keyDown(document, { key: "Escape" });
        expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    });

    it("uses custom button labels", () => {
        render(<ConfirmModal {...defaultProps} confirmLabel="Sí, eliminar" cancelLabel="No" />);
        expect(screen.getByText("Sí, eliminar")).toBeInTheDocument();
        expect(screen.getByText("No")).toBeInTheDocument();
    });

    it("shows danger icon when danger=true", () => {
        render(<ConfirmModal {...defaultProps} danger={true} />);
        // AlertTriangle icon is rendered — check for svg
        const svgs = document.querySelectorAll("svg");
        expect(svgs.length).toBeGreaterThan(0);
    });

    it("has correct aria attributes", () => {
        render(<ConfirmModal {...defaultProps} />);
        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveAttribute("aria-modal", "true");
        expect(dialog).toHaveAttribute("aria-labelledby", "confirm-title");
    });
});
