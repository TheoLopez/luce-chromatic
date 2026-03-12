/**
 * Pure utility functions extracted from gemini.ts for testability.
 * No Firebase dependencies.
 */
import { GEMINI_RETRY_ATTEMPTS, GEMINI_RETRY_DELAY_MS } from "./constants";

export function sleep(ms: number) {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export function isRetriableError(error: unknown): boolean {
    if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("503") || msg.includes("502") || msg.includes("network") || msg.includes("fetch")) return true;
        if (msg.includes("400") || msg.includes("401") || msg.includes("403")) return false;
    }
    return true;
}

export async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
    for (let attempt = 1; attempt <= GEMINI_RETRY_ATTEMPTS; attempt++) {
        try {
            return await fn();
        } catch (error) {
            const isLast = attempt === GEMINI_RETRY_ATTEMPTS;
            if (isLast || !isRetriableError(error)) {
                console.error(`[${label}] Failed after ${attempt} attempt(s):`, error);
                throw error;
            }
            const delay = GEMINI_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
            console.warn(`[${label}] Attempt ${attempt} failed, retrying in ${delay}ms...`);
            await sleep(delay);
        }
    }
    throw new Error(`[${label}] Exhausted all retry attempts`);
}

export function parseJsonResponse(text: string): unknown {
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    const toParse = jsonMatch ? jsonMatch[0] : jsonStr;
    return JSON.parse(toParse);
}

export function validateAnalysisResponse(data: unknown): asserts data is Record<string, unknown> {
    if (!data || typeof data !== "object") throw new Error("Respuesta de análisis inválida: no es un objeto.");
    const d = data as Record<string, unknown>;
    const required = ["season", "powerColors", "neutralColors", "blockedColors", "gender", "age", "bodyType"];
    for (const field of required) {
        if (!(field in d)) throw new Error(`Campo requerido faltante en análisis: "${field}"`);
    }
    if (!Array.isArray(d.powerColors) || (d.powerColors as unknown[]).length === 0) {
        throw new Error("powerColors debe ser un array no vacío.");
    }
}

export function validateOutfitPlanResponse(data: unknown): asserts data is { imagenPrompt: string; selectedColors: { name: string; hex: string }[] } {
    if (!data || typeof data !== "object") throw new Error("Respuesta de planificación inválida.");
    const d = data as Record<string, unknown>;
    if (typeof d.imagenPrompt !== "string" || d.imagenPrompt.trim() === "") {
        throw new Error("Campo 'imagenPrompt' faltante o vacío.");
    }
    if (!Array.isArray(d.selectedColors) || (d.selectedColors as unknown[]).length === 0) {
        throw new Error("Campo 'selectedColors' faltante o vacío.");
    }
}

export function validateClothingResponse(data: unknown): asserts data is { description: string; category: string } {
    if (!data || typeof data !== "object") throw new Error("Respuesta de prenda inválida.");
    const d = data as Record<string, unknown>;
    if (typeof d.description !== "string" || d.description.trim() === "") {
        throw new Error("Campo 'description' faltante.");
    }
}
