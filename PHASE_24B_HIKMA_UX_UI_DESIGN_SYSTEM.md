# PHASE 24B — HIKMA UX/UI REDESIGN SYSTEM + EXPERIENCE ARCHITECTURE

**STATUS = `UX_UI_DESIGN_COMPLETE`**

Phase **100 % READ-ONLY** (design & architecture). Garanties :
`PRODUCTION_CODE_CHANGES = 0` · `MIGRATIONS = 0` · `DATABASE_WRITES = 0` ·
`STORAGE_WRITES = 0` · `RESOLVER_CHANGES = 0` · `ENGINE_CHANGES = 0` ·
`DATA_CHANGES = 0` · `EXERCISES_CHANGES = 0` · `SRS_CHANGES = 0` ·
`CURRICULUM_CHANGES = 0`.

Ce rapport est la **source de vérité de conception** pour la Phase 24C : il doit
permettre d'implémenter le redesign **sans réinterpréter les décisions**. Il ne
modifie rien en production.

Source de vérité amont : `PHASE_24A_HIKMA_UX_UI_AUDIT.md` + `tmp/phase24a-*.json`.

---

## 1. Résumé exécutif

Hikma possède déjà une fondation UX saine (score 3.2/5, aucun P0 bloquant). La
24B ne **refond** pas : elle **complète** la base existante avec une identité
plus distincte et une résolution précise des 14 problèmes U1–U14.

**Promesse produit cible :**

> « Comprends le Coran, mot par mot, progressivement — sans être perdu. »

Trois priorités immédiates (P0) : **U1** (valeur de proposition), **U2**
(sauvegarde/reprise de session), **U3** (audio UX). Le reste se répartit en
24C→24K.

L'identité retenue : **FRIENDLY + PREMIUM + CALME + MODERNE + ACCESSIBLE +
SPIRITUEL** — la chaleur de l'orange Hikma (#FF7732) + la sobriété crème +
l'arabe Amiri. **Aucune gamification artificielle** ; la motivation reste
intrinsèque (progression, compréhension, réussite, continuité).

---

## 2. Architecture UX actuelle → cible

| Couche | Actuel (24A) | Cible (24B) |
|---|---|---|
| Premier contact | `/` → dashboard anon (2 CTA) sans valeur | Landing avec valeur en <30 s + exemple réel |
| Onboarding | 1 étape (objectif), sans valeur | valeur + CTA « première leçon » ; objectif optionnel différé |
| Dashboard | 1 CTA principal + 6 cartes + 4 stats | CTA dominant + MasterySynopsis + densité réduite |
| LessonPlayer | discovery → 27–54 exercices sans reprise | micro-sessions + sauvegarde/reprise + anti-anxiété |
| Audio | `<audio controls>` natif | AudioPlayer dédié (Écouter/replay/états) |
| Erreurs/404 | fallback générique Next.js | pages brandées + récupération humaine |
| Maîtrise | calculée, jamais affichée | MasterySynopsis en 6 verbes humains |

---

## 3. Parcours nouvel utilisateur (cible)

Landing (valeur + exemple) → `/login`/`/signup` → `/onboarding` (valeur rappelée,
CTA « Commencer ma première leçon », objectif replié) → première leçon
(Découverte courte, CTA visible sans scroll) → première réussite (reward_pulse
sobre) → fin → `/dashboard` (Continuer domine, objectif proposé après).

Voir `tmp/phase24b-user-flows.json` (flux A).

---

## 4. Parcours apprentissage

« Pourquoi cette leçon maintenant ? » → verrou **expliqué** (LockHint : « Termine
la leçon précédente pour déverrouiller »). « Pourquoi cet exercice maintenant ? »
→ micro-explication de compétence (reconnaître / rappeler / écouter / utiliser en
contexte / famille), jamais le nom technique. « Pourquoi ce mot revient /
disparaît ? » → MasterySynopsis visible (mots faibles + compétences maîtrisées).

---

## 5. Dashboard

