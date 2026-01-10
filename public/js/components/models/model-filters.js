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
    return `
      <div class="filters">
        <input
          type="text"
          placeholder="Search models..."
          data-field="search"
          value="${this.search}"
          autocomplete="off"
        />
        <select data-field="status" value="${this.status}">
          <option value="all">All</option>
          <option value="loaded">Loaded</option>
          <option value="unloaded">Unloaded</option>
        </select>
        <label class="favorites-filter">
          <input
            type="checkbox"
            data-field="favorites-only"
            ${this.favoritesOnly ? "checked" : ""}
          />
          Show Favorites Only
        </label>
      </div>
    `;
  }
}

window.ModelFilters = ModelFilters;
