# Hikma color system

## Brand tokens

Les valeurs canoniques sont définies dans `app/globals.css` et consommées par les composants via les tokens CSS/Tailwind.

### Teal → doré → neutres chauds

| Token | Valeur | Rôle |
| --- | --- | --- |
| `--hikma-ivory` | `#F8F8F0` | background global |
| `--hikma-cream` | `#FFFDF8` | surface blanche chaude |
| `--surface-subtle` | `#F1F6F3` | surface teal très douce |
| `--hikma-teal-100` | `#DDEDEA` | interaction teal douce |
| `--hikma-gold` | `#C8A058` | valeur, progression, distinction |
| `--hikma-gold-muted` | `#B89050` | détails et contexte sombre |
| `--hikma-gold-bright` | `#F0D090` | accent lumineux ponctuel |

| Token | Valeur | Rôle |
| --- | --- | --- |
| `--hikma-teal-950` | `#001820` | profondeur exceptionnelle |
| `--hikma-teal-900` | `#002828` | surfaces principales |
| `--hikma-teal-800` | `#083838` | navigation et actions |
| `--hikma-teal-700` | `#0B5552` | accent lisible / focus |
| `--hikma-teal-600` | `#16706A` | variantes secondaires |
| `--hikma-teal-500` | `#2A887A` | détails non textuels |
| `--hikma-teal-100` | `#DDEDEA` | surface interactive douce |
| `--hikma-gold` | `#C8A058` | accent premium rare |
| `--hikma-gold-muted` | `#B89050` | détail et contexte sombre |
| `--hikma-gold-bright` | `#F0D090` | accent sur fond sombre |
| `--hikma-ivory` | `#F8F8F0` | fond éditorial |
| `--hikma-cream` | `#FFFDF8` | surface de lecture chaude |
| `--hikma-charcoal` | `#182028` | texte et foreground |
| `--hikma-charcoal-deep` | `#102020` | contraste sombre |

## Semantic usage

Les alias existants (`background`, `surface`, `text-primary`, `border`, `primary`, `focus`) restent la couche de consommation des écrans. Les couleurs fonctionnelles ne sont pas remplacées : elles conservent leur rôle pour les réponses correctes, erreurs, avertissements et informations.

Le mode sombre utilise des surfaces teal/charcoal distinctes et des variantes de texte claires ; aucune inversion automatique ne doit altérer le texte arabe.

## Contrast reference

Contrastes calculés pour les combinaisons principales : blanc sur teal 900 `15.74:1`, ivoire sur teal 900 `14.75:1`, blanc sur teal 800 `12.86:1`, charbon sur or `6.76:1`, charbon sur or clair `11.07:1`, charbon sur ivoire `15.42:1`, teal 700 sur ivoire `8.08:1`, or atténué sur charbon `5.60:1`. Les variantes `*_text` restent destinées au texte courant.

L’or ne doit pas être utilisé comme seule indication d’un état et ne doit pas devenir la couleur dominante des paragraphes.
