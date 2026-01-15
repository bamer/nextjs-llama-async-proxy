/**
 * QuickActions Component - Event-Driven DOM Updates
 * Displays action buttons for quick navigation and operations
 */

class QuickActions extends Component {
  /**
   * Binds event handlers for quick action buttons.
   */
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

  /**
   * Renders the quick actions component with navigation and refresh buttons.
   * @returns {Object} Component.h() result containing the rendered action buttons.
   */
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
