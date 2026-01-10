/**
 * Simple Layout Component
 */

class Layout extends Component {
  render() {
    return Component.h(
      "div",
      { className: "app-container" },
      Component.h(Sidebar, {}),
      Component.h(MainContent, {})
    );
  }
}

class Sidebar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      collapsed: localStorage.getItem("sidebarCollapsed") === "true",
      darkMode: localStorage.getItem("darkMode") === "true",
    };
  }

  render() {
    return Component.h(
      "aside",
      { className: `sidebar ${this.state.collapsed ? "collapsed" : ""}` },
      Component.h(
        "div",
        { className: "sidebar-header" },
        Component.h("span", { className: "logo-icon" }, "🦙"),
        Component.h("span", { className: "logo-text" }, "Llama Proxy")
      ),
      Component.h(
        "nav",
        { className: "sidebar-nav" },
        Component.h(
          "a",
          { href: "/", className: "nav-link", "data-page": "dashboard" },
          Component.h("span", {}, "📊"),
          Component.h("span", {}, "Dashboard")
        ),
        Component.h(
          "a",
          { href: "/models", className: "nav-link", "data-page": "models" },
          Component.h("span", {}, "📁"),
          Component.h("span", {}, "Models")
        ),
        Component.h(
          "a",
          { href: "/presets", className: "nav-link", "data-page": "presets" },
          Component.h("span", {}, "⚡"),
          Component.h("span", {}, "Presets")
        ),
        Component.h(
          "a",
          { href: "/logs", className: "nav-link", "data-page": "logs" },
          Component.h("span", {}, "📋"),
          Component.h("span", {}, "Logs")
        ),
        Component.h(
          "a",
          { href: "/settings", className: "nav-link", "data-page": "settings" },
          Component.h("span", {}, "⚙️"),
          Component.h("span", {}, "Settings")
        )
      ),
      Component.h(
        "div",
        { className: "sidebar-footer" },
        Component.h(
          "button",
          { className: "theme-toggle-btn", "data-action": "toggle-theme" },
          "🌙 Dark"
        ),
        Component.h("button", { className: "help-btn", "data-action": "keyboard-help" }, "⌨️"),
        Component.h(
          "div",
          { className: "connection-status", id: "connection-status" },
          Component.h("span", { className: "dot disconnected" }),
          Component.h("span", { className: "text" }, "Disconnected")
        )
      )
    );
  }

  getEventMap() {
    return {
      "click [data-page]": "handleClick",
      "click [data-action=toggle-theme]": "handleThemeToggle",
      "click [data-action=keyboard-help]": "handleKeyboardHelp",
    };
  }

  handleClick(e) {
    const t = e.target.closest("[data-page]");
    if (t) {
      e.preventDefault();
      e.stopPropagation();
      const p = t.dataset.page;
      window.router.navigate(`/${p === "dashboard" ? "" : p}`);
    }
  }

  handleThemeToggle() {
    const isDark = !this.state.darkMode;
    this.setState({ darkMode: isDark });
    localStorage.setItem("darkMode", isDark);
    this._applyTheme(isDark);
    this._updateThemeButton(isDark);
  }

  _applyTheme(isDark) {
    if (isDark) {
      document.documentElement.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark-mode");
    }
  }

  _updateThemeButton(isDark) {
    const btn = this._el?.querySelector("[data-action=toggle-theme]");
    if (btn) {
      btn.textContent = isDark ? "☀️ Light" : "🌙 Dark";
    }
  }

  handleKeyboardHelp() {
    console.log("[DEBUG] Opening keyboard shortcuts help");
    const shortcuts = window.keyboardShortcuts?.getAllShortcuts() || [];
    const modal = Component.h(KeyboardShortcutsHelp, { shortcuts }).render();
    document.body.appendChild(modal);
  }

  didMount() {
    // Restore collapsed state
    const collapsed = localStorage.getItem("sidebarCollapsed") === "true";
    if (collapsed) {
      document.querySelector(".sidebar")?.classList.add("collapsed");
    }

    // Restore theme state
    const isDark = localStorage.getItem("darkMode") === "true";
    if (isDark) {
      this._applyTheme(true);
      this._updateThemeButton(true);
    }
  }
}

class MainContent extends Component {
  render() {
    return Component.h(
      "main",
      { className: "main-content" },
      Component.h(Header, {}),
      Component.h(
        "div",
        { id: "page-content", className: "page-content" },
        Component.h(
          "div",
          { className: "loading-screen" },
          Component.h("div", { className: "spinner" }),
          Component.h("p", {}, "Connecting...")
        )
      )
    );
  }
}

class Header extends Component {
  constructor(props) {
    super(props);
    this.state = { online: false };
    this._route = null;
  }

  render() {
    return Component.h(
      "header",
      { className: "page-header" },
      Component.h("button", { className: "menu-btn", "data-action": "toggle" }, "☰"),
      Component.h("h1", { id: "page-title" }, this._getTitle()),
      Component.h(
        "div",
        { className: "header-status" },
        this.state.online
          ? Component.h("span", { className: "badge online" }, "● Online")
          : Component.h("span", { className: "badge offline" }, "● Offline")
      )
    );
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

  getEventMap() {
    return {
      "click [data-action=toggle]": () => {
        const sidebar = document.querySelector(".sidebar");
        if (sidebar) {
          sidebar.classList.toggle("collapsed");
          const isCollapsed = sidebar.classList.contains("collapsed");
          localStorage.setItem("sidebarCollapsed", isCollapsed);
        }
      },
    };
  }

  didMount() {
    stateManager.subscribe("connectionStatus", (s) => {
      this.setState({ online: s === "connected" });
      this._updateUI(s);
    });

    this._route = () => {
      const t = this._el?.querySelector("#page-title");
      if (t) t.textContent = this._getTitle();
    };
    window.addEventListener("routechange", this._route);
    window.addEventListener("popstate", this._route);
  }

  willDestroy() {
    if (this._route) {
      window.removeEventListener("routechange", this._route);
      window.removeEventListener("popstate", this._route);
    }
  }

  _updateUI(s) {
    const st = document.getElementById("connection-status");
    if (st) {
      const dot = st.querySelector(".dot"),
        txt = st.querySelector(".text");
      if (dot) dot.className = `dot ${s === "connected" ? "connected" : "disconnected"}`;
      if (txt) txt.textContent = s === "connected" ? "Connected" : "Disconnected";
    }
    const hs = this._el?.querySelector(".header-status");
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
