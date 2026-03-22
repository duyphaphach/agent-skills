import process from "node:process";

import { parsePositiveInteger, trimTrailingSlashes } from "../../utils/env.js";
import type { RetrievalModelArgs } from "./schemas.js";

export type DifyService = "knowledge" | "workflow";

type DifyBaseConfig = {
  baseUrl: string;
  timeoutMs: number;
  cacheTtlMs: number;
};

export const defaultRetrieveKnowledgeModel: RetrievalModelArgs = {
  search_method: "hybrid_search",
  reranking_enable: false,
  score_threshold_enabled: false,
  top_k: 6,
  weights: {
    weight_type: null,
    keyword_setting: {
      keyword_weight: 0.9,
    },
    vector_setting: {
      vector_weight: 0.1,
    },
  },
};

export function getDifyApiKey(service: DifyService): string {
  const sharedApiKey = process.env.DIFY_API_KEY;

  if (service === "workflow") {
    const workflowApiKey = process.env.DIFY_WORKFLOW_API_KEY ?? sharedApiKey;

    if (!workflowApiKey) {
      throw new Error(
        "Missing Dify workflow API key. Set DIFY_WORKFLOW_API_KEY or DIFY_API_KEY in packages/qaland-mcp/.env."
      );
    }

    return workflowApiKey;
  }

  const knowledgeApiKey = process.env.DIFY_KNOWLEDGE_API_KEY ?? sharedApiKey;

  if (!knowledgeApiKey) {
    throw new Error(
      "Missing Dify knowledge API key. Set DIFY_KNOWLEDGE_API_KEY or DIFY_API_KEY in packages/qaland-mcp/.env."
    );
  }

  return knowledgeApiKey;
}

export function getDifyBaseConfig(): DifyBaseConfig {
  const baseUrl = trimTrailingSlashes(
    process.env.DIFY_BASE_URL ?? "https://api.dify.ai/v1"
  );

  if (!baseUrl) {
    throw new Error("DIFY_BASE_URL must not be empty.");
  }

  return {
    baseUrl,
    timeoutMs: parsePositiveInteger(
      process.env.DIFY_TIMEOUT_MS,
      "120000",
      "DIFY_TIMEOUT_MS"
    ),
    cacheTtlMs: parsePositiveInteger(
      process.env.DIFY_CACHE_TTL_MS,
      "30000",
      "DIFY_CACHE_TTL_MS"
    ),
  };
}
