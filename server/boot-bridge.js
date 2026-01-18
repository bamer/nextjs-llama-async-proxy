// Router bridge - maps router:* events to llama:* handlers

let _bridgeInstalled = false;

function initBridge(io) {
  if (_bridgeInstalled) return;
  _bridgeInstalled = true;

  io.on("connection", (socket) => {
    const mapping = {
      "router:status": "llama:status",
      "router:start": "llama:start",
      "router:stop": "llama:stop",
      "router:restart": "llama:restart",
    };

    Object.keys(mapping).forEach((routerEvent) => {
      socket.on(routerEvent, (req, ack) => {
        const targetEvent = mapping[routerEvent];
        socket.emit(targetEvent, req, (resp) => {
          if (typeof ack === "function") {
            ack(resp);
          }
          if (resp && resp.success) {
            io.emit("router:status", resp.data || {});
            io.emit("llama:status", resp.data || {});
          }
        });
      });
    });
  });
}

export { initBridge };
