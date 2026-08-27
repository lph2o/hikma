"use client";

// Hikma — Content Studio : SÉLECTEUR ÉDITORIAL DE FORMAT & MOT.
//
// Parcours utilisateur :
//   1. Clic "+ Nouveau contenu" (ou "+ Créer une vidéo")
//   2. Choix du format vidéo parmi les catégories (Apprendre, Comprendre, Réseaux)
//   3. Recherche en temps réel du mot (arabe, translittération ou sens français)
//   4. Génération automatique du draft
//   5. Navigation directe vers le Video Editor 9:16

import React, { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FilmIcon,
  HelpCircleIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon,
  XIcon,
  CheckIcon,
} from "lucide-react";
import type { WordCandidateItem } from "@/lib/content-api/types";
import type { GeneratableTemplateKey } from "@/lib/content-studio/types";
import {
  VIDEO_FORMATS_CATALOG,
  type VideoFormatCategory,
  type VideoFormatDefinition,
} from "@/lib/content-studio/templates";
import { createVideoDraft, searchWordsAction } from "@/app/admin/content-studio/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CreateVideoModalProps = {
  initialCandidates?: WordCandidateItem[];
  defaultOpen?: boolean;
  triggerClassName?: string;
  triggerText?: string;
};

const CATEGORIES: Array<"TOUS" | VideoFormatCategory> = [
  "TOUS",
  "APPRENDRE",
  "COMPRENDRE",
  "RÉSEAUX SOCIAUX",
];

