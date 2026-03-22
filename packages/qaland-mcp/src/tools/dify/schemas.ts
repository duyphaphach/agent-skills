import { z } from "zod";

const identifierSchema = z
  .string()
  .min(1)
  .describe("Dify identifier for the target resource.");

const localFilePathSchema = z
  .string()
  .min(1)
  .describe(
    "Local filesystem path on the MCP server host. The file is uploaded from the machine running this server."
  );

const paginationPageSchema = z
  .number()
  .int()
  .min(1)
  .optional()
  .describe("Page number for pagination. Defaults to 1.");

const paginationLimitSchema = z
  .number()
  .int()
  .min(1)
  .max(100)
  .optional()
  .describe("Maximum number of items to return. Dify currently allows up to 100.");

const jsonObjectSchema = z
  .record(z.unknown())
  .describe("Arbitrary JSON object passed through to Dify.");

const processRuleSchema = z
  .object({
    mode: z
      .enum(["automatic", "custom", "hierarchical"])
      .optional()
      .describe("Document processing mode."),
    rules: jsonObjectSchema.optional().describe("Processing rule details."),
  })
  .passthrough()
  .describe("Document processing rules.");

const summaryIndexSettingSchema = z
  .object({
    enable: z.boolean().optional(),
    model_name: z.string().min(1).optional(),
    model_provider_name: z.string().min(1).optional(),
    summary_prompt: z.string().min(1).optional(),
  })
  .passthrough()
  .describe("Summary auto-generation settings.");

const retrievalKeywordSettingSchema = z
  .object({
    keyword_weight: z.number().optional(),
  })
  .passthrough()
  .describe("Keyword retrieval weighting.");

const retrievalVectorSettingSchema = z
  .object({
    vector_weight: z.number().optional(),
    embedding_model_name: z.string().min(1).optional(),
    embedding_provider_name: z.string().min(1).optional(),
  })
  .passthrough()
  .describe("Vector retrieval weighting and optional embedding hints.");

const retrievalWeightsObjectSchema = z
  .object({
    weight_type: z.string().nullable().optional(),
    keyword_setting: retrievalKeywordSettingSchema.optional(),
    vector_setting: retrievalVectorSettingSchema.optional(),
  })
  .passthrough()
  .describe("Weighted retrieval configuration.");

const retrievalWeightsSchema = z
  .union([z.number(), retrievalWeightsObjectSchema])
  .describe(
    "Retrieval weights. Dify documents this as a numeric semantic weight, while weighted-score flows may use a nested object."
  );

const metadataFilterValueSchema = z.union([z.string().min(1), z.number(), z.null()]);

const metadataConditionSchema = z
  .object({
    comparison_operator: z
      .string()
      .min(1)
      .describe("Metadata comparison operator, for example `is`."),
    name: z.string().min(1).describe("Metadata field name."),
    value: metadataFilterValueSchema.describe("Metadata value to match."),
  })
  .passthrough()
  .describe("Single metadata filter condition.");

export const metadataFilteringConditionsSchema = z
  .object({
    logical_operator: z
      .enum(["and", "or"])
      .default("and")
      .describe("Logical operator applied across metadata conditions."),
    conditions: z
      .array(metadataConditionSchema)
      .min(1)
      .describe("Metadata filter conditions."),
  })
  .passthrough()
  .describe("Workflow-style metadata filters for Dify knowledge retrieval.");

export type MetadataFilteringConditionsArgs = z.infer<
  typeof metadataFilteringConditionsSchema
>;

const retrievalModelSchema = z
  .object({
    search_method: z.string().min(1).optional(),
    reranking_enable: z.boolean().optional(),
    reranking_mode: z.string().nullable().optional(),
    reranking_model: jsonObjectSchema.optional(),
    weights: retrievalWeightsSchema.optional(),
    top_k: z.number().int().min(1).optional(),
    score_threshold_enabled: z.boolean().optional(),
    score_threshold: z.number().nullable().optional(),
    metadata_filtering_conditions: metadataFilteringConditionsSchema
      .passthrough()
      .optional()
      .describe("Metadata filtering conditions nested under retrieval_model."),
  })
  .passthrough()
  .describe("Retrieval behavior for Dify knowledge search.");

