// test_logger.ts

// Importer le logger depuis le bon chemin
import logger from './src/lib/logger.ts';

// Tester le logger
logger.info('Test du logger Winston en ES Modules - Fonctionne-t-il ?');
console.log('Logger testé avec succès !');