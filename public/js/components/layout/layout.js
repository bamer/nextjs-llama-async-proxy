/**
 * Layout Components - Event-Driven DOM Updates
 */

class Layout extends Component {
  render() {
    return Component.h("div", { className: "app-container" }, [
      Component.h(Sidebar, {}),
      Component.h(MainContent, {}),
    ]);
  }
}

class Sidebar extends Component {
  constructor(props) {
    super(props);
    this.collapsed = localStorage.getItem("sidebarCollapsed") === "true";
    this.darkMode = localStorage.getItem("darkMode") === "true";
  }

  render() {
    const collapsedClass = this.collapsed ? "collapsed" : "";
    return Component.h("aside", { className: `sidebar ${collapsedClass}` }, [
      Component.h("div", { className: "sidebar-header" }, [
        Component.h("span", { className: "logo-icon" }, "🦙"),
        Component.h("span", { className: "logo-text" }, "Llama Proxy"),
      ]),
      Component.h("nav", { className: "sidebar-nav" }, [
        Component.h("a", { href: "/", className: "nav-link", "data-page": "dashboard" }, [
          Component.h("span", {}, "📊"),
          Component.h("span", {}, "Dashboard"),
        ]),
        Component.h("a", { href: "/models", className: "nav-link", "data-page": "models" }, [
          Component.h("span", {}, "📁"),
          Component.h("span", {}, "Models"),
        ]),
        Component.h("a", { href: "/presets", className: "nav-link", "data-page": "presets" }, [
          Component.h("span", {}, "⚡"),
          Component.h("span", {}, "Presets"),
        ]),
        Component.h("a", { href: "/logs", className: "nav-link", "data-page": "logs" }, [
          Component.h("span", {}, "📋"),
          Component.h("span", {}, "Logs"),
        ]),
        Component.h("a", { href: "/settings", className: "nav-link", "data-page": "settings" }, [
          Component.h("span", {}, "⚙️"),
          Component.h("span", {}, "Settings"),
        ]),
      ]),
      Component.h("div", { className: "sidebar-footer" }, [
        Component.h("button", { className: "theme-toggle-btn", "data-action": "toggle-theme" }, [
          this.darkMode ? "☀️ Light" : "🌙 Dark",
        ]),
        Component.h("button", { className: "help-btn", "data-action": "keyboard-help" }, "⌨️"),
        Component.h("div", { className: "connection-status", id: "connection-status" }, [
          Component.h("span", { className: "dot disconnected" }),
          Component.h("span", { className: "text" }, "Disconnected"),
        ]),
      ]),
    ]);
  }

  bindEvents() {
    // Navigation clicks
    this.on("click", "[data-page]", (e) => {
      const t = e.target.closest("[data-page]");
      if (t) {
        e.preventDefault();
        const p = t.dataset.page;
        window.router.navigate(`/${p === "dashboard" ? "" : p}`);
      }
    });

    // Theme toggle
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

    // Keyboard help
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
    // Restore theme state
    if (this.darkMode) {
      document.documentElement.classList.add("dark-mode");
    }
  }
}

class MainContent extends Component {
  render() {
    return Component.h("main", { className: "main-content" }, [
      Component.h(Header, {}),
      Component.h(
        "div",
        { id: "page-content", className: "page-content" },
        Component.h("div", { className: "loading-screen" }, [
          Component.h("div", { className: "spinner" }),
          Component.h("p", {}, "Connecting..."),
        ])
      ),
    ]);
  }
}

class Header extends Component {
  constructor(props) {
    super(props);
    this.online = false;
    this._routeHandler = null;
  }

  render() {
    return Component.h("header", { className: "page-header" }, [
      Component.h("button", { className: "menu-btn", "data-action": "toggle" }, "☰"),
      Component.h("h1", { id: "page-title" }, this._getTitle()),
      Component.h("div", { className: "header-status" }, [
        this.online
          ? Component.h("span", { className: "badge online" }, "● Online")
          : Component.h("span", { className: "badge offline" }, "● Offline"),
      ]),
    ]);
  }

  _getTitle() {
    const p = window.location.pathname;
    const titles = {
      "/": "Dashboard",
      "/models": "Models",
      "/presets": "Presets",
      "/logs": "Logs",
      "/settings": "Settings",
    };
    return titles[p] || "Dashboard";
  }

  bindEvents() {
    // Toggle sidebar
    this.on("click", "[data-action=toggle]", () => {
      const sidebar = document.querySelector(".sidebar");
      if (sidebar) {
        sidebar.classList.toggle("collapsed");
        const isCollapsed = sidebar.classList.contains("collapsed");
        localStorage.setItem("sidebarCollapsed", isCollapsed);
      }
    });
  }

  onMount() {
    // Subscribe to connection status
    stateManager.subscribe("connectionStatus", (s) => {
      this.online = s === "connected";
      this._updateUI(s);
    });

    // Handle route changes
    this._routeHandler = () => {
      const t = this.$("#page-title");
      if (t) t.textContent = this._getTitle();
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
          ? "<span class=\"badge online\">● Online</span>"
          : "<span class=\"badge offline\">● Offline</span>";
    }
  }
}

window.Layout = Layout;
window.Sidebar = Sidebar;
window.MainContent = MainContent;
window.Header = Header;
