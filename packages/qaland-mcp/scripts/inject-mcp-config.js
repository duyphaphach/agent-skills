import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

function log(message) {
  console.log(`[qaland-mcp-inject-config] ${message}`);
}

function fail(message) {
  console.error(`[qaland-mcp-inject-config] ${message}`);
  process.exit(1);
}

function getArgValue(flag) {
  const index = process.argv.findIndex((arg) => arg === flag);

  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function readConfigFile(configPath) {
  if (!fs.existsSync(configPath)) {
    return { mcpServers: {} };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return parsed && typeof parsed === "object" ? parsed : { mcpServers: {} };
  } catch (error) {
    fail(
      `Invalid JSON in ${configPath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

function formatSourcePath(filePath) {
  return /^[A-Za-z0-9_./-]+$/.test(filePath)
    ? filePath
    : `"${filePath.replace(/(["\\$`])/g, "\\$1")}"`;
}

function formatNodePath(filePath) {
  return `"${filePath.replace(/(["\\$`])/g, "\\$1")}"`;
}

function createPosixServerConfig(workspaceFolder) {
  const envFilePath = path.join(workspaceFolder, ".env");
  const qalandScriptPath = path.join(
    workspaceFolder,
    "bin",
    "qaland-mcp.js"
  );

  return {
    command: "sh",
    args: [
      "-c",
      `set -a && . ${formatSourcePath(
        envFilePath
      )} && set +a && node ${formatNodePath(qalandScriptPath)}`,
    ],
  };
}

function createWindowsServerConfig(workspaceFolder) {
  const envFilePath = path.join(workspaceFolder, ".env").replace(/'/g, "''");
  const qalandScriptPath = path
    .join(
      workspaceFolder,
      "bin",
      "qaland-mcp.js"
    )
    .replace(/'/g, "''");

  return {
    command: "powershell.exe",
    args: [
      "-NoProfile",
      "-Command",
      [
        `Get-Content '${envFilePath}' | ForEach-Object {`,
        "  if ($_ -match '^\\s*#' -or $_ -match '^\\s*$') { return }",
        "  $name, $value = $_ -split '=', 2",
        "  if ($name) { [Environment]::SetEnvironmentVariable($name.Trim(), ($value ?? '').Trim(), 'Process') }",
        "}",
        `node '${qalandScriptPath}'`,
      ].join(" "),
    ],
  };
}

function createServerConfig(workspaceFolder) {
  if (process.platform === "win32") {
    return createWindowsServerConfig(workspaceFolder);
  }

  return createPosixServerConfig(workspaceFolder);
}

function writeConfigFile(configPath, serverName, serverConfig) {
  ensureDirectory(path.dirname(configPath));

  const existing = readConfigFile(configPath);
  const merged = {
    ...existing,
    mcpServers: {
      ...(existing.mcpServers || {}),
      [serverName]: serverConfig,
    },
  };

  fs.writeFileSync(configPath, `${JSON.stringify(merged, null, 2)}\n`, {
    mode: 0o644,
  });
  log(`updated ${configPath} with server ${serverName}`);
}

function main() {
  const workspaceFolder = path.resolve(
    getArgValue("--workspace-folder") ?? process.cwd()
  );
  const serverName = getArgValue("--server-name") ?? "qaland-mcp-test";
  const serverConfig = createServerConfig(workspaceFolder);
  const persistentPaths = [
    path.join(os.homedir(), ".mcp_servers.json"),
    path.join(os.homedir(), ".config", "mcp", "mcp_servers.json"),
  ];

  for (const targetPath of persistentPaths) {
    writeConfigFile(targetPath, serverName, serverConfig);
  }
}

main();
