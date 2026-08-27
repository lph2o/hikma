import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FilmIcon, SparklesIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/content-studio/admin";
import { ContentRegistryService } from "@/lib/content-studio/registry";
import { getContentStudioDbClient } from "@/lib/content-studio/client";
import { ContentStudioService } from "@/lib/content-api/service";
import { getContentStudioClient } from "@/lib/content-api/client";
import type { ContentItemStatus, ContentStudioItem } from "@/lib/content-studio/types";
import {
  buildVideoContentFromQuiz,
  buildVideoContentFromReveal,
  buildVideoContentFromDeepDive,
  buildVideoContentFromFrequencyFact,
  buildVideoContentFromSurahHighlight,
  toVideoSceneData,
} from "@/lib/content-studio/video/pipeline";
import type { VideoScene } from "@/lib/content-studio/video/types";
import { resolveEffectiveSceneData } from "@/lib/content-studio/editor/state";
import { VideoEditor } from "@/components/content-studio/video-editor";
import { StudioShell } from "@/components/content-studio/studio-shell";
import { ContentGrid } from "@/components/content-studio/library/content-grid";
import { ContentFilters } from "@/components/content-studio/library/content-filters";
import { EditorialOverview } from "@/components/content-studio/library/editorial-overview";
import type { ContentCardData } from "@/components/content-studio/library/content-card";
import { CreateVideoModal } from "@/components/content-studio/library/create-video-modal";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Caption } from "@/components/ui/typography";
import { resolveContentStudioAudio, type ContentStudioAudio } from "@/lib/content-studio/audio";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

const ALL_STATUSES: ContentItemStatus[] = [
  "DRAFT", "REVIEW", "APPROVED", "SCHEDULED", "PUBLISHED", "REJECTED", "ARCHIVED", "EXPORTED",
];

const TEMPLATE_META: Record<string, { label: string; desc: string }> = {
  WORD_REVEAL_V1: { label: "Word Reveal", desc: "Format découverte d'un mot coranique" },
  WORD_QUIZ_V1: { label: "Word Quiz", desc: "Format quiz & mémorisation interactive" },
  VERSE_DEEP_DIVE_V1: { label: "Immersion Verset", desc: "Verset complet avec récitation audio et Golden Follower" },
  FREQUENCY_FACT_V1: { label: "Frequency Fact", desc: "Statistique d'occurrence dans le Noble Coran" },
  SURAH_HIGHLIGHT_V1: { label: "Mots Clés de Sourate", desc: "Les mots essentiels d'une sourate" },
};

function templateLabel(key: string): string {
  return TEMPLATE_META[key]?.label ?? key;
}

function itemArabic(item: ContentStudioItem): string {
  return (item.payload as { word?: { arabic?: string } }).word?.arabic ?? templateLabel(item.templateKey);
}

/** Montage EFFECTIF d'un contenu (dérivé + overrides d'édition + audio). */
function effectiveScenes(
  item: ContentStudioItem,
  editorState: Record<string, unknown> | null,
  audio?: ContentStudioAudio,
): {
  scenes: VideoScene[];
  fps: number;
  width: number;
  height: number;
  hasEdits: boolean;
} {
  const content =
    item.templateKey === "WORD_QUIZ_V1"
      ? buildVideoContentFromQuiz(item.payload as never, audio)
      : item.templateKey === "VERSE_DEEP_DIVE_V1"
        ? buildVideoContentFromDeepDive(item.payload as never, audio)
        : item.templateKey === "FREQUENCY_FACT_V1"
          ? buildVideoContentFromFrequencyFact(item.payload as never, audio)
          : item.templateKey === "SURAH_HIGHLIGHT_V1"
            ? buildVideoContentFromSurahHighlight(item.payload as never, audio)
            : buildVideoContentFromReveal(item.payload as never, audio);
  const data = toVideoSceneData(content);
  const resolved = resolveEffectiveSceneData(content, editorState as never);
  return {
    scenes: resolved.scenes,
    fps: data.fps,
    width: data.width,
    height: data.height,
    hasEdits: resolved.hasEdits,
  };
}

