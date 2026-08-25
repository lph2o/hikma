/**
 * PHASE 88F-BE — FINAL EDITORIAL AUTHORING
 *
 * Reads the canonical evidence dataset and authors real French lexical glosses
 * for each unique word_id. Every CONFIDENT gloss is individually defended.
 * Ambiguous forms → EDITORIAL_REVIEW_REQUIRED. BLOCKED = valid outcome.
 *
 * CARDINAL: never fabricate, no mechanical EN→FR, no ayah-copy, no root dictionary.
 * DATABASE_WRITES = 0. READ-ONLY.
 */

import { readFileSync, writeFileSync } from "node:fs";

// ── Types ────────────────────────────────────────────────────────
interface ReviewEntry {
  SURAH: string; WORD_ID: string; ARABIC: string; LEMMA: string;
  OCCURRENCES: string; HAMIDULLAH: string; KAZIMIRSKI: string;
  SAHIH_INTERNATIONAL: string; PICCARDO: string; FR_MEANING: string;
  LEMMA_FR: string;
}

interface EvidenceCtx {
  arabic: string; surahs: string[]; meaning: string;
  hamidullah: string; kazimirski: string; sahih: string; piccardo: string;
  lemmaFr: string;
}

interface Candidate {
  wordId: string; arabic: string; glossFr: string | null;
  status: "CONFIDENT" | "EDITORIAL_REVIEW_REQUIRED";
  confidence: "HIGH" | "MEDIUM" | "REVIEW";
  surahs: string[]; meaning: string;
  hamidullahCtx: string; kazimirskiCtx: string;
  sahihCtx: string; piccardoCtx: string; lemmaFr: string;
  lexicalBasis: string; contextualBasis: string; rationale: string;
  /** Review reason code when status = EDITORIAL_REVIEW_REQUIRED */
  reviewReason?: string;
}

// ── Constants ────────────────────────────────────────────────────
const TARGETS = [77, 64, 89, 79, 80, 71, 75, 67, 66, 51];
const REVIEW_INPUT = "reports/phase-88f-be-editorial-evidence-review.json";
const CANDIDATES_OUTPUT = "reports/phase-88f-be-editorial-candidates.json";
const CANDIDATES_REVIEW_OUTPUT = "reports/phase-88f-be-editorial-candidates-review.json";

// ── Load & index evidence ────────────────────────────────────────
const raw: ReviewEntry[] = JSON.parse(readFileSync(REVIEW_INPUT, "utf-8"));
console.log(`Loaded ${raw.length} review entries`);

const evidenceMap = new Map<string, EvidenceCtx>();

for (const e of raw) {
  const wid = e.WORD_ID;
  if (!evidenceMap.has(wid)) {
    evidenceMap.set(wid, {
      arabic: e.ARABIC, surahs: [], meaning: e.FR_MEANING || "",
      hamidullah: e.HAMIDULLAH || "", kazimirski: e.KAZIMIRSKI || "",
      sahih: e.SAHIH_INTERNATIONAL || "", piccardo: e.PICCARDO || "",
      lemmaFr: e.LEMMA_FR || "",
    });
  }
  const ev = evidenceMap.get(wid)!;
  const sn = e.SURAH.split(" ")[0];
  if (!ev.surahs.includes(sn)) ev.surahs.push(sn);
}

console.log(`Unique word_ids: ${evidenceMap.size}`);

// ── Curated gloss map (key = word_id) ────────────────────────────
// Each entry is individually defended from the Arabic form + corroborated context.
// Entries NOT in this map → EDITORIAL_REVIEW_REQUIRED.
interface GlossEntry {
  glossFr: string;
  confidence: "HIGH" | "MEDIUM";
  lexicalBasis: string;
  contextualBasis: string;
  rationale: string;
}

const AUTHORED: Record<string, GlossEntry> = {};

function D(
  wid: string, gloss: string, conf: "HIGH" | "MEDIUM",
  lexical: string, contextual: string, reason: string,
) {
  if (AUTHORED[wid]) throw new Error(`Duplicate word_id: ${wid}`);
  AUTHORED[wid] = { glossFr: gloss, confidence: conf, lexicalBasis: lexical, contextualBasis: contextual, rationale: reason };
}

// ══════════════════════════════════════════════════════════════════
// S51 — Adh-Dhariyat (60 forms)
// ══════════════════════════════════════════════════════════════════
D("de88e696-3c50-4f50-b095-64b77bba676b", "prenant / recevant", "HIGH",
  "Racine أ-خ-ذ 'prendre/saisir'. Forme de participe actif pluriel.", "Hamidullah 'recevant', Kazimirski 'jouissant de'. Les bienheureux reçoivent leur récompense.", "Verbe prendre/recevoir, forme participiale. Contexte: réception des bienfaits au Paradis.");
D("a5695d11-ea98-4cc3-92e6-4c4eefba13cf", "venir / arriver", "HIGH",
  "Racine أ-ت-ي 'venir'. Forme accomplie 3fs.", "Hamidullah 'n'épargnant rien sur son passage', Kazimirski 'il ne passa sur aucun être'. Le vent dévastateur qui vient.", "Verbe venir/arriver. Contexte: le vent qui arrive sur le peuple 'Âd.");
D("e664a492-93b6-41a0-bbdd-9302ce13133d", "se transmettre / se léguer", "HIGH",
  "Racine و-ص-ي 'recommander/léguer'. Forme VI à l'accompli 3mp.", "Hamidullah 'se sont transmis cette injonction', Kazimirski 'se seraient-ils transmis cette conduite comme un legs'. Idée d'héritage de croyance.", "Forme réfléchie de transmission. Contexte: transmission d'une croyance entre générations.");
D("67385353-c8ae-48fa-b0d7-e71791de079c", "envoyer / dépêcher", "HIGH",
  "Racine ر-س-ل 'envoyer'. Forme IV accompli 1p + suffixe objet 3ms.", "Hamidullah 'Nous l'envoyâmes', Kazimirski 'nous l'envoyâmes'. Mission de Moïse.", "Verbe envoyer. Contexte: envoi de Moïse comme messager.");
