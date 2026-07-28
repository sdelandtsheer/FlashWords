# Guide du corpus

## Ton et contenu

Le contenu vise un enfant francophone d'environ 12 ans. Il doit être naturel,
correct, compréhensible, moderne et jamais infantilisant.

Thèmes adaptés : école, animaux, sciences, espace, nature, sport, musique,
technologie, famille, amis, voyage et quotidien.

Sont exclus : politique, religion, sexualité, violence graphique, publicité,
marques indispensables, humiliation, diagnostic médical et texte protégé
recopié.

## Types

- `letter` : lettre isolée ;
- `syllable` : syllabe française utile ;
- `word` : mot accessible ;
- `group` : groupe de mots naturel ;
- `sentence` : phrase originale ponctuée.

## Longueur

`letterCount` et `difficulty` indiquent le nombre de lettres Unicode. Espaces,
apostrophes, traits d'union, chiffres et ponctuation sont ignorés. Les accents
restent des lettres et `œ` vaut une lettre.

`arc-en-ciel` compte donc 9 lettres (`3 + 2 + 4`), conformément à la règle qui
exclut le trait d'union.

## Validation

Les identifiants sont stables et uniques. Deux textes équivalents après
normalisation sont des doublons.

1. Modifier `scripts/generateCorpus.mjs`.
2. Lancer `npm run generate:corpus`.
3. Lancer `npm run validate:corpus`.
4. Examiner `npm run report:corpus`.
5. Relire manuellement les nouvelles phrases.
6. Lancer `npm run validate`.

La génération est uniquement un outil de développement. Le jeu ne génère
jamais de contenu pendant une partie.
