/**
 * Model Filters Component
 * Search, status, and favorites filter
 */

class ModelFilters extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: props.search || "",
      status: props.status || "all",
      favoritesOnly: props.favoritesOnly || false,
    };
    this.onSearchChange = props.onSearchChange;
    this.onStatusChange = props.onStatusChange;
    this.onFavoritesToggle = props.onFavoritesToggle;
  }

  render() {
    return Component.h(
      "div",
      { className: "filters" },
      Component.h("input", {
        type: "text",
        placeholder: "Search models...",
        "data-field": "search",
        value: this.state.search,
        autoComplete: "off",
      }),
      Component.h(
        "select",
        { "data-field": "status", value: this.state.status },
        Component.h("option", { value: "all" }, "All"),
        Component.h("option", { value: "loaded" }, "Loaded"),
        Component.h("option", { value: "unloaded" }, "Unloaded")
      ),
      Component.h(
        "label",
        { className: "favorites-filter" },
        Component.h("input", {
          type: "checkbox",
          "data-field": "favorites-only",
          checked: this.state.favoritesOnly,
        }),
        "Show Favorites Only"
      )
    );
  }
}

window.ModelFilters = ModelFilters;