export type RetrievalModelArgs = z.infer<typeof retrievalModelSchema>;

const baseDocumentPayloadSchema = z.object({
  indexing_technique: z
    .enum(["high_quality", "economy"])
    .optional()
    .describe("Indexing technique for the document."),
  doc_form: z
    .enum(["text_model", "hierarchical_model", "qa_model"])
    .optional()
    .describe("Document form for indexing."),
  doc_language: z
    .string()
    .min(1)
    .optional()
    .describe("Document language, especially relevant for Q&A mode."),
  process_rule: processRuleSchema.optional(),
  retrieval_model: retrievalModelSchema.optional(),
  embedding_model: z
    .string()
    .min(1)
    .optional()
    .describe("Embedding model name."),
  embedding_model_provider: z
    .string()
    .min(1)
    .optional()
    .describe("Embedding model provider."),
  summary_index_setting: summaryIndexSettingSchema.optional(),
});

const chunkKeywordsSchema = z
  .array(z.string().min(1))
  .optional()
  .describe("Optional keywords for the chunk.");

const chunkInputSchema = z
  .object({
    content: z.string().min(1).describe("Chunk content."),
    answer: z
      .string()
      .min(1)
      .optional()
      .describe("Optional answer text for Q&A mode."),
    keywords: chunkKeywordsSchema,
  })
  .passthrough();

const chunkUpdateSchema = z
  .object({
    content: z.string().min(1).optional(),
    answer: z.string().min(1).optional(),
    keywords: chunkKeywordsSchema,
    summary: z.string().min(1).nullable().optional(),
    enabled: z.boolean().optional(),
    regenerate_child_chunks: z.boolean().optional(),
  })
  .passthrough()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Provide at least one field to update in segment."
  );

const metadataModeSchema = z
  .enum(["all", "only", "without"])
  .optional()
  .describe("Metadata filter for the document detail response.");

export const retrieveKnowledgeChunksInputSchema = z.object({
  dataset_id: identifierSchema.describe("Knowledge base ID."),
  query: z.string().min(1).describe("Search query."),
  retrieval_model: retrievalModelSchema
    .optional()
    .describe("Optional partial retrieval configuration merged with the server defaults."),
  metadata_filtering_conditions: metadataFilteringConditionsSchema
    .optional()
    .describe(
      "Deprecated compatibility alias. This is merged into retrieval_model.metadata_filtering_conditions before the request is sent."
    ),
});

export type RetrieveKnowledgeChunksArgs = z.infer<
  typeof retrieveKnowledgeChunksInputSchema
>;

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonValue[];

export type JsonObject = {
  [key: string]: JsonValue;
};

const successResponseSchema = z
  .object({
    result: z.literal("success"),
    status: z.number().int(),
  })
  .passthrough();

const documentSchema = z
  .object({
    id: z.string().optional(),
    position: z.number().int().optional(),
    data_source_type: z.string().nullable().optional(),
    data_source_info: jsonObjectSchema.nullable().optional(),
    dataset_process_rule_id: z.string().nullable().optional(),
    name: z.string().optional(),
    created_from: z.string().optional(),
    created_by: z.string().nullable().optional(),
    created_at: z.number().int().nullable().optional(),
    tokens: z.number().int().optional(),
    indexing_status: z.string().optional(),
    error: z.string().nullable().optional(),
    enabled: z.boolean().optional(),
    disabled_at: z.number().int().nullable().optional(),
    disabled_by: z.string().nullable().optional(),
    archived: z.boolean().optional(),
    display_status: z.string().optional(),
    word_count: z.number().int().optional(),
    hit_count: z.number().int().optional(),
    doc_form: z.string().optional(),
  })
  .passthrough();

const documentProcessRuleSchema = processRuleSchema
  .extend({
    id: z.string().optional(),
    dataset_id: z.string().optional(),
  })
  .passthrough();

