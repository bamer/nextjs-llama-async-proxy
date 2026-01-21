/**
 * Dashboard Page - Composition of Atomic Components
 */

class DashboardPage extends Component {
  constructor(props = {}) {
    super(props);
  }

  render() {
    return Component.h(
      "div",
      { className: "dashboard-main dashboard-page unified" },
      [
        Component.h(window.MetricsSection, {}),
        Component.h("div", { className: "dashboard-middle-row" }, [
          Component.h(window.RouterCardSection, {}),
          Component.h(window.HealthSection, {}),
        ]),
        Component.h(window.GPUSection, {}),
      ]
    );
  }

  _handleRouterAction(action, data) {
    if (typeof window.handleRouterAction === "function") {
      window.handleRouterAction(action, data).catch((err) => {
        console.error("[DashboardPage] Router action error:", err);
      });
    } else {
      console.error("[DashboardPage] handleRouterAction not found!");
    }
  }
}

window.DashboardPage = DashboardPage;

