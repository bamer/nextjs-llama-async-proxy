/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { render, screen } from "@testing-library/react";
import { WebSocketProvider } from "@/providers/websocket-provider";
import { setupMocks, mockMetrics, TestComponent } from "./websocket-provider.test-utils";

jest.mock("@/lib/websocket-client");
jest.mock("@/lib/store");

describe("WebSocketProvider Rendering", () => {
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

  it("renders children correctly", () => {
    render(
      <WebSocketProvider>
        <div>Test Child</div>
      </WebSocketProvider>
    );
    expect(screen.getByText("Test Child")).toBeInTheDocument();
  });

  it("connects to WebSocket on mount", () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const { websocketServer } = require("@/lib/websocket-client");
    expect(websocketServer.connect).toHaveBeenCalledTimes(1);
  });

  it("sets up event listeners on mount", () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const { websocketServer } = require("@/lib/websocket-client");
    expect(websocketServer.on).toHaveBeenCalledWith("connect", expect.any(Function));
    expect(websocketServer.on).toHaveBeenCalledWith("disconnect", expect.any(Function));
    expect(websocketServer.on).toHaveBeenCalledWith("connect_error", expect.any(Function));
    expect(websocketServer.on).toHaveBeenCalledWith("message", expect.any(Function));
  });

  it("provides context value with correct methods", () => {
    const { useWebSocketContext } = require("@/providers/websocket-provider");
    const TestConsumer = () => {
      const context = useWebSocketContext();
      expect(typeof context.sendMessage).toBe("function");
      expect(typeof context.requestMetrics).toBe("function");
      expect(typeof context.requestLogs).toBe("function");
      expect(typeof context.requestModels).toBe("function");
      expect(typeof context.startModel).toBe("function");
      expect(typeof context.stopModel).toBe("function");
      expect(typeof context.unloadModel).toBe("function");
      expect(typeof context.on).toBe("function");
      expect(typeof context.off).toBe("function");
      expect(context.isConnected).toBe(false);
      expect(context.connectionState).toBe("disconnected");
      return <div>Test passed</div>;
    };

    render(
      <WebSocketProvider>
        <TestConsumer />
      </WebSocketProvider>
    );

    expect(screen.getByText("Test passed")).toBeInTheDocument();
  });

  it("provides all required context methods", () => {
    const { useWebSocketContext } = require("@/providers/websocket-provider");
    const TestConsumer = () => {
      const context = useWebSocketContext();
      return (
        <div>
          <span data-testid="methods">
            {typeof context.sendMessage === "function" &&
             typeof context.requestMetrics === "function" &&
             typeof context.requestLogs === "function" &&
             typeof context.requestModels === "function" &&
             typeof context.startModel === "function" &&
             typeof context.stopModel === "function" &&
             typeof context.unloadModel === "function" &&
             typeof context.on === "function" &&
             typeof context.off === "function" ? "all-present" : "missing"}
          </span>
        </div>
      );
    };

    render(
      <WebSocketProvider>
        <TestConsumer />
      </WebSocketProvider>
    );

    expect(screen.getByTestId("methods")).toHaveTextContent("all-present");
  });

  it("initial state is disconnected", () => {
    render(
      <WebSocketProvider>
        <TestComponent />
      </WebSocketProvider>
    );

    expect(screen.getByTestId("isConnected")).toHaveTextContent("false");
    expect(screen.getByTestId("connectionState")).toHaveTextContent("disconnected");
  });
});
