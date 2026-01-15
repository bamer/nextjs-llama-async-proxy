class Header extends Component {
  /**
   * Initializes the Header component with connection status and route handler.
   * @param {Object} props - Component properties.
   */
  constructor(props) {
    super(props);
    this.online = false;
    this._routeHandler = null;
    this.unsubscribers = [];
  }

  /**
   * Renders the header with page title, menu toggle, and connection status.
   * @returns {string} HTML string representing the header.
   */
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

  /**
   * Binds event listeners for header actions like menu toggle.
   */
  bindEvents() {
    this.on("click", "[data-action=toggle]", () => {
      this._toggleSidebar();
    });
  }

  /**
   * Toggles the sidebar visibility for desktop and mobile views.
   */
  _toggleSidebar() {
    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        // On mobile, toggle 'open' class
        sidebar.classList.toggle("open");
        sidebar.classList.remove("collapsed");
      } else {
        // On desktop, toggle 'collapsed' class
        sidebar.classList.toggle("collapsed");
        sidebar.classList.remove("open");
      }
      const isCollapsed = sidebar.classList.contains("collapsed");
      localStorage.setItem("sidebarCollapsed", isCollapsed);
    }
  }

  /**
   * Called after mounting to subscribe to connection status and route changes.
   */
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

  /**
   * Cleans up subscriptions and event listeners to prevent memory leaks.
   */
  destroy() {
    this.unsubscribers.forEach((unsub) => unsub && unsub());
    this.unsubscribers = [];
    if (this._routeHandler) {
      window.removeEventListener("routechange", this._routeHandler);
      window.removeEventListener("popstate", this._routeHandler);
    }
  }

  /**
   * Updates the UI elements based on the connection status.
   * @param {string} s - Connection status ("connected" or "disconnected").
   */
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
          ? "<span class=\"badge online\">● Online</span>"
          : "<span class=\"badge offline\">● Offline</span>";
    }
  }
}
window.Header = Header;
