import { getEstadoJogo, getPesquisaAtual, obterNaveSelecionada, profiling } from '../world/mundo.js';
import { getMemoria, fogProfiling } from '../world/nevoa.js';
import { getCamera } from '../core/player.js';

const THROTTLE_MS = 200;

export const cheats = {
  construcaoInstantanea: false,
  recursosInfinitos: false,
  pesquisaInstantanea: false,
  visaoTotal: false,
  velocidadeNave: false,
};

export function getRendererPreference() {
  return localStorage.getItem('renderer') || 'webgl';
}

export function setRendererPreference(val) {
  localStorage.setItem('renderer', val);
}

function formatarTempo(ms) {
  if (!ms || ms <= 0) return '0s';
  const s = Math.ceil(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m${s % 60}s`;
}

function corProf(v) {
  if (v > 5) return '#ff5050';
  if (v > 2) return '#ffcc40';
  return '#60ff90';
}

function corFps(fps) {
  if (fps >= 50) return '#60ff90';
  if (fps >= 30) return '#ffcc40';
  return '#ff5050';
}

function el(tag, styles, text) {
  const e = document.createElement(tag);
  if (styles) Object.assign(e.style, styles);
  if (text) e.textContent = text;
  return e;
}

function criarSecao(parent, titulo, ids, linhas) {
  const section = el('div', { marginBottom: '6px' });
  const t = el('div', { color: '#4a90cc', fontSize: '9px', marginBottom: '2px', letterSpacing: '1px' }, titulo);
  section.appendChild(t);
  for (const id of ids) {
    const row = el('div', { padding: '1px 0 1px 4px' });
    row.id = id;
    section.appendChild(row);
    linhas[id] = row;
  }
  parent.appendChild(section);
  return section;
}

function criarCheat(parent, elId, label, cheatKey) {
  const lbl = el('label', {
    display: 'block', padding: '2px 0', cursor: 'pointer',
    color: '#a0d8b0', fontSize: '10px',
  });
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.id = elId;
  cb.style.marginRight = '6px';
  cb.style.accentColor = '#60ff90';
  cb.addEventListener('change', () => { cheats[cheatKey] = cb.checked; });
  lbl.appendChild(cb);
  lbl.appendChild(document.createTextNode(label));
  parent.appendChild(lbl);
}

function criarPopupHTML() {
  const popup = el('div', {
    display: 'none', position: 'fixed', top: '40px', right: '10px',
    width: '320px', maxHeight: 'calc(100vh - 60px)', overflowY: 'auto',
    background: 'rgba(8, 14, 26, 0.95)', border: '1px solid #1a3060',
    borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px',
    color: '#a0d8b0', zIndex: '9999', pointerEvents: 'auto',
    userSelect: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
  });
  popup.id = 'debug-popup';

  // Header
  const header = el('div', {
    background: '#101830', padding: '6px 12px', borderBottom: '1px solid #1a3060',
    borderRadius: '6px 6px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  });
  header.appendChild(el('span', { color: '#60ccff', fontSize: '12px', fontWeight: 'bold' }, 'DEBUG'));
  header.appendChild(el('span', { color: '#556', fontSize: '10px' }, 'F3 fechar'));
  popup.appendChild(header);

  const body = el('div', { padding: '8px 12px' });
  popup.appendChild(body);

  const linhas = {};

  // Renderer section
  const rendSec = el('div', { marginBottom: '8px' });
  rendSec.appendChild(el('div', { color: '#4a90cc', fontSize: '9px', marginBottom: '4px', letterSpacing: '1px' }, 'RENDERER'));
  const rendRow = el('div', { display: 'flex', gap: '6px', alignItems: 'center' });

  const select = document.createElement('select');
  select.id = 'dbg-renderer';
  Object.assign(select.style, { background: '#0a1020', color: '#60ccff', border: '1px solid #2a4070', borderRadius: '3px', padding: '2px 6px', fontFamily: 'monospace', fontSize: '10px' });
  for (const [val, label] of [['webgl', 'WebGL (Hardware)'], ['webgpu', 'WebGPU (Hardware)']]) {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = label;
    select.appendChild(opt);
  }
  select.value = getRendererPreference();
  rendRow.appendChild(select);

  const btn = el('button', { background: '#1a3060', color: '#60ccff', border: '1px solid #2a4070', borderRadius: '3px', padding: '2px 8px', fontFamily: 'monospace', fontSize: '10px', cursor: 'pointer' }, 'Aplicar');
  btn.addEventListener('click', () => {
    setRendererPreference(select.value);
    window.location.reload();
  });
  rendRow.appendChild(btn);

  const rendAtual = el('span', { color: '#556', fontSize: '9px' });
  rendAtual.id = 'dbg-renderer-atual';
  rendRow.appendChild(rendAtual);

  rendSec.appendChild(rendRow);
  body.appendChild(rendSec);

  // Seções de dados
  criarSecao(body, 'PERFORMANCE', ['dbg-fps', 'dbg-camera', 'dbg-mundo'], linhas);
  criarSecao(body, 'ENTIDADES', ['dbg-planetas', 'dbg-naves', 'dbg-sistemas', 'dbg-fontes'], linhas);
  criarSecao(body, 'ECONOMIA', ['dbg-recursos', 'dbg-pesquisa', 'dbg-estado'], linhas);
  criarSecao(body, 'SELECAO', ['dbg-selecao', 'dbg-construcao'], linhas);
  criarSecao(body, 'RENDER', ['dbg-neblina', 'dbg-children'], linhas);

  // Profiling com sub-itens indentados
  const profSec = el('div', { marginBottom: '6px' });
  const profTitle = el('div', { color: '#4a90cc', fontSize: '9px', marginBottom: '2px', letterSpacing: '1px' });
  profTitle.textContent = 'PROFILING ';
  const profSub = el('span', { color: '#556' });
  profSub.textContent = '(ms/frame)';
  profTitle.appendChild(profSub);
  profSec.appendChild(profTitle);

  const profIds = ['dbg-prof-logica', 'dbg-prof-fundo', 'dbg-prof-fog', 'dbg-prof-fog-draw', 'dbg-prof-fog-upload', 'dbg-prof-planetas', 'dbg-prof-render', 'dbg-prof-total'];
  for (const id of profIds) {
    const indent = id.includes('fog-draw') || id.includes('fog-upload') ? '16px' : '4px';
    const bold = id.includes('total') ? 'bold' : 'normal';
    const row = el('div', { padding: '1px 0', paddingLeft: indent, fontWeight: bold });
    row.id = id;
    profSec.appendChild(row);
    linhas[id] = row;
  }
  body.appendChild(profSec);

  // Cheats
  const cheatSec = el('div', { marginBottom: '6px' });
  cheatSec.appendChild(el('div', { color: '#ffcc40', fontSize: '9px', marginBottom: '2px', letterSpacing: '1px' }, 'CHEATS'));
  criarCheat(cheatSec, 'cheat-construcao', 'Construcao instantanea [1]', 'construcaoInstantanea');
  criarCheat(cheatSec, 'cheat-recursos', 'Recursos infinitos [2]', 'recursosInfinitos');
  criarCheat(cheatSec, 'cheat-pesquisa', 'Pesquisa instantanea [3]', 'pesquisaInstantanea');
  criarCheat(cheatSec, 'cheat-visao', 'Visao total [4]', 'visaoTotal');
  criarCheat(cheatSec, 'cheat-velocidade', 'Nave 10x velocidade [5]', 'velocidadeNave');
  body.appendChild(cheatSec);

  // Block events from reaching game canvas
  for (const evt of ['mousedown', 'mouseup', 'click', 'wheel']) {
    popup.addEventListener(evt, e => e.stopPropagation());
  }

  document.body.appendChild(popup);
  popup._linhas = linhas;
  return popup;
}

let _popup = null;
let _ultimaAtualizacao = 0;

export function criarDebug() {
  _popup = criarPopupHTML();
  return _popup;
}

export function toggleDebug() {
  if (!_popup) return;
  _popup.style.display = _popup.style.display === 'none' ? 'block' : 'none';
}

export function processarTeclaDebug(e) {
  if (e.code === 'F3') {
    e.preventDefault();
    toggleDebug();
    return;
  }

  if (!_popup || _popup.style.display === 'none') return;

  const cheatKeys = {
    'Digit1': ['construcaoInstantanea', 'cheat-construcao'],
    'Digit2': ['recursosInfinitos', 'cheat-recursos'],
    'Digit3': ['pesquisaInstantanea', 'cheat-pesquisa'],
    'Digit4': ['visaoTotal', 'cheat-visao'],
    'Digit5': ['velocidadeNave', 'cheat-velocidade'],
  };
  const ck = cheatKeys[e.code];
  if (ck) {
    cheats[ck[0]] = !cheats[ck[0]];
    const cb = _popup.querySelector(`#${ck[1]}`);
    if (cb) cb.checked = cheats[ck[0]];
  }
}

