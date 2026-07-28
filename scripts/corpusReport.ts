import { inspectCorpus, loadCorpus } from './corpusUtils'

const corpus = loadCorpus()
console.log(`Total: ${corpus.length} stimuli`)
console.log('\nPar type:')
for (const type of ['letter', 'syllable', 'word', 'group', 'sentence']) {
  console.log(`- ${type}: ${corpus.filter((item) => item.type === type).length}`)
}
console.log('\nPar niveau:')
for (let level = 1; level <= 60; level += 1) {
  console.log(
    `- ${String(level).padStart(2, '0')}: ${corpus.filter((item) => item.letterCount === level).length}`,
  )
}
const issues = inspectCorpus(corpus)
console.log(`\nErreurs: ${issues.filter((issue) => issue.severity === 'error').length}`)
console.log(`Avertissements: ${issues.filter((issue) => issue.severity === 'warning').length}`)
