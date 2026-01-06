class NotFoundController {
  render() {
    return Component.h(
      "div",
      { className: "not-found-page" },
      Component.h("h1", {}, "404"),
      Component.h("p", {}, "Page not found"),
      Component.h("a", { href: "/", className: "btn btn-primary" }, "Go Home")
    );
  }
}

window.NotFoundController = NotFoundController;
