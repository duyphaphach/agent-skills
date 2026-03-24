# Utils MCP

Utils MCP is the MCP server package for local file-processing utilities.

## Tools

- `json_to_csv`
- `csv_to_json`
- `json_to_xlsx`
- `xlsx_to_json`
- `html_to_markdown`
- `markdown_to_html`

It uses:

- [`xlsx`](https://www.npmjs.com/package/xlsx) for CSV/XLSX conversions
- [`turndown`](https://www.npmjs.com/package/turndown) for HTML to Markdown
- [`marked`](https://www.npmjs.com/package/marked) for Markdown to HTML

Utils MCP supports two operating modes:

- local conversion tools accept local `input_path` and `output_path`

Runtime configuration lives in `.env`. Start from [`.env.example`](/Users/alexpham/Workspace/Personal/agent-skills/packages/utils-mcp/.env.example), which documents each variable inline.

## Folder Structure

```text
packages/utils-mcp/
├── .env.example              # Commented runtime configuration template
├── bin/
│   └── utils-mcp.js         # Published CLI entrypoint that loads dist/index.js
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
│   │   ├── file-formats/
│   │   │   ├── registerTools.ts
│   │   │   ├── schemas.ts
│   │   │   └── utils.ts     # Local file conversion tools
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

Utils MCP runs in stateless Streamable HTTP mode with JSON responses enabled. The tools still operate on paths local to the server host.

## Publish

Build the package first, then publish using your GitLab personal access token:

```bash
npm version patch --no-git-tag-version \
&& npm run build \
&& NPM_TOKEN=<YOUR_GITLAB_PAT> npm publish
```
