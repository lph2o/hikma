import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Mascot } from "@/components/ui/mascot";
import { Progress } from "@/components/ui/progress";
import { BodyMedium, Caption, H1 } from "@/components/ui/typography";
import { getLearningContext, getPathIdByUnitSlug } from "@/lib/learning/queries";
import { createClient } from "@/lib/supabase/server";
import {
  LessonProgressBar,
  LessonStatusBadge,
  LessonStatusIcon,
} from "@/components/learn/lesson-status";

export const dynamic = "force-dynamic";

export default async function UnitPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  // L'unité est résolue GLOBALEMENT par son slug (toutes sourates confondues) :
  // une unité d'Al-ʿAṣr n'est plus introuvable parce que le parcours actif
  // par défaut était Al-Fātiḥah.
  const pathId = await getPathIdByUnitSlug(client, slug);
  if (!pathId) notFound();

  const ctx = await getLearningContext(client, user?.id ?? null, { pathId });

  if (!ctx.curriculum) notFound();

  const unit = ctx.curriculum.units.find((u) => u.slug === slug);
  if (!unit) notFound();

  const lessons = unit.lessons;
  const completed = lessons.filter(
    (l) => ctx.lessonStatuses.get(l.id) === "COMPLETED",
  ).length;
  const percent = lessons.length > 0 ? Math.round((completed / lessons.length) * 100) : 0;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <Link href="/learn" className="text-sm text-muted-foreground hover:underline">
          ← Parcours
        </Link>
        <Caption>{ctx.curriculum.path.title}</Caption>
        <H1>{unit.title}</H1>
        {unit.description ? (
          <BodyMedium className="text-muted-foreground">{unit.description}</BodyMedium>
        ) : null}

        <div className="flex flex-col gap-2 pt-2">
          <div className="flex items-center justify-between">
            <Caption>Progression de l&apos;unité</Caption>
            <Caption>
              {completed} / {lessons.length} leçons
            </Caption>
          </div>
          <Progress value={percent} aria-label="Progression de l'unité" />
        </div>
      </header>

      {lessons.length === 0 ? (
        <Card className="items-center gap-4 p-8 text-center">
          <Mascot variant="learn" size="lg" message="Aucune leçon ici" />
          <BodyMedium className="text-muted-foreground">
            Cette unité ne contient pas encore de leçon publiée.
          </BodyMedium>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {lessons.map((lesson) => {
            const status = ctx.lessonStatuses.get(lesson.id) ?? "LOCKED";
            const isLocked = status === "LOCKED";
            const wordIds = ctx.lessonWordMap.get(lesson.id) ?? [];
            const progressRows = wordIds
              .map((id) => ctx.progressByWord.get(id))
              .filter((row): row is NonNullable<typeof row> => row != null);
            return (
              <Link
                key={lesson.id}
                href={isLocked ? "#" : `/learn/${lesson.slug}`}
                aria-disabled={isLocked}
                tabIndex={isLocked ? -1 : undefined}
                className={isLocked ? "pointer-events-none" : "group"}
              >
                <Card className="flex-row items-center justify-between gap-4 p-4 transition-shadow group-hover:shadow-md">
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <LessonStatusIcon status={status} />
                      <BodyMedium className="font-semibold">{lesson.title}</BodyMedium>
                    </div>
                    <Caption>{lesson.objective ?? lesson.description}</Caption>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <LessonStatusBadge status={status} />
                    <LessonProgressBar progressRows={progressRows} />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
