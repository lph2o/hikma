import { describe, expect, it } from "vitest";
import {
  getDailyDurationLabel,
  getLearningGoalCopy,
  getLearningPaceCopy,
  getPersonalizedLearningCopy,
  getQuranFamiliarityCopy,
  getRecommendationReason,
} from "@/lib/learning/personalization";
import type { OnboardingProfile } from "@/lib/learning/onboarding";

const emptyProfile: OnboardingProfile = {
  displayName: null,
  learningGoal: null,
  arabicReadingLevel: null,
  quranFamiliarity: null,
  dailyDuration: null,
  learningPace: null,
  preferredSurahNumber: null,
};

function profile(overrides: Partial<OnboardingProfile> = {}): OnboardingProfile {
  return { ...emptyProfile, ...overrides };
}

describe("getLearningGoalCopy", () => {
  it("retourne la copy exacte de chaque objectif", () => {
    expect(getLearningGoalCopy("understand_recitation")).toBe(
      "Comprends les mots derrière ce que tu récites.",
    );
    expect(getLearningGoalCopy("memorize_vocabulary")).toBe(
      "Fais travailler ta mémoire mot après mot.",
    );
    expect(getLearningGoalCopy("understand_surahs")).toBe(
      "Avance progressivement pour mieux comprendre les sourates que tu récites.",
    );
    expect(getLearningGoalCopy("build_vocabulary")).toBe(
      "Enrichis petit à petit ton vocabulaire coranique.",
    );
    expect(getLearningGoalCopy("start_gently")).toBe(
      "Pas besoin d’aller vite. Commençons simplement, mot après mot.",
    );
  });

  it("ne remplace jamais une valeur NULL", () => {
    expect(getLearningGoalCopy(null)).toBeNull();
  });
});

describe("getQuranFamiliarityCopy", () => {
  it("retourne la copy exacte de chaque familiarité", () => {
    expect(getQuranFamiliarityCopy("beginner")).toBe(
      "Découvrons Hikma tranquillement, étape par étape.",
    );
    expect(getQuranFamiliarityCopy("some_surahs")).toBe(
      "Pars de sourates que tu connais déjà ou découvre-en de nouvelles.",
    );
    expect(getQuranFamiliarityCopy("regular_recitation")).toBe(
      "Mets les mots que tu récites régulièrement en perspective.",
    );
    expect(getQuranFamiliarityCopy("many_surahs")).toBe(
      "Profite des sourates que tu connais déjà pour enrichir ton vocabulaire.",
    );
    expect(getQuranFamiliarityCopy("complete_reading")).toBe(
      "Explore le vocabulaire derrière les sourates que tu récites régulièrement.",
    );
  });

  it("n'affiche rien de spécifique pour NULL", () => {
    expect(getQuranFamiliarityCopy(null)).toBeNull();
  });
});

describe("getLearningPaceCopy", () => {
  it("retourne la copy exacte de chaque rythme", () => {
    expect(getLearningPaceCopy("daily_short")).toBe(
      "Un peu chaque jour, c’est déjà un bon rythme.",
    );
    expect(getLearningPaceCopy("some_days")).toBe(
      "Quelques sessions dans la semaine peuvent suffire pour avancer régulièrement.",
    );
    expect(getLearningPaceCopy("flexible")).toBe(
      "Avance quand tu as le temps, sans pression.",
    );
    expect(getLearningPaceCopy("unknown")).toBe(
      "Trouve progressivement le rythme qui te convient.",
    );
  });

  it("n'invente aucun rythme pour NULL", () => {
    expect(getLearningPaceCopy(null)).toBeNull();
  });
});

