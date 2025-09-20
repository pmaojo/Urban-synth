import type { EscalaService } from '../domain/ports';
import type { ScaleMode } from '../domain/models';

const SCALE_MASKS: Record<ScaleMode, number[]> = {
  minor: [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0],
  harmonic: [1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1],
  phrygianDom: [1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0],
};

const SCALE_INTERVALS: Record<ScaleMode, number[]> = Object.fromEntries(
  (Object.entries(SCALE_MASKS) as [ScaleMode, number[]][]).map(([mode, mask]) => [
    mode,
    mask
      .map((value, ix) => ({ value, ix }))
      .filter(({ value }) => value === 1)
      .map(({ ix }) => ix),
  ])
) as Record<ScaleMode, number[]>;

const mod = (n: number, m: number) => ((n % m) + m) % m;

export class DefaultEscalaService implements EscalaService {
  cuantizar(midi: number, mask: number[], tonic: number): number {
    const pitchClass = mod(midi, 12);
    if (mask[pitchClass] === 1) {
      return midi;
    }

    for (let delta = 1; delta <= 6; delta += 1) {
      const up = mod(pitchClass + delta, 12);
      if (mask[up] === 1) {
        return midi + delta;
      }
      const down = mod(pitchClass - delta, 12);
      if (mask[down] === 1) {
        return midi - delta;
      }
    }

    return tonic;
  }

  mask(tonic: number, modo: ScaleMode): number[] {
    const baseMask = SCALE_MASKS[modo];
    const rotated = new Array(12).fill(0);
    for (let i = 0; i < 12; i += 1) {
      rotated[i] = baseMask[mod(i - tonic, 12)];
    }
    return rotated;
  }

  buildScaleNotes(tonicMidi: number, modo: ScaleMode, octaves: number): number[] {
    const intervals = SCALE_INTERVALS[modo];
    const notes: number[] = [];
    for (let octave = 0; octave < octaves; octave += 1) {
      for (const interval of intervals) {
        notes.push(tonicMidi + interval + octave * 12);
      }
    }
    return notes;
  }
}

export const EscalaServiceFactory = () => new DefaultEscalaService();
