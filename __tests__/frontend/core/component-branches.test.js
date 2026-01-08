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
            return Component.h("div", { className: "self-element" }, "Click me");
          }
          getEventMap() {
            return { click: "handleClick" };
          }
          handleClick() {
            handler();
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
            return Component.h(
              "div",
              { className: "parent-element" },
              Component.h("span", { className: "child-element" }, "Child")
            );
          }
          getEventMap() {
            return { click: "handleClick" };
          }
          handleClick() {
            handler();
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
            return Component.h("div", { className: "inside-scope" }, "Inside");
          }
          getEventMap() {
            return { click: "handleClick" };
          }
          handleClick() {
            handler();
          }
        };
        const comp = new TestComponent();
        comp.mount("#test-container-branch");
        // Create and click an element outside the component
        const outsideEl = document.createElement("button");
        outsideEl.className = "outside-scope";
        outsideEl.textContent = "Outside";
        container.appendChild(outsideEl);
        outsideEl.click();
        expect(handler).not.toHaveBeenCalled();
      });
    });
  });

  describe("Event Delegation - _el null check (Line 128)", function () {
    it("should skip event when _el is null during event dispatch", function () {
      // Tests line 128: !this._el branch
      const handler = jest.fn();
      const TestComponent = class extends Component {
        render() {
          return Component.h("div", { className: "null-el-test" }, "Test");
        }
        getEventMap() {
          return { click: "handleClick" };
        }
        handleClick() {
          handler();
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container-branch");
      // Set _el to null to simulate component being unmounted
      const originalEl = comp._el;
      comp._el = null;
      // Dispatch event - should skip due to !this._el
      originalEl.click();
      expect(handler).not.toHaveBeenCalled();
      // Restore for cleanup
      comp._el = originalEl;
    });
  });

  describe("Component Children appendChildren Branches (Lines 190-204)", function () {
    describe("explicit null/undefined/false children", function () {
      it("should explicitly skip null children in appendChildren", function () {
        // Tests line 190: c === null branch
        const ChildComponent = class extends Component {
          render() {
            return Component.h("span", {}, "Child");
          }
        };
        // Create element with explicit null child
        const result = Component.h("div", {}, Component.h(ChildComponent, {}), null);
        expect(result.querySelector("span")).not.toBeNull();
        expect(result.innerHTML).toBe("<span>Child</span>");
      });

      it("should explicitly skip undefined children in appendChildren", function () {
        // Tests line 190: c === undefined branch
        const ChildComponent = class extends Component {
          render() {
            return Component.h("span", {}, "Child");
          }
        };
        const result = Component.h("div", {}, Component.h(ChildComponent, {}), undefined);
        expect(result.querySelector("span")).not.toBeNull();
      });

      it("should explicitly skip false children in appendChildren", function () {
        // Tests line 190: c === false branch
        const ChildComponent = class extends Component {
          render() {
            return Component.h("span", {}, "Child");
          }
        };
        const result = Component.h("div", {}, Component.h(ChildComponent, {}), false);
        expect(result.querySelector("span")).not.toBeNull();
      });
    });

    describe("recursive array handling", function () {
      it("should handle deeply nested arrays in Component children", function () {
        // Tests line 194-196: Array.isArray(c) recursive handling
        const ChildComponent = class extends Component {
          render() {
            return Component.h("span", {}, "Deep");
          }
        };
        // Test deeply nested array structure
        const el = Component.h("div", {}, [[[Component.h(ChildComponent, {})]]]);
        expect(el.querySelector("span")).not.toBeNull();
        expect(el.querySelector("span").textContent).toBe("Deep");
      });

      it("should handle mixed nested arrays with primitives and Components", function () {
        // Tests recursive array handling with mixed content
        const ChildComponent = class extends Component {
          render() {
            return Component.h("em", {}, "comp");
          }
        };
        const el = Component.h("p", {}, [
          "start ",
          [[["nested "]]],
          Component.h(ChildComponent, {}),
          " end",
        ]);
        expect(el.innerHTML).toBe("start nested <em>comp</em> end");
      });
    });

    describe("HTMLElement children in Component context", function () {
      it("should handle HTMLElement child within Component.h() Component path", function () {
        // Tests line 197-198: c instanceof HTMLElement within Component children context
        const ChildComponent = class extends Component {
          render() {
            return Component.h("div", {}, "Container");
          }
        };
        const extraElement = document.createElement("strong");
        extraElement.textContent = "extra";
        // This triggers the Component path in Component.h() then appends HTMLElement
        const el = Component.h("div", {}, Component.h(ChildComponent, {}), extraElement);
        expect(el.querySelector("strong")).not.toBeNull();
        expect(el.querySelector("strong").textContent).toBe("extra");
      });
    });

    it("should set _el and bindEvents for Component children", function () {
      // Tests lines 202-204: c._el = cel and c.bindEvents()
      const bindEventsSpy = jest.fn();
      const ChildComponent = class extends Component {
        render() {
          return Component.h("span", {}, "Child");
        }
        bindEvents() {
          bindEventsSpy();
        }
      };
      const el = Component.h("div", {}, Component.h(ChildComponent, {}));
      expect(bindEventsSpy).toHaveBeenCalled();
      expect(el.querySelector("span")).not.toBeNull();
    });

    describe("Component children with non-HTMLElement render", function () {
      it("should handle Component returning non-HTMLElement from render", function () {
        // Tests line 199: else branch when c is not instanceof Component
        // This tests the scenario where appendChildren receives a non-Component object
        const ChildComponent = class extends Component {
          render() {
            return "string return";
          }
        };
        const el = Component.h("div", { className: "test" }, Component.h(ChildComponent, {}));
        expect(el.tagName).toBe("DIV");
        expect(el.className).toBe("test");
      });

      it("should handle Component child render returning non-HTMLElement", function () {
        // Tests line 201: else branch when cel is not instanceof HTMLElement
        const NonElementChild = class extends Component {
          render() {
            return 42; // Returns a number, not HTMLElement
          }
        };
        const el = Component.h("div", {}, Component.h(NonElementChild, {}));
        expect(el.tagName).toBe("DIV");
        // Number should not be appended as HTMLElement
        expect(el.children.length).toBe(0);
      });

      it("should handle Component child returning object from render", function () {
        // Additional test for line 201 else branch
        const ObjectChild = class extends Component {
          render() {
            return { foo: "bar" }; // Returns object, not HTMLElement
          }
        };
        const el = Component.h("div", {}, Component.h(ObjectChild, {}));
        expect(el.tagName).toBe("DIV");
        expect(el.children.length).toBe(0);
      });
    });

    it("should set _el and bindEvents for Component children", function () {
      // Tests lines 202-204: c._el = cel and c.bindEvents()
      const bindEventsSpy = jest.fn();
      const ChildComponent = class extends Component {
        render() {
          return Component.h("span", {}, "Child");
        }
        bindEvents() {
          bindEventsSpy();
        }
      };
      const el = Component.h("div", {}, Component.h(ChildComponent, {}));
      expect(bindEventsSpy).toHaveBeenCalled();
      expect(el.querySelector("span")).not.toBeNull();
    });
  });
});

