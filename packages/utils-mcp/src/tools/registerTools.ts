import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerFileFormatTools } from "./file-formats/registerTools.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("tool-registry");

export function registerTools(server: McpServer): void {
  logger.debug("Registering file format tools");
  registerFileFormatTools(server);
  logger.info("Tool registration complete");
}
