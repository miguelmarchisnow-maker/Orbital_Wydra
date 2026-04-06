import { Container, Graphics, Text } from 'pixi.js';
import {
  aplicarAparenciaTipoPlaneta,
  criarPlanetaSprite,
} from './planeta.js';

const ALPHA_NEBLINA = 0.78;
const COR_NEBLINA = 0x02050c;
const ALPHA_FANTASMA = 0.32;
const DISTANCIA_LABEL_MEMORIA = 18;

function nomeDonoCurto(dono) {
  if (dono === 'jogador') return 'Seu';
  if (dono === 'neutro') return 'Neutro';
  return dono || '?';
}

function capturarMemoriaPlaneta(planeta) {
  return {
    x: planeta.x,
    y: planeta.y,
    frame: planeta.currentFrame ?? 0,
    dados: {
      dono: planeta.dados.dono,
      tipoPlaneta: planeta.dados.tipoPlaneta,
      tamanho: planeta.dados.tamanho,
      fabricas: planeta.dados.fabricas,
      infraestrutura: planeta.dados.infraestrutura,
      naves: planeta.dados.naves,
      producao: planeta.dados.producao,
    },
  };
}

export function criarCamadaMemoria() {
  const container = new Container();
  container.eventMode = 'none';
  return container;
}

export function criarMemoriaVisualPlaneta(mundo, planeta) {
  const container = new Container();
  container.visible = false;
  container.eventMode = 'none';

  const fantasma = criarPlanetaSprite(
    mundo.planetaSheet,
    0,
    0,
    planeta.dados.tamanho,
    planeta.dados.tipoPlaneta
  );
  fantasma.alpha = ALPHA_FANTASMA;
  fantasma.animationSpeed = 0;
  fantasma.gotoAndStop(planeta.currentFrame ?? 0);
  fantasma.anchor.set(0.5);
  container.addChild(fantasma);

  const anel = new Graphics();
  container.addChild(anel);

  const infoBg = new Graphics();
  container.addChild(infoBg);

  const info = new Text({
    text: '',
    style: {
      fontSize: 11,
      fill: 0xcfe3ff,
      fontFamily: 'monospace',
      align: 'center',
    },
  });
  info.anchor.set(0.5, 0);
  container.addChild(info);

  mundo.memoriaPlanetasContainer.addChild(container);

  planeta._memoria = {
    conhecida: false,
    visual: container,
    fantasma,
    anel,
    infoBg,
    info,
    dados: null,
  };
}

export function atualizarMemoriaVisualPlaneta(planeta, donos, nomeTipoPlaneta) {
  const memoria = planeta._memoria;
  if (!memoria?.conhecida || !memoria.dados) return;

  const { x, y, frame, dados } = memoria.dados;
  const tamanho = dados.tamanho;
  const visual = memoria.visual;

  visual.x = x;
  visual.y = y;

  memoria.fantasma.width = tamanho;
  memoria.fantasma.height = tamanho;
  memoria.fantasma.gotoAndStop(frame ?? 0);
  memoria.fantasma.alpha = ALPHA_FANTASMA;
  aplicarAparenciaTipoPlaneta(memoria.fantasma, dados.tipoPlaneta);

  memoria.anel.clear();
  memoria.anel.circle(0, 0, tamanho / 2 + 5).stroke({
    color: donos[dados.dono] || 0xaac8ff,
    width: 1.5,
    alpha: 0.45,
  });

  memoria.info.text =
    `${nomeDonoCurto(dados.dono)} | ${nomeTipoPlaneta(dados.tipoPlaneta)}\n` +
    `Fab ${dados.fabricas}  Inf ${dados.infraestrutura}  Nv ${dados.naves}`;
  memoria.info.y = tamanho / 2 + DISTANCIA_LABEL_MEMORIA;

  const largura = memoria.info.width + 12;
  const altura = memoria.info.height + 8;
  memoria.infoBg.clear();
  memoria.infoBg.roundRect(-largura / 2, memoria.info.y - 4, largura, altura, 4).fill({
    color: 0x08111f,
    alpha: 0.62,
  });
}

export function registrarMemoriaPlaneta(planeta, donos, nomeTipoPlaneta) {
  if (!planeta._memoria) return;
  planeta._memoria.conhecida = true;
  planeta._memoria.dados = capturarMemoriaPlaneta(planeta);
  atualizarMemoriaVisualPlaneta(planeta, donos, nomeTipoPlaneta);
}

export function desenharNeblinaVisao(mundo, fontesVisao) {
  mundo.visaoContainer.clear();
  mundo.visaoContainer
    .rect(0, 0, mundo.tamanho, mundo.tamanho)
    .fill({ color: COR_NEBLINA, alpha: ALPHA_NEBLINA });

  for (const fonte of fontesVisao) {
    mundo.visaoContainer.circle(fonte.x, fonte.y, fonte.raio).cut();
  }
}
