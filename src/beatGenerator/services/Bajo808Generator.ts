import type { Bajo808Generator } from '../domain/ports';
import type { Patron, Nota, RandomSource, Chord, GlideEvent } from '../domain/models';

const EIGHTH = 0.5;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const choose = <T>(items: T[], random: RandomSource): T => {
  const ix = Math.floor(random() * items.length);
  return items[ix % items.length]!;
};

const euclid = (k: number, n: number): boolean[] => {
  const pattern: boolean[] = new Array(n).fill(false);
  let accumulator = 0;
  for (let i = 0; i < n; i += 1) {
    accumulator += k;
    if (accumulator >= n) {
      accumulator -= n;
      pattern[i] = true;
    }
  }
  return pattern;
};

const selectBassPitch = (chord: Chord, tonic: number, random: RandomSource): number => {
  const candidates = [chord.bassNote, chord.notes[0], chord.notes[0] - 5, chord.notes[0] - 7];
  const choice = choose(candidates, random);
  return clamp(choice, tonic - 36, tonic - 12);
};

export class DefaultBajo808Generator implements Bajo808Generator {
  generar({ compases, bpm: _bpm, progression, escala, tonic, mode, random }: Parameters<Bajo808Generator['generar']>[0]): Patron {
    const notas: Nota[] = [];
    const glides: GlideEvent[] = [];
    let previousNote: Nota | null = null;

    for (let bar = 0; bar < compases; bar += 1) {
      const chord = progression[bar % progression.length]!;
      const pulses = random() > 0.5 ? 5 : 4;
      const pattern = euclid(pulses, 8);
      for (let step = 0; step < pattern.length; step += 1) {
        if (!pattern[step] && random() > 0.2) {
          continue;
        }
        const time = bar * 4 + step * EIGHTH;
        const mask = escala.mask(tonic % 12, mode);
        let midi = escala.cuantizar(selectBassPitch(chord, tonic, random), mask, tonic);
        if (previousNote && Math.abs(previousNote.midi - midi) < 2) {
          const alternatives = [chord.notes[0] - 12, chord.notes[0] - 7, chord.notes[0] - 5];
          for (const alt of alternatives) {
            const quantized = escala.cuantizar(alt, mask, tonic);
            if (Math.abs(previousNote.midi - quantized) >= 2) {
              midi = quantized;
              break;
            }
          }
        }
        const duration = EIGHTH * (pattern[step] ? 0.9 : 0.5);
        const velocity = clamp(108 + Math.floor(random() * 14) - 7, 80, 127);
        const note: Nota = { t: time, dur: duration, midi, vel: velocity };
        notas.push(note);

        if (previousNote && previousNote.midi !== note.midi) {
          const glideDuration = Math.min(duration, 0.75);
          const curveK = 6 + random() * 4;
          glides.push({ start: time, duration: glideDuration, fromMidi: previousNote.midi, toMidi: note.midi, curveK });
        }
        previousNote = note;
      }
    }

    return { notas, glides };
  }
}

export const Bajo808GeneratorFactory = () => new DefaultBajo808Generator();
