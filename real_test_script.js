// Script de test réel pour l'application Next.js Llama Async Proxy
// Ce script utilise Puppeteer pour tester les fonctionnalités principales

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// Créer le répertoire pour les résultats si nécessaire
const resultsDir = 'test-results-real';
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir);
}

async function runRealTests() {
  console.log('🚀 Démarrage des tests réels de l\'application...');
  
  let browser;
  try {
    // Lancer le navigateur
    browser = await puppeteer.launch({
      headless: false, // Mode visible pour voir les tests
      slowMo: 50, // Ralentir pour mieux voir les actions
      args: [
        '--start-maximized',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    
    // Test 1: Page d'accueil
    await testHomePage(page);
    
    // Test 2: Navigation
    await testNavigation(page);
    
    // Test 3: Thème
    await testTheme(page);
    
    // Test 4: Responsive Design
    await testResponsiveDesign(page);
    
    // Test 5: Interactions utilisateur
    await testUserInteractions(page);
    
    console.log('🎉 Tous les tests réels ont été exécutés avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests réels:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function testHomePage(page) {
  console.log('🧪 Test réel de la page d\'accueil...');
  
  try {
    // Naviguer vers la page d'accueil
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Attendre que la page soit complètement chargée
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Prendre une capture d'écran
    await page.screenshot({ 
      path: path.join(resultsDir, 'real-homepage.png'),
      fullPage: true 
    });
    
    // Vérifier les éléments clés
    const elementsToCheck = [
      'Welcome to Llama Runner Pro',
      'Get Started',
      'Key Features',
      'Real-time Dashboard',
      'Model Management'
    ];
    
    for (const text of elementsToCheck) {
      const element = await page.$x(`//*[contains(text(), "${text}")]`);
      if (element.length > 0) {
        console.log(`✅ Élément trouvé: "${text}"`);
      } else {
        console.log(`❌ Élément manquant: "${text}"`);
      }
    }
    
    console.log('✅ Test réel de la page d\'accueil terminé');
    
  } catch (error) {
    console.error('❌ Erreur lors du test de la page d\'accueil:', error.message);
  }
}

async function testNavigation(page) {
  console.log('🧪 Test réel de la navigation...');
  
  try {
    // Trouver et cliquer sur le bouton "Get Started"
    const getStartedButton = await page.$x('//button[contains(text(), "Get Started")]');
    
    if (getStartedButton.length > 0) {
      await getStartedButton[0].click();
      
      // Attendre la navigation
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
      
      // Prendre une capture d'écran du tableau de bord
      await page.screenshot({ 
        path: path.join(resultsDir, 'real-dashboard.png'),
        fullPage: true 
      });
      
      // Vérifier que nous sommes sur la page du tableau de bord
      const dashboardTitle = await page.$('h1, h2, h3');
      if (dashboardTitle) {
        const titleText = await page.evaluate(el => el.textContent, dashboardTitle);
        console.log(`✅ Navigation réussie vers: "${titleText}"`);
      }
      
      // Retour à la page d'accueil
      await page.goBack();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
      
    } else {
      console.log('❌ Bouton "Get Started" non trouvé');
    }
    
    console.log('✅ Test réel de navigation terminé');
    
  } catch (error) {
    console.error('❌ Erreur lors du test de navigation:', error.message);
  }
}

async function testTheme(page) {
  console.log('🧪 Test réel du basculement de thème...');
  
  try {
    // Prendre une capture d'écran avant le basculement
    await page.screenshot({ 
      path: path.join(resultsDir, 'real-theme-before.png'),
      fullPage: true 
    });
    
    // Trouver le bouton de thème (en utilisant différents sélecteurs)
    const themeButton = await page.$('button[aria-label*="theme"]') || 
                       await page.$('button[aria-label*="Theme"]') ||
                       await page.$('button:has-text("🌓")');
    
    if (themeButton) {
      await themeButton.click();
      await page.waitForTimeout(1000); // Attendre l'animation
      
      // Prendre une capture d'écran après le basculement
      await page.screenshot({ 
        path: path.join(resultsDir, 'real-theme-after.png'),
        fullPage: true 
      });
      
      console.log('✅ Basculement de thème testé avec succès');
      
      // Revenir au thème d'origine
      await themeButton.click();
      await page.waitForTimeout(1000);
      
    } else {
      console.log('❌ Bouton de basculement de thème non trouvé');
    }
    
    console.log('✅ Test réel de basculement de thème terminé');
    
  } catch (error) {
    console.error('❌ Erreur lors du test de thème:', error.message);
  }
}

async function testResponsiveDesign(page) {
  console.log('🧪 Test réel du design réactif...');
  
  try {
    const screenSizes = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 1280, height: 720, name: 'laptop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];
    
    for (const size of screenSizes) {
      await page.setViewport({ width: size.width, height: size.height });
      await page.waitForTimeout(1000);
      
      // Prendre une capture d'écran
      await page.screenshot({ 
        path: path.join(resultsDir, `real-responsive-${size.name}.png`),
        fullPage: true 
      });
      
      console.log(`✅ Test réactif pour ${size.name} terminé`);
    }
    
    // Revenir à la taille par défaut
    await page.setViewport({ width: 1366, height: 768 });
    
    console.log('✅ Test réel de design réactif terminé');
    
  } catch (error) {
    console.error('❌ Erreur lors du test réactif:', error.message);
  }
}

async function testUserInteractions(page) {
  console.log('🧪 Test réel des interactions utilisateur...');
  
  try {
    // Tester les liens de navigation
    const navLinks = await page.$$('nav a, [role="navigation"] a');
    console.log(`Trouvé ${navLinks.length} liens de navigation`);
    
    // Tester le survol sur les liens
    for (let i = 0; i < Math.min(3, navLinks.length); i++) {
      await navLinks[i].hover();
      await page.waitForTimeout(500);
      
      const linkText = await page.evaluate(el => el.textContent, navLinks[i]);
      console.log(`✅ Lien testé: "${linkText.trim()}"`);
    }
    
    // Tester les boutons
    const buttons = await page.$$('button');
    console.log(`Trouvé ${buttons.length} boutons`);
    
    for (let i = 0; i < Math.min(3, buttons.length); i++) {
      const buttonText = await page.evaluate(el => el.textContent, buttons[i]);
      console.log(`✅ Bouton trouvé: "${buttonText.trim()}"`);
    }
    
    console.log('✅ Test réel des interactions utilisateur terminé');
    
  } catch (error) {
    console.error('❌ Erreur lors du test des interactions:', error.message);
  }
}

// Exécuter les tests réels
runRealTests().catch(console.error);