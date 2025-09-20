import type { RitmoService } from '../domain/ports';

const bjorklund = (pulses: number, steps: number): boolean[] => {
  if (pulses <= 0) {
    return new Array(steps).fill(false);
  }
  if (pulses >= steps) {
    return new Array(steps).fill(true);
  }

  const pattern: boolean[] = new Array(steps).fill(false);
  let bucket = 0;
  for (let i = 0; i < steps; i += 1) {
    bucket += pulses;
    if (bucket >= steps) {
      bucket -= steps;
      pattern[i] = true;
    }
  }
  return pattern;
};

export class DefaultRitmoService implements RitmoService {
  euclid(k: number, n: number, offset = 0): boolean[] {
    const base = bjorklund(k, n);
    if (offset === 0) {
      return base;
    }
    const rotated: boolean[] = [];
    for (let i = 0; i < base.length; i += 1) {
      rotated.push(base[(i + offset + base.length) % base.length]!);
    }
    return rotated;
  }

  swing(t: number, strength: number, bpm: number): number {
    const beatDuration = 60 / bpm;
    const eighthDuration = beatDuration / 2;
    const position = t / eighthDuration;
    const isOffbeat = Math.abs(position - Math.round(position)) > 1e-6 && Math.floor(position) % 2 === 0;
    if (!isOffbeat) {
      return t;
    }
    return t + strength * eighthDuration;
  }
}

export const RitmoServiceFactory = () => new DefaultRitmoService();