describe("getDailyDurationLabel", () => {
  it("présente chaque durée, sans créer de daily_goal", () => {
    expect(getDailyDurationLabel(5)).toBe("Une petite session de 5 minutes.");
    expect(getDailyDurationLabel(10)).toBe("Une session courte d’environ 10 minutes.");
    expect(getDailyDurationLabel(15)).toBe("Une session d’environ 15 minutes.");
    expect(getDailyDurationLabel(20)).toBe("Une session d’environ 20 minutes.");
    expect(getDailyDurationLabel(30)).toBe("Plus de 20 minutes");
    expect(getDailyDurationLabel(null)).toBeNull();
  });

  it("n'utilise jamais l'abréviation « +20 min »", () => {
    expect(getDailyDurationLabel(30)).not.toContain("+");
    expect(getDailyDurationLabel(30)).toBe("Plus de 20 minutes");
  });
});

describe("getPersonalizedLearningCopy", () => {
  it("compose le message d'exemple de la Phase 33B (nom + objectif + rythme)", () => {
    expect(
      getPersonalizedLearningCopy(
        profile({
          displayName: "Abdourahmane",
          learningGoal: "understand_recitation",
          learningPace: "daily_short",
        }),
        { firstVisit: false, allDone: false },
      ),
    ).toEqual({
      greeting: "Bonjour Abdourahmane 👋",
      opening: "Un peu chaque jour pour mieux comprendre les mots que tu récites.",
    });
  });

  it("salue la première visite avec le nom", () => {
    expect(
      getPersonalizedLearningCopy(profile({ displayName: "Amina" }), {
        firstVisit: true,
        allDone: false,
      }),
    ).toEqual({
      greeting: "Bonjour Amina 👋",
      opening: "Commençons par quelques mots du Coran.",
    });
  });

  it("salue la première visite sans nom", () => {
    expect(
      getPersonalizedLearningCopy(emptyProfile, { firstVisit: true, allDone: false }),
    ).toEqual({
      greeting: "Bienvenue sur Hikma 👋",
      opening: "Commençons par quelques mots du Coran.",
    });
  });

  it("utilise l'objectif seul quand il n'y a pas de rythme", () => {
    expect(
      getPersonalizedLearningCopy(profile({ learningGoal: "memorize_vocabulary" }), {
        firstVisit: false,
        allDone: false,
      }).opening,
    ).toBe("Fais travailler ta mémoire mot après mot.");
  });

  it("utilise la familiarité quand l'objectif est absent", () => {
    expect(
      getPersonalizedLearningCopy(profile({ quranFamiliarity: "regular_recitation" }), {
        firstVisit: false,
        allDone: false,
      }).opening,
    ).toBe("Mets les mots que tu récites régulièrement en perspective.");
  });

  it("utilise le rythme quand objectif et familiarité sont absents", () => {
    expect(
      getPersonalizedLearningCopy(profile({ learningPace: "flexible" }), {
        firstVisit: false,
        allDone: false,
      }).opening,
    ).toBe("Avance quand tu as le temps, sans pression.");
  });

  it("reste neutre quand toutes les préférences sont NULL (utilisateur historique)", () => {
    expect(
      getPersonalizedLearningCopy(emptyProfile, { firstVisit: false, allDone: false }),
    ).toEqual({
      greeting: "Bonjour 👋",
      opening: "Continue ton apprentissage, à ton rythme.",
    });
  });

  it("reste fonctionnel sans aucune valeur de profil", () => {
    expect(
      getPersonalizedLearningCopy(emptyProfile, { firstVisit: false, allDone: false }),
    ).toEqual(
      getPersonalizedLearningCopy(
        profile({
          displayName: null,
          learningGoal: null,
          arabicReadingLevel: null,
          quranFamiliarity: null,
          dailyDuration: null,
          learningPace: null,
          preferredSurahNumber: null,
        }),
        { firstVisit: false, allDone: false },
      ),
    );
  });

  it("annonce un parcours terminé sans inventer de statistiques", () => {
    expect(
      getPersonalizedLearningCopy(profile({ learningGoal: "build_vocabulary" }), {
        firstVisit: false,
        allDone: true,
      }),
    ).toEqual({
      greeting: "Ton parcours est terminé",
      opening: "Tu peux revoir tes mots ou reprendre une leçon pour les ancrer.",
    });
  });
});

