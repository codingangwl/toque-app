import { averageRating, filterFlagged } from './reviews.js';

const LABELS = {
  ofensivo: 'Lenguaje ofensivo',
  discriminatorio: 'Discriminación',
  spam: 'Spam / links',
};

const STATUSES = { revisada: 'Revisada', reportada: 'Reportada a Google' };

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

function createCard(review, onAction) {
  const card = el('article', review.flagged ? 'tarjeta alertada' : 'tarjeta');

  const header = el('div', 'tarjeta-cabecera');
  header.append(el('strong', 'autor', review.author), el('span', 'estrellas', stars(review.rating)));

  const footer = el('div', 'tarjeta-pie');
  footer.append(el('span', 'fecha', review.date));
  review.motivos.forEach((m) => footer.append(el('span', 'chip', LABELS[m] ?? m)));
  if (review.estado !== 'pendiente') {
    footer.append(el('span', 'chip estado', STATUSES[review.estado]));
  }

  card.append(header, el('p', 'texto', review.text), footer);

  if (review.flagged && review.estado === 'pendiente') {
    const actions = el('div', 'acciones');
    const reviewedBtn = el('button', 'btn', 'Ya la leí, no necesita acción');
    const reportedBtn = el('button', 'btn principal', 'La reporté a Google Maps');
    reviewedBtn.addEventListener('click', () => onAction(review.id, 'revisada'));
    reportedBtn.addEventListener('click', () => onAction(review.id, 'reportada'));
    actions.append(reviewedBtn, reportedBtn);
    card.append(actions);
  }

  return card;
}

export function renderSummary(container, reviews) {
  const pending = filterFlagged(reviews).filter((r) => r.estado === 'pendiente').length;

  const stats = [
    { num: averageRating(reviews).toFixed(1), label: 'Promedio', className: '' },
    { num: reviews.length, label: 'Reseñas', className: '' },
    { num: pending, label: 'Alertas pendientes', className: 'rosa' },
  ];

  container.replaceChildren(
    ...stats.map((s) => {
      const stat = el('div', 'stat');
      stat.append(el('div', `stat-num ${s.className}`, s.num), el('div', 'stat-label', s.label));
      return stat;
    })
  );
}

export function renderList(container, reviews, onAction) {
  if (reviews.length === 0) {
    container.replaceChildren(el('p', 'vacio', 'No hay reseñas para mostrar aquí.'));
    return;
  }
  container.replaceChildren(...reviews.map((r) => createCard(r, onAction)));
}