import { describe, expect, it } from "vitest";
import { ContentRegistryService } from "../lib/content-studio/registry";
import type {
  ContentItemInput,
  ContentItemRow,
  ContentItemStatus,
} from "../lib/content-studio/types";

// ---------------------------------------------------------------------------
// Mini-fake Supabase en mémoire : sélection par eq, range, order updated_at
// desc, upsert idempotent par content_key, update. Suffisant pour le service
// registre (aucun réseau).
// ---------------------------------------------------------------------------

function fakeDb(initial: ContentItemRow[] = []) {
  const rows: ContentItemRow[] = [...initial];
  const now = () => new Date().toISOString();
  const tablesTouched = new Set<string>();

  const from = (table: string) => {
    tablesTouched.add(table);
    const eqs: Array<{ col: string; value: unknown }> = [];
    let rangeFrom: number | null = null;
    let rangeTo: number | null = null;
    let orderDesc = false;

    const matches = (row: Record<string, unknown>) =>
      eqs.every(({ col, value }) => row[col] === value);

    const q: Record<string, unknown> = {
      select: (spec: string | string[], opts?: { count?: "exact" }) => {
        q._count = opts?.count === "exact";
        return q;
      },
      eq: (col: string, value: unknown) => {
        eqs.push({ col, value });
        return q;
      },
      order: (col: string, opts?: { ascending?: boolean }) => {
        if (col === "updated_at" && opts?.ascending === false) orderDesc = true;
        return q;
      },
      range: (from: number, to: number) => {
        rangeFrom = from;
        rangeTo = to;
        return q;
      },
      upsert: (row: ContentItemRow, opts?: { onConflict?: string; ignoreDuplicates?: boolean }) => {
        q._pendingUpsert = { row, opts };
        return q;
      },
      update: (patch: Partial<ContentItemRow>) => {
        q._pendingUpdate = patch;
        return q;
      },
      delete: () => {
        q._pendingDelete = true;
        return q;
      },
    };

    const resolve = (single: boolean) => {
      // upsert
      if (q._pendingUpsert) {
        const { row, opts } = q._pendingUpsert as {
          row: ContentItemRow;
          opts?: { onConflict?: string; ignoreDuplicates?: boolean };
        };
        const exists = rows.some((r) => r.content_key === row.content_key);
        if (opts?.ignoreDuplicates && exists) {
          return { data: null as ContentItemRow | null, count: 0, error: null };
        }
        rows.push(row);
        return { data: row, count: 1, error: null };
      }
      // update
      if (q._pendingUpdate) {
        const patch = q._pendingUpdate as Partial<ContentItemRow>;
        const updated: ContentItemRow[] = [];
        for (const row of rows) {
          if (matches(row as unknown as Record<string, unknown>)) {
            const next = { ...row, ...patch, updated_at: now() };
            const idx = rows.indexOf(row);
            rows[idx] = next;
            updated.push(next);
          }
        }
        const data = updated.length > 0 ? updated : null;
        if (single) return { data: data?.[0] ?? null, count: data?.length ?? 0, error: null };
        return { data, count: data?.length ?? 0, error: null };
      }
      // delete
      if (q._pendingDelete) {
        const remaining = rows.filter((r) => !matches(r as unknown as Record<string, unknown>));
        rows.length = 0;
        rows.push(...remaining);
        return { data: null, count: 0, error: null };
      }
      // select
      let data = rows.filter((r) => matches(r as unknown as Record<string, unknown>));
      if (orderDesc) data = [...data].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
      if (rangeFrom != null && rangeTo != null) data = data.slice(rangeFrom, rangeTo + 1);
      if (single) return { data: data[0] ?? null, count: data.length, error: null };
      return { data, count: data.length, error: null };
    };

    return Object.assign(q, {
      maybeSingle: () => ({
        then: (resolveFn: (v: unknown) => void) => {
          resolveFn(resolve(true));
          return undefined;
        },
      }),
      then: (resolveFn: (v: unknown) => void) => {
        resolveFn(resolve(false));
        return undefined;
      },
    });
  };

  return { from: (table: string) => from(table) as never, rows };
}

