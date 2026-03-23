/**
 * Static seasonal color palettes.
 * After the AI classifies a user's season, this data is merged in
 * to avoid re-generating constant color data on every analysis call.
 */

export interface SeasonColor {
  name: string;
  hex: string;
  usage: string;
}

export interface BlockedColor {
  name: string;
  hex: string;
  reason: string;
}

export interface WinningCombo {
  name: string;
  colors: string[];
}

export interface SeasonPalette {
  dominantCharacteristic: string;
  contrast: string;
  powerColors: SeasonColor[];
  neutralColors: SeasonColor[];
  blockedColors: BlockedColor[];
  winningCombinations: WinningCombo[];
}

const PALETTES: Record<string, SeasonPalette> = {
  "Invierno Verdadero": {
    dominantCharacteristic: "Frío y Puro",
    contrast: "Alto",
    powerColors: [
      { name: "Azul Real", hex: "#002366", usage: "Primary" },
      { name: "Blanco Puro", hex: "#FFFFFF", usage: "Primary" },
      { name: "Negro Intenso", hex: "#000000", usage: "Primary" },
      { name: "Rojo Sangre", hex: "#8A0303", usage: "Primary" },
      { name: "Fucsia", hex: "#FF00FF", usage: "Primary" },
      { name: "Verde Esmeralda", hex: "#009B77", usage: "Accent" },
      { name: "Plata", hex: "#C0C0C0", usage: "Accent" },
      { name: "Morado Intenso", hex: "#602D91", usage: "Accent" },
      { name: "Gris Carbón", hex: "#333333", usage: "Accent" },
      { name: "Azul Eléctrico", hex: "#0000FF", usage: "Accent" },
    ],
    neutralColors: [
      { name: "Blanco Puro", hex: "#FFFFFF", usage: "Base" },
      { name: "Negro Profundo", hex: "#000000", usage: "Base" },
      { name: "Gris Carbón", hex: "#333333", usage: "Base" },
      { name: "Plata", hex: "#C0C0C0", usage: "Base" },
    ],
    blockedColors: [
      { name: "Amarillo Dorado", hex: "#FFD700", reason: "Añade calidez que rompe tu armonía fría y pura" },
      { name: "Naranja Oscuro", hex: "#FF8C00", reason: "Demasiado cálido para tu coloración invernal" },
      { name: "Beige", hex: "#F5F5DC", reason: "Apaga tu contraste natural y luminosidad característica" },
    ],
    winningCombinations: [
      { name: "Negro y Blanco", colors: ["#000000", "#FFFFFF"] },
      { name: "Azul Real y Plata", colors: ["#002366", "#C0C0C0"] },
      { name: "Fucsia y Negro", colors: ["#FF00FF", "#000000"] },
    ],
  },

  "Invierno Profundo": {
    dominantCharacteristic: "Oscuro e Intenso",
    contrast: "Alto/Medio-Alto",
    powerColors: [
      { name: "Negro", hex: "#0A0A0A", usage: "Primary" },
      { name: "Azul Marino", hex: "#000080", usage: "Primary" },
      { name: "Berenjena", hex: "#311432", usage: "Primary" },
      { name: "Rojo Vino", hex: "#720000", usage: "Primary" },
      { name: "Verde Pino", hex: "#013220", usage: "Primary" },
      { name: "Chocolate Frío", hex: "#3F2A2B", usage: "Accent" },
      { name: "Gris Grafito", hex: "#404040", usage: "Accent" },
      { name: "Magenta Oscuro", hex: "#8B008B", usage: "Accent" },
      { name: "Verde Bosque", hex: "#228B22", usage: "Accent" },
      { name: "Ciruela", hex: "#4B0082", usage: "Accent" },
    ],
    neutralColors: [
      { name: "Negro Cálido", hex: "#1A1A10", usage: "Base" },
      { name: "Gris Oscuro", hex: "#404040", usage: "Base" },
      { name: "Blanco Óptico", hex: "#F5F5F5", usage: "Base" },
      { name: "Azul Medianoche", hex: "#191970", usage: "Base" },
    ],
    blockedColors: [
      { name: "Amarillo Pálido", hex: "#FDFD96", reason: "Demasiado claro y cálido para tu profundidad natural" },
      { name: "Naranja Rojizo", hex: "#FF4500", reason: "Calidez intensa que desestabiliza tu paleta oscura" },
      { name: "Arena", hex: "#D2B48C", reason: "Tono neutro cálido que apaga tu intensidad característica" },
    ],
    winningCombinations: [
      { name: "Borgoña y Negro", colors: ["#720000", "#0A0A0A"] },
      { name: "Verde Pino y Grafito", colors: ["#013220", "#404040"] },
      { name: "Marino y Blanco", colors: ["#000080", "#F5F5F5"] },
    ],
  },

  "Invierno Brillante": {
    dominantCharacteristic: "Brillante y Saturado",
    contrast: "Alto",
    powerColors: [
      { name: "Azul Cian", hex: "#00FFFF", usage: "Primary" },
      { name: "Magenta", hex: "#FF0090", usage: "Primary" },
      { name: "Amarillo Limón", hex: "#FAFA33", usage: "Primary" },
      { name: "Blanco Óptico", hex: "#F5F5F5", usage: "Primary" },
      { name: "Verde Lima", hex: "#32CD32", usage: "Primary" },
      { name: "Rojo Carmesí", hex: "#DC143C", usage: "Accent" },
      { name: "Turquesa Vívido", hex: "#00CED1", usage: "Accent" },
      { name: "Violeta", hex: "#8F00FF", usage: "Accent" },
      { name: "Negro Brillante", hex: "#050505", usage: "Accent" },
      { name: "Azul Cobalto", hex: "#0047AB", usage: "Accent" },
    ],
    neutralColors: [
      { name: "Blanco Óptico", hex: "#F5F5F5", usage: "Base" },
      { name: "Negro Brillante", hex: "#050505", usage: "Base" },
      { name: "Plata Clara", hex: "#D0D0D0", usage: "Base" },
      { name: "Gris Frío", hex: "#808080", usage: "Base" },
    ],
    blockedColors: [
      { name: "Marrón Tierra", hex: "#8B4513", reason: "Calidez apagada que opaca tu brillo y saturación natural" },
      { name: "Gris Pizarra", hex: "#708090", reason: "Tono neutro apagado que resta el impacto visual de tu paleta" },
      { name: "Oro Viejo", hex: "#B8860B", reason: "Calidez sucia que contradice tu brillo puro y saturado" },
    ],
    winningCombinations: [
      { name: "Blanco y Azul Cobalto", colors: ["#F5F5F5", "#0047AB"] },
      { name: "Negro y Magenta", colors: ["#050505", "#FF0090"] },
      { name: "Carmesí y Blanco", colors: ["#DC143C", "#F5F5F5"] },
    ],
  },

  "Verano Verdadero": {
    dominantCharacteristic: "Frío y Suavizado",
    contrast: "Bajo/Medio-Bajo",
    powerColors: [
      { name: "Azul Cielo", hex: "#87CEEB", usage: "Primary" },
      { name: "Lavanda", hex: "#E6E6FA", usage: "Primary" },
      { name: "Rosa Pastel", hex: "#FFD1DC", usage: "Primary" },
      { name: "Frambuesa", hex: "#E30B5D", usage: "Primary" },
      { name: "Gris Perla", hex: "#E1E1E1", usage: "Primary" },
      { name: "Azul Denim", hex: "#1560BD", usage: "Accent" },
      { name: "Verde Menta", hex: "#98FF98", usage: "Accent" },
      { name: "Ciruela Suave", hex: "#8E4585", usage: "Accent" },
      { name: "Blanco Hueso", hex: "#F8F8FF", usage: "Accent" },
      { name: "Azul Acero", hex: "#B0C4DE", usage: "Accent" },
    ],
    neutralColors: [
      { name: "Blanco Suave", hex: "#F8F8FF", usage: "Base" },
      { name: "Gris Perla", hex: "#E1E1E1", usage: "Base" },
      { name: "Gris Paloma", hex: "#B0B0B0", usage: "Base" },
      { name: "Azul Grisáceo", hex: "#B0C4DE", usage: "Base" },
    ],
    blockedColors: [
      { name: "Negro Puro", hex: "#000000", reason: "Demasiado dramático para la sutileza y suavidad de tu paleta" },
      { name: "Naranja Intenso", hex: "#FF4500", reason: "Calidez intensa que choca con tu tonalidad fría natural" },
      { name: "Amarillo Brillante", hex: "#FFFF00", reason: "Saturación excesiva que sobrecarga tu paleta delicada" },
    ],
    winningCombinations: [
      { name: "Azul Cielo y Gris Perla", colors: ["#87CEEB", "#E1E1E1"] },
      { name: "Rosa Pastel y Denim", colors: ["#FFD1DC", "#1560BD"] },
      { name: "Lavanda y Blanco Hueso", colors: ["#E6E6FA", "#F8F8FF"] },
    ],
  },

  "Verano Claro": {
    dominantCharacteristic: "Claro y Etéreo",
    contrast: "Bajo",
    powerColors: [
      { name: "Rosa Bebé", hex: "#F4C2C2", usage: "Primary" },
      { name: "Azul Polvo", hex: "#B0E0E6", usage: "Primary" },
      { name: "Lila", hex: "#C8A2C8", usage: "Primary" },
      { name: "Verde Mar", hex: "#2E8B57", usage: "Primary" },
      { name: "Amarillo Pálido", hex: "#FFF9E3", usage: "Primary" },
      { name: "Gris Claro", hex: "#D3D3D3", usage: "Accent" },
      { name: "Blanco Crema", hex: "#FFFDD0", usage: "Accent" },
      { name: "Turquesa Suave", hex: "#AFEEEE", usage: "Accent" },
      { name: "Coral Frío", hex: "#FF7F50", usage: "Accent" },
      { name: "Arena", hex: "#ECE2C6", usage: "Accent" },
    ],
    neutralColors: [
      { name: "Blanco Crema", hex: "#FFFDD0", usage: "Base" },
      { name: "Azul Polvo", hex: "#B0E0E6", usage: "Base" },
      { name: "Gris Claro", hex: "#D3D3D3", usage: "Base" },
      { name: "Rosa Empolvado", hex: "#F0E0E0", usage: "Base" },
    ],
    blockedColors: [
      { name: "Negro Puro", hex: "#000000", reason: "Contraste extremo que abruma la delicadeza de tu coloración" },
      { name: "Púrpura Oscuro", hex: "#301934", reason: "Demasiado profundo y oscuro para tu paleta etérea y luminosa" },
      { name: "Naranja", hex: "#FF8C00", reason: "Calidez intensa que choca con tu esencia fresca y suave" },
    ],
    winningCombinations: [
      { name: "Azul Polvo y Crema", colors: ["#B0E0E6", "#FFFDD0"] },
      { name: "Rosa Bebé y Gris Claro", colors: ["#F4C2C2", "#D3D3D3"] },
      { name: "Verde Mar y Arena", colors: ["#2E8B57", "#ECE2C6"] },
    ],
  },

  "Verano Suave": {
    dominantCharacteristic: "Suave y Difuminado",
    contrast: "Bajo",
    powerColors: [
      { name: "Taupe", hex: "#8B8589", usage: "Primary" },
      { name: "Rosa Polvo", hex: "#C08081", usage: "Primary" },
      { name: "Verde Salvia", hex: "#BCB88A", usage: "Primary" },
      { name: "Gris Pizarra", hex: "#708090", usage: "Primary" },
      { name: "Malva", hex: "#E0B0FF", usage: "Primary" },
      { name: "Cacao", hex: "#D2691E", usage: "Accent" },
      { name: "Borgoña Suave", hex: "#800020", usage: "Accent" },
      { name: "Verde Azulado", hex: "#008B8B", usage: "Accent" },
      { name: "Palo de Rosa", hex: "#DDA0DD", usage: "Accent" },
      { name: "Gris Ahumado", hex: "#738276", usage: "Accent" },
    ],
    neutralColors: [
      { name: "Blanco Hueso", hex: "#F8F8F0", usage: "Base" },
      { name: "Taupe", hex: "#8B8589", usage: "Base" },
      { name: "Gris Rosado", hex: "#C0B4B4", usage: "Base" },
      { name: "Gris Ahumado", hex: "#738276", usage: "Base" },
    ],
    blockedColors: [
      { name: "Rojo Puro", hex: "#FF0000", reason: "Demasiado intenso y saturado para tu paleta suave y difuminada" },
      { name: "Blanco Puro", hex: "#F5F5F5", reason: "Contraste excesivo que apaga la armonía natural de tus tonos" },
      { name: "Negro Puro", hex: "#000000", reason: "Dramático y fuerte, incompatible con tu coloración apagada" },
    ],
    winningCombinations: [
      { name: "Rosa Polvo y Taupe", colors: ["#C08081", "#8B8589"] },
      { name: "Verde Salvia y Cacao", colors: ["#BCB88A", "#D2691E"] },
      { name: "Gris Pizarra y Gris Ahumado", colors: ["#708090", "#738276"] },
    ],
  },

  "Otoño Verdadero": {
    dominantCharacteristic: "Cálido y Terroso",
    contrast: "Medio",
    powerColors: [
      { name: "Naranja Quemado", hex: "#CC5500", usage: "Primary" },
      { name: "Verde Oliva", hex: "#808000", usage: "Primary" },
      { name: "Mostaza", hex: "#FFDB58", usage: "Primary" },
      { name: "Terracota", hex: "#E2725B", usage: "Primary" },
      { name: "Dorado", hex: "#D4AF37", usage: "Primary" },
      { name: "Verde Musgo", hex: "#ADDFAD", usage: "Accent" },
      { name: "Cobre", hex: "#B87333", usage: "Accent" },
      { name: "Ocre", hex: "#CC7722", usage: "Accent" },
      { name: "Camello", hex: "#C19A6B", usage: "Accent" },
      { name: "Bronce", hex: "#CD7F32", usage: "Accent" },
    ],
    neutralColors: [
      { name: "Crema Cálida", hex: "#FFF8DC", usage: "Base" },
      { name: "Camello", hex: "#C19A6B", usage: "Base" },
      { name: "Beige", hex: "#F5F5DC", usage: "Base" },
      { name: "Marrón Suave", hex: "#A0785A", usage: "Base" },
    ],
    blockedColors: [
      { name: "Turquesa Pálido", hex: "#AFEEEE", reason: "Demasiado frío y acuoso, contradice tu calidez terrosa" },
      { name: "Negro Puro", hex: "#000000", reason: "Frío e intenso, apaga el calor y brillo de tu coloración" },
      { name: "Rosa Intenso", hex: "#FF69B4", reason: "Tono frío y artificial que contrasta con tu paleta natural" },
    ],
    winningCombinations: [
      { name: "Verde Oliva y Dorado", colors: ["#808000", "#D4AF37"] },
      { name: "Terracota y Camello", colors: ["#E2725B", "#C19A6B"] },
      { name: "Mostaza y Cobre", colors: ["#FFDB58", "#B87333"] },
    ],
  },

  "Otoño Profundo": {
    dominantCharacteristic: "Oscuro y Cálido",
    contrast: "Medio-Alto",
    powerColors: [
      { name: "Chocolate", hex: "#7B3F00", usage: "Primary" },
      { name: "Berenjena Cálida", hex: "#4D0F28", usage: "Primary" },
      { name: "Verde Bosque", hex: "#228B22", usage: "Primary" },
      { name: "Rojo Ladrillo", hex: "#AA4A44", usage: "Primary" },
      { name: "Azul Petróleo", hex: "#005F6A", usage: "Primary" },
      { name: "Negro Cálido", hex: "#1A1A10", usage: "Accent" },
      { name: "Bronce Profundo", hex: "#614126", usage: "Accent" },
      { name: "Ocre Profundo", hex: "#844513", usage: "Accent" },
      { name: "Uva", hex: "#5D3954", usage: "Accent" },
      { name: "Terracota Oscura", hex: "#913831", usage: "Accent" },
    ],
    neutralColors: [
      { name: "Negro Cálido", hex: "#1A1A10", usage: "Base" },
      { name: "Chocolate Oscuro", hex: "#3C1810", usage: "Base" },
      { name: "Camello Profundo", hex: "#8B6914", usage: "Base" },
      { name: "Bronce Oscuro", hex: "#614126", usage: "Base" },
    ],
    blockedColors: [
      { name: "Beige Pálido", hex: "#F5F5DC", reason: "Demasiado claro para tu profundidad y contraste natural" },
      { name: "Azul Bebé", hex: "#89CFF0", reason: "Frío y ligero, contradice tu intensidad y calidez natural" },
      { name: "Lavanda Pálida", hex: "#E6E6FA", reason: "Tono frío y etéreo que drena tu presencia y profundidad" },
    ],
    winningCombinations: [
      { name: "Rojo Ladrillo y Chocolate", colors: ["#AA4A44", "#7B3F00"] },
      { name: "Verde Bosque y Bronce", colors: ["#228B22", "#614126"] },
      { name: "Azul Petróleo y Ocre", colors: ["#005F6A", "#844513"] },
    ],
  },

  "Otoño Suave": {
    dominantCharacteristic: "Suave y Cálido",
    contrast: "Bajo",
    powerColors: [
      { name: "Beige", hex: "#F5F5DC", usage: "Primary" },
      { name: "Verde Militar", hex: "#4B5320", usage: "Primary" },
      { name: "Salmón Suave", hex: "#FA8072", usage: "Primary" },
      { name: "Moca", hex: "#A38068", usage: "Primary" },
      { name: "Caqui", hex: "#C3B091", usage: "Primary" },
      { name: "Oro Mate", hex: "#B8860B", usage: "Accent" },
      { name: "Melocotón", hex: "#FFDAB9", usage: "Accent" },
      { name: "Café con Leche", hex: "#C3A691", usage: "Accent" },
      { name: "Musgo Claro", hex: "#8A9A5B", usage: "Accent" },
      { name: "Crema", hex: "#FFFDD0", usage: "Accent" },
    ],
    neutralColors: [
      { name: "Beige", hex: "#F5F5DC", usage: "Base" },
      { name: "Crema", hex: "#FFFDD0", usage: "Base" },
      { name: "Caqui", hex: "#C3B091", usage: "Base" },
      { name: "Café con Leche", hex: "#C3A691", usage: "Base" },
    ],
    blockedColors: [
      { name: "Negro Puro", hex: "#000000", reason: "Contraste extremo que abruma tu paleta suave y cálida" },
      { name: "Fucsia", hex: "#FF00FF", reason: "Intensidad fría que choca con tu calidez natural difuminada" },
      { name: "Azul Puro", hex: "#0000FF", reason: "Frío e intenso, desequilibra completamente tu paleta cálida" },
    ],
    winningCombinations: [
      { name: "Verde Militar y Beige", colors: ["#4B5320", "#F5F5DC"] },
      { name: "Moca y Crema", colors: ["#A38068", "#FFFDD0"] },
      { name: "Salmón y Caqui", colors: ["#FA8072", "#C3B091"] },
    ],
  },

  "Primavera Verdadera": {
    dominantCharacteristic: "Cálido y Radiante",
    contrast: "Medio-Alto",
    powerColors: [
      { name: "Dorado Amarillo", hex: "#FFD700", usage: "Primary" },
      { name: "Coral", hex: "#FF7F50", usage: "Primary" },
      { name: "Verde Manzana", hex: "#8DB600", usage: "Primary" },
      { name: "Amarillo Girasol", hex: "#FFDA03", usage: "Primary" },
      { name: "Naranja Claro", hex: "#FFA500", usage: "Primary" },
      { name: "Turquesa", hex: "#40E0D0", usage: "Accent" },
      { name: "Melocotón", hex: "#FFCBA4", usage: "Accent" },
      { name: "Verde Césped", hex: "#7CFC00", usage: "Accent" },
      { name: "Rojo Tomate", hex: "#FF6347", usage: "Accent" },
      { name: "Crema", hex: "#FDF5E6", usage: "Accent" },
    ],
    neutralColors: [
      { name: "Marfil", hex: "#FDF5E6", usage: "Base" },
      { name: "Crema Cálida", hex: "#FFFACD", usage: "Base" },
      { name: "Trigo", hex: "#F5DEB3", usage: "Base" },
      { name: "Gris Cálido", hex: "#C8B89A", usage: "Base" },
    ],
    blockedColors: [
      { name: "Gris Carbón", hex: "#36454F", reason: "Demasiado oscuro y frío para tu energía vibrante y cálida" },
      { name: "Negro Puro", hex: "#000000", reason: "Apaga tu luminosidad y frescura natural primaveral" },
      { name: "Azul Marino", hex: "#000080", reason: "Demasiado oscuro y frío para tu paleta cálida y radiante" },
    ],
    winningCombinations: [
      { name: "Coral y Dorado", colors: ["#FF7F50", "#FFD700"] },
      { name: "Verde Manzana y Crema", colors: ["#8DB600", "#FDF5E6"] },
      { name: "Turquesa y Melocotón", colors: ["#40E0D0", "#FFCBA4"] },
    ],
  },

  "Primavera Clara": {
    dominantCharacteristic: "Claro y Cálido",
    contrast: "Medio-Bajo",
    powerColors: [
      { name: "Champán", hex: "#F7E7CE", usage: "Primary" },
      { name: "Verde Aqua", hex: "#66FFD2", usage: "Primary" },
      { name: "Rosa Melocotón", hex: "#F4A460", usage: "Primary" },
      { name: "Amarillo Vainilla", hex: "#F3E5AB", usage: "Primary" },
      { name: "Turquesa Claro", hex: "#AFEEEE", usage: "Primary" },
      { name: "Lavanda Cálida", hex: "#D1D1FF", usage: "Accent" },
      { name: "Albaricoque", hex: "#FBCEB1", usage: "Accent" },
      { name: "Menta", hex: "#BDFCC9", usage: "Accent" },
      { name: "Beige Claro", hex: "#F5F5DC", usage: "Accent" },
      { name: "Gris Cálido", hex: "#B5AD93", usage: "Accent" },
    ],
    neutralColors: [
      { name: "Champán", hex: "#F7E7CE", usage: "Base" },
      { name: "Beige Claro", hex: "#F5F5DC", usage: "Base" },
      { name: "Gris Cálido", hex: "#B5AD93", usage: "Base" },
      { name: "Marfil", hex: "#FFFFF0", usage: "Base" },
    ],
    blockedColors: [
      { name: "Negro Puro", hex: "#000000", reason: "Contraste extremo que apaga tu coloración delicada y luminosa" },
      { name: "Azul Medianoche", hex: "#191970", reason: "Demasiado oscuro e intenso para tu paleta ligera y cálida" },
      { name: "Marrón Oscuro", hex: "#3E2723", reason: "Oscuridad que contradice completamente tu ligereza natural" },
    ],
    winningCombinations: [
      { name: "Champán y Rosa Melocotón", colors: ["#F7E7CE", "#F4A460"] },
      { name: "Verde Aqua y Albaricoque", colors: ["#66FFD2", "#FBCEB1"] },
      { name: "Vainilla y Menta", colors: ["#F3E5AB", "#BDFCC9"] },
    ],
  },

  "Primavera Brillante": {
    dominantCharacteristic: "Brillante y Saturado",
    contrast: "Alto",
    powerColors: [
      { name: "Azul Aqua", hex: "#00FFFF", usage: "Primary" },
      { name: "Fucsia Cálido", hex: "#FF4D88", usage: "Primary" },
      { name: "Verde Neón", hex: "#39FF14", usage: "Primary" },
      { name: "Rojo Amapola", hex: "#FF3800", usage: "Primary" },
      { name: "Coral Vívido", hex: "#FF4040", usage: "Primary" },
      { name: "Amarillo Dorado", hex: "#FFCC00", usage: "Accent" },
      { name: "Cobalto Brillante", hex: "#2A52BE", usage: "Accent" },
      { name: "Violeta Brillante", hex: "#9400D3", usage: "Accent" },
      { name: "Mandarina", hex: "#FF8C00", usage: "Accent" },
      { name: "Blanco Marfil", hex: "#FFFFF0", usage: "Accent" },
    ],
    neutralColors: [
      { name: "Blanco Marfil", hex: "#FFFFF0", usage: "Base" },
      { name: "Blanco Cálido", hex: "#FAFAF0", usage: "Base" },
      { name: "Beige Claro", hex: "#F5F5DC", usage: "Base" },
      { name: "Amarillo Claro", hex: "#FFFACD", usage: "Base" },
    ],
    blockedColors: [
      { name: "Gris Pizarra", hex: "#708090", reason: "Apaga el impacto visual y la energía de tus colores brillantes" },
      { name: "Gris Oscuro", hex: "#A9A9A9", reason: "Neutralidad apagada que resta energía y brillo a tu paleta" },
      { name: "Beige Sucio", hex: "#F5F5DC", reason: "Tono opaco que contradice tu vivacidad y saturación natural" },
    ],
    winningCombinations: [
      { name: "Azul Aqua y Marfil", colors: ["#00FFFF", "#FFFFF0"] },
      { name: "Coral Vívido y Dorado", colors: ["#FF4040", "#FFCC00"] },
      { name: "Rojo Amapola y Blanco", colors: ["#FF3800", "#FFFFF0"] },
    ],
  },
};

export function getPaletteForSeason(season: string): SeasonPalette | null {
  return PALETTES[season] ?? null;
}
