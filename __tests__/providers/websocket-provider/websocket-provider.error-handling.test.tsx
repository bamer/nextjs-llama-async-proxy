/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { render, screen, act } from "@testing-library/react";
import { WebSocketProvider } from "@/providers/websocket-provider";
import { setupMocks, mockMetrics, mockLogs, TestComponent } from "./websocket-provider.test-utils";

jest.mock("@/lib/websocket-client");
jest.mock("@/lib/store");

describe("WebSocketProvider Error Handling", () => {
  let mockStore: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    const mocks = setupMocks();
    mockStore = mocks.mockStore;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const { websocketServer } = require("@/lib/websocket-client");

  it("sendMessage does not send when not connected", () => {
    const { useWebSocketContext } = require("@/providers/websocket-provider");
    const TestConsumer = () => {
      const context = useWebSocketContext();
      return (
        <button onClick={() => context.sendMessage("test", { data: "test" })}>
          Send Message
        </button>
      );
    };

    render(
      <WebSocketProvider>
        <TestConsumer />
      </WebSocketProvider>
    );

    const sendButton = screen.getByText("Send Message");

    act(() => {
      sendButton.click();
    });

    expect(websocketServer.sendMessage).not.toHaveBeenCalled();
  });

  it("sendMessage sends when connected", () => {
    const { useWebSocketContext } = require("@/providers/websocket-provider");
    const TestConsumer = () => {
      const context = useWebSocketContext();
      return (
        <button onClick={() => context.sendMessage("test", { data: "test" })}>
          Send Message
        </button>
      );
    };

    render(
      <WebSocketProvider>
        <TestConsumer />
      </WebSocketProvider>
    );

    const connectHandler = websocketServer.on.mock.calls.find((call: unknown[]) => call[0] === "connect")?.[1];

    act(() => {
      connectHandler();
    });

    const sendButton = screen.getByText("Send Message");

    act(() => {
      sendButton.click();
    });

    expect(websocketServer.sendMessage).toHaveBeenCalledWith("test", { data: "test" });
  });

  it("flushes batched data on unmount", () => {
    const { unmount } = render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: unknown[]) => call[0] === "message")?.[1];

    // Add some batched data
    act(() => {
      messageHandler({ type: "metrics", data: mockMetrics });
      messageHandler({ type: "logs", data: mockLogs });
    });

    act(() => {
      unmount();
    });

    expect(mockStore.setMetrics).toHaveBeenCalledWith(mockMetrics);
    expect(mockStore.addLog).toHaveBeenCalledTimes(mockLogs.length);
  });

  it("cleans up timers on unmount", () => {
    const { unmount } = render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    act(() => {
      unmount();
    });

    expect(websocketServer.off).toHaveBeenCalledWith("connect", expect.any(Function));
    expect(websocketServer.off).toHaveBeenCalledWith("disconnect", expect.any(Function));
    expect(websocketServer.off).toHaveBeenCalledWith("connect_error", expect.any(Function));
    expect(websocketServer.off).toHaveBeenCalledWith("message", expect.any(Function));
  });

  it("useWebSocketContext throws error outside provider", () => {
    const { useWebSocketContext } = require("@/providers/websocket-provider");
    const TestComponent = () => {
      useWebSocketContext();
      return <div>Test</div>;
    };

    expect(() => render(<TestComponent />)).toThrow(
      "useWebSocketContext must be used within WebSocketProvider"
    );
  });

  it("handles malformed message gracefully", () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: unknown[]) => call[0] === "message")?.[1];

    act(() => {
      messageHandler({});
      messageHandler({ type: "unknown" });
      messageHandler(null);
      messageHandler(undefined);
    });

    // Should not throw or call any store methods
    expect(mockStore.setMetrics).not.toHaveBeenCalled();
    expect(mockStore.addLog).not.toHaveBeenCalled();
  });

  it("handles save_model, update_model, delete_model, load_config messages", () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: unknown[]) => call[0] === "message")?.[1];

    act(() => {
      messageHandler({ type: "save_model", data: {} });
      messageHandler({ type: "update_model", data: {} });
      messageHandler({ type: "delete_model", data: {} });
      messageHandler({ type: "load_config", data: {} });
    });

    // These should be logged as warnings but not throw
  });

  it("handles save_config message", () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: unknown[]) => call[0] === "message")?.[1];

    act(() => {
      messageHandler({ type: "save_config", data: { config: "data" } });
    });

    // Should be logged but no specific action
  });

  it("handles config_saved message", () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: unknown[]) => call[0] === "message")?.[1];

    act(() => {
      messageHandler({ type: "config_saved", success: true, data: { config: "data" } });
    });

    // Should be logged but no specific action
  });

  it("handles model_saved, model_updated, model_deleted messages", () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: unknown[]) => call[0] === "message")?.[1];

    act(() => {
      messageHandler({ type: "model_saved", data: {} });
      messageHandler({ type: "model_updated", data: {} });
      messageHandler({ type: "model_deleted", data: {} });
    });

    // Should be logged but no specific action
  });

  it("handles config_loaded message", () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: unknown[]) => call[0] === "message")?.[1];

    act(() => {
      messageHandler({ type: "config_loaded", data: {} });
    });

    // Should be logged but no specific action
  });
});
