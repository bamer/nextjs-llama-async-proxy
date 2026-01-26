import { registerLogsHandlers } from "../../../server/handlers/logs.js";

describe("Logs domain handlers integration (registrar)", () => {
  function makeMockSocket() {
    const handlers = {};
    return {
      on: (event, cb) => { handlers[event] = cb; },
      _emitHandler: (event, ...args) => {
        if (typeof handlers[event] === 'function') return handlers[event](...args);
      },
      _handlers: handlers,
    };
  }

  test("logs:get returns empty logs", () => {
    const mockSocket = makeMockSocket();
    const mockIo = { emit: jest.fn() };
    registerLogsHandlers(mockSocket, mockIo, {});
    const cb = jest.fn();
    mockSocket._emitHandler!("logs:get", {}, cb);
    expect(cb).toHaveBeenCalled();
  });

  test("logs:emit broadcasts logs:entry via io.emit", () => {
    const mockSocket = makeMockSocket();
    const mockIo = { emit: jest.fn() };
    registerLogsHandlers(mockSocket, mockIo, {});
    mockSocket._emitHandler!("logs:emit", { level: "info", message: "hi" });
    expect(mockIo.emit).toHaveBeenCalledWith("logs:entry", expect.any(Object));
  });
});
