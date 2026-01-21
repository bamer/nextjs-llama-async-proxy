/**
 * Comprehensive Component class tests
 * Tests mount(), update(), event delegation, and Component.h() factory
 * @jest-environment jsdom
 */



const componentPath = new URL("../../../public/js/core/component.js", import.meta.url);
await import(componentPath.href);

const Component = global.window.Component;

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";

describe("Component Class", function () {
  let container;

  beforeEach(function () {
    document.body.innerHTML = ''; // Clear existing content
    container = document.createElement("div");
    container.id = "test-container";
    document.body.appendChild(container);
  });

  afterEach(function () {
    document.body.removeChild(container);
  });

  describe("mount()", function () {
    describe("positive: mount with string parent selector", function () {
      it("should mount component to DOM using string selector", function () {
        const TestComponent = class extends Component {
          render() {
            return Component.h("div", { className: "test" }, "Hello");
          }
        };
        new TestComponent().mount("#test-container");
        const mountedEl = container.querySelector(".test");
        expect(mountedEl).not.toBeNull();
        expect(mountedEl.textContent).toBe("Hello");
      });

      it("should call willMount and didMount lifecycle hooks", function () {
        const willMountSpy = jest.fn();
        const didMountSpy = jest.fn();
        const TestComponent = class extends Component {
          willMount() {
            willMountSpy();
          }
          didMount() {
            didMountSpy();
          }
          render() {
            return Component.h("div", {}, "Content");
          }
        };
        new TestComponent().mount("#test-container");
        expect(willMountSpy).toHaveBeenCalled();
        expect(didMountSpy).toHaveBeenCalled();
      });

      it("should set _mounted flag to true after mounting", function () {
        const TestComponent = class extends Component {
          render() {
            return Component.h("div", {}, "Content");
          }
        };
        const comp = new TestComponent();
        comp.mount("#test-container");
        expect(comp._mounted).toBe(true);
        expect(comp._el).not.toBeNull();
      });

      it("should work with HTMLElement parent directly", function () {
        const TestComponent = class extends Component {
          render() {
            return Component.h("span", {}, "Direct mount");
          }
        };
        new TestComponent().mount(container);
        expect(container.querySelector("span")).not.toBeNull();
        expect(container.querySelector("span").textContent).toBe("Direct mount");
      });
    });

    describe("negative: mount with invalid parent", function () {
      it("should throw error when parent selector not found", function () {
        const TestComponent = class extends Component {
          render() {
            return Component.h("div", {}, "Content");
          }
        };
        const comp = new TestComponent();
        expect(function () {
          comp.mount("#nonexistent");
        }).toThrow("Parent not found");
      });

      it("should throw error when parent is null", function () {
        const TestComponent = class extends Component {
          render() {
            return Component.h("div", {}, "Content");
          }
        };
        const comp = new TestComponent();
        expect(function () {
          comp.mount(null);
        }).toThrow("Parent not found");
      });
    });
  });





  describe("Event Delegation - bindEvents()", function () {
    describe("positive: event binding", function () {
      it("should bind click events with selector", function () {
        const clickHandler = jest.fn();
        const TestComponent = class extends Component {
          render() {
            return Component.h(
              "div",
              { className: "event-container" },
              Component.h("button", { "data-action": "test" }, "Click me")
            );
          }
          getEventMap() {
            return { "click [data-action]": "handleClick" };
          }
          handleClick(e, target) {
            clickHandler(target.dataset.action);
          }
        };
        const comp = new TestComponent();
        comp.mount("#test-container");
        const button = container.querySelector("[data-action]");
        button.click();
        expect(clickHandler).toHaveBeenCalledWith("test");
      });

      it("should bind function handlers directly", function () {
        const handler = jest.fn();
        const TestComponent = class extends Component {
          render() {
            return Component.h("button", { className: "fn-btn" }, "Action");
          }
          getEventMap() {
            return { "click .fn-btn": handler };
          }
        };
        const comp = new TestComponent();
        comp.mount("#test-container");
        container.querySelector(".fn-btn").click();
        expect(handler).toHaveBeenCalled();
      });

      it("should bind multiple event types", function () {
        const mouseoverHandler = jest.fn();
        const mouseoutHandler = jest.fn();
        const TestComponent = class extends Component {
          render() {
            return Component.h("div", { className: "multi-event" }, "Hover me");
          }
          getEventMap() {
            return {
              "mouseover .multi-event": "handleMouseover",
              "mouseout .multi-event": "handleMouseout",
            };
          }
          handleMouseover() {
            mouseoverHandler();
          }
          handleMouseout() {
            mouseoutHandler();
          }
        };
        const comp = new TestComponent();
        comp.mount("#test-container");
        const el = container.querySelector(".multi-event");
        el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
        el.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
        expect(mouseoverHandler).toHaveBeenCalled();
        expect(mouseoutHandler).toHaveBeenCalled();
      });

      it("should handle event with no selector (element itself)", function () {
        const clickHandler = jest.fn();
        const TestComponent = class extends Component {
          render() {
            return Component.h("div", { className: "self-click" }, "Click");
          }
          getEventMap() {
            return { click: "handleClick" };
          }
          handleClick() {
            clickHandler();
          }
        };
        const comp = new TestComponent();
        comp.mount("#test-container");
        container.querySelector(".self-click").click();
        expect(clickHandler).toHaveBeenCalled();
      });
    });

    describe("negative: event handling", function () {
      it("should ignore events from outside component", function () {
        const handler = jest.fn();
        const TestComponent = class extends Component {
          render() {
            return Component.h("div", { className: "inside" }, "Inside");
          }
          getEventMap() {
            return { "click .inside": handler };
          }
        };
        const comp = new TestComponent();
        comp.mount("#test-container");
        const outsideEl = document.createElement("div");
        outsideEl.className = "outside";
        outsideEl.setAttribute("data-action", "inside");
        container.appendChild(outsideEl);
        outsideEl.click();
        expect(handler).not.toHaveBeenCalled();
      });

      it("should skip handlers that are not methods on component", function () {
        const TestComponent = class extends Component {
          render() {
            return Component.h("div", {}, "Test");
          }
          getEventMap() {
            return { "click .test": "nonexistentMethod" };
          }
        };
        const comp = new TestComponent();
        comp.mount("#test-container");
        expect(container.querySelector("div")).not.toBeNull();
      });

      it("should handle invalid handler types gracefully", function () {
        const TestComponent = class extends Component {
          render() {
            return Component.h("div", {}, "Test");
          }
          getEventMap() {
            return { "click .test": 123 };
          }
        };
        const comp = new TestComponent();
        comp.mount("#test-container");
        expect(container.querySelector("div")).not.toBeNull();
      });
    });
  });

  describe("_cleanupEvents()", function () {
    it("should remove all delegated event listeners", function () {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const TestComponent = class extends Component {
        render() {
          return Component.h("div", { className: "cleanup-test" }, "Content");
        }
        getEventMap() {
          return { "click .cleanup-test": handler1, "mouseover .cleanup-test": handler2 };
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container");
      comp._cleanupEvents();
      const el = container.querySelector(".cleanup-test");
      el.click();
      el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it("should handle cleanup when _delegatedHandlers is null", function () {
      const TestComponent = class extends Component {
        render() {
          return Component.h("div", {}, "Test");
        }
      };
      const comp = new TestComponent();
      comp._delegatedHandlers = null;
      comp._cleanupEvents();
      expect(true).toBe(true);
    });
  });

  describe("Component.h() factory", function () {
    describe("positive: basic element creation", function () {
      it("should create simple HTML elements", function () {
        const el = Component.h("div", { className: "test" }, "Hello");
        expect(el.tagName).toBe("DIV");
        expect(el.className).toBe("test");
        expect(el.textContent).toBe("Hello");
      });

      it("should create elements with multiple children", function () {
        const el = Component.h(
          "ul",
          {},
          Component.h("li", {}, "Item 1"),
          Component.h("li", {}, "Item 2"),
          Component.h("li", {}, "Item 3")
        );
        expect(el.tagName).toBe("UL");
        expect(el.children.length).toBe(3);
      });

      it("should handle numeric children", function () {
        const el = Component.h("span", {}, 42, " is the answer");
        expect(el.textContent).toBe("42 is the answer");
      });

      it("should handle mixed child types", function () {
        const childEl = document.createElement("strong");
        childEl.textContent = "bold";
        const el = Component.h("p", {}, "Normal ", childEl, " text");
        expect(el.innerHTML).toBe("Normal <strong>bold</strong> text");
      });
    });

    describe("Component classes (line 177-202)", function () {
      it("should instantiate Component classes and render them", function () {
        const ChildComponent = class extends Component {
          render() {
            return Component.h("span", { className: "child" }, "Child Content");
          }
        };
        const parent = Component.h("div", { className: "parent" }, Component.h(ChildComponent, {}));
        expect(parent.querySelector(".child")).not.toBeNull();
        expect(parent.querySelector(".child").textContent).toBe("Child Content");
      });

      it("should bind events on child Component instances", function () {
        const clickHandler = jest.fn();
        const ChildComponent = class extends Component {
          render() {
            return Component.h("button", { "data-action": "test" }, "Child Button");
          }
          getEventMap() {
            return { "click [data-action]": "handleClick" };
          }
          handleClick() {
            clickHandler();
          }
        };
        const parent = Component.h("div", {}, Component.h(ChildComponent, {}));
        document.body.appendChild(parent);
        parent.querySelector("[data-action]").click();
        document.body.removeChild(parent);
        expect(clickHandler).toHaveBeenCalled();
      });

      it("should pass props to child Component classes", function () {
        const ChildComponent = class extends Component {
          render() {
            return Component.h("span", {}, this.props.message || "default");
          }
        };
        const el = Component.h("div", {}, Component.h(ChildComponent, { message: "Hello Props" }));
        expect(el.querySelector("span").textContent).toBe("Hello Props");
      });

      it("should handle nested Component children", function () {
        const GrandchildComponent = class extends Component {
          render() {
            return Component.h("em", {}, "Grandchild");
          }
        };
        const ChildComponent = class extends Component {
          render() {
            return Component.h("strong", {}, Component.h(GrandchildComponent, {}));
          }
        };
        const el = Component.h("p", {}, Component.h(ChildComponent, {}));
        expect(el.innerHTML).toBe("<strong><em>Grandchild</em></strong>");
      });
    });

    describe("Select elements with value (line 220-228)", function () {
      it("should set value on select element after children", function () {
        const select = Component.h(
          "select",
          { value: "option2" },
          Component.h("option", { value: "option1" }, "Option 1"),
          Component.h("option", { value: "option2" }, "Option 2"),
          Component.h("option", { value: "option3" }, "Option 3")
        );
        expect(select.value).toBe("option2");
      });

      it("should handle select with no value attribute", function () {
        const select = Component.h(
          "select",
          {},
          Component.h("option", { value: "opt1" }, "Option 1")
        );
        expect(select.value).toBe("opt1");
      });

      it("should handle select with null value", function () {
        const select = Component.h(
          "select",
          { value: null },
          Component.h("option", { value: "opt1" }, "Option 1")
        );
        expect(select.value).toBe("opt1");
      });
    });

    describe("Style objects (line 210-211)", function () {
      it("should apply style object properties", function () {
        const el = Component.h("div", {
          style: { color: "red", backgroundColor: "blue", fontSize: "14px" },
        });
        expect(el.style.color).toBe("red");
        expect(el.style.backgroundColor).toBe("blue");
        expect(el.style.fontSize).toBe("14px");
      });

      it("should handle empty style object", function () {
        const el = Component.h("div", { style: {} });
        expect(el.style.cssText).toBe("");
      });

      it("should handle style with camelCase properties", function () {
        const el = Component.h("span", {
          style: { marginTop: "10px", paddingLeft: "5px" },
        });
        expect(el.style.marginTop).toBe("10px");
        expect(el.style.paddingLeft).toBe("5px");
      });
    });

    describe("Dataset (line 214-217)", function () {
      it("should set data attributes from dataset object", function () {
        const el = Component.h("div", {
          dataset: { userId: "123", actionName: "test-action", isValid: "true" },
        });
        expect(el.dataset.userId).toBe("123");
        expect(el.dataset.actionName).toBe("test-action");
        expect(el.dataset.isValid).toBe("true");
      });

      it("should convert camelCase to kebab-case in dataset", function () {
        const el = Component.h("div", {
          dataset: { userName: "john", someLongKey: "value" },
        });
        expect(el.dataset.userName).toBe("john");
        expect(el.dataset.someLongKey).toBe("value");
      });

      it("should handle empty dataset", function () {
        const el = Component.h("div", { dataset: {} });
        expect(el.dataset).toBeDefined();
      });
    });

    describe("Boolean attributes (line 232-236)", function () {
      it("should set boolean attribute when true", function () {
        const input = Component.h("input", {
          type: "checkbox",
          checked: true,
          disabled: true,
        });
        expect(input.checked).toBe(true);
        expect(input.disabled).toBe(true);
        expect(input.hasAttribute("disabled")).toBe(true);
      });

      it("should not set boolean attribute when false", function () {
        const input = Component.h("input", {
          type: "checkbox",
          checked: false,
          disabled: false,
        });
        expect(input.hasAttribute("disabled")).toBe(false);
      });

      it("should handle readonly attribute", function () {
        const input = Component.h("input", { readonly: true });
        expect(input.readOnly).toBe(true);
      });

      it("should handle multiple boolean attributes", function () {
        const button = Component.h("button", { disabled: true, formNoValidate: true });
        expect(button.disabled).toBe(true);
        expect(button.formNoValidate).toBe(true);
      });
    });

    describe("Children handling (line 242-255)", function () {
      it("should handle string children", function () {
        const el = Component.h("p", {}, "Simple text");
        expect(el.textContent).toBe("Simple text");
      });

      it("should handle number children", function () {
        const el = Component.h("span", {}, 100);
        expect(el.textContent).toBe("100");
      });

      it("should handle Component children", function () {
        const Child = class extends Component {
          render() {
            return Component.h("span", {}, "Child");
          }
        };
        const el = Component.h("div", {}, new Child());
        expect(el.querySelector("span")).not.toBeNull();
        expect(el.querySelector("span").textContent).toBe("Child");
      });

      it("should handle HTMLElement children", function () {
        const childEl = document.createElement("span");
        childEl.textContent = "Existing element";
        const parent = Component.h("div", {}, childEl);
        expect(parent.querySelector("span").textContent).toBe("Existing element");
      });

      it("should handle mixed children", function () {
        const childComp = class extends Component {
          render() {
            return Component.h("strong", {}, "comp");
          }
        };
        const el = Component.h(
          "p",
          {},
          "Text",
          123,
          Component.h("em", {}, "emphasis"),
          new childComp()
        );
        expect(el.innerHTML).toBe("Text123<em>emphasis</em><strong>comp</strong>");
      });

      it("should handle empty children array", function () {
        const el = Component.h("div", {}, []);
        expect(el.innerHTML).toBe("");
      });
    });

    describe("Other attributes handling", function () {
      it("should set className correctly", function () {
        const el = Component.h("div", { className: "foo bar baz" });
        expect(el.className).toBe("foo bar baz");
      });

      it("should set regular attributes", function () {
        const el = Component.h("a", {
          href: "https://example.com",
          target: "_blank",
          title: "Link",
        });
        expect(el.getAttribute("href")).toBe("https://example.com");
        expect(el.getAttribute("target")).toBe("_blank");
        expect(el.getAttribute("title")).toBe("Link");
      });

      it("should set textarea value via setAttribute", function () {
        const textarea = Component.h("textarea", { value: "Initial text" });
        expect(textarea.value).toBe("Initial text");
      });

      it("should set input value as property", function () {
        const input = Component.h("input", { type: "text", value: "test value" });
        expect(input.value).toBe("test value");
      });

      it("should handle null and undefined values (skip them)", function () {
        const el = Component.h("div", {
          "data-test": null,
          title: undefined,
          id: "test",
        });
        expect(el.getAttribute("id")).toBe("test");
        expect(el.getAttribute("data-test")).toBeNull();
        expect(el.getAttribute("title")).toBeNull();
      });

      it("should add event listeners via on* attributes", function () {
        let clicked = false;
        const handler = function () {
          clicked = true;
        };
        const button = Component.h("button", { onClick: handler }, "Click");
        button.click();
        expect(clicked).toBe(true);
      });
    });
  });

  describe("destroy()", function () {
    it("should call willDestroy and didDestroy lifecycle hooks", function () {
      const willDestroySpy = jest.fn();
      const didDestroySpy = jest.fn();
      const TestComponent = class extends Component {
        willDestroy() {
          willDestroySpy();
        }
        didDestroy() {
          didDestroySpy();
        }
        render() {
          return Component.h("div", {}, "Content");
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container");
      comp.destroy();
      expect(willDestroySpy).toHaveBeenCalled();
      expect(didDestroySpy).toHaveBeenCalled();
    });

    it("should remove element from DOM on destroy", function () {
      const TestComponent = class extends Component {
        render() {
          return Component.h("div", { className: "to-destroy" }, "Content");
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container");
      expect(container.querySelector(".to-destroy")).not.toBeNull();
      comp.destroy();
      expect(container.querySelector(".to-destroy")).toBeNull();
      expect(comp._el).toBeNull();
      expect(comp._mounted).toBe(false);
    });

    it("should cleanup events on destroy", function () {
      const handler = jest.fn();
      const TestComponent = class extends Component {
        render() {
          return Component.h("div", { className: "event-test" }, "Content");
        }
        getEventMap() {
          return { "click .event-test": handler };
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container");
      const eventEl = container.querySelector(".event-test");
      comp.destroy();
      eventEl.click();
      expect(handler).not.toHaveBeenCalled();
    });

    it("should handle destroy when element has no parent", function () {
      const TestComponent = class extends Component {
        render() {
          return Component.h("div", {}, "Orphan");
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container");
      const el = comp._el;
      el.parentNode.removeChild(el);
      comp.destroy();
      expect(comp._el).toBeNull();
    });
  });

  describe("Edge cases and error handling", function () {
    it("should handle render returning string with multiple elements", function () {
      const TestComponent = class extends Component {
        render() {
          return "<span>First</span><span>Second</span>";
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container");
      expect(comp._el.tagName).toBe("SPAN");
      expect(comp._el.textContent).toBe("First");
    });

    it("should handle render returning HTMLElement directly", function () {
      const existingEl = document.createElement("article");
      existingEl.textContent = "Direct element";
      const TestComponent = class extends Component {
        render() {
          return existingEl;
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container");
      expect(comp._el).toBe(existingEl);
      expect(container.querySelector("article").textContent).toBe("Direct element");
    });

    it("should handle getEventMap returning empty object", function () {
      const TestComponent = class extends Component {
        render() {
          return Component.h("div", {}, "Content");
        }
        getEventMap() {
          return {};
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container");
      expect(container.querySelector("div")).not.toBeNull();
    });

    it("should bind this context correctly in event handlers", function () {
      let thisValue = null;
      const TestComponent = class extends Component {
        render() {
          return Component.h("button", { "data-action": "test" }, "Click");
        }
        getEventMap() {
          return { "click [data-action]": "handleClick" };
        }
        handleClick() {
          thisValue = this;
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container");
      container.querySelector("[data-action]").click();
      expect(thisValue).toBe(comp);
    });

    it("should throw when calling render on base Component", function () {
      const comp = new Component();
      expect(function () {
        comp.render();
      }).toThrow("render() must be implemented");
    });



    it("should ignore events from sibling elements outside component scope", function () {
      const handler = jest.fn();
      const TestComponent = class extends Component {
        render() {
          return Component.h("div", { className: "container" }, "Content");
        }
        getEventMap() {
          return { click: "handleClick" };
        }
        handleClick() {
          handler();
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container");
      const sibling = document.createElement("div");
      sibling.className = "sibling";
      container.appendChild(sibling);
      sibling.click();
      expect(handler).not.toHaveBeenCalled();
    });

    it("should handle deeply nested Component children", function () {
      const DeepChildComponent = class extends Component {
        render() {
          return Component.h("small", {}, "deep");
        }
      };
      const GrandchildComponent = class extends Component {
        render() {
          return Component.h("div", {}, Component.h(DeepChildComponent, {}));
        }
      };
      const ChildComponent = class extends Component {
        render() {
          return Component.h("section", {}, Component.h(GrandchildComponent, {}));
        }
      };
      const el = Component.h("article", {}, Component.h(ChildComponent, {}));
      expect(el.querySelector("small").textContent).toBe("deep");
    });





    it("should skip event delegation when element does not match selector", function () {
      const handler = jest.fn();
      const TestComponent = class extends Component {
        render() {
          return Component.h(
            "div",
            { className: "outer" },
            Component.h("span", { className: "inner" }, "Inner")
          );
        }
        getEventMap() {
          return { "click .inner": "handleClick" };
        }
        handleClick() {
          handler();
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container");
      const outer = container.querySelector(".outer");
      outer.click();
      expect(handler).not.toHaveBeenCalled();
    });



    it("should bind events on Component children with event handlers", function () {
      const childClickHandler = jest.fn();
      const ChildWithEvents = class extends Component {
        render() {
          return Component.h("button", { "data-child": "event-btn" }, "Child Button");
        }
        getEventMap() {
          return { "click [data-child]": "handleChildClick" };
        }
        handleChildClick() {
          childClickHandler();
        }
      };
      const parent = Component.h("div", { className: "parent" }, Component.h(ChildWithEvents, {}));
      document.body.appendChild(parent);
      const childButton = parent.querySelector("[data-child]");
      childButton.click();
      document.body.removeChild(parent);
      expect(childClickHandler).toHaveBeenCalled();
    });

    it("should handle Component child with nested children", function () {
      const Grandchild = class extends Component {
        render() {
          return Component.h("em", {}, "nested");
        }
      };
      const ChildWithNested = class extends Component {
        render() {
          return Component.h(
            "div",
            { className: "child-with-nested" },
            "Label: ",
            Component.h(Grandchild, {})
          );
        }
      };
      const parent = Component.h("section", {}, Component.h(ChildWithNested, {}));
      expect(parent.querySelector(".child-with-nested em")).not.toBeNull();
      expect(parent.querySelector(".child-with-nested em").textContent).toBe("nested");
    });

    it("should not trigger handler when event target is outside component scope", function () {
      const handler = jest.fn();
      const TestComponent = class extends Component {
        render() {
          return Component.h("div", { className: "scope-test" }, "Inside");
        }
        getEventMap() {
          return { click: "handleClick" };
        }
        handleClick() {
          handler();
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container");
      const outsideBtn = document.createElement("button");
      outsideBtn.textContent = "Outside";
      container.appendChild(outsideBtn);
      outsideBtn.click();
      expect(handler).not.toHaveBeenCalled();
    });

    it("should handle event bubbling from deeply nested child", function () {
      // Tests line 128: when event target is inside component but not the element itself
      const handler = jest.fn();
      const TestComponent = class extends Component {
        render() {
          return Component.h(
            "div",
            { className: "outer" },
            Component.h("span", { className: "inner" }, "Inner text")
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
      comp.mount("#test-container");
      // Click on inner span - event should bubble to outer div
      const inner = container.querySelector(".inner");
      inner.click();
      expect(handler).toHaveBeenCalled();
    });

    it("should handle Component child returning null from render", function () {
      // Tests edge case in Component.h() lines 187-196 when cel is not HTMLElement
      const NullChild = class extends Component {
        render() {
          return null;
        }
      };
      const el = Component.h("div", {}, Component.h(NullChild, {}));
      // Should not throw and should create the parent div
      expect(el.tagName).toBe("DIV");
      expect(el.innerHTML).toBe("");
    });

    it("should handle Component child with string render", function () {
      // Tests edge case when Component child render returns string
      const StringChild = class extends Component {
        render() {
          return "string content";
        }
      };
      const el = Component.h("div", {}, Component.h(StringChild, {}));
      // String is handled, element is created
      expect(el.tagName).toBe("DIV");
    });

    it("should handle deeply nested event propagation", function () {
      // Tests line 128 with nested elements
      const handler = jest.fn();
      const TestComponent = class extends Component {
        render() {
          return Component.h(
            "div",
            { className: "level1" },
            Component.h(
              "div",
              { className: "level2" },
              Component.h("span", { className: "target" }, "Click me")
            )
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
      comp.mount("#test-container");
      const target = container.querySelector(".target");
      target.click();
      expect(handler).toHaveBeenCalled();
    });

    it("should handle Component child returning non-HTMLElement from render", function () {
      // Tests lines 187-196: when cel is not instanceof HTMLElement
      const NonElementChild = class extends Component {
        render() {
          return "not an element";
        }
      };
      // This should not throw and should handle gracefully
      const el = Component.h("div", { className: "parent" }, Component.h(NonElementChild, {}));
      expect(el.tagName).toBe("DIV");
      expect(el.className).toBe("parent");
    });

    it("should handle Component child with number render return", function () {
      // Tests edge case when Component child render returns number
      const NumberChild = class extends Component {
        render() {
          return 42;
        }
      };
      const el = Component.h("div", {}, Component.h(NumberChild, {}));
      expect(el.tagName).toBe("DIV");
    });

    it("should handle event when component element is the target", function () {
      // Tests line 128: when this._el === e.target
      const handler = jest.fn();
      const TestComponent = class extends Component {
        render() {
          return Component.h("div", { className: "self-target" }, "Click me");
        }
        getEventMap() {
          return { click: "handleClick" };
        }
        handleClick() {
          handler();
        }
      };
      const comp = new TestComponent();
      comp.mount("#test-container");
      // Click on the component element itself (not a child)
      const selfTarget = container.querySelector(".self-target");
      selfTarget.click();
      expect(handler).toHaveBeenCalled();
    });

    it("should handle nested Component children with their own children", function () {
      // Tests lines 187-196: Component child with children passed to parent Component.h()
      const Grandchild = class extends Component {
        render() {
          return Component.h("em", {}, "grandchild text");
        }
      };
      const ChildWithGrandchild = class extends Component {
        render() {
          return Component.h("div", { className: "child" }, "Label: ", Component.h(Grandchild, {}));
        }
      };
      // This should trigger the nested Component handling in Component.h() lines 187-196
      const el = Component.h("article", {}, Component.h(ChildWithGrandchild, {}), " more content");
      expect(el.querySelector(".child em")).not.toBeNull();
      expect(el.querySelector(".child em").textContent).toBe("grandchild text");
    });

    it("should handle Component.h with Component class having children array", function () {
      // Tests lines 187-196: Component class with children array containing nested Components
      const TinyComponent = class extends Component {
        render() {
          return Component.h("i", {}, "tiny");
        }
      };
      const ParentComponent = class extends Component {
        render() {
          return Component.h("section", {}, Component.h(TinyComponent, {}), " after tiny");
        }
      };
      // Create element using Component.h with the parent Component class
      const el = Component.h("main", {}, Component.h(ParentComponent, {}));
      expect(el.querySelector("section i")).not.toBeNull();
      expect(el.querySelector("section i").textContent).toBe("tiny");
    });
  });
});
