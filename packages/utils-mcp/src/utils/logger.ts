import process from "node:process";
import pino from "pino";

export type LogLevel = "debug" | "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

type LogWriteOptions = {
  pretty?: boolean;
  summarize?: boolean;
};

type Logger = {
  debug: (message: string, fields?: LogFields, options?: LogWriteOptions) => void;
  info: (message: string, fields?: LogFields, options?: LogWriteOptions) => void;
  warn: (message: string, fields?: LogFields, options?: LogWriteOptions) => void;
  error: (message: string, fields?: LogFields, options?: LogWriteOptions) => void;
};

const defaultLogLevel: LogLevel = "warn";

function isLogLevel(value: string): value is LogLevel {
  return value === "debug" || value === "info" || value === "warn" || value === "error";
}

function getConfiguredLogLevel(): LogLevel {
  const rawValue = process.env.UTILS_MCP_LOG_LEVEL?.trim().toLowerCase();

  if (!rawValue) {
    return defaultLogLevel;
  }

  if (isLogLevel(rawValue)) {
    return rawValue;
  }

  return defaultLogLevel;
}

function safeJsonStringify(value: unknown, space?: number): string {
  const seen = new WeakSet<object>();

  return JSON.stringify(value, (_key, currentValue) => {
    if (typeof currentValue === "object" && currentValue !== null) {
      if (seen.has(currentValue)) {
        return "[Circular]";
      }

      seen.add(currentValue);
    }

    return currentValue;
  }, space);
}

export function summarizeForLog(value: unknown, depth = 0): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: depth === 0 ? value.stack : undefined,
    };
  }

  if (typeof value === "string") {
    return value.length <= 200 ? value : `${value.slice(0, 200)}... (${value.length} chars)`;
  }

  if (Array.isArray(value)) {
    const summarizedItems = value
      .slice(0, 10)
      .map((item) => summarizeForLog(item, depth + 1));

    if (value.length > 10) {
      summarizedItems.push(`... (${value.length - 10} more items)`);
    }

    return summarizedItems;
  }

  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);

    if (depth >= 3) {
      return `[Object with ${entries.length} keys]`;
    }

    const summarizedEntries = entries
      .slice(0, 20)
      .map(([key, currentValue]) => [key, summarizeForLog(currentValue, depth + 1)]);

    if (entries.length > 20) {
      summarizedEntries.push(["__truncated__", `${entries.length - 20} more keys`]);
    }

    return Object.fromEntries(summarizedEntries);
  }

  return value;
}

const rootLogger = pino(
  {
    name: "utils-mcp",
    level: getConfiguredLogLevel(),
    base: undefined,
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.transport({
    target: "pino-pretty",
    options: {
      colorize: process.stderr.isTTY && process.env.NO_COLOR === undefined,
      destination: 2,
      ignore: "pid,hostname",
      messageFormat: "[{name}] [{scope}] {msg}",
      translateTime: "SYS:standard",
    },
  })
);

function logWithLevel(
  logger: pino.Logger,
  level: LogLevel,
  message: string,
  fields?: LogFields,
  options?: LogWriteOptions
): void {
  const preparedFields =
    fields && options?.summarize === false ? fields : fields ? summarizeForLog(fields) : undefined;

  if (preparedFields && options?.pretty) {
    logger[level](`${message}\n${safeJsonStringify(preparedFields, 2)}`);
    return;
  }

  if (preparedFields) {
    logger[level](preparedFields, message);
    return;
  }

  logger[level](message);
}

export function createLogger(scope: string): Logger {
  const scopedLogger = rootLogger.child({ scope });

  return {
    debug: (message, fields, options) =>
      logWithLevel(scopedLogger, "debug", message, fields, options),
    info: (message, fields, options) =>
      logWithLevel(scopedLogger, "info", message, fields, options),
    warn: (message, fields, options) =>
      logWithLevel(scopedLogger, "warn", message, fields, options),
    error: (message, fields, options) =>
      logWithLevel(scopedLogger, "error", message, fields, options),
  };
}
