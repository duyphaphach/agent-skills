import process from "node:process";

import type {
  MetadataFilteringConditionsArgs,
  RetrievalModelArgs,
} from "../dify/schemas.js";

export type QalandQaKnowledgeConfig = {
  projectKnowledgeDatasetId: string;
  testCaseExampleDatasetId: string;
  messageRetrievalQuery: string;
  smsRetrievalQuery: string;
  emailRetrievalQuery: string;
  testCaseExampleRetrievalQuery: string;
};

export const qalandQaExampleMetadataFilters: MetadataFilteringConditionsArgs = {
  logical_operator: "and",
  conditions: [
    {
      comparison_operator: "is",
      name: "category",
      value: "EXAMPLE",
    },
  ],
};

export const qalandQaProjectRetrievalModel: RetrievalModelArgs = {
  reranking_mode: "weighted_score",
  top_k: 5,
  weights: {
    weight_type: "customized",
    keyword_setting: {
      keyword_weight: 0.8,
    },
    vector_setting: {
      embedding_model_name: "gemini-embedding-001",
      embedding_provider_name:
        "langgenius/openai_api_compatible/openai_api_compatible",
      vector_weight: 0.2,
    },
  },
};

export const qalandQaExampleRetrievalModel: RetrievalModelArgs = {
  reranking_mode: "weighted_score",
  top_k: 5,
  weights: {
    weight_type: "customized",
    keyword_setting: {
      keyword_weight: 0.3,
    },
    vector_setting: {
      embedding_model_name: "gemini-embedding-001",
      embedding_provider_name: "langgenius/gemini/google",
      vector_weight: 0.7,
    },
  },
};

function getRequiredEnv(envName: string): string {
  const value = process.env[envName]?.trim();

  if (!value) {
    throw new Error(
      `Missing ${envName}. Set it in packages/qaland-mcp/.env to use the qaland_* QA tools.`
    );
  }

  return value;
}

export function getQalandQaKnowledgeConfig(): QalandQaKnowledgeConfig {
  return {
    projectKnowledgeDatasetId: getRequiredEnv(
      "QALAND_QA_PROJECT_KNOWLEDGE_DATASET_ID"
    ),
    testCaseExampleDatasetId: getRequiredEnv(
      "QALAND_QA_TEST_CASE_EXAMPLE_DATASET_ID"
    ),
    messageRetrievalQuery:
      process.env.QALAND_QA_MESSAGE_RETRIEVAL_QUERY?.trim() || "Message",
    smsRetrievalQuery:
      process.env.QALAND_QA_SMS_RETRIEVAL_QUERY?.trim() || "SMS",
    emailRetrievalQuery:
      process.env.QALAND_QA_EMAIL_RETRIEVAL_QUERY?.trim() || "Email",
    testCaseExampleRetrievalQuery:
      process.env.QALAND_QA_TEST_CASE_EXAMPLE_RETRIEVAL_QUERY?.trim() ||
      "Example Test Cases",
  };
}
