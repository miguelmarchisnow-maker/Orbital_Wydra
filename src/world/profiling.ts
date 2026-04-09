import type { ProfilingData } from '../types';

export const profiling: ProfilingData = {
  logica: 0, fundo: 0, fog: 0, planetas: 0, render: 0, total: 0,
};

const _profilingSoma: ProfilingData = { logica: 0, fundo: 0, fog: 0, planetas: 0, render: 0, total: 0 };
let _profilingFrames: number = 0;
const PROFILING_JANELA: number = 30;

export function profileMark(): number {
  return performance.now();
}

export function profileAcumular(campo: keyof ProfilingData, inicio: number): void {
  _profilingSoma[campo] += performance.now() - inicio;
}

export function profileFlush(): void {
  _profilingFrames++;
  if (_profilingFrames >= PROFILING_JANELA) {
    for (const k of Object.keys(profiling) as Array<keyof ProfilingData>) {
      profiling[k] = _profilingSoma[k] / PROFILING_JANELA;
      _profilingSoma[k] = 0;
    }
    _profilingFrames = 0;
  }
}
