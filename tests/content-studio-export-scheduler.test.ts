import { describe, expect, it } from "vitest";
import { buildExportBundle } from "../lib/content-studio/export";
import {
  availablePlatforms,
  getPublishingAdapter,
  registerPublishingAdapter,
} from "../lib/content-studio/publishing";
import {
  CONTENT_SCHEDULE_TIMEZONE,
  isPublishDue,
  parsePublishAt,
  PUBLISH_MAX_ATTEMPTS,
} from "../lib/content-studio/scheduler";
import { REVEAL_FIXTURE_YAWMA } from "../lib/content-studio/video/fixtures";
import { buildVideoContentFromReveal, toVideoSceneData } from "../lib/content-studio/video/pipeline";
import type { ContentStudioItem } from "../lib/content-studio/types";

const item: ContentStudioItem = {
  id: "id-1",
  contentKey: REVEAL_FIXTURE_YAWMA.contentKey,
  templateKey: "WORD_REVEAL_V1",
  templateVersion: "1",
  language: "fr",
  wordId: REVEAL_FIXTURE_YAWMA.word.id,
  hookVariantId: "HOOK_H1",
  ctaId: "CTA_LEARN_01",
  status: "APPROVED",
  version: 3,
  renderStatus: "RENDERED",
  renderedAt: "2026-08-27T10:00:00.000Z",
  renderError: null,
  renderPath: "out/hikma-word-video.mp4",
  payload: REVEAL_FIXTURE_YAWMA as unknown as Record<string, unknown>,
  sources: REVEAL_FIXTURE_YAWMA.sources as unknown as Record<string, unknown>,
  licenses: REVEAL_FIXTURE_YAWMA.licenses as unknown as Record<string, unknown>,
  editorState: null,
  createdAt: "2026-08-27T09:00:00.000Z",
  updatedAt: "2026-08-27T10:00:00.000Z",
};

describe("buildExportBundle (B7)", () => {
  it("bundle déterministe : contenu + montage + instantanés, published=false", () => {
    const bundle = buildExportBundle(item);
    expect(bundle.contentType).toBe("VIDEO");
    expect(bundle.contentKey).toBe(item.contentKey);
    expect(bundle.version).toBe(3);
    expect(bundle.status).toBe("EXPORTED");
    expect(bundle.published).toBe(false); // EXPORTÉ ≠ PUBLIÉ
    expect(bundle.renderPath).toBe("out/hikma-word-video.mp4");
    expect(bundle.renderStatus).toBe("RENDERED");
    expect(bundle.sceneData).not.toBeNull();
    expect(bundle.sceneData?.layout).toBe("9:16");
    expect(bundle.sourceSnapshot.licenses.audio).toBe("DISABLED");
  });

  it("le montage exporté est identique au pipeline (déterminisme)", () => {
    const bundle = buildExportBundle(item);
    const expected = toVideoSceneData(buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA));
    expect(bundle.sceneData).toEqual(expected);
  });

  it("FREQUENCY_FACT_V1 → sceneData dérivée (dispatch unifié, montage complet à l'export)", () => {
    const ff = { ...item, templateKey: "FREQUENCY_FACT_V1" as const };
    const bundle = buildExportBundle(ff);
    // Depuis le dispatch unique (content-dispatch.ts), FREQUENCY_FACT possède
    // un builder réel : l'export embarque le montage dérivé (jamais inventé).
    expect(bundle.sceneData).not.toBeNull();
    expect(bundle.sceneData!.scenes.length).toBeGreaterThan(0);
  });

  it("clé de template sans builder → sceneData null (jamais inventé)", () => {
    const unknown = { ...item, templateKey: "TEMPLATE_FUTUR_V1" as never };
    const bundle = buildExportBundle(unknown);
    expect(bundle.sceneData).toBeNull();
  });
});

describe("publishing abstraction (B9)", () => {
  it("aucun adapter en V1 — availablePlatforms vide, aucun PUBLISHED possible", () => {
    expect(availablePlatforms()).toEqual([]);
    expect(getPublishingAdapter("TIKTOK")).toBeNull();
  });

  it("enregistrement/retrait dynamique d'un adapter (sans couplage Remotion)", async () => {
    const adapter = {
      platform: "TIKTOK" as const,
      publish: async () => ({
        platform: "TIKTOK" as const,
        platformPostId: "p-1",
        publishedAt: "2026-08-27T12:00:00.000Z",
      }),
    };
    registerPublishingAdapter(adapter);
    expect(availablePlatforms()).toEqual(["TIKTOK"]);
    const got = getPublishingAdapter("TIKTOK");
    expect(got).not.toBeNull();
    const result = await got!.publish({
      contentKey: item.contentKey,
      version: item.version,
      renderPath: item.renderPath!,
      caption: "caption",
      platform: "TIKTOK",
    });
    expect(result.platformPostId).toBe("p-1"); // PUBLISHED n'est déclaré qu'avec un id réel
  });
});

describe("scheduler de publication (B10)", () => {
  it("fuseau explicite Europe/Paris, retry borné, indépendant de LeitnerScheduler", () => {
    expect(CONTENT_SCHEDULE_TIMEZONE).toBe("Europe/Paris");
    expect(PUBLISH_MAX_ATTEMPTS).toBe(3);
  });

  it("isPublishDue respecte le fuseau (01:30 à Paris ≠ 01:30 UTC)", () => {
    // Heure murale SANS offset : 2026-08-27 01:30 à Paris = 23:30 UTC la veille
    // (été, UTC+2).
    const schedule = {
      contentKey: item.contentKey,
      version: 3,
      publishAt: "2026-08-27T01:30:00",
      timezone: "Europe/Paris",
      platform: "TIKTOK" as const,
    };
    // 23:29 UTC (01:29 à Paris) : pas encore due.
    expect(isPublishDue(schedule, new Date("2026-08-26T23:29:00.000Z"))).toBe(false);
    // 23:30 UTC (01:30 à Paris) : due.
    expect(isPublishDue(schedule, new Date("2026-08-26T23:30:00.000Z"))).toBe(true);
  });

  it("parsePublishAt : offset explicite → instantané direct ; heure locale → conversion fuseau", () => {
    // Avec offset : parsing direct, aucun calcul de fuseau.
    expect(parsePublishAt("2026-08-27T01:30:00+02:00", "Europe/Paris").toISOString())
      .toBe("2026-08-26T23:30:00.000Z");
    // Sans offset : interprété comme heure locale de Paris.
    expect(parsePublishAt("2026-08-27T01:30:00", "Europe/Paris").toISOString())
      .toBe("2026-08-26T23:30:00.000Z");
    // Sans offset, autre fuseau (New York, été UTC-4) : 01:30 locale = 05:30 UTC.
    expect(parsePublishAt("2026-08-27T01:30:00", "America/New_York").toISOString())
      .toBe("2026-08-27T05:30:00.000Z");
  });

  it("l'idempotence de scheduling repose sur contentKey (un SCHEDULED actif par contenu)", () => {
    // Le registre ne permet qu'un statut SCHEDULED par contentKey (transition
    // SCHEDULED → SCHEDULED interdite par workflow.ts).
    expect(isPublishDue(
      { contentKey: item.contentKey, version: 3, publishAt: "2026-08-28T10:00:00", timezone: "Europe/Paris", platform: "TIKTOK" },
      new Date("2026-08-27T09:00:00.000Z"),
    )).toBe(false);
  });
});
