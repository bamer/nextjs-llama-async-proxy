# Debug System Documentation

## Overview
The Logging System Debug Suite provides comprehensive monitoring and testing capabilities for the real-time logging system. It includes tools for performance profiling, event tracing, Socket.IO monitoring, and automated integration testing.

## Components

### 1. Debug Tools (`debug-tools.js`)
Core debugging utilities with:
- **TimingProfiler**: Measures execution times and performance
- **EventTracer**: Tracks all system events with context
- **SocketMonitor**: Monitors Socket.IO connections and traffic
- **LoggingMonitor**: Tracks logging pipeline efficiency

### 2. Integration Tests (`integration-tests.js`)
Automated tests covering the complete logging flow:
- Client logger initialization
- Console method overrides
- Socket.IO connection
- Log transmission
- Server broadcast
- UI updates
- Performance benchmarks

### 3. Debug Dashboard (`debug-dashboard.js`)
Real-time monitoring interface accessible via Ctrl+Shift+D

## Usage

### Development Mode
Debug system auto-enables on localhost/127.0.0.1:
```javascript
// Access debug system globally
window.DEBUG_SYSTEM

// Manual control
window.DEBUG_SYSTEM.enable()
window.DEBUG_SYSTEM.disable()
window.DEBUG_SYSTEM.clear()

// Get reports
window.DEBUG_SYSTEM.getReport()
```

### Production Mode
Minimal debug system for critical monitoring only.

### Running Tests
Add `?run-tests` to any page URL to run integration tests:
```
http://localhost:3000/logs?run-tests
```

### Debug Dashboard
Press `Ctrl+Shift+D` to toggle the real-time monitoring dashboard.

## API Reference

### TimingProfiler
```javascript
const profiler = new TimingProfiler();

profiler.mark('start_operation');
profiler.mark('end_operation');
profiler.measure('start_operation', 'end_operation', 'operation_duration');

const report = profiler.getReport();
profiler.reset();
```

### EventTracer
```javascript
const tracer = new EventTracer(maxEvents = 1000);

tracer.trace('event_name', data, context);
const events = tracer.getEvents(filter);
const recentEvents = tracer.getEventsSince(timestamp);

tracer.clear();
tracer.enable();
tracer.disable();
```

### SocketMonitor
```javascript
const monitor = new SocketMonitor();

monitor.logEvent('send', 'event_name', data);
const stats = monitor.getStats();
const recentEvents = monitor.getRecentEvents(count);

monitor.clear();
```

### LoggingMonitor
```javascript
const monitor = new LoggingMonitor();

monitor.logCapture('source', data);
monitor.logBroadcast('event', data);
monitor.logDisplay('component', latency);
monitor.logLoss('reason', data);

const stats = monitor.getStats();
```

## Performance Guidelines

### Memory Usage
- EventTracer: Limited to 1000 events by default
- Automatic cleanup prevents memory leaks
- Production mode minimizes memory footprint

### CPU Usage
- Minimal impact in production mode
- Debug operations are O(1) or O(log n)
- UI updates throttled to prevent blocking

### Network Usage
- Debug data stays local (no external transmission)
- Socket monitoring adds minimal overhead

## Troubleshooting

### Debug System Not Loading
1. Check browser console for script loading errors
2. Verify script order in `index.html`
3. Ensure `defer` attributes are present

### Tests Failing
1. Run tests individually: `window.LoggingSystemIntegrationTests`
2. Check debug dashboard for system status
3. Verify Socket.IO connection

### Performance Issues
1. Use debug dashboard to identify bottlenecks
2. Check timing reports for slow operations
3. Disable debug system temporarily: `window.DEBUG_SYSTEM.disable()`

## Build Process

### Development
```bash
pnpm dev
```

### Production
```bash
node build-prod.js
cp public/index.prod.html public/index.html
cp public/js/utils/debug-tools.prod.js public/js/utils/debug-tools.js
```

### Testing
```bash
# Run integration tests
curl "http://localhost:3000/logs?run-tests"

# Manual testing
open "http://localhost:3000/logs?run-tests"
```

## Keyboard Shortcuts

- `Ctrl+Shift+D`: Toggle debug dashboard
- `Ctrl+D`: Navigate to dashboard
- `Ctrl+M`: Navigate to models
- `Ctrl+L`: Navigate to logs

## Integration Points

### ClientLogger
Automatically integrates with debug system for comprehensive logging monitoring.

### Socket.IO
All socket events are automatically monitored and traced.

### State Manager
State changes are tracked and performance is measured.

### Router
Navigation events are logged for debugging page transitions.

## Best Practices

1. **Enable debug in development only** - Use the auto-detection
2. **Clear debug data regularly** - Prevents memory buildup
3. **Use timing marks for performance** - Identify slow operations
4. **Monitor Socket.IO stats** - Detect connection issues early
5. **Run tests after changes** - Ensure system integrity

## Error Handling

The debug system includes comprehensive error handling:
- Failed operations are logged but don't break the main application
- Graceful degradation when debug tools are unavailable
- Error recovery mechanisms for network issues

## Security Considerations

- Debug data never leaves the client
- No sensitive information is logged
- Production mode minimizes attack surface
- Debug tools are development-only features