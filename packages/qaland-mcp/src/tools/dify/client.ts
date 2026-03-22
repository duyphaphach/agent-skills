import {
  createMultipartData,
  createRetrieveKnowledgeModel,
  encodePathSegment,
  readFileAsBlob,
  requestJson,
} from "./utils.js";
import type {
  AddDocumentChunksArgs,
  AddDocumentChunksResponse,
  CreateDocumentFromFileArgs,
  CreateDocumentFromTextArgs,
  CreateDocumentResponse,
  DeleteChildChunkArgs,
  DifySuccessResponse,
  DeleteDocumentArgs,
  DeleteDocumentChunkArgs,
  ExecuteWorkflowArgs,
  ExecuteWorkflowResponse,
  GetChildChunksArgs,
  GetChildChunksResponse,
  GetDocumentChunkArgs,
  GetDocumentChunkResponse,
  GetDocumentChunksArgs,
  GetDocumentChunksResponse,
  GetDocumentDetailArgs,
  GetDocumentDetailResponse,
  GetDocumentEmbeddingStatusArgs,
  GetDocumentEmbeddingStatusResponse,
  ListDocumentsArgs,
  ListDocumentsResponse,
  RetrieveKnowledgeChunksArgs,
  RetrieveKnowledgeChunksResponse,
  UpdateDocumentChunkArgs,
  UpdateDocumentStatusArgs,
  UpdateDocumentWithFileArgs,
  UpdateDocumentWithTextArgs,
} from "./schemas.js";

export class DifyKnowledgeClient {
  async retrieveChunks(
    args: RetrieveKnowledgeChunksArgs
  ): Promise<RetrieveKnowledgeChunksResponse> {
    const datasetId = encodePathSegment(args.dataset_id);
    const body: Record<string, unknown> = {
      query: args.query,
      retrieval_model: createRetrieveKnowledgeModel(
        args.retrieval_model,
        args.metadata_filtering_conditions
      ),
    };

    return requestJson<RetrieveKnowledgeChunksResponse>({
      method: "POST",
      path: `/datasets/${datasetId}/retrieve`,
      service: "knowledge",
      body,
    });
  }

  async addDocumentChunks(
    args: AddDocumentChunksArgs
  ): Promise<AddDocumentChunksResponse> {
    const datasetId = encodePathSegment(args.dataset_id);
    const documentId = encodePathSegment(args.document_id);
    return requestJson<AddDocumentChunksResponse>({
      method: "POST",
      path: `/datasets/${datasetId}/documents/${documentId}/segments`,
      service: "knowledge",
      body: {
        segments: args.segments,
      },
    });
  }

  async deleteDocumentChunk(
    args: DeleteDocumentChunkArgs
  ): Promise<DifySuccessResponse> {
    const datasetId = encodePathSegment(args.dataset_id);
    const documentId = encodePathSegment(args.document_id);
    const segmentId = encodePathSegment(args.segment_id);
    return requestJson<DifySuccessResponse>({
      method: "DELETE",
      path: `/datasets/${datasetId}/documents/${documentId}/segments/${segmentId}`,
      service: "knowledge",
    });
  }

  async deleteChildChunk(
    args: DeleteChildChunkArgs
  ): Promise<DifySuccessResponse> {
    const datasetId = encodePathSegment(args.dataset_id);
    const documentId = encodePathSegment(args.document_id);
    const segmentId = encodePathSegment(args.segment_id);
    const childChunkId = encodePathSegment(args.child_chunk_id);
    return requestJson<DifySuccessResponse>({
      method: "DELETE",
      path: `/datasets/${datasetId}/documents/${documentId}/segments/${segmentId}/child_chunks/${childChunkId}`,
      service: "knowledge",
    });
  }

  async getDocumentChunk(
    args: GetDocumentChunkArgs
  ): Promise<GetDocumentChunkResponse> {
    const datasetId = encodePathSegment(args.dataset_id);
    const documentId = encodePathSegment(args.document_id);
    const segmentId = encodePathSegment(args.segment_id);
    return requestJson<GetDocumentChunkResponse>({
      method: "GET",
      path: `/datasets/${datasetId}/documents/${documentId}/segments/${segmentId}`,
      service: "knowledge",
    });
  }

  async getChildChunks(
    args: GetChildChunksArgs
  ): Promise<GetChildChunksResponse> {
    const datasetId = encodePathSegment(args.dataset_id);
    const documentId = encodePathSegment(args.document_id);
    const segmentId = encodePathSegment(args.segment_id);
    return requestJson<GetChildChunksResponse>({
      method: "GET",
      path: `/datasets/${datasetId}/documents/${documentId}/segments/${segmentId}/child_chunks`,
      query: {
        keyword: args.keyword,
        page: args.page,
        limit: args.limit,
      },
      service: "knowledge",
    });
  }

  async getDocumentChunks(
    args: GetDocumentChunksArgs
  ): Promise<GetDocumentChunksResponse> {
    const datasetId = encodePathSegment(args.dataset_id);
    const documentId = encodePathSegment(args.document_id);
    return requestJson<GetDocumentChunksResponse>({
      method: "GET",
      path: `/datasets/${datasetId}/documents/${documentId}/segments`,
      query: {
        keyword: args.keyword,
        status: args.status,
        page: args.page,
        limit: args.limit,
      },
      service: "knowledge",
    });
  }

