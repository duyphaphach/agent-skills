import type {
  JsonObject,
  MetadataFilteringConditionsArgs,
  RetrieveKnowledgeChunksResponse,
  RetrievedKnowledgeChunk,
} from "../dify/schemas.js";

export type KnowledgeRecord = RetrievedKnowledgeChunk;
type KnowledgeMetadata = JsonObject;
type AggregatedChunk = {
  documentName: string;
  content: string;
  metadata: KnowledgeMetadata | null;
  position: number;
};

export type ProjectKnowledgeCategory = "MESSAGE" | "SMS" | "EMAIL" | "SRS";

export function extractKnowledgeRecords(
  payload: RetrieveKnowledgeChunksResponse
): KnowledgeRecord[] {
  return payload.result ?? payload.records ?? payload.data ?? [];
}

function parseContent(content: string): {
  meta: KnowledgeMetadata | null;
  body: string;
} {
  const text = content.replace(/^\d+\.text\b/gm, "");
  const metadataMatch = text.match(/<metadata>\s*([\s\S]*?)\s*<\/metadata>/i);

  let meta: KnowledgeMetadata | null = null;

  if (metadataMatch?.[1]) {
    try {
      const parsedMetadata = JSON.parse(metadataMatch[1]) as JsonObject;

      meta = parsedMetadata;
    } catch {
      meta = null;
    }
  }

  const body = metadataMatch
    ? text.slice((metadataMatch.index ?? 0) + metadataMatch[0].length).trim()
    : text.trim();

  return {
    meta,
    body,
  };
}

function getDocumentName(chunk: KnowledgeRecord): string | null {
  const documentName = chunk.segment.document.name ?? "";
  const trimmedDocumentName = documentName.trim();

  return trimmedDocumentName.length > 0 ? trimmedDocumentName : null;
}

function getStartLine(metadata: KnowledgeMetadata | null): number {
  const startLine = metadata?.start_line;

  return typeof startLine === "number" && Number.isFinite(startLine) ? startLine : 0;
}

function getChunkContent(chunk: KnowledgeRecord): string {
  return chunk.segment.content ?? "";
}

function getSegmentPosition(chunk: KnowledgeRecord): number {
  return chunk.segment.position ?? 0;
}

function normalizeChunk(chunk: KnowledgeRecord): AggregatedChunk | null {
  const documentName = getDocumentName(chunk);

  if (!documentName) {
    return null;
  }

  const { body, meta } = parseContent(getChunkContent(chunk));

  return {
    documentName,
    content: body,
    metadata: meta,
    position: getSegmentPosition(chunk),
  };
}

function compareChunks(left: AggregatedChunk, right: AggregatedChunk): number {
  const startLineDelta = getStartLine(left.metadata) - getStartLine(right.metadata);

  if (startLineDelta !== 0) {
    return startLineDelta;
  }

  return left.position - right.position;
}

function formatDocumentContext(
  documentName: string,
  chunks: ReadonlyArray<AggregatedChunk>
): string {
  const content = [...chunks]
    .sort(compareChunks)
    .map((chunk) => chunk.content)
    .join("\n");

  return `# Doc: ${documentName}\n\n${content}`;
}

export function aggregateContext(
  sections: Record<string, KnowledgeRecord[]>
): { context: string } {
  const groupedChunks = new Map<string, AggregatedChunk[]>();

  for (const sectionRecords of Object.values(sections)) {
    for (const record of sectionRecords) {
      const chunk = normalizeChunk(record);

      if (!chunk) {
        continue;
      }

      const documentChunks = groupedChunks.get(chunk.documentName) ?? [];

      documentChunks.push(chunk);
      groupedChunks.set(chunk.documentName, documentChunks);
    }
  }

  const combinedDocuments = [...groupedChunks.entries()]
    .sort(([leftName], [rightName]) => leftName.localeCompare(rightName))
    .map(([documentName, chunks]) => formatDocumentContext(documentName, chunks));

  return {
    context: combinedDocuments.join("\n\n").trim(),
  };
}

export function createMetadataFilters(
  category: ProjectKnowledgeCategory,
  projectName: string
): MetadataFilteringConditionsArgs {
  return {
    logical_operator: "and",
    conditions: [
      {
        comparison_operator: "is",
        name: "category",
        value: category,
      },
      {
        comparison_operator: "is",
        name: "project_name",
        value: projectName,
      },
    ],
  };
}
