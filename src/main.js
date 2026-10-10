import './style.css';
import { loadReviews, filterFlagged } from './reviews.js';
import { saveStatus, getStatuses } from './storage.js';
import { renderSummary, renderList } from './ui.js';

const reviews = await loadReviews();
let currentFilter = 'todas';

const summaryContainer = document.querySelector('#resumen');
const listContainer = document.querySelector('#lista');

function withStatus() {
  const statuses = getStatuses();
  return reviews.map((r) => ({ ...r, estado: statuses[r.id] ?? 'pendiente' }));
}

function applyFilter(list) {
  if (currentFilter === 'alertadas') return filterFlagged(list);
  if (currentFilter === 'pendientes') {
    return filterFlagged(list).filter((r) => r.estado === 'pendiente');
  }
  return list;
}

function render() {
  const list = withStatus();
  renderSummary(summaryContainer, list);
  renderList(listContainer, applyFilter(list), handleAction);
}

function handleAction(id, status) {
  saveStatus(id, status);
  render();
}

document.querySelector('#filtros').addEventListener('click', (e) => {
  const button = e.target.closest('[data-filtro]');
  if (!button) return;

  currentFilter = button.dataset.filtro;
  document.querySelectorAll('.filtro').forEach((b) => b.classList.toggle('activo', b === button));
  render();
});

render();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js');
}