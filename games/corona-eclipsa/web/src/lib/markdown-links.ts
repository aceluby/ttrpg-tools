const MD_EXT = ".md";
const ALLOWED_ROOTS = new Set(["continuity", "plans", "references"]);
const SEP = "/";

function isAllowed(relativePath: string) {
  const normalized = relativePath.replace(/^\/+/, "");

  if (normalized === "GAME.md") {
    return true;
  }

  const [topLevel] = normalized.split(SEP);
  return ALLOWED_ROOTS.has(topLevel);
}

function dirname(filePath: string) {
  const normalized = filePath.replace(/^\/+/, "");
  const lastSlash = normalized.lastIndexOf(SEP);
  return lastSlash === -1 ? "" : normalized.slice(0, lastSlash);
}

function normalizePath(filePath: string) {
  const parts = filePath.split(SEP);
  const output: string[] = [];

  for (const part of parts) {
    if (!part || part === ".") {
      continue;
    }

    if (part === "..") {
      output.pop();
      continue;
    }

    output.push(part);
  }

  return output.join(SEP);
}

export function resolveMarkdownLink(currentFile: string, href: string) {
  if (!href || href.startsWith("http://") || href.startsWith("https://")) {
    return href;
  }

  const [rawPath, hash] = href.split("#");
  if (!rawPath) {
    return `/?file=${encodeURIComponent(currentFile)}${hash ? `#${hash}` : ""}`;
  }

  const currentDir = dirname(currentFile);
  const resolvedPath = rawPath.startsWith("/")
    ? rawPath.replace(/^\/+/, "")
    : normalizePath([currentDir, rawPath].filter(Boolean).join(SEP));

  if (!resolvedPath.endsWith(MD_EXT) || !isAllowed(resolvedPath)) {
    return href;
  }

  return `/?file=${encodeURIComponent(resolvedPath)}${hash ? `#${hash}` : ""}`;
}

export function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[`"'.,!?()[\]{}]/g, "")
    .replace(/[^a-z0-9\s/-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
