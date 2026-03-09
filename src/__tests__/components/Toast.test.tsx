import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Toast } from "@/components/ui/Toast";

// framer-motion is auto-mocked via moduleNameMapper in jest.config.ts

describe("Toast", () => {
    const onClose = jest.fn();

    beforeEach(() => jest.clearAllMocks());

    it("renders message when visible", () => {
        render(<Toast message="Test message" isVisible={true} onClose={onClose} />);
        expect(screen.getByText("Test message")).toBeInTheDocument();
    });

    it("does not render when not visible", () => {
        render(<Toast message="Hidden" isVisible={false} onClose={onClose} />);
        expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
    });

    it("calls onClose when close button clicked", () => {
        render(<Toast message="Test" isVisible={true} onClose={onClose} />);
        fireEvent.click(screen.getByRole("button", { name: /cerrar/i }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("has role=alert and aria-live=polite", () => {
        render(<Toast message="Alert msg" isVisible={true} onClose={onClose} />);
        const alert = screen.getByRole("alert");
        expect(alert).toHaveAttribute("aria-live", "polite");
    });

    it("auto-closes after duration", () => {
        jest.useFakeTimers();
        render(<Toast message="Timed" isVisible={true} onClose={onClose} duration={2000} />);
        act(() => jest.advanceTimersByTime(2000));
        expect(onClose).toHaveBeenCalledTimes(1);
        jest.useRealTimers();
    });

    it("does not auto-close before duration", () => {
        jest.useFakeTimers();
        render(<Toast message="Timed" isVisible={true} onClose={onClose} duration={2000} />);
        act(() => jest.advanceTimersByTime(1999));
        expect(onClose).not.toHaveBeenCalled();
        jest.useRealTimers();
    });

    it("renders success type", () => {
        render(<Toast message="Saved!" isVisible={true} onClose={onClose} type="success" />);
        expect(screen.getByText("Saved!")).toBeInTheDocument();
    });

    it("renders error type", () => {
        render(<Toast message="Error!" isVisible={true} onClose={onClose} type="error" />);
        expect(screen.getByText("Error!")).toBeInTheDocument();
    });
});
