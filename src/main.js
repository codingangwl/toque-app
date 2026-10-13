import './style.css';
import { loadReviews, isPending } from './reviews.js';
import { getRecord, setRecord, isPersistent, STORAGE_KEY } from './storage.js';
import {
  renderSummary, renderList, renderFilters, renderMessage, renderNotices, showToast, STATUS_LABELS,
} from './ui.js';

const FILTERS = {
  todas: () => true,
  reportar: (r) => r.accion === 'reportar',
  responder: (r) => r.accion === 'responder',
  pendientes: isPending,
};

const state = { reviews: [], loading: true, error: null, filter: 'todas', waitingWorker: null };

const summaryContainer = document.querySelector('#resumen');
const listContainer = document.querySelector('#lista');
const filtersContainer = document.querySelector('#filtros');
const noticesContainer = document.querySelector('#avisos');
const toastContainer = document.querySelector('#toast');

function withStatus() {
  return state.reviews.map((r) => {
    const record = getRecord(r.id);
    // The author edited the text after it was handled: it needs a second look.
    const editada = Boolean(record?.fingerprint && record.fingerprint !== r.fingerprint);
    return { ...r, estado: record && !editada ? record.estado : 'pendiente', editada };
  });
}

function buildNotices() {
  const notices = [];
  if (state.waitingWorker) {
    notices.push({ type: 'info', text: 'Hay una nueva versión de Toque.', action: { label: 'Actualizar', onClick: applyUpdate } });
  }
  if (state.error) {
    const text = navigator.onLine
      ? 'No pudimos cargar las reseñas.'
      : 'Sin conexión, y todavía no hay una copia guardada de tus reseñas.';
    notices.push({ type: 'error', text, action: { label: 'Reintentar', onClick: load } });
  } else if (!navigator.onLine) {
    notices.push({ type: 'warn', text: 'Sin conexión: estás viendo la última copia guardada.' });
  }
  if (!isPersistent()) {
    notices.push({ type: 'warn', text: 'Este navegador no permite guardar datos: lo que marques se perderá al cerrar la página.' });
  }
  return notices;
}

function render() {
  const list = withStatus();
  const ready = !state.loading && list.length > 0;
  const counts = Object.fromEntries(Object.entries(FILTERS).map(([key, fn]) => [key, list.filter(fn).length]));

  renderNotices(noticesContainer, buildNotices());
  renderSummary(summaryContainer, list, ready);
  renderFilters(filtersContainer, ready ? counts : {}, state.filter);

  if (list.length === 0 && state.loading) renderMessage(listContainer, 'Cargando reseñas…');
  else if (list.length === 0 && state.error) renderMessage(listContainer, 'No se pudieron cargar las reseñas.');
  else renderList(listContainer, list.filter(FILTERS[state.filter]), state.filter, handleAction);
}

function handleAction(review, estado) {
  const previous = getRecord(review.id);
  setRecord(review.id, estado === 'pendiente' ? null : { estado, fingerprint: review.fingerprint, fecha: new Date().toISOString() });
  render();

  const message = estado === 'pendiente' ? 'La reseña volvió a pendientes.' : `Marcada: ${STATUS_LABELS[estado]}.`;
  showToast(toastContainer, message, {
    label: 'Deshacer',
    onClick: () => {
      setRecord(review.id, previous);
      render();
    },
  });
}

async function load() {
  state.loading = true;
  state.error = null;
  render();
  try {
    state.reviews = await loadReviews();
  } catch (error) {
    console.error('No se pudieron cargar las reseñas:', error);
    state.error = error;
  } finally {
    state.loading = false;
    render();
  }
}

filtersContainer.addEventListener('click', (e) => {
  const button = e.target.closest('[data-filtro]');
  if (!button || !(button.dataset.filtro in FILTERS)) return;
  state.filter = button.dataset.filtro;
  render();
});

window.addEventListener('online', () => (state.error ? load() : render()));
window.addEventListener('offline', render);
// Another open tab marked a review.
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY || e.key === null) render();
});

load();

let reloadingForUpdate = false;

function applyUpdate() {
  reloadingForUpdate = true;
  state.waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
}

async function registerServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    const offerUpdate = (worker) => {
      state.waitingWorker = worker;
      render();
    };

    // Only offer an update when a previous version is already in control (not on the first install).
    if (registration.waiting && navigator.serviceWorker.controller) offerUpdate(registration.waiting);
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(worker);
      });
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloadingForUpdate) window.location.reload();
    });
  } catch (error) {
    console.error('No se pudo registrar el service worker:', error);
  }
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  registerServiceWorker();
}
