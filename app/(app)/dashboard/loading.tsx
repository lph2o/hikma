import { PageLoading } from "@/components/ui/page-loading";

/**
 * Loading du dashboard (Phase 92) : wordmark animé cohérent avec le reste de
 * l'app. Les squelettes statiques antérieurs n'étaient pas perçus comme un
 * feedback de chargement (retour utilisateur).
 */
export default function DashboardLoading() {
  return <PageLoading />;
}
