export type JsonRecord = Record<string, unknown>;

export type JsonRows = JsonRecord[];

export type HeaderMode = "object" | "array";

export type HeadingStyle = "setext" | "atx";

export type CodeBlockStyle = "indented" | "fenced";

export type BulletListMarker = "-" | "+" | "*";

export type EmDelimiter = "_" | "*";

export type StrongDelimiter = "**" | "__";

export type LinkStyle = "inlined" | "referenced";

export type PathConversionResult = {
  input_path: string;
  output_path: string;
  byte_length: number;
};

export type JsonToCsvArgs = {
  input_path: string;
  output_path: string;
  skip_header?: boolean;
};

export type CsvToJsonArgs = {
  input_path: string;
  output_path: string;
  header_mode?: HeaderMode;
};

export type JsonToXlsxArgs = {
  input_path: string;
  output_path: string;
  sheet_name?: string;
};

export type XlsxToJsonArgs = {
  input_path: string;
  output_path: string;
  sheet_name?: string;
  sheet_index?: number;
  all_sheets?: boolean;
  header_mode?: HeaderMode;
};

export type HtmlToMarkdownArgs = {
  input_path: string;
  output_path: string;
  heading_style?: HeadingStyle;
  code_block_style?: CodeBlockStyle;
  bullet_list_marker?: BulletListMarker;
  em_delimiter?: EmDelimiter;
  strong_delimiter?: StrongDelimiter;
  link_style?: LinkStyle;
};

export type MarkdownToHtmlArgs = {
  input_path: string;
  output_path: string;
  gfm?: boolean;
  breaks?: boolean;
};
