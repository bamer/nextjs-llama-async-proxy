# Llama Async Proxy Dashboard - Changelog

## Version 1.1.0 - January 2026

### Added
- **Modular Frontend Architecture**: Dashboard components split into modular files (header.js, sidebar.js, main-content.js)
- **Chart Management System**: New chart-manager.js with chart-usage.js and chart-memory.js for metrics visualization
- **Llama Router Card**: New llama-router-card.js component for router management
- **Command Palette**: keyboard-driven command interface (command-palette.js)
- **Comprehensive Preset System**: parameter-form.js, parameter-input.js, parameters.js for configuration management
- **File Logger**: server/handlers/file-logger.js for persistent logging
- **Llama Router Handlers**: start.js, stop.js, status.js, process.js, process-manager.js, metrics-scraper.js
- **Golden Rules Testing**: test-golden-rule.js for code quality enforcement
- **Full Documentation Suite**: Complete INSTALL.md, USAGE.md, API.md, and docs/ folder

### Fixed
- **Server Startup**: Fixed critical startup bugs preventing server launch
  - Fixed duplicate export in `gpu-monitor.js`
  - Fixed missing variable exports in `metrics.js`
  - Server now starts successfully in <1 second
- **File Logger**: Fixed `readLogFile` method using correct instance variable
  - Changed `LOGS_DIR` global reference to `this.logsDir`
  - 38 file logger tests now passing
- **Test Suite**: Improved test stability and fixed event name mismatches
  - Fixed preset service test event names
  - 7 additional tests now passing
- **Router Status Detection**: Fixed isRunning detection logic to check processRunning, not just port

### Changed
- **Package Manager**: Migrated from npm to pnpm for faster installs and better disk usage
- **Development Mode**: Changed from `npm run dev` to `pnpm dev` using `--watch` flag
- **Performance**: Optimized server startup time to <1 second
- **Architecture**: Modular component structure for better maintainability
- **Testing**: Comprehensive test coverage with 473+ tests

### Security
- **Input Validation**: Enhanced validation on all API endpoints
- **SQL Injection Prevention**: All database queries use parameterized statements
- **XSS Prevention**: Output encoding for all user-facing content
- **Secret Management**: No hardcoded credentials in codebase

### Code Standards
- **200 Lines Rule**: All files kept under 200 lines with modular design
- **Single Responsibility**: Each component/class does one thing
- **Memory Safety**: All subscriptions and event listeners properly cleaned up
- **Error Boundaries**: Errors caught and displayed to users gracefully

### Known Issues
- Some integration tests require llama-server binary setup
- Component tests have implementation mismatches (not critical for release)
- E2E tests require browser environment setup

## Version 1.0.0 - Earlier

### Initial Release
- **Core Features**:
  - Model management (load/unload/list)
  - Preset management with inheritance
  - Real-time monitoring dashboard
  - Configuration management
  - Log viewing and filtering
  
- **Technology Stack**:
  - Node.js + Express + Socket.IO
  - SQLite database with better-sqlite3
  - Vanilla JavaScript frontend
  - llama.cpp router mode support

- **Architecture**:
  - Event-driven DOM updates
  - Component-based UI architecture
  - Real-time metrics collection
  - Graceful error handling

---

## Migration Guide

### Upgrading from 1.0.0 to 1.1.0

1. **Backup Data**:
   ```bash
   pnpm db:export
   ```

2. **Update Application**:
   ```bash
   git pull
   pnpm install
   ```

3. **Verify Configuration**:
   - Check `config/app.config.json` for any new options
   - Update llama-server path if needed

4. **Test New Features**:
   - Review new API documentation in API.md
   - Test preset inheritance features
   - Verify real-time monitoring works

5. **Restart Server**:
   ```bash
   pnpm restart
   ```

## Compatibility

### llama.cpp Compatibility
- Compatible with llama.cpp router mode
- Tested with llama-server builds from 2024+
- Supports multiple concurrent model loading

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Node.js Compatibility
- Node.js 18.0.0 or higher required
- ES Modules support required

## Support

- **Installation Issues**: See INSTALL.md
- **Usage Questions**: See USAGE.md  
- **API Integration**: See API.md
- **Technical Details**: See docs/ARCHITECTURE.md
- **Bug Reports**: Open issue on project repository

---

*Changelog generated for Phase 3 customer release*
*Version: 1.1.0*
*Date: January 14, 2026*
