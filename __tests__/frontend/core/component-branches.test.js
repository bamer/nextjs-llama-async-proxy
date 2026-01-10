/**
 * Component Branch Coverage Tests
 * Tests uncovered branches in component.js to achieve ≥98% line coverage
 * @jest-environment jsdom
 */

global.window = global.window || {};

const componentPath = new URL("../../../public/js/core/component.js", import.meta.url);
await import(componentPath.href);

const Component = global.window.Component;

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";

describe("Component Branch Coverage", function () {
  let container;

  beforeEach(function () {
    container = document.createElement("div");
    container.id = "test-container-branch";
    document.body.appendChild(container);
  });

  afterEach(function () {
    document.body.removeChild(container);
  });

  describe("Event Delegation Branches (Line 128)", function () {
    describe("positive: event delegation scope validation", function () {
      it("should handle event when target is the component element itself", function () {
        // Tests line 128: this._el === e.target branch
        const handler = jest.fn();
        const TestComponent = class extends Component {
          render() {
            return `<div class="self-element">Click me</div>`;
          }
          bindEvents() {
            this.on("click", ".self-element", () => {
              handler();
            });
          }
        };
        const comp = new TestComponent();
        comp.mount("#test-container-branch");
        // Click on the component element itself (triggers this._el === e.target)
        const el = container.querySelector(".self-element");
        el.click();
        expect(handler).toHaveBeenCalled();
      });

      it("should handle event when target is a child element", function () {
        // Tests line 127-128: this._el.contains(e.target) branch
        const handler = jest.fn();
        const TestComponent = class extends Component {
          render() {
            return `<div class="parent-element"><span class="child-element">Child</span></div>`;
          }
          bindEvents() {
            this.on("click", ".child-element", () => {
              handler();
            });
          }
        };
        const comp = new TestComponent();
        comp.mount("#test-container-branch");
        // Click on child element (triggers this._el.contains(e.target))
        const child = container.querySelector(".child-element");
        child.click();
        expect(handler).toHaveBeenCalled();
      });

      it("should ignore event when target is outside component scope", function () {
        // Tests line 128: early return when target is outside
        const handler = jest.fn();
        const TestComponent = class extends Component {
          render() {
            return `<div class="inner-element">Inner</div>`;
          }
          bindEvents() {
            this.on("click", ".inner-element", () => {
              handler();
            });
          }
        };
        const comp = new TestComponent();
        comp.mount("#test-container-branch");
        // Click outside component should be ignored
        const outer = document.createElement("div");
        outer.className = "outer-element";
        document.body.appendChild(outer);
        outer.click();
        expect(handler).not.toHaveBeenCalled();
        document.body.removeChild(outer);
      });

      it("should handle click with data-action selector", function () {
        // Tests selector matching in event delegation
        const handler = jest.fn();
        const TestComponent = class extends Component {
          render() {
            return `<div><button data-action="save">Save</button></div>`;
          }
          bindEvents() {
            this.on("click", "[data-action]", (e, target) => {
              if (target.dataset.action === "save") {
                handler();
              }
            });
          }
        };
        const comp = new TestComponent();
        comp.mount("#test-container-branch");
        const btn = container.querySelector("[data-action='save']");
        btn.click();
        expect(handler).toHaveBeenCalled();
      });
    });

    describe("edge cases", function () {
      it("should handle rapid consecutive clicks", function () {
        let count = 0;
        const TestComponent = class extends Component {
          render() {
            return `<button class="click-btn">Click</button>`;
          }
          bindEvents() {
            this.on("click", ".click-btn", () => {
              count++;
            });
          }
        };
        const comp = new TestComponent();
        comp.mount("#test-container-branch");
        const btn = container.querySelector(".click-btn");
        // Rapid clicks
        btn.click();
        btn.click();
        btn.click();
        expect(count).toBe(3);
      });

      it("should handle component without bindEvents", function () {
        // Tests that bindEvents is optional
        const TestComponent = class extends Component {
          render() {
            return `<div>No events</div>`;
          }
        };
        const comp = new TestComponent();
        comp.mount("#test-container-branch");
        const el = container.querySelector("div");
        expect(el).not.toBeNull();
      });
    });
  });

  describe("Component Lifecycle Branches", function () {
    it("should call onMount after mounting", function () {
      let mounted = false;
      const TestComponent = class extends Component {
        render() {
          return `<div>Test</div>`;
        }
        onMount() {
          mounted = true;
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container-branch");
      expect(mounted).toBe(true);
    });

    it("should cleanup on destroy", function () {
      const TestComponent = class extends Component {
        render() {
          return `<div>Test</div>`;
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container-branch");
      const el = container.querySelector("div");
      expect(el).not.toBeNull();
      comp.destroy();
      expect(container.querySelector("div")).toBeNull();
    });
  });

  describe("DOM Helper Branches", function () {
    it("should handle $ selector not found", function () {
      const TestComponent = class extends Component {
        render() {
          return `<div>Test</div>`;
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container-branch");
      // Should not throw, just return null
      expect(comp.$(".nonexistent")).toBeNull();
    });

    it("should handle toggleClass with add=true", function () {
      const TestComponent = class extends Component {
        render() {
          return `<div class="test-el">Test</div>`;
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container-branch");
      comp.toggleClass(".test-el", "active", true);
      // Use comp.$() to find within component's element
      const el = comp.$(".test-el");
      expect(el.classList.contains("active")).toBe(true);
    });

    it("should handle toggleClass with add=false", function () {
      const TestComponent = class extends Component {
        render() {
          return `<div class="test-el active">Test</div>`;
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container-branch");
      comp.toggleClass(".test-el", "active", false);
      // Use comp.$() to find within component's element
      const el = comp.$(".test-el");
      expect(el.classList.contains("active")).toBe(false);
    });

    it("should handle setAttr with null value", function () {
      const TestComponent = class extends Component {
        render() {
          return `<button class="test-btn" disabled>Test</button>`;
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container-branch");
      comp.setAttr(".test-btn", "disabled", null);
      const el = comp.$(".test-btn");
      expect(el.hasAttribute("disabled")).toBe(false);
    });

    it("should handle show/hide methods", function () {
      const TestComponent = class extends Component {
        render() {
          return `<div class="test-el">Test</div>`;
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container-branch");
      comp.hide(".test-el");
      const el = comp.$(".test-el");
      expect(el.classList.contains("hidden")).toBe(true);
      comp.show(".test-el");
      expect(el.classList.contains("hidden")).toBe(false);
    });
  });

  describe("Template Rendering Branches", function () {
    it("should handle numeric children", function () {
      const TestComponent = class extends Component {
        render() {
          return `<div>Count: ${42}</div>`;
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container-branch");
      const el = container.querySelector("div");
      expect(el.textContent).toBe("Count: 42");
    });

    it("should handle boolean false in template", function () {
      const TestComponent = class extends Component {
        render() {
          const show = false;
          return `<div>${show ? "Visible" : "Hidden"}</div>`;
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container-branch");
      const el = container.querySelector("div");
      expect(el.textContent).toBe("Hidden");
    });
  });
});
