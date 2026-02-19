import { getGenerativeModel, getImagenModel } from "firebase/ai";
import { vertexAI, auth, projectId, apiKey, storage, storageBucket } from "./firebase";
import { ref, uploadString } from "firebase/storage";

export async function analyzeImage(base64Image: string, styles: string[]) {
  const model = getGenerativeModel(vertexAI, { model: "gemini-2.5-flash-lite" });

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
        "skinTone": "Detailed description of skin tone in Spanish (e.g. Clara con subtonos cálidos, Oscura profunda, Oliva)",
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
    inlineData: {
      data: base64Image.split(",")[1],
      mimeType: "image/jpeg",
    },
  };

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    // Clean up markdown code blocks if present
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}

export async function describeClothingItem(base64Image: string) {
  const model = getGenerativeModel(vertexAI, { model: "gemini-2.5-flash-lite" });

  const prompt = `
    Analyze this image of a clothing item.
    Return a JSON object with this EXACT structure:
    {
      "description": "A detailed but concise description of the item in Spanish (e.g., 'Camisa de lino azul cielo con cuello mao' or 'Pantalones vaqueros rectos de lavado oscuro'). Focus on color, material, and style.",
      "category": "superior" | "inferior" | "shoes" | "accessories"
    }
    IMPORTANT: The category must be one of the specified values.
  `;

  const imagePart = {
    inlineData: {
      data: base64Image.split(",")[1],
      mimeType: "image/jpeg",
    },
  };

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Clothing Description Error:", error);
    throw error;
  }
}

export async function validateImageForAnalysis(base64Image: string) {
  const model = getGenerativeModel(vertexAI, { model: "gemini-2.5-flash-lite" });

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
      "issues": string[] (List of specific issues in Spanish if any, e.g., "La imagen es demasiado oscura", "El rostro no está centrado", "Los ojos están cerrados")
    }
  `;

  const imagePart = {
    inlineData: {
      data: base64Image.split(",")[1],
      mimeType: "image/jpeg",
    },
  };

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Image Validation Error:", error);
    // Fail open if validation errors out, or return generic error
    return { isValid: false, issues: ["Error al validar la imagen. Inténtalo de nuevo."] };
  }
}

export async function generateOutfit(analysis: any, occasion: string, time: string, clothingItems: any[] = [], userImage: string) {
  // Step 1: Use Gemini to plan the outfit and select specific colors
  const model = getGenerativeModel(vertexAI, { model: "gemini-2.5-flash-lite" });

  const clothingDescriptions = clothingItems.map(item => `- ${item.category}: ${item.description}`).join('\n');

  const planningPrompt = `
    You are a professional fashion stylist. Plan a complete outfit for a ${analysis.gender}, approx ${analysis.age} years old, with ${analysis.bodyType} body type.
    
    The user has provided their own photo. You must generate a prompt that edits the clothing in the photo while preserving the user's face and body EXACTLY.
    
    MANDATORY CLOTHING ITEMS (User's own clothes):
    ${clothingDescriptions}
    
    Context:
    - Occasion: "${occasion}"
    - Time of day: "${time}"
    - Color Season: "${analysis.season}"
    - Available Power Colors: ${JSON.stringify(analysis.powerColors)}
    
    Instructions:
    1. Incorporate the MANDATORY CLOTHING ITEMS into the outfit.
    2. Select 3-5 specific colors from the Power Colors list.
    3. Create a prompt for an Image Editing model. The prompt should focus on "Changing the outfit to..." or "Wearing...".
    
    Return ONLY valid JSON:
    {
      "imagenPrompt": "String (The prompt for the image editor)",
      "selectedColors": [ 
        { "name": "String", "hex": "String" } 
      ]
    }
  `;

  let plan;
  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: planningPrompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });
    const response = await result.response.text();

    // Robust JSON extraction
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : response;

    plan = JSON.parse(jsonStr);
  } catch (error) {
    console.error("Outfit Planning Error:", error);
    throw new Error("Failed to plan outfit: " + (error as Error).message);
  }

  // Step 2: Generate/Edit Image using Imagen via Firebase Vertex AI Proxy
  try {
    if (!auth.currentUser) throw new Error("User must be logged in to generate images");
    const token = await auth.currentUser.getIdToken();

    // Determine GCS URI
    let gcsUri: string;

    if (userImage.includes("firebasestorage.googleapis.com")) {
      // Extract GS URI from Firebase Storage URL
      // Format: https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<path>?...
      const matches = userImage.match(/b\/([^/]+)\/o\/([^?]+)/);
      if (matches && matches.length >= 3) {
        const bucket = matches[1];
        const path = decodeURIComponent(matches[2]);
        gcsUri = `gs://${bucket}/${path}`;
      } else {
        // Fallback if regex fails (unlikely if it's a valid FB Storage URL)
        throw new Error("Could not parse Firebase Storage URL");
      }
    } else {
      // Upload local/base64 image to Firebase Storage to get a GCS URI
      const imageRef = ref(storage, `temp/${auth.currentUser.uid}/outfit_input.jpg`);

      let uploadData = userImage;
      let uploadFormat: 'data_url' | 'base64' = 'base64';

      if (userImage.startsWith('data:')) {
        uploadFormat = 'data_url';
      }

      await uploadString(imageRef, uploadData, uploadFormat);
      gcsUri = `gs://${storageBucket}/temp/${auth.currentUser.uid}/outfit_input.jpg`;
    }

    // Use the Firebase Vertex AI proxy endpoint
    const response = await fetch(
      `https://firebasevertexai.googleapis.com/v1beta/projects/${projectId}/locations/us-central1/publishers/google/models/imagen-3.0-generate-001:predict`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Firebase ${token}`,
          "X-Goog-Api-Key": apiKey
        },
        body: JSON.stringify({
          instances: [{
            prompt: plan.imagenPrompt + " -- preserve face details, photorealistic, 8k, exact facial features, same body type",
            image: {
              uri: gcsUri
            }
          }],
          parameters: {
            sampleCount: 1,
            aspectRatio: "9:16",
            personGeneration: "allow_adult",
            safetySettings: [
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_LOW_AND_ABOVE" }
            ]
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vertex AI Imagen Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let imageBase64 = null;

    if (data.predictions && data.predictions[0]) {
      if (data.predictions[0].bytesBase64Encoded) {
        imageBase64 = `data:image/jpeg;base64,${data.predictions[0].bytesBase64Encoded}`;
      } else if (data.predictions[0].b64) {
        imageBase64 = `data:image/jpeg;base64,${data.predictions[0].b64}`;
      }
    }

    if (!imageBase64) throw new Error("No image data in response");

    return {
      image: imageBase64,
      colors: plan.selectedColors
    };

  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
}
