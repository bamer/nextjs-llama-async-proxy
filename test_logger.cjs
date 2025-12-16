// Test pour logger.ts
const path = require('path');
const loggerPath = path.join(__dirname, '../src/lib/logger.ts');
console.log(`Chemin du logger : ${loggerPath}`);

// Tester l'importation avec require (CommonJS)
try {
  const logger = require('../src/lib/logger');
  logger.info('Test du logger depuis un fichier CommonJS');
  console.log('Logger importé avec succès !');
} catch (err) {
  console.error('Erreur lors de limportation du logger :', err);
}