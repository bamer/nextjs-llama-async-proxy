class Sidebar extends Component {
  /**
   * Initializes the Sidebar component with collapse and dark mode states.
   * @param {Object} props - Component properties.
   */
  constructor(props) {
    super(props);
    this.collapsed = localStorage.getItem("sidebarCollapsed") === "true";
    this.darkMode = localStorage.getItem("darkMode") === "true";
  }

  /**
   * Renders the sidebar navigation menu with navigation links and footer controls.
   * @returns {string} HTML string representing the sidebar.
   */
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
          <button class="theme-toggle-btn" data-action="toggle-theme" title="Toggle Theme">${this.darkMode ? "☀️" : "🌙"}</button>
          <button class="help-btn" data-action="keyboard-help" title="Keyboard Shortcuts">⌨️</button>
          <div class="connection-status" id="connection-status">
            <span class="dot disconnected"></span>
            <span class="text">Disconnected</span>
          </div>
        </div>
      </aside>
    `;
  }

  /**
   * Binds event listeners for navigation, theme toggle, and help actions.
   */
  bindEvents() {
    this.on("click", "[data-page]", (e) => {
      const t = e.target.closest("[data-page]");
      if (t) {
        e.preventDefault();
        const p = t.dataset.page;
        window.router.navigate(`/${p === "dashboard" ? "" : p}`);
      }
    });

    // Prefetch chart scripts when hovering over dashboard link
    this.on("mouseenter", "[data-page=dashboard]", () => {
      if (window.ChartLoader && !window.ChartLoader.loaded) {
        ChartLoader.prefetch();
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

  /**
   * Called after mounting to apply dark mode if enabled.
   */
  onMount() {
    if (this.darkMode) {
      document.documentElement.classList.add("dark-mode");
    }
  }
}
window.Sidebar = Sidebar;
