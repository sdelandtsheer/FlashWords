import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputDir = resolve(projectRoot, 'src/data')
mkdirSync(outputDir, { recursive: true })

const countLetters = (text) => [...text].filter((character) => /\p{L}/u.test(character)).length
const normalize = (text) =>
  text
    .replace(/[’‘]/gu, "'")
    .replace(/œ/giu, 'oe')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('fr-FR')
    .trim()
    .replace(/\s+/gu, ' ')
    .replace(/[\s.!?…,:;]+$/gu, '')

const typeFor = (text) => {
  if (countLetters(text) === 1) return 'letter'
  if (/[.!?…]$/u.test(text)) return 'sentence'
  if (/\s/u.test(text)) return 'group'
  return 'word'
}

const themesFor = (text) => {
  if (/chat|chien|oiseau|lapin|renard|dauphin|animal/iu.test(text)) return ['animaux']
  if (/étoile|lune|planète|ciel|fusée|espace/iu.test(text)) return ['espace']
  if (/école|classe|livre|cahier|science|calcul/iu.test(text)) return ['école']
  if (/arbre|forêt|rivière|pluie|vent|jardin|nature/iu.test(text)) return ['nature']
  if (/ballon|vélo|course|sport|équipe/iu.test(text)) return ['sport']
  if (/musique|guitare|piano|concert|rythme/iu.test(text)) return ['musique']
  return ['quotidien']
}

const words = `
de le la un où oui non mer jeu ami air bus été île lac rue sol thé vie
avec arbre avion balle bateau blanc boîte bruit carte chat chien ciel classe clé cœur
code conte danse école écran étoile fête fleur forêt fruit fusée gare glace idée image
jardin jeu livre lune main maison matin monde musique neige nuit oiseau page piano pluie
porte question radio repas réponse rivière robot route sac science soleil sport table temps
train vélo vent voyage acteur adresse aventure ballon beauté bibliothèque calcul campagne
capitaine cascade chemin chocolat couleur dauphin dessin dimanche énergie équipe famille
fenêtre fromage galaxie guitare histoire horizon humour insecte journal lumière montagne
nuage océan ordinateur planète projet rapide regard renard rythme secret sourire théâtre
tranquille univers victoire village apprendre construire découvrir dessiner écouter explorer
imaginer observer partager préparer raconter réfléchir respirer réussir voyager amusant
brillant calme curieux discret étrange facile fidèle fragile immense joyeux léger moderne
nouveau patient précis prudent rapide solide utile vivant magnifique mystérieux silencieux
ange bain banc bond café camp cerf chez cinq cour doux élan film fort four gris haut kiwi
lion long midi nord ours parc pays peur pont rire rock sauf tard taxi tour vrai
`
  .trim()
  .split(/\s+/u)

const syllables = `
ba be bi bo bu ca ce ci co cu da de di do du fa fe fi fo fu ga ge gi go gu
la le li lo lu ma me mi mo mu na ne ni no nu pa pe pi po pu ra re ri ro ru
sa se si so su ta te ti to tu va ve vi vo vu bra bre bri bro bru cha che chi
cho chu cla cle cli clo clu dra dre dri dro dru fra fre fri fro fru gra gre
gri gro gru pla ple pli plo plu pra pre pri pro pru tra tre tri tro tru
`
  .trim()
  .split(/\s+/u)

