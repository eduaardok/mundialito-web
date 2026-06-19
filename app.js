/* ============================================================
   TORNEO AMIGOS FC 26 — app.js
   Lógica completa del torneo. Sin dependencias externas.
   Persistencia: localStorage (clave "torneo_data")
============================================================ */

'use strict';

// ── Constantes ──────────────────────────────────────────────

const CLAVE_LS = 'torneo_data';

const EQUIPOS_POOL = [
  'Argentina', 'Francia', 'Brasil', 'Inglaterra', 'Portugal',
  'España', 'Alemania', 'Países Bajos', 'Bélgica', 'Italia',
  'Uruguay', 'Colombia', 'Croacia', 'Marruecos', 'Estados Unidos'
];

const NOMBRES_RONDAS = {
  2: 'Final',
  4: 'Semifinales',
  8: 'Cuartos de final',
  16: 'Octavos de final',
  32: 'Dieciseisavos'
};

const FASES_TEXTO = {
  setup: 'Configuración inicial',
  equipos: 'Asignación de equipos',
  grupos_config: 'Configurando grupos',
  fase_grupos: 'Fase de grupos',
  clasificados: 'Definiendo clasificados',
  eliminacion: 'Eliminación directa',
  finalizado: 'Torneo finalizado'
};

// ── Estado global ────────────────────────────────────────────

let estado = crearEstadoVacio();

// Partido en edición (modal resultado)
let partidoEditando = null;

// Grupo activo en tabs
let grupoActivo = 0;

// Ronda activa en eliminación
let rondaActiva = 0;

// ── Estructura de datos vacía ────────────────────────────────

function crearEstadoVacio() {
  return {
    meta: { nombre: '', logo: '', tema: 'dark' },
    jugadores: [],        // { id, nombre, equipo }
    grupos: [],           // { id, nombre, jugadoresIds: [] }
    partidos_grupos: [],  // { id, grupoId, localId, visitanteId, golesLocal, golesVisitante, jugado }
    clasificados: [],     // [jugadorId, ...]
    cruces: [],           // { id, ronda, posicion, localId, visitanteId }
    partidos_eliminacion: [], // { id, cruceId, ronda, localId, visitanteId, golesLocal, golesVisitante, ganadorId, penalGanadorId, jugado }
    campeon: null,        // jugadorId
    fase: 'setup'
  };
}

// ── Persistencia ─────────────────────────────────────────────

function guardar() {
  try {
    localStorage.setItem(CLAVE_LS, JSON.stringify(estado));
  } catch (e) {
    mostrarToast('Error al guardar (localStorage lleno)', 'error');
  }
}

function cargar() {
  try {
    const raw = localStorage.getItem(CLAVE_LS);
    if (!raw) return false;
    const datos = JSON.parse(raw);
    // Fusionar con estructura vacía para compatibilidad
    estado = Object.assign(crearEstadoVacio(), datos);
    estado.meta = Object.assign({ nombre: '', logo: '', tema: 'dark' }, datos.meta);
    return true;
  } catch (e) {
    return false;
  }
}

function limpiarStorage() {
  try {
    localStorage.removeItem(CLAVE_LS);
  } catch (e) { /* ignorar */ }
  estado = crearEstadoVacio();
}

// ── IDs únicos ───────────────────────────────────────────────

let _idCounter = Date.now();
function nuevoId() { return `id_${_idCounter++}`; }

// ── Toast ────────────────────────────────────────────────────

