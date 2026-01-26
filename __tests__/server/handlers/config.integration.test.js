import { registerConfigHandlers } from "../../../server/handlers/config.js";

describe("Config domain handlers integration (registrar)", () => {
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

  test("config:get responds with empty config", () => {
    const mockSocket = makeMockSocket();
    const mockIo = { emit: jest.fn() };
    registerConfigHandlers(mockSocket, mockIo, {});
    const cb = jest.fn();
    mockSocket._emitHandler!("config:get", {}, cb);
    expect(cb).toHaveBeenCalled();
  });

  test("config:update broadcasts config:updated and acknowledges", () => {
    const mockSocket = makeMockSocket();
    const mockIo = { emit: jest.fn() };
    registerConfigHandlers(mockSocket, mockIo, {});
    const cb = jest.fn();
    mockSocket._emitHandler!("config:update", { config: { a: 1 } }, cb);
    expect(cb).toHaveBeenCalled();
    expect(mockIo.emit).toHaveBeenCalledWith("config:updated", { config: { a: 1 } });
  });
});
