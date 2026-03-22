import { marked } from "marked";
import TurndownService from "turndown";
import * as XLSX from "xlsx";

import {
  readBinaryFile,
  readTextFile,
  writeBinaryFile,
  writeTextFile,
} from "./localFiles.js";
import type {
  CsvToJsonArgs,
  HeaderMode,
  HtmlToMarkdownArgs,
  JsonRecord,
  JsonRows,
  JsonToCsvArgs,
  JsonToXlsxArgs,
  MarkdownToHtmlArgs,
  PathConversionResult,
  XlsxToJsonArgs,
} from "../types/conversion.js";

const htmlLineBreakPattern = /<br\s*\/?>/gi;
const richTextHtmlPattern =
  /<(?:\/)?(?:br|span|b|strong|i|em|u|s|strike|del|sub|sup|font)(?:\s+[^>]*)?>/i;

function ensureArrayRows(value: unknown): JsonRows {
  if (Array.isArray(value)) {
    if (!value.every((row) => row !== null && typeof row === "object")) {
      throw new Error("JSON array input must contain objects.");
    }

    return value as JsonRows;
  }

  if (value !== null && typeof value === "object") {
    return [value as JsonRecord];
  }

  throw new Error("JSON input must be an object or an array of objects.");
}

async function loadJsonRows(inputPath: string): Promise<JsonRows> {
  const raw = await readTextFile(inputPath, "JSON input");
  return ensureArrayRows(JSON.parse(raw));
}

function normalizeLineBreaks(value: string): string {
  return value.replace(/\r\n?/g, "\n").replace(htmlLineBreakPattern, "\n");
}

function getNormalizedStringCellValue(
  cell: XLSX.CellObject
): string | undefined {
  if (typeof cell.h === "string" && richTextHtmlPattern.test(cell.h)) {
    return normalizeLineBreaks(cell.h);
  }

  if (cell.t !== "s" && typeof cell.v !== "string") {
    return undefined;
  }

  if (typeof cell.v === "string") {
    return normalizeLineBreaks(cell.v);
  }

  if (typeof cell.w === "string") {
    return normalizeLineBreaks(cell.w);
  }

  return undefined;
}

function normalizeWorksheetStringCells(worksheet: XLSX.WorkSheet): void {
  for (const [address, candidate] of Object.entries(worksheet)) {
    if (address.startsWith("!")) {
      continue;
    }

    if (candidate === null || typeof candidate !== "object") {
      continue;
    }

    const cell = candidate as XLSX.CellObject;
    const normalizedValue = getNormalizedStringCellValue(cell);

    if (normalizedValue === undefined) {
      continue;
    }

    cell.t = "s";
    cell.v = normalizedValue;
    cell.w = normalizedValue;
  }
}

function getWorksheet(
  workbook: XLSX.WorkBook,
  args: {
    sheet_name?: string;
    sheet_index?: number;
  }
): {
  sheetName: string;
  worksheet: XLSX.WorkSheet;
} {
  if (args.sheet_name) {
    const worksheet = workbook.Sheets[args.sheet_name];

    if (!worksheet) {
      throw new Error(`Sheet "${args.sheet_name}" was not found.`);
    }

    return {
      sheetName: args.sheet_name,
      worksheet,
    };
  }

  const index = args.sheet_index ?? 0;
  const sheetName = workbook.SheetNames[index];

  if (!sheetName) {
    throw new Error(`Sheet index ${index} is out of range.`);
  }

  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    throw new Error(`Sheet "${sheetName}" was not found.`);
  }

  return {
    sheetName,
    worksheet,
  };
}

function sheetToJson(
  worksheet: XLSX.WorkSheet,
  headerMode: HeaderMode
): unknown[] | JsonRows {
  if (headerMode === "array") {
    return XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: null,
      raw: false,
    }) as unknown[];
  }

  return XLSX.utils.sheet_to_json<JsonRecord>(worksheet, {
    defval: null,
    raw: false,
  });
}

function rowCountForSheetData(value: unknown[] | JsonRows): number {
  return Array.isArray(value) ? value.length : 0;
}

export async function transformJsonToCsv(
  args: JsonToCsvArgs
): Promise<
  PathConversionResult & {
    row_count: number;
  }
> {
  const rows = await loadJsonRows(args.input_path);
  const worksheet = XLSX.utils.json_to_sheet(rows, {
    skipHeader: args.skip_header ?? false,
  });
  normalizeWorksheetStringCells(worksheet);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const byteLength = await writeTextFile(args.output_path, csv);

  return {
    input_path: args.input_path,
    output_path: args.output_path,
    row_count: rows.length,
    byte_length: byteLength,
  };
}

export async function transformCsvToJson(
  args: CsvToJsonArgs
): Promise<
  PathConversionResult & {
    row_count: number;
    header_mode: HeaderMode;
  }
