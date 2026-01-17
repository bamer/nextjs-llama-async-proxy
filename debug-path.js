import { resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename);

const DB_PATH = resolve(__dirname, "data", "llama-dashboard.db");

console.log("__dirname:", __dirname);
console.log("DB_PATH:", DB_PATH);
console.log("exists:", require("fs").existsSync(DB_PATH));
