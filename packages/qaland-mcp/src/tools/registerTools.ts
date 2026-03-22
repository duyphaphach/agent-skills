import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerDifyTools } from "./dify/registerTools.js";
import { registerFileFormatTools } from "./file-formats/registerTools.js";
import { registerQalandQaTools } from "./qaland-qa/registerTools.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("tool-registry");

export function registerTools(server: McpServer): void {
  logger.debug("Registering file format tools");
  registerFileFormatTools(server);
  logger.debug("Registering Dify tools");
  registerDifyTools(server);
  logger.debug("Registering QALand QA tools");
  registerQalandQaTools(server);
  logger.info("Tool registration complete");
}
