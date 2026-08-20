# Hikma logo usage

## Source

Le logo officiel est `public/logo/logo_hikma.png`. Il contient le mot-symbole, l’emblème arabe et la signature française, avec une transparence et une zone de respiration intégrées. Il est rendu par `components/ui/hikma-logo.tsx` afin de centraliser son alt text, ses dimensions et son usage `next/image`.

## Usages validés

- Utiliser le composant `HikmaLogo` dans la landing, la navigation, l’authentification et le Design System Lab.
- Conserver ses proportions (`object-contain`) et ne pas recadrer le PNG.
- Utiliser `sm`, `md` ou `lg` selon le contexte ; réduire l’espace du layout, pas l’image par une déformation.
- Sur un fond sombre, placer le logo sur une surface ivoire comme dans le laboratoire, afin de préserver la lisibilité du wordmark.

## À éviter

- Ne pas recolorer, étirer, retourner ou superposer le logo à un fond chargé.
- Ne pas utiliser le PNG complet comme favicon : sa signature et son espace transparent le rendent inadapté à une très petite taille. La création d’un favicon dédié est une décision ultérieure.
- Ne pas recréer le logo avec du texte ou une seconde illustration.
