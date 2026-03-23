// ─── Gemini / Vertex AI ───────────────────────────────────────────────
export const GEMINI_MODEL = "gemini-2.5-flash-lite" as const;
// "Nano Banana" — GA model with identity preservation from reference photos
export const GEMINI_IMAGE_GEN_MODEL = "gemini-2.5-flash-image" as const;

// ─── AI Reliability ───────────────────────────────────────────────────
export const GEMINI_RETRY_ATTEMPTS = 3;
export const GEMINI_RETRY_DELAY_MS = 1000;
export const GEMINI_TIMEOUT_MS = 30_000;

// ─── Camera / Image Analysis ──────────────────────────────────────────
export const BRIGHTNESS_MIN = 40;
export const BRIGHTNESS_MAX = 230;
export const CANVAS_ANALYSIS_SIZE = 100;
export const IMAGE_QUALITY = 0.8;
export const IMAGE_CAPTURE_WIDTH = 1280;
export const IMAGE_CAPTURE_HEIGHT = 1280;

// ─── UI / Styles ──────────────────────────────────────────────────────
export const MAX_SELECTED_STYLES = 3;
export const MAX_POWER_COLORS = 12;
export const MAX_NEUTRAL_COLORS = 4;
export const MAX_BLOCKED_COLORS = 3;
export const MAX_COMBINATIONS = 3;
export const TOAST_DURATION_MS = 3000;

// ─── Profile Validation ───────────────────────────────────────────────
export const AGE_MIN = 1;
export const AGE_MAX = 120;
export const WEIGHT_MIN_KG = 20;
export const WEIGHT_MAX_KG = 500;
export const HEIGHT_MIN_CM = 50;
export const HEIGHT_MAX_CM = 250;

