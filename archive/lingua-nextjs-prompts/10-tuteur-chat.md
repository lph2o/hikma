# Étape 10 — Tuteur chat (IA)

## 🎯 Objectif

Créer l'onglet **Chat** : un tuteur de langue conversationnel par **texte**, dans la langue choisie par l'utilisateur.

> ℹ️ Dans l'app d'origine, l'onglet Chat est un simple placeholder (« Chat »). Cette étape le **complète** pour en faire un vrai tuteur, comme attendu dans une version « parité complète ». Si tu veux rester 100 % fidèle, garde juste un placeholder qui capture l'événement `chat_viewed`.

## 📋 Le prompt

```text
Crée l'onglet « Chat » de « Lingua » (Next.js + Tailwind) : un tuteur de langue conversationnel par texte.

Contexte : design system Lingua, auth Clerk (`useUser`), store `use-language-store` (langue choisie), données `data/languages.ts`. La barre d'onglets existe, l'onglet est `/chat`.

### 1. Route API `app/api/chat/route.ts` (POST)
- Protégée par Clerk (`auth()` de `@clerk/nextjs` → 401 si non connecté).
- Reçoit `{ messages: { role: "user" | "assistant", content: string }[], language: string }`.
- Construit un prompt système : « Tu es un tuteur de langue {langue} patient et encourageant. Corrige gentiment les erreurs, donne des exemples, et réponds de façon concise (2-4 phrases). Adapte-toi au niveau de l'élève (débutant). »
- Appelle l'API OpenAI (ou ton fournisseur LLM) en streaming ou non, et renvoie la réponse de l'assistant.
- Clé : `OPENAI_API_KEY` (ou `ANTHROPIC_API_KEY`) côté serveur uniquement.

### 2. Page `app/(main)/chat/page.tsx` (client component)
- En-tête : titre « Chat » + nom de la langue choisie (ex. « Tuteur Français »).
- Zone de **messages** (bulles) : les messages de l'utilisateur à droite (bulle violette #6c4ef5, texte blanc), ceux du tuteur à gauche (bulle blanche, bordure #e5e7eb). Affiche le nom/prénom de l'utilisateur et « Tuteur ».
- **Champ de saisie** en bas (fixe) : input texte + bouton d'envoi (cercle violet, icône send). Entrée pour envoyer aussi.
- État « en train d'écrire » (3 points animés) pendant la réponse.
- Gère le scroll automatique vers le dernier message.
- Capture l'événement analytics `chat_viewed` au montage (voir étape 12, utilise simplement une fonction `captureEvent` si PostHog n'est pas encore branché).

Design : mobile-first, hauteur pleine, bulles arrondies 16-20px, clair et aéré.
```

## 🔧 Étapes manuelles

- Une clé **OpenAI** (ou Anthropic) dans `.env.local` :
  ```env
  OPENAI_API_KEY=sk-...
  ```
  (réutilise la même clé que le service vision-agent si besoin).

## 📁 Fichiers attendus

```
app/api/chat/route.ts
app/(main)/chat/page.tsx
components/chat/message-bubble.tsx
```

## ✅ Validation

- Envoyer un message reçoit une réponse du tuteur dans la langue choisie.
- Les bulles s'affichent correctement, le scroll suit, l'état « écrit... » fonctionne.
