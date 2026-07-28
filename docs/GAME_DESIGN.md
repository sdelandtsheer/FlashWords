# Conception du jeu

## Déroulement

La partie suit une machine à états :

`fixation → stimulus → blank → input → success/failure → transition`

La fixation dure 600 ms. Le stimulus disparaît avant l'écran vide de 120 ms,
puis le champ apparaît et reçoit le focus. La réponse n'a aucune limite de
temps. Une validation vide ou répétée est ignorée.

Si la fenêtre perd le focus pendant le stimulus, l'essai est annulé, le jeu est
mis en pause et un autre stimulus est choisi à la reprise.

## Niveaux et durée

Le niveau est le nombre de lettres Unicode. Séparateurs et ponctuation sont
exclus ; `œ` compte comme une lettre. La durée normale est
`500 ms + 25 ms × (lettres - 1)`, bornée entre 500 et 1 800 ms. Les vitesses
lente, normale et rapide appliquent 1,25, 1 et 0,8.

Une réussite fait monter d'un niveau. Une erreur fait descendre d'un niveau,
entre 1 et 60.

## Score

Une réussite rapporte `100 + 10 × niveau`. Le bonus de série commence à trois
réussites : 50, 75, 100 puis 125 points à partir de six. Une erreur remet la
série à zéro sans retirer de points.

## Démarrage adaptatif

Le niveau stable est le plus haut niveau récent avec au moins trois essais et
70 % de réussite. Le départ proposé se situe trois niveaux plus bas, jamais
sous 1. Ce calcul reste distinct du niveau instantané.

## Modes

La Partie alimente les records et le niveau stable. L'Entraînement offre plage,
contenu, durée et vitesse personnalisés. Il est conservé dans l'historique mais
exclu des records principaux.