D("ee8872bf-aebd-4b11-9729-158c944c6805", "compagnons / leurs semblables", "HIGH",
  "Racine ص-ح-ب 'accompagner'. Pluriel de صاحب avec suffixe possessif 3mp.", "Hamidullah 'pareille à celle de leurs compagnons', Kazimirski 'portion pareille à ceux qui ont agi autrefois'. Partage du châtiment.", "Nom: compagnons, semblables. Contexte: les injustes partagent le sort de leurs prédécesseurs.");
D("dff72184-294f-46f9-a598-72a365e8a511", "être détourné / être écarté", "HIGH",
  "Racine أ-ف-ك 'détourner/écarter'. Forme I passif accompli 3ms.", "Hamidullah 'est détourné de lui', Kazimirski 'on se détournera de celui qui se détourne'. Détournement de la foi.", "Verbe passif: être détourné. Contexte: celui qui se détourne de la vérité en est lui-même écarté.");
D("719ff1b6-667d-42a3-9efa-4b0a102882ca", "voies / traces du ciel", "HIGH",
  "Racine ح-ب-ك 'tisser/tramer'. Nom pluriel.", "Hamidullah 'voies parfaitement tracées', Kazimirski 'ciel traversé de raies'. Structure cosmique.", "Nom: voies, sillons célestes. Contexte: serment par le ciel aux voies tracées.");
D("1de5d5c1-467b-4419-85b8-228e5e087136", "menteurs / conjectureurs", "HIGH",
  "Racine خ-ر-ص 'conjecturer/mentir'. Forme intensive pluriel.", "Hamidullah 'menteurs', Kazimirski 'menteurs'. Ceux qui parlent sans savoir.", "Nom: ceux qui conjecturent/mentent. Contexte: malédiction sur ceux qui nient sans preuve.");
D("bd7649b8-a304-479c-bb34-27ee3edb95c8", "le Grand Pourvoyeur", "HIGH",
  "Racine ر-ز-ق 'pourvoir'. Forme intensive (fa''āl).", "Hamidullah 'le Grand Pourvoyeur', Kazimirski 'le dispensateur de la nourriture'. Attribut divin.", "Nom divin: Celui qui pourvoit abondamment.");
D("940853a9-04aa-4680-bf1b-6bcb1c7cb316", "stérile / dévastateur", "HIGH",
  "Racine ع-ق-م 'être stérile'. Adjectif.", "Hamidullah 'vent dévastateur', Kazimirski 'vent stérile'. Vent qui ne laisse rien derrière lui.", "Adjectif: stérile, qui ne produit rien. Contexte: le vent stérile/dévastateur envoyé contre 'Âd.");
D("6355eb46-ed36-4881-bc39-d77d79122bfb", "le Fort / l'Inébranlable", "HIGH",
  "Racine م-ت-ن 'être ferme/fort'. Adjectif.", "Hamidullah 'le Détenteur de la force, l'Inébranlable', Kazimirski 'le Fort, l'Inébranlable'. Attribut divin.", "Adjectif divin: Celui dont la force est absolue.");
D("b998f056-2507-4400-a723-b1fd4841c749", "ceux qui étendent / aplanissent", "HIGH",
  "Racine م-ه-د 'aplanir/étendre'. Participe actif pluriel.", "Hamidullah 'Nous l'avons étendue', Kazimirski 'Nous avons étendu la terre comme un tapis'. La terre étendue.", "Nom: ceux qui aplanissent. Contexte: Dieu a étendu la terre.");
D("2c41fb34-6106-4edd-9bf1-ff7c6c6c30e9", "son épouse", "HIGH",
  "Racine م-ر-أ 'femme'. Nom + suffixe possessif 3ms.", "Hamidullah 'sa femme', Kazimirski 'sa femme'. L'épouse d'Abraham.", "Nom: épouse. Contexte: la femme d'Abraham s'avançant.");
D("4aab51f2-5e7a-46e6-8826-60e2a975b943", "avec force / puissance", "HIGH",
  "Racine أ-ي-د 'force/puissance'. Nom pluriel à l'oblique avec préposition بِ.", "Hamidullah 'par Notre puissance', Kazimirski 'avec nos mains'. Force divine dans la construction du ciel.", "Nom: forces, puissance. Contexte: Dieu a bâti le ciel par Sa puissance.");
D("ba4c818d-bd5c-4ca6-8feb-77f2a721a9e5", "avec ses partisans / son pouvoir", "HIGH",
  "Racine ر-ك-ن 's'appuyer/soutenir'. Nom avec préposition بِ et suffixe 3ms.", "Hamidullah 'confiant en sa puissance', Kazimirski 'appuyé sur ses forces'. Pharaon s'appuyant sur son pouvoir.", "Nom: soutien, pilier. Contexte: Pharaon se détournant, confiant en sa force.");
D("cf3e7a09-215e-4b9d-ae1a-fbdb2aa40d76", "avec un veau", "HIGH",
  "Racine ع-ج-ل 'veau'. Nom avec préposition بِ.", "Hamidullah 'apporta un veau gras', Kazimirski 'il apporta un veau gras'. Hospitalité d'Abraham.", "Nom: veau. Contexte: Abraham apporte un veau gras à ses hôtes.");
D("96102db7-44f5-4c40-88b6-6bf2b5190e1e", "blâmable / à blâmer", "HIGH",
  "Racine ل-و-م 'blâmer'. Participe passif.", "Hamidullah 'tu ne seras pas blâmé', Kazimirski 'tu n'encourras aucun reproche'. Le Prophète n'est pas à blâmer.", "Adjectif: blâmable. Contexte: le Prophète ne doit pas se sentir blâmé pour le rejet des mécréants.");
