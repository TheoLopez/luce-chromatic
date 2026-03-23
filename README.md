# LUCE — Verdad Cromática

> Asistente de moda personal impulsado por Inteligencia Artificial: análisis de colorimetría, armario digital y planificador de outfits.

LUCE analiza la foto del usuario para determinar su estación cromática entre 12 arquetipos, entrega una paleta personalizada de colores (power colors, neutros, combinaciones ganadoras, colores bloqueados) y asiste en la construcción de outfits a partir de las prendas del usuario.

---

## Tabla de contenidos

- [Arquitectura general](#arquitectura-general)
- [Tech Stack](#tech-stack)
- [Flujo de la aplicación](#flujo-de-la-aplicación)
- [Mapa de vistas](#mapa-de-vistas)
- [Flujo de datos](#flujo-de-datos)
- [Los 12 arquetipos de colorimetría](#los-12-arquetipos-de-colorimetría)
- [Firebase Setup](#firebase-setup)
- [Variables de entorno](#variables-de-entorno)
- [Desarrollo local](#desarrollo-local)
- [Despliegue](#despliegue)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Issues conocidos](#issues-conocidos)

---

## Arquitectura general

```
┌────────────────────────────────────────────────────────────────────────┐
│                         LUCE Client (Next.js 16)                       │
│                           Static Export → SPA                          │
│                                                                        │
│  /         /camera    /dashboard   /simulator   /my-clothes            │
│  /wardrobe /profile   /planner     /how-it-works                       │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              UserContext (React Context + localStorage)           │  │
│  │  user · analysis · userImage · favorites · myClothes             │  │
│  │  selectedStyles · savedSimulations                               │  │
│  └──────────────────────┬───────────────────────────────────────────┘  │
└─────────────────────────┼──────────────────────────────────────────────┘
                          │
          ┌───────────────┼────────────────────┐
          │               │                    │
   ┌──────▼──────┐ ┌──────▼──────┐   ┌─────────▼────────┐
   │  Firestore  │ │  Firebase   │   │  Firebase Auth   │
   │  /users/uid │ │  Storage    │   │  Google Sign-In  │
   └─────────────┘ └─────────────┘   └──────────────────┘
                          │
                 ┌────────▼────────────┐
                 │   Firebase AI Logic  │
                 │   (Vertex AI back)   │
                 ├──────────────────────┤
                 │ Gemini 2.5 Flash Lite│  ← Análisis, validación, ropa
                 │ Gemini 2.5 Flash Img │  ← Generación de outfit (imagen)
                 └──────────────────────┘
```

### Principios arquitectónicos clave

| Principio | Implementación |
|-----------|----------------|
| **Offline-first / caché local** | `localStorage` almacena análisis, prendas, imagen del usuario y preferencias. Las peticiones a Firestore son de sincronización, no de bloqueo. |
| **Token optimization** | La IA solo clasifica la estación cromática. Los datos de paleta (colores, combinaciones) se toman de `seasonal-palettes.ts` (JSON estático), reduciendo ~60% el consumo de tokens. |
| **No API routes** | El proyecto usa `output: "export"`. Toda la lógica de IA pasa por el SDK de Firebase AI Logic desde el cliente. |
| **Auth guards consistentes** | Cada vista protegida detecta `isLoading + !user` y redirige sin dejar estados muertos. |

---

## Tech Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (`output: "export"` — SPA estático) |
| UI | React 19, Tailwind CSS v4, Framer Motion |
| Íconos | Lucide React |
| Auth | Firebase Auth (Google Sign-In via popup) |
| Base de datos | Firestore (perfiles, análisis, favoritos, prendas) |
| Storage | Firebase Storage (fotos de usuario, prendas, outfits) |
| Caché local | `localStorage` (análisis, prendas, imagen, preferencias) |
| IA — Texto/Visión | Gemini 2.5 Flash Lite vía Firebase AI Logic SDK |
| IA — Generación imagen | Gemini 2.5 Flash Image ("Nano Banana") vía Firebase AI SDK |
| Despliegue | Firebase Hosting |
| Testing | Jest + React Testing Library (69 tests) |
| Lenguaje | TypeScript (strict mode) |

---

## Flujo de la aplicación

### Usuario nuevo
```
/ (Login)
  └─→ /camera (tomar foto)
        └─→ validar iluminación → elegir estilos → analizar
              └─→ /dashboard (paleta de colores personalizada)
```

### Usuario registrado (sesión restaurada)
```
/ (Login)
  └─→ Firestore + localStorage
        └─→ Si tiene análisis → /dashboard (directo, sin pasar por cámara)
        └─→ Si no tiene análisis → /camera
```

### Flujo de análisis
```
Foto capturada
  → validateImageForAnalysis() — Gemini verifica: cara visible, buena luz
  → Selección de 3 estilos preferidos
  → analyzeImage() — Gemini 2.5 Flash Lite
      Devuelve: season, gender, age, bodyType, physicalFeatures
  → getPaletteForSeason(season) — lookup en JSON estático
      Devuelve: powerColors, neutralColors, blockedColors, winningCombinations
  → Merge del resultado → Firestore + localStorage
  → /dashboard
```

### Flujo de generación de outfit
```
Seleccionar ocasión + hora del día [+ prendas del baúl]
  → generateOutfit() — Gemini 2.5 Flash Lite (texto)
      Devuelve: outfitDescription + imagenPrompt + selectedColors
  → Gemini 2.5 Flash Image — genera imagen
      Input: foto del usuario (desde localStorage cache) + prompt
      Preserva identidad facial del usuario
  → Mostrar imagen
  → saveSimulation() → Firestore
  → toggleFavorite() → Firebase Storage + Firestore
```

### Flujo de planificador de outfits
```
Seleccionar evento (oficina / viaje / gimnasio / fiesta / casual / citas)
  + detalles del evento
  + cantidad de outfits (3 / 5 / 7)
  → planOutfits() — Gemini 2.5 Flash Lite
      Input: análisis cromático + lista de prendas del baúl
      Devuelve: array de OutfitPlan (día, nombre, descripción, prendas, tip)
  → Mostrar tarjetas de outfits con descripción narrativa
```

---

## Mapa de vistas

### `/` — Landing / Login
- Botón Google Sign-In → Firebase Auth popup
- "Probar sin cuenta" → acceso anónimo a cámara
- Si el usuario ya tiene análisis → redirige directo a `/dashboard`
- Si tiene cuenta pero sin análisis → redirige a `/camera`

### `/camera` — Cámara inteligente
- Feed de webcam en tiempo real con validación de brillo
- Opción de subir foto desde galería
- Valida la foto con Gemini antes de proceder
- Selección de 3 estilos preferidos (minimalista, bold, clásico, etc.)
- Ejecuta análisis completo → guarda en Firestore + localStorage
- **Accesible sin login** (análisis de sesión para invitados)

### `/dashboard` — Tu Clasificación
- Estación cromática del usuario (ej: "Invierno Profundo")
- Power Colors: grid 5×2 de colores potenciadores
- Colores neutros (4)
- Combinaciones ganadoras (3 paletas)
- Colores bloqueados con explicación
- Accesos directos: Planificador (📅) · Cómo funciona (📖) · Compartir · Re-analizar

### `/how-it-works` — Cómo funciona
- Explicación de qué es la colorimetría personal
- Los dos ejes del sistema: temperatura (cálido/frío) + intensidad (brillante/suave)
- Los 12 arquetipos con barra de color representativa, descripción y guía de para quién aplica

### `/simulator` — Simulador de Outfit
- Foto del usuario como base
- Seleccionar ocasión (8 tipos) + hora del día (3 opciones)
- Opcionalmente incorporar prendas del baúl digital
- Genera imagen de outfit preservando el rostro del usuario (Gemini Flash Image)
- Guardar en baúl, feedback positivo/negativo

### `/wardrobe` → **Mi Baúl** — Outfits guardados
- Grid de outfits favoritos generados en el simulador
- Vista ampliada al hacer clic
- Likes / eliminación
- Filtrar por ocasión

### `/my-clothes` — Mi Ropa
- Capturar prenda con cámara o subir foto
- Gemini analiza y completa: nombre, categoría, color, material, textura, tipo, descripción
- Botón "Guardar" confirma el registro en Storage + Firestore + localStorage
- Acceso directo al Planificador (📅)

### `/planner` — Planificador de Outfits
- Seleccionar tipo de evento y detalles
- Elegir cantidad de outfits (semana corta / semana completa)
- IA combina las prendas del baúl con la paleta del usuario
- Cada outfit incluye: día, nombre, descripción narrativa, prendas sugeridas, tip de estilo
- Indica qué prendas no tiene el usuario pero serían ideales

### `/profile` — Perfil
- Editar información personal (edad, peso, talla, tipo de cuerpo, estación cromática)
- Los cambios se sincronizan en localStorage + Firestore
- Cerrar sesión

---

## Flujo de datos

### Persistencia en Firestore

```
users/{uid}:
  ├── uid, email, displayName, photoURL, updatedAt
  ├── analysis: AnalysisResult
  │     ├── season (ej: "Invierno Profundo")
  │     ├── gender, age, bodyType
  │     ├── physicalFeatures
  │     ├── powerColors[]        ← desde seasonal-palettes.ts
  │     ├── neutralColors[]      ← desde seasonal-palettes.ts
  │     ├── blockedColors[]      ← desde seasonal-palettes.ts
  │     └── winningCombinations[]← desde seasonal-palettes.ts
  ├── selectedStyles: string[]
  ├── userImage: string          (URL de Firebase Storage)
  ├── favorites: FavoriteItem[]
  ├── myClothes: ClothingItem[]
  └── savedSimulations: string[]
```

### localStorage (caché local)

```
luce_cache_{uid}:             ← copia de Firestore (objeto JSON)
luce_userImage_b64:           ← foto del usuario en base64 (evita CORS en Storage)
```

La caché de localStorage se carga primero al iniciar sesión. Firestore actualiza la caché en segundo plano. Si el usuario edita su perfil o clasificación, se actualiza ambos simultáneamente.

### Firebase Storage

```
users/{uid}/
  ├── original.jpg             ← foto de perfil del usuario
  ├── favorites/{id}.jpg       ← outfits guardados
  └── clothes/{id}.jpg         ← prendas del baúl digital
```

---

## Los 12 arquetipos de colorimetría

| Clave | Nombre | Descripción breve |
|-------|--------|------------------|
| `true_winter` | Invierno Verdadero | Alto contraste, colores puros fríos: blanco, negro, rojo, azul royal |
| `deep_winter` | Invierno Profundo | Oscuro y frío: vino, azul marino, ciruela, negro intenso |
| `bright_winter` | Invierno Brillante | Luminoso y saturado: magenta, turquesa, violeta real |
| `true_summer` | Verano Verdadero | Suave y frío: lavanda, azul hielo, rosa empolvado |
| `light_summer` | Verano Claro | Etéreo y frío: blancos suaves, azul polvo, rosados claros |
| `soft_summer` | Verano Suave | Ahumado y neutro-frío: grises, mauves, rosas apagados |
| `true_autumn` | Otoño Verdadero | Terroso y cálido: terracota, oliva, mostaza, camel |
| `deep_autumn` | Otoño Profundo | Oscuro y cálido: chocolate, bordó cálido, verde cazador |
| `soft_autumn` | Otoño Suave | Muted y cálido: crema, camel, salmón polvo, arena |
| `true_spring` | Primavera Verdadera | Cálido y brillante: coral, naranja dorado, verde hoja |
| `light_spring` | Primavera Clara | Delicada y cálida: pasteles melocotón, amarillo mantequilla |
| `bright_spring` | Primavera Brillante | Vívida y cálida: naranja brillante, verde lima, fucsia cálido |

Los datos de paleta (10 power colors, 4 neutros, 3 bloqueados, 3 combinaciones) están en `src/lib/seasonal-palettes.ts`. La IA solo clasifica la estación — los colores se toman del JSON estático para optimizar el consumo de tokens.

---

## Firebase Setup

### Servicios requeridos
1. **Firebase Auth** — Google Sign-In habilitado
2. **Firestore** — Modo nativo, con reglas de seguridad
3. **Firebase Storage** — Para fotos y prendas
4. **Firebase AI Logic** — Backend Vertex AI configurado

### Habilitar Firebase AI Logic + Vertex AI
1. Firebase Console → Build → AI (Firebase AI Logic)
2. Seleccionar backend **Vertex AI**
3. GCP Console → Habilitar APIs:
   - `Vertex AI API`
   - `Firebase Vertex AI API` (`firebasevertexai.googleapis.com`)

### Reglas de Firestore
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Reglas de Storage
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Dominios autorizados en Firebase Auth
Firebase Console → Authentication → Settings → Authorized domains:
- `luce-chromatic-app.web.app`
- `luce-chromatic-app.firebaseapp.com`
- `localhost`

---

## Variables de entorno

Crear `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=<Firebase Web API Key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=luce-chromatic-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=luce-chromatic-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=luce-chromatic-app.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=586272301330
NEXT_PUBLIC_FIREBASE_APP_ID=1:586272301330:web:1b82800e08fef6b4d753cb
```

> **Importante**: `NEXT_PUBLIC_FIREBASE_API_KEY` debe ser la **Firebase Web API Key** (Firebase Console → Project Settings → General). Esta key es diferente a las API keys restringidas de GCP. No la reemplaces con una clave de GCP o se rompe el login.

---

## Desarrollo local

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # 69 tests
npm run build    # Build estático → /out
```

---

## Despliegue

```bash
npm run build
firebase deploy --only hosting
```

El build genera un directorio `/out` con archivos estáticos (HTML/CSS/JS). Firebase Hosting los sirve como SPA.

**Live:** https://luce-chromatic-app.web.app

---

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx                # Landing / Login
│   ├── camera/page.tsx         # Cámara + Análisis cromático
│   ├── dashboard/page.tsx      # Tu Clasificación (paleta de colores)
│   ├── how-it-works/page.tsx   # Guía de colorimetría + 12 arquetipos
│   ├── simulator/page.tsx      # Simulador de outfit (Gemini Image)
│   ├── wardrobe/page.tsx       # Mi Baúl (outfits favoritos)
│   ├── my-clothes/page.tsx     # Mi Ropa (prendas cargadas)
│   ├── planner/page.tsx        # Planificador de outfits
│   └── profile/page.tsx        # Perfil de usuario
├── components/
│   ├── ui/
│   │   ├── BottomNav.tsx       # Navegación inferior
│   │   ├── Button.tsx
│   │   ├── Toast.tsx
│   │   ├── Chip.tsx
│   │   └── ConfirmModal.tsx
│   └── ErrorBoundary.tsx
├── context/
│   └── UserContext.tsx         # Estado global + Firestore/localStorage sync
└── lib/
    ├── firebase.ts             # Inicialización Firebase
    ├── gemini.ts               # Funciones IA (análisis, ropa, outfit, planner)
    ├── gemini-utils.ts         # Retry, JSON parsing, validación
    ├── seasonal-palettes.ts    # Paletas estáticas de los 12 arquetipos
    ├── constants.ts            # Constantes globales (modelos, timeouts)
    └── utils.ts                # cn() helper
```

---

## Issues conocidos

### Login (Google Sign-In)
**Síntoma**: El botón de login falla silenciosamente.

**Solución**:
1. Verificar que `NEXT_PUBLIC_FIREBASE_API_KEY` sea la **Firebase Web API Key** (no una clave GCP restringida).
2. La clave debe tener la **Identity Toolkit API** habilitada.
3. El dominio debe estar en Firebase Auth → Authorized domains.

### Generación de imágenes (Simulador)
**Síntoma**: Error `CONFIGURATION_NOT_FOUND` (400) o `Unauthorized` (401).

**Solución**:
1. GCP Console → APIs → Habilitar `Vertex AI API` y `Firebase Vertex AI API`.
2. Firebase Console → AI Logic → Habilitar backend Vertex AI.
3. La Firebase Web API key debe tener `firebasevertexai.googleapis.com` en su lista de APIs permitidas.

### CORS en Firebase Storage (foto del usuario)
**Síntoma**: Error CORS al intentar descargar la foto del usuario para pasarla a Gemini como base64.

**Solución implementada**: La foto se guarda en `localStorage` como base64 al capturarse (`luce_userImage_b64`). El simulador la lee directamente desde caché, sin hacer fetch a Storage. Esto elimina el problema de CORS por completo.
