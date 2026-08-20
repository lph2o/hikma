// Types de base — Hikma.
// Le modèle coranique complet (sourates, versets, mots, occurrences…) sera
// ajouté en Phase 2.

/** Identifiant universel (UUID v4 Supabase). */
export type UUID = string;

/** Date/heure ISO 8601 (type `timestamptz` Supabase). */
export type ISODateString = string;

/** Profil utilisateur Hikma — 1:1 avec un utilisateur Supabase Auth. */
export type Profile = {
  id: UUID;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};
