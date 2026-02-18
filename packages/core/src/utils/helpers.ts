import * as path from "path";
import * as crypto from "crypto";

let counter = 0;

export function generateId(prefix: string = "node"): string {
  counter++;
  return `${prefix}_${counter}`;
}

export function resetIdCounter(): void {
  counter = 0;
}

export function generateEdgeId(
  source: string,
  target: string,
  type: string,
): string {
  const hash = crypto
    .createHash("md5")
    .update(`${source}:${target}:${type}`)
    .digest("hex")
    .slice(0, 8);
  return `edge_${hash}`;
}

export function normalizePath(filePath: string, rootDir: string): string {
  return path.relative(rootDir, filePath).replace(/\\/g, "/");
}

export function isNodeModule(filePath: string): boolean {
  return filePath.includes("node_modules");
}

export function isTestFile(filePath: string): boolean {
  return (
    filePath.includes(".spec.") ||
    filePath.includes(".test.") ||
    filePath.includes("__tests__")
  );
}

export function sanitizeText(text: string): string {
  return text.replace(/['"]/g, "").trim();
}

export function combinePaths(...parts: string[]): string {
  const combined = parts
    .map((p) => p.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
  return "/" + combined;
}

export function resolveImportPath(
  currentFile: string,
  importPath: string,
  rootDir: string,
): string {
  if (importPath.startsWith(".")) {
    const dir = path.dirname(currentFile);
    return path.resolve(dir, importPath);
  }
  return importPath;
}
