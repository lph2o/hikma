# Étape 08 — Route de leçon & Prof IA (Stream web)

## 🎯 Objectif

Créer la **route de leçon** `/lesson/[id]` : une conversation **vocale en temps réel** avec un prof IA, propulsée par **Stream Video (web)**. Inclut la route API qui génère le **token Stream** (côté serveur), l'appel vidéo/audio, le **push-to-talk** (maintenir le micro), les **sous-titres en direct**, et la barre de feedback.

> 💡 Sur le web, le SDK Stream est `@stream-io/video-react-sdk` et le WebRTC est fourni par le navigateur (aucun build natif).

## 📋 Le prompt (partie 1 — token serveur)

```text
Ajoute à « Lingua » (Next.js) une route API qui génère un token utilisateur Stream, côté serveur.

1. Installe `jsonwebtoken` (ou génère le JWT manuellement avec `crypto`).
2. Crée `app/api/stream-token/route.ts` (POST) qui :
   - Lit le `Authorization: Bearer <token>` (token de session Clerk).
   - Vérifie le token Clerk pour obtenir l'id utilisateur (`sub`). Utilise le SDK Clerk (`auth()` de `@clerk/nextjs` est plus simple : `const { userId } = await auth()`).
   - Si non authentifié → 401.
   - Génère un JWT Stream signé HS256 avec la `STREAM_API_SECRET`, payload `{ user_id: userId, iat, exp: iat + 3600 }`.
   - Retourne `{ token, apiKey: process.env.STREAM_API_KEY, userId }`.
3. Ne mets JAMAIS `STREAM_API_SECRET` côté client. Elle reste dans `.env.local` (sans préfixe `NEXT_PUBLIC_`).
```

## 📋 Le prompt (partie 2 — la page de leçon)

```text
Crée la page de leçon « prof IA » de « Lingua » (Next.js + Tailwind).

Contexte : design system Lingua, auth Clerk (`useAuth`, `useUser`), store `use-language-store`, données `data/lessons.ts` avec `getLessonById`, et la route `POST /api/stream-token` qui retourne `{ token, apiKey }`. L'onglet Learn navigue déjà vers `/lesson/{id}`.

### 1. Page `app/(main)/lesson/[id]/page.tsx` (client component)
- Récupère `id` via les params, charge `lesson = getLessonById(id)`. Si introuvable, affiche « Lesson not found ».
- Au montage, si l'utilisateur est connecté, appelle `startCall()`.

### 2. Connexion Stream (startCall)
- Récupère le token via `POST /api/stream-token`.
- Installe et utilise `@stream-io/video-react-sdk` :
  - Crée un client : `new StreamVideoClient({ apiKey, token, user: { id, name, image } })`.
  - Crée/appelle un call : `client.call("default", callId)` avec `callId = lesson-${lesson.id}-${userId}`, puis `call.join({ create: true })`.
  - Coupe le micro immédiatement (mode push-to-talk).
  - Envoie le contexte de leçon au call via `call.update({ custom: { lesson_id, lesson_title, language, goals, vocabulary, phrases, topics, system_prompt, intro_message } })`.
  - Démarre les sous-titres (`call.startClosedCaptions()`).
- États UI : `connecting` (spinner « Connecting... Setting up your lesson ») et `error` (bulle « Connection failed — Tap to retry »).

### 3. Démarrage de l'agent (startAgentSession)
- Appelle `POST /api/agent-session` avec `{ callId, callType: "default" }`.
- États : `connecting` (« Your AI teacher is joining »), `connected`, `failed` (« Agent unavailable — Tap to retry »).

### 4. UI de l'écran de leçon
- **Header** : bouton retour (chevron), titre « AI Teacher » centré, bouton rouge « raccrocher » (icône téléphone, fond #E8453C).
- **Ligne de statut** : pastille colorée + libellé (gris « Setting up... », orange « Joining lesson... », vert « Online », rouge « Agent unavailable »).
- **Zone d'appel** : fond #F4F2FF, arrondi 24px. Affiche une mascotte/illustration. En bas, une **bulle de réponse** blanche (le message d'intro du prof ou l'état).
- **Sous-titres en direct** : bulles au-dessus de la zone d'appel. Bulle du prof = fond violet #6c4ef5, texte blanc ; bulle de l'élève = fond blanc. Chaque bulle a un petit label « AI Teacher » / « You ». Utilise `useCallClosedCaptions()` et/ou les événements custom `transcript_partial` (voir partie 3).
- **Push-to-talk** : un grand bouton micro rond (80px, fond #f6f7fb, ombre) entouré d'un anneau (104px) qui devient violet avec un halo quand on maintient. Label dessous : « Push & hold to speak » / « Listening... » / « Waiting for teacher... ». Sur `onMouseDown`/`onTouchStart` : active le micro (`call.microphone.enable()`), sur `onMouseUp`/`onTouchEnd` : le coupe.
- **Barre de feedback** (en bas) : 3 colonnes séparées par des filets — « Speaking · Excellent » (vert), « Pronunciation · Great » (bleu #4d88ff), « Grammar · Good » (violet).
- Au démontage / bouton raccrocher : `call.leave()`, `client.disconnectUser()`, et `DELETE /api/agent-session`.

### 5. (Optionnel) Sous-titres partiels temps réel
Écoute l'événement custom Stream `custom` de type `transcript_partial` (speaker agent/user) et affiche le texte en temps réel, en le remplaçant par les sous-titres « finaux » dès qu'ils arrivent.

Important web : demande l'accès au micro via `navigator.mediaDevices.getUserMedia({ audio: true })` (le SDK le fait à l'appel). Gère le cas où l'utilisateur refuse (affiche une erreur). Fais attention à l'écho : coupe le micro par défaut.
```

## 📋 Le prompt (partie 3 — route agent-session)

```text
Ajoute la route `app/api/agent-session/route.ts` (POST et DELETE) qui relaie vers le service Python vision-agent :

- POST : lit `{ callId, callType = "default" }`, appelle `POST {VISION_AGENT_URL}/calls/{callId}/sessions` avec `{ call_type: callType }`, et renvoie la réponse JSON (dont `session_id`). En cas d'échec réseau → 503.
- DELETE : lit `callId` et `sessionId` des query params, appelle `DELETE {VISION_AGENT_URL}/calls/{callId}/sessions/{sessionId}`.
- `VISION_AGENT_URL` vient de `.env.local` (défaut `http://localhost:8000`).
```

## 🔧 Étapes manuelles

1. Crée un compte **Stream** (https://getstream.io) et une application.
2. Dans `.env.local` :
   ```env
   STREAM_API_KEY=
   STREAM_API_SECRET=
   VISION_AGENT_URL=http://localhost:8000
   ```
3. Le service Python (étape 09) doit tourner pour que l'agent réponde.
4. Sur le web, le micro/caméra nécessitent **HTTPS ou localhost**. `localhost:3000` est OK en dev.

## 📁 Fichiers attendus

```
app/api/stream-token/route.ts
app/api/agent-session/route.ts
app/(main)/lesson/[id]/page.tsx
components/lesson/... (sous-composants : mic button, captions, feedback)
```

## ✅ Validation

- Ouvrir une leçon → le prof IA se connecte (statut « Online »).
- Le message d'intro du prof s'affiche et l'audio se joue.
- Maintenir le micro permet de répondre ; les sous-titres affichent les paroles du prof et de l'élève.
- Le bouton raccrocher ferme proprement l'appel.
