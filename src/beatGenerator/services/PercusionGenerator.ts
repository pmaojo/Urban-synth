import type { PercusionGenerator } from '../domain/ports';
import type { Patron, Nota, RandomSource } from '../domain/models';

const SIXTEENTH = 0.25;

const choose = <T>(items: T[], random: RandomSource): T => {
  const ix = Math.floor(random() * items.length);
  return items[ix % items.length]!;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const rollSubdivisions = [2, 3, 4, 6];

const velocityForStep = (stepIx: number): number => {
  if (stepIx % 4 === 0) {
    return 108;
  }
  if (stepIx % 4 === 2) {
    return 96;
  }
  return 82;
};

export class DefaultPercusionGenerator implements PercusionGenerator {
  generar({ compases, bpm, swing, ritmo, random }: Parameters<PercusionGenerator['generar']>[0]): Patron {
    const notas: Nota[] = [];
    const rollsProbability = 0.35;
    const hatDensity = 11;

    for (let bar = 0; bar < compases; bar += 1) {
      const basePattern = ritmo.euclid(hatDensity, 16, bar % 2 === 0 ? 0 : 1);
      for (let step = 0; step < basePattern.length; step += 1) {
        if (!basePattern[step] && random() > 0.1) {
          continue;
        }

        const baseTime = bar * 4 + step * SIXTEENTH;
        const hasRoll = basePattern[step] && random() < rollsProbability && step % 4 === 0;
        const subdivision = hasRoll ? choose(rollSubdivisions, random) : 1;
        const stepDuration = SIXTEENTH / subdivision;

        for (let i = 0; i < subdivision; i += 1) {
          const rawTime = baseTime + i * stepDuration;
          const swingTime = swing > 0 ? ritmo.swing(rawTime, swing, bpm) : rawTime;
          const jitter = (random() - 0.5) * 0.01;
          const velocityVariation = Math.floor(random() * 10) - 5;
          notas.push({
            t: swingTime + jitter,
            dur: stepDuration * 0.6,
            midi: 42,
            vel: clamp(velocityForStep(step) + velocityVariation, 50, 118),
          });
        }
      }
    }

    return { notas };
  }
}

export const PercusionGeneratorFactory = () => new DefaultPercusionGenerator();