const segmentSchema = z
  .object({
    id: z.string().optional(),
    position: z.number().int().optional(),
    document_id: z.string().optional(),
    content: z.string().optional(),
    answer: z.string().nullable().optional(),
    word_count: z.number().int().optional(),
    tokens: z.number().int().optional(),
    keywords: z.array(z.string()).optional(),
    index_node_id: z.string().optional(),
    index_node_hash: z.string().optional(),
    hit_count: z.number().int().optional(),
    enabled: z.boolean().optional(),
    disabled_at: z.number().int().nullable().optional(),
    disabled_by: z.string().nullable().optional(),
    status: z.string().optional(),
    created_by: z.string().nullable().optional(),
    created_at: z.number().int().nullable().optional(),
    indexing_at: z.number().int().nullable().optional(),
    completed_at: z.number().int().nullable().optional(),
    error: z.string().nullable().optional(),
    stopped_at: z.number().int().nullable().optional(),
    summary: z.string().nullable().optional(),
  })
  .passthrough();

const childChunkSchema = z
  .object({
    id: z.string().optional(),
    segment_id: z.string().optional(),
    content: z.string().optional(),
    word_count: z.number().int().optional(),
    tokens: z.number().int().optional(),
    index_node_id: z.string().optional(),
    index_node_hash: z.string().optional(),
    status: z.string().optional(),
    created_by: z.string().nullable().optional(),
    created_at: z.number().int().nullable().optional(),
    indexing_at: z.number().int().nullable().optional(),
    completed_at: z.number().int().nullable().optional(),
    error: z.string().nullable().optional(),
    stopped_at: z.number().int().nullable().optional(),
  })
  .passthrough();

export const retrievedKnowledgeDocumentSchema = z
  .object({
    id: z.string().optional(),
    data_source_type: z.string().nullable().optional(),
    name: z.string().optional(),
    doc_type: z.string().nullable().optional(),
    doc_metadata: jsonObjectSchema.nullable().optional(),
  })
  .passthrough();

export const retrievedKnowledgeSegmentSchema = segmentSchema
  .extend({
    sign_content: z.string().nullable().optional(),
    document: retrievedKnowledgeDocumentSchema,
  })
  .passthrough();

export const retrievedKnowledgeChunkSchema = z
  .object({
    segment: retrievedKnowledgeSegmentSchema,
    score: z.number().nullable().optional(),
    child_chunks: z.union([z.array(z.unknown()), jsonObjectSchema]).nullable().optional(),
    tsne_position: jsonObjectSchema.nullable().optional(),
    files: z.union([z.array(z.unknown()), jsonObjectSchema]).nullable().optional(),
    summary: z.union([jsonObjectSchema, z.string()]).nullable().optional(),
  })
  .passthrough();

export const retrieveKnowledgeChunksOutputSchema = z
  .object({
    query: z
      .object({
        content: z.string().optional(),
      })
      .passthrough()
      .optional(),
    result: z.array(retrievedKnowledgeChunkSchema).optional(),
    records: z.array(retrievedKnowledgeChunkSchema).optional(),
    data: z.array(retrievedKnowledgeChunkSchema).optional(),
  })
  .passthrough();

export type RetrievedKnowledgeDocument = z.infer<
  typeof retrievedKnowledgeDocumentSchema
>;
export type RetrievedKnowledgeSegment = z.infer<
  typeof retrievedKnowledgeSegmentSchema
>;
export type RetrievedKnowledgeChunk = z.infer<typeof retrievedKnowledgeChunkSchema>;
export type RetrieveKnowledgeChunksResponse = z.infer<
  typeof retrieveKnowledgeChunksOutputSchema
>;

const workflowFinishedDataSchema = z
  .object({
    id: z.string(),
    workflow_id: z.string(),
    status: z.enum(["running", "succeeded", "failed", "stopped"]),
    outputs: jsonObjectSchema.nullable().optional(),
    error: z.string().nullable().optional(),
    elapsed_time: z.number().nullable().optional(),
    total_tokens: z.number().int().nullable().optional(),
    total_steps: z.number().int().optional(),
    created_at: z.number().int(),
    finished_at: z.number().int(),
  })
  .passthrough();

