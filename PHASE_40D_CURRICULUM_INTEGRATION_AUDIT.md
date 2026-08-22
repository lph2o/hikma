# PHASE 40D — AUDIT READ-ONLY — INTÉGRATION DES FORMES P1 AU CURRICULUM

**Statut : `PHASE_40D_AUDIT_COMPLETE` (READ-ONLY)**

> Aucun code produit modifié, aucune migration, aucune écriture DB (lectures seules),
> aucun commit/push. Le seul livrable est ce rapport.

---

## A. Executive Summary

La Phase 40C a validé et écrit 15 gloses FR pour les formes fréquentes **P1** (قَالَ, ذَٰلِكَ,
أَوْ, …), levant localement le goulot `EN_ONLY`. La question de cette phase est : **comment ces
formes s'intègrent-elles au curriculum réel ?**

**Constat décisif (mesuré, pas supposé) :**

> **Les 15 formes P1 n'apparaissent dans AUCUNE des 15 sourates actuellement enseignées.**
> Elles vivent dans les **longues sourates narratives** (قَالَ : 41 sourates ; ذَٰلِكَ : 69 ;
> أَوْ : 56), alors que le curriculum est bâti sur des **sourates courtes** (Al-Fātiḥah + 93, 94,
> 102–110, 112–114) — celles qu'un récitateur débutant connaît.

