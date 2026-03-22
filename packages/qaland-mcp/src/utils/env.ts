export function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

export function parsePositiveInteger(
  value: string | undefined,
  fallback: string,
  envName: string
): number {
  const resolvedValue = value ?? fallback;
  const parsedValue = Number.parseInt(resolvedValue, 10);

  if (Number.isNaN(parsedValue) || parsedValue <= 0) {
    throw new Error(`Invalid ${envName} value: ${resolvedValue}`);
  }

  return parsedValue;
}
