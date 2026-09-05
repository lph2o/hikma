// Hikma — Content Studio : PANNEAU GRAPHIQUES TEXTE (Inspector).
//
// Contrôles compacts (design system Hikma : dark studio, teal action, gold
// accent) pour créer/éditer/supprimer des TextGraphicClip. Les valeurs sont
// stockées dans l'état du VideoEditor (graphics) puis sauvegardées dans
// editor_state via saveEditorState — aucun rendu automatique.
//
// UX STABLE (anti-inspector-géant) :
//   - La liste affiche UNE ligne compacte par clip (sélectionnable).
//   - L'éditeur COMPLET n'est rendu que pour le clip sélectionné.
//   - Les propriétés sont groupées en sections repliables (accordéons) :
//     l'Inspector ne grandit donc jamais indéfiniment avec le nombre de clips.

import React from "react";
import type { GraphicClipBase } from "@/lib/content-studio/graphics/graphic-clip";
import { KeyframeSection } from "@/components/content-studio/editor/keyframe-section";
import {
  SHAPE_GRAPHIC_KINDS,
  type ShapeGraphicClip,
} from "@/lib/content-studio/graphics/shape-graphic";
import {
  buildTextAnimation,
  type TextGraphicClip,
} from "@/lib/content-studio/graphics/text-graphic";
import { textAnimationEngine } from "@/lib/content-studio/graphics/text-animation";
import { ALL_EASING_NAMES } from "@/lib/content-studio/editor/easing";
import { sizeFromWidthHeight } from "@/lib/content-studio/graphics/interaction";

/** Les 24 presets RÉELS du moteur porté (source de vérité). */
const ANIMATION_PRESETS: string[] = textAnimationEngine.getAvailablePresets();

const PRESET_LABELS: Record<string, string> = {
  none: "Aucune",
  typewriter: "Machine à écrire",
  fade: "Fondu",
  "slide-left": "Glisser gauche",
  "slide-right": "Glisser droite",
  "slide-up": "Glisser haut",
  "slide-down": "Glisser bas",
  scale: "Échelle",
  blur: "Flou",
  bounce: "Rebond",
  rotate: "Rotation",
  wave: "Vague",
  shake: "Secousse",
  pop: "Pop",
  glitch: "Glitch",
  split: "Fractionner",
  flip: "Retourner",
  "word-by-word": "Mot par mot",
  rainbow: "Arc-en-ciel",
  rise: "Montée",
  drop: "Chute",
  elastic: "Élastique",
  swing: "Balancement",
  "zoom-blur": "Zoom flou",
  cascade: "Cascade",
};

const isTextClip = (clip: GraphicClipBase): clip is TextGraphicClip =>
  clip.kind === "text";

const isShapeClip = (clip: GraphicClipBase): clip is ShapeGraphicClip =>
  clip.kind === "shape";

const ALIGN_LABELS: Record<string, string> = {
  centerH: "Centrer H",
  centerV: "Centrer V",
  center: "Centre exact",
};

/** Polices RÉELLEMENT chargées par Hikma (next/font + Remotion). */
const FONT_OPTIONS: { value: string; label: string }[] = [
  { value: "Poppins", label: "Poppins (latin)" },
  { value: "Amiri", label: "Amiri (arabe)" },
  { value: "Geist Mono", label: "Geist Mono (mono)" },
  { value: "system-ui", label: "Système (sans-serif)" },
];

const SHAPE_LABELS: Record<string, string> = {
  rectangle: "Rectangle",
  ellipse: "Ellipse",
  circle: "Cercle",
  polygon: "Polygone",
  star: "Étoile",
  line: "Ligne",
  arrow: "Flèche",
};

/** Largeur normalisée d'une forme (fraction de la largeur du canvas). */
function widthOf(clip: ShapeGraphicClip): number {
  return Math.max(0.05, Math.min(0.9, clip.thickness ?? 0.4));
}

