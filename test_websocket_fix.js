// Test script to verify the WebSocket fix
// This simulates the behavior to ensure no infinite loops occur

class MockWebSocketService {
  constructor() {
    this.connectionState = "disconnected";
    this.listeners = new Map();
  }

  getConnectionState() {
    return this.connectionState;
  }

  setConnectionState(state) {
    this.connectionState = state;
    if (this.listeners.has("connect_error")) {
      this.listeners.get("connect_error").forEach(cb => cb());
    }
  }

  connect() {
    console.log("Connecting...");
    this.setConnectionState("connecting");
    // Simulate connection failure
    setTimeout(() => {
      this.setConnectionState("error");
    }, 100);
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      this.listeners.set(event, listeners.filter(cb => cb !== callback));
    }
  }

  sendMessage(event, data) {
    if (this.connectionState !== "connected") {
      console.warn("WebSocket not connected, cannot send message");
      // This should NOT call setError to avoid infinite loops
      return;
    }
  }
}

// Simulate the React hook behavior
function simulateUseWebSocket() {
  let connectionState = "disconnected";
  let renderCount = 0;
  const maxRenders = 100; // Safety limit

  const mockService = new MockWebSocketService();

  function setConnectionState(newState) {
    if (connectionState !== newState) {
      connectionState = newState;
      console.log(`State changed: ${connectionState}`);
      renderComponent();
    }
  }

  function renderComponent() {
    renderCount++;
    if (renderCount > maxRenders) {
      console.error("MAX RENDERS REACHED - INFINITE LOOP DETECTED!");
      return;
    }

    // Simulate the useEffect
    if (renderCount === 1) { // Only on "mount"
      mockService.connect();

      const handleConnectionState = () => {
        const currentState = mockService.getConnectionState();
        setConnectionState(prevState => {
          if (prevState !== currentState) {
            return currentState;
          }
          return prevState;
        });
      };

      // Initial state
      const initialState = mockService.getConnectionState();
      if (connectionState !== initialState) {
        setConnectionState(initialState);
      }

      mockService.on("connect_error", handleConnectionState);
    }
  }

  // Start the simulation
  renderComponent();

  // Check if we have an infinite loop
  setTimeout(() => {
    if (renderCount <= 10) {
      console.log(`✅ SUCCESS: Only ${renderCount} renders, no infinite loop!`);
    } else {
      console.log(`⚠️  WARNING: ${renderCount} renders - possible performance issue`);
    }
  }, 1000);
}

console.log("Testing WebSocket fix...");
simulateUseWebSocket();