export const executeWorkflowOutputSchema = z
  .object({
    workflow_run_id: z.string(),
    task_id: z.string(),
    data: workflowFinishedDataSchema,
  })
  .passthrough();

export type ExecuteWorkflowResponse = z.infer<typeof executeWorkflowOutputSchema>;

export const addDocumentChunksOutputSchema = z
  .object({
    data: z.array(segmentSchema).optional(),
    doc_form: z.string().optional(),
  })
  .passthrough();

export type AddDocumentChunksResponse = z.infer<
  typeof addDocumentChunksOutputSchema
>;

export const getDocumentChunkOutputSchema = z
  .object({
    data: segmentSchema.optional(),
    doc_form: z.string().optional(),
  })
  .passthrough();

export type GetDocumentChunkResponse = z.infer<
  typeof getDocumentChunkOutputSchema
>;

export const getChildChunksOutputSchema = z
  .object({
    data: z.array(childChunkSchema).optional(),
    total: z.number().int().optional(),
    total_pages: z.number().int().optional(),
    page: z.number().int().optional(),
    limit: z.number().int().optional(),
  })
  .passthrough();

export type GetChildChunksResponse = z.infer<typeof getChildChunksOutputSchema>;

export const getDocumentChunksOutputSchema = z
  .object({
    data: z.array(segmentSchema).optional(),
    doc_form: z.string().optional(),
    has_more: z.boolean().optional(),
    limit: z.number().int().optional(),
    total: z.number().int().optional(),
    page: z.number().int().optional(),
  })
  .passthrough();

export type GetDocumentChunksResponse = z.infer<
  typeof getDocumentChunksOutputSchema
>;

export const createDocumentOutputSchema = z
  .object({
    document: documentSchema.optional(),
    batch: z.string().optional(),
  })
  .passthrough();

export type CreateDocumentResponse = z.infer<typeof createDocumentOutputSchema>;

export const getDocumentDetailOutputSchema = documentSchema
  .extend({
    dataset_process_rule: processRuleSchema.optional(),
    document_process_rule: documentProcessRuleSchema.optional(),
    indexing_latency: z.number().nullable().optional(),
    segment_count: z.number().int().optional(),
    average_segment_length: z.number().int().optional(),
    doc_language: z.string().nullable().optional(),
  })
  .passthrough();

export type GetDocumentDetailResponse = z.infer<
  typeof getDocumentDetailOutputSchema
>;

const indexingStatusSchema = z
  .object({
    id: z.string().optional(),
    indexing_status: z.string().optional(),
    processing_started_at: z.number().optional(),
    parsing_completed_at: z.number().optional(),
    cleaning_completed_at: z.number().optional(),
    splitting_completed_at: z.number().optional(),
    completed_at: z.number().nullable().optional(),
    paused_at: z.number().nullable().optional(),
    error: z.string().nullable().optional(),
    stopped_at: z.number().nullable().optional(),
    completed_segments: z.number().int().optional(),
    total_segments: z.number().int().optional(),
  })
  .passthrough();

export const getDocumentEmbeddingStatusOutputSchema = z
  .object({
    data: z.array(indexingStatusSchema).optional(),
  })
  .passthrough();

export type GetDocumentEmbeddingStatusResponse = z.infer<
  typeof getDocumentEmbeddingStatusOutputSchema
>;

export const listDocumentsOutputSchema = z
  .object({
    data: z.array(documentSchema).optional(),
    has_more: z.boolean().optional(),
    limit: z.number().int().optional(),
    total: z.number().int().optional(),
    page: z.number().int().optional(),
  })
  .passthrough();

export type ListDocumentsResponse = z.infer<typeof listDocumentsOutputSchema>;

export const deleteDocumentOutputSchema = successResponseSchema;
export const deleteDocumentChunkOutputSchema = successResponseSchema;
export const deleteChildChunkOutputSchema = successResponseSchema;
export const updateDocumentStatusOutputSchema = successResponseSchema;

export type DifySuccessResponse = z.infer<typeof successResponseSchema>;

