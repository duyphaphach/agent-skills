import path from "node:path";
import { isAxiosError } from "axios";
import type { Method } from "axios";
import type { CacheRequestConfig } from "axios-cache-interceptor";
import { merge } from "merge-anything";

import { readBinaryFile } from "../../utils/localFiles.js";
import {
  defaultRetrieveKnowledgeModel,
  getDifyApiKey,
  type DifyService,
} from "./config.js";
import { getDifyHttpClient } from "./httpClient.js";
import type {
  RetrieveKnowledgeChunksArgs,
  RetrievalModelArgs,
} from "./schemas.js";
import { createLogger, summarizeForLog } from "../../utils/logger.js";

type QueryValue = string | number | boolean | null | undefined;

type QueryParams = Record<string, QueryValue>;

type RequestBody = FormData | Record<string, unknown> | undefined;

type RequestArgs = {
  method: Method;
  path: string;
  query?: QueryParams;
  body?: RequestBody;
  service: DifyService;
  cache?: {
    enabled: boolean;
  };
};

const logger = createLogger("dify-request");

export function createRetrieveKnowledgeModel(
  retrievalModel: RetrieveKnowledgeChunksArgs["retrieval_model"],
  metadataFilteringConditions: RetrieveKnowledgeChunksArgs["metadata_filtering_conditions"]
): RetrievalModelArgs {
  const compatibilityOverrides = metadataFilteringConditions
    ? {
        metadata_filtering_conditions: metadataFilteringConditions,
      }
    : {};

  return merge(
    defaultRetrieveKnowledgeModel,
    retrievalModel ?? {},
    compatibilityOverrides
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeResponsePayload(status: number, payload: unknown): unknown {
  if (status === 204) {
    return {
      result: "success",
      status,
    };
  }

  if (payload === undefined || payload === null || payload === "") {
    return {
      result: "success",
      status,
    };
  }

  if (typeof payload !== "string") {
    return payload;
  }

  if (!payload.trim()) {
    return {
      result: "success",
      status,
    };
  }

  try {
    return JSON.parse(payload) as unknown;
  } catch {
    return {
      raw: payload,
    };
  }
}

function getCacheConfig(args: RequestArgs): CacheRequestConfig["cache"] {
  if (args.method.toUpperCase() !== "GET" || args.cache?.enabled === false) {
    return false;
  }

  return {
    vary: ["authorization"],
  };
}

function toErrorMessage(payload: unknown): string {
  if (isRecord(payload)) {
    const code =
      typeof payload.code === "string" && payload.code.length > 0
        ? payload.code
        : undefined;
    const message =
      typeof payload.message === "string" && payload.message.length > 0
        ? payload.message
        : typeof payload.error === "string" && payload.error.length > 0
          ? payload.error
          : undefined;

    if (code && message) {
      return `${code}: ${message}`;
    }

    if (message) {
      return message;
    }
  }

  return JSON.stringify(payload);
}

export async function readFileAsBlob(filePath: string): Promise<{
  blob: Blob;
  filename: string;
}> {
  const buffer = await readBinaryFile(filePath, "Dify upload file");
  const bytes = new Uint8Array(buffer.byteLength);

  bytes.set(buffer);

  return {
    blob: new Blob([bytes]),
    filename: path.basename(filePath),
  };
}

export async function requestJson<T>(args: RequestArgs): Promise<T> {
  const httpClient = getDifyHttpClient();
  const bodyType =
    args.body instanceof FormData
      ? "form-data"
      : args.body
        ? "json"
        : "none";

  logger.debug("Sending Dify request", {
    service: args.service,
    method: String(args.method).toUpperCase(),
    path: args.path,
    query: args.query,
    bodyType,
    cacheEnabled: getCacheConfig(args) !== false,
  }, { pretty: true });

  try {
    const response = await httpClient.request<T>({
      method: args.method,
      url: args.path,
      params: args.query,
      data: args.body,
      headers: {
        Authorization: `Bearer ${getDifyApiKey(args.service)}`,
      },
      cache: getCacheConfig(args),
    });

    logger.debug("Dify request completed", {
      service: args.service,
      method: String(args.method).toUpperCase(),
      path: args.path,
      status: response.status,
      rawResponse: response.data,
    }, { pretty: true, summarize: false });

    return normalizeResponsePayload(response.status, response.data) as T;
  } catch (error) {
    if (!isAxiosError(error)) {
      logger.error("Non-Axios Dify request failure", {
        service: args.service,
        method: String(args.method).toUpperCase(),
        path: args.path,
        error: summarizeForLog(error),
      });
      throw error;
    }

    const status = error.response?.status ?? "unknown";
    const payload = normalizeResponsePayload(
      error.response?.status ?? 0,
      error.response?.data
    );

    logger.error("Dify request failed", {
      service: args.service,
      method: String(args.method).toUpperCase(),
      path: args.path,
      status,
      rawResponse: error.response?.data,
      payload: summarizeForLog(payload),
    }, { pretty: true, summarize: false });

    throw new Error(
      `Dify ${args.service} API request failed (${status}) for ${String(
        args.method
      ).toUpperCase()} ${args.path}: ${toErrorMessage(payload)}`
    );
  }
}

export function createMultipartData(
  data: Record<string, unknown> | undefined
): FormData {
  const formData = new FormData();

  if (data && Object.keys(data).length > 0) {
    formData.append("data", JSON.stringify(data));
  }

  return formData;
}

export function encodePathSegment(value: string): string {
  return encodeURIComponent(value);
}
