/**
 * Layout Components - Event-Driven DOM Updates
 * Fixed: Header is now full width, separate from main content
 */

class Layout extends Component {
  render() {
    return `
      <div class="app-container" id="app-layout">
        <div id="sidebar-container"></div>
        <div id="header-container"></div>
        <div id="main-content-container"></div>
      </div>
    `;
  }

  onMount() {
    // Mount Sidebar
    const sidebarContainer = document.getElementById("sidebar-container");
    if (sidebarContainer) {
      const sidebar = new Sidebar({});
      sidebar.mount(sidebarContainer);
      this._sidebar = sidebar;
    }

    // Mount Header (separate, full width)
    const headerContainer = document.getElementById("header-container");
    if (headerContainer) {
      const header = new Header({});
      header.mount(headerContainer);
      this._header = header;
    }

    // Mount MainContent
    const mainContainer = document.getElementById("main-content-container");
    if (mainContainer) {
      const mainContent = new MainContent({});
      mainContent.mount(mainContainer);
      this._mainContent = mainContent;
    }
  }

  destroy() {
    this._sidebar?.destroy();
    this._header?.destroy();
    this._mainContent?.destroy();
  }
}

class Sidebar extends Component {
  constructor(props) {
    super(props);
    this.collapsed = localStorage.getItem("sidebarCollapsed") === "true";
    this.darkMode = localStorage.getItem("darkMode") === "true";
  }

  render() {
    return `
      <aside class="sidebar ${this.collapsed ? "collapsed" : ""}">
        <div class="sidebar-header">
          <span class="logo-icon">🦙</span>
          <span class="logo-text">Llama Proxy</span>
        </div>
        <nav class="sidebar-nav">
          <a href="/" class="nav-link" data-page="dashboard">
            <span>📊</span><span>Dashboard</span>
          </a>
          <a href="/models" class="nav-link" data-page="models">
            <span>📁</span><span>Models</span>
          </a>
          <a href="/presets" class="nav-link" data-page="presets">
            <span>⚡</span><span>Presets</span>
          </a>
          <a href="/logs" class="nav-link" data-page="logs">
            <span>📋</span><span>Logs</span>
          </a>
          <a href="/settings" class="nav-link" data-page="settings">
            <span>⚙️</span><span>Settings</span>
          </a>
        </nav>
        <div class="sidebar-footer">
          <button class="theme-toggle-btn" data-action="toggle-theme">${this.darkMode ? "☀️ Light" : "🌙 Dark"}</button>
          <button class="help-btn" data-action="keyboard-help">⌨️</button>
          <div class="connection-status" id="connection-status">
            <span class="dot disconnected"></span>
            <span class="text">Disconnected</span>
          </div>
        </div>
      </aside>
    `;
  }

  bindEvents() {
    this.on("click", "[data-page]", (e) => {
      const t = e.target.closest("[data-page]");
      if (t) {
        e.preventDefault();
        const p = t.dataset.page;
        window.router.navigate(`/${p === "dashboard" ? "" : p}`);
      }
    });

    this.on("click", "[data-action=toggle-theme]", () => {
      this.darkMode = !this.darkMode;
      localStorage.setItem("darkMode", this.darkMode);
      if (this.darkMode) {
        document.documentElement.classList.add("dark-mode");
      } else {
        document.documentElement.classList.remove("dark-mode");
      }
      const btn = this.$("[data-action=toggle-theme]");
      if (btn) btn.textContent = this.darkMode ? "☀️ Light" : "🌙 Dark";
    });

    this.on("click", "[data-action=keyboard-help]", () => {
      console.log("[DEBUG] Opening keyboard shortcuts help");
      const shortcuts = window.keyboardShortcuts?.getAllShortcuts() || [];
      if (window.KeyboardShortcutsHelp) {
        const modal = new window.KeyboardShortcutsHelp({ shortcuts });
        const el = modal.render();
        document.body.appendChild(el);
        modal.bindEvents();
      }
    });
  }

  onMount() {
    if (this.darkMode) {
      document.documentElement.classList.add("dark-mode");
    }
  }
}

class MainContent extends Component {
  render() {
    return `
      <main class="main-content">
        <div id="page-content" class="page-content">
          <div class="loading-screen">
            <div class="spinner"></div>
            <p>Connecting...</p>
          </div>
        </div>
      </main>
    `;
  }
}

class Header extends Component {
  constructor(props) {
    super(props);
    this.online = false;
    this._routeHandler = null;
  }

  render() {
    const p = window.location.pathname;
    const titles = {
      "/": "Dashboard",
      "/models": "Models",
      "/presets": "Presets",
      "/logs": "Logs",
      "/settings": "Settings",
    };
    const title = titles[p] || "Dashboard";

    return `
      <header class="page-header">
        <button class="menu-btn" data-action="toggle">☰</button>
        <h1 id="page-title">${title}</h1>
        <div class="header-status">
          <span class="badge offline">● Offline</span>
        </div>
      </header>
    `;
  }

  bindEvents() {
    this.on("click", "[data-action=toggle]", () => {
      this._toggleSidebar();
    });
  }

  _toggleSidebar() {
    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
      sidebar.classList.toggle("collapsed");
      const isCollapsed = sidebar.classList.contains("collapsed");
      localStorage.setItem("sidebarCollapsed", isCollapsed);
    }
  }

  onMount() {
    stateManager.subscribe("connectionStatus", (s) => {
      this.online = s === "connected";
      this._updateUI(s);
    });

    this._routeHandler = () => {
      const t = this.$("#page-title");
      if (t) {
        const p = window.location.pathname;
        const titles = {
          "/": "Dashboard",
          "/models": "Models",
          "/presets": "Presets",
          "/logs": "Logs",
          "/settings": "Settings",
        };
        t.textContent = titles[p] || "Dashboard";
      }
    };
    window.addEventListener("routechange", this._routeHandler);
    window.addEventListener("popstate", this._routeHandler);
  }

  destroy() {
    if (this._routeHandler) {
      window.removeEventListener("routechange", this._routeHandler);
      window.removeEventListener("popstate", this._routeHandler);
    }
  }

  _updateUI(s) {
    const st = document.getElementById("connection-status");
    if (st) {
      const dot = st.querySelector(".dot");
      const txt = st.querySelector(".text");
      if (dot) dot.className = `dot ${s === "connected" ? "connected" : "disconnected"}`;
      if (txt) txt.textContent = s === "connected" ? "Connected" : "Disconnected";
    }
    const hs = this.$(".header-status");
    if (hs) {
      hs.innerHTML =
        s === "connected"
          ? '<span class="badge online">● Online</span>'
          : '<span class="badge offline">● Offline</span>';
    }
  }
}

window.Layout = Layout;
window.Sidebar = Sidebar;
window.MainContent = MainContent;
window.Header = Header;
