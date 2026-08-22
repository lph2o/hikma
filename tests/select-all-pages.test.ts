import { describe, expect, it } from "vitest";
import { selectAllPages, SELECT_PAGE_SIZE } from "../lib/quran/repositories/shared";

/**
 * Phase 68B — BUG #1 : le fetch MASAQ tronquait silencieusement à 1000 lignes
 * (plafond PostgREST) pour les sourates >1000 occurrences. `selectAllPages`
 * doit concaténer toutes les pages sans omission ni doublon.
 */

type Paged = { id: number; value: string };

function pagedSource(total: number) {
  const all: Paged[] = Array.from({ length: total }, (_, i) => ({
    id: i,
    value: `v${i}`,
  }));
  const ranges: Array<{ from: number; to: number }> = [];
  const run = async (from: number, to: number): Promise<{ data: Paged[] | null; error: { message: string } | null }> => {
    ranges.push({ from, to });
    return { data: all.slice(from, to + 1), error: null };
  };
  return { run, ranges };
}

describe("selectAllPages — pagination PostgREST", () => {
  it("petit volume (< 1 page) → 1 appel, toutes les lignes, aucune omission", async () => {
    const { run, ranges } = pagedSource(5);
    const rows = await selectAllPages<Paged>(run);
    expect(rows).toHaveLength(5);
    expect(ranges).toEqual([{ from: 0, to: SELECT_PAGE_SIZE - 1 }]);
  });

  it("volume > 1000 (2500) → 3 pages, toutes les lignes, ordre préservé", async () => {
    const { run, ranges } = pagedSource(2500);
    const rows = await selectAllPages<Paged>(run);
    expect(rows).toHaveLength(2500);
    expect(ranges).toHaveLength(3);
    // Aucune omission / doublon : ids consécutifs 0..2499 dans l'ordre.
    expect(rows.map((r) => r.id)).toEqual(Array.from({ length: 2500 }, (_, i) => i));
  });

  it("multiple exact (2000) → 3 appels, dernière page vide", async () => {
    const { run, ranges } = pagedSource(2000);
    const rows = await selectAllPages<Paged>(run);
    expect(rows).toHaveLength(2000);
    expect(ranges).toHaveLength(3);
    expect(ranges[2]).toEqual({ from: 2000, to: 2999 });
  });

  it("propage la première erreur rencontrée (page pleine puis erreur)", async () => {
    let call = 0;
    const run = async (): Promise<{ data: Paged[] | null; error: { message: string } | null }> => {
      call += 1;
      if (call === 2) return { data: null, error: { message: "boom" } };
      // Page pleine → la boucle continue et atteint l'erreur de la page 2.
      return {
        data: Array.from({ length: SELECT_PAGE_SIZE }, (_, i) => ({ id: i, value: `v${i}` })),
        error: null,
      };
    };
    await expect(selectAllPages<Paged>(run)).rejects.toThrow("boom");
  });
});
