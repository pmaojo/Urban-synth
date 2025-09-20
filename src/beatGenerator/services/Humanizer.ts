import type { Humanizer } from '../domain/ports';
import type { Patron, Nota, RandomSource } from '../domain/models';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const gaussian = (random: RandomSource): number => {
  let u1 = 0;
  let u2 = 0;
  while (u1 === 0) u1 = random();
  while (u2 === 0) u2 = random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
};

export class DefaultHumanizer implements Humanizer {
  humanize(pattern: Patron, { timingStdMs, velocityStd, bpm, random }: Parameters<Humanizer['humanize']>[1]): Patron {
    const beatDuration = 60 / bpm;
    const timingStdBeats = (timingStdMs / 1000) / beatDuration;

    const notas: Nota[] = pattern.notas.map(note => {
      const timeJitter = gaussian(random) * timingStdBeats;
      const velJitter = gaussian(random) * velocityStd;
      return {
        ...note,
        t: note.t + timeJitter,
        vel: clamp(Math.round(note.vel + velJitter), 0, 127),
      };
    });

    return { ...pattern, notas };
  }
}

export const HumanizerFactory = () => new DefaultHumanizer();
