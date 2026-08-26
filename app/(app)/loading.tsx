import { PageLoading } from "@/components/ui/page-loading";

/**
 * Loading du groupe applicatif (Phase 92) : feedback wordmark cohérent pour
 * les navigations de l'app. Le skeleton générique antérieur n'était pas
 * page-spécifique ; le loader page-spécifique du dashboard
 * (app/(app)/dashboard/loading.tsx) est conservé tel quel.
 */
export default function AppLoading() {
  return <PageLoading />;
}
