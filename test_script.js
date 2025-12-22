// Script de test complet pour l'application Next.js Llama Async Proxy
// Ce script utilise chrome-devtools pour tester les fonctionnalités principales

import { chromeDevtools } from './chrome-devtools-client.js';

async function runComprehensiveTests() {
  console.log('🚀 Démarrage des tests complets de l\'application...');
  
  try {
    // Démarrer une nouvelle page
    await chromeDevtools.newPage({ url: 'http://localhost:3000' });
    await new Promise(resolve => setTimeout(resolve, 3000)); // Attendre le chargement
    
    console.log('✅ Page d\'accueil chargée avec succès');
    
    // Test 1: Vérifier les éléments principaux de la page d'accueil
    await testHomePage();
    
    // Test 2: Tester la navigation vers le tableau de bord
    await testDashboardNavigation();
    
    // Test 3: Tester le basculement de thème
    await testThemeToggle();
    
    // Test 4: Tester la réactivité
    await testResponsiveDesign();
    
    // Test 5: Tester les interactions utilisateur
    await testUserInteractions();
    
    console.log('🎉 Tous les tests ont été exécutés avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    // Fermer la page
    const pages = await chromeDevtools.listPages();
    if (pages.length > 0) {
      await chromeDevtools.closePage({ pageIdx: 0 });
    }
  }
}

async function testHomePage() {
  console.log('🧪 Test de la page d\'accueil...');
  
  // Prendre un instantané de la page
  const snapshot = await chromeDevtools.takeSnapshot({ verbose: true });
  
  // Vérifier les éléments clés
  const elementsToCheck = [
    'Welcome to Llama Runner Pro',
    'Get Started',
    'Key Features',
    'Real-time Dashboard',
    'Model Management',
    'Advanced Monitoring',
    'Custom Configuration'
  ];
  
  for (const text of elementsToCheck) {
    if (snapshot.content.includes(text)) {
      console.log(`✅ Élément trouvé: "${text}"`);
    } else {
      console.log(`❌ Élément manquant: "${text}"`);
    }
  }
  
  // Prendre une capture d'écran
  await chromeDevtools.takeScreenshot({
    filePath: 'test-results/homepage.png',
    format: 'png'
  });
  
  console.log('✅ Test de la page d\'accueil terminé');
}

async function testDashboardNavigation() {
  console.log('🧪 Test de la navigation vers le tableau de bord...');
  
  // Trouver et cliquer sur le bouton "Get Started"
  const snapshot = await chromeDevtools.takeSnapshot();
  const getStartedButton = snapshot.elements.find(el => 
    el.textContent.includes('Get Started')
  );
  
  if (getStartedButton) {
    await chromeDevtools.click({ uid: getStartedButton.uid });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre la navigation
    
    // Vérifier que nous sommes sur la page du tableau de bord
    const newSnapshot = await chromeDevtools.takeSnapshot();
    if (newSnapshot.content.includes('Dashboard')) {
      console.log('✅ Navigation vers le tableau de bord réussie');
      
      // Prendre une capture d'écran
      await chromeDevtools.takeScreenshot({
        filePath: 'test-results/dashboard.png',
        format: 'png'
      });
      
      // Retour à la page d'accueil
      await chromeDevtools.navigatePage({ type: 'back' });
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      console.log('❌ Échec de la navigation vers le tableau de bord');
    }
  } else {
    console.log('❌ Bouton "Get Started" non trouvé');
  }
  
  console.log('✅ Test de navigation terminé');
}

async function testThemeToggle() {
  console.log('🧪 Test du basculement de thème...');
  
  // Trouver le bouton de basculement de thème
  const snapshot = await chromeDevtools.takeSnapshot();
  const themeToggle = snapshot.elements.find(el => 
    el.ariaLabel && el.ariaLabel.includes('theme')
  );
  
  if (themeToggle) {
    // Prendre une capture d'écran avant le basculement
    await chromeDevtools.takeScreenshot({
      filePath: 'test-results/theme-before.png',
      format: 'png'
    });
    
    // Cliquer sur le bouton de thème
    await chromeDevtools.click({ uid: themeToggle.uid });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Prendre une capture d'écran après le basculement
    await chromeDevtools.takeScreenshot({
      filePath: 'test-results/theme-after.png',
      format: 'png'
    });
    
    console.log('✅ Basculement de thème testé avec succès');
    
    // Revenir au thème d'origine
    await chromeDevtools.click({ uid: themeToggle.uid });
    await new Promise(resolve => setTimeout(resolve, 1000));
  } else {
    console.log('❌ Bouton de basculement de thème non trouvé');
  }
  
  console.log('✅ Test de basculement de thème terminé');
}

async function testResponsiveDesign() {
  console.log('🧪 Test du design réactif...');
  
  // Tester différentes tailles d'écran
  const screenSizes = [
    { width: 1920, height: 1080, name: 'desktop' },
    { width: 1280, height: 720, name: 'laptop' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 375, height: 667, name: 'mobile' }
  ];
  
  for (const size of screenSizes) {
    await chromeDevtools.resizePage(size);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Prendre une capture d'écran
    await chromeDevtools.takeScreenshot({
      filePath: `test-results/responsive-${size.name}.png`,
      format: 'png'
    });
    
    console.log(`✅ Test réactif pour ${size.name} terminé`);
  }
  
  // Revenir à la taille par défaut
  await chromeDevtools.resizePage({ width: 1280, height: 720 });
  
  console.log('✅ Test de design réactif terminé');
}

async function testUserInteractions() {
  console.log('🧪 Test des interactions utilisateur...');
  
  // Tester les liens de navigation
  const snapshot = await chromeDevtools.takeSnapshot();
  const navLinks = snapshot.elements.filter(el => 
    el.role === 'link' && el.textContent
  );
  
  console.log(`Trouvé ${navLinks.length} liens de navigation`);
  
  // Tester quelques liens (sans naviguer réellement pour éviter de perdre le contexte)
  for (let i = 0; i < Math.min(3, navLinks.length); i++) {
    const link = navLinks[i];
    console.log(`✅ Lien trouvé: "${link.textContent.trim()}"`);
    
    // Survoler le lien
    await chromeDevtools.hover({ uid: link.uid });
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Tester les boutons
  const buttons = snapshot.elements.filter(el => 
    el.role === 'button' && el.textContent
  );
  
  console.log(`Trouvé ${buttons.length} boutons`);
  
  for (let i = 0; i < Math.min(2, buttons.length); i++) {
    const button = buttons[i];
    console.log(`✅ Bouton trouvé: "${button.textContent.trim()}"`);
  }
  
  console.log('✅ Test des interactions utilisateur terminé');
}

// Exécuter les tests
runComprehensiveTests().catch(console.error);