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

function e(tag, styles, text) {
  const el = document.createElement(tag);
  if (styles) Object.assign(el.style, styles);
  if (text) el.textContent = text;
  return el;
}

function criarSecao(parent, titulo, ids, linhas) {
  const sec = e('div', { marginBottom: '12px' });
  sec.appendChild(e('div', {
    color: '#4a90cc', fontSize: '10px', marginBottom: '4px',
    letterSpacing: '1px', borderBottom: '1px solid #1a3060', paddingBottom: '3px',
  }, titulo));
  for (const id of ids) {
    const row = e('div', { padding: '2px 0 2px 6px', fontSize: '11px' });
    row.id = id;
    sec.appendChild(row);
    linhas[id] = row;
  }
  parent.appendChild(sec);
}

function criarCheat(parent, elId, label, cheatKey) {
  const lbl = e('label', {
    display: 'flex', alignItems: 'center', padding: '4px 0',
    cursor: 'pointer', color: '#a0d8b0', fontSize: '11px', gap: '8px',
  });
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.id = elId;
  cb.style.accentColor = '#60ff90';
  cb.style.width = '14px';
  cb.style.height = '14px';
  cb.addEventListener('change', () => { cheats[cheatKey] = cb.checked; });
  lbl.appendChild(cb);
  lbl.appendChild(document.createTextNode(label));
  parent.appendChild(lbl);
}

function criarSelect(parent, id, opcoes, valorAtual) {
  const sel = document.createElement('select');
  sel.id = id;
  Object.assign(sel.style, {
    background: '#0a1020', color: '#60ccff', border: '1px solid #2a4070',
    borderRadius: '4px', padding: '4px 8px', fontFamily: 'monospace',
    fontSize: '11px', width: '100%', marginBottom: '6px',
  });
  for (const [val, label] of opcoes) {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = label;
    sel.appendChild(opt);
  }
  sel.value = valorAtual;
  parent.appendChild(sel);
  return sel;
}

