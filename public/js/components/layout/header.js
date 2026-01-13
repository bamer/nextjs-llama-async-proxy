/**
 * Header Component
 * Page header with navigation toggle and connection status
 */

class Header extends Component {
  constructor(props) {
    super(props);
    this.online = false;
    this._routeHandler = null;
    this.unsubscribers = [];
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
      <header class="page-header" role="banner">
        <button type="button" class="menu-btn" data-action="toggle" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="sidebar-container">
          <span aria-hidden="true">☰</span>
        </button>
        <h1 id="page-title">${title}</h1>
        <div class="header-status" role="status" aria-live="polite">
          <span class="badge offline" aria-label="Connection status">● Offline</span>
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
    const menuBtn = this.$(".menu-btn");
    if (sidebar) {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        sidebar.classList.toggle("open");
        sidebar.classList.remove("collapsed");
        const isOpen = sidebar.classList.contains("open");
        if (menuBtn) menuBtn.setAttribute("aria-expanded", isOpen);
      } else {
        sidebar.classList.toggle("collapsed");
        sidebar.classList.remove("open");
        const isCollapsed = sidebar.classList.contains("collapsed");
        localStorage.setItem("sidebarCollapsed", isCollapsed);
      }
    }
  }

  onMount() {
    this.unsubscribers.push(
      stateManager.subscribe("connectionStatus", (s) => {
        this.online = s === "connected";
        this._updateUI(s);
      })
    );

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
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
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
      hs.innerHTML = s === "connected"
        ? '<span class="badge online" aria-label="Connection status">● Online</span>'
        : '<span class="badge offline" aria-label="Connection status">● Offline</span>';
    }
  }
}

window.Header = Header;
