import { registerMetricsHandlers } from "../../../server/handlers/metrics.js";

describe("Metrics domain handlers integration (registrar)", () => {
  function makeMockSocket() {
    const handlers = {};
    return {
      on: (event, cb) => {
        handlers[event] = cb;
      },
      _emitHandler: (event, ...args) => {
        if (typeof handlers[event] === 'function') {
          return handlers[event](...args);
        }
      },
      $internal: handlers,
    };
  }

  test("registers handlers and responds to metrics:get", async () => {
    const mockSocket = makeMockSocket();
    const mockIo = { emit: jest.fn() };
    registerMetricsHandlers(mockSocket, mockIo, {});

    // Simulate metrics:get
    const callback = jest.fn();
    mockSocket._emitHandler?.("metrics:get", {}, callback);
    // Expect callback to be called with a valid response
    expect(callback).toHaveBeenCalled();
    const arg = callback.mock.calls[0][0];
    expect(arg).toHaveProperty("success", true);
    expect(arg).toHaveProperty("data");
  });

  test("subscribe responds with acknowledgement", () => {
    const mockSocket = makeMockSocket();
    const mockIo = { emit: jest.fn() };
    registerMetricsHandlers(mockSocket, mockIo, {});
    const cb = jest.fn();
    mockSocket._emitHandler?.("metrics:subscribe", {}, cb);
    expect(cb).toHaveBeenCalled();
  });

  test("publish triggers metrics:updated broadcast", () => {
    const mockSocket = makeMockSocket();
    const mockIo = { emit: jest.fn() };
    registerMetricsHandlers(mockSocket, mockIo, {});
    // Trigger publish listener
    mockSocket._emitHandler?.("metrics:publish");
    expect(mockIo.emit).toHaveBeenCalledWith("metrics:updated", expect.any(Object));
  });
});
