import type { Chord, Patron, RandomSource, ScaleMode, TrapBeatConfig, TrapBeatPattern } from './models';

export interface EscalaService {
  cuantizar(midi: number, mask: number[], tonic: number): number;
  mask(tonic: number, modo: ScaleMode): number[];
  buildScaleNotes(tonicMidi: number, modo: ScaleMode, octaves: number): number[];
}

export interface ArmoniaService {
  buildProgression(config: {
    compases: number;
    tonicMidi: number;
    mode: ScaleMode;
    scale: number[];
    random: RandomSource;
  }): Chord[];
  getChordTones(chord: Chord): number[];
}

export interface RitmoService {
  euclid(k: number, n: number, offset?: number): boolean[];
  swing(t: number, strength: number, bpm: number): number;
}

export interface MelodiaGenerator {
  generar(config: {
    compases: number;
    bpm: number;
    progression: Chord[];
    escala: EscalaService;
    scaleMask: number[];
    tonic: number;
    rango: [number, number];
    random: RandomSource;
  }): Patron;
}

export interface PercusionGenerator {
  generar(config: {
    compases: number;
    bpm: number;
    swing: number;
    ritmo: RitmoService;
    random: RandomSource;
  }): Patron;
}

export interface Bajo808Generator {
  generar(config: {
    compases: number;
    bpm: number;
    progression: Chord[];
    escala: EscalaService;
    tonic: number;
    mode: ScaleMode;
    random: RandomSource;
  }): Patron;
}

export interface Humanizer {
  humanize(pattern: Patron, config: {
    timingStdMs: number;
    velocityStd: number;
    bpm: number;
    random: RandomSource;
  }): Patron;
}

export interface Evaluator {
  disonancia(pattern: Patron, progression: Chord[], config: { tonic: number }): number;
}

export interface TrapBeatGeneratorPort {
  generate(config: TrapBeatConfig): TrapBeatPattern;
}

export interface BeatGeneratorDependencies {
  escala: EscalaService;
  armonia: ArmoniaService;
  ritmo: RitmoService;
  melodia: MelodiaGenerator;
  percusion: PercusionGenerator;
  bajo: Bajo808Generator;
  humanizer: Humanizer;
  evaluator: Evaluator;
}