export const executeWorkflowInputSchema = z.object({
  inputs: jsonObjectSchema.describe("Workflow input variables."),
  response_mode: z
    .enum(["blocking", "streaming"])
    .default("blocking")
    .describe("Dify workflow response mode."),
  user: z.string().min(1).describe("End-user identifier required by Dify."),
});

export type ExecuteWorkflowArgs = z.infer<typeof executeWorkflowInputSchema>;

export const addDocumentChunksInputSchema = z.object({
  dataset_id: identifierSchema.describe("Knowledge base ID."),
  document_id: identifierSchema.describe("Document ID."),
  segments: z
    .array(chunkInputSchema)
    .min(1)
    .describe("Segments to add to the document."),
});

export type AddDocumentChunksArgs = z.infer<typeof addDocumentChunksInputSchema>;

export const deleteDocumentChunkInputSchema = z.object({
  dataset_id: identifierSchema.describe("Knowledge base ID."),
  document_id: identifierSchema.describe("Document ID."),
  segment_id: identifierSchema.describe("Segment ID to delete."),
});

export type DeleteDocumentChunkArgs = z.infer<
  typeof deleteDocumentChunkInputSchema
>;

export const deleteChildChunkInputSchema = z.object({
  dataset_id: identifierSchema.describe("Knowledge base ID."),
  document_id: identifierSchema.describe("Document ID."),
  segment_id: identifierSchema.describe("Parent segment ID."),
  child_chunk_id: identifierSchema.describe("Child chunk ID to delete."),
});

export type DeleteChildChunkArgs = z.infer<typeof deleteChildChunkInputSchema>;

export const getDocumentChunkInputSchema = z.object({
  dataset_id: identifierSchema.describe("Knowledge base ID."),
  document_id: identifierSchema.describe("Document ID."),
  segment_id: identifierSchema.describe("Segment ID."),
});

export type GetDocumentChunkArgs = z.infer<typeof getDocumentChunkInputSchema>;

export const getChildChunksInputSchema = z.object({
  dataset_id: identifierSchema.describe("Knowledge base ID."),
  document_id: identifierSchema.describe("Document ID."),
  segment_id: identifierSchema.describe("Parent segment ID."),
  keyword: z
    .string()
    .min(1)
    .optional()
    .describe("Optional search term for child chunks."),
  page: paginationPageSchema,
  limit: paginationLimitSchema,
});

export type GetChildChunksArgs = z.infer<typeof getChildChunksInputSchema>;

export const getDocumentChunksInputSchema = z.object({
  dataset_id: identifierSchema.describe("Knowledge base ID."),
  document_id: identifierSchema.describe("Document ID."),
  keyword: z
    .string()
    .min(1)
    .optional()
    .describe("Optional search term for chunks."),
  status: z
    .string()
    .min(1)
    .optional()
    .describe("Optional chunk status filter."),
  page: paginationPageSchema,
  limit: paginationLimitSchema,
});

export type GetDocumentChunksArgs = z.infer<typeof getDocumentChunksInputSchema>;

export const updateDocumentChunkInputSchema = z.object({
  dataset_id: identifierSchema.describe("Knowledge base ID."),
  document_id: identifierSchema.describe("Document ID."),
  segment_id: identifierSchema.describe("Segment ID to update."),
  segment: chunkUpdateSchema.describe("Segment fields to update."),
});

export type UpdateDocumentChunkArgs = z.infer<
  typeof updateDocumentChunkInputSchema
>;

export const createDocumentFromFileInputSchema = z.object({
  dataset_id: identifierSchema.describe("Knowledge base ID."),
  file_path: localFilePathSchema.describe("Local path to the file to upload."),
  data: baseDocumentPayloadSchema
    .extend({
      original_document_id: identifierSchema
        .optional()
        .describe("Optional original document ID for re-upload or modification."),
    })
    .partial()
    .optional()
    .describe("Optional document configuration serialized into multipart data."),
});

export type CreateDocumentFromFileArgs = z.infer<
  typeof createDocumentFromFileInputSchema
>;

