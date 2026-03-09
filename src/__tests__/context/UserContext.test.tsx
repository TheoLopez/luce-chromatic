import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import { UserProvider, useUser } from "@/context/UserContext";

// ─── Firebase Mocks ────────────────────────────────────────────────────
let authStateCallback: ((user: unknown) => void) | null = null;
const mockUnsubscribe = jest.fn();
const mockSignInWithPopup = jest.fn();
const mockSignOut = jest.fn().mockResolvedValue(undefined);
const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn().mockResolvedValue(undefined);
const mockDoc = jest.fn((db, collection, id) => ({ path: `${collection}/${id}` }));

jest.mock("firebase/auth", () => ({
    onAuthStateChanged: (auth: unknown, callback: (user: unknown) => void) => {
        authStateCallback = callback;
        // Simulate async initial call with null user
        Promise.resolve().then(() => callback(null));
        return mockUnsubscribe;
    },
    signInWithPopup: (...args: unknown[]) => mockSignInWithPopup(...args),
    signOut: (...args: unknown[]) => mockSignOut(...args),
    GoogleAuthProvider: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
    doc: (...args: unknown[]) => mockDoc(...args),
    getDoc: (...args: unknown[]) => mockGetDoc(...args),
    setDoc: (...args: unknown[]) => mockSetDoc(...args),
}));

jest.mock("firebase/storage", () => ({
    ref: jest.fn(),
    uploadString: jest.fn().mockResolvedValue(undefined),
    getDownloadURL: jest.fn().mockResolvedValue("https://storage.example.com/image.jpg"),
}));

jest.mock("@/lib/firebase", () => ({
    auth: {},
    db: {},
    storage: {},
    googleProvider: {},
}));

// ─── Test helpers ──────────────────────────────────────────────────────

const mockFirebaseUser = {
    uid: "uid-001",
    email: "user@test.com",
    displayName: "Test User",
    photoURL: null,
    getIdToken: jest.fn().mockResolvedValue("token"),
};

function TestConsumer() {
    const { user, isLoading, favorites, login, logout } = useUser();
    return (
        <div>
            <span data-testid="loading">{String(isLoading)}</span>
            <span data-testid="user">{user?.email ?? "null"}</span>
            <span data-testid="favorites">{favorites.length}</span>
            <button onClick={login}>login</button>
            <button onClick={logout}>logout</button>
        </div>
    );
}

function renderWithProvider() {
    return render(<UserProvider><TestConsumer /></UserProvider>);
}

// ─── Tests ─────────────────────────────────────────────────────────────

describe("UserProvider", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        authStateCallback = null;
        mockGetDoc.mockResolvedValue({ exists: () => false });
    });

    it("starts with isLoading=true, then false after auth resolves", async () => {
        renderWithProvider();
        // Initially loading
        expect(screen.getByTestId("loading").textContent).toBe("true");
        // After auth callback fires
        await waitFor(() => {
            expect(screen.getByTestId("loading").textContent).toBe("false");
        });
    });

    it("sets user=null when auth returns null", async () => {
        renderWithProvider();
        await waitFor(() => {
            expect(screen.getByTestId("user").textContent).toBe("null");
        });
    });

    it("sets user when auth returns a user", async () => {
        mockGetDoc.mockResolvedValue({ exists: () => false });
        renderWithProvider();

        // Wait for initial null-user auth to complete
        await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

        // Trigger auth callback with a real user
        authStateCallback?.(mockFirebaseUser);

        await waitFor(() => {
            expect(screen.getByTestId("user").textContent).toBe("user@test.com");
        });
    });

    it("loads favorites from Firestore when user logs in", async () => {
        const mockFavorites = [
            { id: "fav-1", url: "https://example.com/img.jpg", occasion: "casual", timestamp: 1000 },
        ];
        mockGetDoc.mockResolvedValue({
            exists: () => true,
            data: () => ({ favorites: mockFavorites }),
        });

        renderWithProvider();
        await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

        authStateCallback?.(mockFirebaseUser);

        await waitFor(() => {
            expect(screen.getByTestId("favorites").textContent).toBe("1");
        });
    });

    it("login calls signInWithPopup", async () => {
        mockSignInWithPopup.mockResolvedValue({ user: mockFirebaseUser });
        renderWithProvider();
        await waitFor(() => screen.getByTestId("loading").textContent === "false");

        await act(async () => {
            screen.getByText("login").click();
        });

        expect(mockSignInWithPopup).toHaveBeenCalledTimes(1);
    });

    it("logout clears user and calls signOut", async () => {
        mockGetDoc.mockResolvedValue({ exists: () => false });
        renderWithProvider();

        // Simulate logged-in user
        await act(async () => { authStateCallback?.(mockFirebaseUser); });
        await waitFor(() => screen.getByTestId("user").textContent === "user@test.com");

        await act(async () => {
            screen.getByText("logout").click();
        });

        expect(mockSignOut).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId("user").textContent).toBe("null");
    });
});

describe("useUser hook", () => {
    it("throws when used outside UserProvider", () => {
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        expect(() => render(<TestConsumer />)).toThrow("useUser must be used within a UserProvider");
        consoleSpy.mockRestore();
    });
});
