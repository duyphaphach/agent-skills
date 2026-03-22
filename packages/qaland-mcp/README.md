# QALand MCP

QALand MCP is the MCP server package for QALand's local file-processing utilities and Dify knowledge/workflow integrations.

## Tool Groups

File format processing:

- `json_to_csv`
- `csv_to_json`
- `json_to_xlsx`
- `xlsx_to_json`
- `html_to_markdown`
- `markdown_to_html`

Dify knowledge and workflow:

- `dify_retrieve_knowledge_chunks`
- `dify_execute_workflow`
- `dify_add_document_chunks`
- `dify_delete_document_chunk`
- `dify_delete_child_chunk`
- `dify_get_document_chunk`
- `dify_get_child_chunks`
- `dify_get_document_chunks`
- `dify_update_document_chunk`
- `dify_create_document_from_file`
- `dify_create_document_from_text`
- `dify_delete_document`
- `dify_get_document_detail`
- `dify_get_document_embedding_status`
- `dify_list_documents`
- `dify_update_document_with_file`
- `dify_update_document_with_text`
- `dify_update_document_status`

QA knowledge aggregation:

- `qaland_collect_manual_test_context`
- `qaland_get_test_case_examples`
- `qaland_get_project_messages`
- `qaland_get_project_sms`
- `qaland_get_project_emails`
- `qaland_get_project_srs`

It uses:

- [`xlsx`](https://www.npmjs.com/package/xlsx) for CSV/XLSX conversions
- [`turndown`](https://www.npmjs.com/package/turndown) for HTML to Markdown
- [`marked`](https://www.npmjs.com/package/marked) for Markdown to HTML

QALand MCP supports two operating modes:

- local conversion tools accept local `input_path` and `output_path`
- Dify file upload tools accept local `file_path` on the MCP server host
- Dify credentials and connection settings come from env vars, not tool args
- tool responses return structured API metadata rather than copying large payloads into prompts

Runtime configuration lives in `.env`. Start from [`.env.example`](/Users/alexpham/Workspace/_ekotek/ekotek-skills/packages/qaland-mcp/.env.example), which documents each variable inline.

## Folder Structure

```text
packages/qaland-mcp/
├── .env.example              # Commented runtime configuration template
├── QA Knowledge Aggregator.yml # Source Dify workflow used to derive qaland_* QA tools
├── bin/
│   └── qaland-mcp.js        # Published CLI entrypoint that loads dist/index.js
├── dist/                    # Compiled output consumed by the CLI and package users
├── src/
│   ├── index.ts             # Main entrypoint, selects stdio or HTTP mode
│   ├── utils/
│   │   ├── env.ts
│   │   ├── fileTransforms.ts
│   │   ├── formatResult.ts
│   │   └── localFiles.ts    # Shared filesystem and output utilities
│   ├── server/
│   │   ├── createServer.ts
│   │   ├── httpConstants.ts
│   │   ├── startHttpServer.ts
│   │   └── startStdioServer.ts
│   │                        # MCP server construction and transport startup
│   ├── tools/
│   │   ├── registerTools.ts # Central tool-group registration
│   │   ├── dify/
│   │   │   ├── client.ts
│   │   │   ├── config.ts
│   │   │   ├── httpClient.ts
│   │   │   ├── registerTools.ts
│   │   │   ├── schemas.ts
│   │   │   └── utils.ts     # Generic Dify knowledge/workflow integration
│   │   ├── file-formats/
│   │   │   ├── registerTools.ts
│   │   │   ├── schemas.ts
│   │   │   └── utils.ts     # Local file conversion tools
│   │   └── qaland-qa/
│   │       ├── config.ts
│   │       ├── client.ts
│   │       ├── registerTools.ts
│   │       ├── schemas.ts
│   │       └── utils.ts     # QA-specific retrieval and context aggregation
│   └── types/
│       └── conversion.ts    # Shared conversion-oriented types
├── package.json             # Package metadata, scripts, and dependencies
└── tsconfig.json            # TypeScript compiler configuration
```

## Install

```bash
npm install
```

## Build

```bash
npm run build
```

## Run Local

```bash
npm run dev
```

This starts the stdio MCP server directly from TypeScript source. Make sure `.env` is populated before running it.

## Run Over HTTP

```bash
MCP_TRANSPORT=http HOST=127.0.0.1 PORT=3000 npm run dev
```

Endpoints:

- `POST /mcp`
- `GET /health`

QALand MCP runs in stateless Streamable HTTP mode with JSON responses enabled. The tools still operate on paths local to the server host.

## Publish

Build the package first, then publish using your GitLab personal access token:

```bash
npm version patch --no-git-tag-version \
&& npm run build \
&& NPM_TOKEN=<YOUR_GITLAB_PAT> npm publish
```
