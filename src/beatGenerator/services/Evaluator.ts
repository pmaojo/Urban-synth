import type { Evaluator } from '../domain/ports';
import type { Patron, Chord } from '../domain/models';

const EPS = 1e-6;

const weightForTime = (t: number): number => {
  const beatPos = t % 1;
  if (beatPos < EPS) {
    return 1.5;
  }
  if (beatPos < 0.5) {
    return 1.1;
  }
  return 0.8;
};

const minDistanceToChord = (midi: number, chord: Chord): number => {
  return chord.notes.reduce((min, tone) => Math.min(min, Math.abs(midi - tone)), Number.POSITIVE_INFINITY);
};

export class DefaultEvaluator implements Evaluator {
  disonancia(pattern: Patron, progression: Chord[], { tonic }: { tonic: number }): number {
    if (pattern.notas.length === 0 || progression.length === 0) {
      return 0;
    }

    let acc = 0;
    for (const nota of pattern.notas) {
      const barIx = Math.max(0, Math.min(Math.floor(nota.t / 4), progression.length - 1));
      const chord = progression[barIx]!;
      const distance = minDistanceToChord(nota.midi, chord);
      acc += weightForTime(nota.t) * distance;
      if (nota.midi % 12 === (tonic + 1) % 12) {
        acc += 0.5;
      }
    }

    return acc / pattern.notas.length;
  }
}

export const EvaluatorFactory = () => new DefaultEvaluator();