function criarPopupHTML() {
  // Overlay fullscreen
  const overlay = e('div', {
    display: 'none', position: 'fixed', inset: '0',
    background: 'rgba(2, 4, 10, 0.92)', zIndex: '9999',
    fontFamily: 'monospace', color: '#a0d8b0',
    overflowY: 'auto',
  });
  overlay.id = 'debug-popup';

  // Container centralizado
  const container = e('div', {
    maxWidth: '900px', margin: '0 auto', padding: '20px 30px',
  });
  overlay.appendChild(container);

  // Header
  const header = e('div', {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '20px', borderBottom: '2px solid #1a3060', paddingBottom: '12px',
  });
  header.appendChild(e('span', { color: '#60ccff', fontSize: '18px', fontWeight: 'bold' }, 'DEBUG CONSOLE'));

  const closeHint = e('span', { color: '#556', fontSize: '12px' }, 'F3 para fechar');
  header.appendChild(closeHint);
  container.appendChild(header);

  // Grid 3 colunas
  const grid = e('div', {
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px',
  });
  container.appendChild(grid);

  const linhas = {};

  // === COLUNA 1: Status ===
  const col1 = e('div');
  grid.appendChild(col1);

  criarSecao(col1, 'PERFORMANCE', ['dbg-fps', 'dbg-camera', 'dbg-mundo'], linhas);
  criarSecao(col1, 'ENTIDADES', ['dbg-planetas', 'dbg-naves', 'dbg-sistemas', 'dbg-fontes'], linhas);
  criarSecao(col1, 'ECONOMIA', ['dbg-recursos', 'dbg-pesquisa', 'dbg-estado'], linhas);
  criarSecao(col1, 'SELECAO', ['dbg-selecao', 'dbg-construcao'], linhas);
  criarSecao(col1, 'RENDER', ['dbg-neblina', 'dbg-children'], linhas);

  // === COLUNA 2: Profiling ===
  const col2 = e('div');
  grid.appendChild(col2);

  const profSec = e('div', { marginBottom: '12px' });
  const profTitle = e('div', {
    color: '#4a90cc', fontSize: '10px', marginBottom: '4px',
    letterSpacing: '1px', borderBottom: '1px solid #1a3060', paddingBottom: '3px',
  });
  profTitle.textContent = 'PROFILING (ms/frame)';
  profSec.appendChild(profTitle);

  const profIds = [
    ['dbg-prof-logica', false],
    ['dbg-prof-fundo', false],
    ['dbg-prof-fog', false],
    ['dbg-prof-fog-draw', true],
    ['dbg-prof-fog-upload', true],
    ['dbg-prof-planetas', false],
    ['dbg-prof-render', false],
    ['dbg-prof-total', false],
  ];
  for (const [id, indent] of profIds) {
    const isBold = id.includes('total');
    const row = e('div', {
      padding: '3px 0', paddingLeft: indent ? '20px' : '6px',
      fontWeight: isBold ? 'bold' : 'normal', fontSize: isBold ? '12px' : '11px',
      borderTop: isBold ? '1px solid #1a3060' : 'none', marginTop: isBold ? '4px' : '0',
    });
    row.id = id;
    profSec.appendChild(row);
    linhas[id] = row;
  }
  col2.appendChild(profSec);

  // Barra visual de profiling
  const barSec = e('div', { marginBottom: '12px' });
  barSec.appendChild(e('div', {
    color: '#4a90cc', fontSize: '10px', marginBottom: '6px',
    letterSpacing: '1px', borderBottom: '1px solid #1a3060', paddingBottom: '3px',
  }, 'FRAME BREAKDOWN'));

  const barContainer = e('div', {
    display: 'flex', height: '24px', borderRadius: '4px', overflow: 'hidden',
    border: '1px solid #1a3060',
  });
  barContainer.id = 'dbg-bar';
  barSec.appendChild(barContainer);

  const barLegend = e('div', { display: 'flex', gap: '10px', marginTop: '4px', fontSize: '9px', flexWrap: 'wrap' });
  barLegend.id = 'dbg-bar-legend';
  barSec.appendChild(barLegend);
  col2.appendChild(barSec);

  linhas['dbg-bar'] = barContainer;
  linhas['dbg-bar-legend'] = barLegend;

  // === COLUNA 3: Controles ===
  const col3 = e('div');
  grid.appendChild(col3);

  // Renderer
  const rendSec = e('div', { marginBottom: '12px' });
  rendSec.appendChild(e('div', {
    color: '#4a90cc', fontSize: '10px', marginBottom: '4px',
    letterSpacing: '1px', borderBottom: '1px solid #1a3060', paddingBottom: '3px',
  }, 'RENDERER'));

  const rendAtual = e('div', { fontSize: '11px', marginBottom: '6px', padding: '2px 0 2px 6px' });
  rendAtual.id = 'dbg-renderer-atual';
  rendSec.appendChild(rendAtual);

  const rendSelect = criarSelect(rendSec, 'dbg-renderer', [
    ['webgl', 'WebGL (GPU)'],
    ['webgpu', 'WebGPU (GPU)'],
  ], getRendererPreference());

  const rendBtn = e('button', {
    background: '#1a3060', color: '#60ccff', border: '1px solid #2a4070',
    borderRadius: '4px', padding: '6px 16px', fontFamily: 'monospace',
    fontSize: '11px', cursor: 'pointer', width: '100%',
  }, 'Aplicar e Recarregar');
  rendBtn.addEventListener('click', () => {
    setRendererPreference(rendSelect.value);
    window.location.reload();
  });
  rendSec.appendChild(rendBtn);
  col3.appendChild(rendSec);

  // Cheats
  const cheatSec = e('div', { marginBottom: '12px' });
  cheatSec.appendChild(e('div', {
    color: '#ffcc40', fontSize: '10px', marginBottom: '4px',
    letterSpacing: '1px', borderBottom: '1px solid #1a3060', paddingBottom: '3px',
  }, 'CHEATS'));

  criarCheat(cheatSec, 'cheat-construcao', 'Construcao instantanea [1]', 'construcaoInstantanea');
  criarCheat(cheatSec, 'cheat-recursos', 'Recursos infinitos [2]', 'recursosInfinitos');
  criarCheat(cheatSec, 'cheat-pesquisa', 'Pesquisa instantanea [3]', 'pesquisaInstantanea');
  criarCheat(cheatSec, 'cheat-visao', 'Visao total [4]', 'visaoTotal');
  criarCheat(cheatSec, 'cheat-velocidade', 'Nave 10x velocidade [5]', 'velocidadeNave');
  col3.appendChild(cheatSec);

  // Block game events
  for (const evt of ['mousedown', 'mouseup', 'click', 'wheel']) {
    overlay.addEventListener(evt, ev => ev.stopPropagation());
  }

  document.body.appendChild(overlay);
  overlay._linhas = linhas;
  return overlay;
}

