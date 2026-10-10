import { analyzeReview } from './detector.js';

// format: [text, shouldFlag (true/false), why]
const cases = [
  // — should flag (true) —
  ['Eres un idiota y el lugar es una mierda', true, 'direct insult'],
  ['El mesero es un negro inútil', true, 'racial discrimination'],
  ['COMPRA SEGUIDORES BARATOS click aqui www.fake.com', true, 'spam with link'],
  ['Esto es una mierdaaaaa', true, 'insult with repeated letters'],
  ['IDIOTAAA el servicio', true, 'insult in caps + repeated'],
  ['Puros malparidos atendiendo', true, 'insult (variant)'],
  ['jajaja que negro asqueroso ese mesero', true, 'discrimination (different word order)'],

  // — should NOT flag (false) —
  ['Excelente atención, la comida llegó rápido', false, 'normal positive review'],
  ['Estuvo regular, nada especial', false, 'neutral review'],
  ['Great coffee, fast wifi, will come back', false, 'normal English review'],
  ['Me encantó, vean el menú en toque.com', false, "mentions the business's own site"],
  ['Visítenos también en www.nuestracafeteria.com para reservas', false, "business's own link"],
  ['El mesero era negro y muy amable', false, 'mentions race without insult'],
  ['Nada que decir, comimos bien', false, 'short neutral review'],
  ['Un amigo me recomendó este lugar por Instagram', false, 'mentions social media, no link'],
];

let correct = 0;
const falsePositives = [];
const falseNegatives = [];

cases.forEach(([text, expected, reason]) => {
  const result = analyzeReview(text).flagged;
  const ok = result === expected;
  if (ok) {
    correct++;
  } else if (result && !expected) {
    falsePositives.push({ text, reason });
  } else {
    falseNegatives.push({ text, reason });
  }
});

console.log(`Score: ${correct}/${cases.length}`);
console.log('\nFALSE POSITIVES (flagged something it shouldn\'t have):');
falsePositives.forEach((c) => console.log(`  - "${c.text}" (${c.reason})`));
console.log('\nFALSE NEGATIVES (missed something it should have flagged):');
falseNegatives.forEach((c) => console.log(`  - "${c.text}" (${c.reason})`));