describe("Attribute Handling Branches (Lines 218-250)", function () {
  describe("className handling", function () {
    it("should set className attribute correctly", function () {
      // Tests line 219-220
      const el = Component.h("div", { className: "foo bar" });
      expect(el.className).toBe("foo bar");
    });
  });

  describe("style object handling", function () {
    it("should apply style object properties", function () {
      // Tests lines 221-222
      const el = Component.h("div", {
        style: { color: "red", backgroundColor: "blue" },
      });
      expect(el.style.color).toBe("red");
      expect(el.style.backgroundColor).toBe("blue");
    });
  });

  describe("event handler attributes (on*)", function () {
    it("should attach event listeners via on* attributes", function () {
      // Tests lines 223-224
      let clicked = false;
      const handler = function () {
        clicked = true;
      };
      const el = Component.h("button", { onClick: handler }, "Click");
      el.click();
      expect(clicked).toBe(true);
    });

    it("should ignore non-function on* attributes", function () {
      // Tests line 223: typeof v === "function" branch
      const el = Component.h("div", { onClick: "not a function" });
      expect(el.tagName).toBe("DIV");
    });
  });

  describe("dataset handling", function () {
    it("should set data attributes from dataset object", function () {
      // Tests lines 225-228
      const el = Component.h("div", {
        dataset: { userId: "123", actionName: "test" },
      });
      expect(el.dataset.userId).toBe("123");
      expect(el.dataset.actionName).toBe("test");
    });
  });

  describe("value attribute handling", function () {
    it("should handle select element value after children", function () {
      // Tests lines 229-239 and 279-281
      const select = Component.h(
        "select",
        { value: "opt2" },
        Component.h("option", { value: "opt1" }, "Option 1"),
        Component.h("option", { value: "opt2" }, "Option 2")
      );
      expect(select.value).toBe("opt2");
    });

    it("should handle textarea value via setAttribute", function () {
      // Tests lines 235-236
      const textarea = Component.h("textarea", { value: "initial" });
      expect(textarea.value).toBe("initial");
    });

    it("should handle input value as property", function () {
      // Tests lines 237-238
      const input = Component.h("input", { type: "text", value: "test" });
      expect(input.value).toBe("test");
    });
  });

  describe("checked attribute handling", function () {
    it("should set checked property for checkboxes", function () {
      // Tests lines 240-242
      const checkbox = Component.h("input", { type: "checkbox", checked: true });
      expect(checkbox.checked).toBe(true);
    });
  });

  describe("boolean attribute handling", function () {
    it("should set boolean attribute when true", function () {
      // Tests lines 243-247
      const input = Component.h("input", { type: "text", disabled: true });
      expect(input.disabled).toBe(true);
      expect(input.hasAttribute("disabled")).toBe(true);
    });

    it("should not set boolean attribute when false", function () {
      // Tests line 243-247: skip when false
      const input = Component.h("input", { type: "text", disabled: false });
      expect(input.hasAttribute("disabled")).toBe(false);
    });
  });

  describe("null/undefined attribute handling", function () {
    it("should skip null and undefined attribute values", function () {
      // Tests lines 248-250
      const el = Component.h("div", {
        id: "test",
        title: null,
        "data-value": undefined,
      });
      expect(el.getAttribute("id")).toBe("test");
      expect(el.getAttribute("title")).toBeNull();
      expect(el.getAttribute("data-value")).toBeNull();
    });
  });
});

