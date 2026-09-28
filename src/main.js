import './style.css';
import { cargarResenas, filtrarAlertadas } from './reviews.js';
import { guardarEstado, obtenerEstados } from './storage.js';
import { renderResumen, renderLista } from './ui.js';

const resenas = await cargarResenas();
let filtroActual = 'todas';

const contenedorResumen = document.querySelector('#resumen');
const contenedorLista = document.querySelector('#lista');

function conEstado() {
  const estados = obtenerEstados();
  return resenas.map((r) => ({ ...r, estado: estados[r.id] ?? 'pendiente' }));
}

function aplicarFiltro(lista) {
  if (filtroActual === 'alertadas') return filtrarAlertadas(lista);
  if (filtroActual === 'pendientes') {
    return filtrarAlertadas(lista).filter((r) => r.estado === 'pendiente');
  }
  return lista;
}

function pintar() {
  const lista = conEstado();
  renderResumen(contenedorResumen, lista);
  renderLista(contenedorLista, aplicarFiltro(lista), manejarAccion);
}

function manejarAccion(id, estado) {
  guardarEstado(id, estado);
  pintar();
}

document.querySelector('#filtros').addEventListener('click', (e) => {
  const boton = e.target.closest('[data-filtro]');
  if (!boton) return;

  filtroActual = boton.dataset.filtro;
  document.querySelectorAll('.filtro').forEach((b) => b.classList.toggle('activo', b === boton));
  pintar();
});

pintar();