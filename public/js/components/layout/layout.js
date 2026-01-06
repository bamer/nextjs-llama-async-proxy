/**
 * Simple Layout Component
 */

class Layout extends Component {
  render() {
    return Component.h("div", { className: "app-container" },
      Component.h(Sidebar, {}),
      Component.h(MainContent, {})
    );
  }
}

class Sidebar extends Component {
  render() {
    return Component.h("aside", { className: "sidebar" },
      Component.h("div", { className: "sidebar-header" },
        Component.h("span", { className: "logo-icon" }, "🦙"),
        Component.h("span", { className: "logo-text" }, "Llama Proxy")
      ),
      Component.h("nav", { className: "sidebar-nav" },
        Component.h("a", { href: "/", className: "nav-link", "data-page": "dashboard" }, "📊 Dashboard"),
        Component.h("a", { href: "/models", className: "nav-link", "data-page": "models" }, "📁 Models"),
        Component.h("a", { href: "/monitoring", className: "nav-link", "data-page": "monitoring" }, "📈 Monitoring"),
        Component.h("a", { href: "/logs", className: "nav-link", "data-page": "logs" }, "📋 Logs"),
        Component.h("a", { href: "/settings", className: "nav-link", "data-page": "settings" }, "⚙️ Settings")
      ),
      Component.h("div", { className: "sidebar-footer" },
        Component.h("div", { className: "connection-status", id: "connection-status" },
          Component.h("span", { className: "dot disconnected" }),
          Component.h("span", { className: "text" }, "Disconnected")
        )
      )
    );
  }

  getEventMap() {
    return { "click [data-page]": "handleClick" };
  }

  handleClick(e) {
    const t = e.target.closest("[data-page]");
    if (t) {
      e.preventDefault();
      const p = t.dataset.page;
      window.router.navigate("/" + (p === "dashboard" ? "" : p));
    }
  }
}

class MainContent extends Component {
  render() {
    return Component.h("main", { className: "main-content" },
      Component.h(Header, {}),
      Component.h("div", { id: "page-content", className: "page-content" },
        Component.h("div", { className: "loading-screen" },
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
    return Component.h("header", { className: "page-header" },
      Component.h("button", { className: "menu-btn", "data-action": "toggle" }, "☰"),
      Component.h("h1", { id: "page-title" }, this._getTitle()),
      Component.h("div", { className: "header-status" },
        this.state.online ?
          Component.h("span", { className: "badge online" }, "● Online") :
          Component.h("span", { className: "badge offline" }, "● Offline")
      )
    );
  }

  _getTitle() {
    const p = window.location.pathname;
    const titles = { "/": "Dashboard", "/models": "Models", "/monitoring": "Monitoring", "/logs": "Logs", "/settings": "Settings" };
    return titles[p] || "Dashboard";
  }

  getEventMap() {
    return { "click [data-action=toggle]": () => document.querySelector(".sidebar")?.classList.toggle("open") };
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
    if (this._route) { window.removeEventListener("routechange", this._route); window.removeEventListener("popstate", this._route); }
  }

  _updateUI(s) {
    const st = document.getElementById("connection-status");
    if (st) {
      const dot = st.querySelector(".dot"), txt = st.querySelector(".text");
      if (dot) dot.className = `dot ${s === "connected" ? "connected" : "disconnected"}`;
      if (txt) txt.textContent = s === "connected" ? "Connected" : "Disconnected";
    }
    const hs = this._el?.querySelector(".header-status");
    if (hs) {
      hs.innerHTML = s === "connected" ?
        "<span class=\"badge online\">● Online</span>" :
        "<span class=\"badge offline\">● Offline</span>";
    }
  }
}

window.Layout = Layout;
window.Sidebar = Sidebar;
window.MainContent = MainContent;
window.Header = Header;