function setText(id, text, color) {
  const e = _popup._linhas[id] || _popup.querySelector(`#${id}`);
  if (!e) return;
  e.textContent = text;
  if (color) e.style.color = color;
}

function setProf(id, label, value) {
  setText(id, `${label}: ${value.toFixed(2)}`, corProf(value));
}

export function atualizarDebug(debug, mundo, app) {
  if (!_popup || _popup.style.display === 'none') return;

  const agora = performance.now();
  if (agora - _ultimaAtualizacao < THROTTLE_MS) return;
  _ultimaAtualizacao = agora;

  const cam = getCamera();
  const fps = Math.round(app.ticker.FPS);
  const delta = app.ticker.deltaMS.toFixed(1);

  const rendererType = app.renderer?.name || app.renderer?.constructor?.name || '?';
  setText('dbg-renderer-atual', `(${rendererType})`);

  setText('dbg-fps', `FPS ${fps}  delta ${delta}ms`, corFps(fps));
  setText('dbg-camera', `cam ${Math.round(cam.x)},${Math.round(cam.y)}  zoom ${cam.zoom.toFixed(2)}x`);
  setText('dbg-mundo', `mundo ${mundo.tamanho}px`);

  const planetasVis = mundo.planetas.filter(p => p._visivelAoJogador).length;
  const navesVis = mundo.naves.filter(n => n.gfx.visible).length;
  setText('dbg-planetas', `planetas ${planetasVis}/${mundo.planetas.length}`);
  setText('dbg-naves', `naves ${navesVis}/${mundo.naves.length}`);
  setText('dbg-sistemas', `sistemas ${mundo.sistemas.length}  sois ${mundo.sois.length}`);
  setText('dbg-fontes', `fontes visao ${mundo.fontesVisao.length}`);

  const r = mundo.recursosJogador;
  setText('dbg-recursos', `C:${Math.floor(r.comum)} R:${Math.floor(r.raro)} F:${Math.floor(r.combustivel)}`);
  const pesq = getPesquisaAtual(mundo);
  setText('dbg-pesquisa', pesq ? `pesq ${pesq.categoria} T${pesq.tier} (${formatarTempo(pesq.tempoRestanteMs)})` : 'pesq --');
  setText('dbg-estado', `estado: ${getEstadoJogo()}`);

  const naveSel = obterNaveSelecionada(mundo);
  const planetaSel = mundo.planetas.find(p => p.dados.selecionado);
  if (naveSel) {
    setText('dbg-selecao', `nave ${naveSel.tipo} T${naveSel.tier} [${naveSel.estado}]`);
  } else if (planetaSel) {
    const d = planetaSel.dados;
    setText('dbg-selecao', `planeta ${d.dono} fab:${d.fabricas} inf:${d.infraestrutura}`);
  } else {
    setText('dbg-selecao', '--');
  }

  if (planetaSel?.dados.construcaoAtual) {
    const c = planetaSel.dados.construcaoAtual;
    setText('dbg-construcao', `${c.tipo} T${c.tierDestino} (${formatarTempo(c.tempoRestanteMs)})`);
  } else if (planetaSel?.dados.producaoNave) {
    const p = planetaSel.dados.producaoNave;
    setText('dbg-construcao', `${p.tipoNave} T${p.tier} (${formatarTempo(p.tempoRestanteMs)})`);
  } else {
    setText('dbg-construcao', '--');
  }

  let memoriasConhecidas = 0;
  for (const planeta of mundo.planetas) {
    const mem = getMemoria(planeta);
    if (mem?.conhecida) memoriasConhecidas++;
  }
  setText('dbg-neblina', `memorias ${memoriasConhecidas}/${mundo.planetas.length}`);
  setText('dbg-children', `children mundo:${mundo.container.children.length} naves:${mundo.navesContainer.children.length}`);

  setProf('dbg-prof-logica', 'logica', profiling.logica);
  setProf('dbg-prof-fundo', 'fundo ', profiling.fundo);
  setProf('dbg-prof-fog', 'fog   ', profiling.fog);
  setProf('dbg-prof-fog-draw', 'draw', fogProfiling.canvas);
  setProf('dbg-prof-fog-upload', 'upld', fogProfiling.upload);
  setProf('dbg-prof-planetas', 'planet', profiling.planetas);
  setProf('dbg-prof-render', 'render', profiling.render);
  setProf('dbg-prof-total', 'TOTAL ', profiling.total);

  if (cheats.recursosInfinitos) {
    mundo.recursosJogador.comum = Math.max(mundo.recursosJogador.comum, 9999);
    mundo.recursosJogador.raro = Math.max(mundo.recursosJogador.raro, 9999);
    mundo.recursosJogador.combustivel = Math.max(mundo.recursosJogador.combustivel, 9999);
  }
}