export const createDocumentFromTextInputSchema = z.object({
  dataset_id: identifierSchema.describe("Knowledge base ID."),
  name: z.string().min(1).describe("Document name."),
  text: z.string().min(1).describe("Full text content."),
  indexing_technique: baseDocumentPayloadSchema.shape.indexing_technique,
  doc_form: baseDocumentPayloadSchema.shape.doc_form,
  doc_language: baseDocumentPayloadSchema.shape.doc_language,
  process_rule: baseDocumentPayloadSchema.shape.process_rule,
  retrieval_model: baseDocumentPayloadSchema.shape.retrieval_model,
  embedding_model: baseDocumentPayloadSchema.shape.embedding_model,
  embedding_model_provider:
    baseDocumentPayloadSchema.shape.embedding_model_provider,
  summary_index_setting: baseDocumentPayloadSchema.shape.summary_index_setting,
});

export type CreateDocumentFromTextArgs = z.infer<
  typeof createDocumentFromTextInputSchema
>;

export const deleteDocumentInputSchema = z.object({
  dataset_id: identifierSchema.describe("Knowledge base ID."),
  document_id: identifierSchema.describe("Document ID to delete."),
});

export type DeleteDocumentArgs = z.infer<typeof deleteDocumentInputSchema>;

export const getDocumentDetailInputSchema = z.object({
  dataset_id: identifierSchema.describe("Knowledge base ID."),
  document_id: identifierSchema.describe("Document ID."),
  metadata: metadataModeSchema,
});

export type GetDocumentDetailArgs = z.infer<typeof getDocumentDetailInputSchema>;

export const getDocumentEmbeddingStatusInputSchema = z.object({
  dataset_id: identifierSchema.describe("Knowledge base ID."),
  batch: z
    .string()
    .min(1)
    .describe("Batch identifier returned by create/update document APIs."),
});

export type GetDocumentEmbeddingStatusArgs = z.infer<
  typeof getDocumentEmbeddingStatusInputSchema
>;

export const listDocumentsInputSchema = z.object({
  dataset_id: identifierSchema.describe("Knowledge base ID."),
  keyword: z
    .string()
    .min(1)
    .optional()
    .describe("Optional document name search term."),
  page: paginationPageSchema,
  limit: paginationLimitSchema,
});

export type ListDocumentsArgs = z.infer<typeof listDocumentsInputSchema>;

export const updateDocumentWithFileInputSchema = z.object({
  dataset_id: identifierSchema.describe("Knowledge base ID."),
  document_id: identifierSchema.describe("Document ID to update."),
  file_path: localFilePathSchema.describe("Local path to the replacement file."),
  data: z
    .object({
      name: z
        .string()
        .min(1)
        .optional()
        .describe("Optional replacement document name."),
      process_rule: processRuleSchema
        .optional()
        .describe("Optional replacement processing rule."),
    })
    .partial()
    .optional()
    .describe("Optional document configuration serialized into multipart data."),
});

export type UpdateDocumentWithFileArgs = z.infer<
  typeof updateDocumentWithFileInputSchema
>;

export const updateDocumentWithTextInputSchema = z.object({
  dataset_id: identifierSchema.describe("Knowledge base ID."),
  document_id: identifierSchema.describe("Document ID to update."),
  name: z
    .string()
    .min(1)
    .optional()
    .describe("Optional replacement name."),
  text: z
    .string()
    .min(1)
    .optional()
    .describe("Optional replacement text."),
  process_rule: processRuleSchema.optional(),
});

export type UpdateDocumentWithTextArgs = z.infer<
  typeof updateDocumentWithTextInputSchema
>;

export const updateDocumentStatusInputSchema = z.object({
  dataset_id: identifierSchema.describe("Knowledge base ID."),
  action: z
    .enum(["enable", "disable", "archive", "un_archive"])
    .describe("Document status action to apply."),
  document_ids: z
    .array(identifierSchema)
    .min(1)
    .describe("Document IDs to update."),
});

export type UpdateDocumentStatusArgs = z.infer<
  typeof updateDocumentStatusInputSchema
>;