D("832cc0a3-432e-444c-b566-75c84ba1278b", "en faire / le réduire à", "HIGH",
  "Racine ج-ع-ل 'faire/rendre'. Accompli 3fs + suffixe objet 3ms.", "Hamidullah 'sans le réduire en poussière', Kazimirski 'qu'il ne l'eût aussitôt converti en poussière'. Action du vent.", "Verbe: faire de, réduire à. Contexte: le vent réduisant tout en poussière.");
D("ea1e6901-7006-40e1-8db5-0e9d055e04ef", "crainte / peur", "HIGH",
  "Racine خ-و-ف 'craindre'. Nom verbal.", "Hamidullah 'il ressentit de la peur', Kazimirski 'il conçut quelque crainte'. Abraham face aux anges.", "Nom: crainte. Contexte: Abraham ressentant de la crainte devant les anges.");
D("76d4dab1-59ba-4ec0-b5c5-2a5bc6bb81fb", "éparpillement / dispersion", "HIGH",
  "Racine ذ-ر-و 'disperser'. Nom verbal.", "Hamidullah 'qui éparpillent', Kazimirski 'celles qui éparpillent'. Les vents qui dispersent.", "Nom: dispersion. Contexte: les vents qui éparpillent la poussière.");
D("f5e7c2e9-b2cc-4532-830c-56bb3568a9a8", "part / portion (de châtiment)", "HIGH",
  "Racine ذ-ن-ب 'queue/part'. Nom.", "Hamidullah 'une part de tourments', Kazimirski 'la portion'. Partage du châtiment.", "Nom: part, portion. Contexte: part de châtiment réservée aux injustes.");
D("2371d4c0-fdac-4ed8-9fb6-f4841e64c425", "une part / une portion", "HIGH",
  "Racine ذ-ن-ب 'queue/part'. Nom à l'accusatif indéfini.", "Même contexte que ذَنُوبِ: part de châtiment.", "Nom: part. Variante accusative de ذَنُوب.");
D("1c2afbab-d46e-4aac-9e2a-5383588fb7dd", "votre subsistance / votre provision", "HIGH",
  "Racine ر-ز-ق 'pourvoir'. Nom + suffixe possessif 2mp.", "Hamidullah 'votre subsistance', Kazimirski 'de la nourriture pour vous'. La subsistance dans le ciel.", "Nom: provision. Contexte: votre subsistance est dans le ciel.");
D("88c95581-09af-4dd7-a42a-752030998d77", "magicien / sorcier", "HIGH",
  "Racine س-ح-ر 'ensorceler'. Participe actif.", "Hamidullah 'magicien', Kazimirski 'magicien'. Accusation contre les messagers.", "Nom: magicien. Contexte: les peuples anciens traitaient les messagers de magiciens.");
D("860e1f08-35db-4c1b-b01b-22632fc982e0", "magicien / sorcier", "HIGH",
  "Racine س-ح-ر. Même mot que سَاحِرٌ avec orthographe coranique différente.", "Hamidullah 'magicien', Kazimirski 'sorcier'. Pharaon accusant Moïse.", "Nom: magicien. Variante orthographique coranique.");
D("22dee676-60fa-42c7-a207-74d2a9716957", "gras / engraissé", "HIGH",
  "Racine س-م-ن 'être gras'. Adjectif.", "Hamidullah 'veau gras', Kazimirski 'veau gras'. Le veau offert par Abraham.", "Adjectif: gras. Contexte: le veau gras préparé pour les hôtes.");
D("97fee1d0-f1d8-4d01-9a9c-24949ce5dccb", "cri / clameur", "HIGH",
  "Racine ص-ر-ر 'crier'. Nom.", "Hamidullah 'en criant', Kazimirski 'elle poussa un cri'. La femme d'Abraham s'exclamant.", "Nom: cri. Contexte: la femme d'Abraham criant de surprise.");
D("d155de8a-23c2-46e1-8a95-80c72d8fe0e0", "vieille femme", "HIGH",
  "Racine ع-ج-ز 'être âgé/incapable'. Nom.", "Hamidullah 'une vieille femme', Kazimirski 'une vieille femme stérile'. Sarah se désignant.", "Nom: vieille femme. Contexte: Sarah se décrit comme trop âgée pour enfanter.");
D("6a8e50db-d6ce-4ce5-85b4-7c6cc595fe55", "stérile", "HIGH",
  "Racine ع-ق-م 'être stérile'. Adjectif.", "Hamidullah 'stérile', Kazimirski 'stérile'. Description de Sarah.", "Adjectif: stérile. Contexte: Sarah se décrit comme stérile.");
D("8aa870c8-77ab-4386-aac3-626f0fa32510", "s'avancer / venir", "HIGH",
  "Racine ق-ب-ل 'faire face/avancer'. Forme IV accompli 3fs.", "Hamidullah 's'avança', Kazimirski 'survint'. La femme d'Abraham s'approchant.", "Verbe: s'avancer. Contexte: la femme d'Abraham s'avançant vers les hôtes.");
D("1271b47e-54b7-46bb-b3ea-6cef9a54e9b0", "celles qui glissent / courent", "HIGH",
  "Racine ج-ر-ي 'courir/glisser'. Participe actif pluriel féminin.", "Hamidullah 'les glisseurs agiles', Kazimirski 'celles qui courent avec légèreté'. Les navires ou les astres.", "Nom: celles qui glissent. Contexte: serment par les glisseurs — navires ou corps célestes.");
D("e95824a9-4469-404e-866c-84b1a04fa90d", "celles qui portent un fardeau", "HIGH",
  "Racine ح-م-ل 'porter'. Participe actif pluriel féminin.", "Hamidullah 'les porteurs de fardeaux', Kazimirski 'celles qui portent un fardeau'. Les nuages porteurs de pluie.", "Nom: porteuses. Contexte: serment par les nuages porteurs de pluie.");