Point de reprise. **UN** CTA principal (`Continuer`/`Commencer la leçon`).
Ensuite, dans l'ordre : prochaine leçon + unité → objectif du jour (anneau) →
révisions dues → MasterySynopsis (mots faibles) → progression parcours →
historique 30j → 4 stats. Les CTA secondaires (`Modifier l'objectif`, `Voir la
révision`) sont relégués en ghost/secondaire pour ne plus concurrencer le CTA
principal (U12). Densité verticale réduite.

---

## 6. LessonPlayer

Architecture imposée :

```
HEADER      — progression douce + étape + quitter
CONTENU     — une seule tâche
FEEDBACK    — réponse / explication
ACTION      — Continuer
```

- **Anti-anxiété** : jamais « 37 exercices restants » en dominant ; barre de
  progression + « Exercice X sur Y » discret.
- **Découverte** : liste compacte (arabe + translittération + sens + badge) ; le
  CTA « Commencer » précède le contexte du verset replié (U9).
- **Sauvegarde/reprise (U2)** : SessionSaver (localStorage client :
  `{lessonId, index, results, skillAttempts}`) + bannière « Reprendre là où tu
  t'es arrêté » au montage. La persistance serveur (Server Actions) **reste
  inchangée** ; la reprise ne rejoue jamais un exercice terminé. Le « Quitter »
  confirme « Ta progression est sauvegardée » au lieu de « ne sera pas
  enregistrée ».

---

## 7. Exercices

Hiérarchie imposée : **QUESTION → CONTEXTE/INDICE → RÉPONSES → FEEDBACK →
CONTINUER**.

Motifs par famille (variété sans éclatement, fixe U7) :

| Famille | Présentation cible |
|---|---|
| Reconnaissance (WORD_TO_TRANSLATION, TRANSLATION_TO_WORD, REVERSE_TRANSLATION, MULTIPLE_CHOICE, COMPLETE_WORD) | QCM 2×2 (min-h-12, ≥44px, OptionContent arabe Amiri RTL) |
| Rappel (FORM_TO_MEANING, MEANING_TO_FORM) | RecallReveal : réfléchir → saisir → « Je vérifie » → révélation animée. Aide translittération optionnelle pour MEANING_TO_FORM |
| Audio (AUDIO_TO_WORD, WORD_TO_AUDIO) | AudioPlayer dédié ; « écoute d'abord » pour AUDIO_TO_WORD |
| Contexte (CONTEXT_RECOGNITION) | carte verset avec mot ciblé surligné + question |
| Famille (LEMMA_RELATION) | carte « Ces deux mots viennent de la même famille » |
| Auto-évaluation (WORD_RECOGNITION) | Oui / Pas encore (inchangé) |

- **Rappel actif** : la réponse n'est **jamais** révélée avant soumission.
- **Production arabe** : input RTL + aide translittération (friction débutant B
  résolue).
- **Pourquoi je fais ça ?** : chaque exercice affiche la compétence en langage
  humain.

---

## 8. Audio

Composant **AudioPlayer** dédié (jamais `<audio controls>` natif). États :
idle / loading / playing / paused / replay / error / disabled. Label « Écouter »
(verbe pédagogique). A11y : aria-label, clavier (Espace/Entrée), cible ≥48px,
message réseau « Impossible de charger l'audio. Réessaie. ». Aucune donnée audio
modifiée (21 295 word_audio inchangés).

---

## 9. Navigation

- Mobile : bottom nav 4 entrées, cibles ≥44px, libellés 12px (plus 11px), safe-area.
- Desktop : sidebar fixe w-64 + contenu max-w-3xl.
- Position toujours lisible : aria-current + titre + liens retour « ← Parcours ».

---

## 10. Design visuel

Direction : **Soft Structuralism chaud** — fond crème très léger (option
`#FCFAF5`), cartes squircle aérées, ombres diffuses chaudes, hairline borders,
Poppins généreuse + Amiri coranique.

Tokens cible complets : `tmp/phase24b-design-tokens.json`. Points clés :
- **Typographie** : ajout `Display 44px` (landing) ; Caption **interdit** en nav
  mobile.
- **Couleurs** : variantes `*_text` AA (`success_text #1B7A47`, `error_text
  #B3261E`, `warning_text #7A5E00`, `info_text #1F6E52`) pour tout usage texte
  des couleurs sémantiques (fixe U6) ; `primary_strong #C9501E` pour les liens.