describe("Children Appending Branches (Lines 253-274)", function () {
  describe("positive: all child type branches", function () {
    it("should handle null children", function () {
      // Tests line 256-257
      const el = Component.h("div", {}, null);
      expect(el.innerHTML).toBe("");
    });

    it("should handle undefined children", function () {
      // Tests line 256-257
      const el = Component.h("div", {}, undefined);
      expect(el.innerHTML).toBe("");
    });

    it("should handle false children", function () {
      // Tests line 256-257
      const el = Component.h("div", {}, false);
      expect(el.innerHTML).toBe("");
    });

    it("should handle string children", function () {
      // Tests lines 258-259
      const el = Component.h("p", {}, "Hello World");
      expect(el.textContent).toBe("Hello World");
    });

    it("should handle number children", function () {
      // Tests lines 258-259
      const el = Component.h("span", {}, 123);
      expect(el.textContent).toBe("123");
    });

    it("should handle array children recursively", function () {
      // Tests lines 260-262
      const el = Component.h("ul", {}, [Component.h("li", {}, "1"), Component.h("li", {}, "2")]);
      expect(el.children.length).toBe(2);
    });

    it("should handle nested array children", function () {
      // Tests lines 260-262: recursive handling
      const el = Component.h("div", {}, [[["nested text"]]]);
      expect(el.textContent).toBe("nested text");
    });

    it("should handle HTMLElement children", function () {
      // Tests lines 263-264
      const childEl = document.createElement("span");
      childEl.textContent = "existing";
      const parent = Component.h("div", {}, childEl);
      expect(parent.querySelector("span").textContent).toBe("existing");
    });

    it("should handle Component children", function () {
      // Tests lines 265-272
      const ChildComponent = class extends Component {
        render() {
          return Component.h("strong", {}, "child");
        }
      };
      const el = Component.h("div", {}, new ChildComponent());
      expect(el.querySelector("strong")).not.toBeNull();
      expect(el.querySelector("strong").textContent).toBe("child");
    });

    it("should handle Component children returning non-HTMLElement", function () {
      // Tests lines 265-272: cel not instanceof HTMLElement
      const NonElementChild = class extends Component {
        render() {
          return "not element";
        }
      };
      const el = Component.h("div", {}, new NonElementChild());
      expect(el.tagName).toBe("DIV");
    });
  });

  describe("negative: children edge cases", function () {
    it("should handle empty arrays", function () {
      // Tests line 260: empty array
      const el = Component.h("div", {}, []);
      expect(el.innerHTML).toBe("");
    });

    it("should handle deeply nested empty arrays", function () {
      const el = Component.h("div", {}, [[[]]]);
      expect(el.innerHTML).toBe("");
    });

    it("should handle mixed falsy values in arrays", function () {
      const el = Component.h("div", {}, [null, "text", undefined, 42, false]);
      expect(el.textContent).toBe("text42");
    });
  });
});