  async updateDocumentChunk(
    args: UpdateDocumentChunkArgs
  ): Promise<GetDocumentChunkResponse> {
    const datasetId = encodePathSegment(args.dataset_id);
    const documentId = encodePathSegment(args.document_id);
    const segmentId = encodePathSegment(args.segment_id);
    return requestJson<GetDocumentChunkResponse>({
      method: "POST",
      path: `/datasets/${datasetId}/documents/${documentId}/segments/${segmentId}`,
      service: "knowledge",
      body: {
        segment: args.segment,
      },
    });
  }

  async createDocumentFromFile(
    args: CreateDocumentFromFileArgs
  ): Promise<CreateDocumentResponse> {
    const datasetId = encodePathSegment(args.dataset_id);
    const { blob, filename } = await readFileAsBlob(args.file_path);
    const formData = createMultipartData(args.data);

    formData.append("file", blob, filename);

    return requestJson<CreateDocumentResponse>({
      method: "POST",
      path: `/datasets/${datasetId}/document/create-by-file`,
      service: "knowledge",
      body: formData,
    });
  }

  async createDocumentFromText(
    args: CreateDocumentFromTextArgs
  ): Promise<CreateDocumentResponse> {
    const { dataset_id, ...body } = args;
    const datasetId = encodePathSegment(dataset_id);

    return requestJson<CreateDocumentResponse>({
      method: "POST",
      path: `/datasets/${datasetId}/document/create-by-text`,
      service: "knowledge",
      body,
    });
  }

  async deleteDocument(args: DeleteDocumentArgs): Promise<DifySuccessResponse> {
    const datasetId = encodePathSegment(args.dataset_id);
    const documentId = encodePathSegment(args.document_id);
    return requestJson<DifySuccessResponse>({
      method: "DELETE",
      path: `/datasets/${datasetId}/documents/${documentId}`,
      service: "knowledge",
    });
  }

  async getDocumentDetail(
    args: GetDocumentDetailArgs
  ): Promise<GetDocumentDetailResponse> {
    const datasetId = encodePathSegment(args.dataset_id);
    const documentId = encodePathSegment(args.document_id);
    return requestJson<GetDocumentDetailResponse>({
      method: "GET",
      path: `/datasets/${datasetId}/documents/${documentId}`,
      query: {
        metadata: args.metadata,
      },
      service: "knowledge",
    });
  }

  async getDocumentEmbeddingStatus(
    args: GetDocumentEmbeddingStatusArgs
  ): Promise<GetDocumentEmbeddingStatusResponse> {
    const datasetId = encodePathSegment(args.dataset_id);
    const batchId = encodePathSegment(args.batch);
    return requestJson<GetDocumentEmbeddingStatusResponse>({
      method: "GET",
      path: `/datasets/${datasetId}/documents/${batchId}/indexing-status`,
      service: "knowledge",
      cache: {
        enabled: false,
      },
    });
  }

  async listDocuments(args: ListDocumentsArgs): Promise<ListDocumentsResponse> {
    const datasetId = encodePathSegment(args.dataset_id);
    return requestJson<ListDocumentsResponse>({
      method: "GET",
      path: `/datasets/${datasetId}/documents`,
      query: {
        keyword: args.keyword,
        page: args.page,
        limit: args.limit,
      },
      service: "knowledge",
    });
  }

  async updateDocumentWithFile(
    args: UpdateDocumentWithFileArgs
  ): Promise<CreateDocumentResponse> {
    const datasetId = encodePathSegment(args.dataset_id);
    const documentId = encodePathSegment(args.document_id);
    const { blob, filename } = await readFileAsBlob(args.file_path);
    const formData = createMultipartData(args.data);

    formData.append("file", blob, filename);

    return requestJson<CreateDocumentResponse>({
      method: "POST",
      path: `/datasets/${datasetId}/documents/${documentId}/update-by-file`,
      service: "knowledge",
      body: formData,
    });
  }

  async updateDocumentWithText(
    args: UpdateDocumentWithTextArgs
  ): Promise<CreateDocumentResponse> {
    const { dataset_id, document_id, ...body } = args;
    const datasetId = encodePathSegment(dataset_id);
    const documentId = encodePathSegment(document_id);

    return requestJson<CreateDocumentResponse>({
      method: "POST",
      path: `/datasets/${datasetId}/documents/${documentId}/update-by-text`,
      service: "knowledge",
      body,
    });
  }

  async updateDocumentStatus(
    args: UpdateDocumentStatusArgs
  ): Promise<DifySuccessResponse> {
    const datasetId = encodePathSegment(args.dataset_id);
    const action = encodePathSegment(args.action);
    return requestJson<DifySuccessResponse>({
      method: "PATCH",
      path: `/datasets/${datasetId}/documents/status/${action}`,
      service: "knowledge",
      body: {
        document_ids: args.document_ids,
      },
    });
  }
}

export class DifyWorkflowClient {
  async executeWorkflow(
    args: ExecuteWorkflowArgs
  ): Promise<ExecuteWorkflowResponse> {
    return requestJson<ExecuteWorkflowResponse>({
      method: "POST",
      path: "/workflows/run",
      service: "workflow",
      body: args,
    });
  }
}
