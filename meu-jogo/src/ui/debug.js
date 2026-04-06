import { Container, Graphics, Text } from 'pixi.js';
import { getEstadoJogo, getPesquisaAtual, obterNaveSelecionada } from '../world/mundo.js';
import { getMemoria } from '../world/nevoa.js';
import { getCamera } from '../core/player.js';

const COR_FUNDO = 0x0a1020;
const COR_BORDA = 0x2a4070;
const COR_TITULO = 0x60ccff;
const COR_VALOR = 0x60ff90;
const COR_CHEAT = 0xffcc40;
const COR_CHEAT_ON = 0x60ff90;
const COR_CHEAT_OFF = 0xff6060;
const COR_SEPARADOR = 0x1a3060;
const FONTE = 'monospace';
const TAMANHO_FONTE = 11;
const PADDING = 10;
const LINHA_H = 16;
const LARGURA = 360;
const THROTTLE_MS = 250;
const MARGEM_DIREITA = 10;

/** Estado global de cheats — importável por outros módulos */
export const cheats = {
  construcaoInstantanea: false,
  recursosInfinitos: false,
  pesquisaInstantanea: false,
  visaoTotal: false,
  velocidadeNave: false,
};

function criarTexto(text, cor = COR_VALOR) {
  return new Text({
    text,
    style: {
      fontSize: TAMANHO_FONTE,
      fill: cor,
      fontFamily: FONTE,
    },
  });
}

