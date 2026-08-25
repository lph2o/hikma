import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BodyMedium, Caption } from "@/components/ui/typography";
import type { ReminderDecision } from "@/lib/learning/reminders";

export type ReminderBannerProps = {
  decision: ReminderDecision;
};

/**
 * Bannière de rappel in-app pour le Dashboard (Phase 80).
 *
 * Discrète, secondaire par rapport au TodayCard.
 * N'utilise aucune animation agressive.
 * Accessible : section aria-labelledby, vrai Link pour le CTA.
 */
export function ReminderBanner({ decision }: ReminderBannerProps) {
  if (!decision.show || !decision.content) return null;

  const { title, message, cta, href } = decision.content;

  return (
    <section aria-labelledby="reminder-title">
      <Card className="border-primary/15 bg-surface-elevated">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex min-w-0 flex-col gap-1">
            <BodyMedium id="reminder-title" className="font-semibold">
              {title}
            </BodyMedium>
            <Caption className="text-text-secondary">{message}</Caption>
          </div>
          <Button
            render={<Link href={href} />}
            variant="outline"
            size="sm"
            className="shrink-0"
          >
            {cta}
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}