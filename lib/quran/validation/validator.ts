// Validation du jeu de données normalisé, AVANT insertion.
// Toute erreur critique doit faire échouer l'import proprement.

import type {
  NormalizedQuranData,
  ValidationIssue,
  ValidationReport,
} from "../types";

const TOTAL_SURAHS = 114;

export function validateQuranData(data: NormalizedQuranData): ValidationReport {
  const issues: ValidationIssue[] = [];

  validateSurahs(data, issues);
  validateAyahs(data, issues);
  validateWords(data, issues);
  validateOccurrences(data, issues);
  validateTranslations(data, issues);
  validateRecitations(data, issues);

  return {
    valid: !issues.some((i) => i.severity === "error"),
    issues,
  };
}

function validateSurahs(
  data: NormalizedQuranData,
  issues: ValidationIssue[],
): void {
  const numbers = data.surahs.map((s) => s.number);

  if (data.surahs.length !== TOTAL_SURAHS) {
    issues.push({
      severity: "error",
      code: "SURAH_COUNT",
      message: `Attendu ${TOTAL_SURAHS} sourates, reçu ${data.surahs.length}.`,
    });
  }

  if (new Set(numbers).size !== numbers.length) {
    issues.push({
      severity: "error",
      code: "SURAH_DUPLICATE",
      message: "Numéros de sourate dupliqués.",
    });
  }

  for (const surah of data.surahs) {
    if (surah.number < 1 || surah.number > TOTAL_SURAHS) {
      issues.push({
        severity: "error",
        code: "SURAH_NUMBER_RANGE",
        message: `Sourate ${surah.number} hors limites 1..${TOTAL_SURAHS}.`,
      });
    }
    if (!surah.name_arabic) {
      issues.push({
        severity: "error",
        code: "SURAH_NO_NAME",
        message: `Sourate ${surah.number} sans nom arabe.`,
      });
    }
    if (surah.ayah_count < 1) {
      issues.push({
        severity: "error",
        code: "SURAH_AYAH_COUNT",
        message: `Sourate ${surah.number} avec un nombre de versets invalide.`,
      });
    }
  }
}

function validateAyahs(
  data: NormalizedQuranData,
  issues: ValidationIssue[],
): void {
  const seen = new Set<string>();
  const countBySurah = new Map<number, number>();

  for (const ayah of data.ayahs) {
    if (!ayah.text_uthmani) {
      issues.push({
        severity: "error",
        code: "AYAH_NO_TEXT",
        message: `Verset ${ayah.surah_number}:${ayah.ayah_number} sans texte.`,
      });
    }
    const key = `${ayah.surah_number}:${ayah.ayah_number}`;
    if (seen.has(key)) {
      issues.push({
        severity: "error",
        code: "AYAH_DUPLICATE",
        message: `Verset dupliqué ${key}.`,
      });
    }
    seen.add(key);
    countBySurah.set(
      ayah.surah_number,
      (countBySurah.get(ayah.surah_number) ?? 0) + 1,
    );
  }

  for (const surah of data.surahs) {
    const actual = countBySurah.get(surah.number) ?? 0;
    if (actual !== surah.ayah_count) {
      issues.push({
        severity: "error",
        code: "SURAH_AYAH_MISMATCH",
        message: `Sourate ${surah.number} : ${actual} versets importés pour ${surah.ayah_count} attendus.`,
      });
    }
  }
}

function validateWords(
  data: NormalizedQuranData,
  issues: ValidationIssue[],
): void {
  const arabics = data.words.map((w) => w.arabic);
  if (new Set(arabics).size !== arabics.length) {
    issues.push({
      severity: "error",
      code: "WORD_DUPLICATE",
      message: "Formes de mots dupliquées.",
    });
  }
  for (const word of data.words) {
    if (!word.arabic) {
      issues.push({
        severity: "error",
        code: "WORD_EMPTY",
        message: "Mot avec forme arabe vide.",
      });
    }
  }
}

function validateOccurrences(
  data: NormalizedQuranData,
  issues: ValidationIssue[],
): void {
  const wordSet = new Set(data.words.map((w) => w.arabic));
  const ayahSet = new Set(
    data.ayahs.map((a) => `${a.surah_number}:${a.ayah_number}`),
  );
  const seen = new Set<string>();

  for (const occ of data.occurrences) {
    if (occ.position < 1) {
      issues.push({
        severity: "error",
        code: "OCC_POSITION",
        message: `Position invalide ${occ.position} pour ${occ.surah_number}:${occ.ayah_number}.`,
      });
    }
    const ayahKey = `${occ.surah_number}:${occ.ayah_number}`;
    if (!ayahSet.has(ayahKey)) {
      issues.push({
        severity: "error",
        code: "OCC_UNKNOWN_AYAH",
        message: `Occurrence référençant un verset inconnu ${ayahKey}.`,
      });
    }
    if (!wordSet.has(occ.word_arabic)) {
      issues.push({
        severity: "error",
        code: "OCC_UNKNOWN_WORD",
        message: `Occurrence référençant un mot inconnu « ${occ.word_arabic} ».`,
      });
    }
    const key = `${ayahKey}:${occ.position}`;
    if (seen.has(key)) {
      issues.push({
        severity: "error",
        code: "OCC_DUPLICATE",
        message: `Position de mot dupliquée ${key}.`,
      });
    }
    seen.add(key);
  }
}

function validateTranslations(
  data: NormalizedQuranData,
  issues: ValidationIssue[],
): void {
  const ayahSet = new Set(
    data.ayahs.map((a) => `${a.surah_number}:${a.ayah_number}`),
  );
  const seen = new Set<string>();

  for (const tr of data.translations) {
    if (!tr.text) {
      issues.push({
        severity: "error",
        code: "TRANSLATION_EMPTY",
        message: `Traduction vide ${tr.language} pour ${tr.surah_number}:${tr.ayah_number}.`,
      });
    }
    const ayahKey = `${tr.surah_number}:${tr.ayah_number}`;
    if (!ayahSet.has(ayahKey)) {
      issues.push({
        severity: "error",
        code: "TRANSLATION_UNKNOWN_AYAH",
        message: `Traduction référençant un verset inconnu ${ayahKey}.`,
      });
    }
    const key = `${ayahKey}:${tr.resource_id}`;
    if (seen.has(key)) {
      issues.push({
        severity: "error",
        code: "TRANSLATION_DUPLICATE",
        message: `Traduction dupliquée ${key}.`,
      });
    }
    seen.add(key);
  }
}

function validateRecitations(
  data: NormalizedQuranData,
  issues: ValidationIssue[],
): void {
  const seen = new Set<number>();
  for (const rec of data.recitations) {
    if (rec.quran_com_id == null) continue;
    if (seen.has(rec.quran_com_id)) {
      issues.push({
        severity: "warning",
        code: "RECITATION_DUPLICATE",
        message: `Récitant dupliqué (id ${rec.quran_com_id}).`,
      });
    }
    seen.add(rec.quran_com_id);
  }
}
