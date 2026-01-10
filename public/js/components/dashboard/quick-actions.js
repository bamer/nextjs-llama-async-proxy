/**
 * QuickActions Component - Event-Driven DOM Updates
 * Displays action buttons for quick navigation and operations
 */

class QuickActions extends Component {
  bindEvents() {
    // Refresh button
    this.on("click", "[data-action=refresh]", (e) => {
      e.preventDefault();
      console.log("[DEBUG] QuickActions refresh clicked");

      if (this.props.onRefresh) {
        this.props.onRefresh();
      }
    });
  }

  render() {
    return Component.h(
      "div",
      { className: "quick-actions" },
      Component.h("h3", {}, "Quick Actions"),
      Component.h(
        "div",
        { className: "action-buttons" },
        Component.h(
          "button",
          { className: "btn btn-secondary", "data-action": "refresh" },
          "🔃 Refresh All"
        ),
        Component.h(
          "button",
          {
            className: "btn btn-secondary",
            onClick: () => window.router.navigate("/models"),
          },
          "📁 Manage Models"
        ),
        Component.h(
          "button",
          {
            className: "btn btn-secondary",
            onClick: () => window.router.navigate("/settings"),
          },
          "⚙️ Settings"
        ),
        Component.h(
          "button",
          {
            className: "btn btn-secondary",
            onClick: () => window.router.navigate("/logs"),
          },
          "📋 Logs"
        )
      )
    );
  }
}

window.QuickActions = QuickActions;
