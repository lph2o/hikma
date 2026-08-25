# PHASE 89F — LEGAL & LICENSING — RAPPORT DE PHASE

**VERDICT : `PHASE_89F_COMPLETE`** — socle juridique public minimal en place, licences audio documentées honnêtement. **DATABASE_WRITES = 0.**

## Correctifs

| ID | Résolution |
|---|---|
| **R-006** | 3 pages publiques indexables : `/privacy` (données collectées, stockage Supabase, cookie de session unique, aucun analytics, droits), `/terms` (usage, propriété intellectuelle, limites), `/sources` (attribution des 9 sources avec badges de statut). Liens ajoutés au footer de la landing. |
| **R-009** | Aucune licence inventée : l'audio des versets (Al Quran Cloud) est marqué **« Non vérifié »** publiquement — streaming éducatif autorisé, usage commercial non confirmé. L'audio mot-à-mot (HF) reste **« À revoir »** (provenance non divulguée). |

## Sources documentées (extrait)

- Texte uthmani — Tanzil (libre) via Quran.com API · **Vérifié**
- Hamidullah FR / Sahih International EN / Piccardo IT — droits des traducteurs, usage pédagogique · **À revoir**
- Kazimirski FR (1869) — domaine public (Wikisource) · **Vérifié**
- MASAQ — CC BY 4.0 · **Vérifié**
- Lexique éditorial Hikma — production interne · **Vérifié**
- Récitations Al Quran Cloud (Al-Afasy) · **Non vérifié** (R-009)
- Audio mot-à-mot HF · **À revoir**

## Validation

```
BUILD      = PASS            TYPECHECK = PASS (0 erreur)     LINT = PASS (0 erreur)
VITEST     = 1008/1008 PASS  (aucun test modifié)
RUNTIME    = /privacy 200 · /terms 200 · /sources 200 · footer landing contient les 3 liens
```

## Sécurité / Honnêteté

- Aucune affirmation juridique non vérifiée ; le statut « Non vérifié » est affiché publiquement.
- Protections 89B intactes.

## Risques restants (documentés, non corrigés)

- **R-009-REMAINING (HIGH)** : ne pas monétiser l'audio avant confirmation écrite des droits des récitateurs.
- **DISC-003** : pas de suppression de compte en libre-service (processus manuel) — à traiter avant lancement commercial (RGPD).
- **NOT_VERIFIED** : avis juridique professionnel ; adresse e-mail de contact dédiée (canal actuel : issues GitHub `lph2o/hikma`).

## Prochaine étape

`PHASE_89G_PRODUCTION_CONFIG` — **R-007** security headers dans `next.config.ts`. Rapport : `reports/phase-89f-legal-licensing.json`.