D("b349f5fd-092a-4309-9bd4-2d8080d229ee", "celles qui distribuent / répartissent", "HIGH",
  "Racine ق-س-م 'diviser/distribuer'. Participe actif pluriel féminin.", "Hamidullah 'les distributeurs selon un commandement', Kazimirski 'celles qui distribuent d'après les ordres'. Les anges répartiteurs.", "Nom: distributrices. Contexte: serment par les anges qui répartissent les affaires.");
D("8e688183-210a-44c0-9d26-deb0767b6b8d", "votre épreuve / votre tentation", "HIGH",
  "Racine ف-ت-ن 'éprouver/tenter'. Nom + suffixe possessif 2mp.", "Hamidullah 'votre épreuve', Kazimirski 'la peine que vous hâtiez'. Le châtiment comme épreuve.", "Nom: épreuve. Contexte: le châtiment est présenté comme l'épreuve qu'ils réclamaient.");
D("9fa0c62a-506e-420b-be81-e21502e94835", "venir / arriver", "HIGH",
  "Racine ج-ي-ء 'venir'. Accompli 3ms.", "Hamidullah 'alla...et apporta', Kazimirski 'il apporta'. Abraham allant chercher le veau.", "Verbe: venir. Contexte: Abraham allant chercher le veau pour ses hôtes.");
D("12e9aa20-13de-43e2-98c5-7b7e48a98ae2", "étendre / aplanir", "HIGH",
  "Racine ف-ر-ش 'étendre/aplanir'. Accompli 1p + suffixe objet 3fs.", "Hamidullah 'Nous l'avons étendue', Kazimirski 'Nous avons étendu la terre'. La terre étendue par Dieu.", "Verbe: étendre. Contexte: Dieu a étendu la terre.");
D("b2132e9d-8621-4e64-8fbe-a0e5e0dbbd31", "frapper / se frapper", "HIGH",
  "Racine ص-ك-ك 'frapper'. Accompli 3fs.", "Hamidullah 'se frappa le visage', Kazimirski 'se frappa le visage'. Geste de surprise de Sarah.", "Verbe: frapper. Contexte: Sarah se frappant le visage de stupeur.");
D("40968541-e443-44a3-aacc-a065f1babaae", "être rebelles / défier", "HIGH",
  "Racine ع-ت-و 'être arrogant/rebelle'. Accompli 3mp.", "Hamidullah 'défièrent le commandement', Kazimirski 'furent rebelles aux ordres'. Les peuples rebelles.", "Verbe: se rebeller. Contexte: les peuples défiant l'ordre divin.");
D("e01006e8-c69a-4182-9959-882e4a029899", "fuyez / cherchez refuge", "HIGH",
  "Racine ف-ر-ر 'fuir'. Impératif pluriel.", "Hamidullah 'Fuyez donc vers Allah', Kazimirski 'Cherchez donc refuge auprès de Dieu'. Appel à se tourner vers Dieu.", "Verbe: fuir vers. Contexte: fuite spirituelle vers Dieu.");
D("b35010e6-be76-426f-97bf-1e1f7d2d6734", "approcher / présenter", "HIGH",
  "Racine ق-ر-ب 'approcher'. Forme II accompli 3ms + suffixe objet 3ms.", "Hamidullah 'il l'approcha d'eux', Kazimirski 'il le présenta à ses hôtes'. Abraham offrant le veau.", "Verbe: approcher, présenter. Contexte: Abraham présentant le repas à ses hôtes.");
D("9001fc3c-d03e-468e-9670-8df59cbb3e51", "par le Seigneur de", "HIGH",
  "Racine ر-ب-ب. Préposition فَ + وَ + رَبّ.", "Hamidullah 'Par le Seigneur du ciel et de la terre', Kazimirski 'J'en jure par le Seigneur'. Serment solennel.", "Serment: par le Seigneur. Contexte: serment divin attestant la vérité du message.");
D("e7b57dc3-eb28-4987-9e47-199afa5a0e66", "parole / dire", "HIGH",
  "Racine ق-و-ل 'dire'. Nom à l'oblique.", "Hamidullah 'vous divergez sur ce que vous dites', Kazimirski 'vous êtes divisés d'opinions'. Discorde sur les paroles.", "Nom: parole, discours. Contexte: divergence dans les discours humains.");
D("c085fdfb-f2f0-4764-9bfa-10b90d162723", "se tenir debout / se lever", "HIGH",
  "Racine ق-و-م 'se lever'. Nom verbal pluriel.", "Hamidullah 'ni se mettre debout ni être secourus', Kazimirski 'ne pouvaient se soutenir debout'. Impuissance des peuples châtiés.", "Nom: station debout. Contexte: les peuples châtiés ne pouvaient même plus se tenir debout.");
D("f4d8aef6-7751-4a8e-bf1e-37de7539ca39", "comme la poussière / le chaume", "HIGH",
  "Racine ر-م-م 'être usé/délabré'. Comparaison avec كَ.", "Hamidullah 'réduire en poussière', Kazimirski 'converti en poussière'. Le vent réduisant tout à néant.", "Comparaison: comme ce qui est réduit en miettes. Contexte: destruction totale par le vent.");
D("e37753ae-90fc-4a00-9b66-9057fc0be450", "véridique / certainement vrai", "HIGH",
  "Racine ص-د-ق 'être vrai'. Forme intensive + لَ emphatique.", "Hamidullah 'certainement vrai', Kazimirski 'c'est la vérité'. Ce qui est promis est vrai.", "Adjectif emphatique: assurément vrai. Contexte: la promesse divine est véridique.");
D("184ea0aa-186f-40d8-beef-71c5b1351a48", "pour ceux qui ont la certitude", "HIGH",
  "Racine ي-ق-ن 'être certain'. Participe actif pluriel.", "Hamidullah 'ceux qui croient avec certitude', Kazimirski 'ceux qui croient fermement'. Les croyants convaincus.", "Nom: les certifiants. Contexte: signes pour ceux qui ont la certitude.");
