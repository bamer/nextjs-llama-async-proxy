// Test minimal pour vérifier que les corrections sont en place
// Ce test vérifie les fichiers, pas l'application en cours d'exécution

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification réelle des corrections...\n');

let allPassed = true;

// 1. Vérifier le layout.tsx
console.log('1. Vérification du layout.tsx...');
try {
  const layoutPath = path.join(__dirname, 'app', 'layout.tsx');
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  
  if (layoutContent.includes('export const viewport: Viewport')) {
    console.log('✅ viewport est exporté');
  } else {
    console.log('❌ viewport n\'est pas exporté');
    allPassed = false;
  }
  
  if (layoutContent.includes('themeColor') && layoutContent.includes('viewport')) {
    console.log('✅ themeColor est dans viewport');
  } else {
    console.log('❌ themeColor n\'est pas dans viewport');
    allPassed = false;
  }
  
  if (!layoutContent.includes('themeColor') || layoutContent.includes('viewport')) {
    // Vérifier que themeColor n'est PAS dans metadata
    const metadataMatch = layoutContent.match(/export const metadata:[^}]+}/s);
    if (metadataMatch && metadataMatch[0].includes('themeColor')) {
      console.log('❌ themeColor est encore dans metadata');
      allPassed = false;
    }
  }
} catch (error) {
  console.log('❌ Erreur lors de la lecture du layout:', error.message);
  allPassed = false;
}

// 2. Vérifier le manifest
console.log('\n2. Vérification du manifest...');
try {
  const manifestPath = path.join(__dirname, 'public', 'site.webmanifest');
  if (fs.existsSync(manifestPath)) {
    console.log('✅ site.webmanifest existe');
    
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);
    
    if (manifest.name && manifest.icons) {
      console.log('✅ manifest a une structure valide');
    } else {
      console.log('❌ manifest a une structure incomplète');
      allPassed = false;
    }
  } else {
    console.log('❌ site.webmanifest est manquant');
    allPassed = false;
  }
} catch (error) {
  console.log('❌ Erreur lors de la lecture du manifest:', error.message);
  allPassed = false;
}

// 3. Vérifier les icônes
console.log('\n3. Vérification des icônes...');
const icons = ['favicon.ico', 'apple-touch-icon.png'];
for (const icon of icons) {
  const iconPath = path.join(__dirname, 'public', icon);
  if (fs.existsSync(iconPath)) {
    const stats = fs.statSync(iconPath);
    if (stats.size > 0) {
      console.log(`✅ ${icon} existe (${stats.size} octets)`);
    } else {
      console.log(`⚠️  ${icon} existe mais est vide`);
    }
  } else {
    console.log(`❌ ${icon} est manquant`);
    allPassed = false;
  }
}

// 4. Vérifier le conteneur LazyMotion
console.log('\n4. Vérification du conteneur LazyMotion...');
try {
  const containerPath = path.join(__dirname, 'src', 'components', 'animate', 'motion-lazy-container.tsx');
  const containerContent = fs.readFileSync(containerPath, 'utf8');
  
  if (containerContent.includes('LazyMotion')) {
    console.log('✅ LazyMotion est utilisé');
    
    if (containerContent.includes('import { LazyMotion, domAnimation, m }')) {
      console.log('✅ Imports corrects');
    } else {
      console.log('❌ Imports incorrects');
      allPassed = false;
    }
    
    if (containerContent.includes('<m.div')) {
      console.log('✅ Utilise m.div');
    } else {
      console.log('❌ N\'utilise pas m.div');
      allPassed = false;
    }
  } else {
    console.log('❌ LazyMotion n\'est pas utilisé');
    allPassed = false;
  }
} catch (error) {
  console.log('❌ Erreur lors de la lecture du conteneur:', error.message);
  allPassed = false;
}

// 5. Résumé
console.log('\n📊 Résumé:');
console.log('================');
if (allPassed) {
  console.log('✅ Toutes les vérifications ont passé !');
  console.log('\n🎉 L\'application est prête pour :');
  console.log('1. Démarrage avec pnpm start');
  console.log('2. Test dans le navigateur');
  console.log('3. Vérification que tout fonctionne');
} else {
  console.log('❌ Certaines vérifications ont échoué');
  console.log('\nVeuillez corriger les problèmes identifiés.');
}

process.exit(allPassed ? 0 : 1);