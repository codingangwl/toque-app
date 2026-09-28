const CLAVE = 'review-alert:estados';

export function obtenerEstados() {
  return JSON.parse(localStorage.getItem(CLAVE)) ?? {};
}

export function guardarEstado(id, estado) {
  const estados = obtenerEstados();
  estados[id] = estado;
  localStorage.setItem(CLAVE, JSON.stringify(estados));
}