**Conséquence :** l'enrichissement 40C augmente le **potentiel lexical** (+3,15 %) mais **ne
débloque aucune sourate** et ne peut pas être « ajouté aux leçons existantes » sans casser
l'alignement sourate/verset. La croissance naturelle du curriculum passe par **d'autres sourates
courtes** (Al-Qadr, Al-Masad, Al-Qari'ah…), indépendantes des formes P1.

---

## B. Curriculum Architecture (rappel vérifié)

| Couche | Mécanisme réel |
|---|---|
| `learning_paths` | 1 parcours par sourate (`slug quran-surah-N`, `surah_id` non nul) |
| `units` → `lessons` | 1 leçon **par verset** (publiée), ordre = numéro de verset |
| `lesson_words` | `word_id + position + is_new` ; mots introduits cumulativement + revue (≤4) |
| `planSurahCurriculum` | générateur pur : sourate → leçons → mots (jamais l'Al-Fātiḥah, verrou éditorial) |
| `classifySurahReadiness` | `READY` **ssi 100 % des formes du parcours résolvent en FR** (sinon `IN_PREPARATION`) ; sourate 1 = `REFERENCE` |
| `selectActiveLearningPath` | session active → in_progress → recommandation → fallback (source de vérité, jamais recalculée) |

**Règle d'or confirmée** : une sourate n'est **enseignable (`READY`) que si 100 % de ses formes
ont un FR validé** (glose FORME ou LEMME). C'est le **seuil d'intégration** d'une nouvelle sourate.

---

## C. Où vivent les 15 formes P1

| Forme | Glose (40C) | Sourates | Dans le parcours actuel ? |
|---|---|---:|---|
| قَالَ | il a dit | 41 | **non** |
| ذَٰلِكَ | cela / celui-là | 69 | **non** |
| أَوْ | ou | 56 | **non** |
| ٱلْأَرْضِ | la terre | 52 | **non** |
| ٱلسَّمَـٰوَٰتِ | les cieux | 57 | **non** |
| قَالُوا۟ | ils ont dit | 47 | **non** |
| كَفَرُوا۟ | ils ont mécru | 52 | **non** |
| أُو۟لَـٰٓئِكَ | ceux-là | 47 | **non** |
| يَوْمَ | jour | 53 | **non** |
| كُلِّ | tout / chaque | 53 | **non** |
| شَىْءٍۢ | chose | 43 | **non** |
| ٱلدُّنْيَا | la vie d'ici-bas | 36 | **non** |
| يُؤْمِنُونَ | ils croient | 37 | **non** |
| تَعْمَلُونَ | vous œuvrez | 38 | **non** |
| بَعْدِ | après | 28 | **non** |

> Ces mots sont des **mots de récit** (dire, croire, jour, terre, cieux, ou…) : ils peuplent les
> sourates longues (2, 3, 4, 5…), pas les courtes sourates liturgiques (78–114).

---

## D. Couverture FR des sourates courtes non enseignées

**Aucune sourate hors curriculum n'est à 100 % FR** (0 `READY`), et **aucune n'est même ≥ 95 %**.
Les sourates courtes restantes sont **loin** du seuil d'intégration :

| Sourate | Formes | FR | % | Manquantes (gloses à fournir) |
|---|---:|---:|---:|---:|
| 97 Al-Qadr | 27 | 9 | 33 % | **18** |
| 111 Al-Masad | 22 | 4 | 18 % | **18** |
| 101 Al-Qari'ah | 29 | 8 | 28 % | **21** |
| 95 At-Tin | 34 | 8 | 24 % | 26 |
| 99 Az-Zalzalah | 30 | 4 | 13 % | 26 |
| 100 Al-'Adiyat | 35 | 7 | 20 % | 28 |
| 91 Ash-Shams | 48 | 7 | 15 % | 41 |
| 96 Al-'Alaq | 59 | 15 | 25 % | 44 |
| 86 At-Tariq | 55 | 10 | 18 % | 45 |
| 90 Al-Balad | 73 | 26 | 36 % | 47 |
| 82 Al-Infitar | 66 | 18 | 27 % | 48 |
| 92 Al-Layl | 62 | 12 | 19 % | 50 |
| 87 Al-A'la | 69 | 18 | 26 % | 51 |
| 98 Al-Bayyinah | 79 | 22 | 28 % | 57 |
| 78 An-Naba | 153 | 25 | 16 % | 128 |

**Le moins cher à débloquer** : Al-Qadr (18), Al-Masad (18), Al-Qari'ah (21) — des sourates très
courtes, très récitées, donc parfaitement alignées avec « j'apprends ce que je récite ».

---

## E. Les 126 formes déjà-FR non enseignées

- Comptage réel : **126 formes** avec glose FR (forme OU lemme validé) **non enseignées**.
- Concentration : **sourates longues** (2 : 47 · 9 : 43 · 4 : 41 · 3 : 40 · 5 : 40 · 7 : 39 …).
- Nature : essentiellement des **flexions de الله / رَبّ** et d'autres lemmes validés (الله : 16
  formes, رَسُول : 13, رَحْمَة : 11, يَوْم / أَرْض / كِتَاب : 10 chacune…).
- **Conclusion** : ces 126 formes ne débloquent **aucune** sourate courte non plus — elles ne font
  pas partie des mots « manquants » des sourates 78–114.

---

## F. Options d'intégration évaluées

### Option A — Continuer l'expansion par sourates courtes (aligné sur le modèle)

- Enrichir éditorialement **toutes** les formes de la sourate courte suivante, puis la passer
  `READY` (le générateur `planSurahCurriculum` + un seed idempotent créent le parcours).
- **Indépendant** des 15 formes P1. Prochaine cible la moins chère : **Al-Qadr (18 gloses) /
  Al-Masad (18) / Al-Qari'ah (21)**.
- ✅ Conforme à l'identité, ✅ faible coût, ✅ zéro moteur.
- ⚠️ Ne tire **pas** profit des 15 P1 (elles n'y figurent pas).

### Option B — Piste « mots fréquents » (hors sourate)

- Seule option qui utiliserait réellement قَالَ / ذَٰلِكَ / أَوْ… pour la couverture.
- ❌ **REJETÉE en Phase 40A** (« explorateur des mots fréquents ») ; brise « j'apprends ce que je
  récite » ; crée un second axe pédagogique.

### Option C — Injecter les 15 P1 dans les leçons existantes

- ❌ Impossible sans casser l'alignement sourate/verset : ces mots n'apparaissent dans **aucun**
  verset des 15 sourates enseignées.

### Option D — Étendre aux sourates longues

- Utiliserait les 15 P1 **et** les 126 formes déjà-FR.
- ❌ Sourates 2/3/4… : volume énorme (centaines de formes par sourate), pas adapté à un débutant,
  contre la stratégie « sourates courtes d'abord ».

---

## G. Recommandation

**`P1 — Phase 41 = « Débloquer Al-Qadr + Al-Masad » (batch éditorial ciblé, 0 moteur).`**

1. Reproduire le workflow 40B→40C sur les **formes manquantes** de **Al-Qadr (97)** et
   **Al-Masad (111)** (18 + 18 gloses) — sourates très courtes, très récitées, coût minimal.
2. Une fois 100 % FR, générer le parcours via `seed-multisurah-curriculum` (idempotent) → la
   sourate devient `READY` et apparaît dans le catalogue **sans toucher au moteur**.
3. Itérer ensuite sur Al-Qari'ah (101), At-Tin (95), Az-Zalzalah (99)…

**`P2/DEFER — Décision stratégique sur les mots fréquents`** : les 15 P1 (et les ~80 formes
fréquentes `EN_ONLY` de 40A) resteront **inutilisables pédagogiquement** tant que Hikma n'a pas
décidé d'aborder les **sourates longues** ou d'introduire une **piste fréquentielle** (rejetée).
Ce n'est pas un défaut de la 40C — c'est la conséquence du modèle sourate-court d'abord.

**`REJECT`** : forcer les 15 P1 dans le parcours actuel, réordonner par fréquence, second moteur,
explorateur de mots fréquents, fusion de lemmes.

---

## H. Verdict

| Élément | État | Justification |
|---|---|---|
| Intégration des 15 P1 dans le parcours actuel | **NOT_APPLICABLE** | 0 apparition dans les 15 sourates enseignées |
| Déblocage d'une nouvelle sourate par la 40C | **NOT_ACHIEVED** | aucune sourate n'est à 100 % FR |
| Valeur des 15 P1 | **DEFERRED** | potentiel lexical +3,15 %, activable seulement via sourates longues / piste fréquentielle |
| Croissance naturelle du curriculum | **OPTIMIZABLE** | Al-Qadr (18) / Al-Masad (18) / Al-Qari'ah (21) sont les prochaines cibles |
| Moteur / SRS / mastery / Daily Plan / onboarding | **INTACTS** | aucune modification (phase READ-ONLY) |

---

## I. Décision finale

**`PHASE_40D_AUDIT_COMPLETE`** — l'enrichissement 40C est **correct mais structurellement
décorrélé** du curriculum court-sourate : les 15 formes P1 n'y apparaissent pas. La prochaine
étape à fort rapport valeur/complexité est de **débloquer la sourate courte suivante** (Al-Qadr +
Al-Masad), et non de forcer l'intégration des mots fréquents.

**STOP** — aucune implémentation avant validation explicite de la Phase 41 proposée.
