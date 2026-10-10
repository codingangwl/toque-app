const CLAVE = 'review-alert:estados';

export function getStatuses() {
  return JSON.parse(localStorage.getItem(CLAVE)) ?? {};
}

export function saveStatus(id, estado) {
  const estados = getStatuses();
  estados[id] = estado;
  localStorage.setItem(CLAVE, JSON.stringify(estados));
}