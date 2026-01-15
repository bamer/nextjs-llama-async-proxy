class MainContent extends Component {
  /**
   * Renders the main content area with a loading screen placeholder.
   * @returns {string} HTML string representing the main content container.
   */
  render() {
    return `
      <main class="main-content">
        <div id="page-content" class="page-content">
          <div class="loading-screen">
            <div class="spinner"></div>
            <p>Connecting...</p>
          </div>
        </div>
      </main>
    `;
  }
}
window.MainContent = MainContent;