describe("getRecommendationReason", () => {
  it("explique un choix explicite sans prétendre l'avoir recommandé", () => {
    expect(
      getRecommendationReason(profile({ preferredSurahNumber: 112 }), {
        surahNumber: 112,
      }),
    ).toBe("Tu l’as choisie comme point de départ.");
  });

  it("priorise le choix explicite sur la durée courte", () => {
    expect(
      getRecommendationReason(
        profile({ preferredSurahNumber: 112, dailyDuration: 5 }),
        { surahNumber: 112 },
      ),
    ).toBe("Tu l’as choisie comme point de départ.");
  });

  it("explique un profil débutant", () => {
    expect(
      getRecommendationReason(profile({ arabicReadingLevel: "beginner" }), {
        surahNumber: 108,
      }),
    ).toBe("Une première étape simple pour découvrir Hikma.");
  });

  it("explique une préférence de durée courte", () => {
    expect(
      getRecommendationReason(profile({ dailyDuration: 5 }), { surahNumber: 108 }),
    ).toBe("Nous te proposons une sourate courte pour commencer tranquillement.");
    expect(
      getRecommendationReason(profile({ dailyDuration: 10 }), { surahNumber: 108 }),
    ).toBe("Nous te proposons une sourate courte pour commencer tranquillement.");
  });

  it("explique le fallback Al-Fātiḥah", () => {
    expect(getRecommendationReason(emptyProfile, { surahNumber: 1 })).toBe(
      "Al-Fātiḥah est notre point de départ de référence sur Hikma.",
    );
  });

  it("explique un autre fallback", () => {
    expect(getRecommendationReason(emptyProfile, { surahNumber: 112 })).toBe(
      "Une première sourate disponible pour commencer ton parcours.",
    );
  });

  it("ne ment jamais sur un choix IN_PREPARATION refusé", () => {
    // L'utilisateur a choisi 107 (non démarrable) → la recommandation retombe
    // sur Al-Fātiḥah (1). On ne prétend donc pas l'avoir « choisie ».
    expect(
      getRecommendationReason(profile({ preferredSurahNumber: 107 }), {
        surahNumber: 1,
      }),
    ).toBe("Al-Fātiḥah est notre point de départ de référence sur Hikma.");
  });

  it("retourne null sans recommandation", () => {
    expect(getRecommendationReason(emptyProfile, null)).toBeNull();
  });
});

describe("pureté et non-régression", () => {
  it("ne mute jamais le profil passé en argument", () => {
    const p = profile({
      displayName: "Abdourahmane",
      learningGoal: "understand_recitation",
      learningPace: "daily_short",
      dailyDuration: 5,
      preferredSurahNumber: 112,
    });
    const snapshot = JSON.stringify(p);
    getPersonalizedLearningCopy(p, { firstVisit: false, allDone: false });
    getRecommendationReason(p, { surahNumber: 112 });
    getLearningGoalCopy(p.learningGoal);
    getQuranFamiliarityCopy(p.quranFamiliarity);
    getLearningPaceCopy(p.learningPace);
    getDailyDurationLabel(p.dailyDuration);
    expect(JSON.stringify(p)).toBe(snapshot);
  });

  it("ne renvoie que des chaînes déterministes (aucune donnée pédagogique)", () => {
    const first = getPersonalizedLearningCopy(
      profile({ learningGoal: "understand_recitation", learningPace: "daily_short" }),
      { firstVisit: false, allDone: false },
    );
    const second = getPersonalizedLearningCopy(
      profile({ learningGoal: "understand_recitation", learningPace: "daily_short" }),
      { firstVisit: false, allDone: false },
    );
    expect(first).toEqual(second);
    expect(typeof first.greeting).toBe("string");
    expect(typeof first.opening).toBe("string");
  });
});
