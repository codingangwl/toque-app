// All word rules run against normalized text (see normalize): lowercase, no accents,
// leet undone ("m1erda" -> "mierda") and repeated letters collapsed ("mierdaaa" -> "mierda").
// That's why every pattern below is written without accents and without double letters
// ("gonorrea" -> "gonorea", "followers" -> "folowers").

const INSULTS = [
  'idiotas?', 'idiots?', 'imbecil(?:es)?', 'estupid[oa]s?', 'stupid', 'pendej[oa]s?', 'tarad[oa]s?',
  'mongolic[oa]s?', 'malparid[oa]s?', 'gonoreas?', 'pirob[oa]s?', 'care(?:verga|chimba|monda)s?',
  '(?:hij[ou]e?|jue)put[ao]s?', 'hij[oa]s?\\s+de\\s+put[ao]s?', 'h[\\s.-]?p(?:ta)?s?', 'hdp',
  '(?:hu|gu|w)e[bv]on(?:a|as|es)?', 'morons?', 'ashole?s?', 'bitch(?:es)?', 'dumbas',
];

const VULGAR = ['mierdas?', 'put[ao]s?', 'vergas?', 'shit\\w*', 'fuck\\w*'];

// Slurs that are discriminatory on their own.
const SLURS = ['venec[oa]s?', 'sudacas?', 'maricon(?:a|as|es)?', 'nigas?', 'nigers?', 'fagots?', 'fags?'];

// Neutral words for a group of people: only flagged next to something derogatory.
const GROUPS = [
  'negr[oa]s?', 'indi[oa]s?', 'venezolan[oa]s?', 'costen[oa]s?', 'gays?', 'lesbianas?', 'travestis?',
];

// "café negro", "comida india"... the group word describes a thing, not a person.
const NOT_PEOPLE = [
  'cafe', 'tinto', 'te', 'arroz', 'frijol(?:es)?', 'pan', 'chocolate', 'ajo', 'cerveza', 'mora',
  'salsa', 'comida', 'cocina', 'restaurante', 'platos?', 'sabor', 'color', 'camis(?:a|eta)s?',
  'ropa', 'pantalon(?:es)?', 'uniformes?', 'delantal(?:es)?', 'mesas?', 'sillas?', 'pared(?:es)?', 'humor',
];

const DEROGATORY = [
  ...INSULTS, ...VULGAR,
  'inutil(?:es)?', 'asqueros[oa]s?', 'suci[oa]s?', 'cochin[oa]s?', 'mugros[oa]s?', 'ignorantes?',
  'brut[oa]s?', 'lacras?', 'plagas?', 'basuras?', 'animal(?:es)?', 'simios?', 'micos?', 'ratas?',
  'tenian?\\s+que\\s+ser',
];

// Words allowed between the group word and the derogatory one: "negro tan inútil", "asqueroso ese negro".
const FILLERS = [
  'tan', 'muy', 'mas', 'tod[oa]s?', 'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'es[ae]', 'es[oa]s',
  'est[ea]', 'est[oa]s', 'y', 'de', 'bien', 're', 'super', 'tremend[oa]s?', 'pur[oa]s?',
];

// Need a link or phone number next to them to count as spam ("gratis" alone is fine).
const SPAM_KEYWORDS = [
  'seguidores', 'folowers', 'likes', 'suscriptores', 'click', 'clic', 'clik', 'gratis', 'fre',
  'promo(?:cion)?', 'ganar?', 'dinero', 'bitcoin', 'cripto\\w*', 'crypto\\w*',
  'inver(?:sion|siones|tir|te)', 'casino', 'apuestas?', 'prestamos?', 'whatsap', 'telegram',
  'escrib(?:eme|enos|ime)', 'contact(?:ame|anos)',
];

// Spam even without a link.
const STRONG_SPAM = [
  '(?:compr|vend)(?:a|o|e|ar|emos|amos)?\\s+(?:seguidores|folowers|likes|resenas|suscriptores)',
  'seguidores\\s+(?:baratos|gratis|reales)', 'ganar?\\s+(?:dinero|plata)', '(?:dinero|plata)\\s+facil',
  '(?:buy|fre)\\s+folowers', 'trabaja\\s+desde\\s+(?:tu\\s+)?casa',
];

