import { averageRating, isPending } from './reviews.js';

const LABELS = {
  ofensivo: 'Lenguaje ofensivo',
  discriminatorio: 'Discriminación',
  spam: 'Spam / links',
  vulgar: 'Lenguaje vulgar',
};

export const STATUS_LABELS = {
  revisada: 'No requería acción',
  reportada: 'Reportada a Google',
  respondida: 'Respondida',
};

const ACTIONS = {
  reportar: [
    { estado: 'revisada', label: 'No requiere acción' },
    { estado: 'reportada', label: 'Ya la reporté a Google', primary: true },
  ],
  responder: [
    { estado: 'revisada', label: 'No requiere acción' },
    { estado: 'respondida', label: 'Ya la respondí', primary: true },
  ],
};

const EMPTY_MESSAGES = {
  todas: 'Todavía no hay reseñas.',
  reportar: 'Ninguna reseña necesita ser reportada.',
  responder: 'No hay reseñas con calificación baja por responder.',
  pendientes: '¡Todo al día! No tienes reseñas pendientes.',
};

const dateFormat = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(className, label, onClick) {
  const node = el('button', className, label);
  node.type = 'button';
  node.addEventListener('click', onClick);
  return node;
}

function stars(rating) {
  if (rating === null) return el('span', 'estrellas sin', 'Sin calificación');
  const n = Math.round(rating);
  const node = el('span', 'estrellas', '★'.repeat(n) + '☆'.repeat(5 - n));
  node.setAttribute('role', 'img');
  node.setAttribute('aria-label', `${rating} de 5 estrellas`);
  return node;
}

function formatDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? value : dateFormat.format(date);
}

function createCard(review, onAction) {
  const classes = { reportar: 'tarjeta alertada', responder: 'tarjeta por-responder' };
  const card = el('article', classes[review.accion] ?? 'tarjeta');

  const header = el('div', 'tarjeta-cabecera');
  header.append(el('strong', 'autor', review.author), stars(review.rating));

  const footer = el('div', 'tarjeta-pie');
  const date = el('time', 'fecha', formatDate(review.date));
  date.dateTime = review.date;
  footer.append(date);
  review.motivos.forEach((m) => footer.append(el('span', 'chip', LABELS[m] ?? m)));
  if (review.accion === 'responder') footer.append(el('span', 'chip responder', 'Conviene responder'));
  if (review.accion && review.editada) footer.append(el('span', 'chip editada', 'Editada después de tu revisión'));
  if (review.estado !== 'pendiente') {
    footer.append(el('span', 'chip estado', STATUS_LABELS[review.estado] ?? review.estado));
  }

  card.append(header, el('p', 'texto', review.text), footer);

  if (isPending(review)) {
    const actions = el('div', 'acciones');
    ACTIONS[review.accion].forEach(({ estado, label, primary }) => {
      actions.append(button(primary ? 'btn principal' : 'btn', label, () => onAction(review, estado)));
    });
    card.append(actions);
  } else if (review.estado !== 'pendiente') {
    const actions = el('div', 'acciones');
    actions.append(button('btn enlace', 'Volver a pendiente', () => onAction(review, 'pendiente')));
    card.append(actions);
  }

  return card;
}

export function renderSummary(container, reviews, ready) {
  const pending = reviews.filter(isPending);
  const average = averageRating(reviews);
  const count = (accion) => (ready ? pending.filter((r) => r.accion === accion).length : '–');

  const stats = [
    { num: ready && average !== null ? average.toFixed(1) : '–', label: 'Promedio', className: '' },
    { num: count('reportar'), label: 'Por reportar', className: 'rosa' },
    { num: count('responder'), label: 'Por responder', className: 'crema' },
  ];

  container.replaceChildren(
    ...stats.map((s) => {
      const stat = el('div', 'stat');
      stat.append(el('div', `stat-num ${s.className}`, s.num), el('div', 'stat-label', s.label));
      return stat;
    })
  );
}

export function renderFilters(container, counts, active) {
  container.querySelectorAll('[data-filtro]').forEach((b) => {
    const isActive = b.dataset.filtro === active;
    b.classList.toggle('activo', isActive);
    b.setAttribute('aria-pressed', String(isActive));
    const count = b.querySelector('.cuenta');
    if (count) count.textContent = counts[b.dataset.filtro] ?? '';
  });
}

export function renderMessage(container, text) {
  container.replaceChildren(el('p', 'vacio', text));
}

export function renderList(container, reviews, filter, onAction) {
  if (reviews.length === 0) {
    renderMessage(container, EMPTY_MESSAGES[filter] ?? EMPTY_MESSAGES.todas);
    return;
  }
  container.replaceChildren(...reviews.map((r) => createCard(r, onAction)));
}

/** @param {{ type: 'error' | 'warn' | 'info', text: string, action?: { label: string, onClick: () => void } }[]} notices */
export function renderNotices(container, notices) {
  container.replaceChildren(
    ...notices.map(({ type, text, action }) => {
      const notice = el('div', `aviso ${type}`);
      notice.append(el('span', null, text));
      if (action) notice.append(button('btn', action.label, action.onClick));
      return notice;
    })
  );
}

let toastTimer;

export function showToast(container, text, action) {
  const hide = () => {
    clearTimeout(toastTimer);
    container.classList.remove('visible');
    container.replaceChildren();
  };

  clearTimeout(toastTimer);
  container.replaceChildren(el('span', null, text));
  if (action) {
    container.append(
      button('toast-accion', action.label, () => {
        hide();
        action.onClick();
      })
    );
  }
  container.classList.add('visible');
  toastTimer = setTimeout(hide, 6000);
}
