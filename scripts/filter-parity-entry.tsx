import { registerRoot } from "remotion";
import { Composition, AbsoluteFill } from "remotion";

export const FPS = 30;
export const W = 540;
export const H = 960;

const STAR_POINTS = (() => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 1 : 0.5;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    pts.push(`${(Math.cos(a) * r).toFixed(4)},${(Math.sin(a) * r).toFixed(4)}`);
  }
  return pts.join(" ");
})();

const GlowTest: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0c2020" }}>
      {/* CSS drop-shadow glow (technique actuelle) */}
      <div
        style={{
          position: "absolute",
          left: "27%",
          top: "22%",
          transform: "translate(-50%, -50%)",
          filter: "drop-shadow(0 0 24px rgba(245,212,122,0.9))",
        }}
      >
        <svg viewBox="-1 -1 2 2" width="151" height="151" style={{ display: "block" }}>
          <polygon points={STAR_POINTS} fill="#c9a84c" />
        </svg>
      </div>
      {/* SVG <filter> glow : feGaussianBlur + feMerge, viewBox élargi pour ne
          pas clip le halo (1 unité = 75.5px, glow 24px ≈ 0.32 unités) */}
      <div style={{ position: "absolute", left: "73%", top: "22%", transform: "translate(-50%, -50%)" }}>
        <svg viewBox="-1.35 -1.35 2.7 2.7" width="204" height="204" style={{ display: "block" }}>
          <defs>
            <filter id="glow-svg" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="0.32" result="blur" />
              <feComponentTransfer in="blur" result="glow">
                <feFuncA type="linear" slope="1.6" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <polygon points={STAR_POINTS} fill="#c9a84c" filter="url(#glow-svg)" />
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          left: "27%",
          top: "36%",
          transform: "translateX(-50%)",
          color: "#fff",
          fontSize: 18,
          fontFamily: "sans-serif",
        }}
      >
        CSS drop-shadow
      </div>
      <div
        style={{
          position: "absolute",
          left: "73%",
          top: "36%",
          transform: "translateX(-50%)",
          color: "#fff",
          fontSize: 18,
          fontFamily: "sans-serif",
        }}
      >
        SVG filter
      </div>
      {/* blur() filter seul */}
      <div
        style={{
          position: "absolute",
          left: "27%",
          top: "62%",
          transform: "translate(-50%, -50%)",
          filter: "blur(8px)",
        }}
      >
        <svg viewBox="-1 -1 2 2" width="151" height="151" style={{ display: "block" }}>
          <polygon points={STAR_POINTS} fill="#c9a84c" />
        </svg>
      </div>
      {/* text avec -webkit-text-stroke (contour texte) */}
      <div
        style={{
          position: "absolute",
          left: "73%",
          top: "62%",
          transform: "translate(-50%, -50%)",
          color: "#f5d47a",
          fontSize: 72,
          fontFamily: "sans-serif",
          WebkitTextStroke: "4px #ffffff",
        }}
      >
        HIKMA
      </div>
      {/* text-shadow glow (halo) */}
      <div
        style={{
          position: "absolute",
          left: "27%",
          top: "88%",
          transform: "translate(-50%, -50%)",
          color: "#f5d47a",
          fontSize: 72,
          fontFamily: "sans-serif",
          textShadow: "0 0 22px rgba(245,212,122,0.85)",
        }}
      >
        HIKMA
      </div>
      {/* stars : SVG 151.2 (fractionnaire) vs 151 (entier) — test compression */}
      <div style={{ position: "absolute", left: "27%", top: "45%", transform: "translate(-50%, -50%)" }}>
        <svg viewBox="-1 -1 2 2" width="151.2" height="151.2" style={{ display: "block", width: "151.2px", height: "151.2px" }}>
          <polygon points={STAR_POINTS} fill="#c9a84c" />
        </svg>
      </div>
      <div style={{ position: "absolute", left: "73%", top: "45%", transform: "translate(-50%, -50%)" }}>
        <svg viewBox="-1 -1 2 2" width="151" height="151" style={{ display: "block", width: "151px", height: "151px" }}>
          <polygon points={STAR_POINTS} fill="#c9a84c" />
        </svg>
      </div>
      <div style={{ position: "absolute", left: "27%", top: "54%", transform: "translateX(-50%)", color: "#fff", fontSize: 16, fontFamily: "sans-serif" }}>
        svg 151.2
      </div>
      <div style={{ position: "absolute", left: "73%", top: "54%", transform: "translateX(-50%)", color: "#fff", fontSize: 16, fontFamily: "sans-serif" }}>
        svg 151
      </div>
      {/* span-based text stroke + glow layers — fontFamily Amiri (test police) */}
      <div
        style={{
          position: "absolute",
          left: "27%",
          top: "80%",
          transform: "translate(-50%, -50%)",
          fontSize: 72,
          fontFamily: "Amiri, serif",
          direction: "rtl",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            color: "transparent",
            WebkitTextStroke: "1px rgba(245, 212, 122, 0.7)",
          }}
        >
          يوم
        </span>
        <span style={{ color: "#f5d47a", WebkitTextStroke: "2px #ffffff" }}>يوم</span>
      </div>
      {/* version sans-serif de contrôle */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "80%",
          transform: "translate(-50%, -50%)",
          fontSize: 72,
          fontFamily: "sans-serif",
          direction: "rtl",
        }}
      >
        <span style={{ color: "#f5d47a", WebkitTextStroke: "2px #ffffff" }}>يوم</span>
      </div>
      {/* texte gradient (background-clip: text) */}
      <div
        style={{
          position: "absolute",
          left: "73%",
          top: "80%",
          transform: "translate(-50%, -50%)",
          fontSize: 72,
          fontFamily: "sans-serif",
          fontWeight: 800,
          color: "transparent",
          background: "linear-gradient(90deg, #f5d47a, #e2562f)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        HIKMA
      </div>
      {/* halo LAYERÉ : 8 copies concentriques de l'étoile (fills plats) */}
      <div
        style={{
          position: "absolute",
          left: "73%",
          top: "88%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <svg viewBox="-1.32 -1.32 2.64 2.64" width="199" height="199" style={{ display: "block" }}>
          {(() => {
            const layers = [];
            for (let i = 0; i < 8; i++) {
              const t = i / 7;
              const scale = 1 + 0.32 * t;
              const alpha = 0.9 * (1 - t) * 0.55;
              layers.push(
                <polygon
                  key={i}
                  points={STAR_POINTS}
                  fill="#f5d47a"
                  fillOpacity={alpha.toFixed(3)}
                  transform={`scale(${scale.toFixed(4)})`}
                />
              );
            }
            return layers;
          })()}
          <polygon points={STAR_POINTS} fill="#c9a84c" />
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          left: "27%",
          top: "72%",
          transform: "translateX(-50%)",
          color: "#fff",
          fontSize: 18,
          fontFamily: "sans-serif",
        }}
      >
        blur(8px)
      </div>
      <div
        style={{
          position: "absolute",
          left: "27%",
          top: "97%",
          transform: "translateX(-50%)",
          color: "#fff",
          fontSize: 16,
          fontFamily: "sans-serif",
        }}
      >
        text-shadow 22px
      </div>
      <div
        style={{
          position: "absolute",
          left: "73%",
          top: "97%",
          transform: "translateX(-50%)",
          color: "#fff",
          fontSize: 16,
          fontFamily: "sans-serif",
        }}
      >
        halo 8 couches
      </div>
      <div
        style={{
          position: "absolute",
          left: "73%",
          top: "72%",
          transform: "translateX(-50%)",
          color: "#fff",
          fontSize: 18,
          fontFamily: "sans-serif",
        }}
      >
        text-stroke 4px
      </div>
    </AbsoluteFill>
  );
};

export const GlowTestRoot: React.FC = () => (
  <Composition
    id="GlowTest"
    component={GlowTest}
    durationInFrames={30}
    fps={FPS}
    width={W}
    height={H}
  />
);

registerRoot(GlowTestRoot);
