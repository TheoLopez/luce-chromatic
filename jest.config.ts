import type { Config } from "jest";

const config: Config = {
    testEnvironment: "jsdom",
    transform: {
        "^.+\\.(ts|tsx|js|jsx)$": ["babel-jest", { configFile: "./babel.config.jest.js" }],
    },
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
        "\\.(css|less|scss|sass)$": "<rootDir>/src/__tests__/__mocks__/styleMock.js",
        "^framer-motion$": "<rootDir>/src/__tests__/__mocks__/framer-motion.js",
    },
    testMatch: ["**/__tests__/**/*.(test|spec).(ts|tsx|js)"],
    setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
};

export default config;
