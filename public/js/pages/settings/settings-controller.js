/**
 * Settings Controller
 */

class SettingsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
  }

  init() {}

  willUnmount() {}

  destroy() {
    this.willUnmount();
  }

  async render() {
    await this.load();

    const config = stateManager.get("config") || {};
    const settings = stateManager.get("settings") || {};

    this.comp = new window.SettingsPage({ config, settings });

    const el = this.comp.render();
    this.comp._el = el;
    this.comp._controller = this;
    el._component = this.comp;
    this.comp.bindEvents();

    return el;
  }

  async load() {
    try {
      const c = await stateManager.getConfig();
      stateManager.set("config", c.config || {});

      const s = await stateManager.getSettings();
      stateManager.set("settings", s.settings || {});

      try {
        const rs = await stateManager.getRouterStatus();
        stateManager.set("routerStatus", rs.routerStatus || null);
      } catch (e) {
        stateManager.set("routerStatus", null);
      }
    } catch (e) {}
  }
}

window.SettingsController = SettingsController;
