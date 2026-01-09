const io = require("socket.io-client");
const fs = require("fs");

const socket = io("http://localhost:3000/llamaproxws");

socket.on("connect", () => {
  console.log("Connected:", socket.id);

  // Test presets:add-model event
  socket.emit(
    "presets:add-model",
    { filename: "default", modelName: "*", config: { ctxSize: 5555 } },
    (response) => {
      console.log("presets:add-model response:", JSON.stringify(response, null, 2));

      // Read the config file to verify
      setTimeout(() => {
        const content = fs.readFileSync("./config/default.ini", "utf-8");
        console.log("\nConfig file after save:\n", content);
        process.exit(0);
      }, 500);
    }
  );
});

socket.on("connect_error", (err) => {
  console.error("Connection error:", err.message);
  process.exit(1);
});
