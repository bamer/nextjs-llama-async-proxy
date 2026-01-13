/**
 * Sidebar Component
 * Event-driven navigation sidebar with collapse functionality
 */

class Sidebar extends Component {
  constructor(props) {
    super(props);
    this.collapsed = localStorage.getItem("sidebarCollapsed") === "true";
    this.darkMode = localStorage.getItem("darkMode") === "true";
    this.currentPage = this.getCurrentPage();
  }

  getCurrentPage() {
    const path = window.location.pathname;
    if (path === "/" || path === "/dashboard") return "dashboard";
    return path.substring(1); // Remove leading slash
  }

  render() {
    return `
      <aside class="sidebar ${this.collapsed ? "collapsed" : ""}" role="navigation" aria-label="Main navigation">
        <div class="sidebar-header">
          <span class="logo-icon" aria-hidden="true">🦙</span>
          <span class="logo-text">Llama Proxy</span>
        </div>
        <nav class="sidebar-nav" aria-label="Main navigation">
          <button type="button" class="nav-link ${this.currentPage === "dashboard" ? "active" : ""}" data-page="dashboard" aria-label="Dashboard">
            <span aria-hidden="true">📊</span><span>Dashboard</span>
          </button>
          <button type="button" class="nav-link ${this.currentPage === "models" ? "active" : ""}" data-page="models" aria-label="Models">
            <span aria-hidden="true">📁</span><span>Models</span>
          </button>
          <button type="button" class="nav-link ${this.currentPage === "presets" ? "active" : ""}" data-page="presets" aria-label="Presets">
            <span aria-hidden="true">⚡</span><span>Presets</span>
          </button>
          <button type="button" class="nav-link ${this.currentPage === "logs" ? "active" : ""}" data-page="logs" aria-label="Logs">
            <span aria-hidden="true">📋</span><span>Logs</span>
          </button>
          <button type="button" class="nav-link ${this.currentPage === "settings" ? "active" : ""}" data-page="settings" aria-label="Settings">
            <span aria-hidden="true">⚙️</span><span>Settings</span>
          </button>
        </nav>
        <div class="sidebar-footer">
          <button type="button" class="theme-toggle-btn" data-action="toggle-theme" aria-label="Toggle dark mode">
            <span aria-hidden="true">${this.darkMode ? "☀️" : "🌙"}</span>
            <span class="sr-only">${this.darkMode ? "Switch to light mode" : "Switch to dark mode"}</span>
          </button>
          <button type="button" class="help-btn" data-action="keyboard-help" aria-label="View keyboard shortcuts">
            <span aria-hidden="true">⌨️</span>
            <span class="sr-only">Keyboard Shortcuts</span>
          </button>
          <div class="connection-status" id="connection-status" role="status" aria-live="polite">
            <span class="dot disconnected" aria-hidden="true"></span>
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
      if (btn) {
        const icon = btn.querySelector("span[aria-hidden='true']");
        const label = btn.querySelector(".sr-only");
        if (icon) icon.textContent = this.darkMode ? "☀️" : "🌙";
        if (label) label.textContent = this.darkMode ? "Switch to light mode" : "Switch to dark mode";
      }
    });

    this.on("click", "[data-action=keyboard-help]", () => {
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

    // Listen for navigation changes to update active state
    if (window.router) {
      this.unsubscribeRouter = window.router.subscribe(() => {
        const newPage = this.getCurrentPage();
        if (newPage !== this.currentPage) {
          this.currentPage = newPage;
          this.updateActiveState();
        }
      });
    }
  }

  updateActiveState() {
    // Remove active class from all nav links
    this.$$(".nav-link").forEach(btn => btn.classList.remove("active"));

    // Add active class to current page button
    const activeBtn = this.$(`.nav-link[data-page="${this.currentPage}"]`);
    if (activeBtn) {
      activeBtn.classList.add("active");
    }
  }

  destroy() {
    if (this.unsubscribeRouter) {
      this.unsubscribeRouter();
    }
    super.destroy();
  }
}

window.Sidebar = Sidebar;
