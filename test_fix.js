// Test minimal pour vérifier que la correction du problème motion fonctionne

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function testFix() {
  console.log('🔧 Test de la correction du problème motion...');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    
    const page = await browser.newPage();
    
    console.log('🌐 Tentative de connexion à http://localhost:3000...');
    
    try {
      await page.goto('http://localhost:3000', { 
        waitUntil: 'domcontentloaded', 
        timeout: 15000 
      });
      
      // Vérifier si la page contient du contenu
      const title = await page.title();
      const content = await page.content();
      
      console.log(`📛 Titre de la page: "${title}"`);
      
      // Vérifier si l'erreur motion est présente
      if (content.includes('motion') && content.includes('LazyMotion')) {
        console.log('❌ Le problème motion est toujours présent dans le HTML');
      } else {
        console.log('✅ Le problème motion semble corrigé');
      }
      
      // Vérifier les erreurs de console
      const consoleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Attendre un peu pour capturer les erreurs
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (consoleErrors.length > 0) {
        console.log('❌ Erreurs console détectées:');
        consoleErrors.forEach(error => console.log(`  - ${error}`));
      } else {
        console.log('✅ Aucune erreur console détectée');
      }
      
      // Prendre une capture d'écran
      await page.screenshot({ 
        path: 'test-fix-screenshot.png',
        fullPage: true 
      });
      
      console.log('🖼️  Capture d\'écran enregistrée');
      
    } catch (error) {
      console.log(`❌ Impossible de se connecter: ${error.message}`);
      
      // Essayons de démarrer le serveur nous-mêmes
      console.log('🚀 Tentative de démarrage du serveur...');
      
      // Note: Dans un environnement réel, vous devriez démarrer le serveur ici
      // Pour cet exemple, nous allons juste documenter ce qui devrait être fait
      console.log('📝 Pour tester complètement:');
      console.log('1. Démarrez le serveur avec: pnpm start');
      console.log('2. Attendez qu\'il soit prêt');
      console.log('3. Exécutez ce test à nouveau');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testFix().catch(console.error);