import assert from 'assert';

import { createTrapBeatGenerator } from '../src/beatGenerator';
import { EscalaServiceFactory } from '../src/beatGenerator/services/EscalaService';
import { RitmoServiceFactory } from '../src/beatGenerator/services/RitmoService';

export const runTrapBeatGeneratorTests = () => {
  const escala = EscalaServiceFactory();
  const mask = escala.mask(0, 'harmonic');
  assert.strictEqual(mask.length, 12, 'mask should contain 12 pitch classes');
  assert.deepStrictEqual(mask, [1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1], 'harmonic minor mask matches reference');

  const quantized = escala.cuantizar(62, mask, 60);
  const allowed = [0, 2, 3, 5, 7, 8, 11];
  assert.strictEqual(allowed.includes(quantized % 12), true, 'quantized note should belong to scale');

  const ritmo = RitmoServiceFactory();
  const pattern = ritmo.euclid(5, 8);
  assert.strictEqual(pattern.filter(Boolean).length, 5, 'euclidean pattern has expected pulses');

  const generator = createTrapBeatGenerator();
  const patternResult = generator.generate({
    bpm: 142,
    compases: 4,
    tonicMidi: 54,
    mode: 'harmonic',
    randomSeed: 1337,
    darknessCeiling: 8,
    melodyRange: [54, 78],
  });

  assert.strictEqual(patternResult.chords.length, 4, 'chord progression should match compases');
  assert.ok(patternResult.melody.notas.length > 0, 'melody must contain notes');
  assert.ok(patternResult.hats.notas.length > 0, 'hats must contain notes');
  assert.ok(patternResult.bass808.notas.length > 0, 'bass must contain notes');

  const melodyMask = escala.mask(patternResult.metadata.tonicMidi % 12, patternResult.metadata.mode);
  for (const nota of patternResult.melody.notas) {
    assert.ok(
      nota.midi >= 54 && nota.midi <= 78,
      `melody midi ${nota.midi} stays within configured range`
    );
    assert.strictEqual(melodyMask[nota.midi % 12], 1, 'melody note aligns with scale mask');
  }

  const hatDensity = patternResult.hats.notas.length / patternResult.metadata.compases;
  assert.ok(hatDensity > 8, 'hi-hat density fits trap expectations');

  const glideCount = patternResult.bass808.glides?.length ?? 0;
  assert.ok(glideCount >= 2, '808 pattern includes glides for expressiveness');

  assert.ok(patternResult.metadata.darkness >= 0, 'darkness metric should be non-negative');
  assert.ok(
    patternResult.metadata.darkness <= 8,
    `darkness metric ${patternResult.metadata.darkness} under configured ceiling`
  );
};
