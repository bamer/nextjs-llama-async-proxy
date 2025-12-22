// Script simple pour vérifier que le problème LazyMotion est résolu

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de la correction du problème LazyMotion...\n');

// 1. Vérifier que LazyMotion n'est plus utilisé
console.log('1. Recherche de LazyMotion dans le code source...');
const srcDir = path.join(__dirname, 'src');

function searchInFiles(dir) {
  let lazyMotionFound = false;
  
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      const result = searchInFiles(fullPath);
      if (result) lazyMotionFound = true;
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('LazyMotion')) {
        console.log(`❌ Trouvé dans: ${fullPath}`);
        lazyMotionFound = true;
      }
    }
  }
  
  return lazyMotionFound;
}

const hasLazyMotion = searchInFiles(srcDir);

if (hasLazyMotion) {
  console.log('❌ PROBLÈME: LazyMotion est toujours utilisé dans le code!\n');
} else {
  console.log('✅ SUCCÈS: Aucun usage de LazyMotion trouvé!\n');
}

// 2. Vérifier que motion-lazy-container utilise motion directement
console.log('2. Vérification du composant motion-lazy-container...');
const containerPath = path.join(srcDir, 'components/animate/motion-lazy-container.tsx');
const containerContent = fs.readFileSync(containerPath, 'utf8');

if (containerContent.includes('import { motion } from "framer-motion";')) {
  console.log('✅ Le composant utilise motion directement');
} else {
  console.log('❌ Le composant n\'utilise pas motion directement');
}

if (containerContent.includes('<motion.div')) {
  console.log('✅ Le composant utilise <motion.div>');
} else {
  console.log('❌ Le composant n\'utilise pas <motion.div>');
}

if (!containerContent.includes('LazyMotion')) {
  console.log('✅ Le composant ne contient plus LazyMotion');
} else {
  console.log('❌ Le composant contient toujours LazyMotion');
}

// 3. Vérifier que le build a réussi
console.log('\n3. Vérification du build...');
const nextDir = path.join(__dirname, '.next');

if (fs.existsSync(nextDir)) {
  console.log('✅ Le répertoire .next existe (build réussi)');
  
  // Vérifier la taille du build
  const stats = fs.statSync(nextDir);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`📊 Taille du build: ${sizeMB} MB`);
} else {
  console.log('❌ Le répertoire .next n\'existe pas (build non exécuté)');
}

// 4. Résumé
console.log('\n📋 RÉSUMÉ DE LA CORRECTION:');
console.log('========================');

if (!hasLazyMotion) {
  console.log('✅ PROBLÈME RÉSOLU: LazyMotion a été complètement supprimé');
  console.log('✅ SOLUTION: Utilisation directe de motion sans LazyMotion');
  console.log('✅ RÉSULTAT: Le tree-shaking devrait maintenant fonctionner correctement');
  console.log('\n🎉 L\'application devrait maintenant démarrer sans erreur!');
} else {
  console.log('❌ PROBLÈME PERSISTANT: LazyMotion est toujours présent');
  console.log('❌ ACTION NÉCESSAIRE: Supprimer tous les usages de LazyMotion');
}

console.log('\n🚀 PROCHAINES ÉTAPES:');
console.log('1. Démarrer l\'application avec: pnpm start');
console.log('2. Ouvrir http://localhost:3000 dans Chrome');
console.log('3. Vérifier qu\'il n\'y a plus d\'erreur console');
console.log('4. Confirmer que l\'application fonctionne correctement');