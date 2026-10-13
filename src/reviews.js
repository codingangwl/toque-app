import { analyzeReview } from './detector.js';
import { BUSINESS, REPLY_MAX_RATING } from './config.js';

// Throws on network/format errors so the UI can tell "failed to load" apart from "no reviews".
export async function loadReviews() {
  const result = await fetch('/data/reviews.json');
  if (!result.ok) throw new Error(`Error HTTP ${result.status}`);

  const reviews = await result.json();
  if (!Array.isArray(reviews)) throw new Error('Formato de reseñas inválido');
  return reviews.filter((r) => r && typeof r === 'object').map(prepareReview);
}

// FNV-1a: cheap fingerprint to notice when a review's text was edited after it was handled.
export function fingerprint(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

function toRating(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null;
}

function prepareReview(raw) {
  const text = typeof raw.text === 'string' ? raw.text : '';
  const author = typeof raw.author === 'string' && raw.author.trim() ? raw.author : 'Anónimo';
  const date = typeof raw.date === 'string' ? raw.date : '';
  const rating = toRating(raw.rating);
  const analysis = analyzeReview(text, { rating, ownDomains: BUSINESS.ownDomains });

  let accion = null;
  if (analysis.flagged) accion = 'reportar';
  else if (rating !== null && rating <= REPLY_MAX_RATING) accion = 'responder';

  const hasId = raw.id !== undefined && raw.id !== null && raw.id !== '';
  return {
    id: hasId ? String(raw.id) : `sin-id:${fingerprint(`${author}|${date}|${text}`)}`,
    author,
    rating,
    text,
    date,
    ...analysis,
    accion,
    fingerprint: fingerprint(text),
  };
}

export const isPending = (review) => review.accion !== null && review.estado === 'pendiente';

export function averageRating(reviews) {
  const rated = reviews.filter((r) => r.rating !== null);
  return rated.length === 0 ? null : rated.reduce((acc, r) => acc + r.rating, 0) / rated.length;
}