let _toastTimer = null;
function mostrarToast(msg, tipo = 'info') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${tipo}`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { el.className = 'toast hidden'; }, 3000);
}

// ── Tema ─────────────────────────────────────────────────────

function aplicarTema(tema) {
  document.documentElement.setAttribute('data-theme', tema);
  const icon = document.querySelector('#btn-theme-toggle i');
  if (icon) {
    icon.className = tema === 'dark' ? 'fa-solid fa-moon text-gold' : 'fa-solid fa-sun text-gold';
  }
  const toggle = document.getElementById('btn-theme-config');
  if (toggle) toggle.setAttribute('aria-checked', tema === 'dark' ? 'true' : 'false');
}

function toggleTema() {
  estado.meta.tema = estado.meta.tema === 'dark' ? 'light' : 'dark';
  aplicarTema(estado.meta.tema);
  guardar();
}

// ── Navegación / Router ──────────────────────────────────────

function mostrarPantalla(nombre) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`screen-${nombre}`);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Nav tabs
  const nav = document.getElementById('bottom-nav');
  const header = document.getElementById('app-header');
  const screensConNav = ['dashboard', 'fase-grupos', 'eliminacion', 'config', 'clasificados'];
  if (screensConNav.includes(nombre)) {
    nav.classList.remove('hidden');
    header.classList.remove('hidden');
    actualizarNavTab(nombre === 'fase-grupos' ? 'fase-grupos' :
                     nombre === 'eliminacion' ? 'eliminacion' :
                     nombre === 'config' ? 'config' : 'dashboard');
  } else {
    nav.classList.add('hidden');
    header.classList.add('hidden');
  }

  actualizarHeader();
}

function actualizarNavTab(tab) {
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
}

function actualizarHeader() {
  const titulo = document.getElementById('header-title');
  const fase = document.getElementById('header-phase');
  const logoWrap = document.getElementById('header-logo-wrap');
  const logoImg = document.getElementById('header-logo');

  if (titulo) titulo.textContent = estado.meta.nombre || 'TORNEO FC 26';
  if (fase) fase.textContent = FASES_TEXTO[estado.fase] || '';

  if (logoImg && estado.meta.logo) {
    logoImg.src = estado.meta.logo;
    logoWrap.classList.remove('hidden');
  } else if (logoWrap) {
    logoWrap.classList.add('hidden');
  }

  // Config screen info
  const configNombre = document.getElementById('config-torneo-nombre');
  const configFase = document.getElementById('config-torneo-fase');
  if (configNombre) configNombre.textContent = estado.meta.nombre || '(sin nombre)';
  if (configFase) configFase.textContent = FASES_TEXTO[estado.fase] || '';
}

function irAFaseCorrecta() {
  switch (estado.fase) {
    case 'setup':      mostrarPantalla('setup'); break;
    case 'equipos':    mostrarPantalla('equipos'); break;
    case 'grupos_config': mostrarPantalla('grupos-config'); break;
    case 'fase_grupos': mostrarPantalla('dashboard'); renderizarDashboard(); break;
    case 'clasificados': mostrarPantalla('clasificados'); renderizarClasificados(); break;
    case 'eliminacion': mostrarPantalla('dashboard'); renderizarDashboard(); break;
    case 'finalizado':  mostrarPantalla('dashboard'); renderizarDashboard(); break;
    default:           mostrarPantalla('setup'); break;
  }
}

// ── Modal genérico de confirmación ───────────────────────────

let _confirmCallback = null;
function mostrarConfirm(titulo, msg, callback) {
  document.getElementById('modal-confirm-title').textContent = titulo;
  document.getElementById('modal-confirm-msg').textContent = msg;
  _confirmCallback = callback;
  document.getElementById('modal-confirm').classList.remove('hidden');
}

// ── Utilidades ───────────────────────────────────────────────

function mezclar(arr) {
  // Fisher-Yates
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function jugadorPorId(id) {
  return estado.jugadores.find(j => j.id === id) || null;
}

function grupoPorId(id) {
  return estado.grupos.find(g => g.id === id) || null;
}

// ── PANTALLA 0 — SETUP ───────────────────────────────────────

let _numJugadores = 4;

function inicializarSetup() {
  _numJugadores = Math.max(4, estado.jugadores.length || 4);
  document.getElementById('input-num-jugadores').value = _numJugadores;
  document.getElementById('input-torneo-nombre').value = estado.meta.nombre || '';

  if (estado.meta.logo) {
    mostrarPreviewLogo(estado.meta.logo);
  }

  renderizarListaJugadores();
}

function renderizarListaJugadores() {
  const container = document.getElementById('lista-jugadores');
  container.innerHTML = '';

  for (let i = 0; i < _numJugadores; i++) {
    const jugadorExistente = estado.jugadores[i];
    const row = document.createElement('div');
    row.className = 'jugador-row';
    row.dataset.index = i;
    row.innerHTML = `
      <div class="jugador-num">#${i + 1}</div>
      <div class="jugador-input-wrap flex-1">
        <input
          type="text"
          class="jugador-input w-full"
          placeholder="Nombre del jugador"
          maxlength="20"
          autocomplete="off"
          data-index="${i}"
          value="${jugadorExistente ? escHtml(jugadorExistente.nombre) : ''}"
        />
        <p class="jugador-error">Nombre vacío o duplicado</p>
      </div>
    `;
    container.appendChild(row);
  }

  // Eventos en los inputs
  container.querySelectorAll('.jugador-input').forEach(inp => {
    inp.addEventListener('input', validarJugadores);
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const siguiente = container.querySelector(`[data-index="${parseInt(inp.dataset.index) + 1}"]`);
        if (siguiente) siguiente.focus();
        else document.getElementById('btn-confirmar-jugadores').focus();
      }
    });
  });

  validarJugadores();
}

function validarJugadores() {
  const inputs = document.querySelectorAll('#lista-jugadores .jugador-input');
  const nombres = [];
  let valido = true;

  inputs.forEach(inp => {
    const val = inp.value.trim();
    inp.classList.remove('error');
    if (!val) {
      inp.classList.add('error');
      valido = false;
    } else if (nombres.includes(val.toLowerCase())) {
      inp.classList.add('error');
      valido = false;
    }
    nombres.push(val.toLowerCase());
  });

  document.getElementById('btn-confirmar-jugadores').disabled = !valido;
  return valido;
}

function mostrarPreviewLogo(src) {
  const img = document.getElementById('logo-preview-img');
  const wrap = document.getElementById('logo-preview-wrap');
  const btnRemove = document.getElementById('btn-remove-logo');
  img.src = src;
  img.classList.remove('hidden');
  wrap.classList.add('hidden');
  btnRemove.classList.remove('hidden');
}

function quitarLogo() {
  const img = document.getElementById('logo-preview-img');
  const wrap = document.getElementById('logo-preview-wrap');
  const btnRemove = document.getElementById('btn-remove-logo');
  img.src = '';
  img.classList.add('hidden');
  wrap.classList.remove('hidden');
  btnRemove.classList.add('hidden');
  estado.meta.logo = '';
  guardar();
}

function confirmarJugadores() {
  if (!validarJugadores()) return;

  const nombre = document.getElementById('input-torneo-nombre').value.trim();
  if (!nombre) {
    document.getElementById('input-torneo-nombre').classList.add('error');
    mostrarToast('Ingresa un nombre para el torneo', 'error');
    return;
  }

  document.getElementById('input-torneo-nombre').classList.remove('error');
  estado.meta.nombre = nombre;

  const inputs = document.querySelectorAll('#lista-jugadores .jugador-input');
  estado.jugadores = Array.from(inputs).map((inp, i) => ({
    id: estado.jugadores[i]?.id || nuevoId(),
    nombre: inp.value.trim(),
    equipo: estado.jugadores[i]?.equipo || ''
  }));

  estado.fase = 'equipos';
  guardar();
  inicializarEquipos();
  mostrarPantalla('equipos');
}

// ── PANTALLA 0b — ASIGNAR EQUIPOS ────────────────────────────

let _modoEquipos = 'aleatorio';
let _equiposExtra = [];

function inicializarEquipos() {
  _equiposExtra = [];
  _equiposTempSorteados = null;
  _modoEquipos = 'aleatorio';
  // No limpiar equipos ya sorteados si volvemos atrás con datos
  document.getElementById('btn-modo-aleatorio').classList.add('active');
  document.getElementById('btn-modo-manual').classList.remove('active');
  renderizarAsignacionEquipos();
}

function renderizarAsignacionEquipos() {
  const container = document.getElementById('lista-asignacion-equipos');
  container.innerHTML = '';
  const todosEquipos = [...EQUIPOS_POOL, ..._equiposExtra];
  const necesitaExtra = estado.jugadores.length > todosEquipos.length;

  document.getElementById('equipos-extra-section').classList.toggle('hidden', !necesitaExtra);
  document.getElementById('sortear-equipos-wrap').classList.toggle('hidden', _modoEquipos !== 'aleatorio');

  if (_modoEquipos === 'aleatorio') {
    // Mostrar badges con equipo ya sorteado (si existe) o "Pendiente"
    estado.jugadores.forEach(j => {
      const tieneSorteo = !!j.equipo;
      const row = document.createElement('div');
      row.className = `asignacion-row ${tieneSorteo ? 'has-team' : ''}`;
      row.innerHTML = `
        <span class="jugador-label">${escHtml(j.nombre)}</span>
        <span class="equipo-assigned-badge ${tieneSorteo ? 'sorteado' : ''}">
          ${tieneSorteo
            ? `<i class="fa-solid fa-shield-halved mr-1"></i>${escHtml(j.equipo)}`
            : `<i class="fa-solid fa-question mr-1"></i>Sin sortear`}
        </span>
      `;
      container.appendChild(row);
    });
  } else {
    // Select por jugador
    estado.jugadores.forEach(j => {
      const row = document.createElement('div');
      row.className = 'asignacion-row';
      const options = todosEquipos.map(eq =>
        `<option value="${escHtml(eq)}" ${j.equipo === eq ? 'selected' : ''}>${escHtml(eq)}</option>`
      ).join('');
      row.innerHTML = `
        <span class="jugador-label">${escHtml(j.nombre)}</span>
        <select class="equipo-select" data-jugador-id="${j.id}">
          <option value="">— Elegir —</option>
          ${options}
        </select>
      `;
      container.appendChild(row);
    });
  }
}

// Almacena temporalmente el resultado del sorteo antes de confirmar
let _equiposTempSorteados = null;

function mostrarAnimacionSorteoEquipos() {
  const todosEquipos = [...EQUIPOS_POOL, ..._equiposExtra];
  const equiposMezclados = mezclar(todosEquipos).slice(0, estado.jugadores.length);
  _equiposTempSorteados = equiposMezclados;

  const modal = document.getElementById('modal-sorteo-equipos');
  const bombo = document.getElementById('sorteo-eq-bombo');
  const msg = document.getElementById('sorteo-eq-msg');
  const sub = document.getElementById('sorteo-eq-sub');
  const resultado = document.getElementById('sorteo-eq-resultado');
  const btnConfirmar = document.getElementById('btn-sorteo-eq-confirmar');
  const btnRepetir = document.getElementById('btn-sorteo-eq-repetir');

  resultado.innerHTML = '';
  btnConfirmar.classList.add('hidden');
  btnRepetir.classList.add('hidden');
  modal.classList.remove('hidden');
  bombo.classList.add('spinning');
  msg.textContent = 'SORTEANDO EQUIPOS';
  sub.textContent = 'Asignando equipos de FC 26...';

  let i = 0;
  const intervalo = setInterval(() => {
    if (i >= estado.jugadores.length) {
      clearInterval(intervalo);
      bombo.classList.remove('spinning');
      msg.textContent = 'SORTEO COMPLETADO';
      sub.textContent = `${estado.jugadores.length} equipos asignados`;
      btnConfirmar.classList.remove('hidden');
      btnRepetir.classList.remove('hidden');

      // Repetir sorteo
      btnRepetir.onclick = () => {
        modal.classList.add('hidden');
        // Limpiar equipos y re-abrir
        estado.jugadores.forEach(j => { j.equipo = ''; });
        setTimeout(mostrarAnimacionSorteoEquipos, 100);
      };
      return;
    }

    const j = estado.jugadores[i];
    const equipo = equiposMezclados[i] || `Equipo ${i + 1}`;
    const item = document.createElement('div');
    item.className = 'sorteo-jugador-item';
    item.innerHTML = `
      <div>
        <div class="font-semibold text-sm">${escHtml(j.nombre)}</div>
      </div>
      <span class="sorteo-equipo-badge"><i class="fa-solid fa-shield-halved mr-1"></i>${escHtml(equipo)}</span>
    `;
    resultado.appendChild(item);
    resultado.scrollTop = resultado.scrollHeight;
    i++;
  }, 180);
}

function confirmarEquipos() {
  const todosEquipos = [...EQUIPOS_POOL, ..._equiposExtra];

  if (_modoEquipos === 'aleatorio') {
    // Verificar que se realizó el sorteo
    const yaOrdenados = estado.jugadores.every(j => j.equipo);
    if (!yaOrdenados) {
      mostrarToast('Primero sortea los equipos con el botón rojo', 'error');
      return;
    }
  } else {
    const selects = document.querySelectorAll('.equipo-select');
    let ok = true;
    selects.forEach(sel => {
      if (!sel.value) { sel.style.borderColor = 'var(--red)'; ok = false; }
      else sel.style.borderColor = '';
    });
    if (!ok) { mostrarToast('Asigna un equipo a cada jugador', 'error'); return; }

    selects.forEach(sel => {
      const j = estado.jugadores.find(jug => jug.id === sel.dataset.jugadorId);
      if (j) j.equipo = sel.value;
    });
  }

  estado.fase = 'grupos_config';
  guardar();
  inicializarGruposConfig();
  mostrarPantalla('grupos-config');
}

// ── PANTALLA 1 — CONFIGURACIÓN DE GRUPOS ─────────────────────

let _numGrupos = 2;
let _modoSorteo = 'sorteo';

function inicializarGruposConfig() {
  const total = estado.jugadores.length;
  _numGrupos = sugerirGrupos(total);
  document.getElementById('input-num-grupos').value = _numGrupos;
  actualizarDistribucion();
  renderizarCabezas();
  _modoSorteo = 'sorteo';
  document.getElementById('btn-modo-sorteo').classList.add('active');
  document.getElementById('btn-modo-manual-grupos').classList.remove('active');
  document.getElementById('asignacion-manual-grupos').classList.add('hidden');

  const sugerenciaEl = document.getElementById('sugerencia-grupos');
  sugerenciaEl.innerHTML = `
    <i class="fa-solid fa-lightbulb mr-2"></i>
    <strong>${total} jugadores</strong> — se sugiere ${_numGrupos} grupo(s) de ~${Math.ceil(total / _numGrupos)} equipos.
  `;
}

function sugerirGrupos(total) {
  if (total <= 4) return 1;
  if (total <= 6) return 2;
  if (total <= 9) return 3;
  if (total <= 12) return 3;
  if (total <= 16) return 4;
  return Math.ceil(total / 4);
}

function actualizarDistribucion() {
  const total = estado.jugadores.length;
  const porGrupo = Math.ceil(total / _numGrupos);
  const resto = total % _numGrupos;
  let texto = '';
  if (resto === 0) {
    texto = `${_numGrupos} grupo(s) de ${porGrupo} equipos`;
  } else {
    const grandes = resto;
    const pequenos = _numGrupos - grandes;
    texto = `${grandes} grupo(s) de ${porGrupo} + ${pequenos} grupo(s) de ${porGrupo - 1} equipos`;
  }
  document.getElementById('distribucion-grupos').textContent = texto;
}

function renderizarCabezas() {
  const container = document.getElementById('lista-cabezas');
  container.innerHTML = '';
  for (let g = 0; g < _numGrupos; g++) {
    const row = document.createElement('div');
    row.className = 'cabeza-select-row';
    const opts = estado.jugadores.map(j =>
      `<option value="${j.id}">${escHtml(j.nombre)} (${escHtml(j.equipo)})</option>`
    ).join('');
    row.innerHTML = `
      <label>Grupo ${letraGrupo(g)}</label>
      <select data-grupo="${g}">
        <option value="">— Sin cabeza —</option>
        ${opts}
      </select>
    `;
    container.appendChild(row);
  }
}

function letraGrupo(i) {
  return String.fromCharCode(65 + i);
}

function obtenerCabezas() {
  const selects = document.querySelectorAll('#lista-cabezas select');
  const cabezas = {};
  selects.forEach(sel => {
    if (sel.value) cabezas[parseInt(sel.dataset.grupo)] = sel.value;
  });
  return cabezas;
}

function realizarSorteo() {
  const cabezas = obtenerCabezas();
  const cabezasArr = Object.values(cabezas);

  // Validar que no haya cabezas duplicadas (causa loop infinito en distribución)
  if (new Set(cabezasArr).size !== cabezasArr.length) {
    mostrarToast('El mismo jugador no puede ser cabeza en dos grupos', 'error');
    return;
  }

  const cabezasIds = new Set(cabezasArr);
  const resto = mezclar(estado.jugadores.filter(j => !cabezasIds.has(j.id)).map(j => j.id));

  // Crear grupos
  const total = estado.jugadores.length;
  const porGrupo = Math.ceil(total / _numGrupos);
  const gruposTemp = [];
  for (let g = 0; g < _numGrupos; g++) {
    gruposTemp.push({
      id: nuevoId(),
      nombre: `Grupo ${letraGrupo(g)}`,
      jugadoresIds: cabezas[g] ? [cabezas[g]] : []
    });
  }

  // Distribuir resto round-robin
  let gi = 0;
  resto.forEach(jid => {
    while (gruposTemp[gi].jugadoresIds.length >= porGrupo) {
      gi = (gi + 1) % _numGrupos;
    }
    gruposTemp[gi].jugadoresIds.push(jid);
    gi = (gi + 1) % _numGrupos;
  });

  mostrarModalSorteo(gruposTemp);
}

function mostrarModalSorteo(grupos) {
  const modal = document.getElementById('modal-sorteo');
  const bombo = document.getElementById('sorteo-bombo');
  const msg = document.getElementById('sorteo-msg');
  const sub = document.getElementById('sorteo-sub');
  const resultado = document.getElementById('sorteo-resultado');
  const btnConfirmar = document.getElementById('btn-sorteo-confirmar');

  resultado.innerHTML = '';
  btnConfirmar.classList.add('hidden');
  modal.classList.remove('hidden');
  bombo.classList.add('spinning');
  msg.textContent = 'REALIZANDO SORTEO';
  sub.textContent = 'Asignando jugadores a grupos...';

  // Animación: mostrar jugadores uno a uno
  const todosJugadores = grupos.flatMap(g =>
    g.jugadoresIds.map(jid => ({ jugador: jugadorPorId(jid), grupo: g.nombre }))
  );

  let i = 0;
  const intervalo = setInterval(() => {
    if (i >= todosJugadores.length) {
      clearInterval(intervalo);
      bombo.classList.remove('spinning');
      msg.textContent = 'SORTEO COMPLETADO';
      sub.textContent = `${estado.jugadores.length} jugadores asignados`;
      btnConfirmar.classList.remove('hidden');

      // Guardar grupos temporalmente para confirmar
      btnConfirmar.onclick = () => confirmarSorteo(grupos);
      return;
    }

    const { jugador, grupo } = todosJugadores[i];
    const item = document.createElement('div');
    item.className = 'sorteo-jugador-item';
    item.innerHTML = `
      <div>
        <div class="font-semibold text-sm">${escHtml(jugador?.nombre || '?')}</div>
        <div class="text-xs text-gray-400">${escHtml(jugador?.equipo || '')}</div>
      </div>
      <span class="sorteo-grupo-badge">${escHtml(grupo)}</span>
    `;
    resultado.appendChild(item);
    resultado.scrollTop = resultado.scrollHeight;
    i++;
  }, 200);
}

function confirmarSorteo(grupos) {
  estado.grupos = grupos;
  estado.partidos_grupos = generarCalendarioGrupos();
  estado.fase = 'fase_grupos';
  guardar();
  document.getElementById('modal-sorteo').classList.add('hidden');
  mostrarPantalla('dashboard');
  renderizarDashboard();
  renderizarFaseGrupos();
  mostrarToast('Sorteo confirmado. ¡Comienza el torneo!', 'success');
}

function aplicarGruposManual() {
  const containers = document.querySelectorAll('.grupo-manual-list');
  const grupos = [];
  containers.forEach((c, i) => {
    const jugadoresIds = Array.from(c.querySelectorAll('.draggable-jugador'))
      .map(el => el.dataset.jugadorId);
    grupos.push({
      id: nuevoId(),
      nombre: `Grupo ${letraGrupo(i)}`,
      jugadoresIds
    });
  });

  // Validar que todos los jugadores estén asignados
  const asignados = grupos.flatMap(g => g.jugadoresIds);
  if (asignados.length !== estado.jugadores.length) {
    mostrarToast('Todos los jugadores deben estar en un grupo', 'error');
    return;
  }

  estado.grupos = grupos;
  estado.partidos_grupos = generarCalendarioGrupos();
  estado.fase = 'fase_grupos';
  guardar();
  mostrarPantalla('dashboard');
  renderizarDashboard();
  renderizarFaseGrupos();
  mostrarToast('Grupos creados. ¡Comienza el torneo!', 'success');
}

function renderizarAsignacionManual() {
  const container = document.getElementById('grupos-manual-container');
  container.innerHTML = '';

  for (let g = 0; g < _numGrupos; g++) {
    const div = document.createElement('div');
    div.innerHTML = `
      <p class="text-sm font-bold text-gold mb-2">Grupo ${letraGrupo(g)}</p>
      <div class="grupo-drop-zone grupo-manual-list" data-grupo="${g}" id="grupo-drop-${g}"></div>
    `;
    container.appendChild(div);
  }

  // Pool de jugadores sin asignar
  const pool = document.createElement('div');
  pool.innerHTML = `
    <p class="text-sm font-bold text-gray-400 mb-2 mt-4">Sin asignar</p>
    <div class="grupo-drop-zone grupo-manual-list" id="grupo-drop-pool"></div>
  `;
  container.appendChild(pool);

  // Agregar jugadores al pool
  const poolList = document.getElementById('grupo-drop-pool');
  estado.jugadores.forEach(j => {
    poolList.appendChild(crearDraggableJugador(j));
  });

  // Drag & drop (touch + mouse)
  configurarDragDrop(container);
}

function crearDraggableJugador(j) {
  const el = document.createElement('div');
  el.className = 'draggable-jugador';
  el.dataset.jugadorId = j.id;
  el.draggable = true;
  el.innerHTML = `
    <i class="fa-solid fa-grip-vertical text-gray-500 text-xs"></i>
    <div>
      <div class="text-sm font-semibold">${escHtml(j.nombre)}</div>
      <div class="text-xs text-gray-400">${escHtml(j.equipo)}</div>
    </div>
  `;
  return el;
}

function configurarDragDrop(container) {
  let dragged = null;

  container.addEventListener('dragstart', e => {
    if (e.target.classList.contains('draggable-jugador')) {
      dragged = e.target;
      e.target.classList.add('dragging');
    }
  });

  container.addEventListener('dragend', e => {
    if (e.target.classList.contains('draggable-jugador')) {
      e.target.classList.remove('dragging');
      dragged = null;
    }
  });

  container.querySelectorAll('.grupo-drop-zone').forEach(zone => {
    zone.addEventListener('dragover', e => {
      e.preventDefault();
      zone.classList.add('over');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('over'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('over');
      if (dragged) zone.appendChild(dragged);
    });
  });
}

// ── GENERACIÓN DE CALENDARIO ─────────────────────────────────

function generarCalendarioGrupos() {
  const partidos = [];
  estado.grupos.forEach(grupo => {
    const jugs = grupo.jugadoresIds;
    for (let i = 0; i < jugs.length; i++) {
      for (let j = i + 1; j < jugs.length; j++) {
        partidos.push({
          id: nuevoId(),
          grupoId: grupo.id,
          localId: jugs[i],
          visitanteId: jugs[j],
          golesLocal: null,
          golesVisitante: null,
          jugado: false
        });
      }
    }
  });
  return partidos;
}

// ── CÁLCULO DE POSICIONES ────────────────────────────────────

function calcularPosiciones(grupoId) {
  const grupo = grupoPorId(grupoId);
  if (!grupo) return [];

  const stats = {};
  grupo.jugadoresIds.forEach(jid => {
    stats[jid] = { id: jid, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0 };
  });

  const partidos = estado.partidos_grupos.filter(p => p.grupoId === grupoId && p.jugado);
  partidos.forEach(p => {
    const gl = p.golesLocal;
    const gv = p.golesVisitante;
    stats[p.localId].pj++;
    stats[p.visitanteId].pj++;
    stats[p.localId].gf += gl;
    stats[p.localId].gc += gv;
    stats[p.visitanteId].gf += gv;
    stats[p.visitanteId].gc += gl;
    if (gl > gv) {
      stats[p.localId].pg++;
      stats[p.localId].pts += 3;
      stats[p.visitanteId].pp++;
    } else if (gl < gv) {
      stats[p.visitanteId].pg++;
      stats[p.visitanteId].pts += 3;
      stats[p.localId].pp++;
    } else {
      stats[p.localId].pe++;
      stats[p.localId].pts++;
      stats[p.visitanteId].pe++;
      stats[p.visitanteId].pts++;
    }
  });

  Object.values(stats).forEach(s => { s.dg = s.gf - s.gc; });

  const lista = Object.values(stats);
  lista.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.dg !== a.dg) return b.dg - a.dg;
    if (b.gf !== a.gf) return b.gf - a.gf;
    // Resultado directo
    const directos = partidos.filter(p =>
      (p.localId === a.id && p.visitanteId === b.id) ||
      (p.localId === b.id && p.visitanteId === a.id)
    );
    if (directos.length > 0) {
      const d = directos[0];
      const ptsa = d.localId === a.id ? (d.golesLocal > d.golesVisitante ? 3 : d.golesLocal === d.golesVisitante ? 1 : 0) : (d.golesVisitante > d.golesLocal ? 3 : d.golesVisitante === d.golesLocal ? 1 : 0);
      const ptsb = 3 - ptsa === 3 ? 0 : 3 - ptsa;
      if (ptsa !== ptsb) return ptsb - ptsa;
    }
    return 0;
  });
  return lista;
}

function calcularClasificadosGeneral() {
  // Todos los jugadores con sus stats de grupo, ordenados
  const todas = [];
  estado.grupos.forEach(g => {
    const pos = calcularPosiciones(g.id);
    pos.forEach((s, rank) => {
      todas.push({ ...s, grupoId: g.id, grupoNombre: g.nombre, rank });
    });
  });
  // Ordenar: por rank primero, luego pts, dg, gf
  todas.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.dg !== a.dg) return b.dg - a.dg;
    return b.gf - a.gf;
  });
  return todas;
}

// ── PANTALLA 2 — FASE DE GRUPOS ──────────────────────────────

function renderizarFaseGrupos() {
  const tabsEl = document.getElementById('grupos-tabs');
  const contentEl = document.getElementById('grupos-content');
  tabsEl.innerHTML = '';
  contentEl.innerHTML = '';

  estado.grupos.forEach((grupo, idx) => {
    // Tab
    const tab = document.createElement('button');
    tab.className = `grupo-tab ${idx === grupoActivo ? 'active' : ''}`;
    tab.textContent = grupo.nombre;
    tab.onclick = () => {
      grupoActivo = idx;
      renderizarFaseGrupos();
    };
    tabsEl.appendChild(tab);
  });

  const grupo = estado.grupos[grupoActivo];
  if (!grupo) return;

  // Tabla de posiciones
  const posiciones = calcularPosiciones(grupo.id);
  const tablaHTML = `
    <div class="card-glass mb-4 overflow-hidden">
      <div class="px-4 py-3 border-b border-white/8">
        <h3 class="font-bebas text-lg text-gold tracking-wider">${escHtml(grupo.nombre)} — Posiciones</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="standings-table w-full">
          <thead>
            <tr>
              <th>Jugador</th>
              <th>PJ</th><th>PG</th><th>PE</th><th>PP</th>
              <th>GF</th><th>GC</th><th>DG</th><th>PTS</th>
            </tr>
          </thead>
          <tbody>
            ${posiciones.map((s, i) => {
              const j = jugadorPorId(s.id);
              return `<tr class="${i === 0 ? 'leader' : ''}">
                <td>
                  <div class="player-name">${escHtml(j?.nombre || '?')}</div>
                  <div class="text-xs text-gray-400">${escHtml(j?.equipo || '')}</div>
                </td>
                <td>${s.pj}</td><td>${s.pg}</td><td>${s.pe}</td><td>${s.pp}</td>
                <td>${s.gf}</td><td>${s.gc}</td><td>${s.dg > 0 ? '+' : ''}${s.dg}</td>
                <td class="font-bold text-gold">${s.pts}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  contentEl.insertAdjacentHTML('beforeend', tablaHTML);

  // Partidos del grupo
  const partidos = estado.partidos_grupos.filter(p => p.grupoId === grupo.id);
  const partidosHTML = `
    <div class="card-glass overflow-hidden">
      <div class="px-4 py-3 border-b border-white/8">
        <h3 class="font-bebas text-lg text-gold tracking-wider">${escHtml(grupo.nombre)} — Partidos</h3>
      </div>
      <div class="p-3 space-y-2">
        ${partidos.map(p => renderizarMatchCard(p, 'grupo')).join('')}
      </div>
    </div>
  `;
  contentEl.insertAdjacentHTML('beforeend', partidosHTML);

  // Eventos en los match cards
  contentEl.querySelectorAll('.match-card').forEach(card => {
    card.addEventListener('click', () => {
      const pid = card.dataset.partidoId;
      const tipo = card.dataset.tipo;
      abrirModalResultado(pid, tipo);
    });
  });

  // Verificar si todos los partidos de grupos están jugados
  verificarFinFaseGrupos();
}

function renderizarMatchCard(partido, tipo) {
  const local = jugadorPorId(partido.localId);
  const visitante = jugadorPorId(partido.visitanteId);
  const jugado = partido.jugado;

  const scoreLocal = jugado ? partido.golesLocal : null;
  const scoreVisitante = jugado ? partido.golesVisitante : null;

  return `
    <div class="match-card ${jugado ? 'completed' : ''}" data-partido-id="${partido.id}" data-tipo="${tipo}">
      <div class="match-player">
        <div class="match-player-name">${escHtml(local?.nombre || '?')}</div>
        <div class="match-player-team">${escHtml(local?.equipo || '')}</div>
      </div>
      <div class="match-score">
        <div class="score-badge ${!jugado ? 'pending' : ''}">${jugado ? scoreLocal : '-'}</div>
        <span class="text-gray-500 text-xs font-bold">VS</span>
        <div class="score-badge ${!jugado ? 'pending' : ''}">${jugado ? scoreVisitante : '-'}</div>
      </div>
      <div class="match-player text-right">
        <div class="match-player-name">${escHtml(visitante?.nombre || '?')}</div>
        <div class="match-player-team">${escHtml(visitante?.equipo || '')}</div>
      </div>
      <div class="match-status-icon">
        ${jugado
          ? '<i class="fa-solid fa-circle-check text-green-400 text-base"></i>'
          : '<i class="fa-regular fa-circle text-gray-600 text-base"></i>'}
      </div>
    </div>
  `;
}

function verificarFinFaseGrupos() {
  const total = estado.partidos_grupos.length;
  const jugados = estado.partidos_grupos.filter(p => p.jugado).length;
  if (total > 0 && jugados === total && estado.fase === 'fase_grupos') {
    // Mostrar botón de avanzar en el content
    const content = document.getElementById('grupos-content');
    if (!content.querySelector('#btn-avanzar-clasificados')) {
      const btn = document.createElement('button');
      btn.id = 'btn-avanzar-clasificados';
      btn.className = 'btn-primary w-full mt-4';
      btn.innerHTML = '<i class="fa-solid fa-flag-checkered mr-2"></i>Todos los partidos jugados — Definir clasificados';
      btn.onclick = () => {
        estado.fase = 'clasificados';
        guardar();
        mostrarPantalla('clasificados');
        renderizarClasificados();
        actualizarNavTab('dashboard');
      };
      content.appendChild(btn);
    }
  }
}

// ── MODAL RESULTADO ──────────────────────────────────────────

function abrirModalResultado(partidoId, tipo) {
  const partido = tipo === 'grupo'
    ? estado.partidos_grupos.find(p => p.id === partidoId)
    : estado.partidos_eliminacion.find(p => p.id === partidoId);
  if (!partido) return;

  partidoEditando = { partido, tipo };

  const local = jugadorPorId(partido.localId);
  const visitante = jugadorPorId(partido.visitanteId);

  document.getElementById('resultado-local-nombre').textContent = `${local?.nombre || '?'} (${local?.equipo || ''})`;
  document.getElementById('resultado-visitante-nombre').textContent = `${visitante?.nombre || '?'} (${visitante?.equipo || ''})`;
  document.getElementById('input-goles-local').value = partido.jugado ? partido.golesLocal : 0;
  document.getElementById('input-goles-visitante').value = partido.jugado ? partido.golesVisitante : 0;

  const penaSection = document.getElementById('penales-section');
  penaSection.classList.toggle('hidden', tipo !== 'eliminacion');

  if (tipo === 'eliminacion') {
    document.getElementById('penal-local-text').textContent = local?.nombre || '?';
    document.getElementById('penal-visitante-text').textContent = visitante?.nombre || '?';
    // Resetear penales
    document.querySelectorAll('.penal-btn').forEach(b => b.classList.remove('active'));
    if (partido.penalGanadorId) {
      const winner = partido.penalGanadorId === partido.localId ? 'local' : 'visitante';
      document.querySelector(`.penal-btn[data-winner="${winner}"]`)?.classList.add('active');
    }
    // Mostrar/ocultar penales según resultado actual
    const gl = parseInt(document.getElementById('input-goles-local').value) || 0;
    const gv = parseInt(document.getElementById('input-goles-visitante').value) || 0;
    penaSection.classList.toggle('hidden', gl !== gv);
  }

  document.getElementById('modal-resultado').classList.remove('hidden');
  setTimeout(() => document.getElementById('input-goles-local').select(), 100);
}

function guardarResultado() {
  if (!partidoEditando) return;
  const { partido, tipo } = partidoEditando;

  const gl = parseInt(document.getElementById('input-goles-local').value);
  const gv = parseInt(document.getElementById('input-goles-visitante').value);

  if (isNaN(gl) || isNaN(gv) || gl < 0 || gv < 0) {
    mostrarToast('Resultado inválido', 'error');
    return;
  }

  if (tipo === 'grupo') {
    partido.golesLocal = gl;
    partido.golesVisitante = gv;
    partido.jugado = true;
    guardar();
    cerrarModalResultado();
    renderizarFaseGrupos();
    renderizarDashboard();
  } else {
    // Eliminación
    if (gl === gv) {
      const penalActivo = document.querySelector('.penal-btn.active');
      if (!penalActivo) {
        mostrarToast('En empate debes definir quién gana los penales', 'error');
        return;
      }
      const winner = penalActivo.dataset.winner;
      partido.penalGanadorId = winner === 'local' ? partido.localId : partido.visitanteId;
      partido.ganadorId = partido.penalGanadorId;
    } else {
      partido.ganadorId = gl > gv ? partido.localId : partido.visitanteId;
      partido.penalGanadorId = null;
    }
    partido.golesLocal = gl;
    partido.golesVisitante = gv;
    partido.jugado = true;
    guardar();
    cerrarModalResultado();
    avanzarEliminacion();
    renderizarEliminacion();
    renderizarDashboard();
  }
  mostrarToast('Resultado guardado', 'success');
}

function cerrarModalResultado() {
  document.getElementById('modal-resultado').classList.add('hidden');
  partidoEditando = null;
}

// ── PANTALLA 3 — CLASIFICADOS ────────────────────────────────

// IDs de jugadores seleccionados para clasificar (Set)
let _seleccionados = new Set();

function renderizarClasificados() {
  // Restaurar selección desde estado si ya se definieron clasificados
  if (estado.clasificados.length > 0 && _seleccionados.size === 0) {
    _seleccionados = new Set(estado.clasificados);
  }
  const general = calcularClasificadosGeneral();
  const tablaEl = document.getElementById('tabla-clasificados');
  tablaEl.innerHTML = '';

  general.forEach((s, i) => {
    const j = jugadorPorId(s.id);
    const sel = _seleccionados.has(s.id);
    const row = document.createElement('div');
    row.className = `clasificado-row ${sel ? 'selected' : ''}`;
    row.dataset.jugadorId = s.id;
    row.innerHTML = `
      <div class="cl-check"><i class="fa-solid fa-check"></i></div>
      <div class="cl-rank">${i + 1}</div>
      <div class="cl-info">
        <div class="cl-nombre">${escHtml(j?.nombre || '?')}</div>
        <div class="cl-detalle">${escHtml(j?.equipo || '')} &middot; ${escHtml(s.grupoNombre)} &middot; ${s.pj} PJ</div>
      </div>
      <div class="cl-pts">${s.pts}</div>
    `;
    row.addEventListener('click', () => toggleClasificado(s.id));
    tablaEl.appendChild(row);
  });

  // Footer con contador
  const footer = document.createElement('div');
  footer.className = 'clasificados-counter';
  footer.id = 'clasificados-footer';
  footer.innerHTML = `
    <span style="color:var(--gray-text);font-size:12px">seleccionados</span>
    <span class="clasificados-counter-num" id="clasificados-count-num">0</span>
  `;
  tablaEl.appendChild(footer);

  actualizarContadorClasificados();
}

function toggleClasificado(jugadorId) {
  if (_seleccionados.has(jugadorId)) {
    _seleccionados.delete(jugadorId);
  } else {
    _seleccionados.add(jugadorId);
  }
  // Actualizar UI de la fila
  const row = document.querySelector(`.clasificado-row[data-jugador-id="${jugadorId}"]`);
  if (row) row.classList.toggle('selected', _seleccionados.has(jugadorId));
  actualizarContadorClasificados();
}

function seleccionarTopN(n) {
  const general = calcularClasificadosGeneral();
  _seleccionados = new Set(general.slice(0, n).map(s => s.id));
  // Refrescar checkmarks
  document.querySelectorAll('.clasificado-row').forEach(row => {
    row.classList.toggle('selected', _seleccionados.has(row.dataset.jugadorId));
  });
  actualizarContadorClasificados();
}

function actualizarContadorClasificados() {
  const n = _seleccionados.size;
  const countEl = document.getElementById('clasificados-count');
  const countNumEl = document.getElementById('clasificados-count-num');
  const warning = document.getElementById('clasificados-warning');
  const warningMsg = document.getElementById('clasificados-warning-msg');
  const btnArmar = document.getElementById('btn-armar-cruces');

  if (countEl) countEl.textContent = `${n} seleccionados`;
  if (countNumEl) countNumEl.textContent = n;

  // Validar
  const esValido = n >= 2;
  const esParejo = n % 2 === 0;
  const esPotenciaDe2 = esParejo && (n & (n - 1)) === 0;

  if (warning) {
    if (!esValido) {
      warning.classList.remove('hidden');
      warningMsg.textContent = 'Selecciona al menos 2 jugadores.';
    } else if (!esParejo) {
      warning.classList.remove('hidden');
      warningMsg.textContent = `${n} jugadores es impar — necesitas un número par para armar cruces.`;
    } else if (!esPotenciaDe2) {
      warning.classList.remove('hidden');
      warningMsg.textContent = `Con ${n} seleccionados el bracket no será potencia de 2 (4, 8, 16...). Puedes continuar igual.`;
    } else {
      warning.classList.add('hidden');
    }
  }

  if (btnArmar) btnArmar.classList.toggle('hidden', !esValido || !esParejo);
}

function renderizarCruces() {
  const selArr = [..._seleccionados];
  const container = document.getElementById('cruces-container');
  const seccion = document.getElementById('cruces-setup');
  const btnConfirmar = document.getElementById('btn-confirmar-clasificados');

  seccion.classList.remove('hidden');
  btnConfirmar.classList.remove('hidden');
  container.innerHTML = '';

  const numCruces = Math.floor(selArr.length / 2);

  // Auto-proponer cruces: 1v2, 3v4...
  const general = calcularClasificadosGeneral();
  const ordenados = general.filter(s => _seleccionados.has(s.id));

  for (let c = 0; c < numCruces; c++) {
    const autoLocal = ordenados[c * 2]?.id || '';
    const autoVisit = ordenados[c * 2 + 1]?.id || '';
    const div = document.createElement('div');
    div.className = 'cruce-row';
    const opts = selArr.map(jid => {
      const j = jugadorPorId(jid);
      return `<option value="${jid}">${escHtml(j?.nombre || '?')} (${escHtml(j?.equipo || '')})</option>`;
    }).join('');
    div.innerHTML = `
      <div class="cruce-label">Cruce ${c + 1}</div>
      <div class="flex gap-2">
        <select data-cruce="${c}" data-pos="local" class="flex-1">
          <option value="">— Jugador 1 —</option>${opts}
        </select>
        <select data-cruce="${c}" data-pos="visitante" class="flex-1">
          <option value="">— Jugador 2 —</option>${opts}
        </select>
      </div>
    `;
    container.appendChild(div);
    // Pre-seleccionar sugerido
    const selLocal = div.querySelector('[data-pos="local"]');
    const selVisit = div.querySelector('[data-pos="visitante"]');
    if (autoLocal) selLocal.value = autoLocal;
    if (autoVisit) selVisit.value = autoVisit;
  }
}

function confirmarClasificados() {
  const selArr = [..._seleccionados];
  if (selArr.length < 2) { mostrarToast('Selecciona al menos 2 jugadores', 'error'); return; }

  const cruces = [];
  let ok = true;
  const usados = [];
  const numCruces = Math.floor(selArr.length / 2);

  for (let c = 0; c < numCruces; c++) {
    const local = document.querySelector(`[data-cruce="${c}"][data-pos="local"]`)?.value;
    const visitante = document.querySelector(`[data-cruce="${c}"][data-pos="visitante"]`)?.value;
    if (!local || !visitante || local === visitante) { ok = false; break; }
    if (usados.includes(local) || usados.includes(visitante)) { ok = false; break; }
    usados.push(local, visitante);
    cruces.push({ id: nuevoId(), ronda: 0, posicion: c, localId: local, visitanteId: visitante });
  }

  if (!ok) {
    document.getElementById('cruces-validation').classList.remove('hidden');
    document.getElementById('cruces-validation-msg').textContent = 'Cada cruce necesita dos jugadores distintos y sin repetir.';
    return;
  }

  document.getElementById('cruces-validation').classList.add('hidden');
  estado.clasificados = usados;
  estado.cruces = cruces;
  estado.partidos_eliminacion = generarPartidosEliminacion(cruces, 0);
  estado.fase = 'eliminacion';
  guardar();
  mostrarPantalla('eliminacion');
  renderizarEliminacion();
  mostrarToast('Fase eliminatoria iniciada', 'success');
}

// ── PANTALLA 4 — ELIMINACIÓN DIRECTA ─────────────────────────

function generarPartidosEliminacion(cruces, ronda) {
  return cruces.map(c => ({
    id: nuevoId(),
    cruceId: c.id,
    ronda,
    localId: c.localId,
    visitanteId: c.visitanteId,
    golesLocal: null,
    golesVisitante: null,
    ganadorId: null,
    penalGanadorId: null,
    jugado: false
  }));
}

function avanzarEliminacion() {
  const rondaActual = Math.max(...estado.partidos_eliminacion.map(p => p.ronda), 0);
  const partidosRonda = estado.partidos_eliminacion.filter(p => p.ronda === rondaActual);
  const todosJugados = partidosRonda.every(p => p.jugado);

  if (!todosJugados) return;

  // Si quedan 2 partidos → generar semifinales, si 1 → es la final, termina
  const ganadores = partidosRonda.map(p => p.ganadorId).filter(Boolean);

  if (ganadores.length === 1) {
    // Campeón
    estado.campeon = ganadores[0];
    estado.fase = 'finalizado';
    guardar();
    renderizarDashboard();
    return;
  }

  // Generar nueva ronda
  const nuevosPartidos = [];
  for (let i = 0; i < ganadores.length; i += 2) {
    if (ganadores[i + 1]) {
      nuevosPartidos.push({
        id: nuevoId(),
        cruceId: null,
        ronda: rondaActual + 1,
        localId: ganadores[i],
        visitanteId: ganadores[i + 1],
        golesLocal: null,
        golesVisitante: null,
        ganadorId: null,
        penalGanadorId: null,
        jugado: false
      });
    }
  }

  if (nuevosPartidos.length > 0) {
    estado.partidos_eliminacion.push(...nuevosPartidos);
    rondaActiva = rondaActual + 1;
    guardar();
  }
}

function renderizarEliminacion() {
  const tabsEl = document.getElementById('rondas-tabs');
  const container = document.getElementById('bracket-container');
  tabsEl.innerHTML = '';
  container.innerHTML = '';

  if (estado.partidos_eliminacion.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-trophy"></i><p>La fase eliminatoria aún no ha comenzado</p></div>';
    return;
  }

  const rondas = [...new Set(estado.partidos_eliminacion.map(p => p.ronda))].sort((a, b) => a - b);
  const totalJugadores = estado.clasificados.length || 2;

  rondas.forEach(ronda => {
    const n = Math.pow(2, rondas.length - ronda);
    const nombreRonda = NOMBRES_RONDAS[n] || `Ronda ${ronda + 1}`;
    const tab = document.createElement('button');
    tab.className = `ronda-tab ${ronda === rondaActiva ? 'active' : ''}`;
    tab.textContent = nombreRonda;
    tab.onclick = () => { rondaActiva = ronda; renderizarEliminacion(); };
    tabsEl.appendChild(tab);
  });

  const partidosRonda = estado.partidos_eliminacion.filter(p => p.ronda === rondaActiva);
  const n = Math.pow(2, rondas.length - rondaActiva);
  const nombreRonda = NOMBRES_RONDAS[n] || `Ronda ${rondaActiva + 1}`;

  container.innerHTML = `<p class="bracket-phase-label">${escHtml(nombreRonda)}</p>`;

  const roundDiv = document.createElement('div');
  roundDiv.className = 'bracket-round';

  partidosRonda.forEach(p => {
    const local = jugadorPorId(p.localId);
    const visitante = jugadorPorId(p.visitanteId);
    const localGanador = p.jugado && p.ganadorId === p.localId;
    const visitanteGanador = p.jugado && p.ganadorId === p.visitanteId;

    const matchEl = document.createElement('div');
    matchEl.className = `bracket-match ${p.jugado ? 'completed' : ''}`;
    matchEl.dataset.partidoId = p.id;
    matchEl.dataset.tipo = 'eliminacion';
    matchEl.innerHTML = `
      <div class="bracket-team ${localGanador ? 'winner' : ''}">
        <div class="bracket-team-name">${escHtml(local?.nombre || 'Por definir')}<div class="text-xs text-gray-400 font-normal">${escHtml(local?.equipo || '')}</div></div>
        <div class="bracket-team-score">${p.jugado ? p.golesLocal : '—'}</div>
      </div>
      <div class="bracket-team ${visitanteGanador ? 'winner' : ''}">
        <div class="bracket-team-name">${escHtml(visitante?.nombre || 'Por definir')}<div class="text-xs text-gray-400 font-normal">${escHtml(visitante?.equipo || '')}</div></div>
        <div class="bracket-team-score">${p.jugado ? p.golesVisitante : '—'}</div>
      </div>
      ${p.penalGanadorId ? `<div class="text-xs text-center text-yellow-400 py-1 border-t border-white/8">Penales: ${escHtml(jugadorPorId(p.penalGanadorId)?.nombre || '?')}</div>` : ''}
    `;
    matchEl.addEventListener('click', () => abrirModalResultado(p.id, 'eliminacion'));
    roundDiv.appendChild(matchEl);
  });

  container.appendChild(roundDiv);

  // Campeón
  if (estado.campeon && estado.fase === 'finalizado') {
    const campeon = jugadorPorId(estado.campeon);
    const div = document.createElement('div');
    div.className = 'campeon-card mt-6 p-6 text-center';
    div.innerHTML = `
      <i class="fa-solid fa-trophy text-5xl text-gold mb-3 block"></i>
      <p class="font-bebas text-4xl text-gold tracking-widest glow-gold">CAMPEÓN</p>
      <p class="font-bebas text-3xl text-white mt-1">${escHtml(campeon?.nombre || '?')}</p>
      <p class="text-gold/70 text-sm mt-1">${escHtml(campeon?.equipo || '')}</p>
    `;
    container.appendChild(div);
  }
}

// ── PANTALLA 5 — DASHBOARD ───────────────────────────────────

function renderizarDashboard() {
  const faseTexto = document.getElementById('dashboard-fase-texto');
  if (faseTexto) faseTexto.textContent = FASES_TEXTO[estado.fase] || estado.fase;

  // Campeón
  const campeonDiv = document.getElementById('dashboard-campeon');
  if (estado.campeon && estado.fase === 'finalizado') {
    const campeon = jugadorPorId(estado.campeon);
    document.getElementById('campeon-nombre').textContent = campeon?.nombre || '?';
    document.getElementById('campeon-equipo').textContent = campeon?.equipo || '';
    campeonDiv.classList.remove('hidden');
    lanzarConfetti();
  } else {
    campeonDiv.classList.add('hidden');
  }

  // Grupos resumidos
  const gruposDiv = document.getElementById('dashboard-grupos');
  gruposDiv.innerHTML = '';
  if (estado.grupos.length > 0) {
    const titulo = document.createElement('h3');
    titulo.className = 'font-bebas text-xl text-gold tracking-wider mb-3';
    titulo.textContent = 'FASE DE GRUPOS';
    gruposDiv.appendChild(titulo);

    estado.grupos.forEach(g => {
      const pos = calcularPosiciones(g.id);
      const wrap = document.createElement('div');
      wrap.className = 'card-glass mb-3 overflow-hidden';
      wrap.innerHTML = `
        <div class="px-4 py-2 border-b border-white/8">
          <span class="font-bebas text-base text-gold tracking-wider">${escHtml(g.nombre)}</span>
        </div>
        <div class="overflow-x-auto">
          <table class="standings-table">
            <thead><tr>
              <th>Jugador</th><th>PTS</th><th>DG</th>
            </tr></thead>
            <tbody>
              ${pos.slice(0, 4).map((s, i) => {
                const j = jugadorPorId(s.id);
                return `<tr class="${i === 0 ? 'leader' : ''}">
                  <td><div class="player-name">${escHtml(j?.nombre || '?')}</div>
                      <div class="text-xs text-gray-400">${escHtml(j?.equipo || '')}</div></td>
                  <td class="font-bold text-gold">${s.pts}</td>
                  <td>${s.dg > 0 ? '+' : ''}${s.dg}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
      gruposDiv.appendChild(wrap);
    });
  }

  // Llave resumida
  const llaveDiv = document.getElementById('dashboard-llave');
  llaveDiv.innerHTML = '';
  if (estado.partidos_eliminacion.length > 0) {
    const titulo = document.createElement('h3');
    titulo.className = 'font-bebas text-xl text-gold tracking-wider mb-3 mt-2';
    titulo.textContent = 'ELIMINACIÓN DIRECTA';
    llaveDiv.appendChild(titulo);

    const rondas = [...new Set(estado.partidos_eliminacion.map(p => p.ronda))].sort((a, b) => a - b);
    rondas.forEach(ronda => {
      const partidos = estado.partidos_eliminacion.filter(p => p.ronda === ronda);
      const totalEq = Math.pow(2, rondas.length - ronda);
      const nombreRonda = NOMBRES_RONDAS[totalEq] || `Ronda ${ronda + 1}`;
      const seccion = document.createElement('div');
      seccion.className = 'mb-4';
      seccion.innerHTML = `<p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">${escHtml(nombreRonda)}</p>`;
      partidos.forEach(p => {
        const local = jugadorPorId(p.localId);
        const visitante = jugadorPorId(p.visitanteId);
        const item = document.createElement('div');
        item.className = `card-glass p-3 mb-2 flex items-center justify-between gap-2 ${p.jugado ? 'border-green-500/20' : ''}`;
        item.innerHTML = `
          <div class="flex-1 min-w-0">
            <div class="text-sm font-semibold ${p.ganadorId === p.localId ? 'text-gold' : ''}">${escHtml(local?.nombre || '?')}</div>
            <div class="text-xs text-gray-400">${escHtml(local?.equipo || '')}</div>
          </div>
          ${p.jugado
            ? `<div class="flex items-center gap-1 flex-shrink-0">
                <span class="font-bebas text-xl text-gold">${p.golesLocal}</span>
                <span class="text-gray-500 text-xs">-</span>
                <span class="font-bebas text-xl text-gold">${p.golesVisitante}</span>
               </div>`
            : `<div class="text-gray-500 text-sm flex-shrink-0">VS</div>`}
          <div class="flex-1 min-w-0 text-right">
            <div class="text-sm font-semibold ${p.ganadorId === p.visitanteId ? 'text-gold' : ''}">${escHtml(visitante?.nombre || '?')}</div>
            <div class="text-xs text-gray-400">${escHtml(visitante?.equipo || '')}</div>
          </div>
        `;
        seccion.appendChild(item);
      });
      llaveDiv.appendChild(seccion);
    });
  }

  actualizarHeader();
}

// ── CONFETTI ─────────────────────────────────────────────────

function lanzarConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  const colores = ['#c9a84c', '#e8c96d', '#ffffff', '#e63946', '#1a3a6e'];
  const particulas = Array.from({ length: 80 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    r: Math.random() * 4 + 2,
    color: colores[Math.floor(Math.random() * colores.length)],
    speed: Math.random() * 2 + 1,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.2,
    opacity: 1
  }));

  let frame = 0;
  function animar() {
    if (frame > 200) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particulas.forEach(p => {
      p.y += p.speed;
      p.x += Math.sin(p.angle) * 0.5;
      p.angle += p.spin;
      p.opacity = Math.max(0, 1 - frame / 200);
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      if (p.y > canvas.height) p.y = 0;
    });
    frame++;
    requestAnimationFrame(animar);
  }
  animar();
}

