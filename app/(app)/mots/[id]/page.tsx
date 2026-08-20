import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArabicText } from "@/components/ui/arabic-text";
import { BodyMedium, Caption, H2 } from "@/components/ui/typography";
import { WordOccurrences } from "@/components/learn/word-occurrences";
import { getWordDetail } from "@/lib/learning/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function WordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await createClient();
  const detail = await getWordDetail(client, id);
  if (!detail) notFound();

  const {
    word,
    meaning,
    translationSource,
    isValidated,
    lessons,
    totalOccurrences,
    occurrences,
  } = detail;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <Link href="/learn" className="text-sm text-muted-foreground hover:underline">
        ← Parcours
      </Link>

      <header className="flex flex-col items-center gap-2 text-center">
        <ArabicText className="text-h1 font-normal">{word.arabic}</ArabicText>
        <Caption>Fiche mot</Caption>
        {word.transliteration ? (
          <Caption className="text-muted-foreground">{word.transliteration}</Caption>
        ) : null}
        {meaning.text ? (
          <div className="flex flex-col items-center gap-1">
            <BodyMedium className="font-medium">{meaning.text}</BodyMedium>
            {isValidated ? (
              <Badge variant="success">Sens français validé</Badge>
            ) : (
              <Badge variant="secondary">Sens mot à mot en anglais — FR en préparation</Badge>
            )}
            {isValidated && translationSource ? (
              <Caption className="text-muted-foreground">Source : {translationSource}</Caption>
            ) : null}
          </div>
        ) : (
          <Badge variant="outline">Aucun sens lexical disponible</Badge>
        )}
      </header>

      {/* Leçons où le mot apparaît (données réelles) */}
      <Card>
        <CardContent className="gap-3 p-5">
          <H2>Leçons associées</H2>
          {lessons.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {lessons.map((lesson) => (
                <li key={lesson.lessonId}>
                  <Link
                    href={`/learn/${lesson.slug}`}
                    className="group flex items-center justify-between rounded-lg border border-border px-3 py-2 transition-colors hover:border-primary/40 hover:bg-accent/50"
                  >
                    <span className="text-sm font-medium group-hover:underline">
                      {lesson.title}
                    </span>
                    <Caption className="text-muted-foreground">{lesson.unitTitle}</Caption>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <BodyMedium className="text-muted-foreground">
              Ce mot n&apos;apparaît encore dans aucune leçon.
            </BodyMedium>
          )}
        </CardContent>
      </Card>

      {/* Occurrences coraniques (avec contexte FR réel) */}
      <Card>
        <CardContent className="gap-4 p-5">
          <H2>Occurrences dans le Coran</H2>
          <WordOccurrences
            wordId={word.id}
            totalOccurrences={totalOccurrences}
            initial={occurrences}
          />
        </CardContent>
      </Card>
    </main>
  );
}
