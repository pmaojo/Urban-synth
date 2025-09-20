import type {
  BeatGeneratorDependencies,
  TrapBeatGeneratorPort,
} from './domain/ports';
import type {
  TrapBeatConfig,
  TrapBeatPattern,
  RandomSource,
  Patron,
} from './domain/models';

const createMulberry32 = (seed: number): RandomSource => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const defaultSwingForMode = (mode: TrapBeatConfig['mode']): number => {
  if (mode === 'phrygianDom') {
    return 0.2;
  }
  if (mode === 'harmonic') {
    return 0.16;
  }
  return 0.14;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const applySwing = (
  pattern: Patron,
  swing: number,
  bpm: number,
  ritmo: BeatGeneratorDependencies['ritmo']
): Patron => {
  if (swing <= 0) {
    return pattern;
  }
  const notas = pattern.notas.map(nota => {
    const swungTime = ritmo.swing(nota.t, swing, bpm);
    return { ...nota, t: swungTime };
  });
  return { ...pattern, notas };
};

export class TrapBeatGenerator implements TrapBeatGeneratorPort {
  constructor(private readonly deps: BeatGeneratorDependencies) {}

  generate(config: TrapBeatConfig): TrapBeatPattern {
    const { bpm, compases, tonicMidi, mode } = config;
    const random: RandomSource =
      typeof config.randomSeed === 'number' ? createMulberry32(config.randomSeed) : () => Math.random();
    const swing = clamp(config.swing ?? defaultSwingForMode(mode), 0, 0.25);
    const melodyRange = config.melodyRange ?? [tonicMidi - 5, tonicMidi + 18];

    const scaleMask = this.deps.escala.mask(tonicMidi % 12, mode);
    const scaleNotes = this.deps.escala.buildScaleNotes(tonicMidi, mode, 3);

    const baseProgression = this.deps.armonia.buildProgression({
      compases,
      tonicMidi,
      mode,
      scale: scaleNotes,
      random,
    });
    const progression =
      baseProgression.length > 0
        ? baseProgression
        : [
            {
              degree: 0,
              notes: [tonicMidi, tonicMidi + 3, tonicMidi + 7, tonicMidi + 10],
              bassNote: tonicMidi - 12,
            },
          ];

    const melody = this.deps.melodia.generar({
      compases,
      bpm,
      progression,
      escala: this.deps.escala,
      scaleMask,
      tonic: tonicMidi,
      rango: melodyRange,
      random,
    });

    const hats = this.deps.percusion.generar({
      compases,
      bpm,
      swing,
      ritmo: this.deps.ritmo,
      random,
    });

    const bass = this.deps.bajo.generar({
      compases,
      bpm,
      progression,
      escala: this.deps.escala,
      tonic: tonicMidi,
      mode,
      random,
    });

    const swungMelody = applySwing(melody, swing, bpm, this.deps.ritmo);
    const swungBass = applySwing(bass, swing * 0.6, bpm, this.deps.ritmo);

    const humanizedMelody = this.deps.humanizer.humanize(swungMelody, {
      bpm,
      random,
      timingStdMs: 8,
      velocityStd: 6,
    });
    const humanizedHats = this.deps.humanizer.humanize(hats, {
      bpm,
      random,
      timingStdMs: 4,
      velocityStd: 10,
    });
    const humanizedBass = this.deps.humanizer.humanize(swungBass, {
      bpm,
      random,
      timingStdMs: 6,
      velocityStd: 4,
    });

    let darkness = this.deps.evaluator.disonancia(humanizedMelody, progression, { tonic: tonicMidi });
    const ceiling = config.darknessCeiling ?? 6.5;
    if (darkness > ceiling) {
      const aligned = humanizedMelody.notas.map((nota, ix) => {
        const barIx = Math.min(Math.floor(nota.t / 4), progression.length - 1);
        const chord = progression[barIx]!;
        const tones = this.deps.armonia.getChordTones(chord);
        const closest = tones.reduce((best, tone) =>
          Math.abs(tone - nota.midi) < Math.abs(best - nota.midi) ? tone : best
        );
        const mix = 0.5;
        const corrected = Math.round(closest * mix + nota.midi * (1 - mix));
        return { ...nota, midi: corrected };
      });
      const repairedMelody: Patron = { ...humanizedMelody, notas: aligned };
      darkness = this.deps.evaluator.disonancia(repairedMelody, progression, { tonic: tonicMidi });
      return {
        melody: repairedMelody,
        hats: humanizedHats,
        bass808: humanizedBass,
        chords: progression,
        metadata: {
          bpm,
          swing,
          tonicMidi,
          mode,
          compases,
          darkness,
        },
      };
    }

    return {
      melody: humanizedMelody,
      hats: humanizedHats,
      bass808: humanizedBass,
      chords: progression,
      metadata: {
        bpm,
        swing,
        tonicMidi,
        mode,
        compases,
        darkness,
      },
    };
  }
}

export const TrapBeatGeneratorFactory = (deps: BeatGeneratorDependencies) => new TrapBeatGenerator(deps);
