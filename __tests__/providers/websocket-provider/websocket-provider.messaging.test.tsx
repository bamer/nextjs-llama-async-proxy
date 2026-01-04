/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { render, screen, act } from "@testing-library/react";
import { WebSocketProvider } from "@/providers/websocket-provider";
import { setupMocks, mockMetrics, mockLogs, mockModelConfig, mockModels, TestComponent } from "./websocket-provider.test-utils";

jest.mock("@/lib/websocket-client");
jest.mock("@/lib/store");

describe("WebSocketProvider Messaging", () => {
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

  it("handles connect event correctly", () => {
    render(
      <WebSocketProvider>
        <TestComponent />
      </WebSocketProvider>
    );

    const connectHandler = websocketServer.on.mock.calls.find((call: unknown[]) => call[0] === "connect")?.[1];

    act(() => {
      connectHandler();
    });

    expect(screen.getByTestId("isConnected")).toHaveTextContent("true");
    expect(screen.getByTestId("connectionState")).toHaveTextContent("connected");
    expect(websocketServer.requestMetrics).toHaveBeenCalledTimes(1);
    expect(websocketServer.requestLogs).toHaveBeenCalledTimes(1);
  });

  it("handles disconnect event correctly", () => {
    render(
      <WebSocketProvider>
        <TestComponent />
      </WebSocketProvider>
    );

    const connectHandler = websocketServer.on.mock.calls.find((call: unknown[]) => call[0] === "connect")?.[1];
    const disconnectHandler = websocketServer.on.mock.calls.find((call: unknown[]) => call[0] === "disconnect")?.[1];

    act(() => {
      connectHandler();
    });

    expect(screen.getByTestId("isConnected")).toHaveTextContent("true");

    act(() => {
      disconnectHandler();
    });

    expect(screen.getByTestId("isConnected")).toHaveTextContent("false");
    expect(screen.getByTestId("connectionState")).toHaveTextContent("disconnected");
  });

  it("handles connect_error event correctly", () => {
    render(
      <WebSocketProvider>
        <TestComponent />
      </WebSocketProvider>
    );

    const errorHandler = websocketServer.on.mock.calls.find((call: unknown[]) => call[0] === "connect_error")?.[1];

    act(() => {
      errorHandler(new Error("Connection failed"));
    });

    expect(screen.getByTestId("connectionState")).toHaveTextContent("error");
  });

  it("handles metrics message with batching", () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: unknown[]) => call[0] === "message")?.[1];

    const metricsMessage = { type: "metrics", data: mockMetrics };

    act(() => {
      messageHandler(metricsMessage);
    });

    expect(mockStore.setMetrics).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockStore.setMetrics).toHaveBeenCalledWith(mockMetrics);
  });

  it("handles logs message with batching", () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: unknown[]) => call[0] === "message")?.[1];

    const logsMessage = { type: "logs", data: mockLogs };

    act(() => {
      messageHandler(logsMessage);
    });

    expect(mockStore.addLog).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockStore.addLog).toHaveBeenCalledTimes(mockLogs.length);
    mockLogs.forEach((log) => {
      expect(mockStore.addLog).toHaveBeenCalledWith(log);
    });
  });

  it("handles single log message with shorter debounce", () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: unknown[]) => call[0] === "message")?.[1];

    const logMessage = { type: "log", data: mockLogs[0] };

    act(() => {
      messageHandler(logMessage);
    });

    expect(mockStore.addLog).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockStore.addLog).toHaveBeenCalledWith(mockLogs[0]);
  });

  it("handles status message with model updates", () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: unknown[]) => call[0] === "message")?.[1];

    const statusMessage = {
      type: "status",
      data: {
        models: [mockModelConfig],
        status: "running"
      }
    };

    act(() => {
      messageHandler(statusMessage);
    });

    expect(mockStore.updateModel).toHaveBeenCalledWith("1", { status: "running" });
  });

  it("handles models_loaded message", () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: unknown[]) => call[0] === "message")?.[1];

    const modelsLoadedMessage = { type: "models_loaded", data: mockModels };

    act(() => {
      messageHandler(modelsLoadedMessage);
    });

    expect(mockStore.setModels).toHaveBeenCalledWith(mockModels);
  });

  it("ignores models message from llama-server", () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: unknown[]) => call[0] === "message")?.[1];

    const modelsMessage = { type: "models", data: mockModels };

    act(() => {
      messageHandler(modelsMessage);
    });

    expect(mockStore.setModels).not.toHaveBeenCalled();
  });

  it("handles llamaServerStatus message", () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: unknown[]) => call[0] === "message")?.[1];

    const statusMessage = { type: "llamaServerStatus", data: { status: "running" } };

    act(() => {
      messageHandler(statusMessage);
    });

    expect(mockStore.setLlamaServerStatus).toHaveBeenCalledWith({ status: "running" });
  });

  it("handles modelStopped message", () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: unknown[]) => call[0] === "message")?.[1];

    const stoppedMessage = { type: "modelStopped", data: { modelId: "1" } };

    act(() => {
      messageHandler(stoppedMessage);
    });

    // No specific action expected, just logged
  });

  it("handles models_imported message", () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: unknown[]) => call[0] === "message")?.[1];

    const importedMessage = { type: "models_imported", data: mockModels };

    act(() => {
      messageHandler(importedMessage);
    });

    expect(mockStore.setModels).toHaveBeenCalledWith(mockModels);
  });

  it("batches multiple metrics correctly", () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const messageHandler = websocketServer.on.mock.calls.find((call: unknown[]) => call[0] === "message")?.[1];

    const metrics1 = { ...mockMetrics, cpuUsage: 30 };
    const metrics2 = { ...mockMetrics, cpuUsage: 50 };

    act(() => {
      messageHandler({ type: "metrics", data: metrics1 });
      messageHandler({ type: "metrics", data: metrics2 });
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockStore.setMetrics).toHaveBeenCalledTimes(1);
    expect(mockStore.setMetrics).toHaveBeenCalledWith(metrics2); // Last one wins
  });

  it("does not request models on connect (uses database)", () => {
    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    );

    const connectHandler = websocketServer.on.mock.calls.find((call: unknown[]) => call[0] === "connect")?.[1];

    act(() => {
      connectHandler();
    });

    expect(websocketServer.requestModels).not.toHaveBeenCalled();
  });
});
