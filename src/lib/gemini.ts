import { getGenerativeModel, ResponseModality } from "firebase/ai";
import { vertexAI } from "./firebase";
import {
  GEMINI_MODEL,
  GEMINI_IMAGE_GEN_MODEL,
  GEMINI_TIMEOUT_MS,
} from "./constants";
import {
  withRetry,
  parseJsonResponse,
  validateAnalysisResponse,
  validateOutfitPlanResponse,
  validateClothingResponse,
} from "./gemini-utils";
import { getPaletteForSeason } from "./seasonal-palettes";

// ─── Helpers ──────────────────────────────────────────────────────────

const USER_IMAGE_CACHE_KEY = "luce_userImage_b64";

/** Cache a user's base64 image in localStorage for later AI use */
export function cacheUserImageBase64(dataUrl: string) {
  try {
    localStorage.setItem(USER_IMAGE_CACHE_KEY, dataUrl);
  } catch { /* quota exceeded — ignore */ }
}

/** Convert any image to raw base64 + mimeType.
 *  Priority: direct base64 → localStorage cache → error (CORS-safe, no HTTP fetches) */
async function resolveImageToBase64(image: string): Promise<{ data: string; mimeType: string }> {
  // Case 1: Already a base64 data URL (fresh capture)
  if (image.startsWith("data:")) {
    const match = image.match(/^data:(image\/[^;]+);base64,(.+)$/);
    return {
      mimeType: match?.[1] ?? "image/jpeg",
      data: match?.[2] ?? image.split(",")[1],
    };
  }

  // Case 2: Storage URL — check localStorage cache (avoids CORS entirely)
  try {
    const cached = localStorage.getItem(USER_IMAGE_CACHE_KEY);
    if (cached?.startsWith("data:")) {
      const match = cached.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (match) return { mimeType: match[1], data: match[2] };
    }
  } catch { /* localStorage unavailable */ }

  throw new Error("Imagen no disponible. Por favor, vuelve a tomar tu foto en la cámara.");
}

/** Race a promise against a timeout */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label}: tardó más de ${ms / 1000}s. Intenta de nuevo.`)), ms)
    ),
  ]);
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
      "description": "Short personalized description explaining WHY this person belongs to their season, referencing their specific skin tone, hair and eye color in Spanish",
      "physicalFeatures": {
        "skinTone": "Detailed description of skin tone in Spanish",
        "hairColor": "Detailed hair color in Spanish",
        "hairStyle": "Hair style description in Spanish",
        "faceShape": "Face shape description in Spanish",
        "eyeColor": "Eye color in Spanish"
      },
      "luceScore": number (1-100, estimate based on current outfit harmony with their season)
    }
    Focus ONLY on classification and physical features. Color palettes will be applied separately.
    Ensure ALL text is in Spanish.
  `;

  const imagePart = {
    inlineData: { data: base64Image.split(",")[1], mimeType: "image/jpeg" as const },
  };

  return withRetry(async () => {
    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();
    const parsed = parseJsonResponse(text) as Record<string, unknown>;
    validateAnalysisResponse(parsed);

    // Enrich with static palette data — avoids re-generating constant color info
    const palette = getPaletteForSeason(parsed.season as string);
    if (palette) {
      parsed.powerColors = palette.powerColors;
      parsed.neutralColors = palette.neutralColors;
      parsed.blockedColors = palette.blockedColors;
      parsed.winningCombinations = palette.winningCombinations;
    }

    return parsed;
  }, "analyzeImage");
}

