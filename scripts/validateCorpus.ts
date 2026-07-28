import { inspectCorpus, loadCorpus } from './corpusUtils'

const issues = inspectCorpus(loadCorpus())
for (const issue of issues) console[issue.severity === 'error' ? 'error' : 'warn'](issue.message)

const errors = issues.filter((issue) => issue.severity === 'error')
if (errors.length > 0) {
  console.error(`Validation échouée: ${errors.length} erreur(s) bloquante(s).`)
  process.exitCode = 1
} else {
  console.log('Corpus valide: aucune erreur bloquante.')
}
