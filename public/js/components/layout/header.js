class Header extends Component {
  constructor(props) {
    super(props);
    this.online = false;
  }

  render() {
    const titles = { "/": "Dashboard", "/models": "Models", "/presets": "Presets", "/logs": "Logs", "/settings": "Settings" };
    return `<header class="page-header">
      <button class="menu-btn" data-action="toggle">☰</button>
      <h1 id="page-title">${titles[window.location.pathname] || "Dashboard"}</h1>
      <div class="header-status">${this.online ? '<span class="badge online">● Online</span>' : '<span class="badge offline">● Offline</span>'}</div>
    </header>`;
  }

  bindEvents() {
    this.on("click", "[data-action=toggle]", () => {
      const sidebar = document.querySelector(".sidebar");
      if (sidebar) {
        const isMobile = window.innerWidth <= 768;
        sidebar.classList.toggle(isMobile ? "open" : "collapsed");
        sidebar.classList.remove(isMobile ? "collapsed" : "open");
      }
    });
  }

  onMount() {
    socketClient.on("llama:status", (data) => {
      this.online = data?.status === "running" || data?.status === "idle";
      this._updateUI();
    });

    socketClient.on("socket:connected", () => {
      socketClient.request("llama:status", {}).then((resp) => {
        this.online = resp?.data?.status === "running" || resp?.data?.status === "idle";
        this._updateUI();
      });
    });

    if (socketClient.isConnected) {
      socketClient.request("llama:status", {}).then((resp) => {
        this.online = resp?.data?.status === "running" || resp?.data?.status === "idle";
        this._updateUI();
      });
    }
  }

  _updateUI() {
    const hs = this.$(".header-status");
    if (hs) {
      hs.innerHTML = this.online
        ? '<span class="badge online">● Online</span>'
        : '<span class="badge offline">● Offline</span>';
    }
  }
}

window.Header = Header;
