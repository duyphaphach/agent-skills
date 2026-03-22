import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { DifyKnowledgeClient, DifyWorkflowClient } from "./client.js";
import {
  createAnnotations,
  deleteAnnotations,
  readOnlyAnnotations,
  registerStructuredTool,
  updateAnnotations,
} from "../shared/registerTool.js";
import {
  addDocumentChunksInputSchema,
  addDocumentChunksOutputSchema,
  createDocumentFromFileInputSchema,
  createDocumentOutputSchema,
  createDocumentFromTextInputSchema,
  deleteChildChunkOutputSchema,
  deleteChildChunkInputSchema,
  deleteDocumentChunkOutputSchema,
  deleteDocumentChunkInputSchema,
  deleteDocumentOutputSchema,
  deleteDocumentInputSchema,
  executeWorkflowInputSchema,
  executeWorkflowOutputSchema,
  getChildChunksInputSchema,
  getChildChunksOutputSchema,
  getDocumentChunkInputSchema,
  getDocumentChunkOutputSchema,
  getDocumentChunksInputSchema,
  getDocumentChunksOutputSchema,
  getDocumentDetailInputSchema,
  getDocumentDetailOutputSchema,
  getDocumentEmbeddingStatusInputSchema,
  getDocumentEmbeddingStatusOutputSchema,
  listDocumentsInputSchema,
  listDocumentsOutputSchema,
  retrieveKnowledgeChunksInputSchema,
  retrieveKnowledgeChunksOutputSchema,
  updateDocumentChunkInputSchema,
  updateDocumentStatusOutputSchema,
  updateDocumentStatusInputSchema,
  updateDocumentWithFileInputSchema,
  updateDocumentWithTextInputSchema,
} from "./schemas.js";

