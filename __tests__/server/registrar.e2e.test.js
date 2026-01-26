import { registerAllDomainHandlers } from "../../server/handlers/index.js";

describe("Registrar end-to-end wiring (domain handlers)", () => {
  function makeMockSocket(mockIo) {
    // store event handlers
    const handlers = {};
    return {
      on: (event, cb) => {
        handlers[event] = cb;
      },
      getHandler: (event) => handlers[event],
      emit: jest.fn(),
      // Ensure domain broadcasters can emit via io.emit as well as socket.broadcast.emit
      broadcast: {
        emit: (event, data) => {
          if (mockIo && typeof mockIo.emit === "function") {
            mockIo.emit(event, data);
          }
        },
      },
    };
  }

  test("domain handlers register and respond for models:list", async () => {
    const mockIo = { emit: jest.fn() };
    const sock = makeMockSocket(mockIo);
    // initialize with dummy metrics initializer
    const initFn = () => {};
    registerAllDomainHandlers(sock, { emit: mockIo.emit }, {}, initFn);

    // Ensure models:list listener exists
    const modelsListHandler = sock.getHandler("models:list");
    expect(typeof modelsListHandler).toBe("function");

    // Simulate a models:list call
    const cb = jest.fn();
    modelsListHandler({ some: "payload" }, cb);
    expect(cb).toHaveBeenCalled();
    // Expect a standard response shape
    const resp = cb.mock.calls[0][0];
    expect(resp).toHaveProperty("success", true);
    expect(resp).toHaveProperty("data");

    // Ensure models:updated broadcast occurred via socket.broadcast.emit
    expect(mockIo.emit).toHaveBeenCalledWith("models:updated", expect.any(Object));
  });
});
