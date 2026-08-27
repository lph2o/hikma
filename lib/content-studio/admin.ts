// Hikma — Content Studio : garde admin partagée (ADMIN_EMAILS).
// Extraite du pattern app/admin/page.tsx pour éviter la duplication.

export function isAdminEmail(email: string | undefined | null): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (adminEmails.length === 0) return false;
  return adminEmails.includes((email ?? "").toLowerCase());
}
