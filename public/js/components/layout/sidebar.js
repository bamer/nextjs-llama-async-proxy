class Sidebar extends Component {
  constructor(props) {
    super(props);
    this.darkMode = localStorage.getItem("darkMode") === "true";
  }

  render() {
    return `<aside class="sidebar ${this.darkMode ? "dark-mode" : ""}">
      <div class="sidebar-header">
        <span class="logo-icon">🦙</span>
        <span class="logo-text">Llama Proxy</span>
      </div>
      <nav class="sidebar-nav">
        <a href="/" class="nav-link" data-page="dashboard"><span>📊</span><span>Dashboard</span></a>
        <a href="/models" class="nav-link" data-page="models"><span>📁</span><span>Models</span></a>
        <a href="/presets" class="nav-link" data-page="presets"><span>⚡</span><span>Presets</span></a>
        <a href="/logs" class="nav-link" data-page="logs"><span>📋</span><span>Logs</span></a>
        <a href="/settings" class="nav-link" data-page="settings"><span>⚙️</span><span>Settings</span></a>
      </nav>
      <div class="sidebar-footer">
        <button class="theme-toggle-btn" data-action="toggle-theme">${this.darkMode ? "☀️" : "🌙"}</button>
        <div class="connection-status">
          <span class="dot disconnected"></span>
          <span class="text">Disconnected</span>
        </div>
      </div>
    </aside>`;
  }

  bindEvents() {
    this.on("click", "[data-page]", (e) => {
      const t = e.target.closest("[data-page]");
      if (t) {
        e.preventDefault();
        window.router.navigate(`/${t.dataset.page === "dashboard" ? "" : t.dataset.page}`);
      }
    });

    this.on("click", "[data-action=toggle-theme]", () => {
      this.darkMode = !this.darkMode;
      localStorage.setItem("darkMode", this.darkMode);
      document.documentElement.classList.toggle("dark-mode", this.darkMode);
      this.$("[data-action=toggle-theme]").textContent = this.darkMode ? "☀️" : "🌙";
    });
  }

  onMount() {
    if (this.darkMode) document.documentElement.classList.add("dark-mode");

    socketClient.on("llama:status", (data) => this._updateStatus(data?.status));

    socketClient.on("socket:connected", () => {
      socketClient.request("llama:status", {}).then((resp) => this._updateStatus(resp?.data?.status));
    });

    if (socketClient.isConnected) {
      socketClient.request("llama:status", {}).then((resp) => this._updateStatus(resp?.data?.status));
    }
  }

  _updateStatus(status) {
    const el = this.$(".connection-status");
    if (!el) return;
    const dot = el.querySelector(".dot");
    const text = el.querySelector(".text");
    const connected = status === "running" || status === "idle";
    if (dot) dot.className = `dot ${connected ? "connected" : "disconnected"}`;
    if (text) text.textContent = connected ? "Connected" : "Disconnected";
  }
}

window.Sidebar = Sidebar;
