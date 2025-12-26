type LogLevel = "info" | "warn" | "error" | "debug";

export class Logger {
  private prefix: string;

  constructor(name: string = "LlamaService") {
    this.prefix = `[${name}]`;
  }

  log(level: LogLevel, message: string): void {
    const timestamp = new Date().toISOString();
    const fullMessage = `[${timestamp}] ${this.prefix} ${message}`;

    switch (level) {
      case "info":
        console.log(fullMessage);
        break;
      case "warn":
        console.warn(fullMessage);
        break;
      case "error":
        console.error(fullMessage);
        break;
      case "debug":
        console.debug(fullMessage);
        break;
    }
  }

  info(message: string): void {
    this.log("info", message);
  }

  warn(message: string): void {
    this.log("warn", message);
  }

  error(message: string): void {
    this.log("error", message);
  }

  debug(message: string): void {
    this.log("debug", message);
  }
}
