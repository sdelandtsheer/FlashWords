# FlashWords

FlashWords est un jeu Web éducatif en français qui entraîne la reconnaissance
visuelle rapide, la mémoire immédiate et la restitution orthographique. Un
stimulus apparaît brièvement, disparaît, puis le joueur le retape.

L'application fonctionne entièrement dans le navigateur, sans serveur, compte
ni suivi en ligne. Les réglages et les résultats restent dans `localStorage`.

## Installation

Prérequis : Node.js 20.19 ou plus récent.

```bash
npm install
npm run dev
```

Pour une construction de production :

```bash
npm run build
npm run preview
```

## Qualité et tests

```bash
npm test
npm run test:coverage
npm run lint
npm run format:check
npm run typecheck
npm run validate
```

`npm run build` exécute la validation complète avant de produire `dist/`. La CI
répète lint, tests, validation du corpus, typage et construction.

## Règles

Une partie compte 20 essais par défaut. Une bonne réponse augmente le niveau ;
une erreur le diminue, sans jamais passer sous 1. Le niveau correspond au
nombre de lettres. Espaces, apostrophes, traits d'union et ponctuation ne
comptent pas.

Les majuscules et accents sont ignorés, contrairement aux véritables lettres
manquantes, ajoutées ou incorrectes. Touches disponibles :

- `Entrée` : valider ;
- `Échap` : pause ;
- `F` : plein écran ;
- `M` : couper ou réactiver le son.

L'Entraînement permet de choisir plage, contenu, durée et vitesse. Ses résultats
n'altèrent ni le record ni le niveau stable de la Partie.

## Structure

- `src/components/` : expérience de jeu ;
- `src/game/` : règles pures et machine à états ;
- `src/data/` : corpus JSON ;
- `src/services/` : audio, voix, stockage et plein écran ;
- `scripts/` : génération, validation et rapport du corpus ;
- `tests/` : logique, composants et stockage ;
- `docs/` : conception et guide éditorial ;
- `legacy/` : prototype Tkinter historique.

## Corpus

Le corpus contient 1 196 stimuli originaux et couvre les niveaux 1 à 60.

```json
{
  "id": "word_0001",
  "text": "château",
  "type": "word",
  "letterCount": 7,
  "difficulty": 7,
  "themes": ["quotidien"],
  "enabled": true
}
```

Pour modifier le contenu, consulter
[`docs/CORPUS_GUIDE.md`](docs/CORPUS_GUIDE.md), éditer les listes de
`scripts/generateCorpus.mjs`, puis lancer :

```bash
npm run generate:corpus
npm run validate:corpus
npm run report:corpus
```

## Voix, sons et données

Les sons sont synthétisés avec Web Audio. Après une erreur,
`SpeechSynthesisUtterance` choisit de préférence une voix `fr-FR`. L'absence de
voix ou un refus du navigateur ne bloque jamais la partie.

Les 100 dernières sessions et les réglages sont stockés localement. L'écran
Résultats permet l'export JSON et l'effacement explicite. Si `localStorage` est
indisponible, le jeu continue avec des valeurs par défaut.