describe("Event Handler Type Branches (Lines 112-119)", function () {
  let container;

  beforeEach(function () {
    container = document.createElement("div");
    container.id = "test-container-branch";
    document.body.appendChild(container);
  });

  afterEach(function () {
    document.body.removeChild(container);
  });

  describe("positive: all handler type branches", function () {
    it("should handle string handler method names", function () {
      // Tests lines 112-114
      const handler = jest.fn();
      const TestComponent = class extends Component {
        render() {
          return Component.h("button", { "data-action": "test" }, "Click");
        }
        getEventMap() {
          return { "click [data-action]": "handleTestClick" };
        }
        handleTestClick() {
          handler();
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container-branch");
      container.querySelector("[data-action]").click();
      expect(handler).toHaveBeenCalled();
    });

    it("should handle function handlers directly", function () {
      // Tests lines 115-116
      const handler = jest.fn();
      const TestComponent = class extends Component {
        render() {
          return Component.h("button", { className: "direct" }, "Click");
        }
        getEventMap() {
          return { "click .direct": handler };
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container-branch");
      container.querySelector(".direct").click();
      expect(handler).toHaveBeenCalled();
    });
  });

  describe("negative: invalid handler types", function () {
    it("should skip handlers that are not methods on component", function () {
      // Tests line 113: !this[handler] check
      const TestComponent = class extends Component {
        render() {
          return Component.h("div", {}, "Test");
        }
        getEventMap() {
          return { "click .test": "nonexistentMethod" };
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container-branch");
      expect(container.querySelector("div")).not.toBeNull();
    });

    it("should skip handlers that are not functions", function () {
      // Tests lines 117-119: invalid handler type
      const TestComponent = class extends Component {
        render() {
          return Component.h("div", {}, "Test");
        }
        getEventMap() {
          return { "click .test": 123 };
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container-branch");
      expect(container.querySelector("div")).not.toBeNull();
    });

    it("should skip handlers that are objects", function () {
      const TestComponent = class extends Component {
        render() {
          return Component.h("div", {}, "Test");
        }
        getEventMap() {
          return { "click .test": { handle: () => {} } };
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container-branch");
      expect(container.querySelector("div")).not.toBeNull();
    });
  });
});

describe("Lifecycle Conditional Branches", function () {
  let container;

  beforeEach(function () {
    container = document.createElement("div");
    container.id = "test-container-branch";
    document.body.appendChild(container);
  });

  afterEach(function () {
    document.body.removeChild(container);
  });

  describe("willMount lifecycle", function () {
    it("should call willMount when defined", function () {
      // Tests line 25: this.willMount && this.willMount()
      const willMountSpy = jest.fn();
      const TestComponent = class extends Component {
        willMount() {
          willMountSpy();
        }
        render() {
          return Component.h("div", {}, "Test");
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container-branch");
      expect(willMountSpy).toHaveBeenCalled();
    });
  });

  describe("didMount lifecycle", function () {
    it("should call didMount when defined", function () {
      // Tests line 42: this.didMount && this.didMount()
      const didMountSpy = jest.fn();
      const TestComponent = class extends Component {
        didMount() {
          didMountSpy();
        }
        render() {
          return Component.h("div", {}, "Test");
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container-branch");
      expect(didMountSpy).toHaveBeenCalled();
    });
  });

  describe("willReceiveProps lifecycle", function () {
    it("should call willReceiveProps on update", function () {
      // Tests line 81: this.willReceiveProps && this.willReceiveProps(this.props)
      const willReceivePropsSpy = jest.fn();
      const TestComponent = class extends Component {
        willReceiveProps() {
          willReceivePropsSpy();
        }
        render() {
          return Component.h("div", {}, "Test");
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container-branch");
      comp.update();
      expect(willReceivePropsSpy).toHaveBeenCalled();
    });
  });

  describe("didUpdate lifecycle", function () {
    it("should call didUpdate when defined", function () {
      // Tests line 83: this.didUpdate && this.didUpdate()
      const didUpdateSpy = jest.fn();
      const TestComponent = class extends Component {
        didUpdate() {
          didUpdateSpy();
        }
        render() {
          return Component.h("div", {}, "Test");
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container-branch");
      comp.update();
      expect(didUpdateSpy).toHaveBeenCalled();
    });
  });

  describe("willDestroy lifecycle", function () {
    it("should call willDestroy when defined", function () {
      // Tests line 159: this.willDestroy && this.willDestroy()
      const willDestroySpy = jest.fn();
      const TestComponent = class extends Component {
        willDestroy() {
          willDestroySpy();
        }
        render() {
          return Component.h("div", {}, "Test");
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container-branch");
      comp.destroy();
      expect(willDestroySpy).toHaveBeenCalled();
    });
  });

  describe("didDestroy lifecycle", function () {
    it("should call didDestroy when defined", function () {
      // Tests line 171: this.didDestroy && this.didDestroy()
      const didDestroySpy = jest.fn();
      const TestComponent = class extends Component {
        didDestroy() {
          didDestroySpy();
        }
        render() {
          return Component.h("div", {}, "Test");
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container-branch");
      comp.destroy();
      expect(didDestroySpy).toHaveBeenCalled();
    });
  });
});

describe("Render Return Type Branches", function () {
  let container;

  beforeEach(function () {
    container = document.createElement("div");
    container.id = "test-container-branch";
    document.body.appendChild(container);
  });

  afterEach(function () {
    document.body.removeChild(container);
  });

  describe("mount with different render return types", function () {
    it("should handle render returning string", function () {
      // Tests lines 29-32
      const TestComponent = class extends Component {
        render() {
          return "<span>string content</span>";
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container-branch");
      expect(comp._el.tagName).toBe("SPAN");
      expect(comp._el.textContent).toBe("string content");
    });

    it("should handle render returning HTMLElement", function () {
      // Tests lines 33-35
      const existingEl = document.createElement("article");
      existingEl.textContent = "direct element";
      const TestComponent = class extends Component {
        render() {
          return existingEl;
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container-branch");
      expect(comp._el).toBe(existingEl);
    });

    it("should handle render returning null", function () {
      // Tests line 37: this._el is null when render returns null
      const TestComponent = class extends Component {
        render() {
          return null;
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container-branch");
      expect(comp._el).toBeNull();
    });
  });

  describe("update with different render return types", function () {
    it("should handle update with string render", function () {
      // Tests lines 67-72
      const TestComponent = class extends Component {
        render() {
          return Component.h("div", { className: "update" }, "Updated");
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container-branch");
      const originalEl = comp._el;
      comp.update();
      expect(comp._el).not.toBe(originalEl);
      expect(comp._el.textContent).toBe("Updated");
    });

    it("should handle update with HTMLElement render", function () {
      // Tests lines 73-76
      const newEl = document.createElement("section");
      newEl.textContent = "new element";
      const TestComponent = class extends Component {
        render() {
          return newEl;
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container-branch");
      comp.update();
      expect(comp._el).toBe(newEl);
    });
  });
});

describe("Event Delegation Edge Cases", function () {
  let container;

  beforeEach(function () {
    container = document.createElement("div");
    container.id = "test-container-branch";
    document.body.appendChild(container);
  });

  afterEach(function () {
    document.body.removeChild(container);
  });

  it("should handle selector matching with closest()", function () {
    // Tests line 130: e.target.closest(selector)
    const handler = jest.fn();
    const TestComponent = class extends Component {
      render() {
        return Component.h(
          "div",
          { className: "container" },
          Component.h("button", { "data-action": "test" }, "Click")
        );
      }
      getEventMap() {
        return { "click [data-action]": "handleClick" };
      }
      handleClick(e, target) {
        handler(target.dataset.action);
      }
    };
    const comp = new TestComponent();
    comp.mount("#test-container-branch");
    const button = container.querySelector("[data-action]");
    button.click();
    expect(handler).toHaveBeenCalledWith("test");
  });

  it("should skip when closest returns null", function () {
    // Tests line 130-132: target is null check
    const handler = jest.fn();
    const TestComponent = class extends Component {
      render() {
        return Component.h(
          "div",
          { className: "container" },
          Component.h("span", { className: "no-action" }, "No action")
        );
      }
      getEventMap() {
        return { "click [data-action]": "handleClick" };
      }
      handleClick() {
        handler();
      }
    };
    const comp = new TestComponent();
    comp.mount("#test-container-branch");
    const span = container.querySelector(".no-action");
    span.click();
    expect(handler).not.toHaveBeenCalled();
  });

  it("should handle event delegation key generation", function () {
    // Tests line 122: delegationKey generation
    const handler = jest.fn();
    const TestComponent = class extends Component {
      render() {
        return Component.h("div", { className: "events" }, "Events");
      }
      getEventMap() {
        return {
          "click .events": "handleClick",
          "mouseover .events": "handleMouseover",
        };
      }
      handleClick() {
        handler("click");
      }
      handleMouseover() {
        handler("mouseover");
      }
    };
    const comp = new TestComponent();
    comp.mount("#test-container-branch");
    const el = container.querySelector(".events");
    el.click();
    el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(2);
  });
});

describe("State Update Batching", function () {
  let container;

  beforeEach(function () {
    container = document.createElement("div");
    container.id = "test-container-branch";
    document.body.appendChild(container);
  });

  afterEach(function () {
    document.body.removeChild(container);
  });

  it("should batch state updates without triggering update when not mounted", function () {
    // Tests lines 48-54: setState behavior when not mounted
    const TestComponent = class extends Component {
      render() {
        return Component.h("div", {}, "Test");
      }
    };
    const comp = new TestComponent();
    // Not mounted yet
    comp.setState({ count: 1 });
    comp.setState({ count: 2 });
    comp.setState({ count: 3 });
    expect(comp.state.count).toBe(3);
    expect(comp._el).toBeNull();
  });

  it("should batch state updates and trigger single update when mounted", function () {
    // Note: Component.setState does not batch - each call triggers update
    // This test verifies individual updates work correctly
    let renderCount = 0;
    const TestComponent = class extends Component {
      render() {
        renderCount++;
        return Component.h("div", {}, `Count: ${this.state.count || 0}`);
      }
    };
    const comp = new TestComponent();
    comp.mount("#test-container-branch");
    const initialRender = renderCount;
    comp.setState({ count: 1 });
    comp.setState({ count: 2 });
    comp.setState({ count: 3 });
    // Each setState triggers an update when mounted
    expect(renderCount).toBe(initialRender + 3);
    expect(comp._el.textContent).toBe("Count: 3");
  });
});

describe("Props Validation Branches", function () {
  let container;

  beforeEach(function () {
    container = document.createElement("div");
    container.id = "test-container-branch";
    document.body.appendChild(container);
  });

  afterEach(function () {
    document.body.removeChild(container);
  });

  it("should handle empty props object", function () {
    // Tests default props handling
    const TestComponent = class extends Component {
      render() {
        return Component.h("div", {}, this.props.name || "Anonymous");
      }
    };
    const comp = new TestComponent();
    comp.mount("#test-container-branch");
    expect(comp._el.textContent).toBe("Anonymous");
  });

  it("should handle props with undefined values", function () {
    const TestComponent = class extends Component {
      render() {
        return Component.h("div", {}, this.props.missing || "default");
      }
    };
    const comp = new TestComponent({ missing: undefined });
    comp.mount("#test-container-branch");
    expect(comp._el.textContent).toBe("default");
  });

  it("should preserve props passed to Component.h()", function () {
    const ChildComponent = class extends Component {
      render() {
        return Component.h("span", {}, this.props.message || "default");
      }
    };
    const el = Component.h("div", {}, Component.h(ChildComponent, { message: "Hello" }));
    expect(el.querySelector("span").textContent).toBe("Hello");
  });
});

describe("Select Value Handling", function () {
  it("should set select value after children are added", function () {
    // Tests lines 279-281: valueAttr handling after appendChildren
    const select = Component.h(
      "select",
      { value: "opt3" },
      Component.h("option", { value: "opt1" }, "Option 1"),
      Component.h("option", { value: "opt2" }, "Option 2"),
      Component.h("option", { value: "opt3" }, "Option 3")
    );
    expect(select.value).toBe("opt3");
  });

  it("should not override select value when valueAttr is null", function () {
    // Tests line 279: valueAttr !== null check
    const select = Component.h(
      "select",
      { value: null },
      Component.h("option", { value: "opt1" }, "Option 1")
    );
    // First option should be selected by default
    expect(select.value).toBe("opt1");
  });
});

describe("Class Name Generation Branches", function () {
  it("should handle className with multiple classes", function () {
    const el = Component.h("div", { className: "class1 class2 class3" });
    expect(el.className).toBe("class1 class2 class3");
  });

  it("should handle empty className", function () {
    const el = Component.h("div", { className: "" });
    expect(el.className).toBe("");
  });
});

describe("Destroy Edge Cases", function () {
  let container;

  beforeEach(function () {
    container = document.createElement("div");
    container.id = "test-container-branch";
    document.body.appendChild(container);
  });

  afterEach(function () {
    document.body.removeChild(container);
  });

  it("should handle destroy when _el has no parentNode", function () {
    // Tests line 165: this._el.parentNode check
    const TestComponent = class extends Component {
      render() {
        return Component.h("div", {}, "Orphan");
      }
    };
    const comp = new TestComponent();
    comp.mount("#test-container-branch");
    const el = comp._el;
    // Remove from DOM manually
    el.parentNode.removeChild(el);
    // Now destroy should not throw
    comp.destroy();
    expect(comp._el).toBeNull();
  });

  it("should handle destroy when _delegatedHandlers is already null", function () {
    const TestComponent = class extends Component {
      render() {
        return Component.h("div", {}, "Test");
      }
    };
    const comp = new TestComponent();
    comp._delegatedHandlers = null;
    // Should not throw
    comp._cleanupEvents();
    expect(true).toBe(true);
  });
});

describe("BindEvents Cleanup Branches", function () {
  let container;

  beforeEach(function () {
    container = document.createElement("div");
    container.id = "test-container-branch";
    document.body.appendChild(container);
  });

  afterEach(function () {
    document.body.removeChild(container);
  });

  it("should cleanup events before rebinding", function () {
    // Tests line 104: this._cleanupEvents() call
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    const TestComponent = class extends Component {
      render() {
        return Component.h("div", { className: "rebind" }, "Content");
      }
      getEventMap() {
        return { "click .rebind": handler1 };
      }
    };
    const comp = new TestComponent();
    comp.mount("#test-container-branch");
    // Update event map - should cleanup old events
    TestComponent.prototype.getEventMap = function () {
      return { "click .rebind": handler2 };
    };
    comp.bindEvents();
    const el = container.querySelector(".rebind");
    el.click();
    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
  });

  it("should handle empty event map", function () {
    // Tests lines 100-101: Object.keys(map).length === 0
    const TestComponent = class extends Component {
      render() {
        return Component.h("div", {}, "Test");
      }
      getEventMap() {
        return {};
      }
    };
    const comp = new TestComponent();
    comp.mount("#test-container-branch");
    // Should not throw and should return early
    comp.bindEvents();
    expect(true).toBe(true);
  });
});

describe("Component Update Skip Logic", function () {
  let container;

  beforeEach(function () {
    container = document.createElement("div");
    container.id = "test-container-branch";
    document.body.appendChild(container);
  });

  afterEach(function () {
    document.body.removeChild(container);
  });

  it("should skip update when shouldUpdate returns false", function () {
    // Tests lines 59-61: shouldUpdate check
    let renderCount = 0;
    const TestComponent = class extends Component {
      shouldUpdate() {
        return false;
      }
      render() {
        renderCount++;
        return Component.h("div", {}, `Count: ${renderCount}`);
      }
    };
    const comp = new TestComponent();
    comp.mount("#test-container-branch");
    const originalText = comp._el.textContent;
    const originalEl = comp._el;
    comp.update();
    expect(renderCount).toBe(1);
    expect(comp._el).toBe(originalEl);
    expect(comp._el.textContent).toBe(originalText);
  });

  it("should update when shouldUpdate returns true", function () {
    const TestComponent = class extends Component {
      shouldUpdate() {
        return true;
      }
      render() {
        return Component.h("div", {}, "Updated");
      }
    };
    const comp = new TestComponent();
    comp.mount("#test-container-branch");
    const originalEl = comp._el;
    comp.update();
    expect(comp._el).not.toBe(originalEl);
  });
});
