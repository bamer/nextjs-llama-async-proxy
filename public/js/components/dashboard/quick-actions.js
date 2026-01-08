/**
 * Quick Actions Component
 * Displays action buttons for quick navigation and operations
 */

class QuickActions extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  /**
   * Event map - maps DOM events to handlers
   */
  getEventMap() {
    return {
      "click [data-action=refresh]": "handleRefresh",
    };
  }

  /**
   * Handle refresh button click
   * @param {Event} event - Click event
   */
  handleRefresh(event) {
    event.preventDefault();
    console.log("[DEBUG] QuickActions refresh clicked");

    if (this.props.onRefresh) {
      this.props.onRefresh();
    }
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
