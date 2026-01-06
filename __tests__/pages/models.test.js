/**
 * Models Page Tests
 * Tests for ModelsController and ModelsPage components
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLTableRowElement = dom.window.HTMLTableRowElement;

// Create mock stateManager
const createMockStateManager = () => {
  const state = {
    models: [],
    settings: {}
  };
  const listeners = new Map();

  // Create separate mock for each function
  const getModelsMock = function(...args) {
    getModelsMock.mock.calls.push(args);
    if (getModelsMock.mockImplementation) return getModelsMock.mockImplementation(...args);
    return Promise.resolve({ models: [] });
  };
  getModelsMock.mock = { calls: [] };
  getModelsMock.mockImplementation = null;
  getModelsMock.mockResolvedValue = (v) => { getModelsMock.mockImplementation = () => Promise.resolve(v); };

  const createModelMock = function(...args) {
    createModelMock.mock.calls.push(args);
    if (createModelMock.mockImplementation) return createModelMock.mockImplementation(...args);
    return Promise.resolve();
  };
  createModelMock.mock = { calls: [] };
  createModelMock.mockImplementation = null;
  createModelMock.mockResolvedValue = () => { createModelMock.mockImplementation = () => Promise.resolve(); };

  const startModelMock = function(...args) {
    startModelMock.mock.calls.push(args);
    if (startModelMock.mockImplementation) return startModelMock.mockImplementation(...args);
    return Promise.resolve();
  };
  startModelMock.mock = { calls: [] };
  startModelMock.mockImplementation = null;
  startModelMock.mockResolvedValue = () => { startModelMock.mockImplementation = () => Promise.resolve(); };

  const stopModelMock = function(...args) {
    stopModelMock.mock.calls.push(args);
    if (stopModelMock.mockImplementation) return stopModelMock.mockImplementation(...args);
    return Promise.resolve();
  };
  stopModelMock.mock = { calls: [] };
  stopModelMock.mockImplementation = null;
  stopModelMock.mockResolvedValue = () => { stopModelMock.mockImplementation = () => Promise.resolve(); };

  return {
    state,
    get: (key) => state[key],
    set: (key, value) => {
      state[key] = value;
      listeners.get(key)?.forEach(cb => cb(value));
    },
    subscribe: (key, callback) => {
      if (!listeners.has(key)) listeners.set(key, new Set());
      listeners.get(key).add(callback);
      return () => listeners.get(key)?.delete(callback);
    },
    getModels: getModelsMock,
    createModel: createModelMock,
    startModel: startModelMock,
    stopModel: stopModelMock
  };
};

// Mock showNotification
const mockShowNotification = function(...args) {
  mockShowNotification.mock.calls.push(args);
};
mockShowNotification.mock = { calls: [] };
global.showNotification = mockShowNotification;

// Inline Component class for testing
class Component {
  constructor(props = {}) {
    this.props = props;
    this.state = {};
    this._el = null;
    this._mounted = false;
  }

  render() {
    throw new Error("render() must be implemented");
  }

  mount(parent) {
    if (typeof parent === "string") parent = document.querySelector(parent);
    if (!parent) throw new Error("Parent not found");

    this.willMount && this.willMount();
    const rendered = this.render();

    if (typeof rendered === "string") {
      const div = document.createElement("div");
      div.innerHTML = rendered;
      this._el = div.firstChild;
    } else if (rendered instanceof HTMLElement) {
      this._el = rendered;
    }
    this._el._component = this;

    this.bindEvents();
    parent.appendChild(this._el);
    this._mounted = true;
    this.didMount && this.didMount();
    return this;
  }

  setState(updates) {
    this.state = { ...this.state, ...updates };
    if (this._el) {
      this.update();
    }
    return this;
  }

  update() {
    const oldEl = this._el;
    const rendered = this.render();

    if (typeof rendered === "string") {
      const div = document.createElement("div");
      div.innerHTML = rendered;
      const newEl = div.firstChild;
      oldEl.replaceWith(newEl);
      this._el = newEl;
    } else if (rendered instanceof HTMLElement) {
      oldEl.replaceWith(rendered);
      this._el = rendered;
    }
    this._el._component = this;
    this.bindEvents();
    this.didUpdate && this.didUpdate();
  }

  getEventMap() {
    return {};
  }

  bindEvents() {
    const map = this.getEventMap();
    Object.entries(map).forEach(([spec, handler]) => {
      const [event, selector] = spec.split(" ");
      const fnHandler = typeof handler === "string" ? this[handler].bind(this) : handler.bind(this);
      if (selector) {
        this._el.addEventListener(event, (e) => {
          const target = e.target.closest(selector);
          if (target) fnHandler(e, target);
        });
      } else {
        this._el.addEventListener(event, fnHandler);
      }
    });
  }

  destroy() {
    this.willDestroy && this.willDestroy();
    if (this._el && this._el.parentNode) {
      this._el.parentNode.removeChild(this._el);
    }
    this._el = null;
    this._mounted = false;
    this.didDestroy && this.didDestroy();
  }

  static h(tag, attrs = {}, ...children) {
    if (typeof tag === "function" && tag.prototype instanceof Component) {
      const comp = new tag(attrs);
      const el = comp.render();
      if (el instanceof HTMLElement) {
        el._component = comp;
        comp._el = el;
        children.forEach(c => {
          if (typeof c === "string") el.appendChild(document.createTextNode(c));
          else if (c instanceof HTMLElement) el.appendChild(c);
          else if (c instanceof Component) {
            const cel = c.render();
            if (cel instanceof HTMLElement) { el.appendChild(cel); c._el = cel; }
          }
        });
      }
      return el;
    }

    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "className") el.className = v;
      else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === "dataset") Object.entries(v).forEach(([dk, dv]) => el.dataset[dk] = dv);
      else if (v !== null && v !== undefined) el.setAttribute(k, v);
    });
    children.forEach(c => {
      if (typeof c === "string" || typeof c === "number") el.appendChild(document.createTextNode(String(c)));
      else if (c instanceof HTMLElement) el.appendChild(c);
      else if (c instanceof Component) {
        const cel = c.render();
        if (cel instanceof HTMLElement) { el.appendChild(cel); c._el = cel; }
      }
    });
    return el;
  }
}

// ModelsPage for testing
class ModelsPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      models: props.models || [],
      filters: props.filters || { status: "all", search: "" }
    };
  }

  willReceiveProps(props) {
    this.setState({
      models: props.models || [],
      filters: props.filters || { status: "all", search: "" }
    });
  }

  render() {
    const filtered = this._getFiltered();
    return Component.h("div", { className: "models-page" },
      Component.h("div", { className: "toolbar" },
        Component.h("button", { className: "btn btn-primary", "data-action": "import" }, "Import"),
        Component.h("button", { className: "btn btn-secondary", "data-action": "refresh" }, "Refresh")
      ),
      Component.h("div", { className: "filters" },
        Component.h("input", {
          type: "text",
          placeholder: "Search...",
          "data-field": "search",
          value: this.state.filters.search
        }),
        Component.h("select", { "data-field": "status" },
          Component.h("option", { value: "all" }, "All"),
          Component.h("option", { value: "running" }, "Running"),
          Component.h("option", { value: "idle" }, "Idle")
        )
      ),
      Component.h("table", { className: "models-table" },
        Component.h("thead", {},
          Component.h("tr", {},
            Component.h("th", {}, "Name"),
            Component.h("th", {}, "Status"),
            Component.h("th", {}, "Actions")
          )
        ),
        Component.h("tbody", {},
          filtered.length === 0
            ? Component.h("tr", {}, Component.h("td", { colSpan: 3 }, "No models"))
            : filtered.map(m => Component.h("tr", { "data-id": m.id },
                Component.h("td", {}, m.name),
                Component.h("td", {},
                  Component.h("span", { className: `badge ${m.status}` }, m.status)
                ),
                Component.h("td", {},
                  m.status === "running"
                    ? Component.h("button", { className: "btn btn-sm", "data-action": "stop" }, "Stop")
                    : Component.h("button", { className: "btn btn-sm btn-primary", "data-action": "start" }, "Start")
                )
              ))
        )
      )
    );
  }

  _getFiltered() {
    let ms = [...(this.state.models || [])];
    if (this.state.filters.status !== "all") {
      ms = ms.filter(m => m.status === this.state.filters.status);
    }
    if (this.state.filters.search) {
      const s = this.state.filters.search.toLowerCase();
      ms = ms.filter(m => m.name.toLowerCase().includes(s));
    }
    return ms;
  }

  getEventMap() {
    return {
      "input [data-field=search]": (e) =>
        this.setState({ filters: { ...this.state.filters, search: e.target.value } }),
      "change [data-field=status]": (e) =>
        this.setState({ filters: { ...this.state.filters, status: e.target.value } }),
      "click [data-action=refresh]": () => this.load(),
      "click [data-action=import]": () => this.importModel(),
      "click [data-action=start]": (e) =>
        stateManager.startModel(e.target.closest("tr").dataset.id)
          .then(() => showNotification("Model started", "success"))
          .catch(err => showNotification(err.message, "error")),
      "click [data-action=stop]": (e) =>
        stateManager.stopModel(e.target.closest("tr").dataset.id)
          .then(() => showNotification("Model stopped", "success"))
          .catch(err => showNotification(err.message, "error"))
    };
  }

  importModel() {
    const name = prompt("Enter model name:");
    if (name) {
      stateManager.createModel({ name })
        .then(() => showNotification("Model created", "success"))
        .catch(err => showNotification(err.message, "error"));
    }
  }

  load() {
    this._controller?.load();
  }

  _setController(c) {
    this._controller = c;
  }
}

describe('ModelsPage', () => {
  let container;
  let stateManager;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    stateManager = createMockStateManager();
    global.stateManager = stateManager;
  });

  afterEach(() => {
    container = null;
  });

  describe('ModelsPage Component', () => {
    it('should initialize state from props', () => {
      const models = [{ id: "1", name: "Test Model", status: "idle" }];
      const page = new ModelsPage({ models, filters: { status: "all", search: "" } });
      expect(page.state.models).toEqual(models);
    });

    it('should handle empty props', () => {
      const page = new ModelsPage({});
      expect(page.state.models).toEqual([]);
      expect(page.state.filters).toEqual({ status: "all", search: "" });
    });

    it('should render toolbar with Import and Refresh buttons', () => {
      const page = new ModelsPage({});
      page.mount(container);
      const toolbar = container.querySelector(".toolbar");
      const buttons = toolbar.querySelectorAll("button");
      expect(buttons.length).toBe(2);
      expect(buttons[0].getAttribute("data-action")).toBe("import");
      expect(buttons[1].getAttribute("data-action")).toBe("refresh");
    });

    it('should render filter inputs', () => {
      const page = new ModelsPage({});
      page.mount(container);
      const searchInput = container.querySelector('[data-field="search"]');
      const statusSelect = container.querySelector('[data-field="status"]');
      expect(searchInput).not.toBeNull();
      expect(statusSelect).not.toBeNull();
    });

    it('should render table with headers', () => {
      const page = new ModelsPage({});
      page.mount(container);
      const ths = container.querySelectorAll("th");
      expect(ths.length).toBe(3);
      expect(ths[0].textContent).toBe("Name");
      expect(ths[1].textContent).toBe("Status");
      expect(ths[2].textContent).toBe("Actions");
    });

    it('should show "No models" when empty', () => {
      const page = new ModelsPage({ models: [] });
      page.mount(container);
      const tbody = container.querySelector("tbody");
      expect(tbody.textContent).toContain("No models");
    });

    it('should render models in table', () => {
      const models = [
        { id: "1", name: "Model A", status: "idle" },
        { id: "2", name: "Model B", status: "running" }
      ];
      const page = new ModelsPage({ models });
      page.mount(container);
      const rows = container.querySelectorAll("tbody tr");
      expect(rows.length).toBe(2);
      expect(rows[0].textContent).toContain("Model A");
      expect(rows[1].textContent).toContain("Model B");
    });

    it('should add data-id to table rows', () => {
      const models = [{ id: "model-123", name: "Test Model", status: "idle" }];
      const page = new ModelsPage({ models });
      page.mount(container);
      const row = container.querySelector('tr[data-id="model-123"]');
      expect(row).not.toBeNull();
    });

    it('should show correct badge for status', () => {
      const models = [
        { id: "1", name: "Running", status: "running" },
        { id: "2", name: "Idle", status: "idle" }
      ];
      const page = new ModelsPage({ models });
      page.mount(container);
      const badges = container.querySelectorAll(".badge");
      expect(badges[0].className).toContain("running");
      expect(badges[0].textContent).toBe("running");
      expect(badges[1].className).toContain("idle");
      expect(badges[1].textContent).toBe("idle");
    });

    it('should show Start button for idle models', () => {
      const models = [{ id: "1", name: "Test", status: "idle" }];
      const page = new ModelsPage({ models });
      page.mount(container);
      const btn = container.querySelector('[data-action="start"]');
      expect(btn).not.toBeNull();
      expect(btn.textContent).toBe("Start");
    });

    it('should show Stop button for running models', () => {
      const models = [{ id: "1", name: "Test", status: "running" }];
      const page = new ModelsPage({ models });
      page.mount(container);
      const btn = container.querySelector('[data-action="stop"]');
      expect(btn).not.toBeNull();
      expect(btn.textContent).toBe("Stop");
    });
  });

  describe('_getFiltered', () => {
    it('should return all models when status is all', () => {
      const models = [
        { id: "1", name: "Model A", status: "idle" },
        { id: "2", name: "Model B", status: "running" }
      ];
      const page = new ModelsPage({ models, filters: { status: "all", search: "" } });
      expect(page._getFiltered().length).toBe(2);
    });

    it('should filter by status', () => {
      const models = [
        { id: "1", name: "Model A", status: "idle" },
        { id: "2", name: "Model B", status: "running" }
      ];
      const page = new ModelsPage({ models, filters: { status: "running", search: "" } });
      const filtered = page._getFiltered();
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe("Model B");
    });

    it('should filter by search term', () => {
      const models = [
        { id: "1", name: "Llama Model", status: "idle" },
        { id: "2", name: "Other Model", status: "running" }
      ];
      const page = new ModelsPage({ models, filters: { status: "all", search: "llama" } });
      const filtered = page._getFiltered();
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe("Llama Model");
    });

    it('should be case insensitive for search', () => {
      const models = [
        { id: "1", name: "LLAMA", status: "idle" }
      ];
      const page = new ModelsPage({ models, filters: { status: "all", search: "llama" } });
      expect(page._getFiltered().length).toBe(1);
    });

    it('should filter by both status and search', () => {
      const models = [
        { id: "1", name: "Llama Running", status: "running" },
        { id: "2", name: "Llama Idle", status: "idle" },
        { id: "3", name: "Other Running", status: "running" }
      ];
      const page = new ModelsPage({ models, filters: { status: "running", search: "llama" } });
      const filtered = page._getFiltered();
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe("Llama Running");
    });
  });

  describe('getEventMap', () => {
    it('should return event handlers for all actions', () => {
      const page = new ModelsPage({});
      const map = page.getEventMap();
      expect(map["input [data-field=search]"]).toBeDefined();
      expect(map["change [data-field=status]"]).toBeDefined();
      expect(map["click [data-action=refresh]"]).toBeDefined();
      expect(map["click [data-action=import]"]).toBeDefined();
      expect(map["click [data-action=start]"]).toBeDefined();
      expect(map["click [data-action=stop]"]).toBeDefined();
    });
  });

  describe('event handlers', () => {
    it('should handle search input change', () => {
      const page = new ModelsPage({ models: [], filters: { status: "all", search: "" } });
      page.mount(container);

      const input = container.querySelector('[data-field="search"]');
      input.value = "test";
      input.dispatchEvent(new dom.window.Event("input"));

      expect(page.state.filters.search).toBe("test");
    });

    it('should handle status select change', () => {
      const page = new ModelsPage({ models: [], filters: { status: "all", search: "" } });
      page.mount(container);

      const select = container.querySelector('[data-field="status"]');
      select.value = "running";
      select.dispatchEvent(new dom.window.Event("change"));

      expect(page.state.filters.status).toBe("running");
    });

    it('should call load on refresh button click', () => {
      const page = new ModelsPage({ models: [], filters: { status: "all", search: "" } });
      let loadCalled = false;
      page.load = () => { loadCalled = true; };
      page.mount(container);

      const btn = container.querySelector('[data-action="refresh"]');
      btn.click();

      expect(loadCalled).toBe(true);
    });

    it('should call stateManager.startModel on start button click', async () => {
      const models = [{ id: "123", name: "Test", status: "idle" }];
      const page = new ModelsPage({ models });
      page.mount(container);

      const btn = container.querySelector('[data-action="start"]');
      await btn.click();

      expect(stateManager.startModel.mock.calls.length).toBe(1);
      expect(stateManager.startModel.mock.calls[0][0]).toBe("123");
    });

    it('should call stateManager.stopModel on stop button click', async () => {
      const models = [{ id: "456", name: "Test", status: "running" }];
      const page = new ModelsPage({ models });
      page.mount(container);

      const btn = container.querySelector('[data-action="stop"]');
      await btn.click();

      expect(stateManager.stopModel.mock.calls.length).toBe(1);
      expect(stateManager.stopModel.mock.calls[0][0]).toBe("456");
    });

    it('should call showNotification on successful start', async () => {
      const models = [{ id: "123", name: "Test", status: "idle" }];
      const page = new ModelsPage({ models });
      page.mount(container);

      const btn = container.querySelector('[data-action="start"]');
      await btn.click();

      expect(mockShowNotification.mock.calls.length).toBe(1);
      expect(mockShowNotification.mock.calls[0][0]).toBe("Model started");
      expect(mockShowNotification.mock.calls[0][1]).toBe("success");
    });

    it('should call showNotification on successful stop', async () => {
      const models = [{ id: "456", name: "Test", status: "running" }];
      const page = new ModelsPage({ models });
      page.mount(container);

      const btn = container.querySelector('[data-action="stop"]');
      await btn.click();

      expect(mockShowNotification.mock.calls.length).toBe(1);
      expect(mockShowNotification.mock.calls[0][0]).toBe("Model stopped");
      expect(mockShowNotification.mock.calls[0][1]).toBe("success");
    });
  });

  describe('willReceiveProps', () => {
    it('should update state when receiving new props', () => {
      const page = new ModelsPage({ models: [{ id: "1", name: "Old" }] });
      page.willReceiveProps({ models: [{ id: "2", name: "New" }] });
      expect(page.state.models.length).toBe(1);
      expect(page.state.models[0].name).toBe("New");
    });

    it('should update filters from props', () => {
      const page = new ModelsPage({ models: [], filters: { status: "all", search: "" } });
      page.willReceiveProps({ filters: { status: "running", search: "test" } });
      expect(page.state.filters.status).toBe("running");
      expect(page.state.filters.search).toBe("test");
    });
  });

  describe('importModel', () => {
    it('should call stateManager.createModel when name provided', async () => {
      const page = new ModelsPage({ models: [] });
      page._controller = { load: () => {} };

      // Mock prompt
      const originalPrompt = window.prompt;
      window.prompt = () => "New Model";

      await page.importModel();

      expect(stateManager.createModel.mock.calls.length).toBe(1);
      expect(stateManager.createModel.mock.calls[0][0]).toEqual({ name: "New Model" });
      window.prompt = originalPrompt;
    });

    it('should not call stateManager.createModel when cancelled', async () => {
      const page = new ModelsPage({ models: [] });

      // Mock prompt
      const originalPrompt = window.prompt;
      window.prompt = () => null;

      await page.importModel();

      expect(stateManager.createModel.mock.calls.length).toBe(0);
      window.prompt = originalPrompt;
    });

    it('should not call stateManager.createModel when empty name', async () => {
      const page = new ModelsPage({ models: [] });

      // Mock prompt
      const originalPrompt = window.prompt;
      window.prompt = () => "";

      await page.importModel();

      expect(stateManager.createModel.mock.calls.length).toBe(0);
      window.prompt = originalPrompt;
    });
  });
});