export function registerDifyTools(server: McpServer): void {
  const knowledgeClient = new DifyKnowledgeClient();
  const workflowClient = new DifyWorkflowClient();

  registerStructuredTool(server, {
    name: "dify_retrieve_knowledge_chunks",
    title: "Dify Retrieve Knowledge Chunks",
    description:
      "Run Dify knowledge base test retrieval for a query against a dataset.",
    inputSchema: retrieveKnowledgeChunksInputSchema,
    outputSchema: retrieveKnowledgeChunksOutputSchema,
    annotations: readOnlyAnnotations,
    handler: (args) => knowledgeClient.retrieveChunks(args),
  });

  registerStructuredTool(server, {
    name: "dify_execute_workflow",
    title: "Dify Execute Workflow",
    description:
      "Execute a published Dify workflow using env-configured workflow credentials.",
    inputSchema: executeWorkflowInputSchema,
    outputSchema: executeWorkflowOutputSchema,
    annotations: createAnnotations,
    handler: (args) => workflowClient.executeWorkflow(args),
  });

  registerStructuredTool(server, {
    name: "dify_add_document_chunks",
    title: "Dify Add Document Chunks",
    description: "Add one or more curated chunks to a Dify document.",
    inputSchema: addDocumentChunksInputSchema,
    outputSchema: addDocumentChunksOutputSchema,
    annotations: createAnnotations,
    handler: (args) => knowledgeClient.addDocumentChunks(args),
  });

  registerStructuredTool(server, {
    name: "dify_delete_document_chunk",
    title: "Dify Delete Document Chunk",
    description: "Delete a specific chunk from a Dify document.",
    inputSchema: deleteDocumentChunkInputSchema,
    outputSchema: deleteDocumentChunkOutputSchema,
    annotations: deleteAnnotations,
    handler: (args) => knowledgeClient.deleteDocumentChunk(args),
  });

  registerStructuredTool(server, {
    name: "dify_delete_child_chunk",
    title: "Dify Delete Child Chunk",
    description: "Delete a child chunk from a hierarchical Dify segment.",
    inputSchema: deleteChildChunkInputSchema,
    outputSchema: deleteChildChunkOutputSchema,
    annotations: deleteAnnotations,
    handler: (args) => knowledgeClient.deleteChildChunk(args),
  });

  registerStructuredTool(server, {
    name: "dify_get_document_chunk",
    title: "Dify Get Document Chunk",
    description: "Fetch detailed information about a Dify document chunk.",
    inputSchema: getDocumentChunkInputSchema,
    outputSchema: getDocumentChunkOutputSchema,
    annotations: readOnlyAnnotations,
    handler: (args) => knowledgeClient.getDocumentChunk(args),
  });

  registerStructuredTool(server, {
    name: "dify_get_child_chunks",
    title: "Dify Get Child Chunks",
    description: "List child chunks for a parent Dify segment.",
    inputSchema: getChildChunksInputSchema,
    outputSchema: getChildChunksOutputSchema,
    annotations: readOnlyAnnotations,
    handler: (args) => knowledgeClient.getChildChunks(args),
  });

  registerStructuredTool(server, {
    name: "dify_get_document_chunks",
    title: "Dify Get Document Chunks",
    description: "List chunks from a Dify document with optional pagination.",
    inputSchema: getDocumentChunksInputSchema,
    outputSchema: getDocumentChunksOutputSchema,
    annotations: readOnlyAnnotations,
    handler: (args) => knowledgeClient.getDocumentChunks(args),
  });

  registerStructuredTool(server, {
    name: "dify_update_document_chunk",
    title: "Dify Update Document Chunk",
    description: "Update the content, keywords, answer, or enabled state of a Dify chunk.",
    inputSchema: updateDocumentChunkInputSchema,
    outputSchema: getDocumentChunkOutputSchema,
    annotations: updateAnnotations,
    handler: (args) => knowledgeClient.updateDocumentChunk(args),
  });

  registerStructuredTool(server, {
    name: "dify_create_document_from_file",
    title: "Dify Create Document From File",
    description:
      "Create a Dify document by uploading a local file from the MCP server host.",
    inputSchema: createDocumentFromFileInputSchema,
    outputSchema: createDocumentOutputSchema,
    annotations: createAnnotations,
    handler: (args) => knowledgeClient.createDocumentFromFile(args),
  });

  registerStructuredTool(server, {
    name: "dify_create_document_from_text",
    title: "Dify Create Document From Text",
    description: "Create a Dify document directly from text content.",
    inputSchema: createDocumentFromTextInputSchema,
    outputSchema: createDocumentOutputSchema,
    annotations: createAnnotations,
    handler: (args) => knowledgeClient.createDocumentFromText(args),
  });

  registerStructuredTool(server, {
    name: "dify_delete_document",
    title: "Dify Delete Document",
    description: "Delete a Dify document from a knowledge base.",
    inputSchema: deleteDocumentInputSchema,
    outputSchema: deleteDocumentOutputSchema,
    annotations: deleteAnnotations,
    handler: (args) => knowledgeClient.deleteDocument(args),
  });

  registerStructuredTool(server, {
    name: "dify_get_document_detail",
    title: "Dify Get Document Detail",
    description: "Fetch detailed information about a Dify document.",
    inputSchema: getDocumentDetailInputSchema,
    outputSchema: getDocumentDetailOutputSchema,
    annotations: readOnlyAnnotations,
    handler: (args) => knowledgeClient.getDocumentDetail(args),
  });

  registerStructuredTool(server, {
    name: "dify_get_document_embedding_status",
    title: "Dify Get Document Embedding Status",
    description:
      "Fetch indexing progress for a Dify document batch returned by create or update operations.",
    inputSchema: getDocumentEmbeddingStatusInputSchema,
    outputSchema: getDocumentEmbeddingStatusOutputSchema,
    annotations: readOnlyAnnotations,
    handler: (args) => knowledgeClient.getDocumentEmbeddingStatus(args),
  });

  registerStructuredTool(server, {
    name: "dify_list_documents",
    title: "Dify List Documents",
    description: "List documents in a Dify knowledge base.",
    inputSchema: listDocumentsInputSchema,
    outputSchema: listDocumentsOutputSchema,
    annotations: readOnlyAnnotations,
    handler: (args) => knowledgeClient.listDocuments(args),
  });

  registerStructuredTool(server, {
    name: "dify_update_document_with_file",
    title: "Dify Update Document With File",
    description:
      "Replace a Dify document by uploading a new local file from the MCP server host.",
    inputSchema: updateDocumentWithFileInputSchema,
    outputSchema: createDocumentOutputSchema,
    annotations: updateAnnotations,
    handler: (args) => knowledgeClient.updateDocumentWithFile(args),
  });

  registerStructuredTool(server, {
    name: "dify_update_document_with_text",
    title: "Dify Update Document With Text",
    description: "Update a Dify document's text content or text-based settings.",
    inputSchema: updateDocumentWithTextInputSchema,
    outputSchema: createDocumentOutputSchema,
    annotations: updateAnnotations,
    handler: (args) => knowledgeClient.updateDocumentWithText(args),
  });

  registerStructuredTool(server, {
    name: "dify_update_document_status",
    title: "Dify Update Document Status",
    description:
      "Batch update Dify document status to enable, disable, archive, or unarchive.",
    inputSchema: updateDocumentStatusInputSchema,
    outputSchema: updateDocumentStatusOutputSchema,
    annotations: updateAnnotations,
    handler: (args) => knowledgeClient.updateDocumentStatus(args),
  });
}