let _popup = null;
let _ultimaAtualizacao = 0;

export function criarDebug() {
  _popup = criarPopupHTML();
  return _popup;
}

export function toggleDebug() {
  if (!_popup) return;
  _popup.style.display = _popup.style.display === 'none' ? 'flex' : 'none';
}

export function processarTeclaDebug(ev) {
  if (ev.code === 'F3') {
    ev.preventDefault();
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
  const ck = cheatKeys[ev.code];
  if (ck) {
    cheats[ck[0]] = !cheats[ck[0]];
    const cb = _popup.querySelector(`#${ck[1]}`);
    if (cb) cb.checked = cheats[ck[0]];
  }
}

function setText(id, text, color) {
  const el = _popup._linhas[id] || _popup.querySelector(`#${id}`);
  if (!el) return;
  el.textContent = text;
  if (color) el.style.color = color;
}

function setProf(id, label, value) {
  setText(id, `${label}: ${value.toFixed(2)}`, corProf(value));
}

const BAR_CORES = {
  logica: '#4488cc',
  fundo: '#44aa88',
  fog: '#ff6060',
  planetas: '#ffcc40',
  render: '#aa66ff',
};

function atualizarBarra() {
  const bar = _popup._linhas['dbg-bar'];
  const legend = _popup._linhas['dbg-bar-legend'];
  if (!bar) return;

  const total = Math.max(profiling.total, 0.01);

  // Limpar
  while (bar.firstChild) bar.removeChild(bar.firstChild);
  while (legend.firstChild) legend.removeChild(legend.firstChild);

  for (const [key, cor] of Object.entries(BAR_CORES)) {
    const val = profiling[key] || 0;
    const pct = Math.max((val / total) * 100, 0.5);

    const seg = e('div', {
      width: `${pct}%`, background: cor, height: '100%',
      minWidth: '2px', transition: 'width 0.3s',
    });
    seg.title = `${key}: ${val.toFixed(2)}ms`;
    bar.appendChild(seg);

    // Legend
    const item = e('div', { display: 'flex', alignItems: 'center', gap: '3px' });
    item.appendChild(e('div', { width: '8px', height: '8px', background: cor, borderRadius: '2px' }));
    item.appendChild(e('span', { color: '#889' }, `${key} ${val.toFixed(1)}ms`));
    legend.appendChild(item);
  }
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
  setText('dbg-renderer-atual', `Atual: ${rendererType}`);

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

  atualizarBarra();

  if (cheats.recursosInfinitos) {
    mundo.recursosJogador.comum = Math.max(mundo.recursosJogador.comum, 9999);
    mundo.recursosJogador.raro = Math.max(mundo.recursosJogador.raro, 9999);
    mundo.recursosJogador.combustivel = Math.max(mundo.recursosJogador.combustivel, 9999);
  }
}
