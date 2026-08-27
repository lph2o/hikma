// Hikma — Content Studio (UI1) : GRILLE DE CONTENUS.
//
// Grille responsive de cartes de production (1 → 4 colonnes selon l'écran).
// Aucun overflow horizontal global : les cartes s'empilent, elles ne débordent
// jamais. Server-safe.

import { ContentCard, type ContentCardData } from "./content-card";

export function ContentGrid({ items }: { items: ContentCardData[] }) {
  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((data, i) => (
        <ContentCard key={`${data.href}-${i}`} data={data} />
      ))}
    </div>
  );
}
