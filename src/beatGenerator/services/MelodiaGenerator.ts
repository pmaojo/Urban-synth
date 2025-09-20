import type { MelodiaGenerator, ArmoniaService } from '../domain/ports';
import type { Patron, Nota, RandomSource } from '../domain/models';

const STEP_DISTRIBUTION: { step: number; weight: number }[] = [
  { step: -1, weight: 0.35 },
  { step: 1, weight: 0.25 },
  { step: -2, weight: 0.18 },
  { step: 2, weight: 0.12 },
  { step: -3, weight: 0.06 },
  { step: 3, weight: 0.04 },
];

const DURATION_DISTRIBUTION: { dur: number; weight: number }[] = [
  { dur: 0.5, weight: 0.1 },
  { dur: 0.25, weight: 0.25 },
  { dur: 0.125, weight: 0.4 },
  { dur: 0.0625, weight: 0.15 },
  { dur: 1 / 12, weight: 0.06 },
  { dur: 1 / 24, weight: 0.04 },
];

const EPS = 1e-6;

const weightedChoice = <T extends { weight: number }>(options: T[], random: RandomSource): T => {
  const total = options.reduce((sum, item) => sum + item.weight, 0);
  const target = random() * total;
  let acc = 0;
  for (const option of options) {
    acc += option.weight;
    if (target <= acc) {
      return option;
    }
  }
  return options[options.length - 1]!;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const nearestChordTone = (note: number, tones: number[]): number => {
  let best = tones[0]!;
  let bestDist = Math.abs(note - best);
  for (const tone of tones) {
    const dist = Math.abs(note - tone);
    if (dist < bestDist) {
      best = tone;
      bestDist = dist;
    }
  }
  return best;
};

const isStrongBeat = (beat: number): boolean => Math.abs(beat % 1) < EPS;

export class DefaultMelodiaGenerator implements MelodiaGenerator {
  constructor(private readonly armonia: ArmoniaService) {}

  generar({
    compases,
    bpm: _bpm,
    progression,
    escala,
    scaleMask,
    tonic,
    rango,
    random,
  }: Parameters<MelodiaGenerator['generar']>[0]): Patron {
    const totalBeats = compases * 4;
    const notas: Nota[] = [];
    if (progression.length === 0) {
      return { notas };
    }

    const noteRange = rango;
    let currentMidi = escala.cuantizar(progression[0]!.notes[0] ?? tonic, scaleMask, tonic);
    currentMidi = clamp(currentMidi, noteRange[0], noteRange[1]);
    let currentTime = 0;

    while (currentTime < totalBeats - EPS) {
      const remaining = totalBeats - currentTime;
      const durationOption = weightedChoice(DURATION_DISTRIBUTION, random);
      let duration = Math.min(durationOption.dur, remaining);
      if (remaining < 0.0625) {
        duration = remaining;
      }

      const step = weightedChoice(STEP_DISTRIBUTION, random).step;
      let candidate = currentMidi + step;
      candidate = clamp(candidate, noteRange[0], noteRange[1]);
      candidate = escala.cuantizar(candidate, scaleMask, tonic);

      const chordIx = Math.min(Math.floor(currentTime / 4), progression.length - 1);
      const chord = progression[chordIx]!;
      const chordTones = this.armonia.getChordTones(chord);
      if (isStrongBeat(currentTime)) {
        candidate = nearestChordTone(candidate, chordTones);
      }

      const velAccent = isStrongBeat(currentTime) ? 100 : 88;
      const velocityVariance = Math.floor(random() * 12) - 6;
      const velocity = clamp(velAccent + velocityVariance, 50, 120);

      notas.push({ t: currentTime, dur: duration, midi: candidate, vel: velocity });
      currentMidi = candidate - 0.2; // slight downward trend
      currentTime += duration;
    }

    return { notas };
  }
}

export const MelodiaGeneratorFactory = (armonia: ArmoniaService) => new DefaultMelodiaGenerator(armonia);
