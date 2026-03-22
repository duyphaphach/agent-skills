import "dotenv/config";

import process from "node:process";

import { startHttpServer } from "./server/startHttpServer.js";
import { startStdioServer } from "./server/startStdioServer.js";
import { createLogger, summarizeForLog } from "./utils/logger.js";

const logger = createLogger("entrypoint");

function getArgValue(flag: string): string | undefined {
  const index = process.argv.findIndex((arg) => arg === flag);

  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

function isHttpMode(): boolean {
  return (
    process.argv.includes("--http") ||
    process.env.MCP_TRANSPORT === "http" ||
    process.env.MCP_MODE === "http"
  );
}

async function startHttp(): Promise<void> {
  const host = process.env.HOST ?? getArgValue("--host") ?? "127.0.0.1";
  const portValue = process.env.PORT ?? getArgValue("--port") ?? "8220";
  const port = Number.parseInt(portValue, 10);
  const allowedHosts = process.env.ALLOWED_HOSTS
    ?.split(",")
    .map((hostValue) => hostValue.trim())
    .filter(Boolean);

  if (Number.isNaN(port)) {
    throw new Error(`Invalid port value: ${portValue}`);
  }

  logger.info("Starting HTTP transport", {
    host,
    port,
    allowedHosts,
  });

  await startHttpServer({
    host,
    port,
    allowedHosts,
  });
}

async function main(): Promise<void> {
  logger.debug("Process startup", {
    argv: process.argv.slice(2),
    transport: process.env.MCP_TRANSPORT,
    mode: process.env.MCP_MODE,
    logLevel: process.env.QALAND_MCP_LOG_LEVEL,
  });

  if (isHttpMode()) {
    await startHttp();
    return;
  }

  logger.info("Starting stdio transport");
  await startStdioServer();
}

process.on("SIGINT", () => {
  logger.info("Received SIGINT, shutting down");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("Received SIGTERM, shutting down");
  process.exit(0);
});

void main().catch((error) => {
  logger.error("Fatal startup error", {
    error: summarizeForLog(error),
  });
  process.exit(1);
});