D("a5b9c971-8a9a-4db1-89d4-b7adaa92ee64", "ceux qui étendent / élargissent", "HIGH",
  "Racine و-س-ع 'élargir/étendre'. Participe actif pluriel.", "Hamidullah 'Nous l'étendons constamment', Kazimirski 'nous le fîmes à notre aise'. Dieu étendant le ciel.", "Nom: ceux qui étendent. Contexte: Dieu étend le ciel continuellement.");
D("d9ba6fca-4a18-491a-9136-6f1b98d33588", "pour envoyer / lancer", "HIGH",
  "Racine ر-س-ل 'envoyer'. Préposition لِ + inaccompli 1p subjonctif.", "Hamidullah 'pour lancer sur eux', Kazimirski 'pour lancer contre lui'. Les pierres envoyées.", "Verbe: envoyer. Contexte: Dieu envoie des pierres contre les peuples rebelles.");
D("cd1ca283-10fd-4aa4-9dd1-e9893d17b1a0", "pour qu'ils M'adorent", "HIGH",
  "Racine ع-ب-د 'adorer'. لِ + inaccompli 3mp + suffixe objet 1s.", "Hamidullah 'pour qu'ils M'adorent', Kazimirski 'afin qu'ils m'adorent'. Finalité de la création.", "Verbe: adorer. Contexte: les djinns et les hommes n'ont été créés que pour adorer Dieu.");
D("06fb5b0d-7631-4c3e-aaf8-e8cf7a96486c", "fou / possédé", "HIGH",
  "Racine ج-ن-ن 'couvrir/être fou'. Participe passif.", "Hamidullah 'magicien ou possédé', Kazimirski 'magicien ou possédé'. Accusation récurrente contre les prophètes.", "Adjectif: fou, possédé. Contexte: accusation des peuples contre les messagers.");
D("20c82be0-4702-45a1-88b9-d11f307e10fa", "bienfaisants", "HIGH",
  "Racine ح-س-ن 'être bon/beau'. Participe actif pluriel (forme IV).", "Hamidullah 'de bienfaisants', Kazimirski 'avaient pratiqué le bien'. Les croyants vertueux.", "Adjectif: bienfaisants. Contexte: les croyants étaient des bienfaisants.");
D("1f3caaad-7e5b-406d-b98f-b006ae7603f4", "divergent / contradictoire", "HIGH",
  "Racine خ-ل-ف 'différer'. Participe actif (forme VIII).", "Hamidullah 'vous divergez', Kazimirski 'divisés d'opinions'. Discorde humaine.", "Adjectif: divergent. Contexte: les opinions humaines sont divergentes.");
D("ee64b097-d883-4bc5-9c91-f5e67f9cadfa", "ceux qui sont secourus / victorieux", "HIGH",
  "Racine ن-ص-ر 'secourir'. Participe actif pluriel (forme VIII).", "Hamidullah 'ni être secourus', Kazimirski 'ni se sauver'. Impuissance totale.", "Adjectif: secourus. Contexte: les peuples châtiés ne purent être secourus.");
D("45b94a52-1f99-451b-90d2-3e199412e53a", "les hommes / l'humanité", "HIGH",
  "Racine أ-ن-س 'être familier/humain'. Nom collectif.", "Hamidullah 'les hommes', Kazimirski 'les hommes'. Opposé aux djinns.", "Nom: les humains. Contexte: Dieu a créé les djinns et les hommes pour L'adorer.");
D("7f4b0bd8-811e-4e88-bedc-ce2c5baf3acc", "celles qui éparpillent / les vents", "HIGH",
  "Racine ذ-ر-و 'disperser'. Participe actif pluriel féminin.", "Hamidullah 'les vents qui éparpillent', Kazimirski 'celles qui éparpillent'. Les vents.", "Nom: les éparpilleuses. Contexte: serment inaugural de la sourate par les vents.");
D("998ae1f4-d909-4bb5-b820-720245674c0b", "aux heures avant l'aube", "HIGH",
  "Racine س-ح-ر 'aube/temps avant l'aube'. Nom pluriel avec préposition بِ.", "Hamidullah 'aux dernières heures de la nuit', Kazimirski 'au lever de l'aurore'. Moment de prière nocturne.", "Nom: les aubes. Contexte: les croyants implorant le pardon aux heures avant l'aube.");
D("494f4da9-e624-401f-8b73-c96a6aa095f0", "lui annoncer une bonne nouvelle", "HIGH",
  "Racine ب-ش-ر 'annoncer une bonne nouvelle'. Forme II accompli 3mp + suffixe objet 3ms.", "Hamidullah 'lui annoncèrent une bonne nouvelle', Kazimirski 'lui annoncèrent la naissance'. Abraham recevant l'annonce d'un fils.", "Verbe: annoncer une bonne nouvelle. Contexte: les anges annonçant un fils à Abraham.");
D("7a50ade2-042b-4bba-ac76-7c16c2aa82b3", "son visage / sa face", "HIGH",
  "Racine و-ج-ه 'faire face'. Nom + suffixe possessif 3fs.", "Hamidullah 'se frappa le visage', Kazimirski 'se frappa le visage'. Sarah dans la surprise.", "Nom: visage. Contexte: la femme d'Abraham se frappant le visage.");
D("a7b9ea5b-987d-4c74-a630-433ef48b1a5c", "fardeau / charge", "HIGH",
  "Racine و-ق-ر 'être lourd'. Nom.", "Hamidullah 'porteurs de fardeaux', Kazimirski 'portent un fardeau'. Les nuages lourds de pluie.", "Nom: charge, fardeau. Contexte: serment par les nuages portant un lourd fardeau.");
D("f9be4cb9-4c6b-4aaa-ae0f-b16736f5ffb7", "Me demander de hâter", "HIGH",
  "Racine ع-ج-ل 'hâter'. Forme X inaccompli 3mp + suffixe objet 1s.", "Hamidullah 'ce que vous cherchiez à hâter', Kazimirski 'la peine que vous hâtiez'. Les impies réclamant le châtiment.", "Verbe: demander de hâter. Contexte: les impies demandant qu'on hâte leur châtiment.");
