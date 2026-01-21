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
   * Called after component is mounted to DOM.
   * For page-specific state (viewMode, sortBy, filterBy), we use local state.
   * These are truly local to this component and don't need to be shared.
   */
  onMount() {
    // No socket subscriptions needed for local UI state
    // View mode, sort, and filter are all local UI concerns
    console.log("[ModelFilters] onMount - using local state for view/sort/filter");
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
    // Call parent callback if provided
    this.props.onSortChange?.(this.state.sortBy);
  }

  _applyFilter() {
    // Trigger filter with current filterBy value
    console.log("[ModelFilters] Applying filter:", this.state.filterBy);
    // Call parent callback if provided
    this.props.onFilterChange?.(this.state.filterBy);
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

    // View mode toggle - use local state instead of stateManager
    this.on("click", "[data-action=toggle-view]", () => {
      const newViewMode = this.state.viewMode === "table" ? "grid" : "table";
      this.state.viewMode = newViewMode;
      this._updateView();
      // Call parent callback if provided
      this.props.onViewModeChange?.(newViewMode);
    });

    // Sort buttons - use local state instead of stateManager
    this.on("click", "[data-action=sort]", (e, target) => {
      const sortBy = target.dataset.sortBy || target.closest("[data-sort-by]")?.dataset.sortBy;
      if (sortBy && sortBy !== this.state.sortBy) {
        this.state.sortBy = sortBy;
        this._applySort();
      }
    });

    // Filter buttons - use local state instead of stateManager
    this.on("click", "[data-action=filter]", (e, target) => {
      const filterBy = target.dataset.filterBy || target.closest("[data-filter-by]")?.dataset.filterBy;
      if (filterBy && filterBy !== this.state.filterBy) {
        this.state.filterBy = filterBy;
        this._applyFilter();
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
        <div class="filter-actions">
          <button class="btn btn-sm" data-action="toggle-view" title="Toggle View Mode">
            ${this.state.viewMode === "table" ? "☰" : "▦"}
          </button>
        </div>
      </div>
      <div class="sort-filter-bar">
        <span class="sort-label">Sort by:</span>
        <button class="btn btn-xs ${this.state.sortBy === "name" ? "active" : ""}" data-action="sort" data-sort-by="name">Name</button>
        <button class="btn btn-xs ${this.state.sortBy === "size" ? "active" : ""}" data-action="sort" data-sort-by="size">Size</button>
        <button class="btn btn-xs ${this.state.sortBy === "date" ? "active" : ""}" data-action="sort" data-sort-by="date">Date</button>
        <span class="filter-label">Filter:</span>
        <button class="btn btn-xs ${this.state.filterBy === "all" ? "active" : ""}" data-action="filter" data-filter-by="all">All</button>
        <button class="btn btn-xs ${this.state.filterBy === "loaded" ? "active" : ""}" data-action="filter" data-filter-by="loaded">Loaded</button>
        <button class="btn btn-xs ${this.state.filterBy === "unloaded" ? "active" : ""}" data-action="filter" data-filter-by="unloaded">Unloaded</button>
      </div>
    `;
  }
}

window.ModelFilters = ModelFilters;
