/**
 * Models Page - Displays models in a table
 */

class ModelsPage extends Component {
  constructor(props) {
    super(props);
    console.log("[MODELS] ModelsPage constructor called");
    console.log("[MODELS] Props models count:", props.models?.length);

    this.state = {
      models: props.models || [],
      filters: { status: "all", search: "", favoritesOnly: false },
      sortBy: "name",
      sortOrder: "asc",
    };
    this.lastSearchValue = "";
    this.lastStatusValue = "all";
    this.controller = props.controller;
    this.debouncedSearch = AppUtils.debounce(this._handleSearch.bind(this), 300);
    console.log("[MODELS] State initialized with", this.state.models.length, "models");
  }

  didUpdate() {
    const searchInput = this._el?.querySelector("[data-field=\"search\"]");
    if (searchInput && document.activeElement === searchInput) {
      // Focus already restored by browser
    } else if (searchInput && this.lastSearchValue === this.state.filters.search) {
      searchInput.focus();
      searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
    }
  }

  shouldUpdate(newProps) {
    return true;
  }

  render() {
    console.log("[MODELS] ModelsPage.render() called");
    const filtered = this._getFiltered();
    console.log("[MODELS] Filtered models:", filtered.length);

    const routerStatus = stateManager.get("routerStatus");
    const routerRunning = routerStatus?.status === "running";
    const config = stateManager.get("config") || {};
    const port = routerStatus?.port || config.port || 8080;

    const statusBadge = (status) => {
      const cls =
        status === "loaded" || status === "running"
          ? "success"
          : status === "loading"
            ? "warning"
            : status === "error"
              ? "danger"
              : "default";
      return Component.h("span", { className: `badge ${cls}` }, status);
    };

    const actionBtn = (m) => {
      if (m.status === "loaded" || m.status === "running") {
        return Component.h(
          "button",
          { className: "btn btn-sm", "data-action": "unload" },
          "Unload"
        );
      }
      if (m.status === "loading") {
        return Component.h("button", { className: "btn btn-sm", disabled: true }, "Loading...");
      }
      return Component.h(
        "button",
        { className: "btn btn-sm btn-primary", "data-action": "load" },
        "Load"
      );
    };

    const iconMap = {
      name: "📄",
      status: "⭐",
      type: "🏗️",
      params: "#️⃣",
      quantization: "📊",
      ctx_size: "📈",
      embedding_size: "📐",
      block_count: "🧱",
      head_count: "👁️",
      file_size: "💾",
      actions: "⚙️",
    };

    const sortableHeader = (label, field) => {
      const isSorted = this.state.sortBy === field;
      const icon = iconMap[field] || "";
      const indicator =
        isSorted && this.state.sortOrder === "asc"
          ? " ↑"
          : isSorted && this.state.sortOrder === "desc"
            ? " ↓"
            : "";
      return Component.h(
        "th",
        {
          "data-sort": field,
          className: isSorted ? "sorted" : "",
          style: "cursor: pointer; user-select: none;",
        },
        icon ? `${icon} ${label}${indicator}` : `${label}${indicator}`
      );
    };

    const rows = filtered.map((m) =>
      Component.h(ModelTableRow, {
        key: m.name,
        model: m,
        statusBadge,
        actionBtn,
        fmtCtx: this._fmtCtx,
        fmtBytes: this._fmtBytes,
        onFavoriteToggle: (isFavorite) => this.controller?.handleToggleFavorite(m.name, isFavorite),
        onTest: () => this.controller?.handleTestModel(m.name),
      })
    );

    const result = Component.h(
      "div",
      { className: "models-page" },
      Component.h(
        "div",
        { className: "toolbar" },
        Component.h(
          "button",
          { className: "btn btn-primary", "data-action": "scan" },
          "Scan Filesystem"
        ),
        Component.h("button", { className: "btn", "data-action": "cleanup" }, "Cleanup"),
        routerRunning
          ? Component.h(
            "span",
            { className: "router-indicator success" },
            `Router Active (${port})`
          )
          : Component.h(
            "span",
            { className: "router-indicator default" },
            `Router Not Running (Port: ${port})`
          )
      ),
      Component.h(ModelFilters, {
        search: this.state.filters.search,
        status: this.state.filters.status,
        favoritesOnly: this.state.filters.favoritesOnly,
        onSearchChange: (val) => {
          this.lastSearchValue = val;
          this.debouncedSearch(val);
        },
        onStatusChange: (val) => {
          this.lastStatusValue = val;
          this.setState({ filters: { ...this.state.filters, status: val } });
        },
        onFavoritesToggle: (val) => {
          this.setState({ filters: { ...this.state.filters, favoritesOnly: val } });
        },
      }),
      Component.h(
        "table",
        { className: "models-table" },
        Component.h(
          "thead",
          {},
          Component.h(
            "tr",
            {},
            sortableHeader("Name", "name"),
            sortableHeader("Status", "status"),
            sortableHeader("Arch", "type"),
            sortableHeader("Params", "params"),
            sortableHeader("Quant", "quantization"),
            sortableHeader("Ctx", "ctx_size"),
            sortableHeader("Embed", "embedding_size"),
            sortableHeader("Blocks", "block_count"),
            sortableHeader("Heads", "head_count"),
            sortableHeader("Size", "file_size"),
            sortableHeader("Actions", "status")
          )
        ),
        Component.h("tbody", { className: "models-tbody" }, rows)
      )
    );

    console.log("[MODELS] ModelsPage.render() - END");
    return result;
  }