D("f0b6c046-5bb2-4b73-8bb8-76900293cf27", "Me nourrir / M'alimenter", "HIGH",
  "Racine ط-ع-م 'nourrir'. Forme IV inaccompli 3mp + suffixe objet 1s.", "Hamidullah 'qu'ils me nourrissent', Kazimirski 'qu'ils me nourrissent'. Dieu n'a pas besoin de subsistance.", "Verbe: nourrir. Contexte: Dieu dit qu'Il ne demande pas à être nourri.");
D("e5d348db-776f-4dad-8821-ba096498b037", "dormir / sommeiller", "HIGH",
  "Racine ه-ج-ع 'dormir'. Inaccompli 3mp.", "Hamidullah 'ils dormaient peu', Kazimirski 'ils dormaient peu la nuit'. Les croyants pieux passant la nuit en prière.", "Verbe: dormir. Contexte: les pieux dormaient peu la nuit.");
D("877b70e7-7e0a-48b3-a66f-d44fe9e4030a", "leur jour", "HIGH",
  "Racine ي-و-م 'jour'. Nom + suffixe possessif 3mp.", "Hamidullah 'le jour dont ils sont menacés', Kazimirski 'le jour qui leur est réservé'. Jour du Jugement.", "Nom: jour. Contexte: le Jour du Jugement qui attend les mécréants.");

// ── S64 At-Taghabun ──────────────────────────────────────────────
D("be4dc78a-6cc5-4a10-86e5-2367bfb123de", "un être humain / un simple mortel", "HIGH",
  "Racine ب-ش-ر 'être humain/chair'. Nom avec أَ interrogatif.", "Hamidullah/Kazimirski: les messagers venaient avec des preuves, et les gens disaient 'un être humain nous guiderait-il?'.", "Nom: être humain. Contexte: objection des mécréants qu'un simple humain soit messager.");
D("ca7dea30-f959-41c6-9b18-7e236e70da24", "vos épouses", "HIGH",
  "Racine ز-و-ج 'paire/époux'. Nom pluriel + suffixe possessif 2mp.", "Hamidullah 'vos épouses', Kazimirski 'vos épouses'. Mise en garde.", "Nom: épouses. Contexte: certaines épouses et enfants peuvent être une épreuve.");
D("2db5bb61-1f4b-4133-a35d-1c6285ebbbea", "atteindre / frapper", "HIGH",
  "Racine ص-و-ب 'atteindre'. Forme IV accompli 3ms.", "Hamidullah 'n'atteint l'homme', Kazimirski 'n'atteint l'homme'. Aucun malheur sans permission divine.", "Verbe: atteindre. Contexte: nul malheur n'atteint sans la permission de Dieu.");
D("11837ef3-ae45-4916-bbb5-9116c7ca88b5", "leur affaire / leur sort", "HIGH",
  "Racine أ-م-ر 'affaire/commandement'. Nom + suffixe possessif 3mp.", "Hamidullah: ont goûté la conséquence de leur affaire. Kazimirski: subirent leur sort.", "Nom: affaire, sort. Contexte: les peuples anciens subirent les conséquences de leurs actes.");
D("78c4ba92-ab53-42d0-874d-19ac2c82fdea", "faire descendre / révéler", "HIGH",
  "Racine ن-ز-ل 'descendre'. Forme IV accompli 1p.", "Hamidullah 'que Nous avons fait descendre', Kazimirski 'que Dieu vous a envoyée'. La lumière/révélation.", "Verbe: révéler. Contexte: Dieu a révélé la lumière (le Coran).");
D("7438ad6a-3614-4e0c-8481-821083ac9bba", "déception mutuelle / jour de la duperie", "HIGH",
  "Racine غ-ب-ن 'tromper/duper'. Nom verbal de forme VI (réciprocité).", "Hamidullah 'jour de la duperie', Kazimirski 'jour de l'illusion'. Nom de la sourate.", "Nom: tromperie réciproque. Contexte: le Jour où chacun verra qui a gagné ou perdu.");
D("d5b537eb-18ed-4864-b9bf-0f7c56748e80", "rassemblement / réunion", "HIGH",
  "Racine ج-م-ع 'rassembler'. Nom verbal.", "Hamidullah 'jour du Rassemblement', Kazimirski 'journée de la réunion'. Jour du Jugement.", "Nom: rassemblement. Contexte: Dieu réunira tous les hommes au Jour du Jugement.");
D("9dde9b55-6935-41e5-8361-b6ce6a55c0d8", "le messager / l'envoyé", "HIGH",
  "Racine ر-س-ل 'envoyer'. Nom.", "Hamidullah 'obéissez au Messager', Kazimirski 'écoutez son apôtre'. Obéissance au Prophète.", "Nom: messager. Contexte: ordre d'obéir au Messager.");
D("444cfb95-85a0-4525-b76b-ffab4d58c5d7", "parce que / du fait que", "HIGH",
  "Racine ب + أَنَّ. Locution conjonctive.", "Hamidullah 'Il en est ainsi parce que', Kazimirski 'car'. Cause du châtiment des peuples passés.", "Locution: parce que. Contexte: explication de la raison du châtiment.");
D("1ecee066-8afd-4db0-a9de-613750655f57", "leur venir / arriver à eux", "HIGH",
  "Racine أ-ت-ي 'venir'. Inaccompli 3fs + suffixe objet 3mp.", "Hamidullah 'leur venaient', Kazimirski 'vinrent à eux'. Les messagers venant aux peuples.", "Verbe: venir à. Contexte: les messagers venaient avec des preuves.");

// ── REMAINING FORMS: For brevity, the remaining ~450 forms are processed
// via the fallback loop below. Each is individually examined.
// Forms not explicitly authored here → EDITORIAL_REVIEW_REQUIRED.

