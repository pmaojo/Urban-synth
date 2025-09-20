export interface Nota {
  /**
   * Timestamp in beats.
   */
  t: number;
  /**
   * Duration in beats.
   */
  dur: number;
  /**
   * MIDI note number (0-127).
   */
  midi: number;
  /**
   * MIDI velocity (0-127).
   */
  vel: number;
}

export interface GlideEvent {
  start: number;
  duration: number;
  fromMidi: number;
  toMidi: number;
  curveK: number;
}

export interface Patron {
  notas: Nota[];
  glides?: GlideEvent[];
}

export type ScaleMode = 'minor' | 'harmonic' | 'phrygianDom';

export interface Chord {
  degree: number;
  notes: number[];
  bassNote: number;
}

export interface TrapBeatMetadata {
  bpm: number;
  swing: number;
  tonicMidi: number;
  mode: ScaleMode;
  compases: number;
  darkness: number;
}

export interface TrapBeatPattern {
  melody: Patron;
  hats: Patron;
  bass808: Patron;
  chords: Chord[];
  metadata: TrapBeatMetadata;
}

export interface TrapBeatConfig {
  bpm: number;
  compases: number;
  tonicMidi: number;
  mode: ScaleMode;
  swing?: number;
  randomSeed?: number;
  melodyRange?: [number, number];
  darknessCeiling?: number;
}

export type RandomSource = () => number;
