import { runTrapBeatGeneratorTests } from './TrapBeatGenerator.test';

(async () => {
  try {
    runTrapBeatGeneratorTests();
    console.log('Trap beat generator tests passed');
  } catch (err) {
    console.error('Test failure:', err);
    process.exit(1);
  }
})();
