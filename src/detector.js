const REGLAS = {
  ofensivo: /\b(mierda|idiota|imb[eé]cil|hijueputa|malparid[oa])\b/i,
  discriminatorio: /\bnegro\s+(in[uú]til|de mierda|asqueroso)\b/i,
  spam: /(https?:\/\/|www\.|\.com\b)/i,
};

export function analizarResena(texto) {
  const motivos = Object.entries(REGLAS)
    .filter(([, regex]) => regex.test(texto))
    .map(([categoria]) => categoria);

  return { flagged: motivos.length > 0, motivos };
}