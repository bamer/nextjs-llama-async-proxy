// Client simplifié pour chrome-devtools
// Ce client simule les fonctionnalités de base pour les tests

class ChromeDevtoolsClient {
  constructor() {
    this.pages = [];
    this.currentPage = null;
  }
  
  async newPage({ url }) {
    console.log(`🌐 Ouverture de la page: ${url}`);
    this.currentPage = {
      id: Date.now(),
      url,
      elements: []
    };
    this.pages.push(this.currentPage);
    return this.currentPage;
  }
  
  async listPages() {
    return this.pages;
  }
  
  async closePage({ pageIdx }) {
    if (this.pages[pageIdx]) {
      console.log(`🗑️  Fermeture de la page: ${this.pages[pageIdx].url}`);
      this.pages.splice(pageIdx, 1);
      if (this.pages.length > 0) {
        this.currentPage = this.pages[0];
      } else {
        this.currentPage = null;
      }
    }
    return true;
  }
  
  async takeSnapshot({ verbose = false } = {}) {
    console.log('📸 Prise d\'un instantané de la page...');
    
    // Simuler un instantané avec des éléments courants
    const snapshot = {
      content: `
        <html>
          <body>
            <h1>Welcome to Llama Runner Pro</h1>
            <button id="get-started">Get Started</button>
            <nav>
              <a href="/dashboard">Dashboard</a>
              <a href="/models">Models</a>
              <a href="/monitoring">Monitoring</a>
              <a href="/settings">Settings</a>
            </nav>
            <button id="theme-toggle" aria-label="Toggle theme">🌓</button>
            <div class="features">
              <h2>Key Features</h2>
              <div>Real-time Dashboard</div>
              <div>Model Management</div>
              <div>Advanced Monitoring</div>
              <div>Custom Configuration</div>
            </div>
          </body>
        </html>
      `,
      elements: [
        {
          uid: 'header-1',
          textContent: 'Welcome to Llama Runner Pro',
          role: 'heading'
        },
        {
          uid: 'get-started-btn',
          textContent: 'Get Started',
          role: 'button'
        },
        {
          uid: 'dashboard-link',
          textContent: 'Dashboard',
          role: 'link',
          href: '/dashboard'
        },
        {
          uid: 'models-link',
          textContent: 'Models',
          role: 'link',
          href: '/models'
        },
        {
          uid: 'theme-toggle-btn',
          textContent: '🌓',
          role: 'button',
          ariaLabel: 'Toggle theme'
        }
      ]
    };
    
    if (verbose) {
      console.log('📝 Contenu de l\'instantané:');
      console.log(snapshot.content.substring(0, 200) + '...');
    }
    
    return snapshot;
  }
  
  async takeScreenshot({ filePath, format = 'png' }) {
    console.log(`🖼️  Capture d'écran enregistrée: ${filePath}.${format}`);
    return { success: true, filePath: `${filePath}.${format}` };
  }
  
  async click({ uid }) {
    console.log(`🖱️  Clic sur l'élément: ${uid}`);
    return { success: true };
  }
  
  async hover({ uid }) {
    console.log(`🖱️  Survol de l'élément: ${uid}`);
    return { success: true };
  }
  
  async navigatePage({ type }) {
    console.log(`🔄 Navigation: ${type}`);
    return { success: true };
  }
  
  async resizePage({ width, height }) {
    console.log(`📐 Redimensionnement de la page: ${width}x${height}`);
    return { success: true };
  }
  
  async waitFor({ text, timeout = 5000 }) {
    console.log(`⏳ Attente du texte: "${text}" (timeout: ${timeout}ms)`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  }
}

export const chromeDevtools = new ChromeDevtoolsClient();