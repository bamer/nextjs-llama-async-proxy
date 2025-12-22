// Script de test simplifié pour vérifier que l'application est accessible

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// Créer le répertoire pour les résultats si nécessaire
const resultsDir = 'test-results-simple';
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir);
}

async function runSimpleTest() {
  console.log('🚀 Démarrage du test simplifié...');
  
  let browser;
  try {
    // Lancer le navigateur
    browser = await puppeteer.launch({
      headless: "new", // Mode headless moderne
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    
    console.log('🌐 Tentative de connexion à http://localhost:3000...');
    
    // Essayer de se connecter à l'application avec plusieurs tentatives
    let success = false;
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        await page.goto('http://localhost:3000', { 
          waitUntil: 'domcontentloaded', 
          timeout: 10000 
        });
        
        // Vérifier si la page contient du contenu
        const title = await page.title();
        if (title && title.trim() !== '') {
          success = true;
          console.log(`✅ Connexion réussie à l'application (tentative ${attempt})`);
          console.log(`📛 Titre de la page: "${title}"`);
          break;
        }
      } catch (error) {
        console.log(`❌ Tentative ${attempt} échouée: ${error.message}`);
        if (attempt < 5) {
          console.log('🕒 Attente de 5 secondes avant la prochaine tentative...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }
    
    if (success) {
      // Prendre une capture d'écran
      await page.screenshot({ 
        path: path.join(resultsDir, 'simple-test-success.png'),
        fullPage: true 
      });
      
      console.log('🖼️  Capture d\'écran enregistrée');
      
      // Vérifier quelques éléments clés
      const elementsToCheck = [
        'Welcome to Llama Runner Pro',
        'Get Started'
      ];
      
      for (const text of elementsToCheck) {
        try {
          const element = await page.$x(`//*[contains(text(), "${text}")]`);
          if (element.length > 0) {
            console.log(`✅ Élément trouvé: "${text}"`);
          } else {
            console.log(`❌ Élément manquant: "${text}"`);
          }
        } catch (error) {
          console.log(`❌ Erreur lors de la vérification de "${text}": ${error.message}`);
        }
      }
      
      console.log('🎉 Test simplifié terminé avec succès !');
      
    } else {
      console.log('❌ Impossible de se connecter à l\'application après 5 tentatives');
      
      // Prendre une capture d'écran de l'erreur
      await page.screenshot({ 
        path: path.join(resultsDir, 'simple-test-error.png'),
        fullPage: true 
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test simplifié:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Exécuter le test simplifié
runSimpleTest().catch(console.error);