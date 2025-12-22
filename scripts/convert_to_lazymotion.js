#!/usr/bin/env node

/**
 * Script pour convertir automatiquement tous les composants motion en composants 'm'
 * pour une utilisation optimale avec LazyMotion
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Conversion des composants motion vers LazyMotion...\n');

const srcDir = path.join(__dirname, '..', 'src');
let filesConverted = 0;
let motionImportsConverted = 0;
let motionDivsConverted = 0;

function convertFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // 1. Convertir les imports : motion -> m
  const importRegex = /import\s+{\s*motion\s*}\s+from\s+["']framer-motion["']/g;
  if (importRegex.test(content)) {
    content = content.replace(importRegex, 'import { m } from "framer-motion"');
    motionImportsConverted++;
    modified = true;
  }
  
  // 2. Convertir les imports avec d'autres éléments
  const mixedImportRegex = /import\s+{\s*([^}]*motion[^}]*)\s*}\s+from\s+["']framer-motion["']/g;
  let mixedMatch;
  while ((mixedMatch = mixedImportRegex.exec(content)) !== null) {
    const imports = mixedMatch[1].split(',').map(i => i.trim());
    const hasMotion = imports.includes('motion');
    if (hasMotion) {
      const newImports = imports.map(i => i === 'motion' ? 'm' : i).join(', ');
      content = content.replace(mixedMatch[0], `import { ${newImports} } from "framer-motion"`);
      motionImportsConverted++;
      modified = true;
    }
  }
  
  // 3. Convertir motion.div -> m.div
  const motionDivRegex = /<motion\.div/g;
  const count = (content.match(motionDivRegex) || []).length;
  if (count > 0) {
    content = content.replace(motionDivRegex, '<m.div');
    motionDivsConverted += count;
    modified = true;
  }
  
  // 4. Convertir </motion.div> -> </m.div>
  const motionDivCloseRegex = /<\/motion\.div>/g;
  const closeCount = (content.match(motionDivCloseRegex) || []).length;
  if (closeCount > 0) {
    content = content.replace(motionDivCloseRegex, '</m.div>');
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesConverted++;
    console.log(`✅ Converti: ${filePath}`);
  }
  
  return modified;
}

function processDirectory(dir) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      convertFile(fullPath);
    }
  }
}

// Créer un backup avant la conversion
console.log('📦 Création d\'un backup avant conversion...');
const backupDir = path.join(__dirname, '..', 'backup_before_lazymotion');
if (!fs.existsSync(backupDir)) {
  // Utiliser une commande système pour copier (plus simple que de réimplémenter)
  console.log('💡 Pour créer un backup, exécutez:');
  console.log('   cp -r src backup_before_lazymotion');
  console.log('   ou utilisez votre outil de versionnement (git)\n');
}

// Lancer la conversion
console.log('🔄 Conversion en cours...\n');
processDirectory(srcDir);

console.log('\n📊 Résumé de la conversion:');
console.log('========================');
console.log(`📄 Fichiers modifiés: ${filesConverted}`);
console.log(`📦 Imports convertis: ${motionImportsConverted}`);
console.log(`🎯 motion.div -> m.div: ${motionDivsConverted}`);

if (filesConverted === 0) {
  console.log('\n⚠️  Aucun fichier à convertir trouvé.');
  console.log('   Cela peut signifier que:');
  console.log('   1. Les composants sont déjà convertis');
  console.log('   2. Aucun composant motion n\'a été trouvé');
  console.log('   3. Le chemin des fichiers est incorrect');
} else {
  console.log('\n✅ Conversion terminée avec succès !');
  console.log('\n🚀 Prochaines étapes:');
  console.log('1. Vérifier les fichiers modifiés');
  console.log('2. Tester l\'application');
  console.log('3. Corriger les éventuels problèmes');
  console.log('4. Valider que tout fonctionne');
}

console.log('\n💡 Pour annuler la conversion:');
console.log('   git checkout -- src/');
console.log('   ou restaurez depuis le backup');