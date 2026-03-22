import Axios from "axios";
import {
  buildMemoryStorage,
  setupCache,
  type AxiosCacheInstance,
} from "axios-cache-interceptor";

import { getDifyBaseConfig } from "./config.js";
import { createLogger } from "../../utils/logger.js";

let difyHttpClient: AxiosCacheInstance | undefined;
const logger = createLogger("dify-http-client");

export function getDifyHttpClient(): AxiosCacheInstance {
  if (difyHttpClient) {
    return difyHttpClient;
  }

  const { baseUrl, timeoutMs, cacheTtlMs } = getDifyBaseConfig();

  logger.info("Initializing Dify HTTP client", {
    baseUrl,
    timeoutMs,
    cacheTtlMs,
  });

  difyHttpClient = setupCache(
    Axios.create({
      baseURL: baseUrl,
      timeout: timeoutMs,
      maxBodyLength: Number.POSITIVE_INFINITY,
      maxContentLength: Number.POSITIVE_INFINITY,
      headers: {
        Accept: "application/json",
      },
    }),
    {
      location: "server",
      storage: buildMemoryStorage(),
      interpretHeader: false,
      methods: ["get", "head"],
      ttl: cacheTtlMs,
    }
  );

  return difyHttpClient;
}
