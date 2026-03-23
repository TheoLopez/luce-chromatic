import {
    isRetriableError,
    parseJsonResponse,
    validateAnalysisResponse,
    validateOutfitPlanResponse,
    validateClothingResponse,
    withRetry,
} from "@/lib/gemini-utils";

// ─── isRetriableError ─────────────────────────────────────────────────

describe("isRetriableError()", () => {
    it("retries on 503 errors", () => {
        expect(isRetriableError(new Error("503 Service Unavailable"))).toBe(true);
    });

    it("retries on 502 errors", () => {
        expect(isRetriableError(new Error("502 Bad Gateway"))).toBe(true);
    });

    it("retries on network errors", () => {
        expect(isRetriableError(new Error("network failure"))).toBe(true);
    });

    it("retries on fetch errors", () => {
        expect(isRetriableError(new Error("fetch failed"))).toBe(true);
    });

    it("does NOT retry on 400", () => {
        expect(isRetriableError(new Error("400 Bad Request"))).toBe(false);
    });

    it("does NOT retry on 401", () => {
        expect(isRetriableError(new Error("401 Unauthorized"))).toBe(false);
    });

    it("does NOT retry on 403", () => {
        expect(isRetriableError(new Error("403 Forbidden"))).toBe(false);
    });

    it("retries on unknown errors by default", () => {
        expect(isRetriableError(new Error("something weird"))).toBe(true);
    });

    it("retries on non-Error values", () => {
        expect(isRetriableError("a string error")).toBe(true);
        expect(isRetriableError(null)).toBe(true);
    });
});

// ─── parseJsonResponse ────────────────────────────────────────────────

describe("parseJsonResponse()", () => {
    it("parses plain JSON", () => {
        expect(parseJsonResponse('{"key": "value"}')).toEqual({ key: "value" });
    });

    it("strips markdown json code blocks", () => {
        const input = "```json\n{\"a\": 1}\n```";
        expect(parseJsonResponse(input)).toEqual({ a: 1 });
    });

    it("strips plain code blocks", () => {
        const input = "```\n{\"b\": 2}\n```";
        expect(parseJsonResponse(input)).toEqual({ b: 2 });
    });

    it("extracts JSON from surrounding text", () => {
        const input = 'Here is the result: {"result": true} end.';
        expect(parseJsonResponse(input)).toEqual({ result: true });
    });

    it("throws on invalid JSON", () => {
        expect(() => parseJsonResponse("not json")).toThrow();
    });
});

// ─── validateAnalysisResponse ─────────────────────────────────────────

const validAnalysis = {
    season: "Invierno Profundo",
    gender: "Mujer",
    age: 30,
    bodyType: "Atlético",
};

describe("validateAnalysisResponse()", () => {
    it("passes for valid analysis response", () => {
        expect(() => validateAnalysisResponse(validAnalysis)).not.toThrow();
    });

    it("throws if data is null", () => {
        expect(() => validateAnalysisResponse(null)).toThrow("no es un objeto");
    });

    it("throws if season is missing", () => {
        const { season: _, ...noSeason } = validAnalysis;
        expect(() => validateAnalysisResponse(noSeason)).toThrow('"season"');
    });

    it("throws if gender is missing", () => {
        const { gender: _, ...noGender } = validAnalysis;
        expect(() => validateAnalysisResponse(noGender)).toThrow('"gender"');
    });

    it("throws if age is missing", () => {
        const { age: _, ...noAge } = validAnalysis;
        expect(() => validateAnalysisResponse(noAge)).toThrow('"age"');
    });

    it("throws if bodyType is missing", () => {
        const { bodyType: _, ...noBodyType } = validAnalysis;
        expect(() => validateAnalysisResponse(noBodyType)).toThrow('"bodyType"');
    });
});

// ─── validateOutfitPlanResponse ───────────────────────────────────────

describe("validateOutfitPlanResponse()", () => {
    const valid = {
        imagenPrompt: "A stylish outfit",
        selectedColors: [{ name: "Rojo", hex: "#FF0000" }],
    };

    it("passes for valid outfit plan", () => {
        expect(() => validateOutfitPlanResponse(valid)).not.toThrow();
    });

    it("throws if imagenPrompt is missing", () => {
        expect(() => validateOutfitPlanResponse({ selectedColors: valid.selectedColors })).toThrow("imagenPrompt");
    });

    it("throws if imagenPrompt is empty string", () => {
        expect(() => validateOutfitPlanResponse({ ...valid, imagenPrompt: "   " })).toThrow("imagenPrompt");
    });

    it("throws if selectedColors is empty", () => {
        expect(() => validateOutfitPlanResponse({ ...valid, selectedColors: [] })).toThrow("selectedColors");
    });

    it("throws if data is null", () => {
        expect(() => validateOutfitPlanResponse(null)).toThrow("inválida");
    });
});

// ─── validateClothingResponse ─────────────────────────────────────────

describe("validateClothingResponse()", () => {
    const valid = { description: "Camisa de lino azul", category: "superior" };

    it("passes for valid clothing response", () => {
        expect(() => validateClothingResponse(valid)).not.toThrow();
    });

    it("throws if description is missing", () => {
        expect(() => validateClothingResponse({ category: "superior" })).toThrow("description");
    });

    it("throws if description is empty", () => {
        expect(() => validateClothingResponse({ ...valid, description: "  " })).toThrow("description");
    });

    it("throws if data is null", () => {
        expect(() => validateClothingResponse(null)).toThrow("inválida");
    });
});

// ─── withRetry ────────────────────────────────────────────────────────

describe("withRetry()", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.spyOn(console, "warn").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it("returns result on first success", async () => {
        const fn = jest.fn().mockResolvedValue("ok");
        await expect(withRetry(fn, "test")).resolves.toBe("ok");
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("retries on retriable error and succeeds", async () => {
        const fn = jest
            .fn()
            .mockRejectedValueOnce(new Error("503"))
            .mockResolvedValueOnce("ok");

        const promise = withRetry(fn, "test");
        // Advance timers to bypass sleep(1000)
        await jest.runAllTimersAsync();
        await expect(promise).resolves.toBe("ok");
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it("throws immediately on non-retriable error", async () => {
        const fn = jest.fn().mockRejectedValue(new Error("401 Unauthorized"));
        await expect(withRetry(fn, "test")).rejects.toThrow("401");
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("throws after exhausting all retry attempts", async () => {
        const fn = jest.fn()
            .mockRejectedValueOnce(new Error("503 first"))
            .mockRejectedValueOnce(new Error("503 second"))
            .mockRejectedValueOnce(new Error("503 third"));
        const promise = withRetry(fn, "test");
        // Attach rejection handler BEFORE advancing timers to prevent
        // unhandled rejection warning when promise rejects during timer execution
        const assertion = expect(promise).rejects.toThrow("503");
        await jest.runAllTimersAsync();
        await jest.runAllTimersAsync();
        await assertion;
        // GEMINI_RETRY_ATTEMPTS = 3
        expect(fn).toHaveBeenCalledTimes(3);
    });
});