export default async function ContentStudioPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; contentKey?: string; msg?: string }>;
}) {
  const { status: statusParam, contentKey, msg } = await searchParams;
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) redirect("/");

  const registry = new ContentRegistryService(getContentStudioDbClient());
  const studioService = new ContentStudioService(getContentStudioClient());
  const candidatesResult = await studioService.listWordCandidates({ limit: 16 });
  const initialCandidates = candidatesResult.items;

  // ------------------------------------------------------------------
  // Vue ÉDITEUR : un contenu précis est demandé (workspace créatif).
  // ------------------------------------------------------------------
  if (contentKey) {
    const item = await registry.getByContentKey(contentKey);
    if (!item) {
      // État vide gracieux si le contentKey est introuvable
      return (
        <StudioShell active="library" sticky={false}>
          <div className="flex w-full min-w-0 flex-1 flex-col items-center justify-center p-6">
            <Empty className="max-w-md py-16">
              <EmptyMedia variant="icon">
                <FilmIcon className="size-6 text-hikma-gold" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle className="text-white">Aucun mot sélectionné</EmptyTitle>
                <EmptyDescription className="text-white/60">
                  Choisissez un mot du Coran pour commencer à créer votre vidéo 9:16.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <CreateVideoModal
                  initialCandidates={initialCandidates}
                  triggerText="Choisir un mot"
                  defaultOpen={true}
                />
              </EmptyContent>
            </Empty>
          </div>
        </StudioShell>
      );
    }

    const payloadAny = item.payload as {
      sources?: { ayahId?: string | null };
      firstOccurrence?: {
        surahNumber?: number;
        ayahNumber?: number;
        globalAyahNumber?: number | null;
      };
    } | null;

    const audio = await resolveContentStudioAudio(client, {
      wordId: item.wordId,
      ayahId: payloadAny?.sources?.ayahId,
      globalAyahNumber: payloadAny?.firstOccurrence?.globalAyahNumber,
      surahNumber: payloadAny?.firstOccurrence?.surahNumber,
      ayahNumber: payloadAny?.firstOccurrence?.ayahNumber,
    });

    const { scenes, fps, width, height, hasEdits } = effectiveScenes(item, item.editorState, audio);

    return (
      <StudioShell active="library" sticky={false}>
        <div className="flex w-full min-w-0 flex-1 flex-col">
          {msg ? (
            <Caption className="border-b border-white/8 bg-info/10 px-4 py-2 text-info-text sm:px-5">
              Message : {msg}
            </Caption>
          ) : null}
          <VideoEditor
            contentKey={item.contentKey}
            templateKey={item.templateKey}
            title={itemArabic(item)}
            fps={fps}
            width={width}
            height={height}
            initialScenes={scenes}
            status={item.status}
            renderStatus={item.renderStatus}
            renderPath={item.renderPath}
            hasEdits={hasEdits}
          />
        </div>
      </StudioShell>
    );
  }

  // ------------------------------------------------------------------
  // Vue BIBLIOTHÈQUE (registre + sélection éditoriale).
  // ------------------------------------------------------------------
  const filter = ALL_STATUSES.includes(statusParam as ContentItemStatus)
    ? (statusParam as ContentItemStatus)
    : undefined;
  const page = await registry.list({ status: filter, limit: 100 });

  const cards: ContentCardData[] = page.items.map((item) => {
    const { scenes } = effectiveScenes(item, item.editorState);
    const dur = scenes.reduce((a, s) => a + s.durationInFrames, 0) / 30;
    return {
      contentKey: item.contentKey,
      href: `/admin/content-studio?contentKey=${encodeURIComponent(item.contentKey)}`,
      arabic: itemArabic(item),
      title: templateLabel(item.templateKey),
      templateKey: item.templateKey,
      status: item.status,
      renderStatus: item.renderStatus,
      meta: `${dur.toFixed(0)}s · v${item.version}`,
    };
  });

  const empty = page.items.length === 0;

  return (
    <StudioShell active="library">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
        {/* Hero Studio Banner */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Content Studio
              </h1>
              <span className="flex items-center gap-1 rounded-full border border-hikma-gold/30 bg-hikma-gold/10 px-2 py-0.5 text-[10px] font-semibold text-hikma-gold-muted">
                <SparklesIcon className="size-3 text-hikma-gold" />
                V2.5
              </span>
            </div>
            <p className="text-xs text-white/50 sm:text-sm">
              Crée, planifie et publie ton contenu vidéo Hikma.
            </p>
          </div>

          {/* Bouton Créer une vidéo -> Sélecteur éditorial */}
          <CreateVideoModal
            initialCandidates={initialCandidates}
            triggerText="Nouveau contenu"
          />
        </div>

        {msg ? (
          <Caption className="mt-4 block rounded-xl border border-info/30 bg-info/10 px-4 py-2.5 text-info-text">
            Message : {msg}
          </Caption>
        ) : null}

        {/* Aperçu synthétique du statut */}
        {!empty && (
          <div className="mt-6">
            <EditorialOverview items={page.items} />
          </div>
        )}

        {/* Section Galerie de Contenus */}
        <section className="mt-8 flex flex-col gap-5" aria-label="Galerie des contenus">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-white/50">
              Projets récents ({page.total})
            </span>
            <ContentFilters
              statuses={ALL_STATUSES}
              active={filter}
              total={page.total}
              hrefFor={(st) =>
                st
                  ? `/admin/content-studio?status=${encodeURIComponent(st)}`
                  : "/admin/content-studio"
              }
            />
          </div>

          {empty ? (
            <Empty className="rounded-3xl border border-dashed border-white/10 bg-[#090d0b] py-16">
              <EmptyMedia variant="icon">
                <FilmIcon className="size-6 text-hikma-teal-400" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle className="text-white">Aucun projet vidéo</EmptyTitle>
                <EmptyDescription className="text-white/60">
                  {filter
                    ? `Aucun contenu avec le filtre « ${filter} ».`
                    : "Commencez par choisir un mot du Coran pour créer votre première vidéo."}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <CreateVideoModal
                  initialCandidates={initialCandidates}
                  triggerText="Créer une vidéo"
                />
              </EmptyContent>
            </Empty>
          ) : (
            <ContentGrid items={cards} />
          )}
        </section>
      </div>
    </StudioShell>
  );
}