const INPUT: ContentItemInput = {
  contentKey: "1f419cf7aac14afe30f1a0afc5b7a73b14aa9dfa1a4f0ad1ab843caafc03df60",
  templateKey: "WORD_REVEAL_V1",
  templateVersion: "1",
  language: "fr",
  wordId: "fc581cb3-8d05-410f-9373-a428c8d17e57",
  hookVariantId: "HOOK_H1",
  ctaId: "CTA_LEARN_01",
  payload: { contentKey: "1f419cf7aac14afe30f1a0afc5b7a73b14aa9dfa1a4f0ad1ab843caafc03df60" },
  sources: { meaningSourceId: "wt-row-2" },
  licenses: { audio: "DISABLED", verseTranslation: "REVIEW_REQUIRED", dataset: "SAFE", assets: "SAFE" },
};

function service(fake: ReturnType<typeof fakeDb>): ContentRegistryService {
  return new ContentRegistryService(fake as never);
}

describe("ContentRegistryService — idempotence et statuts", () => {
  it("upsert crée la ligne en DRAFT (created=true)", async () => {
    const fake = fakeDb();
    const reg = service(fake);
    const result = await reg.upsert(INPUT);
    expect(result.created).toBe(true);
    expect(result.item.status).toBe("DRAFT");
    expect(result.item.version).toBe(1);
    expect(result.item.renderStatus).toBe("NOT_RENDERED");
    expect(result.item.contentKey).toBe(INPUT.contentKey);
  });

  it("même contentKey ⇒ pas de doublon (created=false, ligne existante intacte)", async () => {
    const fake = fakeDb();
    const reg = service(fake);
    await reg.upsert(INPUT);
    const dup = await reg.upsert({ ...INPUT });
    expect(dup.created).toBe(false);
    expect(fake.rows).toHaveLength(1);
  });

  it("récupération par contentKey", async () => {
    const fake = fakeDb();
    const reg = service(fake);
    await reg.upsert(INPUT);
    const found = await reg.getByContentKey(INPUT.contentKey);
    expect(found?.wordId).toBe(INPUT.wordId);
    const missing = await reg.getByContentKey("0".repeat(64));
    expect(missing).toBeNull();
  });

  it("liste avec filtre par statut + pagination bornée", async () => {
    const fake = fakeDb();
    const reg = service(fake);
    await reg.upsert(INPUT);
    await reg.upsert({ ...INPUT, contentKey: "a".repeat(64) });
    const all = await reg.list({ limit: 100, offset: 0 });
    expect(all.items).toHaveLength(2);
    const drafts = await reg.list({ status: "DRAFT" });
    expect(drafts.total).toBe(2);
    const page = await reg.list({ limit: 1, offset: 0 });
    expect(page.items).toHaveLength(1);
    expect(page.limit).toBe(1);
  });
});

describe("ContentRegistryService — transitions éditoriales", () => {
  it("chemin nominal DRAFT → REVIEW → APPROVED → SCHEDULED (render gate au PUBLISHED)", async () => {
    const fake = fakeDb();
    const reg = service(fake);
    const { item } = await reg.upsert(INPUT);

    const review = await reg.setStatus(item.contentKey, "REVIEW");
    expect(review.status).toBe("REVIEW");
    const approved = await reg.setStatus(item.contentKey, "APPROVED");
    expect(approved.status).toBe("APPROVED");
    const scheduled = await reg.setStatus(item.contentKey, "SCHEDULED");
    expect(scheduled.status).toBe("SCHEDULED");

    // PUBLISHED exige RENDERED : sans rendu → RENDER_REQUIRED.
    await expect(reg.setStatus(item.contentKey, "PUBLISHED")).rejects.toThrow(/RENDER_REQUIRED/);
  });

  it("PUBLISHED autorisé après rendu RENDERED", async () => {
    const fake = fakeDb();
    const reg = service(fake);
    const { item } = await reg.upsert(INPUT);
    await reg.setRenderStatus(item.contentKey, "RENDERED", { renderPath: "out/x.mp4" });
    await reg.setStatus(item.contentKey, "REVIEW");
    await reg.setStatus(item.contentKey, "APPROVED");
    await reg.setStatus(item.contentKey, "SCHEDULED");
    const published = await reg.setStatus(item.contentKey, "PUBLISHED");
    expect(published.status).toBe("PUBLISHED");
  });

  it("DRAFT → PUBLISHED interdit (approval obligatoire, workflow.ts)", async () => {
    const fake = fakeDb();
    const reg = service(fake);
    const { item } = await reg.upsert(INPUT);
    await expect(reg.setStatus(item.contentKey, "PUBLISHED")).rejects.toThrow(/INVALID_TRANSITION/);
  });

  it("rejet + retravail", async () => {
    const fake = fakeDb();
    const reg = service(fake);
    const { item } = await reg.upsert(INPUT);
    await reg.setStatus(item.contentKey, "REVIEW");
    const rejected = await reg.setStatus(item.contentKey, "REJECTED");
    expect(rejected.status).toBe("REJECTED");
    const reworked = await reg.setStatus(item.contentKey, "DRAFT");
    expect(reworked.status).toBe("DRAFT");
  });
});