const determiners = ['un', 'une', 'le', 'la', 'ce', 'cette', 'mon', 'ton', 'son', 'notre']
const adjectives = [
  'grand',
  'petit',
  'jeune',
  'vieux',
  'beau',
  'joli',
  'bleu',
  'vert',
  'rouge',
  'calme',
  'drôle',
  'rapide',
  'léger',
  'brillant',
  'discret',
  'curieux',
  'solide',
  'étrange',
]
const nouns = [
  'arbre',
  'avion',
  'bateau',
  'ballon',
  'cahier',
  'chat',
  'chemin',
  'chien',
  'ciel',
  'code',
  'écran',
  'étoile',
  'film',
  'forêt',
  'fusée',
  'jardin',
  'jeu',
  'livre',
  'lune',
  'maison',
  'montagne',
  'nuage',
  'océan',
  'oiseau',
  'piano',
  'planète',
  'projet',
  'rivière',
  'robot',
  'route',
  'secret',
  'soleil',
  'train',
  'vélo',
  'village',
  'voyage',
]
const subjects = [
  'Le chat',
  'Le chien',
  'Le renard',
  'Un oiseau',
  'Ma sœur',
  'Mon frère',
  'Notre équipe',
  'La classe',
  'Le robot',
  'Le bateau',
  'Le train',
  'Une étoile',
  'La pluie',
  'Le soleil',
  'La musique',
  'Notre famille',
  'Le professeur',
  'Une scientifique',
  'Le jeune pilote',
  'Mon meilleur ami',
]
const predicates = [
  'observe le ciel',
  'traverse le jardin',
  'prépare son sac',
  'ouvre un livre',
  'écoute la musique',
  'dessine une planète',
  'explore la forêt',
  'suit le chemin',
  'regarde la rivière',
  'invente une histoire',
  'termine son projet',
  'cherche une réponse',
  'découvre un passage',
  'part demain matin',
  'avance sans bruit',
  'attend près du port',
  'joue dans le parc',
  'apprend avec plaisir',
  'partage une bonne idée',
  'admire les étoiles',
]
const endings = [
  '',
  ' ce matin',
  ' après la classe',
  ' avec ses amis',
  ' près de la rivière',
  ' sous un ciel bleu',
  ' pendant le voyage',
  ' dans le grand jardin',
  ' avant le repas',
  ' avec beaucoup de calme',
  ' en prenant le temps de réfléchir',
  ' sans oublier les conseils de la classe',
  ' avec une énergie vraiment impressionnante',
  ' pendant que les autres préparent le matériel',
  ' en suivant attentivement toutes les indications',
  ' avant de retrouver tranquillement toute son équipe',
  ' avec la curiosité nécessaire pour mieux comprendre',
  ' pendant cette nouvelle aventure pleine de surprises',
  ' en gardant toujours le sourire malgré la difficulté',
  ' avant de raconter cette découverte à toute la classe',
  ' avec patience et une grande envie de réussir ensemble',
  ' pendant que la lumière traverse doucement les nuages',
  ' avant que le soleil disparaisse derrière la montagne',
  ' avec ses amis qui observent attentivement le paysage',
]

const candidates = new Map()
const add = (text, forcedType) => {
  const clean = text.replace(/\s+/gu, ' ').trim()
  const count = countLetters(clean)
  if (count < 1 || count > 60) return
  const key = normalize(clean)
  if (!candidates.has(key)) {
    candidates.set(key, {
      text: clean,
      type: forcedType ?? typeFor(clean),
      letterCount: count,
      difficulty: count,
      themes: themesFor(clean),
      enabled: true,
    })
  }
}

for (const letter of 'abcdefghijklmnopqrstuvwxyz') {
  add(letter, 'letter')
  add(letter.toUpperCase(), 'letter')
}
for (const letter of ['é', 'É', 'à', 'À', 'ç', 'Ç', 'ô', 'Ô', 'ù', 'Ù', 'œ', 'Œ'])
  add(letter, 'letter')
for (const syllable of syllables) add(syllable, 'syllable')
for (const word of words) add(word, 'word')

for (const determiner of determiners) {
  for (const noun of nouns) {
    add(`${determiner} ${noun}`, 'group')
    for (const adjective of adjectives) {
      add(`${determiner} ${adjective} ${noun}`, 'group')
      add(`${determiner} ${noun} ${adjective}`, 'group')
    }
  }
}

for (const subject of subjects) {
  for (const predicate of predicates) {
    for (const ending of endings) add(`${subject} ${predicate}${ending}.`, 'sentence')
  }
}

const quotas = new Map(
  Array.from({ length: 60 }, (_, index) => {
    const level = index + 1
    return [level, level === 1 ? 26 : level <= 20 ? 30 : level <= 40 ? 20 : 10]
  }),
)
const byLevel = new Map()
for (const item of candidates.values()) {
  const bucket = byLevel.get(item.letterCount) ?? []
  bucket.push(item)
  byLevel.set(item.letterCount, bucket)
}

const selected = []
for (let level = 1; level <= 60; level += 1) {
  const bucket = byLevel.get(level) ?? []
  const quota = quotas.get(level)
  selected.push(...bucket.slice(0, quota))
  if (bucket.length < quota) {
    console.warn(`Niveau ${level}: ${bucket.length}/${quota} stimuli disponibles`)
  }
}

const counters = new Map()
for (const item of selected) {
  const next = (counters.get(item.type) ?? 0) + 1
  counters.set(item.type, next)
  item.id = `${item.type}_${String(next).padStart(4, '0')}`
}

for (const type of ['letter', 'syllable', 'word', 'group', 'sentence']) {
  const items = selected.filter((item) => item.type === type)
  writeFileSync(resolve(outputDir, `${type}s.json`), `${JSON.stringify(items, null, 2)}\n`, 'utf8')
}

console.log(`Corpus généré: ${selected.length} stimuli.`)
