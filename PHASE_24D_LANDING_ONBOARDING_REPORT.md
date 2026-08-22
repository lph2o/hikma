# PHASE 24D — PREMIER CONTACT + LANDING + ONBOARDING HIKMA

**STATUS = `UX_UI_FIRST_CONTACT_COMPLETE`**

Garanties : `DATABASE_WRITES = 0` · `MIGRATIONS = 0` · `STORAGE_WRITES = 0` ·
`ENGINE_CHANGES = 0` · `SRS_CHANGES = 0` · `EXERCISE_GENERATORS_CHANGES = 0` ·
`CURRICULUM_CHANGES = 0` · `LESSON_PLAYER_CHANGES = 0` · `GAMIFICATION = 0`.

Sources de vérité : `PHASE_24A_*`, `PHASE_24B_*`, `PHASE_24C_*` + code réel
inspecté (route `/`, `dashboard`, `onboarding`, `login`, `/learn/[slug]`,
`seed-curriculum`).

---

## 1. Résumé

Le premier contact est transformé : `/` affiche désormais une **landing** pour
les visiteurs (hero + démo forme→sens→contexte + « comment ça marche » + CTA),
le **dashboard anonyme** et l'**onboarding** portent la même proposition de
valeur, et l'onboarding est **court** avec un CTA unique vers la première
réussite (`/learn/basmala`). **U1 (proposition de valeur) est résolu.** U2
(reprise) et U3 (audio) restent préparés sans implémentation complète (24E/24F).

---

## 2. Proposition de valeur (en < 30 s)

> **H1** : Comprends le Coran, mot par mot.
> **Sous-titre** : Apprends le sens des mots, reconnais-les dans les versets et
> mémorise progressivement — à ton rythme.
> **CTA principal** : Commencer avec Al-Fatiha → `/learn/basmala`
> **CTA secondaire** : Découvrir comment ça marche → `#comment-ca-marche`

Le visiteur comprend sans scrolling : ce qu'est Hikma, ce qu'il va apprendre
(le vocabulaire du Coran), comment (découvrir → reconnaître → écouter →
réviser), et sa prochaine action (commencer Al-Fatiha).

---

## 3. Landing (composants/app/landing.tsx)

- **Hero** : eyebrow (`Label`), `Display` (44px), sous-titre, 2 CTA, mascotte
  d'accueil.
- **Démo** : `ٱلْحَمْدُ` → « la louange » ; `ٱلْحَمْدُ لِلَّهِ` → « La louange
  appartient à Allah » — **forme → sens → contexte** présenté visuellement,
  pas comme une fiche technique.