const TLDS = 'com|net|org|co|io|ly|me|info|biz|xyz|site|online|shop|store|top|club|link|click|app|ws|gg|tk|ml|us|es|mx|ve|gd|ee|at|cc|tv|live|vip|bet|win|lat';

// Links to these are normal in a restaurant review ("pedí por rappi.com").
const SAFE_DOMAINS = ['google.com', 'rappi.com', 'rappi.com.co', 'tripadvisor.com', 'tripadvisor.co'];

const alt = (list) => `(?:${list.join('|')})`;
const words = (list) => new RegExp(`\\b${alt(list)}\\b`);

const GROUP = `(?<!\\b${alt(NOT_PEOPLE)}\\W+)\\b${alt(GROUPS)}\\b`;
const DEROG = `\\b${alt(DEROGATORY)}\\b`;
const GAP = `(?:\\W+${alt(FILLERS)}\\b){0,2}\\W+`;

const RULES = {
  ofensivo: words(INSULTS),
  discriminatorio: new RegExp(`\\b${alt(SLURS)}\\b|${GROUP}${GAP}${DEROG}|${DEROG}${GAP}${GROUP}`),
  vulgar: words(VULGAR),
  spamKeyword: words(SPAM_KEYWORDS),
  strongSpam: words(STRONG_SPAM),
};

const HOST = new RegExp(`(?:https?:\\/\\/)?((?:[a-z0-9-]+\\.)+(?:${TLDS}))(?![a-z0-9-])`, 'g');
const URL_HOST = /https?:\/\/([^\s/?#]+)/g;
const PHONE = /(?<!\d)(?:\+?57[\s.-]?)?3\d{2}[\s.-]?\d{3}[\s.-]?\d{4}(?!\d)|\+\d{1,3}[\s.-]?\d(?:[\s.-]?\d){7,}/;
// "rico.Comí" is a missing space after a period, not the domain "rico.com".
const GLUED_SENTENCE = /(\p{Ll})\.(\p{Lu}\p{Ll})/gu;

const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's' };

const fold = (text) => String(text ?? '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

export function normalize(text) {
  return fold(text)
    .replace(/[013457@$](?=[a-z])|(?<=[a-z])[013457@$]/g, (c) => LEET[c])
    .replace(/(?<=[a-z])[!|](?=[a-z])/g, 'i')
    .replace(/([a-z])\1+/g, '$1');
}

const bareHost = (host) => host.replace(/^www\./, '');

function isSpam(text, normalized, ownDomains) {
  if (RULES.strongSpam.test(normalized)) return true;
  if (!RULES.spamKeyword.test(normalized)) return false;

  const plain = fold(String(text ?? '').replace(GLUED_SENTENCE, '$1. $2'));
  const trusted = [...SAFE_DOMAINS, ...ownDomains].map((d) => bareHost(fold(d)));
  const hosts = [...plain.matchAll(HOST), ...plain.matchAll(URL_HOST)].map((m) => bareHost(m[1]));
  const hasForeignLink = hosts.some((h) => !trusted.some((d) => h === d || h.endsWith(`.${d}`)));

  return hasForeignLink || PHONE.test(plain);
}

/**
 * @param {string} text
 * @param {{ rating?: number | null, ownDomains?: string[] }} [options]
 *   rating: profanity in a 4-5 star review ("no es una mierda como dicen") is not flagged.
 *   ownDomains: the business's own sites, never counted as spam links.
 */
export function analyzeReview(text, { rating = null, ownDomains = [] } = {}) {
  const normalized = normalize(text);
  const motivos = [];

  if (RULES.ofensivo.test(normalized)) motivos.push('ofensivo');
  if (RULES.discriminatorio.test(normalized)) motivos.push('discriminatorio');
  if (isSpam(text, normalized, ownDomains)) motivos.push('spam');
  if (motivos.length === 0 && RULES.vulgar.test(normalized) && !(rating >= 4)) motivos.push('vulgar');

  return { flagged: motivos.length > 0, motivos };
}