  _getFiltered() {
    console.log("[MODELS] _getFiltered() called");
    let ms = this.state.models || [];
    console.log("[MODELS] Starting with", ms.length, "models");

    if (this.state.filters.status !== "all") {
      console.log("[MODELS] Filtering by status:", this.state.filters.status);
      ms = ms.filter((m) => m.status === this.state.filters.status);
    }

    if (this.state.filters.favoritesOnly) {
      console.log("[MODELS] Filtering favorites only");
      ms = ms.filter((m) => m.favorite === 1 || m.favorite === true);
    }

    if (this.state.filters.search) {
      console.log("[MODELS] Filtering by search:", this.state.filters.search);
      ms = ms.filter((m) => m.name.toLowerCase().includes(this.state.filters.search.toLowerCase()));
    }

    // Apply sorting with favorites first
    ms = this._sortModels(ms);

    console.log("[MODELS] Returning", ms.length, "filtered models");
    return ms;
  }

  _handleSearch(value) {
    console.log("[DEBUG] ModelsPage _handleSearch:", value);
    this.setState({ filters: { ...this.state.filters, search: value } });
  }

  _sortModels(models) {
    const { sortBy, sortOrder } = this.state;
    const sorted = [...models].sort((a, b) => {
      // Favorites always sort first regardless of other sort field
      if (sortBy !== "favorite") {
        const aFav = a.favorite === 1 || a.favorite === true ? 0 : 1;
        const bFav = b.favorite === 1 || b.favorite === true ? 0 : 1;
        if (aFav !== bFav) return aFav - bFav;
      }

      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "file_size") {
        aVal = aVal || 0;
        bVal = bVal || 0;
      } else if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }

  _fmtCtx(v) {
    const result = !v || v === 0 ? "-" : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v);
    return result;
  }

  _fmtBytes(v) {
    if (!v) return "-";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(v) / Math.log(k));
    const result = `${parseFloat((v / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    return result;
  }

  getEventMap() {
    console.log("[MODELS] getEventMap() called");
    return {
      "click [data-sort]": (e) => {
        const field = e.target.closest("[data-sort]").dataset.sort;
        console.log("[MODELS] Sort header clicked:", field);
        const newOrder =
          this.state.sortBy === field && this.state.sortOrder === "asc" ? "desc" : "asc";
        this.setState({ sortBy: field, sortOrder: newOrder });
      },
      "click [data-action=scan]": () => this.controller?.handleScan(),
      "click [data-action=cleanup]": () => this.controller?.handleCleanup(),
    };
  }
}

window.ModelsPage = ModelsPage;