- **Comment ça marche** : 4 étapes numérotées (Découvre les mots · Retrouve
  leur sens · Écoute et reconnais-les · Révise jusqu'à les maîtriser).
- **CTA final** + lien « Créer un compte ».
- En-tête minimal : logo Hikma + « Se connecter ».

Respect du Design System 24C : `Display`, `Label`, `Card`, `ArabicText`,
`Separator`, `primary-strong` (AA), motion transform/opacity, `prefers-reduced-motion`.
Aucune nouvelle bibliothèque, aucune image lourde.

---

## 4. Onboarding (court)

- Page : valeur + « Tu vas apprendre les mots du Coran un par un, en commençant
  par Al-Fatiha. Ton objectif quotidien, tu pourras le régler plus tard. »
- **CTA principal** : « Commencer avec Al-Fatiha » → `completeOnboarding` avec
  objectif par défaut → `/learn/basmala`.
- **CTA secondaire (replié)** : « Choisir mon objectif quotidien » (déplie le
  sélecteur existant type/valeur).
- Aucune information inutile demandée ; objectif différable.

---

## 5. Dashboard anonyme

Le `DashboardAnon` (état visiteur de `/dashboard`) reprend la valeur
(« Comprends le Coran, mot par mot. ») avec un CTA principal
« Commencer avec Al-Fatiha » et un secondaire « Créer un compte ».
L'emoji « 👋 » est retiré du H1.

---

## 6. Parcours validé (scénarios §18)

| Scénario | Parcours | Verdict |
|---|---|---|
| A — Visiteur | Landing → CTA → `/learn/basmala` (anon) → première réussite | OK (code) |
| B — Nouveau | Landing → Se connecter → création → onboarding → `/learn/basmala` | OK (code + persistance 13/13) |
| C — Revenant | `/` → redirect `/dashboard` → CTA « Continuer » | OK (inchangé) |
| D — Mobile | Landing empilée, CTA pleine largeur, boutons ≥48px | OK (code) |

Détail : `tmp/phase24d-user-flow.json`.

---

## 7. RTL / LTR

Règle 24B respectée : français LTR, arabe RTL isolé dans `ArabicText`
(`dir=rtl`, `lang=ar`), jamais d'inversion globale. Les exemples de la démo
(`ٱلْحَمْدُ`, `ٱلْحَمْدُ لِلَّهِ`) ne cassent aucun composant ; largeurs
contraintes (`max-w-*`), pas de débordement horizontal.

---

## 8. Accessibilité

Contraste AA (`primary-strong`, `error-text`, `muted-foreground`) ; focus
visible (Button) ; clavier natif + `aria-expanded` sur le toggle d'objectif ;
cibles ≥48px ; `Display`=h1 unique, sections en `H2`, étapes en `<ol>` ;
`radiogroup`/`radio` pour le type d'objectif ; mascotte `decorative` en en-tête ;
`prefers-reduced-motion` (24C). Détail : `tmp/phase24d-accessibility.json`.

---

## 9. États

- **loading** : boutons `aria-busy` + libellé « Enregistrement… » (onboarding).
- **error** : message onboarding en `error-text` (AA), jamais de trace technique.
- **empty/disabled** : boutons `disabled` pendant soumission ; étapes numérotées
  sans état particulier requis.

---

## 10. Audit avant/après (U1–U14)

Résumé : **U1 résolu** ; **U2/U3 préparés** (24E/24F) ; **U6/U4** déjà résolus
en 24C ; **U8** documenté `UX_DEPENDENCY` (le visiteur utilise la séquence par
défaut de 11 types — inchangée, aucun générateur modifié) ; **U9** partiel
(landing mobile OK, LessonPlayer → 24F) ; U5/U7/U10/U12/U13/U14 différés.
Matrice complète : `tmp/phase24d-before-after.json`.

---

## 11. UX_DEPENDENCY (documentée, non modifiée)

Le parcours **visiteur** de `/learn/basmala` génère encore
`DEFAULT_LESSON_EXERCISE_TYPES` (11 types/mot, U8) — plus long que la séquence
connectée (7). **Non modifié** (contrainte §2 : aucun générateur ; U8 relève de
24F). La première réussite reste accessible, mais l'alignement visiteur/connecté
est un chantier 24F.

---

## 12. Non-régression + données

| Vérification | Résultat |
|---|---|
| `npm test` | **278/278** ✓ |
| `npx tsc --noEmit` | **0 erreur** ✓ |
| `npm run lint` | clean ✓ |
| `npm run build` | OK ✓ |
| `npm run verify:persistence` | **13/13** ✓ |
| `npm run verify:rls` | **38/38** ✓ |

Compteurs inchangés : quran_words 21 296 · word_occurrences 77 430 · word_audio
21 295 · ayah_audio 0 · lemmas 32 · word_translations FR 25 ·
word_lemma_mapping 183. **Aucune écriture.**

---

## 13. Livrables

- `PHASE_24D_LANDING_ONBOARDING_REPORT.md` (ce rapport)
- `tmp/phase24d-landing-evidence.json`
- `tmp/phase24d-user-flow.json`
- `tmp/phase24d-before-after.json`
- `tmp/phase24d-accessibility.json`

---

## 14. Règle d'arrêt

Après 24D : **ARRÊTER**. Ne pas démarrer automatiquement 24E/24F/24G/23G. Ne pas
modifier le moteur pédagogique, le SRS, ni ajouter de gamification. Attendre
l'approbation explicite du propriétaire après lecture de ce rapport.
