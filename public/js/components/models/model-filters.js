/**
 * ModelFilters Component - Event-Driven DOM Updates
 * Search, status, and favorites filter
 */

class ModelFilters extends Component {
  constructor(props) {
    super(props);

    // Direct properties instead of state
    this.search = props.search || "";
    this.status = props.status || "all";
    this.favoritesOnly = props.favoritesOnly || false;

    this.onSearchChange = props.onSearchChange;
    this.onStatusChange = props.onStatusChange;
    this.onFavoritesToggle = props.onFavoritesToggle;
  }

  bindEvents() {
    // Search input
    this.on("input", "[data-field=search]", (e) => {
      this.search = e.target.value;
      this._updateSearchUI();
      this.onSearchChange?.(this.search);
    });

    // Status select
    this.on("change", "[data-field=status]", (e) => {
      this.status = e.target.value;
      this.onStatusChange?.(this.status);
    });

    // Favorites checkbox
    this.on("change", "[data-field=favorites-only]", (e) => {
      this.favoritesOnly = e.target.checked;
      this.onFavoritesToggle?.(this.favoritesOnly);
    });
  }

  _updateSearchUI() {
    const input = this.$("[data-field=search]");
    if (input) {
      input.value = this.search;
    }
  }

  render() {
    return Component.h(
      "div",
      { className: "filters" },
      Component.h("input", {
        type: "text",
        placeholder: "Search models...",
        "data-field": "search",
        value: this.search,
        autoComplete: "off",
      }),
      Component.h(
        "select",
        { "data-field": "status", value: this.status },
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
          checked: this.favoritesOnly,
        }),
        "Show Favorites Only"
      )
    );
  }
}

window.ModelFilters = ModelFilters;
