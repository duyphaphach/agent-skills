import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import {
  transformCsvToJson,
  transformHtmlToMarkdown,
  transformJsonToCsv,
  transformJsonToXlsx,
  transformMarkdownToHtml,
  transformXlsxToJson,
} from "../../utils/fileTransforms.js";
import {
  csvToJsonInputSchema,
  csvToJsonOutputSchema,
  htmlToMarkdownInputSchema,
  htmlToMarkdownOutputSchema,
  jsonToCsvInputSchema,
  jsonToCsvOutputSchema,
  jsonToXlsxInputSchema,
  jsonToXlsxOutputSchema,
  markdownToHtmlInputSchema,
  markdownToHtmlOutputSchema,
  xlsxToJsonInputSchema,
  xlsxToJsonOutputSchema,
} from "./schemas.js";
import { localFileAnnotations, registerFileTool } from "../shared/registerTool.js";

export function registerFileFormatTools(server: McpServer): void {
  registerFileTool(server, {
    name: "json_to_csv",
    title: "JSON To CSV",
    description:
      "Transform a local JSON file into a local CSV file using SheetJS. Both input_path and output_path must be local filesystem paths.",
    inputSchema: jsonToCsvInputSchema,
    outputSchema: jsonToCsvOutputSchema,
    annotations: localFileAnnotations,
    handler: (args) => transformJsonToCsv(args),
  });

  registerFileTool(server, {
    name: "csv_to_json",
    title: "CSV To JSON",
    description:
      "Transform a local CSV file into a local JSON file using SheetJS. Both input_path and output_path must be local filesystem paths.",
    inputSchema: csvToJsonInputSchema,
    outputSchema: csvToJsonOutputSchema,
    annotations: localFileAnnotations,
    handler: (args) => transformCsvToJson(args),
  });

  registerFileTool(server, {
    name: "json_to_xlsx",
    title: "JSON To XLSX",
    description:
      "Transform a local JSON file into a local XLSX file using SheetJS. Both input_path and output_path must be local filesystem paths.",
    inputSchema: jsonToXlsxInputSchema,
    outputSchema: jsonToXlsxOutputSchema,
    annotations: localFileAnnotations,
    handler: (args) => transformJsonToXlsx(args),
  });

  registerFileTool(server, {
    name: "xlsx_to_json",
    title: "XLSX To JSON",
    description:
      "Transform a local XLSX file into a local JSON file using SheetJS. Both input_path and output_path must be local filesystem paths.",
    inputSchema: xlsxToJsonInputSchema,
    outputSchema: xlsxToJsonOutputSchema,
    annotations: localFileAnnotations,
    handler: (args) => transformXlsxToJson(args),
  });

  registerFileTool(server, {
    name: "html_to_markdown",
    title: "HTML To Markdown",
    description:
      "Transform a local HTML file into a local Markdown file using Turndown. Both input_path and output_path must be local filesystem paths.",
    inputSchema: htmlToMarkdownInputSchema,
    outputSchema: htmlToMarkdownOutputSchema,
    annotations: localFileAnnotations,
    handler: (args) => transformHtmlToMarkdown(args),
  });

  registerFileTool(server, {
    name: "markdown_to_html",
    title: "Markdown To HTML",
    description:
      "Transform a local Markdown file into a local HTML file. Both input_path and output_path must be local filesystem paths.",
    inputSchema: markdownToHtmlInputSchema,
    outputSchema: markdownToHtmlOutputSchema,
    annotations: localFileAnnotations,
    handler: (args) => transformMarkdownToHtml(args),
  });
}
