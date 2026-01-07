/**
 * Component Base Class Tests - Event Delegation and DOM Tests
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

// Import component
const componentPath = new URL("../../../public/js/core/component.js", import.meta.url);
await import(componentPath.href);

const Component = global.window.Component;

describe("Component - Event delegation with real DOM", function () {
  afterEach(function () {
    // Cleanup any remaining elements
    const remaining = document.querySelectorAll("[data-test-component]");
    remaining.forEach((el) => el.remove());
  });

  it("should handle click events on [data-action] selectors", function () {
    // This test verifies event delegation works for click events
    // with data-action attribute selectors using real DOM
    let actionCalled = false;

    class T extends Component {
      handleAction(e, target) {
        actionCalled = true;
      }
      getEventMap() {
        return {
          "click [data-action]": "handleAction",
        };
      }
      render() {
        return Component.h(
          "div",
          { "data-test-component": "true" },
          Component.h("button", { "data-action": "save" }, "Save")
        );
      }
    }
    const p = document.createElement("div");
    document.body.appendChild(p);
    const c = new T();
    c.mount(p);

    // Find the button and click it
    const button = p.querySelector("[data-action='save']");
    const clickEvent = new window.MouseEvent("click", { bubbles: true });
    button.dispatchEvent(clickEvent);

    expect(actionCalled).toBe(true);

    // Cleanup
    c.destroy();
    p.remove();
  });

  it("should handle change events on [data-field] selectors", function () {
    // This test verifies event delegation works for change events
    // with data-field attribute selectors using real DOM
    let changeCalled = false;

    class T extends Component {
      handleFieldChange(e, target) {
        changeCalled = true;
      }
      getEventMap() {
        return {
          "change [data-field]": "handleFieldChange",
        };
      }
      render() {
        return Component.h("input", { type: "text", "data-field": "name" });
      }
    }
    const p = document.createElement("div");
    document.body.appendChild(p);
    const c = new T();
    c.mount(p);

    // Trigger change event on the input
    const input = p.querySelector("[data-field='name']");
    const changeEvent = new window.Event("change", { bubbles: true });
    input.dispatchEvent(changeEvent);

    expect(changeCalled).toBe(true);

    // Cleanup
    c.destroy();
    p.remove();
  });

  it("should handle submit events on forms", function () {
    // This test verifies event delegation works for form submit events
    let submitCalled = false;
    let preventDefaultCalled = false;

    class T extends Component {
      handleSubmit(e) {
        e.preventDefault();
        preventDefaultCalled = true;
        submitCalled = true;
      }
      getEventMap() {
        return {
          "submit form": "handleSubmit",
        };
      }
      render() {
        return Component.h(
          "form",
          { "data-test-component": "true" },
          Component.h("input", { type: "text" })
        );
      }
    }
    const p = document.createElement("div");
    document.body.appendChild(p);
    const c = new T();
    c.mount(p);

    // Trigger submit event on the form
    const form = p.querySelector("form");
    const submitEvent = new window.Event("submit", { bubbles: true, cancelable: true });
    form.dispatchEvent(submitEvent);

    expect(submitCalled).toBe(true);
    expect(preventDefaultCalled).toBe(true);

    // Cleanup
    c.destroy();
    p.remove();
  });

  it("should ignore events from outside component", function () {
    // This test verifies event delegation filters events:
    // events from outside the component should be ignored
    let handlerCalled = false;

    class T extends Component {
      handleClick(e, target) {
        handlerCalled = true;
      }
      getEventMap() {
        return {
          "click [data-action]": "handleClick",
        };
      }
      render() {
        return Component.h("div", { className: "inner", "data-test-component": "true" }, "Test");
      }
    }
    // Create nested structure: outer div -> component
    const outer = document.createElement("div");
    outer.className = "outer";
    const inner = document.createElement("div");
    inner.className = "inner";
    outer.appendChild(inner);
    document.body.appendChild(outer);

    const c = new T();
    c.mount(inner);

    // Create click event from OUTSIDE the component (from outer div)
    const clickEvent = new window.MouseEvent("click", { bubbles: true });
    outer.dispatchEvent(clickEvent);

    expect(handlerCalled).toBe(false); // Should not be called

    // Cleanup
    c.destroy();
    outer.remove();
  });
});

describe("Component - destroy() cleanup with real DOM", function () {
  afterEach(function () {
    const remaining = document.querySelectorAll("[data-test-component]");
    remaining.forEach((el) => el.remove());
  });

  it("should remove element from parent when parent exists", function () {
    // This test verifies the element is removed from its parent
    class T extends Component {
      render() {
        return Component.h("div", { "data-test-component": "true" }, "Test");
      }
    }
    const p = document.createElement("div");
    document.body.appendChild(p);
    const c = new T();
    c.mount(p);

    // The element should have been added to parent
    expect(p.children.length).toBe(1);
    expect(c._el.parentNode).toBe(p);

    c.destroy();

    // Element should be removed
    expect(p.children.length).toBe(0);

    // Cleanup
    p.remove();
  });
});
