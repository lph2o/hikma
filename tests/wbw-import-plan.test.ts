import { describe, expect, it } from "vitest";
import {
  buildOccurrenceIndex,
  huggingfaceResolveUrl,
  parseWbwFiles,
  planWbwImport,
} from "../lib/quran/wbw-plan";
import { occurrenceKey } from "../lib/quran/wbw-filename";

// Fixtures minimales : 1 sourate, 1 verset (sourate 1, ayah 2), 4 mots.
const surahs = [{ id: "s1", number: 1 }];
const ayahs = [{ id: "a2", surah_id: "s1", ayah_number: 2 }];
const occurrences = [
  { ayah_id: "a2", position: 1, word_id: "w-alhamdu" },
  { ayah_id: "a2", position: 2, word_id: "w-lillah" },
  { ayah_id: "a2", position: 3, word_id: "w-rabb" },
  { ayah_id: "a2", position: 4, word_id: "w-alamin" },
];

describe("buildOccurrenceIndex — mapping exact SURAH_AYAH_WORD", () => {
  const index = buildOccurrenceIndex(surahs, ayahs, occurrences);

  it("mappe la position de mot correcte", () => {
    expect(index.get(occurrenceKey(1, 2, 3))).toBe("w-rabb");
    expect(index.get(occurrenceKey(1, 2, 1))).toBe("w-alhamdu");
  });

  it("ne mappe pas une clé absente (aucune tolérance)", () => {
    expect(index.get(occurrenceKey(1, 2, 5))).toBeUndefined();
    expect(index.get(occurrenceKey(2, 2, 3))).toBeUndefined();
  });

  it("ignore les occurrences dont la sourate est introuvable", () => {
    const idx = buildOccurrenceIndex(
      surahs,
      ayahs,
      [{ ayah_id: "a-unknown", position: 1, word_id: "x" }],
    );
    expect(idx.size).toBe(0);
  });
});

describe("parseWbwFiles — Muallim / Mujawwad, fichiers invalides", () => {
  it("parse muallim et mujawwad", () => {
    const { entries, invalid } = parseWbwFiles([
      "muallim/001/001_002_003.opus",
      "mujawwad/001/001_002_003.opus",
    ]);
    expect(entries.map((e) => e.style)).toEqual(["muallim", "mujawwad"]);
    expect(invalid).toEqual([]);
  });

  it("sépare les fichiers invalides sans jamais les importer", () => {
    const { entries, invalid } = parseWbwFiles([
      "muallim/001/001_002_003.opus",
      "muallim/001/bad_name.opus",
      "001_002_003.opus", // style absent
      "unknown/001/001_002_003.opus",
    ]);
    expect(entries).toHaveLength(1);
    expect(invalid).toHaveLength(3);
  });
});

describe("planWbwImport — dédup par forme+style, provenance, idempotence", () => {
  const index = buildOccurrenceIndex(surahs, ayahs, occurrences);
  const files = parseWbwFiles([
    // Deux occurrences de la même forme « w-rabb » dans des positions différentes ?
    // Ici on force deux fichiers (positions 3 et 4) pointant vers des word_id distincts.
    "muallim/001/001_002_003.opus", // w-rabb
    "muallim/001/001_002_004.opus", // w-alamin
    "mujawwad/001/001_002_003.opus", // w-rabb (style différent)
    "mujawwad/001/001_002_004.opus", // w-alamin
  ]).entries;

  it("produit une ligne par (word_id, style)", () => {
    const plan = planWbwImport(files, index);
    expect(plan.rows).toHaveLength(4); // 2 formes × 2 styles
    const keys = plan.rows.map((r) => `${r.style}|${r.word_id}`).sort();
    expect(keys).toEqual([
      "muallim|w-alamin",
      "muallim|w-rabb",
      "mujawwad|w-alamin",
      "mujawwad|w-rabb",
    ]);
  });

  it("déduplique la même forme apparaissant plusieurs fois (un seul représentant)", () => {
    // index étendu : position 5 → w-rabb (même forme qu'à la position 3)
    const idx2 = buildOccurrenceIndex(surahs, ayahs, [
      ...occurrences,
      { ayah_id: "a2", position: 5, word_id: "w-rabb" },
    ]);
    const plan = planWbwImport(
      parseWbwFiles([
        "muallim/001/001_002_003.opus",
        "muallim/001/001_002_005.opus",
      ]).entries,
      idx2,
    );
    expect(plan.rows).toHaveLength(1); // dédup : une seule ligne muallim|w-rabb
    expect(plan.rows[0].source_path).toBe("muallim/001/001_002_003.opus");
    expect(plan.source_files).toBe(2); // 2 fichiers bruts, 1 ligne
  });

  it("est déterministe et idempotent", () => {
    const a = planWbwImport(files, index);
    const b = planWbwImport([...files].reverse(), index);
    expect(a.rows).toEqual(b.rows);
    expect(a.source_files).toBe(files.length);
  });

  it("met les fichiers sans occurrence dans unmapped_files (jamais importés)", () => {
    const plan = planWbwImport(
      parseWbwFiles([
        "muallim/001/001_002_003.opus",
        "muallim/002/002_001_001.opus", // sourate 2 absente de l'index
      ]).entries,
      index,
    );
    expect(plan.unmapped_files).toEqual(["muallim/002/002_001_001.opus"]);
    expect(plan.rows).toHaveLength(1);
  });

  it("conserve la provenance : chemin source + clé positionnelle", () => {
    const plan = planWbwImport(files, index);
    const rabb = plan.rows.find((r) => r.style === "muallim" && r.word_id === "w-rabb")!;
    expect(rabb.source_path).toBe("muallim/001/001_002_003.opus");
    expect(rabb.occurrence_key).toBe("001_002_003");
  });
});

describe("huggingfaceResolveUrl", () => {
  it("construit l'URL de résolution brute HF", () => {
    expect(huggingfaceResolveUrl("muallim/001/001_001_001.opus")).toBe(
      "https://huggingface.co/datasets/zaibihassan/Quranic-Word-By-Word-Audio-Data/resolve/main/muallim/001/001_001_001.opus",
    );
  });
});

describe("aucune modification de quran_words", () => {
  it("les fonctions de planification sont pures (aucune écriture, aucune mutation)", () => {
    const input = parseWbwFiles(["muallim/001/001_002_003.opus"]).entries;
    const snapshot = JSON.stringify(input);
    planWbwImport(input, buildOccurrenceIndex(surahs, ayahs, occurrences));
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});