/** Aspect effectif d'une forme (cercle → 1, sinon aspect ou défaut). */
function shapeAspectOf(clip: ShapeGraphicClip): number {
  if (clip.shape === "circle") return 1;
  if (typeof clip.aspect === "number" && Number.isFinite(clip.aspect)) {
    return Math.max(0.05, Math.min(2, clip.aspect));
  }
  return clip.shape === "ellipse" ? 0.62 : 1;
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION REPLIABLE (accordéon) : la hauteur de l'Inspector reste bornée
   — seules les sections ouvertes participent au rendu.
   ═══════════════════════════════════════════════════════════════════════ */

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="border-t border-white/8 pt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white/35 transition-colors hover:text-white/60"
      >
        <span>{title}</span>
        <span className="font-mono text-[10px] text-white/25">{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="mt-1">{children}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PANNEAU TEXTE — liste compacte + éditeur du clip sélectionné
   ═══════════════════════════════════════════════════════════════════════ */

export function TextGraphicsPanel({
  graphics,
  selectedId = null,
  onSelect,
  onAddText,
  onUpdateText,
  onRemove,
  onDuplicate,
  onBringToFront,
  onSendToBack,
  frame = 0,
  onSeek,
}: {
  graphics: readonly GraphicClipBase[];
  /** Clip texte dont l'éditeur complet est déplié. */
  selectedId?: string | null;
  /** Sélectionne / désélectionne un clip (synchro Timeline + Preview). */
  onSelect?: (id: string | null) => void;
  onAddText: () => void;
  onUpdateText: (id: string, patch: Partial<TextGraphicClip>) => void;
  onRemove: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onBringToFront?: (id: string) => void;
  onSendToBack?: (id: string) => void;
  /** Frame global courant (pour la section Keyframes). */
  frame?: number;
  onSeek?: (frame: number) => void;
}) {
  const texts = graphics.filter(isTextClip);
  return (
    <section className="border-t border-white/8 px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-hikma-teal-400">
          Graphiques · Texte
        </span>
        <button
          type="button"
          onClick={onAddText}
          aria-label="Ajouter un texte"
          className="flex items-center gap-1 rounded-lg bg-hikma-teal-600/90 px-2 py-1 text-[10px] font-bold text-white transition hover:bg-hikma-teal-500"
        >
          + Texte
        </button>
      </div>

      {texts.length === 0 ? (
        <p className="text-[11px] text-white/40">
          Aucun texte ajouté. Cliquez sur « + Texte » pour superposer un texte
          aux scènes (sauvegardez pour le voir dans la vidéo).
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {texts.map((clip) => {
            const isSelected = selectedId === clip.id;
            return (
              <li
                key={clip.id}
                className={`rounded-xl border p-2 transition-colors ${
                  isSelected
                    ? "border-hikma-teal-500/50 bg-hikma-teal-900/20"
                    : "border-white/8 bg-black/30"
                }`}
              >
                {/* Ligne compacte : cliquer déplie l'éditeur du clip */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onSelect?.(isSelected ? null : clip.id)}
                    title={isSelected ? "Replier l'éditeur" : "Modifier ce texte"}
                    className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-1 py-1 text-left hover:bg-white/5"
                  >
                    <span className="truncate font-mono text-[9px] uppercase tracking-wider text-white/40">
                      {clip.direction === "rtl" ? "RTL · arabe" : "LTR"} · {clip.startFrame}f
                    </span>
                    {clip.source && (
                      <span className="shrink-0 rounded bg-amber-900/50 px-1 py-px text-[8px] font-bold uppercase tracking-wide text-hikma-gold">
                        Scène
                      </span>
                    )}
                    <span className="truncate text-[11px] text-white/80">
                      {clip.text ? `« ${clip.text.slice(0, 16)} »` : "(vide)"}
                    </span>
                    <span className={`ml-auto text-[10px] ${isSelected ? "text-hikma-teal-300" : "text-white/30"}`}>
                      {isSelected ? "▾" : "▸"}
                    </span>
                  </button>
                  <div className="flex items-center gap-1">
                    {onBringToFront && (
                      <button
                        type="button"
                        onClick={() => onBringToFront(clip.id)}
                        aria-label="Mettre le texte au premier plan"
                        title="Premier plan"
                        className="flex size-6 items-center justify-center rounded-md text-white/40 hover:bg-white/10 hover:text-white"
                      >
                        ⤴
                      </button>
                    )}
                    {onSendToBack && (
                      <button
                        type="button"
                        onClick={() => onSendToBack(clip.id)}
                        aria-label="Envoyer le texte en arrière-plan"
                        title="Arrière-plan"
                        className="flex size-6 items-center justify-center rounded-md text-white/40 hover:bg-white/10 hover:text-white"
                      >
                        ⤵
                      </button>
                    )}
                    {onDuplicate && (
                      <button
                        type="button"
                        onClick={() => onDuplicate(clip.id)}
                        aria-label={`Dupliquer le texte ${clip.text}`}
                        className="flex size-6 items-center justify-center rounded-md text-white/40 hover:bg-white/10 hover:text-white"
                      >
                        ⧉
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemove(clip.id)}
                      aria-label={`Supprimer le texte ${clip.text}`}
                      className="flex size-6 items-center justify-center rounded-md text-rose-400/60 hover:bg-rose-900/30 hover:text-rose-300"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {isSelected && (
                  <TextClipEditor clip={clip} onUpdate={onUpdateText} frame={frame} onSeek={onSeek} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Éditeur COMPLET d'un clip texte (un seul à la fois : le sélectionné). */
function TextClipEditor({
  clip,
  onUpdate,
  frame = 0,
  onSeek,
}: {
  clip: TextGraphicClip;
  onUpdate: (id: string, patch: Partial<TextGraphicClip>) => void;
  frame?: number;
  onSeek?: (frame: number) => void;
}) {
  return (
    <div className="mt-2">
      {/* ── CONTENU ── */}
      <CollapsibleSection title="Contenu" defaultOpen>
        <textarea
          value={clip.text}
          onChange={(e) => onUpdate(clip.id, { text: e.target.value })}
          rows={2}
          dir={clip.direction}
          aria-label="Contenu du texte"
          className="w-full resize-none rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-sm text-white outline-none focus:border-hikma-teal-400"
        />
      </CollapsibleSection>

      {/* ── STYLE ── */}
      <CollapsibleSection title="Style">
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-0.5 text-[10px] text-white/50">
            Police
            <select
              value={FONT_OPTIONS.some((f) => f.value === clip.style.fontFamily) ? clip.style.fontFamily : "Poppins"}
              onChange={(e) =>
                onUpdate(clip.id, {
                  style: { ...clip.style, fontFamily: e.target.value },
                })
              }
              className="w-full rounded-lg border border-white/10 bg-black/40 px-1.5 py-1 text-xs text-white outline-none focus:border-hikma-teal-400"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value} className="bg-black">
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-0.5 text-[10px] text-white/50">
            Taille
            <input
              type="number"
              min={12}
              max={240}
              value={clip.style.fontSize}
              onChange={(e) =>
                onUpdate(clip.id, {
                  style: { ...clip.style, fontSize: Number(e.target.value) || 48 },
                })
              }
              className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-sm text-white"
            />
          </label>
          <label className="flex flex-col gap-0.5 text-[10px] text-white/50">
            Couleur
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(clip.style.color) ? clip.style.color : "#ffffff"}
              onChange={(e) =>
                onUpdate(clip.id, { style: { ...clip.style, color: e.target.value } })
              }
              className="h-8 w-full cursor-pointer rounded-lg border border-white/10 bg-black/40"
            />
          </label>
          <label className="flex flex-col gap-0.5 text-[10px] text-white/50">
            Opacité {Math.round(clip.transform.opacity * 100)} %
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(clip.transform.opacity * 100)}
              onChange={(e) =>
                onUpdate(clip.id, {
                  transform: {
                    ...clip.transform,
                    opacity: Number(e.target.value) / 100,
                  },
                })
              }
              className="accent-hikma-teal-500"
            />
          </label>
          <label className="flex flex-col gap-0.5 text-[10px] text-white/50">
            Direction
            <button
              type="button"
              onClick={() =>
                onUpdate(clip.id, {
                  direction: clip.direction === "rtl" ? "ltr" : "rtl",
                })
              }
              className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-sm text-hikma-gold"
            >
              {clip.direction === "rtl" ? "RTL →" : "LTR →"}
            </button>
          </label>
        </div>
      </CollapsibleSection>

      {/* ── TRANSFORM ── */}
      <CollapsibleSection title="Transform">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ["centerH", { x: 0.5 }],
              ["centerV", { y: 0.5 }],
              ["center", { x: 0.5, y: 0.5 }],
            ] as const
          ).map(([key, patch]) => (
            <button
              key={key}
              type="button"
              onClick={() =>
                onUpdate(clip.id, {
                  transform: { ...clip.transform, ...patch },
                })
              }
              className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[9px] font-bold text-white/60 transition hover:border-hikma-teal-400/60 hover:text-hikma-teal-300"
            >
              {ALIGN_LABELS[key]}
            </button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-0.5 text-[10px] text-white/50">
            Position X ({Math.round(clip.transform.x * 100)} %)
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(clip.transform.x * 100)}
              onChange={(e) =>
                onUpdate(clip.id, {
                  transform: {
                    ...clip.transform,
                    x: Number(e.target.value) / 100,
                  },
                })
              }
              className="accent-hikma-teal-500"
            />
          </label>
          <label className="flex flex-col gap-0.5 text-[10px] text-white/50">
            Position Y ({Math.round(clip.transform.y * 100)} %)
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(clip.transform.y * 100)}
              onChange={(e) =>
                onUpdate(clip.id, {
                  transform: {
                    ...clip.transform,
                    y: Number(e.target.value) / 100,
                  },
                })
              }
              className="accent-hikma-teal-500"
            />
          </label>
          <label className="flex flex-col gap-0.5 text-[10px] text-white/50">
            Rotation {Math.round(clip.transform.rotation)}°
            <input
              type="range"
              min={-180}
              max={180}
              value={Math.round(clip.transform.rotation)}
              onChange={(e) =>
                onUpdate(clip.id, {
                  transform: {
                    ...clip.transform,
                    rotation: Number(e.target.value),
                  },
                })
              }
              className="accent-hikma-teal-500"
            />
          </label>
          <label className="flex flex-col gap-0.5 text-[10px] text-white/50">
            Échelle ({Math.round(clip.transform.scaleX * 100)} %)
            <input
              type="range"
              min={25}
              max={250}
              value={Math.round(clip.transform.scaleX * 100)}
              onChange={(e) => {
                const s = Number(e.target.value) / 100;
                onUpdate(clip.id, {
                  transform: { ...clip.transform, scaleX: s, scaleY: s },
                });
              }}
              className="accent-hikma-teal-500"
            />
          </label>
        </div>
      </CollapsibleSection>

      {/* ── KEYFRAMES ── */}
      <CollapsibleSection title="Keyframes">
        <KeyframeSection
          clip={clip}
          frame={frame}
          onUpdateKeyframes={(kfs) => onUpdate(clip.id, { keyframes: kfs })}
          onSeek={onSeek}
        />
      </CollapsibleSection>

      {/* ── ANIMATION ── */}
      <CollapsibleSection title="Animation">
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-0.5 text-[10px] text-white/50">
            Preset
            <select
              value={clip.animation?.preset ?? "none"}
              onChange={(e) => {
                const preset = e.target.value;
                const cur = clip.animation;
                onUpdate(clip.id, {
                  animation:
                    preset === "none"
                      ? undefined
                      : buildTextAnimation(preset as never, {
                          inDurationFrames: cur?.inDuration ?? 15,
                          outDurationFrames: cur?.outDuration ?? 0,
                        }),
                });
              }}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-1.5 py-1 text-xs text-white outline-none focus:border-hikma-teal-400"
            >
              {ANIMATION_PRESETS.map((p) => (
                <option key={p} value={p} className="bg-black">
                  {PRESET_LABELS[p] ?? p}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-0.5 text-[10px] text-white/50">
            Easing
            <select
              value={clip.animation?.params?.easing ?? "ease-out"}
              onChange={(e) => {
                const cur = clip.animation;
                onUpdate(clip.id, {
                  animation:
                    cur && cur.preset !== "none"
                      ? buildTextAnimation(cur.preset, {
                          inDurationFrames: cur.inDuration,
                          outDurationFrames: cur.outDuration,
                          params: { easing: e.target.value as never },
                        })
                      : undefined,
                });
              }}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-1.5 py-1 text-xs text-white outline-none focus:border-hikma-teal-400"
            >
              {ALL_EASING_NAMES.map((name) => (
                <option key={name} value={name} className="bg-black">
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-0.5 text-[10px] text-white/50">
            Entrée ({clip.animation?.inDuration ?? 0}f)
            <input
              type="range"
              min={0}
              max={90}
              value={clip.animation?.inDuration ?? 0}
              onChange={(e) => {
                const cur = clip.animation;
                if (!cur || cur.preset === "none") return;
                onUpdate(clip.id, {
                  animation: buildTextAnimation(cur.preset, {
                    inDurationFrames: Number(e.target.value),
                    outDurationFrames: cur.outDuration,
                  }),
                });
              }}
              className="accent-hikma-teal-500"
            />
          </label>
          <label className="flex flex-col gap-0.5 text-[10px] text-white/50">
            Sortie ({clip.animation?.outDuration ?? 0}f)
            <input
              type="range"
              min={0}
              max={90}
              value={clip.animation?.outDuration ?? 0}
              onChange={(e) => {
                const cur = clip.animation;
                if (!cur || cur.preset === "none") return;
                onUpdate(clip.id, {
                  animation: buildTextAnimation(cur.preset, {
                    inDurationFrames: cur.inDuration,
                    outDurationFrames: Number(e.target.value),
                  }),
                });
              }}
              className="accent-hikma-teal-500"
            />
          </label>
        </div>
      </CollapsibleSection>

      {/* ── EFFETS ── */}
      <CollapsibleSection title="Effets">
        <div className="flex flex-col gap-1.5">
          {/* Contour */}
          <EffectRow
            label="Contour"
            enabled={(clip.style.strokeWidth ?? 0) > 0}
            onToggle={(on) =>
              onUpdate(clip.id, {
                style: {
                  ...clip.style,
                  strokeWidth: on ? Math.max(2, clip.style.strokeWidth ?? 2) : 0,
                  strokeColor: clip.style.strokeColor ?? "#111827",
                },
              })
            }
          >
            <ColorField
              label="Couleur"
              value={clip.style.strokeColor ?? "#111827"}
              onChange={(c) => onUpdate(clip.id, { style: { ...clip.style, strokeColor: c } })}
            />
            <NumberField
              label="Épaisseur"
              value={clip.style.strokeWidth ?? 0}
              min={0}
              max={30}
              onChange={(v) => onUpdate(clip.id, { style: { ...clip.style, strokeWidth: v } })}
            />
          </EffectRow>
          {/* Ombre directionnelle */}
          <EffectRow
            label="Ombre"
            enabled={clip.style.shadowColor !== undefined}
            onToggle={(on) =>
              onUpdate(clip.id, {
                style: on
                  ? {
                      ...clip.style,
                      shadowColor: clip.style.shadowColor ?? "#000000",
                      shadowBlur: clip.style.shadowBlur ?? 8,
                      shadowOffsetX: clip.style.shadowOffsetX ?? 4,
                      shadowOffsetY: clip.style.shadowOffsetY ?? 6,
                    }
                  : { ...clip.style, shadowColor: undefined },
              })
            }
          >
            <ColorField
              label="Couleur"
              value={clip.style.shadowColor ?? "#000000"}
              onChange={(c) => onUpdate(clip.id, { style: { ...clip.style, shadowColor: c } })}
            />
            <NumberField label="X" value={clip.style.shadowOffsetX ?? 0} min={-60} max={60} onChange={(v) => onUpdate(clip.id, { style: { ...clip.style, shadowOffsetX: v } })} />
            <NumberField label="Y" value={clip.style.shadowOffsetY ?? 0} min={-60} max={60} onChange={(v) => onUpdate(clip.id, { style: { ...clip.style, shadowOffsetY: v } })} />
            <NumberField label="Flou" value={clip.style.shadowBlur ?? 0} min={0} max={60} onChange={(v) => onUpdate(clip.id, { style: { ...clip.style, shadowBlur: v } })} />
          </EffectRow>
          {/* Halo / Glow */}
          <EffectRow
            label="Halo"
            enabled={clip.style.glowColor !== undefined}
            onToggle={(on) =>
              onUpdate(clip.id, {
                style: on
                  ? {
                      ...clip.style,
                      glowColor: clip.style.glowColor ?? "#f5d47a",
                      glowRadius: clip.style.glowRadius ?? 20,
                      glowOpacity: clip.style.glowOpacity ?? 0.8,
                    }
                  : { ...clip.style, glowColor: undefined },
              })
            }
          >
            <ColorField
              label="Couleur"
              value={clip.style.glowColor ?? "#f5d47a"}
              onChange={(c) => onUpdate(clip.id, { style: { ...clip.style, glowColor: c } })}
            />
            <NumberField label="Rayon" value={clip.style.glowRadius ?? 0} min={0} max={120} onChange={(v) => onUpdate(clip.id, { style: { ...clip.style, glowRadius: v } })} />
            <NumberField label="Opacité %" value={Math.round((clip.style.glowOpacity ?? 0.8) * 100)} min={0} max={100} onChange={(v) => onUpdate(clip.id, { style: { ...clip.style, glowOpacity: v / 100 } })} />
          </EffectRow>
          {/* Gradient */}
          <EffectRow
            label="Gradient"
            enabled={clip.style.gradient !== undefined}
            onToggle={(on) =>
              onUpdate(clip.id, {
                style: on
                  ? {
                      ...clip.style,
                      gradient: clip.style.gradient ?? { colors: ["#ffffff", "#f5d47a"], angle: 90 },
                    }
                  : { ...clip.style, gradient: undefined },
              })
            }
          >
            <ColorField
              label="Couleur 1"
              value={clip.style.gradient?.colors[0] ?? "#ffffff"}
              onChange={(c) =>
                onUpdate(clip.id, {
                  style: {
                    ...clip.style,
                    gradient: { colors: [c, clip.style.gradient?.colors[1] ?? "#f5d47a"], angle: clip.style.gradient?.angle ?? 90 },
                  },
                })
              }
            />
            <ColorField
              label="Couleur 2"
              value={clip.style.gradient?.colors[1] ?? "#f5d47a"}
              onChange={(c) =>
                onUpdate(clip.id, {
                  style: {
                    ...clip.style,
                    gradient: { colors: [clip.style.gradient?.colors[0] ?? "#ffffff", c], angle: clip.style.gradient?.angle ?? 90 },
                  },
                })
              }
            />
            <NumberField
              label="Angle°"
              value={clip.style.gradient?.angle ?? 90}
              min={0}
              max={360}
              onChange={(v) =>
                onUpdate(clip.id, {
                  style: {
                    ...clip.style,
                    gradient: { colors: clip.style.gradient?.colors ?? ["#ffffff", "#f5d47a"], angle: v },
                  },
                })
              }
            />
          </EffectRow>
          {/* Flou */}
          <EffectRow
            label="Flou"
            enabled={(clip.style.blurRadius ?? 0) > 0}
            onToggle={(on) =>
              onUpdate(clip.id, {
                style: { ...clip.style, blurRadius: on ? Math.max(2, clip.style.blurRadius ?? 2) : 0 },
              })
            }
          >
            <NumberField label="Rayon" value={clip.style.blurRadius ?? 0} min={0} max={30} onChange={(v) => onUpdate(clip.id, { style: { ...clip.style, blurRadius: v } })} />
          </EffectRow>
        </div>
      </CollapsibleSection>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PANNEAU FORMES — liste compacte + éditeur du clip sélectionné
   ═══════════════════════════════════════════════════════════════════════ */

export function ShapesPanel({
  graphics,
  selectedId = null,
  onSelect,
  onAddShape,
  onUpdateShape,
  onRemove,
  onDuplicate,
  onBringToFront,
  onSendToBack,
  frame = 0,
  onSeek,
}: {
  graphics: readonly GraphicClipBase[];
  /** Clip forme dont l'éditeur complet est déplié. */
  selectedId?: string | null;
  /** Sélectionne / désélectionne un clip (synchro Timeline + Preview). */
  onSelect?: (id: string | null) => void;
  onAddShape: (shape: ShapeGraphicClip["shape"]) => void;
  onUpdateShape: (id: string, patch: Partial<ShapeGraphicClip>) => void;
  onRemove: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onBringToFront?: (id: string) => void;
  onSendToBack?: (id: string) => void;
  /** Frame global courant (pour la section Keyframes). */
  frame?: number;
  onSeek?: (frame: number) => void;
}) {
  const shapes = graphics.filter(isShapeClip);
  return (
    <section className="border-t border-white/8 px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-hikma-gold/90">
          Graphiques · Formes
        </span>
        <span className="text-[9px] text-white/30">{shapes.length} clip(s)</span>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-1.5">
        {SHAPE_GRAPHIC_KINDS.map((shape) => (
          <button
            key={shape}
            type="button"
            onClick={() => onAddShape(shape)}
            className="rounded-lg border border-white/10 bg-black/30 px-1.5 py-1.5 text-[9px] font-bold text-white/70 transition hover:border-hikma-gold/50 hover:text-hikma-gold"
          >
            {SHAPE_LABELS[shape] ?? shape}
          </button>
        ))}
      </div>

      {shapes.length === 0 ? (
        <p className="text-[11px] text-white/40">
          Cliquez sur une forme pour l&apos;ajouter à la scène (visible dans la
          preview et le MP4).
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {shapes.map((clip) => {
            const isSelected = selectedId === clip.id;
            return (
              <li
                key={clip.id}
                className={`rounded-xl border p-2 transition-colors ${
                  isSelected
                    ? "border-hikma-gold/50 bg-amber-950/20"
                    : "border-white/8 bg-black/30"
                }`}
              >
                {/* Ligne compacte : cliquer déplie l'éditeur du clip */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onSelect?.(isSelected ? null : clip.id)}
                    title={isSelected ? "Replier l'éditeur" : "Modifier cette forme"}
                    className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-1 py-1 text-left hover:bg-white/5"
                  >
                    <span className="truncate font-mono text-[9px] uppercase tracking-wider text-white/40">
                      {SHAPE_LABELS[clip.shape] ?? clip.shape} · {clip.startFrame}f
                    </span>
                    <span className={`ml-auto text-[10px] ${isSelected ? "text-hikma-gold" : "text-white/30"}`}>
                      {isSelected ? "▾" : "▸"}
                    </span>
                  </button>
                  <div className="flex items-center gap-1">
                    {onBringToFront && (
                      <button
                        type="button"
                        onClick={() => onBringToFront(clip.id)}
                        aria-label="Mettre la forme au premier plan"
                        title="Premier plan"
                        className="flex size-6 items-center justify-center rounded-md text-white/40 hover:bg-white/10 hover:text-white"
                      >
                        ⤴
                      </button>
                    )}
                    {onSendToBack && (
                      <button
                        type="button"
                        onClick={() => onSendToBack(clip.id)}
                        aria-label="Envoyer la forme en arrière-plan"
                        title="Arrière-plan"
                        className="flex size-6 items-center justify-center rounded-md text-white/40 hover:bg-white/10 hover:text-white"
                      >
                        ⤵
                      </button>
                    )}
                    {onDuplicate && (
                      <button
                        type="button"
                        onClick={() => onDuplicate(clip.id)}
                        aria-label={`Dupliquer la forme ${clip.shape}`}
                        className="flex size-6 items-center justify-center rounded-md text-white/40 hover:bg-white/10 hover:text-white"
                      >
                        ⧉
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemove(clip.id)}
                      aria-label={`Supprimer la forme ${clip.shape}`}
                      className="flex size-6 items-center justify-center rounded-md text-rose-400/60 hover:bg-rose-900/30 hover:text-rose-300"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {isSelected && (
                  <ShapeClipEditor clip={clip} onUpdate={onUpdateShape} frame={frame} onSeek={onSeek} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Éditeur COMPLET d'une forme (un seul à la fois : la sélectionnée). */
function ShapeClipEditor({
  clip,
  onUpdate,
  frame = 0,
  onSeek,
}: {
  clip: ShapeGraphicClip;
  onUpdate: (id: string, patch: Partial<ShapeGraphicClip>) => void;
  frame?: number;
  onSeek?: (frame: number) => void;
}) {
  return (
    <div className="mt-2">
      {/* ── FORME / APPARENCE ── */}
      <CollapsibleSection title="Forme" defaultOpen>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-0.5 text-[10px] text-white/50">
            Couleur
            <input
              type="color"
              value={
                clip.fill.type === "solid" && /^#[0-9a-fA-F]{6}$/.test(clip.fill.color)
                  ? clip.fill.color
                  : "#14b8a6"
              }
              onChange={(e) =>
                onUpdate(clip.id, {
                  fill: { type: "solid", color: e.target.value },
                })
              }
              className="h-8 w-full cursor-pointer rounded-lg border border-white/10 bg-black/40"
            />
          </label>
          <label className="flex flex-col gap-0.5 text-[10px] text-white/50">
            Opacité {Math.round(clip.transform.opacity * 100)} %
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(clip.transform.opacity * 100)}
              onChange={(e) =>
                onUpdate(clip.id, {
                  transform: {
                    ...clip.transform,
                    opacity: Number(e.target.value) / 100,
                  },
                })
              }
              className="accent-hikma-gold"
            />
          </label>
          <label className="flex flex-col gap-0.5 text-[10px] text-white/50">
            Largeur ({Math.round((clip.thickness ?? 0.4) * 100)} %)
            <input
              type="number"
              min={5}
              max={90}
              value={Math.round((clip.thickness ?? 0.4) * 100)}
              onChange={(e) => {
                const w = Number(e.target.value) / 100;
                const size = sizeFromWidthHeight(clip.shape, w, w * shapeAspectOf(clip));
                if (!size) return;
                onUpdate(clip.id, {
                  thickness: size.thickness,
                  aspect: size.aspect,
                });
              }}
              className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-sm text-white"
            />
          </label>
          <label className="flex flex-col gap-0.5 text-[10px] text-white/50">
            Hauteur ({Math.round(widthOf(clip) * shapeAspectOf(clip) * 100)} %)
            <input
              type="number"
              min={5}
              max={90}
              value={Math.round(widthOf(clip) * shapeAspectOf(clip) * 100)}
              disabled={clip.shape === "circle"}
              onChange={(e) => {
                const w = widthOf(clip);
                const size = sizeFromWidthHeight(clip.shape, w, Number(e.target.value) / 100);
                if (!size) return;
                onUpdate(clip.id, {
                  thickness: size.thickness,
                  aspect: size.aspect,
                });
              }}
              className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-sm text-white disabled:opacity-40"
            />
          </label>
        </div>
      </CollapsibleSection>

      {/* ── TRANSFORM ── */}
      <CollapsibleSection title="Transform">
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-0.5 text-[10px] text-white/50">
            Position X ({Math.round(clip.transform.x * 100)} %)
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(clip.transform.x * 100)}
              onChange={(e) =>
                onUpdate(clip.id, {
                  transform: {
                    ...clip.transform,
                    x: Number(e.target.value) / 100,
                  },
                })
              }
              className="accent-hikma-gold"
            />
          </label>
          <label className="flex flex-col gap-0.5 text-[10px] text-white/50">
            Position Y ({Math.round(clip.transform.y * 100)} %)
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(clip.transform.y * 100)}
              onChange={(e) =>
                onUpdate(clip.id, {
                  transform: {
                    ...clip.transform,
                    y: Number(e.target.value) / 100,
                  },
                })
              }
              className="accent-hikma-gold"
            />
          </label>
          <label className="flex flex-col gap-0.5 text-[10px] text-white/50">
            Rotation {Math.round(clip.transform.rotation)}°
            <input
              type="range"
              min={-180}
              max={180}
              value={Math.round(clip.transform.rotation)}
              onChange={(e) =>
                onUpdate(clip.id, {
                  transform: {
                    ...clip.transform,
                    rotation: Number(e.target.value),
                  },
                })
              }
              className="accent-hikma-gold"
            />
          </label>
        </div>
      </CollapsibleSection>

      {/* ── KEYFRAMES ── */}
      <CollapsibleSection title="Keyframes">
        <KeyframeSection
          clip={clip}
          frame={frame}
          onUpdateKeyframes={(kfs) => onUpdate(clip.id, { keyframes: kfs })}
          onSeek={onSeek}
        />
      </CollapsibleSection>

      {/* ── EFFETS ── */}
      <CollapsibleSection title="Effets">
        <div className="flex flex-col gap-1.5">
          {/* Contour (stroke) */}
          <EffectRow
            label="Contour"
            enabled={clip.stroke !== undefined}
            onToggle={(on) =>
              onUpdate(clip.id, {
                stroke: on
                  ? clip.stroke ?? { color: "#ffffff", width: 3 }
                  : undefined,
              })
            }
          >
            <ColorField
              label="Couleur"
              value={clip.stroke?.color ?? "#ffffff"}
              onChange={(c) => onUpdate(clip.id, { stroke: { color: c, width: clip.stroke?.width ?? 3 } })}
            />
            <NumberField label="Épaisseur" value={clip.stroke?.width ?? 0} min={0} max={30} onChange={(v) => onUpdate(clip.id, { stroke: { color: clip.stroke?.color ?? "#ffffff", width: v } })} />
          </EffectRow>
          {/* Ombre directionnelle */}
          <EffectRow
            label="Ombre"
            enabled={clip.shadow !== undefined}
            onToggle={(on) =>
              onUpdate(clip.id, {
                shadow: on
                  ? clip.shadow ?? { color: "#000000", opacity: 0.5, offsetX: 4, offsetY: 6, blur: 8 }
                  : undefined,
              })
            }
          >
            <ColorField label="Couleur" value={clip.shadow?.color ?? "#000000"} onChange={(c) => onUpdate(clip.id, { shadow: { ...(clip.shadow ?? { opacity: 0.5, offsetX: 4, offsetY: 6, blur: 8 }), color: c } })} />
            <NumberField label="X" value={clip.shadow?.offsetX ?? 0} min={-60} max={60} onChange={(v) => onUpdate(clip.id, { shadow: { ...(clip.shadow ?? { color: "#000000", opacity: 0.5, offsetY: 6, blur: 8 }), offsetX: v } })} />
            <NumberField label="Y" value={clip.shadow?.offsetY ?? 0} min={-60} max={60} onChange={(v) => onUpdate(clip.id, { shadow: { ...(clip.shadow ?? { color: "#000000", opacity: 0.5, offsetX: 4, blur: 8 }), offsetY: v } })} />
            <NumberField label="Flou" value={clip.shadow?.blur ?? 0} min={0} max={60} onChange={(v) => onUpdate(clip.id, { shadow: { ...(clip.shadow ?? { color: "#000000", opacity: 0.5, offsetX: 4, offsetY: 6 }), blur: v } })} />
          </EffectRow>
          {/* Halo / Glow */}
          <EffectRow
            label="Halo"
            enabled={clip.glow !== undefined}
            onToggle={(on) =>
              onUpdate(clip.id, {
                glow: on ? clip.glow ?? { color: "#f5d47a", opacity: 0.8, radius: 16 } : undefined,
              })
            }
          >
            <ColorField label="Couleur" value={clip.glow?.color ?? "#f5d47a"} onChange={(c) => onUpdate(clip.id, { glow: { ...(clip.glow ?? { opacity: 0.8, radius: 16 }), color: c } })} />
            <NumberField label="Rayon" value={clip.glow?.radius ?? 0} min={0} max={120} onChange={(v) => onUpdate(clip.id, { glow: { ...(clip.glow ?? { color: "#f5d47a", opacity: 0.8 }), radius: v } })} />
            <NumberField label="Opacité %" value={Math.round((clip.glow?.opacity ?? 0.8) * 100)} min={0} max={100} onChange={(v) => onUpdate(clip.id, { glow: { ...(clip.glow ?? { color: "#f5d47a", radius: 16 }), opacity: v / 100 } })} />
          </EffectRow>
          {/* Flou */}
          <EffectRow
            label="Flou"
            enabled={(clip.blur ?? 0) > 0}
            onToggle={(on) => onUpdate(clip.id, { blur: on ? Math.max(2, clip.blur ?? 2) : 0 })}
          >
            <NumberField label="Rayon" value={clip.blur ?? 0} min={0} max={30} onChange={(v) => onUpdate(clip.id, { blur: v })} />
          </EffectRow>
        </div>
      </CollapsibleSection>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS UI RÉUTILISABLES
   ═══════════════════════════════════════════════════════════════════════ */

/** Ligne d'effet repliable : toggle + paramètres (affichés si activé). */
function EffectRow({
  label,
  enabled,
  onToggle,
  children,
}: {
  label: string;
  enabled: boolean;
  onToggle: (on: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-white/8 bg-black/25 p-2">
      <label className="flex cursor-pointer items-center gap-2 text-[10px] font-bold text-white/60">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="accent-hikma-teal-500"
        />
        {label}
        <span className={enabled ? "text-[9px] font-normal text-hikma-teal-400" : "text-[9px] font-normal text-white/30"}>
          {enabled ? "ON" : "OFF"}
        </span>
      </label>
      {enabled && (
        <div className="grid grid-cols-2 gap-1.5">{children}</div>
      )}
    </div>
  );
}

/** Champ couleur compact (hex). */
function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <label className="flex flex-col gap-0.5 text-[9px] text-white/45">
      {label}
      <input
        type="color"
        value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 w-full cursor-pointer rounded-md border border-white/10 bg-black/40"
      />
    </label>
  );
}

/** Champ numérique compact. */
function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-0.5 text-[9px] text-white/45">
      {label}
      <input
        type="number"
        min={min}
        max={max}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="rounded-md border border-white/10 bg-black/40 px-1.5 py-1 text-xs text-white"
      />
    </label>
  );
}