export function CreateVideoModal({
  initialCandidates = [],
  defaultOpen = false,
  triggerClassName,
  triggerText = "Nouveau contenu",
}: CreateVideoModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [activeCategory, setActiveCategory] = useState<"TOUS" | VideoFormatCategory>("TOUS");
  const [templateKey, setTemplateKey] = useState<GeneratableTemplateKey>("WORD_REVEAL_V1");
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<WordCandidateItem[]>(initialCandidates);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Filtrage des formats selon la catégorie
  const filteredFormats = VIDEO_FORMATS_CATALOG.filter((f) =>
    activeCategory === "TOUS" ? true : f.category === activeCategory,
  );

  // Recherche avec debounce
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      setErrorMsg(null);
      try {
        const results = await searchWordsAction(query);
        setCandidates(results);
      } catch {
        setErrorMsg("Erreur lors de la recherche des mots.");
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, open]);

  // Charger les candidats initiaux à l'ouverture si vide
  const handleOpen = useCallback(async () => {
    setOpen(true);
    setQuery("");
    setErrorMsg(null);
    if (candidates.length === 0) {
      setIsSearching(true);
      try {
        const results = await searchWordsAction("");
        setCandidates(results);
      } catch {
        // Ignorer l'erreur initiale
      } finally {
        setIsSearching(false);
      }
    }
  }, [candidates.length]);

  const handleSelectWord = async (word: WordCandidateItem) => {
    setSelectedWordId(word.wordId);
    setErrorMsg(null);

    const result = await createVideoDraft({
      wordId: word.wordId,
      templateKey,
    });

    if (result.ok) {
      startTransition(() => {
        setOpen(false);
        router.push(`/admin/content-studio?contentKey=${encodeURIComponent(result.contentKey)}`);
      });
    } else {
      setSelectedWordId(null);
      setErrorMsg(result.reason);
    }
  };

  return (
    <>
      {/* Bouton Trigger */}
      <Button
        type="button"
        variant="default"
        size="sm"
        onClick={handleOpen}
        className={cn(
          "gap-1.5 rounded-xl px-4 text-xs font-bold shadow-[0_0_20px_rgba(59,160,140,0.3)]",
          triggerClassName,
        )}
      >
        <PlusIcon className="size-4" />
        <span>{triggerText}</span>
      </Button>

      {/* Modal / Dialog de sélection */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Créer une vidéo — Sélectionner un format et un mot"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
            onClick={() => !selectedWordId && setOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative flex max-h-[92dvh] w-full max-w-3xl flex-col rounded-3xl border border-white/12 bg-[#0d1411] shadow-[0_24px_64px_rgba(0,0,0,0.9)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-hikma-teal-600/20 text-hikma-teal-400">
                  <FilmIcon className="size-5" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-white">
                    Créer une vidéo 9:16
                  </h2>
                  <p className="text-xs text-white/50">
                    Choisissez votre format éditorial et sélectionnez un mot du Coran
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={Boolean(selectedWordId)}
                aria-label="Fermer"
                className="flex size-8 items-center justify-center rounded-xl text-white/50 hover:bg-white/8 hover:text-white disabled:opacity-30"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            {/* SECTION 1: FORMAT SELECTOR & CATEGORIES */}
            <div className="border-b border-white/8 bg-black/40 px-6 py-3.5">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                  1. Format Vidéo ({VIDEO_FORMATS_CATALOG.length} formats analysés)
                </span>
                {/* Category Pills */}
                <div className="flex items-center gap-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={cn(
                        "rounded-lg px-2 py-0.5 text-[10px] font-semibold transition-all",
                        activeCategory === cat
                          ? "bg-hikma-teal-600/30 text-hikma-teal-300 border border-hikma-teal-500/40"
                          : "text-white/40 hover:text-white/70 hover:bg-white/5",
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Formats Grid Scrollable */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
                {filteredFormats.map((format: VideoFormatDefinition) => {
                  const isSelected = templateKey === format.key;
                  const isAvailable = format.status === "IMPLEMENTED";

                  return (
                    <button
                      key={format.key}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => {
                        if (isAvailable) {
                          setTemplateKey(format.key as GeneratableTemplateKey);
                        }
                      }}
                      className={cn(
                        "relative flex flex-col justify-between rounded-xl border p-2.5 text-left transition-all",
                        isSelected && isAvailable
                          ? "border-hikma-teal-500/80 bg-gradient-to-br from-hikma-teal-950/60 to-black/60 shadow-[0_0_14px_rgba(59,160,140,0.25)] ring-1 ring-hikma-teal-400"
                          : isAvailable
                            ? "border-white/10 bg-white/4 hover:border-white/20 hover:bg-white/7 cursor-pointer"
                            : "border-white/5 bg-black/20 opacity-50 cursor-not-allowed",
                      )}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-xs font-bold text-white">
                              {format.name}
                            </span>
                            {isSelected && isAvailable && (
                              <CheckIcon className="size-3 text-hikma-teal-400 shrink-0" />
                            )}
                          </div>
                          <span className="block truncate text-[10px] text-white/50">
                            {format.subtitle}
                          </span>
                        </div>
                        {format.badge && (
                          <span
                            className={cn(
                              "shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider",
                              isAvailable
                                ? "bg-hikma-teal-500/20 text-hikma-teal-300 border border-hikma-teal-500/30"
                                : "bg-white/5 text-white/40 border border-white/10",
                            )}
                          >
                            {format.badge}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-[9px] text-white/40 line-clamp-2 leading-relaxed">
                        {format.description}
                      </p>

                      <div className="mt-2 flex items-center justify-between pt-1 border-t border-white/5 text-[9px] text-white/40 font-mono">
                        <span>{format.estimatedDuration}</span>
                        <span>{format.platforms.join(" · ")}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: SEARCH WORD */}
            <div className="border-b border-white/8 p-4">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-white/40">
                2. Sélectionner le mot du Coran
              </span>
              <div className="relative flex items-center">
                <SearchIcon className="pointer-events-none absolute left-3.5 size-4 text-white/40" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher en arabe (الحمد), translittération (hamd) ou français (louange)..."
                  className="h-11 w-full rounded-2xl border border-white/12 bg-black/40 pl-10 pr-10 text-xs text-white placeholder:text-white/30 outline-none transition-colors focus:border-hikma-teal-500/60 focus:bg-black/60 focus:ring-1 focus:ring-hikma-teal-500/40"
                />
                {query.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Effacer la recherche"
                    className="absolute right-3 text-white/40 hover:text-white"
                  >
                    <XIcon className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Error banner if any */}
            {errorMsg && (
              <div className="mx-6 mt-3 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            {/* Candidates List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ minHeight: "220px", maxHeight: "320px" }}>
              {isSearching ? (
                <div className="flex flex-col items-center justify-center py-12 text-white/40">
                  <Loader2Icon className="size-6 animate-spin text-hikma-teal-400" />
                  <span className="mt-2 text-xs">Recherche dans le lexique coranique...</span>
                </div>
              ) : candidates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-white/40">
                  <HelpCircleIcon className="size-8 stroke-[1.5]" />
                  <span className="mt-2 text-xs font-semibold text-white/60">
                    Aucun mot trouvé
                  </span>
                  <p className="mt-1 text-[11px] text-white/30 max-w-xs">
                    Essayez une autre orthographe en arabe ou en français.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {candidates.map((word) => {
                    const isProcessing = selectedWordId === word.wordId;
                    return (
                      <button
                        key={word.wordId}
                        type="button"
                        onClick={() => handleSelectWord(word)}
                        disabled={Boolean(selectedWordId)}
                        className={cn(
                          "group relative flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all duration-150",
                          isProcessing
                            ? "border-hikma-teal-500/80 bg-hikma-teal-600/25 ring-1 ring-hikma-teal-400"
                            : "border-white/8 bg-white/3 hover:border-hikma-teal-500/40 hover:bg-white/6 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hikma-teal-400 disabled:opacity-50",
                        )}
                      >
                        {/* Info Fr & Translit */}
                        <div className="min-w-0 flex-1 pr-3">
                          <span className="block truncate text-xs font-bold text-white group-hover:text-hikma-teal-300">
                            {word.meaning ?? "Sens validé"}
                          </span>
                          <span className="mt-0.5 block truncate font-mono text-[10px] text-white/40">
                            {word.transliteration ?? "—"}
                          </span>
                        </div>

                        {/* Arabic Word Right */}
                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            dir="rtl"
                            className="font-arabic text-xl font-medium text-white/90 group-hover:text-hikma-gold"
                            style={{ lineHeight: 1.6 }}
                          >
                            {word.arabic}
                          </span>
                          {isProcessing && (
                            <Loader2Icon className="size-4 animate-spin text-hikma-teal-400" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