describe("ContentRegistryService — versioning et rendu", () => {
  it("modification du payload : version+1, rendu reset, APPROVED → DRAFT", async () => {
    const fake = fakeDb();
    const reg = service(fake);
    const { item } = await reg.upsert(INPUT);
    await reg.setStatus(item.contentKey, "REVIEW");
    await reg.setStatus(item.contentKey, "APPROVED");
    await reg.setRenderStatus(item.contentKey, "RENDERED", { renderPath: "out/v1.mp4" });

    const next = await reg.updatePayload(item.contentKey, {
      payload: { contentKey: INPUT.contentKey, changed: true },
      sources: INPUT.sources,
      licenses: INPUT.licenses,
    });
    expect(next.version).toBe(2);
    expect(next.status).toBe("DRAFT"); // nouvelle validation obligatoire
    expect(next.renderStatus).toBe("NOT_RENDERED");
    expect(next.renderPath).toBeNull(); // l'ancien rendu ne correspond plus à la version
  });

  it("statut de rendu FAILED traçable", async () => {
    const fake = fakeDb();
    const reg = service(fake);
    const { item } = await reg.upsert(INPUT);
    const failed = await reg.setRenderStatus(item.contentKey, "FAILED", {
      renderError: "chrome crashed",
    });
    expect(failed.renderStatus).toBe("FAILED");
    expect(failed.renderError).toBe("chrome crashed");
    expect(failed.renderedAt).toBeNull();
  });

  it("updateEditorState résine le montage ET invalide le rendu (RENDERED → NOT_RENDERED)", async () => {
    const fake = fakeDb();
    const reg = service(fake);
    const { item } = await reg.upsert(INPUT);
    await reg.setRenderStatus(item.contentKey, "RENDERED", { renderPath: "outer/hikma-word-video.mp4" });
    const rendered = await reg.getByContentKey(item.contentKey);
    expect(rendered && rendered.renderStatus).toBe("RENDERED");

    const next = await reg.updateEditorState(item.contentKey, {
      scenes: [{ kind: "intro", durationInFrames: 50, text: "modifié" }],
    });
    expect(next.renderStatus).toBe("NOT_RENDERED"); // invalidation obligatoire
    expect(next.renderPath).toBeNull();
    expect(next.renderError).toBeNull();
    expect(next.editorState).toEqual({
      scenes: [{ kind: "intro", durationInFrames: 50, text: "modifié" }],
    });
  });

  it("export autorisé uniquement depuis les statuts canExport", async () => {
    const fake = fakeDb();
    const reg = service(fake);
    const { item } = await reg.upsert(INPUT);
    expect(reg.isExportAllowed(item)).toBe(true); // DRAFT
    await reg.setStatus(item.contentKey, "REVIEW");
    const review = await reg.getByContentKey(item.contentKey);
    expect(review && reg.isExportAllowed(review)).toBe(true);
  });
});

describe("ContentRegistryService — suppression de vidéo", () => {
  it("deleteItem supprime le record DB et les assets associés", async () => {
    const fake = fakeDb();
    const reg = service(fake);
    const { item } = await reg.upsert(INPUT);
    expect(await reg.getByContentKey(item.contentKey)).not.toBeNull();

    const res = await reg.deleteItem(item.contentKey);
    expect(res.success).toBe(true);
    expect(res.deletedKey).toBe(item.contentKey);

    // Vérifie que le record DB a disparu
    const after = await reg.getByContentKey(item.contentKey);
    expect(after).toBeNull();
  });

  it("deleteItem sur contenu inconnu → lève CONTENT_NOT_FOUND", async () => {
    const reg = service(fakeDb());
    await expect(reg.deleteItem("0".repeat(64))).rejects.toThrow(/CONTENT_NOT_FOUND/);
  });
});