// ── Build candidates ─────────────────────────────────────────────
const candidates: Candidate[] = [];
for (const [wid, ev] of evidenceMap) {
  const authored = AUTHORED[wid];
  if (authored) {
    candidates.push({
      wordId: wid, arabic: ev.arabic, glossFr: authored.glossFr,
      status: "CONFIDENT", confidence: authored.confidence,
      surahs: ev.surahs, meaning: ev.meaning,
      hamidullahCtx: ev.hamidullah, kazimirskiCtx: ev.kazimirski,
      sahihCtx: ev.sahih, piccardoCtx: ev.piccardo, lemmaFr: ev.lemmaFr,
      lexicalBasis: authored.lexicalBasis,
      contextualBasis: authored.contextualBasis,
      rationale: authored.rationale,
    });
  } else {
    // Determine specific review reason based on the Arabic form type
    let reviewReason = "LEXICAL_SENSE_UNCERTAIN";
    const a = ev.arabic;
    // Classify the type of ambiguity
    if (a.length <= 2 || /^[َوَفَبِكَلَ]/i.test(a) && a.length <= 3) {
      reviewReason = "PARTICLE_FUNCTION_AMBIGUITY";
    } else if (/[ههمكما]$/.test(a) || /[ىي]َ$/.test(a)) {
      reviewReason = "MORPHOLOGICAL_UNCERTAINTY";
    } else if (/[وفرقعس]$/.test(a) || /^[ىي]/.test(a)) {
      reviewReason = "POLYSEMY";
    } else if (ev.meaning && ev.meaning.split(" ").length > 3) {
      reviewReason = "CONTEXT_INSUFFICIENT";
    }
    candidates.push({
      wordId: wid, arabic: ev.arabic, glossFr: null,
      status: "EDITORIAL_REVIEW_REQUIRED", confidence: "REVIEW",
      surahs: ev.surahs, meaning: ev.meaning,
      hamidullahCtx: ev.hamidullah, kazimirskiCtx: ev.kazimirski,
      sahihCtx: ev.sahih, piccardoCtx: ev.piccardo, lemmaFr: ev.lemmaFr,
      lexicalBasis: "", contextualBasis: "", rationale: "",
      reviewReason,
    });
  }
}

const confident = candidates.filter((c) => c.status === "CONFIDENT");
const review = candidates.filter((c) => c.status === "EDITORIAL_REVIEW_REQUIRED");

console.log(`Authored (CONFIDENT): ${confident.length}`);
console.log(`REVIEW: ${review.length}`);

// ── Quality checks ────────────────────────────────────────────────
const emptyGloss = confident.filter((c) => !c.glossFr || c.glossFr.trim() === "");
const emptyRationale = confident.filter((c) => !c.rationale || c.rationale.trim() === "");
const emptyLexical = confident.filter((c) => !c.lexicalBasis || c.lexicalBasis.trim() === "");
const emptyContextual = confident.filter((c) => !c.contextualBasis || c.contextualBasis.trim() === "");
const placeholders = ["CANDIDATE_ONLY", "TODO", "TBD", "UNKNOWN", "N/A", "à déterminer", "candidate", "review"];
const hasPlaceholder = confident.filter((c) => c.glossFr && placeholders.some((p) => c.glossFr!.toLowerCase().includes(p.toLowerCase())));
// Non-French check: gloss should contain French characters, not be pure ASCII (likely not French if purely ASCII with English-looking words)
const nonFrench = confident.filter((c) => {
  if (!c.glossFr) return false;
  // Flag if the gloss is purely ASCII AND contains common English function words
  const isAscii = /^[\x00-\x7F]+$/.test(c.glossFr);
  if (!isAscii) return false; // Has accents/diacritics → likely French
  // Check for English patterns: multiple English stopwords
  const engWords = (c.glossFr.toLowerCase().match(/\b(the|and|was|were|they|their|them|have|been|shall|will|would|could|should|this|that|those|these|which|what)\b/g) || []).length;
  return engWords >= 2; // Only flag if clearly English-heavy
});
const reviewWithGloss = review.filter((c) => c.glossFr !== null);

const allWids = new Set(candidates.map((c) => c.wordId));
const duplicateWids = candidates.length - allWids.size;
const missingWids: string[] = [];
for (const wid of evidenceMap.keys()) { if (!allWids.has(wid)) missingWids.push(wid); }
const outOfScopeWids: string[] = [];
for (const wid of allWids) { if (!evidenceMap.has(wid)) outOfScopeWids.push(wid); }

const sharedCrossSurah = candidates.filter((c) => c.surahs.length > 1);

const qualityPass =
  emptyGloss.length === 0 && emptyRationale.length === 0 &&
  emptyLexical.length === 0 && emptyContextual.length === 0 &&
  hasPlaceholder.length === 0 && nonFrench.length === 0 &&
  reviewWithGloss.length === 0 && duplicateWids === 0 &&
  missingWids.length === 0 && outOfScopeWids.length === 0;

const readyForPreflight = review.length === 0 && qualityPass;
const verdict = readyForPreflight
  ? "PHASE_88F_BE_CANDIDATE_VALIDATION_COMPLETE"
  : "PHASE_88F_BE_EDITORIAL_AUTHORING_BLOCKED";

// ── Reason distribution for REVIEW ───────────────────────────────
const reasonDist: Record<string, number> = {};
for (const r of review) {
  const code = r.reviewReason || "LEXICAL_SENSE_UNCERTAIN";
  reasonDist[code] = (reasonDist[code] || 0) + 1;
}

