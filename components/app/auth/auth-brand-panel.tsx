import { SparklesIcon, BookOpenIcon, CheckCircle2Icon } from "lucide-react";
import { Mascot } from "@/components/ui/mascot";

export function AuthBrandPanel() {
  return (
    <div className="relative hidden w-full flex-col justify-between overflow-hidden rounded-3xl border border-border-subtle bg-gradient-to-br from-surface-elevated via-surface-subtle to-surface-featured p-8 shadow-card lg:flex xl:p-10">
      {/* Halos lumineux d'ambiance */}
      <div
        className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-hikma-gold/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-20 -right-20 size-72 rounded-full bg-hikma-teal-700/8 blur-3xl"
        aria-hidden="true"
      />

      {/* En-tête de marque du panneau */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-full border border-hikma-gold/30 bg-hikma-gold/10 px-3.5 py-1.5 text-caption font-semibold tracking-wider text-hikma-teal-700 uppercase">
          <SparklesIcon className="size-3.5 text-hikma-gold" aria-hidden="true" />
          <span>Apprentissage Coranique</span>
        </div>
      </div>

      {/* Carte centrale vitrine : Mot du Coran en calligraphie dorée */}
      <div className="relative z-10 my-8 flex flex-col items-center gap-6 text-center">
        <div className="relative w-full max-w-sm rounded-2xl border border-border/80 bg-background/80 p-6 shadow-elevated backdrop-blur-md transition-transform duration-300 hover:scale-[1.01]">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3 text-caption text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium">
              <BookOpenIcon className="size-3.5 text-hikma-teal-700" />
              Sourate Al-Baqarah · v. 269
            </span>
            <span className="rounded-md bg-hikma-gold/15 px-2 py-0.5 font-semibold text-hikma-teal-800 text-[11px]">
              20 occurrences
            </span>
          </div>

          <div className="my-5 flex flex-col items-center gap-1">
            <span
              lang="ar"
              dir="rtl"
              className="font-arabic text-5xl font-bold tracking-normal text-hikma-gold-bright drop-shadow-sm select-none"
            >
              حِكْمَة
            </span>
            <span className="text-body-sm font-medium tracking-wide text-muted-foreground">
              ḥikmah
            </span>
          </div>

          <div className="rounded-xl border border-border-subtle/60 bg-surface-subtle/80 px-4 py-2.5 text-center">
            <p className="text-body-md font-semibold text-foreground">
              « Sagesse, compréhension profonde »
            </p>
          </div>
        </div>

        {/* Message d'accompagnement & Mascotte */}
        <div className="flex items-center gap-4 rounded-2xl border border-border-subtle bg-surface-elevated/70 px-5 py-3 shadow-xs">
          <Mascot variant="welcome" size="sm" decorative />
          <div className="text-left">
            <p className="text-body-sm font-semibold text-foreground">
              Apprends le Coran mot par mot
            </p>
            <p className="text-caption text-muted-foreground">
              Comprends 80% du texte sacré avec seulement 500 mots clés.
            </p>
          </div>
        </div>
      </div>

      {/* 3 piliers de réassurance */}
      <div className="relative z-10 grid grid-cols-3 gap-3 border-t border-border-subtle/80 pt-6 text-left">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-caption font-semibold text-foreground">
            <CheckCircle2Icon className="size-3.5 text-hikma-teal-700" />
            <span>5 min / jour</span>
          </div>
          <p className="text-[12px] text-muted-foreground leading-tight">
            Micro-leçons digestes et ciblées
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-caption font-semibold text-foreground">
            <CheckCircle2Icon className="size-3.5 text-hikma-teal-700" />
            <span>SRS Intelligent</span>
          </div>
          <p className="text-[12px] text-muted-foreground leading-tight">
            Mémorisation durable prouvée
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-caption font-semibold text-foreground">
            <CheckCircle2Icon className="size-3.5 text-hikma-teal-700" />
            <span>Audio Authentique</span>
          </div>
          <p className="text-[12px] text-muted-foreground leading-tight">
            Récitations claires Al-Afasy
          </p>
        </div>
      </div>
    </div>
  );
}