function formatarTempo(ms) {
  if (!ms || ms <= 0) return '0s';
  const s = Math.ceil(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m${s % 60}s`;
}

export function criarDebug(app) {
  const container = new Container();
  container.visible = false;
  container.eventMode = 'none';
  container.y = 10;

  const bg = new Graphics();
  container.addChild(bg);

  const linhas = {};
  const ids = [
    'titulo',
    'fps',
    'camera',
    'mundo',
    'sep1',
    'planetas',
    'naves',
    'sistemas',
    'fontesVisao',
    'sep2',
    'recursos',
    'pesquisa',
    'estado',
    'sep3',
    'selecao',
    'construcao',
    'sep4',
    'neblina',
    'containers',
    'sep5',
    'cheatsTitulo',
    'cheatConstrucao',
    'cheatRecursos',
    'cheatPesquisa',
    'cheatVisao',
    'cheatVelocidade',
  ];

  let y = PADDING;
  for (const id of ids) {
    if (id.startsWith('sep')) {
      const sep = new Graphics();
      sep.rect(PADDING, y + LINHA_H / 2 - 0.5, LARGURA - PADDING * 2, 1)
        .fill({ color: COR_SEPARADOR, alpha: 0.8 });
      container.addChild(sep);
      linhas[id] = sep;
      y += LINHA_H;
      continue;
    }

    const cor = id === 'titulo' ? COR_TITULO
      : id === 'cheatsTitulo' ? COR_CHEAT
      : COR_VALOR;
    const txt = criarTexto('', cor);
    txt.x = PADDING;
    txt.y = y;
    container.addChild(txt);
    linhas[id] = txt;
    y += LINHA_H;
  }

  const altura = y + PADDING;
  bg.roundRect(0, 0, LARGURA, altura, 4).fill({ color: COR_FUNDO, alpha: 0.88 });
  bg.roundRect(0, 0, LARGURA, altura, 4).stroke({ color: COR_BORDA, width: 1, alpha: 0.7 });

  // Posicionar no canto superior-direito
  container.x = app.screen.width - LARGURA - MARGEM_DIREITA;

  container._linhas = linhas;
  container._ultimaAtualizacao = 0;
  container._largura = LARGURA;

  return container;
}

export function toggleDebug(debug) {
  debug.visible = !debug.visible;
}

function toggleCheat(nome) {
  cheats[nome] = !cheats[nome];
}

export function processarTeclaDebug(e, debug) {
  if (e.code === 'F3') {
    e.preventDefault();
    toggleDebug(debug);
    return;
  }

  // Cheats só funcionam com debug aberto
  if (!debug.visible) return;

  switch (e.code) {
    case 'Digit1': toggleCheat('construcaoInstantanea'); break;
    case 'Digit2': toggleCheat('recursosInfinitos'); break;
    case 'Digit3': toggleCheat('pesquisaInstantanea'); break;
    case 'Digit4': toggleCheat('visaoTotal'); break;
    case 'Digit5': toggleCheat('velocidadeNave'); break;
  }
}

function statusCheat(ativo) {
  return ativo ? 'ON' : 'OFF';
}

export function atualizarDebug(debug, mundo, app) {
  if (!debug.visible) return;

  // Reposicionar no resize
  debug.x = app.screen.width - debug._largura - MARGEM_DIREITA;

  const agora = performance.now();
  if (agora - debug._ultimaAtualizacao < THROTTLE_MS) return;
  debug._ultimaAtualizacao = agora;

  const l = debug._linhas;
  const cam = getCamera();
  const fps = Math.round(app.ticker.FPS);
  const delta = app.ticker.deltaMS.toFixed(1);

  // Performance
  l.titulo.text = '[ DEBUG ]  F3 fechar';
  l.fps.text = `FPS: ${fps}  |  Delta: ${delta}ms`;
  l.camera.text = `Zoom: ${cam.zoom.toFixed(2)}x  |  Cam: ${Math.round(cam.x)}, ${Math.round(cam.y)}`;
  l.mundo.text = `Mundo: ${mundo.tamanho}px`;

  // Entidades
  const planetasVis = mundo.planetas.filter(p => p._visivelAoJogador).length;
  const navesVis = mundo.naves.filter(n => n.gfx.visible).length;
  l.planetas.text = `Planetas: ${mundo.planetas.length} (${planetasVis} visiveis)`;
  l.naves.text = `Naves: ${mundo.naves.length} (${navesVis} visiveis)`;
  l.sistemas.text = `Sistemas: ${mundo.sistemas.length}  |  Sois: ${mundo.sois.length}`;
  l.fontesVisao.text = `Fontes visao: ${mundo.fontesVisao.length}`;

  // Economia
  const r = mundo.recursosJogador;
  l.recursos.text = `Recursos: C:${Math.floor(r.comum)} R:${Math.floor(r.raro)} F:${Math.floor(r.combustivel)}`;

  const pesq = getPesquisaAtual(mundo);
  l.pesquisa.text = pesq
    ? `Pesquisa: ${pesq.categoria} T${pesq.tier} (${formatarTempo(pesq.tempoRestanteMs)})`
    : 'Pesquisa: nenhuma';

  l.estado.text = `Estado: ${getEstadoJogo()}`;

  // Seleção
  const naveSel = obterNaveSelecionada(mundo);
  const planetaSel = mundo.planetas.find(p => p.dados.selecionado);

  if (naveSel) {
    l.selecao.text = `Sel: Nave ${naveSel.tipo} T${naveSel.tier} (${naveSel.estado})`;
  } else if (planetaSel) {
    const d = planetaSel.dados;
    l.selecao.text = `Sel: Planeta ${d.dono} | Fab:${d.fabricas} Inf:${d.infraestrutura}`;
  } else {
    l.selecao.text = 'Sel: nenhuma';
  }

  if (planetaSel?.dados.construcaoAtual) {
    const c = planetaSel.dados.construcaoAtual;
    l.construcao.text = `Construcao: ${c.tipo} T${c.tierDestino} (${formatarTempo(c.tempoRestanteMs)})`;
  } else if (planetaSel?.dados.producaoNave) {
    const p = planetaSel.dados.producaoNave;
    l.construcao.text = `Producao: ${p.tipoNave} T${p.tier} (${formatarTempo(p.tempoRestanteMs)})`;
  } else {
    l.construcao.text = 'Construcao: --';
  }

  // Fog/Render
  let memoriasConhecidas = 0;
  for (const planeta of mundo.planetas) {
    const mem = getMemoria(planeta);
    if (mem?.conhecida) memoriasConhecidas++;
  }

  l.neblina.text = `Memorias: ${memoriasConhecidas}/${mundo.planetas.length}`;
  l.containers.text = `Children: mundo=${mundo.container.children.length} naves=${mundo.navesContainer.children.length}`;

  // Cheats
  l.cheatsTitulo.text = '[ CHEATS ]  teclas 1-5';
  l.cheatConstrucao.text = `1: Construcao instantanea  [${statusCheat(cheats.construcaoInstantanea)}]`;
  l.cheatRecursos.text = `2: Recursos infinitos      [${statusCheat(cheats.recursosInfinitos)}]`;
  l.cheatPesquisa.text = `3: Pesquisa instantanea    [${statusCheat(cheats.pesquisaInstantanea)}]`;
  l.cheatVisao.text = `4: Visao total             [${statusCheat(cheats.visaoTotal)}]`;
  l.cheatVelocidade.text = `5: Nave 10x velocidade     [${statusCheat(cheats.velocidadeNave)}]`;

  // Cores dinâmicas para cheats
  l.cheatConstrucao.style.fill = cheats.construcaoInstantanea ? COR_CHEAT_ON : COR_CHEAT_OFF;
  l.cheatRecursos.style.fill = cheats.recursosInfinitos ? COR_CHEAT_ON : COR_CHEAT_OFF;
  l.cheatPesquisa.style.fill = cheats.pesquisaInstantanea ? COR_CHEAT_ON : COR_CHEAT_OFF;
  l.cheatVisao.style.fill = cheats.visaoTotal ? COR_CHEAT_ON : COR_CHEAT_OFF;
  l.cheatVelocidade.style.fill = cheats.velocidadeNave ? COR_CHEAT_ON : COR_CHEAT_OFF;

  // Aplicar cheats de recursos
  if (cheats.recursosInfinitos) {
    mundo.recursosJogador.comum = Math.max(mundo.recursosJogador.comum, 9999);
    mundo.recursosJogador.raro = Math.max(mundo.recursosJogador.raro, 9999);
    mundo.recursosJogador.combustivel = Math.max(mundo.recursosJogador.combustivel, 9999);
  }
}