> {
  const csv = await readTextFile(args.input_path, "CSV input");
  const workbook = XLSX.read(csv, { type: "string" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("CSV input produced no worksheet.");
  }

  const worksheet = workbook.Sheets[firstSheetName];

  if (!worksheet) {
    throw new Error("CSV input produced no worksheet.");
  }

  normalizeWorksheetStringCells(worksheet);
  const headerMode = args.header_mode ?? "object";
  const rows = sheetToJson(worksheet, headerMode);
  const byteLength = await writeTextFile(
    args.output_path,
    JSON.stringify(rows, null, 2)
  );

  return {
    input_path: args.input_path,
    output_path: args.output_path,
    row_count: rowCountForSheetData(rows),
    header_mode: headerMode,
    byte_length: byteLength,
  };
}

export async function transformJsonToXlsx(
  args: JsonToXlsxArgs
): Promise<
  PathConversionResult & {
    row_count: number;
    sheet_name: string;
  }
> {
  const rows = await loadJsonRows(args.input_path);
  const sheetName = args.sheet_name ?? "Sheet1";
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  normalizeWorksheetStringCells(worksheet);

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  }) as Buffer;
  const byteLength = await writeBinaryFile(args.output_path, buffer);

  return {
    input_path: args.input_path,
    output_path: args.output_path,
    row_count: rows.length,
    sheet_name: sheetName,
    byte_length: byteLength,
  };
}

export async function transformXlsxToJson(
  args: XlsxToJsonArgs
): Promise<
  PathConversionResult & {
    header_mode: HeaderMode;
    sheet_names: string[];
    selected_sheet?: string;
    row_count?: number;
    sheet_row_counts?: Record<string, number>;
  }
> {
  const buffer = await readBinaryFile(args.input_path, "XLSX input");
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellHTML: true,
  });
  const headerMode = args.header_mode ?? "object";

  let output: unknown;
  let selectedSheet: string | undefined;
  let rowCount: number | undefined;
  let sheetRowCounts: Record<string, number> | undefined;

  if (args.all_sheets) {
    const allSheets = Object.fromEntries(
      workbook.SheetNames.map((sheetName, sheetIndex) => {
        const { worksheet } = getWorksheet(workbook, {
          sheet_name: sheetName,
          sheet_index: sheetIndex,
        });
        normalizeWorksheetStringCells(worksheet);
        const sheetData = sheetToJson(worksheet, headerMode);

        return [sheetName, sheetData];
      })
    );

    output = allSheets;
    sheetRowCounts = Object.fromEntries(
      Object.entries(allSheets).map(([sheetName, sheetData]) => [
        sheetName,
        rowCountForSheetData(sheetData as unknown[] | JsonRows),
      ])
    );
  } else {
    const { sheetName, worksheet } = getWorksheet(workbook, {
      sheet_name: args.sheet_name,
      sheet_index: args.sheet_index,
    });
    normalizeWorksheetStringCells(worksheet);
    const sheetData = sheetToJson(worksheet, headerMode);

    output = sheetData;
    selectedSheet = sheetName;
    rowCount = rowCountForSheetData(sheetData);
  }

  const byteLength = await writeTextFile(
    args.output_path,
    JSON.stringify(output, null, 2)
  );

  return {
    input_path: args.input_path,
    output_path: args.output_path,
    header_mode: headerMode,
    sheet_names: workbook.SheetNames,
    selected_sheet: selectedSheet,
    row_count: rowCount,
    sheet_row_counts: sheetRowCounts,
    byte_length: byteLength,
  };
}

export async function transformHtmlToMarkdown(
  args: HtmlToMarkdownArgs
): Promise<
  PathConversionResult & {
    line_count: number;
  }
> {
  const html = await readTextFile(args.input_path, "HTML input");
  const turndown = new TurndownService({
    headingStyle: args.heading_style,
    codeBlockStyle: args.code_block_style,
    bulletListMarker: args.bullet_list_marker,
    emDelimiter: args.em_delimiter,
    strongDelimiter: args.strong_delimiter,
    linkStyle: args.link_style,
  });
  const markdown = turndown.turndown(html);
  const byteLength = await writeTextFile(args.output_path, markdown);

  return {
    input_path: args.input_path,
    output_path: args.output_path,
    line_count: markdown === "" ? 0 : markdown.split("\n").length,
    byte_length: byteLength,
  };
}

export async function transformMarkdownToHtml(
  args: MarkdownToHtmlArgs
): Promise<
  PathConversionResult & {
    line_count: number;
  }
> {
  const markdown = await readTextFile(args.input_path, "Markdown input");
  const html = await marked.parse(markdown, {
    gfm: args.gfm ?? true,
    breaks: args.breaks ?? false,
    async: false,
  });
  const byteLength = await writeTextFile(args.output_path, html);

  return {
    input_path: args.input_path,
    output_path: args.output_path,
    line_count: html === "" ? 0 : html.split("\n").length,
    byte_length: byteLength,
  };
}
