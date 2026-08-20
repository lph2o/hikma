# Accessibilité

- arabe isolé avec `lang="ar"`, direction locale et `ArabicText` ;
- boutons et audio nommés, cibles d’au moins 44 px ;
- focus visible et ordre clavier cohérent ;
- résultat annoncé sans dépendre de la couleur ;
- états d’erreur et de disponibilité compréhensibles ;
- progression annoncée avec un libellé humain et une zone de shell nommée ;
- feedback séparé dans une région nommée, avec icône et texte plutôt que la couleur seule ;
- animation réduite avec `prefers-reduced-motion` ;
- contraste AA sur surfaces warm et variantes `*_text`.
- disclosure `Comprendre pourquoi` pilotable au clavier avec `aria-expanded` /
  `aria-controls` ; l’ouverture ne dépend jamais de la couleur ;
- le contenu arabe de l’explication reste dans `ArabicText`, avec ses
  diacritiques, son RTL local et son interligne Amiri ;
- `prefers-reduced-motion` désactive la transition de disclosure sans masquer
  le contenu.