- **Radius/ombres** : cartes app 2xl, cartes landing 4xl ; ombres diffuses
  chaudes, jamais noires dures.
- **Motion** : easings `cubic-bezier(0.32,0.72,0,1)` / `(0.16,1,0.3,1)` ;
  durées 150/250/500 ms ; animer **uniquement** transform/opacity ;
  `prefers-reduced-motion` respecté.

---

## 11. Arabe / RTL

Règle : **LTR français, RTL arabe, jamais d'inversion globale**. Chaque segment
arabe isolé dans `ArabicText` (dir/lang/Amiri/1.9/letter-spacing 0). Contrôles
directionnels cohérents LTR. Formes coraniques (`رَبِّ`, `اللَّهِ`,
`الرَّحْمَٰنِ`, `الصِّرَاطَ`, `الْمُسْتَقِيمَ`) conservées sans casse.

---

## 12. Responsive

Mobile-first. Mobile : bottom nav ≥44px, CTA principal visible sans scroll,
options pleine largeur, contexte repliable. Desktop : sidebar w-64, contenu
max-w-3xl, options 2 colonnes, sections py-12+. (Vérification navigateur réel
reportée à 24I — limitation d'outillage déjà documentée en 24A.)

---

## 13. Accessibilité

Cible WCAG AA. Corrections précises : contraste via `*_text` (U6) ; focus-visible
partout ; cibles ≥44px ; `aria-hidden` sur emojis (U11) ; couleurs jamais seules
porteuses d'information (icône + texte) ; `prefers-reduced-motion`. États
DEFAULT/HOVER/FOCUS/ACTIVE/DISABLED/LOADING/SUCCESS/ERROR/EMPTY/LOCKED définis
pour exercices, audio, leçons, progression, navigation.

---

## 14. Motivation

Mécanismes **intrinsèques uniquement** : compréhension (contexte, sens FR),
progression, sentiment de compétence (MasterySynopsis rendu visible),
continuité (objectif du jour, reprise, révisions dues), découverte (fiche mot,
famille). **Aucune gamification ajoutée** (ni XP, points, coins, classements,
streaks agressifs, badges). La jauge de continuité (« jours d'affilée ») est
écartée par défaut ; décision explicite du propriétaire requise (phase 24E) avant
tout ajout.

---

## 15. Charge cognitive

Faible **par écran** (1 exercice, 4 options) — conservé. Réduction **sur la
durée** : micro-sessions/reprise (U2), anti-anxiété du compteur, variété de
présentation (U7), parcours visiteur aligné sur 7 compétences au lieu de 11 (U8).

---

## 16. Performance perçue

Conserver les squelettes (`loading.tsx`) + ajouter un skeleton dédié au
LessonPlayer. `force-dynamic` conservé ; le chargement reste au SSR. Les
transitions utilisent les tokens de motion (transform/opacity uniquement).

---

## 17. Problèmes P0

**Aucun.** (Socle sain, confirmé en 24A : 278/278 tests, RLS 38/38, données FR
26/26, audio 26/26.)

---

## 18. Problèmes P1 (traitement cible)

| ID | Traitement |
|---|---|
| U1 — valeur de proposition | Landing + ValuePropBlock + onboarding orienté première réussite (24D) |
| U2 — sessions longues sans reprise | SessionSaver/Resume, micro-sessions, anti-anxiété (24F) |
| U3 — audio natif | AudioPlayer dédié (24C) |

---

## 19. Problèmes P2 (traitement cible)

| ID | Traitement |
|---|---|
| U4 — 404/erreur | app/error.tsx + not-found.tsx + global-error.tsx (24C) |
| U5 — verrou silencieux | LockHint (24D) |
| U6 — contraste sémantique | tokens `*_text` AA (24C) |
| U7 — répétitivité QCM | motifs par famille (24G) |
| U8 — visiteur 11 types | alignement sur 7 compétences (24F) |
| U9 — CTA sous la ligne de flottaison | contexte repliable, CTA en premier (24F) |

---

## 20. Problèmes P3 (traitement cible)

| ID | Traitement |
|---|---|
| U10 — difficulté absente | indicateur de difficulté sur chaque carte (24D) |
| U11 — emojis non masqués | aria-hidden (24J) |
| U12 — nav mobile 11px + CTA secondaires | nav 12px/≥44px, hiérarchie CTA (24I/24E) |
| U13 — pas de récompense | reward_pulse sobre (24K) |
| U14 — /design-system public | retrait/restriction en production (24C) |

---

## 21. Score UX global (rappel 24A → cible projetée)

Le score 24A est **3.2/5**. La 24B ne re-score pas (pas de mesure réelle
possible en read-only) ; la cible projetée après 24C→24K est **≥4.0/5**,
principalement via Onboarding (2→4), Audio UX (2→4), Motivation (2→4), Design
visuel (3→4), Charge cognitive (3→4).

---

## 22. Forces actuelles (à conserver)

Design system unifié (~60 composants, tokens, dark mode) · navigation minimale ·
feedback chaleureux tri-state · fondations RTL arabes · états vides bien traités
· pédagogie solide (séquence par compétence, rappel machine-noté, contexte/lemme
réels, FR 26/26, audio 26/26).

---

## 23. Faiblesses actuelles (à corriger)

Valeur de proposition absente · sessions longues sans reprise · audio minimal ·
répétitivité QCM · pas de page d'erreur/404 · maîtrise invisible · contraste
sémantique · production arabe exigeante.

---

## 24. Priorités recommandées

1. **24C** — Design System Foundation (audio, tokens AA, error/404) — P0.
2. **24D** — Onboarding & Landing (valeur <30 s) — P0.
3. **24F** — LessonPlayer & Sessions (reprise, charge cognitive) — P0.
4. **24E** — Dashboard & Progression (maîtrise visible) — P1.
5. **24G** — Exercise UX (variété, production accessible) — P1.
6. **24H** — Review UX — P1.
7. **24I/24J/24K** — Responsive / Accessibilité / Polish — P2/P3.

---

## 25. Roadmap UX proposée

| Phase | Intitulé | Objectif | Priorité |
|---|---|---|---|
| 24C | Design System Foundation | tokens AA, AudioPlayer, error/404, retrait /design-system | P0 |
| 24D | Onboarding & Landing | valeur <30 s, onboarding, LockHint, difficulté | P0 |
| 24E | Dashboard & Progression | 1 CTA, MasterySynopsis, mots faibles | P1 |
| 24F | LessonPlayer & Sessions | micro-sessions/reprise, anti-anxiété, U8/U9 | P0 |
| 24G | Exercise UX | variété, RecallReveal, production accessible | P1 |
| 24H | Review UX | mots faibles, reprise ciblée | P1 |
| 24I | Mobile & Responsive | vérif navigateur, cibles ≥44px | P2 |
| 24J | Accessibility | WCAG AA complet | P2 |
| 24K | Polish & Micro-interactions | récompense sobre, cohérence | P3 |

**Cette roadmap est une PROPOSITION.** Aucune phase suivante ne sera exécutée
automatiquement.

---

## Livrables

- `PHASE_24B_HIKMA_UX_UI_DESIGN_SYSTEM.md` (ce rapport)
- `tmp/phase24b-ux-ui-architecture.json`
- `tmp/phase24b-screen-specifications.json`
- `tmp/phase24b-user-flows.json`
- `tmp/phase24b-design-tokens.json`
- `tmp/phase24b-component-plan.json`
- `tmp/phase24b-microcopy.json`
- `tmp/phase24b-roadmap.json`

---

## Règle finale — ARRÊT

Après production de ces livrables : **ARRÊTER**. Ne pas commencer automatiquement
24C, 23G, un SRS avancé, de la gamification, 114 sourates, un nouveau curriculum,
une refonte UI ni une modification du LessonPlayer. Aucune modification de code,
de migration, de DB, de Storage, du moteur pédagogique ni des données n'a été
effectuée. Le propriétaire doit examiner ce rapport puis donner une approbation
explicite pour la phase suivante.
