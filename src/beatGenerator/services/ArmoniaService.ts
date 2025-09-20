import type { ArmoniaService } from '../domain/ports';
import type { Chord, ScaleMode, RandomSource } from '../domain/models';

const DEGREE_PATTERNS: number[][] = [
  [0, 5, 6, 5],
  [0, 3, 4, 0],
  [0, 6, 5, 6],
];

const choose = <T>(items: T[], random: RandomSource): T => {
  const ix = Math.floor(random() * items.length);
  return items[ix % items.length]!;
};

const wrap = (value: number, length: number) => ((value % length) + length) % length;

const rotateToDegree = (scale: number[], degree: number): number[] => {
  const octaveLength = scale.length / 3;
  const rotated: number[] = [];
  for (let octave = 0; octave < 3; octave += 1) {
    for (let step = 0; step < octaveLength; step += 1) {
      const ix = wrap(step + degree, octaveLength);
      rotated.push(scale[ix] + octave * 12);
    }
  }
  return rotated;
};

const buildChordNotes = (scale: number[], degree: number, size = 3): number[] => {
  const rotated = rotateToDegree(scale, degree);
  const notes: number[] = [];
  for (let i = 0; i < size; i += 1) {
    const ix = i * 2;
    if (ix < rotated.length) {
      notes.push(rotated[ix]);
    }
  }
  return notes;
};

export class DefaultArmoniaService implements ArmoniaService {
  buildProgression({
    compases,
    tonicMidi,
    mode,
    scale,
    random,
  }: {
    compases: number;
    tonicMidi: number;
    mode: ScaleMode;
    scale: number[];
    random: RandomSource;
  }): Chord[] {
    const availablePatterns =
      mode === 'phrygianDom' ? [DEGREE_PATTERNS[2], DEGREE_PATTERNS[1]] : DEGREE_PATTERNS;
    const pattern = choose(availablePatterns, random);
    const chords: Chord[] = [];
    const ordered = [...scale].sort((a, b) => a - b);
    if (ordered.length === 0) {
      return chords;
    }

    for (let bar = 0; bar < compases; bar += 1) {
      const degree = pattern[bar % pattern.length]!;
      const notes = buildChordNotes(ordered, degree, 4);
      const bassNote = Math.max(notes[0] - 12, tonicMidi - 24);
      chords.push({ degree, notes, bassNote });
    }

    return chords;
  }

  getChordTones(chord: Chord): number[] {
    return chord.notes;
  }
}

export const ArmoniaServiceFactory = () => new DefaultArmoniaService();
