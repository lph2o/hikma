# Hikma — Phase 32E onboarding UX redesign

## Intent

Transformer l’onboarding obligatoire en première expérience Hikma chaleureuse, lisible et engageante, sans modifier la persistance, la recommandation, le catalogue ni la navigation métier.

## Structure UX

L’orchestrateur existant conserve ses huit écrans métier, regroupés visuellement en six grandes étapes :

1. Bienvenue — promesse et entrée dans le parcours.
2. À propos de toi — prénom puis objectif.
3. Ton expérience — lecture arabe puis familiarité avec le Coran.
4. Ton rythme — durée puis fréquence.
5. Ton parcours — recommandation, choix dynamique et sourates en préparation non démarrables.
6. Ton parcours est prêt — récapitulatif personnalisé et confirmation.

Chaque question reste affichée seule. Les segments de progression représentent les six étapes UX, sans compteur administratif « X / Y ».

## Direction visuelle

- Canvas ivoire et surfaces chaudes existantes.
- Teal Hikma pour la structure, les actions et les états actifs.
- Or Hikma existant (`hikma-gold`, `hikma-gold-muted`, `hikma-gold-bright`) pour les labels de recommandation, la progression, la sélection et la célébration.
- Mascotte officielle réutilisée, sans nouvelle illustration.
- Cartes tactiles de minimum 44px, largeur confortable et composition mobile-first.
- Motion limitée à opacity/transform, avec repli statique sous `prefers-reduced-motion`.

## Personnalisation ressentie

Le récapitulatif reformule uniquement les réponses réellement collectées : nom, objectif, niveau de lecture, familiarité, durée et rythme. Ces éléments servent la copy et la présentation du parcours ; ils ne modifient pas silencieusement le moteur pédagogique.

## Garde-fous métier

- `completeOnboarding` reste l’unique persistance de fin de parcours.
- La navigation intervient uniquement après succès serveur.
- Les erreurs de sauvegarde conservent le profil local et exposent une action de retry.
- Les sourates sont issues du catalogue dynamique ; seuls `REFERENCE` et `READY` sont démarrables.
- `IN_PREPARATION`, notamment Al-Māʿūn 107, reste visible sans CTA.
- Aucun changement au grading, scoring, SRS, mastery, scheduler, interleaving, curriculum, Quran, audio, MASAQ ou Supabase.

## Validation

Tests unitaires ciblés sur les regroupements UX, les textes de personnalisation, les états sélectionné/chargement/erreur et la célébration. Validation navigateur réelle à 390×844, 375×812 et 1280×720, avec contrôle de l’overflow, du CTA, de la réduction de mouvement et de l’absence d’erreur console/hydratation.

Ce document est ajouté sans commit afin de préserver l’état de travail existant du dépôt.
