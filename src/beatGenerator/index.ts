export * from './domain/models';
export * from './domain/ports';
export * from './TrapBeatGenerator';

import { EscalaServiceFactory } from './services/EscalaService';
import { ArmoniaServiceFactory } from './services/ArmoniaService';
import { RitmoServiceFactory } from './services/RitmoService';
import { MelodiaGeneratorFactory } from './services/MelodiaGenerator';
import { PercusionGeneratorFactory } from './services/PercusionGenerator';
import { Bajo808GeneratorFactory } from './services/Bajo808Generator';
import { HumanizerFactory } from './services/Humanizer';
import { EvaluatorFactory } from './services/Evaluator';
import { TrapBeatGeneratorFactory } from './TrapBeatGenerator';

export const createTrapBeatGenerator = () => {
  const escala = EscalaServiceFactory();
  const armonia = ArmoniaServiceFactory();
  const ritmo = RitmoServiceFactory();
  const melodia = MelodiaGeneratorFactory(armonia);
  const percusion = PercusionGeneratorFactory();
  const bajo = Bajo808GeneratorFactory();
  const humanizer = HumanizerFactory();
  const evaluator = EvaluatorFactory();

  return TrapBeatGeneratorFactory({
    escala,
    armonia,
    ritmo,
    melodia,
    percusion,
    bajo,
    humanizer,
    evaluator,
  });
};
