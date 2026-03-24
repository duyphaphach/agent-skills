import { z } from "zod";

const localPathSchema = z
  .string()
  .min(1)
  .describe(
    "Local filesystem path. In HTTP mode this path is resolved on the server host, not the client machine."
  );

const outputPathSchema = z
  .string()
  .min(1)
  .describe("Local filesystem path where the tool should write its output.");

export const jsonToCsvInputSchema = z.object({
  input_path: localPathSchema.describe("Path to a local JSON file."),
  output_path: outputPathSchema.describe("Path to write the generated CSV file."),
  skip_header: z
    .boolean()
    .optional()
    .describe("When true, omit the header row in the CSV output."),
});

export const jsonToCsvOutputSchema = z.object({
  input_path: z.string(),
  output_path: z.string(),
  row_count: z.number(),
  byte_length: z.number(),
});

export const csvToJsonInputSchema = z.object({
  input_path: localPathSchema.describe("Path to a local CSV file."),
  output_path: outputPathSchema.describe("Path to write the generated JSON file."),
  header_mode: z
    .enum(["object", "array"])
    .optional()
    .describe("Use 'object' for object rows or 'array' for array-of-arrays output."),
});

export const csvToJsonOutputSchema = z.object({
  input_path: z.string(),
  output_path: z.string(),
  row_count: z.number(),
  header_mode: z.enum(["object", "array"]),
  byte_length: z.number(),
});

export const jsonToXlsxInputSchema = z.object({
  input_path: localPathSchema.describe("Path to a local JSON file."),
  output_path: outputPathSchema.describe("Path to write the generated XLSX file."),
  sheet_name: z
    .string()
    .optional()
    .describe("Worksheet name to use in the XLSX file. Defaults to Sheet1."),
});

export const jsonToXlsxOutputSchema = z.object({
  input_path: z.string(),
  output_path: z.string(),
  row_count: z.number(),
  sheet_name: z.string(),
  byte_length: z.number(),
});

export const xlsxToJsonInputSchema = z.object({
  input_path: localPathSchema.describe("Path to a local XLSX file."),
  output_path: outputPathSchema.describe("Path to write the generated JSON file."),
  sheet_name: z
    .string()
    .optional()
    .describe("Specific sheet name to read. Takes priority over sheet_index."),
  sheet_index: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("Zero-based sheet index to read when sheet_name is not provided."),
  all_sheets: z
    .boolean()
    .optional()
    .describe("When true, convert every sheet and write a JSON object keyed by sheet name."),
  header_mode: z
    .enum(["object", "array"])
    .optional()
    .describe("Use 'object' for object rows or 'array' for array-of-arrays output."),
});

export const xlsxToJsonOutputSchema = z.object({
  input_path: z.string(),
  output_path: z.string(),
  header_mode: z.enum(["object", "array"]),
  sheet_names: z.array(z.string()),
  selected_sheet: z.string().optional(),
  row_count: z.number().optional(),
  sheet_row_counts: z.record(z.number()).optional(),
  byte_length: z.number(),
});

export const htmlToMarkdownInputSchema = z.object({
  input_path: localPathSchema.describe("Path to a local HTML file."),
  output_path: outputPathSchema.describe(
    "Path to write the generated Markdown file."
  ),
  heading_style: z
    .enum(["setext", "atx"])
    .optional()
    .describe("Turndown heading style."),
  code_block_style: z
    .enum(["indented", "fenced"])
    .optional()
    .describe("Turndown code block style."),
  bullet_list_marker: z
    .enum(["-", "+", "*"])
    .optional()
    .describe("Turndown bullet list marker."),
  em_delimiter: z
    .enum(["_", "*"])
    .optional()
    .describe("Turndown emphasis delimiter."),
  strong_delimiter: z
    .enum(["**", "__"])
    .optional()
    .describe("Turndown strong delimiter."),
  link_style: z
    .enum(["inlined", "referenced"])
    .optional()
    .describe("Turndown link style."),
});

export const htmlToMarkdownOutputSchema = z.object({
  input_path: z.string(),
  output_path: z.string(),
  line_count: z.number(),
  byte_length: z.number(),
});

export const markdownToHtmlInputSchema = z.object({
  input_path: localPathSchema.describe("Path to a local Markdown file."),
  output_path: outputPathSchema.describe("Path to write the generated HTML file."),
  gfm: z
    .boolean()
    .optional()
    .describe("When true, parse Markdown using GitHub Flavored Markdown rules."),
  breaks: z
    .boolean()
    .optional()
    .describe("When true, convert single line breaks into <br> tags."),
});

export const markdownToHtmlOutputSchema = z.object({
  input_path: z.string(),
  output_path: z.string(),
  line_count: z.number(),
  byte_length: z.number(),
});
