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

    this.unsubscribers = [];
    this.state = {
      viewMode: "table", // table | grid
      sortBy: "name",    // name | size | date
      filterBy: "all",   // all | loaded | unloaded
    };
  }

  /**
   * Subscribe to state changes for filter, sort, and view mode
   */
  onMount() {
    this.unsubscribers.push(
      stateManager.subscribe("page:models:viewMode", (mode) => {
        if (mode && mode !== this.state.viewMode) {
          this.state.viewMode = mode;
          this._updateView();
        }
      }),
      stateManager.subscribe("page:models:sortBy", (sort) => {
        if (sort && sort !== this.state.sortBy) {
          this.state.sortBy = sort;
          this._applySort();
        }
      }),
      stateManager.subscribe("page:models:filterBy", (filter) => {
        if (filter && filter !== this.state.filterBy) {
          this.state.filterBy = filter;
          this._applyFilter();
        }
      })
    );
  }

  /**
   * Clean up subscriptions when component is destroyed
   */
  destroy() {
    if (this.unsubscribers) {
      this.unsubscribers.forEach(unsub => unsub());
      this.unsubscribers = [];
    }
    super.destroy();
  }

  _updateView() {
    // Update view mode UI (e.g., toggle between table/grid icons)
    const viewToggle = this.$("[data-action=toggle-view]");
    if (viewToggle) {
      viewToggle.textContent = this.state.viewMode === "table" ? "☰" : "▦";
    }
  }

  _applySort() {
    // Trigger sort with current sortBy value
    console.log("[ModelFilters] Applying sort:", this.state.sortBy);
  }

  _applyFilter() {
    // Trigger filter with current filterBy value
    console.log("[ModelFilters] Applying filter:", this.state.filterBy);
  }

  /**
   * Updates the search input UI value.
   */
  _updateSearchUI() {
    const input = this.$("[data-field=search]");
    if (input) {
      input.value = this.search;
    }
  }

  /**
   * Binds event listeners for search, status filter, and favorites toggle.
   */
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

    // View mode toggle
    this.on("click", "[data-action=toggle-view]", () => {
      const newViewMode = this.state.viewMode === "table" ? "grid" : "table";
      stateManager.set("page:models:viewMode", newViewMode);
    });

    // Sort buttons
    this.on("click", "[data-action=sort]", (e, target) => {
      const sortBy = target.dataset.sortBy || target.closest("[data-sort-by]")?.dataset.sortBy;
      if (sortBy) {
        stateManager.set("page:models:sortBy", sortBy);
      }
    });
  }

  /**
   * Renders the filter controls.
   * @returns {string} HTML string for filter controls.
   */
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
        <button class="btn btn-sm" data-action="toggle-view" title="Toggle View Mode">
          ${this.state.viewMode === "table" ? "☰" : "▦"}
        </button>
      </div>
    `;
  }
}

window.ModelFilters = ModelFilters;
