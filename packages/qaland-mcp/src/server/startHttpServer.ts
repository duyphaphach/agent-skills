import express from "express";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { createServer } from "./createServer.js";
import { HttpStatusCode, JsonRpcErrorCode } from "./httpConstants.js";
import { createLogger, summarizeForLog } from "../utils/logger.js";

export type StartHttpServerArgs = {
  host: string;
  port: number;
  allowedHosts?: string[];
};

const logger = createLogger("http-server");

export async function startHttpServer({
  host,
  port,
  allowedHosts,
}: StartHttpServerArgs): Promise<void> {
  const app = createMcpExpressApp({
    host,
    allowedHosts: allowedHosts?.length ? allowedHosts : undefined,
  });

  app.use(express.json({ limit: "100mb" }));

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      mode: "http",
      transport: "streamable-http",
      storage: "local-filesystem",
    });
  });

  app.post("/mcp", async (req, res) => {
    logger.debug("Handling HTTP MCP request", {
      method: req.method,
      path: req.path,
      bodyKeys:
        req.body && typeof req.body === "object" && !Array.isArray(req.body)
          ? Object.keys(req.body)
          : undefined,
    });

    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      logger.error("Error handling HTTP MCP request", {
        error: summarizeForLog(error),
      });

      if (!res.headersSent) {
        res.status(HttpStatusCode.InternalServerError).json({
          jsonrpc: "2.0",
          error: {
            code: JsonRpcErrorCode.InternalError,
            message: "Internal server error",
          },
          id: null,
        });
      }
    } finally {
      logger.debug("Closing HTTP MCP transport");
      await transport.close();
      await server.close();
    }
  });

  app.get("/mcp", (_req, res) => {
    res.status(HttpStatusCode.MethodNotAllowed).json({
      jsonrpc: "2.0",
      error: {
        code: JsonRpcErrorCode.ServerError,
        message: "Method not allowed. Use POST for stateless streamable HTTP.",
      },
      id: null,
    });
  });

  app.delete("/mcp", (_req, res) => {
    res.status(HttpStatusCode.MethodNotAllowed).json({
      jsonrpc: "2.0",
      error: {
        code: JsonRpcErrorCode.ServerError,
        message: "Method not allowed. This server runs in stateless HTTP mode.",
      },
      id: null,
    });
  });

  await new Promise<void>((resolve, reject) => {
    const listener = app.listen(port, host, (error?: Error) => {
      if (error) {
        reject(error);
        return;
      }

      logger.info("HTTP server listening", {
        mcpUrl: `http://${host}:${port}/mcp`,
        healthUrl: `http://${host}:${port}/health`,
      });
      resolve();
    });

    listener.on("error", reject);
  });
}
