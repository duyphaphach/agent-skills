import fsExtra from "fs-extra";

const { outputFile, readFile } = fsExtra;

export async function readTextFile(
  inputPath: string,
  label: string
): Promise<string> {
  try {
    return await readFile(inputPath, "utf8");
  } catch (error) {
    throw new Error(
      `Failed to read ${label} at ${inputPath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function readBinaryFile(
  inputPath: string,
  label: string
): Promise<Buffer> {
  try {
    return await readFile(inputPath);
  } catch (error) {
    throw new Error(
      `Failed to read ${label} at ${inputPath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function writeTextFile(
  outputPath: string,
  content: string
): Promise<number> {
  await outputFile(outputPath, content, "utf8");
  return Buffer.byteLength(content, "utf8");
}

export async function writeBinaryFile(
  outputPath: string,
  content: Buffer
): Promise<number> {
  await outputFile(outputPath, content);
  return content.byteLength;
}
