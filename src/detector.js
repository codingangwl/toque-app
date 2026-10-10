const REGLAS = {
ofensivo: /\b(mierda+s?|idiota+s?|imb[eé]cil(es)?|hijueputa+s?|malparid[oa]+s?)\b/i,
  discriminatorio: /\bnegro\s+(in[uú]til|de mierda|asqueroso)\b/i,
  spam: /(?=[\s\S]*(https?:\/\/|www\.|\b[\w-]+\.(com|net|org|co)\b))(?=[\s\S]*(seguidores|click|clic|gana(r)? dinero))/i,
};

export function analyzeReview(texto) {
  const motivos = Object.entries(REGLAS)
    .filter(([, regex]) => regex.test(texto))
    .map(([categoria]) => categoria);

  return { flagged: motivos.length > 0, motivos };
}