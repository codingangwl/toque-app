import { promedioRating, filtrarAlertadas } from './reviews.js';

const ETIQUETAS = {
  ofensivo: 'Lenguaje ofensivo',
  discriminatorio: 'Discriminación',
  spam: 'Spam / links',
};

const ESTADOS = { revisada: 'Revisada', reportada: 'Reportada a Google' };

function el(tag, clase, texto) {
  const nodo = document.createElement(tag);
  if (clase) nodo.className = clase;
  if (texto !== undefined) nodo.textContent = texto;
  return nodo;
}

const estrellas = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

function crearTarjeta(resena, onAccion) {
  const tarjeta = el('article', resena.flagged ? 'tarjeta alertada' : 'tarjeta');

  const cabecera = el('div', 'tarjeta-cabecera');
  cabecera.append(el('strong', 'autor', resena.author), el('span', 'estrellas', estrellas(resena.rating)));

  const pie = el('div', 'tarjeta-pie');
  pie.append(el('span', 'fecha', resena.date));
  resena.motivos.forEach((m) => pie.append(el('span', 'chip', ETIQUETAS[m] ?? m)));
  if (resena.estado !== 'pendiente') {
    pie.append(el('span', 'chip estado', ESTADOS[resena.estado]));
  }

  tarjeta.append(cabecera, el('p', 'texto', resena.text), pie);

  if (resena.flagged && resena.estado === 'pendiente') {
    const acciones = el('div', 'acciones');
    const btnRevisada = el('button', 'btn', 'Marcar revisada');
    const btnReportada = el('button', 'btn principal', 'Ya la reporté a Google');
    btnRevisada.addEventListener('click', () => onAccion(resena.id, 'revisada'));
    btnReportada.addEventListener('click', () => onAccion(resena.id, 'reportada'));
    acciones.append(btnRevisada, btnReportada);
    tarjeta.append(acciones);
  }

  return tarjeta;
}

export function renderResumen(contenedor, resenas) {
  const pendientes = filtrarAlertadas(resenas).filter((r) => r.estado === 'pendiente').length;

  const datos = [
    { num: promedioRating(resenas).toFixed(1), label: 'Promedio', clase: '' },
    { num: resenas.length, label: 'Reseñas', clase: '' },
    { num: pendientes, label: 'Alertas pendientes', clase: 'rosa' },
  ];

  contenedor.replaceChildren(
    ...datos.map((d) => {
      const stat = el('div', 'stat');
      stat.append(el('div', `stat-num ${d.clase}`, d.num), el('div', 'stat-label', d.label));
      return stat;
    })
  );
}

export function renderLista(contenedor, resenas, onAccion) {
  if (resenas.length === 0) {
    contenedor.replaceChildren(el('p', 'vacio', 'No hay reseñas para mostrar aquí.'));
    return;
  }
  contenedor.replaceChildren(...resenas.map((r) => crearTarjeta(r, onAccion)));
}