export async function describeClothingItem(base64Image: string) {
  const model = getGenerativeModel(vertexAI, { model: GEMINI_MODEL });

  const prompt = `
    Analyze this image of a clothing item in detail.
    Return a JSON object with this EXACT structure (ALL values in SPANISH):
    {
      "name": "Short name of the item (e.g., 'Camisa Oxford', 'Pantalón Chino', 'Zapatillas Deportivas')",
      "description": "A detailed but concise description of the item in Spanish. Focus on color, material, style and distinguishing features.",
      "category": "superior" | "inferior" | "shoes" | "accessories",
      "color": "Primary color(s) of the item in Spanish (e.g., 'Azul marino', 'Negro con rayas blancas', 'Rojo vino')",
      "material": "Main material/fabric in Spanish (e.g., 'Algodón', 'Lino', 'Cuero', 'Poliéster', 'Denim', 'Seda')",
      "texture": "Texture description in Spanish (e.g., 'Lisa', 'Texturizada', 'Acanalada', 'Satinada', 'Rugosa')",
      "type": "Specific garment type in Spanish (e.g., 'Camisa', 'Camiseta', 'Pantalón', 'Falda', 'Vestido', 'Zapatillas', 'Reloj', 'Bolso')"
    }
    IMPORTANT:
    - The category must be one of: "superior", "inferior", "shoes", "accessories"
    - ALL text values must be in Spanish
    - Be specific and accurate about colors, materials and textures
  `;

  const imagePart = {
    inlineData: { data: base64Image.split(",")[1], mimeType: "image/jpeg" as const },
  };

  return withRetry(async () => {
    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();
    const parsed = parseJsonResponse(text);
    validateClothingResponse(parsed);
    return parsed as { name: string; description: string; category: string; color: string; material: string; texture: string; type: string };
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

export interface OutfitPlan {
  day: string;
  name: string;
  description: string;
  items: { id: string; category: string; name: string; color: string }[];
  suggestions: string[];
  tip: string;
}

export async function planOutfits(
  analysis: Record<string, unknown>,
  clothes: { id: string; category: string; name: string; description: string; color: string; material: string; type: string }[],
  eventType: string,
  eventDetails: string,
  numberOfOutfits: number,
): Promise<OutfitPlan[]> {
  const model = getGenerativeModel(vertexAI, { model: GEMINI_MODEL });

  const clothesList = clothes.map(c =>
    `- ID: "${c.id}" | Categoría: ${c.category} | Nombre: ${c.name} | Color: ${c.color} | Material: ${c.material} | Tipo: ${c.type} | Descripción: ${c.description}`
  ).join("\n");

  const genderLabel = analysis.gender === "Mujer" ? "una mujer" : analysis.gender === "Hombre" ? "un hombre" : "una persona";

  const prompt = `
    Eres un estilista personal con mucha personalidad y carisma. Estás asesorando a ${genderLabel} de ${analysis.age} años, cuerpo ${analysis.bodyType}, temporada de color "${analysis.season}".

    Su guardarropa actual tiene estas prendas:
    ${clothesList || "(vacío)"}

    Colores potencia de su temporada: ${JSON.stringify(analysis.powerColors)}

    Necesita ${numberOfOutfits} outfits para: ${eventType}
    ${eventDetails ? `Detalles adicionales: ${eventDetails}` : ""}

    INSTRUCCIONES:
    1. Para cada outfit, escribe una "description" CONVERSACIONAL, MOTIVACIONAL y DETALLADA en español (3-5 oraciones). Ejemplo de tono:
       "¡El lunes es para llegar con actitud y marcar la pauta de la semana! Usa tu blazer rojo para proyectar poder y confianza, combínalo con la camisa blanca por debajo para equilibrar. Un pantalón negro de corte recto mantiene la elegancia, y unos zapatos negros de cuero le dan el toque ejecutivo. Si tienes accesorios dorados, agrégalos — el dorado es tu aliado con tu temporada ${analysis.season}."
    2. Usa las prendas del guardarropa cuando coincidan. Referencia sus IDs exactos en "items".
    3. Si el usuario NO tiene alguna prenda ideal para el outfit, menciónala en "suggestions" como recomendación de compra. Ejemplo: "Blazer rojo de corte estructurado", "Zapatos Oxford negros de cuero".
    4. Varía las combinaciones. No repitas el mismo outfit.
    5. El "tip" debe ser un consejo práctico y personal.
    6. El "day" debe ser relevante al contexto (días de la semana, "Día 1", "Look formal", etc.)

    Responde SOLO con un JSON array:
    [
      {
        "day": "Lunes",
        "name": "Nombre creativo del outfit",
        "description": "Descripción conversacional, motivacional y detallada del outfit completo. Menciona cada prenda, su color, por qué funciona con la temporada del usuario. Si falta alguna prenda sugiérela naturalmente en el texto.",
        "items": [
          { "id": "ID exacto de la prenda del guardarropa", "category": "categoría", "name": "nombre", "color": "color" }
        ],
        "suggestions": ["Prendas que el usuario NO tiene pero que complementarían perfecto este look"],
        "tip": "Consejo de estilismo personal y práctico"
      }
    ]

    IMPORTANTE: "items" solo debe contener prendas que EXISTEN en el guardarropa (con ID real). Las prendas faltantes van en "suggestions". Si el guardarropa está vacío, "items" puede estar vacío y todo va en "suggestions" y en la "description".
  `;

  return withRetry(async () => {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });
    const text = result.response.text();
    const parsed = parseJsonResponse(text);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("Respuesta de planificación inválida: se esperaba un array de outfits.");
    }
    return parsed as OutfitPlan[];
  }, "planOutfits");
}

