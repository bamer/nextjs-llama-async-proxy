/**
 * MainContent Component
 * Wrapper for page content area
 */

class MainContent extends Component {
  render() {
    return `
      <main class="main-content" role="main" aria-label="Main content">
        <div id="page-content" class="page-content">
          <div class="loading-screen" role="status" aria-live="polite" aria-label="Loading connection status">
            <div class="spinner" aria-hidden="true"></div>
            <p>Connecting...</p>
          </div>
        </div>
      </main>
    `;
  }
}

window.MainContent = MainContent;