// ── EXPORTAR / IMPORTAR ──────────────────────────────────────

function exportarJSON() {
  try {
    const blob = new Blob([JSON.stringify(estado, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `torneo_${(estado.meta.nombre || 'fc26').replace(/\s+/g, '_')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarToast('Torneo exportado', 'success');
  } catch (e) {
    mostrarToast('Error al exportar', 'error');
  }
}

function importarJSON(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const datos = JSON.parse(e.target.result);
      estado = Object.assign(crearEstadoVacio(), datos);
      guardar();
      irAFaseCorrecta();
      mostrarToast('Torneo importado correctamente', 'success');
    } catch (err) {
      mostrarToast('Archivo JSON inválido', 'error');
    }
  };
  reader.readAsText(file);
}

function copiarResumen() {
  let texto = `== ${estado.meta.nombre || 'Torneo FC 26'} ==\n\n`;
  texto += `Fase: ${FASES_TEXTO[estado.fase]}\n\n`;

  if (estado.grupos.length > 0) {
    texto += '=== FASE DE GRUPOS ===\n';
    estado.grupos.forEach(g => {
      texto += `\n${g.nombre}:\n`;
      const pos = calcularPosiciones(g.id);
      pos.forEach((s, i) => {
        const j = jugadorPorId(s.id);
        texto += `  ${i + 1}. ${j?.nombre} (${j?.equipo}) — ${s.pts} pts\n`;
      });
    });
  }

  if (estado.partidos_eliminacion.length > 0) {
    texto += '\n=== ELIMINACIÓN DIRECTA ===\n';
    estado.partidos_eliminacion.filter(p => p.jugado).forEach(p => {
      const local = jugadorPorId(p.localId);
      const visitante = jugadorPorId(p.visitanteId);
      texto += `  ${local?.nombre} ${p.golesLocal}-${p.golesVisitante} ${visitante?.nombre}\n`;
    });
  }

  if (estado.campeon) {
    const c = jugadorPorId(estado.campeon);
    texto += `\n=== CAMPEON: ${c?.nombre} (${c?.equipo}) ===\n`;
  }

  try {
    navigator.clipboard.writeText(texto).then(() => mostrarToast('Resumen copiado', 'success'));
  } catch (e) {
    mostrarToast('No se pudo copiar', 'error');
  }
}

// ── Seguridad HTML ───────────────────────────────────────────

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── INICIALIZACIÓN ───────────────────────────────────────────

function inicializar() {
  const hayDatos = cargar();
  aplicarTema(estado.meta.tema);

  if (!hayDatos || estado.fase === 'setup') {
    mostrarPantalla('setup');
    inicializarSetup();
  } else {
    // Mostrar header y nav siempre que hay datos
    document.getElementById('app-header').classList.remove('hidden');
    document.getElementById('bottom-nav').classList.remove('hidden');
    irAFaseCorrecta();
    // Renderizar pantallas en background
    if (['fase_grupos', 'clasificados', 'eliminacion', 'finalizado'].includes(estado.fase)) {
      renderizarFaseGrupos();
      renderizarEliminacion();
      if (estado.fase === 'clasificados') renderizarClasificados();
    }
  }

  vincularEventos();
}

// ── EVENTOS ──────────────────────────────────────────────────

function vincularEventos() {

  // Tema toggle header
  document.getElementById('btn-theme-toggle')?.addEventListener('click', toggleTema);

  // Tema toggle config
  document.getElementById('btn-theme-config')?.addEventListener('click', toggleTema);

  // ── SETUP ──
  document.getElementById('btn-jugadores-menos')?.addEventListener('click', () => {
    if (_numJugadores > 4) { _numJugadores--; document.getElementById('input-num-jugadores').value = _numJugadores; renderizarListaJugadores(); }
  });

  document.getElementById('btn-jugadores-mas')?.addEventListener('click', () => {
    if (_numJugadores < 32) { _numJugadores++; document.getElementById('input-num-jugadores').value = _numJugadores; renderizarListaJugadores(); }
  });

  document.getElementById('btn-confirmar-jugadores')?.addEventListener('click', confirmarJugadores);

  document.getElementById('input-torneo-nombre')?.addEventListener('input', () => {
    document.getElementById('input-torneo-nombre').classList.remove('error');
  });

  // Logo
  document.getElementById('input-logo')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      estado.meta.logo = ev.target.result;
      guardar();
      mostrarPreviewLogo(ev.target.result);
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('btn-remove-logo')?.addEventListener('click', quitarLogo);

  // Importar JSON desde pantalla de setup (app recién abierta sin datos)
  document.getElementById('input-importar-setup')?.addEventListener('change', e => {
    importarJSON(e.target.files[0]);
    e.target.value = '';
  });

  // ── EQUIPOS ──
  document.getElementById('btn-modo-aleatorio')?.addEventListener('click', () => {
    _modoEquipos = 'aleatorio';
    document.getElementById('btn-modo-aleatorio').classList.add('active');
    document.getElementById('btn-modo-manual').classList.remove('active');
    renderizarAsignacionEquipos();
  });

  document.getElementById('btn-modo-manual')?.addEventListener('click', () => {
    _modoEquipos = 'manual';
    document.getElementById('btn-modo-manual').classList.add('active');
    document.getElementById('btn-modo-aleatorio').classList.remove('active');
    renderizarAsignacionEquipos();
  });

  document.getElementById('btn-confirmar-equipos')?.addEventListener('click', confirmarEquipos);
  document.getElementById('btn-back-setup')?.addEventListener('click', () => {
    estado.fase = 'setup';
    mostrarPantalla('setup');
    inicializarSetup();
  });

  document.getElementById('btn-add-equipo-extra')?.addEventListener('click', () => {
    const inp = document.getElementById('input-equipo-extra');
    const val = inp.value.trim();
    if (val) {
      _equiposExtra.push(val);
      inp.value = '';
      const lista = document.getElementById('equipos-extra-lista');
      const item = document.createElement('div');
      item.className = 'text-sm text-green-400 flex items-center gap-2';
      item.innerHTML = `<i class="fa-solid fa-check text-xs"></i>${escHtml(val)}`;
      lista.appendChild(item);
      renderizarAsignacionEquipos();
    }
  });

  // ── GRUPOS CONFIG ──
  document.getElementById('btn-grupos-menos')?.addEventListener('click', () => {
    if (_numGrupos > 1) { _numGrupos--; document.getElementById('input-num-grupos').value = _numGrupos; actualizarDistribucion(); renderizarCabezas(); }
  });

  document.getElementById('btn-grupos-mas')?.addEventListener('click', () => {
    if (_numGrupos < estado.jugadores.length) { _numGrupos++; document.getElementById('input-num-grupos').value = _numGrupos; actualizarDistribucion(); renderizarCabezas(); }
  });

  document.getElementById('btn-modo-sorteo')?.addEventListener('click', () => {
    _modoSorteo = 'sorteo';
    document.getElementById('btn-modo-sorteo').classList.add('active');
    document.getElementById('btn-modo-manual-grupos').classList.remove('active');
    document.getElementById('asignacion-manual-grupos').classList.add('hidden');
    document.getElementById('btn-realizar-sorteo').innerHTML = '<i class="fa-solid fa-shuffle mr-2"></i>Realizar sorteo';
    document.getElementById('btn-realizar-sorteo').onclick = realizarSorteo;
  });

  document.getElementById('btn-modo-manual-grupos')?.addEventListener('click', () => {
    _modoSorteo = 'manual';
    document.getElementById('btn-modo-manual-grupos').classList.add('active');
    document.getElementById('btn-modo-sorteo').classList.remove('active');
    document.getElementById('asignacion-manual-grupos').classList.remove('hidden');
    renderizarAsignacionManual();
    document.getElementById('btn-realizar-sorteo').innerHTML = '<i class="fa-solid fa-check mr-2"></i>Confirmar grupos';
    document.getElementById('btn-realizar-sorteo').onclick = aplicarGruposManual;
  });

  document.getElementById('btn-back-equipos')?.addEventListener('click', () => {
    estado.fase = 'equipos';
    mostrarPantalla('equipos');
    inicializarEquipos();
  });

  // Inicializar onclick del botón de sorteo (modo sorteo por defecto)
  const btnSorteo = document.getElementById('btn-realizar-sorteo');
  if (btnSorteo) btnSorteo.onclick = realizarSorteo;

  // ── MODAL SORTEO ──
  document.getElementById('btn-sorteo-cancelar')?.addEventListener('click', () => {
    document.getElementById('modal-sorteo').classList.add('hidden');
  });

  document.getElementById('modal-sorteo')?.addEventListener('click', e => {
    if (e.target === document.getElementById('modal-sorteo')) {
      document.getElementById('modal-sorteo').classList.add('hidden');
    }
  });

  // ── MODAL RESULTADO ──
  document.getElementById('btn-close-resultado')?.addEventListener('click', cerrarModalResultado);

  document.getElementById('modal-resultado')?.addEventListener('click', e => {
    if (e.target === document.getElementById('modal-resultado')) cerrarModalResultado();
  });

  document.getElementById('btn-guardar-resultado')?.addEventListener('click', guardarResultado);

  // Penales
  document.querySelectorAll('.penal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.penal-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Mostrar/ocultar penales al cambiar goles
  ['input-goles-local', 'input-goles-visitante'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => {
      if (partidoEditando?.tipo === 'eliminacion') {
        const gl = parseInt(document.getElementById('input-goles-local').value) || 0;
        const gv = parseInt(document.getElementById('input-goles-visitante').value) || 0;
        document.getElementById('penales-section').classList.toggle('hidden', gl !== gv);
      }
    });
  });

  // ── SORTEAR EQUIPOS ──
  document.getElementById('btn-sortear-equipos')?.addEventListener('click', () => {
    // Limpiar equipos para un sorteo limpio si ya había
    estado.jugadores.forEach(j => { j.equipo = ''; });
    mostrarAnimacionSorteoEquipos();
  });

  document.getElementById('btn-sorteo-eq-confirmar')?.addEventListener('click', () => {
    // Aplicar equipos sorteados a los jugadores
    if (_equiposTempSorteados) {
      estado.jugadores.forEach((j, i) => {
        j.equipo = _equiposTempSorteados[i] || `Equipo ${i + 1}`;
      });
      _equiposTempSorteados = null;
    }
    document.getElementById('modal-sorteo-equipos').classList.add('hidden');
    renderizarAsignacionEquipos();
    mostrarToast('Equipos asignados. Confirma para continuar.', 'success');
  });

  document.getElementById('btn-sorteo-eq-cancelar')?.addEventListener('click', () => {
    document.getElementById('modal-sorteo-equipos').classList.add('hidden');
    _equiposTempSorteados = null;
  });

  document.getElementById('modal-sorteo-equipos')?.addEventListener('click', e => {
    if (e.target === document.getElementById('modal-sorteo-equipos')) {
      document.getElementById('modal-sorteo-equipos').classList.add('hidden');
      _equiposTempSorteados = null;
    }
  });

  // ── CLASIFICADOS ──
  document.querySelectorAll('.btn-clasificados-num').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-clasificados-num').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const n = btn.dataset.n;
      const total = estado.jugadores.length;
      if (n === 'all') {
        seleccionarTopN(total);
      } else {
        const num = Math.min(parseInt(n), total);
        seleccionarTopN(num);
      }
    });
  });

  document.getElementById('btn-armar-cruces')?.addEventListener('click', renderizarCruces);

  document.getElementById('btn-confirmar-clasificados')?.addEventListener('click', confirmarClasificados);

  // ── NAV TABS ──
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const t = tab.dataset.tab;
      actualizarNavTab(t);
      if (t === 'dashboard') { mostrarPantalla('dashboard'); renderizarDashboard(); }
      else if (t === 'fase-grupos') {
        if (['fase_grupos', 'clasificados', 'eliminacion', 'finalizado'].includes(estado.fase)) {
          mostrarPantalla('fase-grupos');
          renderizarFaseGrupos();
        } else {
          mostrarToast('La fase de grupos aún no ha comenzado', 'error');
        }
      }
      else if (t === 'eliminacion') {
        if (['eliminacion', 'finalizado'].includes(estado.fase)) {
          mostrarPantalla('eliminacion');
          renderizarEliminacion();
        } else if (estado.fase === 'clasificados') {
          mostrarPantalla('clasificados');
          renderizarClasificados();
        } else {
          mostrarToast('La fase eliminatoria aún no ha comenzado', 'error');
        }
      }
      else if (t === 'config') { mostrarPantalla('config'); actualizarHeader(); }
    });
  });

  // ── CONFIG ──
  document.getElementById('btn-exportar')?.addEventListener('click', exportarJSON);

  document.getElementById('input-importar')?.addEventListener('change', e => {
    importarJSON(e.target.files[0]);
    e.target.value = '';
  });

  document.getElementById('btn-compartir')?.addEventListener('click', copiarResumen);

  document.getElementById('btn-reiniciar')?.addEventListener('click', () => {
    mostrarConfirm(
      '¿REINICIAR TORNEO?',
      'Se borrarán todos los datos. Esta acción no se puede deshacer.',
      () => {
        limpiarStorage();
        location.reload();
      }
    );
  });

  // ── MODAL CONFIRM ──
  document.getElementById('btn-confirm-cancel')?.addEventListener('click', () => {
    document.getElementById('modal-confirm').classList.add('hidden');
    _confirmCallback = null;
  });

  document.getElementById('btn-confirm-ok')?.addEventListener('click', () => {
    document.getElementById('modal-confirm').classList.add('hidden');
    if (_confirmCallback) { _confirmCallback(); _confirmCallback = null; }
  });

  document.getElementById('modal-confirm')?.addEventListener('click', e => {
    if (e.target === document.getElementById('modal-confirm')) {
      document.getElementById('modal-confirm').classList.add('hidden');
      _confirmCallback = null;
    }
  });
}

// ── ARRANQUE ─────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', inicializar);
