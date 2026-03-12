// Mock for @/lib/firebase
const mockUser = {
    uid: "test-uid-123",
    email: "test@example.com",
    displayName: "Test User",
    photoURL: null,
    getIdToken: jest.fn().mockResolvedValue("mock-token"),
};

const auth = {
    currentUser: null,
};

const db = {};
const storage = {};
const googleProvider = {};

module.exports = { auth, db, storage, googleProvider };
