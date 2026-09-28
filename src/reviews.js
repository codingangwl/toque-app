import { analizarResena } from './detector.js';

export async function cargarResenas() {
  try {
    const respuesta = await fetch('/data/reviews.json');
    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);

    const resenas = await respuesta.json();
    return resenas.map((r) => ({ ...r, ...analizarResena(r.text) }));
  } catch (error) {
    console.error('No se pudieron cargar las reseñas:', error);
    return [];
  }
}

export const filtrarAlertadas = (resenas) => resenas.filter((r) => r.flagged);

export const promedioRating = (resenas) =>
  resenas.length === 0
    ? 0
    : resenas.reduce((acc, r) => acc + r.rating, 0) / resenas.length;