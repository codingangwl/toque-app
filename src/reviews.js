import { analyzeReview } from './detector.js';

export async function loadReviews() {
  try {
    const result = await fetch('/data/reviews.json');
    if (!result.ok) throw new Error(`Error HTTP ${result.status}`);

    const reviews = await result.json();
    return reviews.map((r) => ({ ...r, ...analyzeReview(r.text) }));
  } catch (error) {
    console.error('No se pudieron cargar las reseñas:', error);
    return [];
  }
}

export const filterFlagged = (reviews) => reviews.filter((r) => r.flagged);

export const averageRating = (reviews) =>
  reviews.length === 0
    ? 0
    : reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;