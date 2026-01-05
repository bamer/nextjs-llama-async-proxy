/**
 * Layout Component - Main Application Layout
 */

class Layout extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sidebarOpen: true
    };
  }

  render() {
    return Component.h('div', { className: 'app-container' },
      Component.h(Sidebar, { open: this.state.sidebarOpen }),
      Component.h(MainContent, {})
    );
  }
}

/**
 * Sidebar Component
 */
class Sidebar extends Component {
  constructor(props) {
    super(props);
    this.state = { open: props.open !== false };
  }

  render() {
    return Component.h('aside', { className: `sidebar ${this.state.open ? 'open' : ''}` },
      Component.h('div', { className: 'sidebar-header' },
        Component.h('div', { className: 'sidebar-logo' },
          Component.h('span', {}, '🦙'),
          Component.h('span', {}, 'Llama Proxy')
        )
      ),
      Component.h('nav', { className: 'sidebar-nav' },
        Component.h('div', { className: 'nav-section' },
          Component.h('span', { className: 'nav-section-title' }, 'Main'),
          Component.h('a', {
            href: '/',
            className: 'nav-link',
            'data-page': 'dashboard'
          }, '📊 Dashboard'),
          Component.h('a', {
            href: '/models',
            className: 'nav-link',
            'data-page': 'models'
          }, '📁 Models'),
          Component.h('a', {
            href: '/monitoring',
            className: 'nav-link',
            'data-page': 'monitoring'
          }, '📈 Monitoring'),
          Component.h('a', {
            href: '/logs',
            className: 'nav-link',
            'data-page': 'logs'
          }, '📋 Logs')
        ),
        Component.h('div', { className: 'nav-section' },
          Component.h('span', { className: 'nav-section-title' }, 'Settings'),
          Component.h('a', {
            href: '/configuration',
            className: 'nav-link',
            'data-page': 'configuration'
          }, '⚙️ Configuration'),
          Component.h('a', {
            href: '/settings',
            className: 'nav-link',
            'data-page': 'settings'
          }, '🔧 Settings')
        ),
        Component.h('div', { className: 'nav-section' },
          Component.h('span', { className: 'nav-section-title' }, 'Server'),
          Component.h('div', { className: 'server-connection-status', id: 'connection-status' },
            Component.h('span', { className: 'status-dot disconnected' }),
            Component.h('span', { className: 'status-text' }, 'Disconnected')
          )
        )
      )
    );
  }

  getEventMap() {
    return {
      'click [data-page]': 'handlePageClick'
    };
  }

  handlePageClick(event) {
    event.preventDefault();
    const page = event.currentTarget.dataset.page;
    window.router.navigate('/' + (page === 'dashboard' ? '' : page));
  }
}

/**
 * Main Content Component
 */
class MainContent extends Component {
  render() {
    return Component.h('main', { className: 'main-content' },
      Component.h(Header, {}),
      Component.h('div', { id: 'page-content', className: 'page-content' },
        Component.h('div', { className: 'loading-screen' },
          Component.h('div', { className: 'loading-spinner' }),
          Component.h('p', {}, 'Connecting to server...')
        )
      )
    );
  }
}

// Header title updater - registers immediately
function setupHeaderTitleUpdater() {
  const updateTitleFromPath = () => {
    const path = window.location.pathname;
    const titles = {
      '/': 'Dashboard',
      '/dashboard': 'Dashboard',
      '/models': 'Models',
      '/monitoring': 'Monitoring',
      '/logs': 'Logs',
      '/configuration': 'Configuration',
      '/settings': 'Settings'
    };
    const title = titles[path] || 'Dashboard';
    const headerElement = document.querySelector('.page-header');
    if (headerElement) {
      const headerTitle = headerElement.querySelector('h1');
      if (headerTitle && headerTitle.textContent !== title) {
        headerTitle.textContent = title;
      }
    }
  };

  // Initial update
  updateTitleFromPath();

  // Listen for navigation events
  window.addEventListener('popstate', updateTitleFromPath);
  window.addEventListener('routechange', updateTitleFromPath);
}

// Setup immediately
setupHeaderTitleUpdater();

/**
 * Header Component
 */
class Header extends Component {
  constructor(props) {
    super(props);
    this.state = {
      serverOnline: false
    };
  }

  render() {
    return Component.h('header', { className: 'page-header' },
      Component.h('div', { className: 'header-left' },
        Component.h('button', {
          className: 'btn btn-icon sidebar-toggle',
          'data-action': 'toggle-sidebar'
        }, '☰'),
        Component.h('h1', {}, 'Dashboard')
      ),
      Component.h('div', { className: 'header-right' },
        Component.h('div', { className: 'connection-indicator', id: 'header-connection' },
          this.state.serverOnline ?
            Component.h('span', { className: 'online-badge' }, '● Online') :
            Component.h('span', { className: 'offline-badge' }, '● Offline')
        )
      )
    );
  }

  getEventMap() {
    return {
      'click [data-action="toggle-sidebar"]': 'handleToggleSidebar'
    };
  }

  handleToggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('open');
    }
  }

  componentDidMount() {
    stateManager.subscribe('connectionStatus', (status) => {
      this.setState({ serverOnline: status === 'connected' });
      this.updateConnectionUI(status);
    });
  }

  updateConnectionUI(status) {
    const statusEl = document.getElementById('connection-status');
    const headerEl = document.getElementById('header-connection');
    const dot = statusEl?.querySelector('.status-dot');
    const text = statusEl?.querySelector('.status-text');

    if (dot) {
      dot.className = 'status-dot ' + (status === 'connected' ? 'connected' : 'disconnected');
    }
    if (text) {
      text.textContent = status === 'connected' ? 'Connected' : 'Disconnected';
    }
    if (headerEl) {
      headerEl.innerHTML = status === 'connected' ?
        '<span class="online-badge">● Online</span>' :
        '<span class="offline-badge">● Offline</span>';
    }
  }
}

// Export
window.Layout = Layout;
window.Sidebar = Sidebar;
window.MainContent = MainContent;
window.Header = Header;
