import { getGenerativeModel } from "firebase/ai";
import { vertexAI, auth, projectId, apiKey, storage, storageBucket } from "./firebase";
import { ref, uploadString } from "firebase/storage";
import {
  GEMINI_MODEL,
  IMAGEN_MODEL,
  GEMINI_RETRY_ATTEMPTS,
  GEMINI_RETRY_DELAY_MS,
  GEMINI_TIMEOUT_MS,
  IMAGEN_QUALITY_SUFFIX,
} from "./constants";

// ─── Helpers ──────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetriableError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    // Retry on network errors or server errors (5xx), not on bad input (4xx)
    if (msg.includes("503") || msg.includes("502") || msg.includes("network") || msg.includes("fetch")) return true;
    if (msg.includes("400") || msg.includes("401") || msg.includes("403")) return false;
  }
  return true; // Default: retry
}

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
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

function parseJsonResponse(text: string): unknown {
  const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  const toParse = jsonMatch ? jsonMatch[0] : jsonStr;
  return JSON.parse(toParse);
}

// ─── Validators ───────────────────────────────────────────────────────

function validateAnalysisResponse(data: unknown): asserts data is Record<string, unknown> {
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

function validateOutfitPlanResponse(data: unknown): asserts data is { imagenPrompt: string; selectedColors: { name: string; hex: string }[] } {
  if (!data || typeof data !== "object") throw new Error("Respuesta de planificación inválida.");
  const d = data as Record<string, unknown>;
  if (typeof d.imagenPrompt !== "string" || d.imagenPrompt.trim() === "") {
    throw new Error("Campo 'imagenPrompt' faltante o vacío.");
  }
  if (!Array.isArray(d.selectedColors) || (d.selectedColors as unknown[]).length === 0) {
    throw new Error("Campo 'selectedColors' faltante o vacío.");
  }
}

function validateClothingResponse(data: unknown): asserts data is { description: string; category: string } {
  if (!data || typeof data !== "object") throw new Error("Respuesta de prenda inválida.");
  const d = data as Record<string, unknown>;
  if (typeof d.description !== "string" || d.description.trim() === "") {
    throw new Error("Campo 'description' faltante.");
  }
}

// ─── Public API ───────────────────────────────────────────────────────

export async function analyzeImage(base64Image: string, styles: string[]) {
  const model = getGenerativeModel(vertexAI, { model: GEMINI_MODEL });

  const prompt = `
    Analyze this image of a person for a professional fashion consultation.
    Return a JSON object with this EXACT structure.
    IMPORTANT: ALL TEXT VALUES MUST BE IN SPANISH.
    {
      "season": "Invierno Profundo" | "Invierno Verdadero" | "Invierno Brillante" | "Verano Claro" | "Verano Verdadero" | "Verano Suave" | "Otoño Suave" | "Otoño Verdadero" | "Otoño Profundo" | "Primavera Brillante" | "Primavera Verdadera" | "Primavera Clara",
      "bodyType": "Delgado" | "Esbelto" | "Atlético" | "Grueso",
      "gender": "Hombre" | "Mujer" | "No binario",
      "age": number (approximate),
      "weight": number (approximate in kg),
      "height": number (approximate in cm),
      "glasses": "Description of glasses if present (frame/color) in Spanish, or 'Ninguno'",
      "features": "Distinctive features (moles, scars, etc.) in Spanish, or 'Ninguna'",
      "description": "Short description of their style in Spanish",
      "physicalFeatures": {
        "skinTone": "Detailed description of skin tone in Spanish",
        "hairColor": "Detailed hair color in Spanish",
        "hairStyle": "Hair style description in Spanish",
        "faceShape": "Face shape description in Spanish",
        "eyeColor": "Eye color in Spanish"
      },
      "powerColors": [
        { "name": "Color Name in Spanish", "hex": "#HEXCODE", "usage": "Primary/Accent" }
      ] (exactly 12 colors),
      "neutralColors": [
        { "name": "Color Name in Spanish", "hex": "#HEXCODE", "usage": "Base" }
      ] (exactly 4 colors),
      "blockedColors": [
        { "name": "Color Name in Spanish", "hex": "#HEXCODE", "reason": "Why to avoid in Spanish" }
      ] (3 colors),
      "winningCombinations": [
        { "name": "Combo Name in Spanish", "colors": ["#HEX1", "#HEX2"] }
      ] (3 combos),
      "luceScore": number (1-100, estimate based on current outfit harmony)
    }
    IMPORTANT: Provide EXACTLY 12 items for 'powerColors' and 4 items for 'neutralColors'. Ensure ALL text is in Spanish.
  `;

  const imagePart = {
    inlineData: { data: base64Image.split(",")[1], mimeType: "image/jpeg" as const },
  };

  return withRetry(async () => {
    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();
    const parsed = parseJsonResponse(text);
    validateAnalysisResponse(parsed);
    return parsed;
  }, "analyzeImage");
}

export async function describeClothingItem(base64Image: string) {
  const model = getGenerativeModel(vertexAI, { model: GEMINI_MODEL });

  const prompt = `
    Analyze this image of a clothing item.
    Return a JSON object with this EXACT structure:
    {
      "description": "A detailed but concise description of the item in Spanish (e.g., 'Camisa de lino azul cielo con cuello mao'). Focus on color, material, and style.",
      "category": "superior" | "inferior" | "shoes" | "accessories"
    }
    IMPORTANT: The category must be one of the specified values.
  `;

  const imagePart = {
    inlineData: { data: base64Image.split(",")[1], mimeType: "image/jpeg" as const },
  };

  return withRetry(async () => {
    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();
    const parsed = parseJsonResponse(text);
    validateClothingResponse(parsed);
    return parsed as { description: string; category: string };
  }, "describeClothingItem");
}

export async function validateImageForAnalysis(base64Image: string) {
  const model = getGenerativeModel(vertexAI, { model: GEMINI_MODEL });

  const prompt = `
    Analyze this image to determine if it is suitable for a professional color analysis.
    Check the following criteria:
    1. Face is clearly visible, centered, and not obstructed.
    2. Eyes are open and visible.
    3. Lighting is adequate (not too dark, not washed out/overexposed).
    4. Image is sharp enough (not blurry).

    Return a JSON object with this EXACT structure:
    {
      "isValid": boolean,
      "issues": string[] (List of specific issues in Spanish if any)
    }
  `;

  const imagePart = {
    inlineData: { data: base64Image.split(",")[1], mimeType: "image/jpeg" as const },
  };

  try {
    return await withRetry(async () => {
      const result = await model.generateContent([prompt, imagePart]);
      const text = result.response.text();
      return parseJsonResponse(text) as { isValid: boolean; issues: string[] };
    }, "validateImageForAnalysis");
  } catch {
    // Fail open so the user can still attempt analysis
    return { isValid: false, issues: ["Error al validar la imagen. Inténtalo de nuevo."] };
  }
}

export async function generateOutfit(analysis: Record<string, unknown>, occasion: string, time: string, clothingItems: { category: string; description: string }[] = [], userImage: string) {
  // Step 1: Plan outfit with Gemini
  const model = getGenerativeModel(vertexAI, { model: GEMINI_MODEL });

  const clothingDescriptions = clothingItems
    .map(item => `- ${item.category}: ${item.description}`)
    .join('\n');

  const planningPrompt = `
    You are a professional fashion stylist. Plan a complete outfit for a ${analysis.gender}, approx ${analysis.age} years old, with ${analysis.bodyType} body type.

    The user has provided their own photo. You must generate a prompt that edits the clothing in the photo while preserving the user's face and body EXACTLY.

    MANDATORY CLOTHING ITEMS (User's own clothes):
    ${clothingDescriptions || "None specified — choose freely from power colors."}

    Context:
    - Occasion: "${occasion}"
    - Time of day: "${time}"
    - Color Season: "${analysis.season}"
    - Available Power Colors: ${JSON.stringify(analysis.powerColors)}

    Instructions:
    1. Incorporate the MANDATORY CLOTHING ITEMS into the outfit.
    2. Select 3-5 specific colors from the Power Colors list.
    3. Create a prompt for an Image Editing model focusing on "Changing the outfit to..." or "Wearing...".

    Return ONLY valid JSON:
    {
      "imagenPrompt": "String (The prompt for the image editor)",
      "selectedColors": [ { "name": "String", "hex": "String" } ]
    }
  `;

  const plan = await withRetry(async () => {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: planningPrompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });
    const response = result.response.text();
    const parsed = parseJsonResponse(response);
    validateOutfitPlanResponse(parsed);
    return parsed;
  }, "generateOutfit:plan");

  // Step 2: Generate image via Vertex AI Imagen with timeout
  if (!auth.currentUser) throw new Error("Usuario no autenticado.");

  const token = await auth.currentUser.getIdToken();

  let gcsUri: string;
  if (userImage.includes("firebasestorage.googleapis.com")) {
    const matches = userImage.match(/b\/([^/]+)\/o\/([^?]+)/);
    if (matches && matches.length >= 3) {
      gcsUri = `gs://${matches[1]}/${decodeURIComponent(matches[2])}`;
    } else {
      throw new Error("No se pudo parsear la URL de Firebase Storage.");
    }
  } else {
    const imageRef = ref(storage, `temp/${auth.currentUser.uid}/outfit_input.jpg`);
    const uploadFormat = userImage.startsWith('data:') ? 'data_url' : 'base64';
    await uploadString(imageRef, userImage, uploadFormat);
    gcsUri = `gs://${storageBucket}/temp/${auth.currentUser.uid}/outfit_input.jpg`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://firebasevertexai.googleapis.com/v1beta/projects/${projectId}/locations/us-central1/publishers/google/models/${IMAGEN_MODEL}:predict`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Firebase ${token}`,
          "X-Goog-Api-Key": apiKey ?? "",
        },
        body: JSON.stringify({
          instances: [{
            prompt: plan.imagenPrompt + IMAGEN_QUALITY_SUFFIX,
            image: { uri: gcsUri },
          }],
          parameters: {
            sampleCount: 1,
            aspectRatio: "9:16",
            personGeneration: "allow_adult",
            safetySettings: [
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_LOW_AND_ABOVE" },
            ],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error de Imagen (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const prediction = data.predictions?.[0];
    const imageBase64 = prediction?.bytesBase64Encoded
      ? `data:image/jpeg;base64,${prediction.bytesBase64Encoded}`
      : prediction?.b64
        ? `data:image/jpeg;base64,${prediction.b64}`
        : null;

    if (!imageBase64) throw new Error("Sin datos de imagen en la respuesta.");

    return { image: imageBase64, colors: plan.selectedColors };

  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("La generación tardó demasiado. Intenta de nuevo.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
