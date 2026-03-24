import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { formatResult } from "../../utils/formatResult.js";

type ToolAnnotations = {
  readOnlyHint: boolean;
  destructiveHint: boolean;
  idempotentHint: boolean;
  openWorldHint: boolean;
};

type StructuredToolDefinition<TSchema extends z.ZodRawShape> = {
  name: string;
  title: string;
  description: string;
  inputSchema: z.ZodObject<TSchema>;
  outputSchema?: z.ZodTypeAny;
  annotations: ToolAnnotations;
  handler: (args: z.infer<z.ZodObject<TSchema>>) => Promise<unknown>;
};

type FileToolDefinition<
  TInputSchema extends z.ZodRawShape,
  TOutputSchema extends z.ZodRawShape,
> = Omit<StructuredToolDefinition<TInputSchema>, "outputSchema"> & {
  outputSchema: z.ZodObject<TOutputSchema>;
};

export const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const satisfies ToolAnnotations;

export const createAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
} as const satisfies ToolAnnotations;

export const updateAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
} as const satisfies ToolAnnotations;

export const deleteAnnotations = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
  openWorldHint: true,
} as const satisfies ToolAnnotations;

export const localFileAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const satisfies ToolAnnotations;

export function registerStructuredTool<TSchema extends z.ZodRawShape>(
  server: McpServer,
  definition: StructuredToolDefinition<TSchema>
): void {
  server.registerTool(
    definition.name,
    {
      title: definition.title,
      description: definition.description,
      inputSchema: definition.inputSchema,
      outputSchema: definition.outputSchema,
      annotations: definition.annotations,
    },
    async (args) =>
      formatResult(
        await definition.handler(args as z.infer<z.ZodObject<TSchema>>)
      )
  );
}

export function registerFileTool<
  TInputSchema extends z.ZodRawShape,
  TOutputSchema extends z.ZodRawShape,
>(
  server: McpServer,
  definition: FileToolDefinition<TInputSchema, TOutputSchema>
): void {
  server.registerTool(
    definition.name,
    {
      title: definition.title,
      description: definition.description,
      inputSchema: definition.inputSchema,
      outputSchema: definition.outputSchema,
      annotations: definition.annotations,
    },
    async (args) =>
      formatResult(
        await definition.handler(args as z.infer<z.ZodObject<TInputSchema>>)
      )
  );
}
