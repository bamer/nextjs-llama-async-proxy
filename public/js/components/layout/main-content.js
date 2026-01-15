class MainContent extends Component {
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
