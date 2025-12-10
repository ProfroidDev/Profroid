/**
 * Logger utility for structured logging
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  error?: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  private log(level: LogLevel, message: string, data?: any, error?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(data && { data }),
      ...(error && { error: error.message || error }),
    };

    const logMessage = this.formatLog(entry);

    switch (level) {
      case "debug":
        if (this.isDevelopment) console.debug(logMessage);
        break;
      case "info":
        console.info(logMessage);
        break;
      case "warn":
        console.warn(logMessage);
        break;
      case "error":
        console.error(logMessage);
        break;
    }
  }

  private formatLog(entry: LogEntry): string {
    let message = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;

    if (entry.data) {
      message += ` | ${JSON.stringify(entry.data)}`;
    }

    if (entry.error) {
      message += ` | Error: ${entry.error}`;
    }

    return message;
  }

  debug(message: string, data?: any): void {
    this.log("debug", message, data);
  }

  info(message: string, data?: any): void {
    this.log("info", message, data);
  }

  warn(message: string, data?: any): void {
    this.log("warn", message, data);
  }

  error(message: string, error?: any, data?: any): void {
    this.log("error", message, data, error);
  }
}

export default new Logger();
