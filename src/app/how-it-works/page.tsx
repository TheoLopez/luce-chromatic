"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const SEASONS = [
    {
        key: "true_winter",
        name: "Invierno Verdadero",
        emoji: "❄️",
        tagline: "Contraste máximo, impacto total",
        palette: ["#0D0D0D", "#FFFFFF", "#C8102E", "#000080", "#00205B"],
        description:
            "El contraste es tu superpoder. Tu coloración es la más dramática de todas: piel muy clara u oscura con tonos fríos y neutros, cabello oscuro y ojos intensos. Los colores puros y de alto contraste —blanco puro, negro profundo, rojo verdadero, azul royal y fucsia eléctrico— te hacen lucir poderosa y definida. Evita tonos apagados o cálidos que te robarán presencia.",
        for: "Piel con subtono frío y neutro, contrastes altos entre piel, cabello y ojos.",
    },
    {
        key: "deep_winter",
        name: "Invierno Profundo",
        emoji: "🌑",
        tagline: "Oscuro, rico y magnético",
        palette: ["#1A0A2E", "#4B0082", "#191970", "#8B0000", "#2C3E50"],
        description:
            "Eres oscura en todo sentido: piel con subtonos profundos y fríos, cabello muy oscuro, mirada intensa. Los colores más ricos y saturados del espectro frío te favorecen: vino profundo, azul marino oscuro, ciruela, verde bosque oscuro y negro intenso. Compartís características con el Otoño Profundo (calor) pero tu versión se inclina al lado frío.",
        for: "Piel morena oscura o muy clara con subtonos neutros/fríos, cabello y ojos muy oscuros.",
    },
    {
        key: "bright_winter",
        name: "Invierno Brillante",
        emoji: "✨",
        tagline: "Luminosa y vibrante",
        palette: ["#FF1493", "#00FFFF", "#7B2FBE", "#FF6600", "#00C2C7"],
        description:
            "Compartís el brillo del Primavera y el frío del Invierno. Tu coloración es clara y luminosa, con ojos muy vivos y brillantes —verdes, azules o castañas intensas— que capturan la atención. Los colores saturados y joya te sientan: magenta, turquesa, verde esmeralda, violeta real y naranja eléctrico. Los pasteles o tonos apagados te apagan.",
        for: "Subtonos fríos con ojos muy claros y brillantes, alto contraste y mucha vivacidad.",
    },
    {
        key: "true_summer",
        name: "Verano Verdadero",
        emoji: "🌸",
        tagline: "Suave, romántico y delicado",
        palette: ["#B0C4DE", "#DDA0DD", "#C0D8C0", "#E6D5E8", "#87CEEB"],
        description:
            "Eres el arquetipo más suave y difuminado. Tu coloración tiene subtonos fríos pero sin contraste fuerte: piel rosada o beige con venas azuladas, cabello entre rubio ceniza y castaño claro, ojos azules, grises o verdes suaves. Los colores empolvados, grises rosados, lavandas y azules hielo son tu lenguaje. Los colores muy saturados o cálidos te compiten.",
        for: "Subtonos fríos, bajo contraste general, apariencia suave y difuminada.",
    },
    {
        key: "light_summer",
        name: "Verano Claro",
        emoji: "🌬️",
        tagline: "Aérea, luminosa y fresca",
        palette: ["#F0F8FF", "#E0EEF5", "#C9DDE8", "#D8C8E8", "#F5DEB3"],
        description:
            "Compartís la ligereza del Primavera Claro pero con subtonos fríos. Tu coloración es muy clara y delicada: piel casi traslúcida, cabello rubio claro o castaño muy suave, ojos claros. Los blancos suaves, azules polvo, lavandas muy claras y rosados empolvados son tu paleta. Evitá colores oscuros o muy saturados que te pesan.",
        for: "Muy alta luminosidad, subtonos fríos, coloración extremadamente clara y etérea.",
    },
    {
        key: "soft_summer",
        name: "Verano Suave",
        emoji: "🌫️",
        tagline: "Ahumada, sofisticada y neutral",
        palette: ["#9E9E9E", "#B8B8D0", "#C8B8A8", "#A8B8A8", "#D8C8B8"],
        description:
            "La más neutra de todas las estaciones. Compartís suavidad con el Otoño Suave pero tu versión se inclina al frío. Piel con tono neutro-frío, cabello castaño o rubio oscuro apagado, ojos grises, verdes suaves o castañas sin mucho brillo. Los tonos terrosos fríos, grises, mauves y rosas ahumados son tu zona de confort. Evitá extremos: ni muy claros ni muy oscuros.",
        for: "Neutro-frío, bajo contraste, coloración muy muted sin brillo ni saturación.",
    },
    {
        key: "true_autumn",
        name: "Otoño Verdadero",
        emoji: "🍂",
        tagline: "Terrosa, auténtica y poderosa",
        palette: ["#8B4513", "#D2691E", "#DAA520", "#556B2F", "#8B7355"],
        description:
            "La esencia del otoño: cobres, terracota, oliva, mostaza y camel son tus colores naturales. Tu coloración es marcadamente cálida: piel con subtonos dorados o cobrizos, cabello castaño rojizo, pelirrojo o castaño oscuro con reflejos dorados, ojos ámbar, avellana o castañas profundas. Los colores muy fríos o muy brillantes te apagan; los tonos terrosos te hacen brillar.",
        for: "Subtonos cálidos puros, contraste medio, paleta orgánica y terrosa.",
    },
    {
        key: "deep_autumn",
        name: "Otoño Profundo",
        emoji: "🌰",
        tagline: "Rica, dramática y sensual",
        palette: ["#3D0C02", "#7B3F00", "#4A0404", "#1C3D2E", "#5C4000"],
        description:
            "Comparte profundidad con el Invierno Profundo pero tu versión es cálida. Coloración oscura y rica: piel morena oscura con subtonos dorados, cabello muy oscuro con posibles reflejos cobrizos, ojos oscuros e intensos. Los marrones chocolate, bordó cálido, verde cazador, naranja quemado y ciruela cálida son tus mejores aliados. Evitá colores fríos y pasteles.",
        for: "Alto contraste, subtonos muy cálidos, coloración profunda y oscura.",
    },
    {
        key: "soft_autumn",
        name: "Otoño Suave",
        emoji: "🌾",
        tagline: "Cálida, muted y elegantemente neutral",
        palette: ["#C4A882", "#B8976C", "#A89070", "#8C7B6B", "#D4C4A0"],
        description:
            "El punto medio perfecto entre calor y suavidad. Tu coloración es cálida pero sin saturación fuerte: piel beige o melocotón con subtonos dorados suaves, cabello castaño claro o rubio oscuro, ojos avellana, verde o castaño medio. Los tonos crema, camel, terracota apagada, salmón polvo y marrón arena son tu paraíso. Los colores muy saturados o muy fríos no te van.",
        for: "Cálido-neutro, bajo contraste, apariencia suave y discreta pero cálida.",
    },
    {
        key: "true_spring",
        name: "Primavera Verdadera",
        emoji: "🌺",
        tagline: "Cálida, fresca y llena de vida",
        palette: ["#FF8C00", "#FFD700", "#7FBA00", "#FF6B6B", "#FFA500"],
        description:
            "La energía pura de la primavera: cálida, brillante y llena de vitalidad. Piel con subtonos dorados o melocotón, cabello rubio dorado, castaño claro con reflejos cálidos, ojos claros azul-verde o miel. Los colores cálidos y saturados —coral, naranja dorado, amarillo limón, verde hoja y fucsia cálido— te iluminan. Los tonos fríos o muy apagados te apagan.",
        for: "Subtonos cálidos claros, contraste medio, coloración luminosa y fresca.",
    },
    {
        key: "light_spring",
        name: "Primavera Clara",
        emoji: "🌼",
        tagline: "Etérea, delicada y luminosa",
        palette: ["#FFF8DC", "#FFE4C4", "#FFDAB9", "#E0F0FF", "#F0FFF0"],
        description:
            "La más clara y delicada de las primaveras. Coloración muy suave: piel casi traslúcida con un toque melocotón, cabello rubio o castaño muy claro, ojos claros con un brillo especial. Los colores pastel cálidos —melocotón suave, amarillo mantequilla, verde menta, lila cálido y coral muy suave— son tu familia. Evitá colores oscuros o muy saturados que te abrumen.",
        for: "Alta luminosidad, subtonos cálidos suaves, coloración muy clara y delicada.",
    },
    {
        key: "bright_spring",
        name: "Primavera Brillante",
        emoji: "🌟",
        tagline: "Vibrante, alegre y magnética",
        palette: ["#FF4500", "#FFD700", "#32CD32", "#FF69B4", "#00CED1"],
        description:
            "Compartís la intensidad del Invierno Brillante pero con el calor de la Primavera. Coloración clara pero muy vívida: piel luminosa con subtonos melocotón o dorado, cabello castaño claro o rubio con brillo, ojos muy claros y brillantes. Los colores cálidos y muy saturados —naranja brillante, amarillo sol, verde lima, coral intenso y fucsia cálido— te hacen brillar. Evitá tonos apagados o muy oscuros.",
        for: "Subtonos cálidos, alto contraste, ojos muy claros y brillantes, coloración vívida.",
    },
];

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function HowItWorksPage() {
    return (
        <div className="min-h-screen bg-black text-white pb-24">
            {/* Header */}
            <header className="p-6 flex items-center gap-4 sticky top-0 z-10 bg-black/80 backdrop-blur-md">
                <Link href="/dashboard">
                    <button aria-label="Volver" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white hover:bg-zinc-800 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                </Link>
                <span className="text-xs font-bold tracking-[0.2em] uppercase">Cómo funciona</span>
            </header>

            <div className="px-6 space-y-10">
                {/* Intro */}
                <motion.section
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-4"
                >
                    <h1 className="text-2xl font-bold leading-tight">
                        La ciencia del color <br />
                        <span className="text-zinc-400">aplicada a tu imagen</span>
                    </h1>
                    <p className="text-zinc-300 text-sm leading-relaxed">
                        La <strong className="text-white">colorimetría personal</strong> es el estudio de cómo los colores de la ropa interactúan con los colores naturales de tu piel, cabello y ojos. Cuando usás colores que armonizan con tu coloración, tu piel luce más sana, tus rasgos se definen y proyectás una imagen más cohesionada y poderosa.
                    </p>
                    <p className="text-zinc-300 text-sm leading-relaxed">
                        El sistema más completo divide el espectro en <strong className="text-white">12 arquetipos estacionales</strong>, organizados según dos ejes principales:
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-zinc-900 rounded-2xl p-4 space-y-1">
                            <p className="text-xs font-bold tracking-widest text-zinc-400 uppercase">Temperatura</p>
                            <p className="text-sm text-white">¿Tu coloración es <strong>cálida</strong> (dorados, bronces) o <strong>fría</strong> (rosas, azules)?</p>
                        </div>
                        <div className="bg-zinc-900 rounded-2xl p-4 space-y-1">
                            <p className="text-xs font-bold tracking-widest text-zinc-400 uppercase">Intensidad</p>
                            <p className="text-sm text-white">¿Es <strong>brillante</strong> (alto contraste) o <strong>suave</strong> (difuminada, muted)?</p>
                        </div>
                    </div>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                        Luce usa Inteligencia Artificial para analizar tu foto y clasificarte automáticamente en uno de los 12 tipos, luego te entrega tu paleta personalizada con colores que potencian tu imagen.
                    </p>
                </motion.section>

                {/* Divider */}
                <div className="border-t border-zinc-800" />

                {/* 12 seasons */}
                <section className="space-y-4">
                    <h2 className="text-lg font-bold">Los 12 tipos de coloración</h2>
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="space-y-4"
                    >
                        {SEASONS.map((s) => (
                            <motion.div
                                key={s.key}
                                variants={item}
                                className="bg-zinc-900 rounded-2xl overflow-hidden"
                            >
                                {/* Color bar */}
                                <div className="h-2 flex">
                                    {s.palette.map((c, i) => (
                                        <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                                    ))}
                                </div>

                                <div className="p-4 space-y-3">
                                    {/* Title row */}
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">{s.emoji}</span>
                                        <div>
                                            <p className="font-bold text-white leading-tight">{s.name}</p>
                                            <p className="text-xs text-zinc-400 italic">{s.tagline}</p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-zinc-300 leading-relaxed">{s.description}</p>

                                    {/* For whom */}
                                    <div className="bg-zinc-800/60 rounded-xl p-3">
                                        <p className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase mb-1">¿Para quién?</p>
                                        <p className="text-xs text-zinc-300 leading-relaxed">{s.for}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </section>
            </div>
        </div>
    );
}