export async function generateOutfit(
  analysis: Record<string, unknown>,
  occasion: string,
  time: string,
  clothingItems: { category: string; description: string }[] = [],
  userImage: string,
) {
  // ── Step 1: Plan outfit with Gemini (text-only, fast model) ──────────
  const planModel = getGenerativeModel(vertexAI, { model: GEMINI_MODEL });

  const clothingDescriptions = clothingItems
    .map(item => `- ${item.category}: ${item.description}`)
    .join("\n");

  const planningPrompt = `
    You are a professional fashion stylist. Plan a complete outfit for a ${analysis.gender}, approx ${analysis.age} years old, with ${analysis.bodyType} body type.

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
    3. Write a detailed visual description of the COMPLETE outfit — every garment, fabric, texture, color, shoes and accessories. Be extremely specific.

    Return ONLY valid JSON:
    {
      "outfitDescription": "String — Extremely detailed visual description of every garment, color, fabric, texture, shoes and accessories in the outfit",
      "imagenPrompt": "String — Short english prompt for the image generator",
      "selectedColors": [ { "name": "String", "hex": "String" } ]
    }
  `;

  const plan = await withRetry(async () => {
    const result = await planModel.generateContent({
      contents: [{ role: "user", parts: [{ text: planningPrompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });
    const response = result.response.text();
    const parsed = parseJsonResponse(response);
    validateOutfitPlanResponse(parsed);
    return parsed;
  }, "generateOutfit:plan");

  // ── Step 2: Generate image with Gemini (image generation mode) ───────
  // Resolve the user's photo to base64 (works for both data-urls and Storage URLs)
  const userImg = await resolveImageToBase64(userImage);

  // Use Gemini with image generation (Nano Banana — identity-preserving)
  const imageModel = getGenerativeModel(vertexAI, {
    model: GEMINI_IMAGE_GEN_MODEL,
    generationConfig: {
      // TEXT must come first per Firebase AI docs
      responseModalities: [ResponseModality.TEXT, ResponseModality.IMAGE],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  });

  const outfitDesc = (plan as Record<string, unknown>).outfitDescription || plan.imagenPrompt;

  const imagePrompt = `You are a fashion photography AI. Study the reference photo of this person carefully — memorize their exact face, facial structure, skin tone, eye color, hair color, hair style, and body proportions.

Now generate a NEW photorealistic full-body fashion photo of this EXACT same person wearing the following outfit:

${outfitDesc}

IDENTITY PRESERVATION (CRITICAL):
- Same face — identical jawline, nose, eyes, lips, eyebrows
- Same skin tone and complexion
- Same hair color, texture, and style
- Same body type and proportions
- Same approximate age

PHOTO REQUIREMENTS:
- Full-body shot head to toe showing the complete outfit
- High-end fashion photography, studio quality
- Clean elegant background appropriate for "${occasion}" occasion
- "${time}" lighting mood
- Natural confident pose
- Portrait/vertical orientation (9:16 aspect ratio)
- 4K photorealistic quality`;

  const genResult = await withTimeout(
    imageModel.generateContent([
      { inlineData: { data: userImg.data, mimeType: userImg.mimeType } },
      { text: imagePrompt },
    ]),
    GEMINI_TIMEOUT_MS,
    "Generación de imagen",
  );

  // Extract generated image from response parts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parts = (genResult as any).response?.candidates?.[0]?.content?.parts as any[] | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const imgPart = parts?.find((p: any) => p.inlineData?.data);

  if (!imgPart?.inlineData?.data) {
    throw new Error("No se generó imagen. El modelo puede haber rechazado la solicitud por políticas de seguridad. Intenta de nuevo.");
  }

  const outMime = imgPart.inlineData.mimeType || "image/png";
  return {
    image: `data:${outMime};base64,${imgPart.inlineData.data}`,
    colors: plan.selectedColors,
  };
}
