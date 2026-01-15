/**
 * Layout Components - Event-Driven DOM Updates
 * Fixed: Header is now full width, separate from main content
 */

class Layout extends Component {
  /**
   * Renders the main application layout with sidebar, header, and main content containers.
   * @returns {string} HTML string representing the layout structure.
   */
  render() {
    return `
      <div class="app-container" id="app-layout">
        <div id="sidebar-container"></div>
        <div id="header-container"></div>
        <div id="main-content-container"></div>
      </div>
    `;
  }

  /**
   * Called after the component is mounted to the DOM.
   * Initializes and mounts the Sidebar, Header, and MainContent components.
   */
  onMount() {
    // Mount Sidebar
    const sidebarContainer = document.getElementById("sidebar-container");
    if (sidebarContainer) {
      const sidebar = new Sidebar({});
      sidebar.mount(sidebarContainer);
      this._sidebar = sidebar;
    }

    // Mount Header (separate, full width)
    const headerContainer = document.getElementById("header-container");
    if (headerContainer) {
      const header = new Header({});
      header.mount(headerContainer);
      this._header = header;
    }

    // Mount MainContent
    const mainContainer = document.getElementById("main-content-container");
    if (mainContainer) {
      const mainContent = new MainContent({});
      mainContent.mount(mainContainer);
      this._mainContent = mainContent;
    }
  }

  /**
   * Destroys all mounted child components to prevent memory leaks.
   */
  destroy() {
    this._sidebar?.destroy();
    this._header?.destroy();
    this._mainContent?.destroy();
  }
}






