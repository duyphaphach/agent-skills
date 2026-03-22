import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerTools } from "../tools/registerTools.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("server");

export function createServer(): McpServer {
  logger.debug("Creating MCP server instance");
  const server = new McpServer(
    {
      name: "QALand MCP",
      version: "1.0.0",
    },
    {
      capabilities: {
        logging: {},
      },
    }
  );

  registerTools(server);
  logger.debug("MCP server instance ready");

  return server;
}