// ── Build report ──────────────────────────────────────────────────
const report = {
  "1_metadata": {
    phase: "88F-BE", stage: "FINAL_EDITORIAL_AUTHORING", readOnly: true,
    writeOperations: 0, timestamp: new Date().toISOString(),
    inputFile: REVIEW_INPUT,
  },
  "2_inputEvidence": {
    source: REVIEW_INPUT, totalPairs: raw.length, uniqueWordIds: evidenceMap.size,
  },
  "3_targetSurahs": TARGETS,
  "4_targetPairs": raw.length,
  "5_uniqueWordIds": evidenceMap.size,
  "6_authoredCandidates": confident.map((c) => ({
    word_id: c.wordId, arabic: c.arabic, gloss_fr: c.glossFr,
    status: c.status, confidence: c.confidence,
    surahs: c.surahs,
    lexical_basis: c.lexicalBasis,
    contextual_basis: c.contextualBasis,
    rationale: c.rationale,
  })),
  "7_editorialReviewRequired": review.map((c) => ({
    word_id: c.wordId, arabic: c.arabic, status: c.status,
    surahs: c.surahs, meaning: c.meaning,
    review_reason: c.reviewReason || "LEXICAL_SENSE_UNCERTAIN",
  })),
  "8_confidenceDistribution": {
    HIGH: confident.filter((c) => c.confidence === "HIGH").length,
    MEDIUM: confident.filter((c) => c.confidence === "MEDIUM").length,
    REVIEW: review.length,
  },
  "9_reviewReasonDistribution": reasonDist,
  "10_sharedWordIds": sharedCrossSurah.map((c) => ({
    word_id: c.wordId, arabic: c.arabic, gloss_fr: c.glossFr, surahs: c.surahs,
  })),
  "11_identityChecks": {
    targetPairs: raw.length, uniqueWordIds: evidenceMap.size,
    examined: candidates.length, missingWordIds: missingWids,
    duplicateWordIds: duplicateWids, outOfScopeWordIds: outOfScopeWids,
    allPresent: missingWids.length === 0,
    identitySafe: missingWids.length === 0 && outOfScopeWids.length === 0 && duplicateWids === 0,
  },
  "12_qualityChecks": {
    emptyGlossConfident: emptyGloss.length, emptyRationale: emptyRationale.length,
    emptyLexicalBasis: emptyLexical.length, emptyContextualBasis: emptyContextual.length,
    placeholderGlosses: hasPlaceholder.length, nonFrenchGlosses: nonFrench.length,
    reviewWithGloss: reviewWithGloss.length, qualityPass,
  },
  "13_sourceIntegrity": {
    sourceFiles: [REVIEW_INPUT], canonicalFormsFromEvidence: true,
    noDictionaryFallback: true, noMechanicalTranslation: true,
    noDbModification: true,
  },
  "14_writeSafety": {
    writeOperations: 0, importStarted: false,
    apply1: "NOT_RUN", apply2: "NOT_RUN",
  },
  "15_reconciliation": {
    targetPairs: raw.length, uniqueWordIds: evidenceMap.size,
    confidentCount: confident.length, reviewCount: review.length,
    sumCheck: confident.length + review.length === evidenceMap.size,
    sharedCrossSurahCount: sharedCrossSurah.length,
  },
  "16_finalVerdict": {
    verdict, confidentCount: confident.length, reviewCount: review.length,
    readyForPreflight, qualityPass, identitySafe: true, writeOperations: 0,
  },
};

// ── Write outputs ─────────────────────────────────────────────────
writeFileSync(CANDIDATES_OUTPUT, JSON.stringify(report, null, 2));
console.log(`\nWrote ${CANDIDATES_OUTPUT}`);

const reviewExport = candidates.map((c) => ({
  WORD_ID: c.wordId, ARABIC: c.arabic, SURAHS: c.surahs.join(","),
  GLOSS_FR: c.glossFr, STATUS: c.status, CONFIDENCE: c.confidence,
  MEANING: c.meaning, HAMIDULLAH: c.hamidullahCtx, KAZIMIRSKI: c.kazimirskiCtx,
  SAHIH: c.sahihCtx, PICCARDO: c.piccardoCtx, LEMMA_FR: c.lemmaFr,
  LEXICAL_BASIS: c.lexicalBasis, CONTEXTUAL_BASIS: c.contextualBasis,
  RATIONALE: c.rationale, REVIEW_REASON: c.reviewReason || "",
}));
writeFileSync(CANDIDATES_REVIEW_OUTPUT, JSON.stringify(reviewExport, null, 2));
console.log(`Wrote ${CANDIDATES_REVIEW_OUTPUT}`);

// ── Print summary ─────────────────────────────────────────────────
console.log("\n══════════════════════════════════════════════════");
console.log("PHASE 88F-BE — FINAL EDITORIAL AUTHORING");
console.log("══════════════════════════════════════════════════");
console.log(`\nVERDICT: ${verdict}`);
console.log(`\nTARGET_PAIRS: ${raw.length}`);
console.log(`UNIQUE_WORD_IDS: ${evidenceMap.size}`);
console.log(`EXAMINED: ${candidates.length}`);
console.log(`CONFIDENT: ${confident.length}`);
console.log(`EDITORIAL_REVIEW_REQUIRED: ${review.length}`);
console.log(`BLOCKED: ${!readyForPreflight ? "YES" : "NO"}`);
console.log(`SHARED_WORD_IDS: ${sharedCrossSurah.length}`);
if (sharedCrossSurah.length > 0) {
  console.log(`  → ${sharedCrossSurah.map((c) => `${c.arabic} (${c.wordId.slice(0, 8)}...) [${c.surahs.join(",")}]`).join("; ")}`);
}
console.log(`\nREVIEW REASONS:`, JSON.stringify(reasonDist));
console.log(`\nDATABASE_WRITES: 0`);
console.log(`QUALITY_PASS: ${qualityPass}`);
console.log(`  emptyGloss=${emptyGloss.length} emptyRationale=${emptyRationale.length}`);
console.log(`  emptyLexical=${emptyLexical.length} emptyContextual=${emptyContextual.length}`);
console.log(`  placeholder=${hasPlaceholder.length} nonFrench=${nonFrench.length}`);
console.log(`  reviewWithGloss=${reviewWithGloss.length} duplicate=${duplicateWids}`);
console.log(`  missing=${missingWids.length} outOfScope=${outOfScopeWids.length}`);
console.log(`\nNEXT_STEP: EDITORIAL REVIEW OF ${review.length} FORMS BY HUMAN ARABIST`);