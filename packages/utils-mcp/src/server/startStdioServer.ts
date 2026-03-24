import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createServer } from "./createServer.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("stdio-server");

export async function startStdioServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();

  logger.debug("Connecting stdio server transport");
  await server.connect(transport);
  logger.info("Stdio server transport connected");
}
