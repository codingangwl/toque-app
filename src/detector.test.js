import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeReview } from './detector.js';

// format: [text, expected motivos, why, options?]
const cases = [
  // — ofensivo —
  ['Eres un idiota y el lugar es una mierda', ['ofensivo'], 'direct insult'],
  ['Esto es una mierdaaaaa', ['vulgar'], 'profanity with repeated letters'],
  ['IDIOTAAA el servicio', ['ofensivo'], 'insult in caps + repeated'],
  ['Puros malparidos atendiendo', ['ofensivo'], 'Colombian insult, plural'],
  ['Eres un estúpido, pendejo', ['ofensivo'], 'common insults'],
  ['Qué mesero tan hp', ['ofensivo'], 'hp abbreviation'],
  ['h.p ese cajero', ['ofensivo'], 'h.p with dot'],
  ['Hijo de puta el administrador', ['ofensivo'], 'hijo de puta (no duplicate vulgar chip)'],
  ['Jueputa, qué servicio tan malo', ['ofensivo'], 'jueputa variant'],
  ['Esa cajera es una gonorrea', ['ofensivo'], 'gonorrea (double r)'],
  ['m1erda de lugar, el dueño es un 1diota', ['ofensivo'], 'leet spelling'],
  ['IMBÉCIL', ['ofensivo'], 'accented caps'],
  ['The waiter was a stupid moron', ['ofensivo'], 'English insult'],

  // — discriminatorio —
  ['El mesero es un negro inútil', ['discriminatorio'], 'racial discrimination'],
  ['jajaja que negro asqueroso ese mesero', ['discriminatorio'], 'group word then derogatory'],
  ['Asqueroso negro el que atiende', ['discriminatorio'], 'derogatory then group word'],
  ['Qué mesera tan negra inútil', ['discriminatorio'], 'feminine'],
  ['Los negros inútiles de la cocina', ['discriminatorio'], 'plural'],
  ['Negro de mierda', ['discriminatorio'], 'with profanity'],
  ['Tenía que ser venezolano', ['discriminatorio'], '"tenía que ser" pattern'],
  ['Puro veneco trabajando ahí', ['discriminatorio'], 'xenophobic slur alone'],
  ['El mesero es un negro hijueputa', ['ofensivo', 'discriminatorio'], 'both categories'],

  // — spam —
  ['COMPRA SEGUIDORES BARATOS click aqui www.fake.com', ['spam'], 'spam with link'],
  ['Gana dinero fácil escribe al wa.me/573001234567', ['spam'], 'WhatsApp link'],
  ['FOLLOWERS cheap, free, at bit.ly/xyz', ['spam'], 'English spam + shortener'],
  ['Escríbeme al WhatsApp 300 123 4567 y te explico', ['spam'], 'phone number + contact keyword'],
  ['Inversión en cripto con ganancias diarias: https://cripto-ya.vip', ['spam'], 'crypto scam link'],
  ['Compra likes para tu negocio', ['spam'], 'strong spam phrase, no link'],

  // — should NOT flag —
  ['Excelente atención, la comida llegó rápido', [], 'normal positive review'],
  ['Estuvo regular, nada especial', [], 'neutral review'],
  ['Great coffee, fast wifi, will come back', [], 'normal English review'],
  ['Me encantó, vean el menú en toque.com', [], "mentions the business's own site"],
  ['Visítenos también en www.nuestracafeteria.com para reservas', [], "business's own link"],
  ['El mesero era negro y muy amable', [], 'mentions race without insult'],
  ['Nada que decir, comimos bien', [], 'short neutral review'],
  ['Un amigo me recomendó este lugar por Instagram', [], 'mentions social media, no link'],
  ['El café negro estaba asqueroso, frío', [], '"negro" describing coffee'],
  ['La comida india muy sucia, no vuelvo', [], '"india" describing food'],
  ['El portero no me dejó entrar por ser negro', [], 'complaint ABOUT discrimination (reply, not report)'],
  ['El mesero era negro, la comida asquerosa', [], 'race and complaint in separate clauses'],
  ['Estaba rico.Comí bien y el clic del datáfono funcionó', [], 'missing space after period is not a domain'],
  ['Qué chimba de lugar, todo delicioso', [], '"chimba" is positive in Colombia'],
  ['El pedido llegó retrasado y frío', [], 'complaint words are not insults'],
  ['Pedí por rappi.com y el domicilio fue gratis', [], 'delivery platform link'],
  ['Llamé al 300 123 4567 y nadie contestó', [], 'phone number without spam keyword'],
  ['Me dieron ganas de volver, pásense por toque.co', [], '"ganas" is not "ganar"'],
  ['Sigan a @toque, ya tienen 10k seguidores, toque.co', [], 'business promotes itself', { ownDomains: ['toque.co'] }],
  ['No es una mierda como dicen, me encantó', [], 'profanity in a 5-star review', { rating: 5 }],
  ['Este lugar es una mierda', ['vulgar'], 'profanity in a 1-star review', { rating: 1 }],
];

for (const [text, expected, reason, options] of cases) {
  test(`${reason}: "${text}"`, () => {
    const result = analyzeReview(text, options);
    assert.deepEqual(result.motivos, expected);
    assert.equal(result.flagged, expected.length > 0);
  });
}

test('handles missing text', () => {
  assert.deepEqual(analyzeReview(undefined), { flagged: false, motivos: [] });
  assert.deepEqual(analyzeReview(null), { flagged: false, motivos: [] });
});
