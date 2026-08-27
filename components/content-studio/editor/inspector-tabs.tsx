"use client";

// Hikma — Content Studio (UI2.5 / Phase V2) : INSPECTEUR MODULAIRE À ONGLETS.
//
// 4 onglets de personnalisation studio :
//   - CONTENU   : Texte arabe (RTL, font-amiri), translittération, texte principal, sous-titres,
//                 modes arabes (standard, large, highlight, etc.) et traduction verset.
//   - TIMING    : Durée en frames & secondes
//   - ANIMATION : Contrôles Word Hero (pour mot) & Golden Recitation Follower (pour Coran)
//   - AUDIO     : Piste mot & verset, volume, mute, fades.
//
// SÉCURITÉ ARABE : `dir="rtl"`, `font-arabic`, `overflow: visible` sur tous les champs arabes.

import React, { useState } from "react";
import {
  BookOpenIcon,
  CheckIcon,
  LanguagesIcon,
  MusicIcon,
  SparklesIcon,
  TextIcon,
  TimerIcon,
} from "lucide-react";
import type {
  GoldenFollowerStyle,
  VerseDisplayConfig,
  VerseDisplayMode,
  VerseHighlightStyle,
  VideoScene,
  WordHeroSettings,
} from "@/lib/content-studio/video/types";
import { normalizeWordHero } from "@/remotion/motion";
import { cn } from "@/lib/utils";
import { InspectorAudio } from "./inspector-audio";

type EditableTextField = "text" | "subtext" | "arabic" | "transliteration";

const SCENE_EDITABLE: Record<string, EditableTextField[]> = {
  intro: ["text"],
  word: ["arabic", "transliteration"],
  meaning: ["text", "subtext"],
  quran: ["arabic", "subtext"],
  explanation: ["text"],
  cta: ["text"],
};

const FIELD_LABELS: Record<EditableTextField, string> = {
  arabic: "Texte arabe",
  transliteration: "Translittération",
  text: "Texte principal",
  subtext: "Texte secondaire",
};

type InspectorTabId = "content" | "timing" | "animation" | "audio";

const TABS: { id: InspectorTabId; label: string; icon: React.ReactNode }[] = [
  { id: "content", label: "Contenu", icon: <TextIcon className="size-3.5" /> },
  { id: "timing", label: "Timing", icon: <TimerIcon className="size-3.5" /> },
  { id: "animation", label: "Animation", icon: <SparklesIcon className="size-3.5" /> },
  { id: "audio", label: "Audio", icon: <MusicIcon className="size-3.5" /> },
];

const VERSE_MODES: { id: VerseDisplayMode; label: string; desc: string }[] = [
  { id: "standard", label: "Standard", desc: "Verset complet centré" },
  { id: "large", label: "Grand format", desc: "Verset agrandi pour immersion" },
  { id: "highlight-word", label: "Mot surligné", desc: "Met en valeur le mot étudié" },
  { id: "progressive", label: "Progressif", desc: "Révélation au fil de la récitation" },
  { id: "word-focus", label: "Word Focus", desc: "Contraste accentué sur le mot" },
  { id: "line-by-line", label: "Ligne par ligne", desc: "Affichage structuré" },
];

const FOLLOWER_STYLES: { id: GoldenFollowerStyle; label: string }[] = [
  { id: "gold-highlight", label: "Or Éclatant (Highlight)" },
  { id: "gold-glow", label: "Aura Dorée (Gold Glow)" },
  { id: "gold-underline", label: "Souligné Or (Underline)" },
  { id: "gold-background", label: "Fond Subtil (Background)" },
  { id: "gold-sweep", label: "Balayage Lumineux (Sweep)" },
  { id: "gold-scale", label: "Zoom Subtil (Scale)" },
];

const HIGHLIGHT_STYLES: { id: VerseHighlightStyle; label: string }[] = [
  { id: "glow", label: "Aura lumineuse" },
  { id: "underline", label: "Soulignement doré" },
  { id: "background", label: "Fond contrasté" },
  { id: "scale", label: "Légère mise à l'échelle" },
  { id: "color", label: "Couleur or direct" },
];

function FieldInput({
  label,
  field,
  value,
  index,
  onChange,
}: {
  label: string;
  field: EditableTextField;
  value: string;
  index: number;
  onChange: (field: EditableTextField, index: number, value: string | null) => void;
}) {
  const isArabic = field === "arabic";
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(field, index, e.target.value)}
        dir={isArabic ? "rtl" : "ltr"}
        aria-label={label}
        className={cn(
          "w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white outline-none transition-all",
          "placeholder:text-white/20 focus:border-hikma-teal-500/60 focus:bg-black/60 focus:ring-1 focus:ring-hikma-teal-500/40",
          isArabic && "font-arabic text-right text-base leading-relaxed text-hikma-ivory",
        )}
        placeholder={isArabic ? "نص عربي" : `Saisir ${label.toLowerCase()}`}
      />
    </label>
  );
}

function HeroToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-white/3 p-2.5 transition-colors hover:bg-white/6">
      <span className="text-xs font-medium text-white/80">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors",
          checked ? "bg-hikma-teal-500" : "bg-white/20",
        )}
      >
        <span
          className={cn(
            "inline-block size-3.5 transform rounded-full bg-white transition-transform",
            checked ? "translate-x-4" : "translate-x-1",
          )}
        />
      </button>
    </label>
  );
}

function HeroSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5 px-2 py-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-white/60">{label}</span>
        <span className="font-mono text-hikma-teal-400">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-hikma-teal-500"
      />
    </label>
  );
}

export function InspectorTabs({
  scene,
  index,
  fps,
  onField,
  onDuration,
  onHero,
  onAudio,
  onVerseConfig,
}: {
  scene: VideoScene;
  index: number;
  fps: number;
  onField: (field: EditableTextField, index: number, value: string | null) => void;
  onDuration: (index: number, duration: number) => void;
  onHero: (patch: (hero: WordHeroSettings) => WordHeroSettings) => void;
  onAudio?: (patch: Partial<VideoScene>) => void;
  onVerseConfig?: (patch: (cfg: VerseDisplayConfig) => VerseDisplayConfig) => void;
}) {
  const [activeTab, setActiveTab] = useState<InspectorTabId>("content");
  const editableFields = SCENE_EDITABLE[scene.kind] ?? [];
  const hero = normalizeWordHero(scene.hero);
  const patchHero = (fn: (h: WordHeroSettings) => WordHeroSettings) => onHero(fn);

  const verseConfig = scene.verseConfig ?? {};
  const patchVerse = (fn: (cfg: VerseDisplayConfig) => VerseDisplayConfig) => {
    if (onVerseConfig) {
      onVerseConfig(fn);
    } else if (onAudio) {
      onAudio({ verseConfig: fn(verseConfig) });
    }
  };

  return (
    <div className="flex flex-col">
      {/* Tab Navigation */}
      <div
        role="tablist"
        aria-label="Onglets de l'inspecteur"
        className="grid grid-cols-4 border-b border-white/8 bg-black/20"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all",
              activeTab === tab.id
                ? "border-b-2 border-hikma-teal-400 bg-white/4 text-hikma-teal-300 shadow-[inset_0_-4px_8px_rgba(59,160,140,0.15)]"
                : "text-white/40 hover:bg-white/2 hover:text-white/70",
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content Panels */}
      <div className="p-4">
        {/* 1. CONTENU */}
        {activeTab === "content" && (
          <div className="flex flex-col gap-4">
            {editableFields.length > 0 ? (
              editableFields.map((field) => {
                const label = FIELD_LABELS[field];
                const rawVal = scene[field];
                const val = typeof rawVal === "string" ? rawVal : "";
                return (
                  <FieldInput
                    key={field}
                    label={label}
                    field={field}
                    value={val}
                    index={index}
                    onChange={onField}
                  />
                );
              })
            ) : (
              <div className="rounded-xl border border-white/5 bg-white/2 p-3 text-center text-xs text-white/40">
                Aucun champ textuel éditable sur cette scène.
              </div>
            )}

            {/* OPTIONS AVANCÉES CORAN (Phase V2) */}
            {scene.kind === "quran" && (
              <div className="flex flex-col gap-4 border-t border-white/8 pt-3">
                {/* 1.1 Mode d'affichage arabe */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-hikma-teal-400">
                    Mode d&apos;affichage arabe
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {VERSE_MODES.map((m) => {
                      const isSelected = (verseConfig.mode ?? "standard") === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => patchVerse((c) => ({ ...c, mode: m.id }))}
                          className={cn(
                            "flex flex-col items-start rounded-xl border p-2 text-left transition-all",
                            isSelected
                              ? "border-hikma-teal-500/60 bg-hikma-teal-600/20 text-white"
                              : "border-white/8 bg-black/30 text-white/60 hover:bg-white/5",
                          )}
                        >
                          <div className="flex w-full items-center justify-between">
                            <span className="text-xs font-bold">{m.label}</span>
                            {isSelected && <CheckIcon className="size-3 text-hikma-teal-300" />}
                          </div>
                          <span className="text-[9px] text-white/40 leading-tight mt-0.5">
                            {m.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 1.2 Traduction du verset */}
                <div className="flex flex-col gap-2 rounded-xl border border-white/8 bg-black/40 p-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <LanguagesIcon className="size-3.5 text-hikma-gold" />
                      Traduction du verset
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        patchVerse((c) => ({
                          ...c,
                          showTranslation: !(c.showTranslation ?? false),
                          translation: c.translation ?? {
                            language: "fr",
                            sourceName: "Hamidullah",
                            position: "below",
                            text: "",
                          },
                        }))
                      }
                      className={cn(
                        "rounded-lg border px-2 py-0.5 font-mono text-[9px] font-semibold transition-colors",
                        verseConfig.showTranslation
                          ? "border-hikma-teal-500/50 bg-hikma-teal-600/20 text-hikma-teal-300"
                          : "border-white/10 bg-white/5 text-white/50 hover:text-white",
                      )}
                    >
                      {verseConfig.showTranslation ? "VISIBLE" : "MASQUÉ"}
                    </button>
                  </div>

                  {verseConfig.showTranslation && (
                    <div className="flex flex-col gap-2.5 pt-2 border-t border-white/5">
                      <label className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold uppercase text-white/40">
                          Texte de traduction
                        </span>
                        <textarea
                          rows={2}
                          value={verseConfig.translation?.text ?? ""}
                          onChange={(e) =>
                            patchVerse((c) => ({
                              ...c,
                              translation: { ...c.translation, text: e.target.value },
                            }))
                          }
                          placeholder="Saisir la traduction du verset..."
                          className="w-full rounded-lg border border-white/10 bg-black/60 p-2 text-xs text-white placeholder:text-white/20 focus:border-hikma-teal-500/60 outline-none"
                        />
                      </label>

                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold uppercase text-white/40">Langue</span>
                          <select
                            value={verseConfig.translation?.language ?? "fr"}
                            onChange={(e) =>
                              patchVerse((c) => ({
                                ...c,
                                translation: {
                                  ...c.translation,
                                  language: e.target.value as "fr" | "en" | "it",
                                },
                              }))
                            }
                            className="rounded-lg border border-white/10 bg-black/60 p-1.5 text-xs text-white outline-none"
                          >
                            <option value="fr">Français (Hamidullah)</option>
                            <option value="en">English (Sahih Intl)</option>
                            <option value="it">Italiano (Piccardo)</option>
                          </select>
                        </label>

                        <label className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold uppercase text-white/40">Position</span>
                          <select
                            value={verseConfig.translation?.position ?? "below"}
                            onChange={(e) =>
                              patchVerse((c) => ({
                                ...c,
                                translation: {
                                  ...c.translation,
                                  position: e.target.value as "below" | "card" | "separate",
                                },
                              }))
                            }
                            className="rounded-lg border border-white/10 bg-black/60 p-1.5 text-xs text-white outline-none"
                          >
                            <option value="below">Sous le verset</option>
                            <option value="card">Carte translucide</option>
                            <option value="separate">Séparée</option>
                          </select>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* 1.3 Surlignage mot étudié */}
                <div className="flex flex-col gap-2 rounded-xl border border-white/8 bg-black/40 p-3">
                  <span className="text-xs font-bold text-white">
                    Surlignage du mot étudié
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {HIGHLIGHT_STYLES.map((h) => {
                      const isSelected = (verseConfig.highlight?.style ?? "glow") === h.id;
                      return (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() =>
                            patchVerse((c) => ({
                              ...c,
                              highlight: { ...c.highlight, style: h.id },
                            }))
                          }
                          className={cn(
                            "rounded-lg border p-1.5 text-left text-[10px] font-medium transition-all",
                            isSelected
                              ? "border-hikma-gold/70 bg-amber-950/40 text-hikma-gold"
                              : "border-white/6 bg-white/2 text-white/60 hover:bg-white/4",
                          )}
                        >
                          {h.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. TIMING */}
        {activeTab === "timing" && (
          <div className="flex flex-col gap-4 py-2">
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-white/50">
                Durée de la scène
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-hikma-teal-300">
                  {(scene.durationInFrames / fps).toFixed(2)}
                </span>
                <span className="text-xs text-white/50">secondes</span>
                <span className="ml-auto font-mono text-xs text-white/30">
                  {scene.durationInFrames} frames
                </span>
              </div>
            </div>

            <HeroSlider
              label="Ajustement de durée (secondes)"
              value={scene.durationInFrames / fps}
              min={1}
              max={15}
              step={0.5}
              onChange={(s) => onDuration(index, Math.round(s * fps))}
            />
          </div>
        )}

        {/* 3. ANIMATION */}
        {activeTab === "animation" && (
          <div className="flex flex-col gap-3 py-1">
            {/* Si c'est la scène CORAN -> Contrôles du GOLDEN RECITATION FOLLOWER */}
            {scene.kind === "quran" ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between rounded-xl border border-hikma-gold/30 bg-amber-950/20 p-3">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg border border-hikma-gold/40 bg-amber-500/20 text-hikma-gold">
                      <BookOpenIcon className="size-3.5" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white">Suivi Doré de Récitation</h4>
                      <span className="text-[9px] text-white/50">Golden Recitation Follower</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      patchVerse((c) => ({
                        ...c,
                        follower: {
                          ...c.follower,
                          enabled: !(c.follower?.enabled ?? true),
                        },
                      }))
                    }
                    className={cn(
                      "rounded-lg border px-2 py-0.5 font-mono text-[9px] font-semibold transition-colors",
                      (verseConfig.follower?.enabled ?? true)
                        ? "border-hikma-gold/60 bg-amber-950/60 text-hikma-gold"
                        : "border-white/10 bg-white/5 text-white/40",
                    )}
                  >
                    {(verseConfig.follower?.enabled ?? true) ? "ACTIF ✓" : "DÉSACTIVÉ"}
                  </button>
                </div>

                {/* Choix du style de Golden Follower */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                    Style d&apos;animation dorée
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {FOLLOWER_STYLES.map((fs) => {
                      const isSelected = (verseConfig.follower?.style ?? "gold-highlight") === fs.id;
                      return (
                        <button
                          key={fs.id}
                          type="button"
                          onClick={() =>
                            patchVerse((c) => ({
                              ...c,
                              follower: { ...c.follower, style: fs.id },
                            }))
                          }
                          className={cn(
                            "rounded-xl border p-2 text-left text-xs font-medium transition-all",
                            isSelected
                              ? "border-hikma-gold bg-amber-950/40 text-hikma-gold shadow-[0_0_12px_rgba(201,168,76,0.2)]"
                              : "border-white/8 bg-black/30 text-white/60 hover:bg-white/5",
                          )}
                        >
                          {fs.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-white/6 bg-white/2 p-2.5 text-[10px] text-white/40 leading-relaxed">
                  L&apos;animation suit la progression temporelle de la récitation continue du verset sans fragmentation audio.
                </div>
              </div>
            ) : scene.kind !== "word" ? (
              <div className="rounded-xl border border-white/5 bg-white/2 p-4 text-center text-xs text-white/40">
                Les animations Word Hero et Golden Follower sont configurables sur les scènes Mot et Coran.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <HeroToggle
                  label="Balayage lumineux (Light sweep)"
                  checked={hero.lightSweep.enabled}
                  onChange={(v) => patchHero((h) => ({ ...h, lightSweep: { ...h.lightSweep, enabled: v } }))}
                />
                {hero.lightSweep.enabled && (
                  <HeroSlider
                    label="Intensité du balayage"
                    value={hero.lightSweep.intensity ?? 0.8}
                    min={0.1}
                    max={1}
                    step={0.05}
                    onChange={(v) => patchHero((h) => ({ ...h, lightSweep: { ...h.lightSweep, intensity: v } }))}
                  />
                )}

                <HeroToggle
                  label="Éclat doré (Golden glint)"
                  checked={hero.goldenGlint.enabled}
                  onChange={(v) => patchHero((h) => ({ ...h, goldenGlint: { ...h.goldenGlint, enabled: v } }))}
                />

                <HeroToggle
                  label="Reflet miroir sous le mot"
                  checked={hero.mirror.enabled}
                  onChange={(v) => patchHero((h) => ({ ...h, mirror: { ...h.mirror, enabled: v } }))}
                />

                <HeroToggle
                  label="Halo lumineux (Glow)"
                  checked={hero.glow.enabled}
                  onChange={(v) => patchHero((h) => ({ ...h, glow: { ...h.glow, enabled: v } }))}
                />

                <HeroToggle
                  label="Respiration subtile"
                  checked={hero.breathing.enabled}
                  onChange={(v) => patchHero((h) => ({ ...h, breathing: { ...h.breathing, enabled: v } }))}
                />

                <HeroToggle
                  label="Profondeur de contact"
                  checked={hero.depth.enabled}
                  onChange={(v) => patchHero((h) => ({ ...h, depth: { ...h.depth, enabled: v } }))}
                />
              </div>
            )}
          </div>
        )}

        {/* 4. AUDIO (Timeline Pro) */}
        {activeTab === "audio" && (
          <div className="py-1">
            <InspectorAudio
              scene={scene}
              sceneIndex={index}
              fps={fps}
              onUpdateAudio={(patch) => onAudio?.(patch)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
