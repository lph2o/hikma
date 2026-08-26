/**
 * Loader Hikma (design fourni par le produit, Phase 94B).
 *
 * Logo (`/logo-hikma.png`, dérivé optimisé de `public/logo/icon_hikma.png`)
 * avec une lueur douce (`animate-hikma-glow`) et un reflet « verre » balayant
 * le logo (`animate-hikma-shine`, masqué à la forme du logo), puis le wordmark
 * « Hikma » dont les lettres ondulent en cascade (`animate-hikma-word-wave`,
 * délais décalés).
 *
 * Accessibilité : le wordmark porte `role="img"` + `aria-label` ; le logo est
 * décoratif (`alt=""`) — l'état de chargement est annoncé par le conteneur
 * (`role="status"` + sr-only dans `PageLoading`). `prefers-reduced-motion` est
 * géré globalement dans globals.css (animations coupées → état statique doré).
 */
import type { CSSProperties } from "react";

const SHINE_STYLE: CSSProperties & {
  WebkitMaskMode?: string;
  maskMode?: string;
} = {
  background:
    "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.95) 50%, transparent 65%)",
  backgroundSize: "250% 250%",
  WebkitMaskImage: "url(/logo-hikma.png)",
  maskImage: "url(/logo-hikma.png)",
  WebkitMaskMode: "alpha",
  maskMode: "alpha",
  WebkitMaskSize: "contain",
  maskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskPosition: "center",
};

export function HikmaLoader({ className }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-[18px] ${className ?? ""}`}>
      {/* Logo + reflet verre */}
      <div className="relative w-[200px] animate-hikma-glow">
        {/* eslint-disable-next-line @next/next/no-img-element -- asset statique de public/, reflet masqué à sa forme */}
        <img src="/logo-hikma.png" alt="" className="block h-auto w-full" />
        <div
          className="pointer-events-none absolute inset-0 animate-hikma-shine mix-blend-overlay"
          style={SHINE_STYLE}
          aria-hidden="true"
        />
      </div>

      {/* Wordmark animé */}
      <svg
        width={180}
        height={46}
        viewBox="0 0 180 46"
        role="img"
        aria-label="Chargement en cours"
        className="fill-hikma-gold"
      >
        <text
          x={90}
          y={34}
          textAnchor="middle"
          style={{
            fontFamily: "var(--font-poppins), sans-serif",
            fontWeight: 700,
            fontSize: 34,
          }}
        >
          {["H", "i", "k", "m", "a"].map((letter, i) => (
            <tspan
              key={i}
              className="animate-hikma-word-wave"
              style={{ animationDelay: `${i * 0.12}s` }}
            >
              {letter}
            </tspan>
          ))}
        </text>
      </svg>
    </div>
  );
}
