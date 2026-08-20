// Vérification RÉELLE de l'isolation RLS (Phase 5, Étape 17).
//
// Teste l'accès aux tables privées user_word_progress / review_items pour :
//   - Anon   : aucun accès (0 ligne, pas d'insertion) ;
//   - User A : voit et modifie SES données uniquement ;
//   - User B : ne voit pas et ne modifie pas les données de User A.
//
// Deux utilisateurs de test temporaires sont créés via la Management API
// (service_role) puis SUPPRIMÉS à la fin (nettoyage garanti par finally).
//
// Usage :
//   npm run verify:rls

function loadEnvFiles(): void {
  for (const file of [".env.local", ".env"]) {
    try {
      (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(file);
    } catch {
      // Fichier absent : ignoré.
    }
  }
}

type Row = Record<string, unknown>;

async function api(
  url: string,
  opts: { method: string; apikey: string; token: string; body?: unknown },
): Promise<{ status: number; body: string; headers: Headers }> {
  const res = await fetch(url, {
    method: opts.method,
    headers: {
      apikey: opts.apikey,
      Authorization: `Bearer ${opts.token}`,
      "Content-Type": "application/json",
      // Demande la représentation des lignes affectées (0 si RLS bloque).
      Prefer: "return=representation",
    },
    body: opts.body != null ? JSON.stringify(opts.body) : undefined,
  });
  return { status: res.status, body: await res.text(), headers: res.headers };
}

const RESULTS: Array<{ check: string; ok: boolean; detail: string }> = [];

function record(check: string, ok: boolean, detail: string): void {
  RESULTS.push({ check, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${check} — ${detail}`);
}

async function main(): Promise<void> {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !anon || !service) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / ANON_KEY / SERVICE_ROLE_KEY requis.");
  }

  const createdUserIds: string[] = [];
  const now = Date.now();

  try {
    // 1. Un mot coranique réel pour les insertions.
    const { status: wordStatus, body: wordBody } = await api(
      `${url}/rest/v1/quran_words?select=id&limit=1`,
      { method: "GET", apikey: anon, token: anon },
    );
    if (wordStatus !== 200) throw new Error(`quran_words : ${wordStatus} ${wordBody}`);
    const word = (JSON.parse(wordBody) as Row[])[0];
    if (!word) throw new Error("Aucun quran_word disponible pour le test.");
    const wordId = String(word.id);

    // 2. Création des deux utilisateurs de test (e-mail confirmé d'office).
    for (const tag of ["a", "b"]) {
      const { status, body } = await api(`${url}/auth/v1/admin/users`, {
        method: "POST",
        apikey: service,
        token: service,
        body: {
          email: `rls-test-${tag}-${now}@hikma.test`,
          password: "test-password-123",
          email_confirm: true,
        },
      });
      if (status !== 201 && status !== 200) {
        throw new Error(`création user ${tag} : ${status} ${body}`);
      }
      const created = JSON.parse(body) as { id: string };
      createdUserIds.push(created.id);
    }
    if (createdUserIds.length !== 2) throw new Error("Création des utilisateurs de test incomplète.");
    const userAId = createdUserIds[0]!;
    const userBId = createdUserIds[1]!;
    void userBId; // L'identité de User B est portée par son JWT (tokenB).

    // 3. Connexion des deux utilisateurs (JWT via anon key).
    async function signIn(email: string): Promise<string> {
      const { status, body } = await api(
        `${url}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          apikey: anon,
          token: anon,
          body: { email, password: "test-password-123" },
        },
      );
      if (status !== 200) throw new Error(`signin : ${status} ${body}`);
      return (JSON.parse(body) as { access_token: string }).access_token;
    }
    const tokenA = await signIn(`rls-test-a-${now}@hikma.test`);
    const tokenB = await signIn(`rls-test-b-${now}@hikma.test`);

    // 4. ANON — aucun accès privé.
    const anonRead = await api(`${url}/rest/v1/user_word_progress?select=*&limit=5`, {
      method: "GET",
      apikey: anon,
      token: anon,
    });
    const anonRows = anonRead.status === 200 ? (JSON.parse(anonRead.body) as Row[]) : null;
    record("Anon ne voit aucune ligne privée", anonRows != null && anonRows.length === 0,
      `status ${anonRead.status}, ${anonRows?.length ?? "—"} ligne(s)`);

    const anonInsert = await api(`${url}/rest/v1/user_word_progress`, {
      method: "POST",
      apikey: anon,
      token: anon,
      body: { user_id: userAId, word_id: wordId },
    });
    record("Anon ne peut pas insérer dans user_word_progress", anonInsert.status >= 400,
      `status ${anonInsert.status}`);

    // 5. User A — insère sa propre ligne puis la voit.
    const insertA = await api(`${url}/rest/v1/user_word_progress`, {
      method: "POST",
      apikey: anon,
      token: tokenA,
      body: { user_id: userAId, word_id: wordId, status: "learning", mastery: 25 },
    });
    record("User A peut insérer sa ligne", insertA.status === 201,
      `status ${insertA.status}`);

    const readA = await api(
      `${url}/rest/v1/user_word_progress?select=word_id&user_id=eq.${userAId}`,
      { method: "GET", apikey: anon, token: tokenA },
    );
    const readARows = JSON.parse(readA.body) as Row[];
    record("User A voit SA ligne", readA.status === 200 && readARows.length === 1,
      `${readARows.length} ligne(s)`);

    // 6. User B — ne voit PAS la ligne de User A.
    const readB = await api(
      `${url}/rest/v1/user_word_progress?select=word_id&user_id=eq.${userAId}`,
      { method: "GET", apikey: anon, token: tokenB },
    );
    const readBRows = JSON.parse(readB.body) as Row[];
    record("User B ne voit pas la ligne de User A", readBRows.length === 0,
      `${readBRows.length} ligne(s)`);

    // 7. User B — ne peut PAS modifier la ligne de User A (0 ligne affectée).
    const patchB = await api(
      `${url}/rest/v1/user_word_progress?user_id=eq.${userAId}&word_id=eq.${wordId}`,
      {
        method: "PATCH",
        apikey: anon,
        token: tokenB,
        body: { mastery: 100 },
      },
    );
    const patched = patchB.body.trim() === "" ? [] : (JSON.parse(patchB.body) as Row[]);
    record(
      "User B ne peut pas modifier la ligne de User A (0 ligne affectée)",
      patched.length === 0,
      `${patched.length} ligne(s) affectée(s) (status ${patchB.status})`,
    );

    // 8. User B — ne peut pas supprimer la ligne de User A (0 ligne affectée).
    const deleteB = await api(
      `${url}/rest/v1/user_word_progress?user_id=eq.${userAId}&word_id=eq.${wordId}`,
      { method: "DELETE", apikey: anon, token: tokenB },
    );
    const deleted = deleteB.body.trim() === "" ? [] : (JSON.parse(deleteB.body) as Row[]);
    record(
      "User B ne peut pas supprimer la ligne de User A (0 ligne affectée)",
      deleted.length === 0,
      `${deleted.length} ligne(s) affectée(s) (status ${deleteB.status})`,
    );

    // 9. user_word_progress est toujours intacte pour User A (contrôle final).
    const readAFinal = await api(
      `${url}/rest/v1/user_word_progress?select=word_id&user_id=eq.${userAId}`,
      { method: "GET", apikey: anon, token: tokenA },
    );
    const finalRows = JSON.parse(readAFinal.body) as Row[];
    record("La ligne de User A est intacte", finalRows.length === 1, `${finalRows.length} ligne(s)`);

    // 10. review_items — même isolation (User B ne voit rien de User A).
    await api(`${url}/rest/v1/review_items`, {
      method: "POST",
      apikey: anon,
      token: tokenA,
      body: { user_id: userAId, word_id: wordId, status: "learning", interval_days: 1 },
    });
    const reviewB = await api(
      `${url}/rest/v1/review_items?select=word_id&user_id=eq.${userAId}`,
      { method: "GET", apikey: anon, token: tokenB },
    );
    const reviewBRows = JSON.parse(reviewB.body) as Row[];
    record("User B ne voit pas les review_items de User A", reviewBRows.length === 0,
      `${reviewBRows.length} ligne(s)`);

    // ---------------------------------------------------------------------
    // Phase 6 — user_settings / user_activity_lessons / user_activity_words
    // ---------------------------------------------------------------------
    const today = new Date().toISOString().slice(0, 10);
    const { status: lessonStatus, body: lessonBody } = await api(
      `${url}/rest/v1/lessons?select=id&limit=1`,
      { method: "GET", apikey: anon, token: anon },
    );
    if (lessonStatus !== 200) throw new Error(`lessons : ${lessonStatus}`);
    const lesson = (JSON.parse(lessonBody) as Row[])[0];
    if (!lesson) throw new Error("Aucune lesson disponible pour le test RLS.");
    const lessonId = String(lesson.id);

    // 11. user_settings — Anon bloqué, User A lit/écrit le sien, B isolé.
    const anonSettingsRead = await api(`${url}/rest/v1/user_settings?select=*&limit=5`, {
      method: "GET", apikey: anon, token: anon,
    });
    const anonSettingsRows = anonSettingsRead.status === 200
      ? (JSON.parse(anonSettingsRead.body) as Row[]) : null;
    record("Anon ne voit aucune ligne user_settings",
      anonSettingsRows != null && anonSettingsRows.length === 0,
      `status ${anonSettingsRead.status}, ${anonSettingsRows?.length ?? "—"} ligne(s)`);

    const anonSettingsInsert = await api(`${url}/rest/v1/user_settings`, {
      method: "POST", apikey: anon, token: anon,
      body: { user_id: userAId, daily_goal_type: "words", daily_goal_value: 5 },
    });
    record("Anon ne peut pas insérer dans user_settings", anonSettingsInsert.status >= 400,
      `status ${anonSettingsInsert.status}`);

    const settingsInsertA = await api(`${url}/rest/v1/user_settings`, {
      method: "POST", apikey: anon, token: tokenA,
      body: { user_id: userAId, daily_goal_type: "words", daily_goal_value: 10 },
    });
    record("User A peut insérer ses user_settings", settingsInsertA.status === 201,
      `status ${settingsInsertA.status}`);

    const settingsReadB = await api(
      `${url}/rest/v1/user_settings?select=user_id&user_id=eq.${userAId}`,
      { method: "GET", apikey: anon, token: tokenB },
    );
    const settingsReadBRows = JSON.parse(settingsReadB.body) as Row[];
    record("User B ne voit pas les user_settings de User A", settingsReadBRows.length === 0,
      `${settingsReadBRows.length} ligne(s)`);

    const settingsPatchB = await api(
      `${url}/rest/v1/user_settings?user_id=eq.${userAId}`,
      { method: "PATCH", apikey: anon, token: tokenB, body: { daily_goal_value: 99 } },
    );
    const settingsPatched = settingsPatchB.body.trim() === ""
      ? [] : (JSON.parse(settingsPatchB.body) as Row[]);
    record("User B ne peut pas modifier les user_settings de User A",
      settingsPatched.length === 0,
      `${settingsPatched.length} ligne(s) (status ${settingsPatchB.status})`);

    // 12. user_activity_lessons — insert-only, isolé.
    const anonActivityInsert = await api(`${url}/rest/v1/user_activity_lessons`, {
      method: "POST", apikey: anon, token: anon,
      body: { user_id: userAId, activity_date: today, lesson_id: lessonId },
    });
    record("Anon ne peut pas insérer dans user_activity_lessons",
      anonActivityInsert.status >= 400, `status ${anonActivityInsert.status}`);

    const activityInsertA = await api(`${url}/rest/v1/user_activity_lessons`, {
      method: "POST", apikey: anon, token: tokenA,
      body: { user_id: userAId, activity_date: today, lesson_id: lessonId },
    });
    record("User A peut insérer son activité lesson", activityInsertA.status === 201,
      `status ${activityInsertA.status}`);

    const activityReadB = await api(
      `${url}/rest/v1/user_activity_lessons?select=user_id&user_id=eq.${userAId}`,
      { method: "GET", apikey: anon, token: tokenB },
    );
    const activityReadBRows = JSON.parse(activityReadB.body) as Row[];
    record("User B ne voit pas l'activité lesson de User A", activityReadBRows.length === 0,
      `${activityReadBRows.length} ligne(s)`);

    // 13. user_activity_words — insert-only, isolé, et spoof impossible.
    const anonWordInsert = await api(`${url}/rest/v1/user_activity_words`, {
      method: "POST", apikey: anon, token: anon,
      body: { user_id: userAId, activity_date: today, word_id: wordId },
    });
    record("Anon ne peut pas insérer dans user_activity_words",
      anonWordInsert.status >= 400, `status ${anonWordInsert.status}`);

    const wordInsertA = await api(`${url}/rest/v1/user_activity_words`, {
      method: "POST", apikey: anon, token: tokenA,
      body: { user_id: userAId, activity_date: today, word_id: wordId },
    });
    record("User A peut insérer son activité word", wordInsertA.status === 201,
      `status ${wordInsertA.status}`);

    // User B tente d'insérer UNE LIGNE attribuée à User A (spoof user_id).
    const spoofInsert = await api(`${url}/rest/v1/user_activity_words`, {
      method: "POST", apikey: anon, token: tokenB,
      body: { user_id: userAId, activity_date: today, word_id: wordId },
    });
    record("User B ne peut pas insérer une activité au nom de User A",
      spoofInsert.status >= 400, `status ${spoofInsert.status}`);

    const wordReadB = await api(
      `${url}/rest/v1/user_activity_words?select=user_id&user_id=eq.${userAId}`,
      { method: "GET", apikey: anon, token: tokenB },
    );
    const wordReadBRows = JSON.parse(wordReadB.body) as Row[];
    record("User B ne voit pas l'activité word de User A", wordReadBRows.length === 0,
      `${wordReadBRows.length} ligne(s)`);

    // ---------------------------------------------------------------------
    // Phase 7 — word_translations (lecture publique, écriture interdite)
    // ---------------------------------------------------------------------
    // Table LEXICALE Hikma : SELECT public (comme quran_words), aucune policy
    // d'écriture. Anon / User A / User B ne peuvent ni insérer, ni modifier,
    // ni supprimer — l'écriture éditoriale passe par le service role.
    const sourceId = await (async () => {
      const { status, body } = await api(
        `${url}/rest/v1/sources?select=id&name=eq.${encodeURIComponent("Hikma — lexique éditorial")}&limit=1`,
        { method: "GET", apikey: anon, token: anon },
      );
      if (status !== 200) throw new Error(`source hikma : ${status}`);
      const rows = JSON.parse(body) as Row[];
      if (!rows[0]) throw new Error("Source « Hikma — lexique éditorial » introuvable.");
      return String(rows[0].id);
    })();

    const wtInsertBody = {
      word_id: wordId,
      language: "fr",
      text: "rls-test-proposal",
      source_id: sourceId,
      is_validated: false,
    };

    // SELECT public pour anon (lecture autorisée — 200, même si 0 ligne).
    const wtAnonRead = await api(`${url}/rest/v1/word_translations?select=id&limit=5`, {
      method: "GET", apikey: anon, token: anon,
    });
    record("Anon peut lire word_translations (lecture publique)",
      wtAnonRead.status === 200,
      `status ${wtAnonRead.status}`);

    // INSERT refusé pour anon / User A / User B.
    const wtAnonInsert = await api(`${url}/rest/v1/word_translations`, {
      method: "POST", apikey: anon, token: anon, body: wtInsertBody,
    });
    record("Anon ne peut pas insérer dans word_translations", wtAnonInsert.status >= 400,
      `status ${wtAnonInsert.status}`);

    const wtInsertA = await api(`${url}/rest/v1/word_translations`, {
      method: "POST", apikey: anon, token: tokenA, body: wtInsertBody,
    });
    record("User A ne peut pas insérer dans word_translations", wtInsertA.status >= 400,
      `status ${wtInsertA.status}`);

    const wtInsertB = await api(`${url}/rest/v1/word_translations`, {
      method: "POST", apikey: anon, token: tokenB, body: wtInsertBody,
    });
    record("User B ne peut pas insérer dans word_translations", wtInsertB.status >= 400,
      `status ${wtInsertB.status}`);

    // UPDATE / DELETE refusés (0 ligne affectée) pour anon et les utilisateurs.
    const wtUpdateA = await api(
      `${url}/rest/v1/word_translations?word_id=eq.${wordId}`,
      { method: "PATCH", apikey: anon, token: tokenA, body: { editorial_notes: "x" } },
    );
    const wtUpdatedA = wtUpdateA.body.trim() === ""
      ? [] : (JSON.parse(wtUpdateA.body) as Row[]);
    record("User A ne peut pas modifier word_translations (0 ligne)",
      wtUpdatedA.length === 0,
      `${wtUpdatedA.length} ligne(s) (status ${wtUpdateA.status})`);

    const wtDeleteB = await api(
      `${url}/rest/v1/word_translations?word_id=eq.${wordId}`,
      { method: "DELETE", apikey: anon, token: tokenB },
    );
    const wtDeletedB = wtDeleteB.body.trim() === ""
      ? [] : (JSON.parse(wtDeleteB.body) as Row[]);
    record("User B ne peut pas supprimer word_translations (0 ligne)",
      wtDeletedB.length === 0,
      `${wtDeletedB.length} ligne(s) (status ${wtDeleteB.status})`);

    // ---------------------------------------------------------------------
    // Phase 21B-C — word_lemma_mapping (lecture publique, écriture interdite)
    // ---------------------------------------------------------------------
    // Même patron que word_translations : SELECT public, aucune policy
    // d'écriture (l'écriture éditoriale passe par le service role).
    const { status: lemmaStatus, body: lemmaBody } = await api(
      `${url}/rest/v1/lemmas?select=id&limit=1`,
      { method: "GET", apikey: anon, token: anon },
    );
    if (lemmaStatus !== 200) throw new Error(`lemmas : ${lemmaStatus}`);
    const lemma = (JSON.parse(lemmaBody) as Row[])[0];
    if (!lemma) throw new Error("Aucun lemma disponible pour le test RLS.");
    const lemmaId = String(lemma.id);

    const wlmInsertBody = {
      word_id: wordId,
      lemma_id: lemmaId,
      source_id: sourceId,
      mapping_method: "exact_surface",
      confidence: "safe",
    };

    const wlmAnonRead = await api(`${url}/rest/v1/word_lemma_mapping?select=id&limit=5`, {
      method: "GET", apikey: anon, token: anon,
    });
    record("Anon peut lire word_lemma_mapping (lecture publique)",
      wlmAnonRead.status === 200,
      `status ${wlmAnonRead.status}`);

    const wlmAnonInsert = await api(`${url}/rest/v1/word_lemma_mapping`, {
      method: "POST", apikey: anon, token: anon, body: wlmInsertBody,
    });
    record("Anon ne peut pas insérer dans word_lemma_mapping", wlmAnonInsert.status >= 400,
      `status ${wlmAnonInsert.status}`);

    const wlmInsertA = await api(`${url}/rest/v1/word_lemma_mapping`, {
      method: "POST", apikey: anon, token: tokenA, body: wlmInsertBody,
    });
    record("User A ne peut pas insérer dans word_lemma_mapping", wlmInsertA.status >= 400,
      `status ${wlmInsertA.status}`);

    const wlmInsertB = await api(`${url}/rest/v1/word_lemma_mapping`, {
      method: "POST", apikey: anon, token: tokenB, body: wlmInsertBody,
    });
    record("User B ne peut pas insérer dans word_lemma_mapping", wlmInsertB.status >= 400,
      `status ${wlmInsertB.status}`);

    const wlmUpdateA = await api(
      `${url}/rest/v1/word_lemma_mapping?word_id=eq.${wordId}`,
      { method: "PATCH", apikey: anon, token: tokenA, body: { editorial_notes: "x" } },
    );
    const wlmUpdatedA = wlmUpdateA.body.trim() === ""
      ? [] : (JSON.parse(wlmUpdateA.body) as Row[]);
    record("User A ne peut pas modifier word_lemma_mapping (0 ligne)",
      wlmUpdatedA.length === 0,
      `${wlmUpdatedA.length} ligne(s) (status ${wlmUpdateA.status})`);

    const wlmDeleteB = await api(
      `${url}/rest/v1/word_lemma_mapping?word_id=eq.${wordId}`,
      { method: "DELETE", apikey: anon, token: tokenB },
    );
    const wlmDeletedB = wlmDeleteB.body.trim() === ""
      ? [] : (JSON.parse(wlmDeleteB.body) as Row[]);
    record("User B ne peut pas supprimer word_lemma_mapping (0 ligne)",
      wlmDeletedB.length === 0,
      `${wlmDeletedB.length} ligne(s) (status ${wlmDeleteB.status})`);

    // ---------------------------------------------------------------------
    // Phase 23F — user_word_skill_progress (maîtrise par compétence, privée)
    // ---------------------------------------------------------------------
    // Même patron que user_word_progress : auth.uid() = user_id uniquement.
    const skillAnonRead = await api(
      `${url}/rest/v1/user_word_skill_progress?select=*&limit=5`,
      { method: "GET", apikey: anon, token: anon },
    );
    const skillAnonRows = skillAnonRead.status === 200
      ? (JSON.parse(skillAnonRead.body) as Row[]) : null;
    record("Anon ne voit aucune ligne user_word_skill_progress",
      skillAnonRows != null && skillAnonRows.length === 0,
      `status ${skillAnonRead.status}, ${skillAnonRows?.length ?? "—"} ligne(s)`);

    const skillAnonInsert = await api(`${url}/rest/v1/user_word_skill_progress`, {
      method: "POST", apikey: anon, token: anon,
      body: { user_id: userAId, word_id: wordId, skill: "form_to_meaning" },
    });
    record("Anon ne peut pas insérer dans user_word_skill_progress",
      skillAnonInsert.status >= 400, `status ${skillAnonInsert.status}`);

    const skillInsertA = await api(`${url}/rest/v1/user_word_skill_progress`, {
      method: "POST", apikey: anon, token: tokenA,
      body: { user_id: userAId, word_id: wordId, skill: "form_to_meaning", mastery: 25 },
    });
    record("User A peut insérer sa compétence", skillInsertA.status === 201,
      `status ${skillInsertA.status}`);

    const skillReadB = await api(
      `${url}/rest/v1/user_word_skill_progress?select=skill&user_id=eq.${userAId}`,
      { method: "GET", apikey: anon, token: tokenB },
    );
    const skillReadBRows = JSON.parse(skillReadB.body) as Row[];
    record("User B ne voit pas les compétences de User A", skillReadBRows.length === 0,
      `${skillReadBRows.length} ligne(s)`);

    const skillPatchB = await api(
      `${url}/rest/v1/user_word_skill_progress?user_id=eq.${userAId}&word_id=eq.${wordId}&skill=eq.form_to_meaning`,
      { method: "PATCH", apikey: anon, token: tokenB, body: { mastery: 100 } },
    );
    const skillPatched = skillPatchB.body.trim() === ""
      ? [] : (JSON.parse(skillPatchB.body) as Row[]);
    record("User B ne peut pas modifier la compétence de User A (0 ligne)",
      skillPatched.length === 0,
      `${skillPatched.length} ligne(s) (status ${skillPatchB.status})`);

    // ---------------------------------------------------------------------
    // Phase 24E — lesson_sessions (session de leçon, privée par utilisateur)
    // ---------------------------------------------------------------------
    const sessionAnonRead = await api(
      `${url}/rest/v1/lesson_sessions?select=*&limit=5`,
      { method: "GET", apikey: anon, token: anon },
    );
    const sessionAnonRows = sessionAnonRead.status === 200
      ? (JSON.parse(sessionAnonRead.body) as Row[]) : null;
    record("Anon ne voit aucune ligne lesson_sessions",
      sessionAnonRows != null && sessionAnonRows.length === 0,
      `status ${sessionAnonRead.status}, ${sessionAnonRows?.length ?? "—"} ligne(s)`);

    const sessionAnonInsert = await api(`${url}/rest/v1/lesson_sessions`, {
      method: "POST", apikey: anon, token: anon,
      body: { user_id: userAId, lesson_id: lessonId, current_exercise_index: 1 },
    });
    record("Anon ne peut pas insérer dans lesson_sessions",
      sessionAnonInsert.status >= 400, `status ${sessionAnonInsert.status}`);

    const sessionInsertA = await api(`${url}/rest/v1/lesson_sessions`, {
      method: "POST", apikey: anon, token: tokenA,
      body: { user_id: userAId, lesson_id: lessonId, current_exercise_index: 3 },
    });
    record("User A peut insérer sa session", sessionInsertA.status === 201,
      `status ${sessionInsertA.status}`);

    const sessionReadB = await api(
      `${url}/rest/v1/lesson_sessions?select=lesson_id&user_id=eq.${userAId}`,
      { method: "GET", apikey: anon, token: tokenB },
    );
    const sessionReadBRows = JSON.parse(sessionReadB.body) as Row[];
    record("User B ne voit pas la session de User A", sessionReadBRows.length === 0,
      `${sessionReadBRows.length} ligne(s)`);

    const sessionPatchB = await api(
      `${url}/rest/v1/lesson_sessions?user_id=eq.${userAId}`,
      { method: "PATCH", apikey: anon, token: tokenB, body: { current_exercise_index: 99 } },
    );
    const sessionPatched = sessionPatchB.body.trim() === ""
      ? [] : (JSON.parse(sessionPatchB.body) as Row[]);
    record("User B ne peut pas modifier la session de User A (0 ligne)",
      sessionPatched.length === 0,
      `${sessionPatched.length} ligne(s) (status ${sessionPatchB.status})`);

    const sessionDeleteB = await api(
      `${url}/rest/v1/lesson_sessions?user_id=eq.${userAId}`,
      { method: "DELETE", apikey: anon, token: tokenB },
    );
    const sessionDeleted = sessionDeleteB.body.trim() === ""
      ? [] : (JSON.parse(sessionDeleteB.body) as Row[]);
    record("User B ne peut pas supprimer la session de User A (0 ligne)",
      sessionDeleted.length === 0,
      `${sessionDeleted.length} ligne(s) (status ${sessionDeleteB.status})`);
  } finally {
    // Nettoyage : suppression des utilisateurs de test (cascade sur leurs lignes).
    for (const id of createdUserIds) {
      const { status } = await api(`${url}/auth/v1/admin/users/${id}`, {
        method: "DELETE",
        apikey: service,
        token: service,
      });
      console.log(`🧹 user ${id} supprimé (status ${status})`);
    }
  }

  const failed = RESULTS.filter((r) => !r.ok).length;
  console.log(`\n${RESULTS.length - failed}/${RESULTS.length} vérifications RLS passées.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Erreur :", err instanceof Error ? err.message : err);
  process.exit(1);
});
