import fs from "node:fs/promises";
import path from "node:path";

import { resolveMarkdownLink, slugifyHeading } from "@/lib/markdown-links";

export type GameDoc = {
  path: string;
  title: string;
  folder: string;
  headings: DocHeading[];
};

export type DocHeading = {
  depth: number;
  text: string;
  id: string;
};

export type SearchResult = {
  path: string;
  title: string;
  folder: string;
  href: string;
  preview: string;
  targetId?: string;
  sectionId?: string;
  sectionTitle?: string;
};

type SearchResultWithScore = SearchResult & {
  score: number;
};

const GAME_ROOT = path.resolve(process.cwd(), "..");
const MD_EXT = ".md";
const ALLOWED_ROOTS = new Set(["continuity", "plans", "references"]);
const FOLDER_SORT_ORDER = new Map([
  ["root", 0],
  ["plans", 1],
  ["continuity", 2],
  ["references", 3],
]);
const SEARCH_FOLDER_ORDER = new Map([
  ["root", 0],
  ["references", 1],
  ["continuity", 2],
  ["plans", 3],
]);

function toPosix(filePath: string) {
  return filePath.split(path.sep).join(path.posix.sep);
}

function fromPosix(filePath: string) {
  return filePath.split(path.posix.sep).join(path.sep);
}

function isAllowed(relativePath: string) {
  const normalized = relativePath.replace(/^\/+/, "");

  if (normalized === "GAME.md") {
    return true;
  }

  const [topLevel] = normalized.split(path.posix.sep);
  return ALLOWED_ROOTS.has(topLevel);
}

function getTitle(markdown: string, relativePath: string) {
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading) {
    return heading;
  }

  return path.basename(relativePath, MD_EXT).replace(/[-_]/g, " ");
}

async function walkMarkdown(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "web") {
          return [];
        }
        return walkMarkdown(fullPath);
      }

      if (entry.isFile() && entry.name.endsWith(MD_EXT)) {
        return [fullPath];
      }

      return [];
    }),
  );

  return files.flat();
}

export async function listGameDocs(): Promise<GameDoc[]> {
  const files = await walkMarkdown(GAME_ROOT);
  const docs = await Promise.all(
    files.map(async (filePath) => {
      const relativePath = toPosix(path.relative(GAME_ROOT, filePath));
      if (!isAllowed(relativePath)) {
        return null;
      }

      const markdown = await fs.readFile(filePath, "utf8");
      const folder = relativePath.includes(path.posix.sep)
        ? relativePath.split(path.posix.sep)[0]
        : "root";

      return {
        path: relativePath,
        title: getTitle(markdown, relativePath),
        folder,
        headings: extractHeadings(markdown),
      } satisfies GameDoc;
    }),
  );

  return docs.filter((doc): doc is GameDoc => doc !== null).sort((a, b) => {
    if (a.folder === b.folder) {
      return compareDocsWithinFolder(a, b);
    }

    return (
      (FOLDER_SORT_ORDER.get(a.folder) ?? Number.MAX_SAFE_INTEGER)
      - (FOLDER_SORT_ORDER.get(b.folder) ?? Number.MAX_SAFE_INTEGER)
    );
  });
}

export async function readGameDoc(relativePath: string) {
  const normalized = path.posix.normalize(relativePath).replace(/^\/+/, "");
  if (!isAllowed(normalized)) {
    throw new Error(`File not allowed: ${normalized}`);
  }

  const absolutePath = path.join(GAME_ROOT, fromPosix(normalized));
  const markdown = await fs.readFile(absolutePath, "utf8");

  return {
    path: normalized,
    title: getTitle(markdown, normalized),
    markdown,
    headings: extractHeadings(markdown),
  };
}

export async function searchGameDocs(query: string, limit = 12): Promise<SearchResult[]> {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  const files = await walkMarkdown(GAME_ROOT);
  const results = await Promise.all(
    files.map(async (filePath) => {
      const relativePath = toPosix(path.relative(GAME_ROOT, filePath));
      if (!isAllowed(relativePath)) {
        return null;
      }

      const markdown = await fs.readFile(filePath, "utf8");
      const title = getTitle(markdown, relativePath);
      const folder = relativePath.includes(path.posix.sep)
        ? relativePath.split(path.posix.sep)[0]
        : "root";

      return buildSearchResult({
        folder,
        markdown,
        query: normalizedQuery,
        relativePath,
        title,
      });
    }),
  );

  const filtered: SearchResultWithScore[] = [];
  for (const result of results) {
    if (result) {
      filtered.push(result);
    }
  }

  return filtered
    .sort((a, b) => {
      const folderOrder =
        (SEARCH_FOLDER_ORDER.get(a.folder) ?? Number.MAX_SAFE_INTEGER)
        - (SEARCH_FOLDER_ORDER.get(b.folder) ?? Number.MAX_SAFE_INTEGER);

      return folderOrder || b.score - a.score || a.title.localeCompare(b.title);
    })
    .slice(0, limit)
    .map(({ score, ...result }) => {
      void score;
      return result;
    });
}

export async function writeGameDoc(relativePath: string, markdown: string) {
  const normalized = path.posix.normalize(relativePath).replace(/^\/+/, "");
  if (!isAllowed(normalized)) {
    throw new Error(`File not allowed: ${normalized}`);
  }

  const absolutePath = path.join(GAME_ROOT, fromPosix(normalized));
  await fs.writeFile(absolutePath, markdown, "utf8");
}

export { resolveMarkdownLink };

function compareDocsWithinFolder(a: GameDoc, b: GameDoc) {
  if (a.folder !== "plans") {
    return a.path.localeCompare(b.path);
  }

  const aIsHistory = a.path === "plans/session-arc-history.md";
  const bIsHistory = b.path === "plans/session-arc-history.md";

  if (aIsHistory || bIsHistory) {
    if (aIsHistory && bIsHistory) {
      return 0;
    }

    return aIsHistory ? 1 : -1;
  }

  const aDate = getPlanDatePrefix(a.path);
  const bDate = getPlanDatePrefix(b.path);

  if (aDate && bDate) {
    return bDate.localeCompare(aDate) || a.path.localeCompare(b.path);
  }

  if (aDate) {
    return -1;
  }

  if (bDate) {
    return 1;
  }

  return a.path.localeCompare(b.path);
}

function getPlanDatePrefix(filePath: string) {
  return filePath.match(/^plans\/(\d{4}-\d{2}-\d{2})-/)?.[1];
}

function extractHeadings(markdown: string): DocHeading[] {
  const matches = markdown.matchAll(/^(#{1,6})\s+(.+)$/gm);
  const seen = new Map<string, number>();

  return Array.from(matches).map((match) => {
    const depth = match[1].length;
    const text = match[2].trim();
    const baseId = slugifyHeading(text);
    const count = seen.get(baseId) ?? 0;
    seen.set(baseId, count + 1);

    return {
      depth,
      text,
      id: count === 0 ? baseId : `${baseId}-${count + 1}`,
    };
  });
}

function buildSearchResult({
  folder,
  markdown,
  query,
  relativePath,
  title,
}: {
  folder: string;
  markdown: string;
  query: string;
  relativePath: string;
  title: string;
}) {
  const lines = markdown.split(/\r?\n/);
  let activeHeading: DocHeading | undefined;
  let bestMatch:
    | {
        heading?: DocHeading;
        line: string;
        lineIndex: number;
        score: number;
      }
    | undefined;

  const seen = new Map<string, number>();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const depth = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const baseId = slugifyHeading(text);
      const count = seen.get(baseId) ?? 0;
      seen.set(baseId, count + 1);
      const id = count === 0 ? baseId : `${baseId}-${count + 1}`;
      activeHeading = { depth, text, id };
    }

    const lowerLine = line.toLowerCase();
    if (!lowerLine.includes(query)) {
      continue;
    }

    let score = 10;
    if (activeHeading && activeHeading.text.toLowerCase().includes(query)) {
      score += 8;
    }
    if (line.startsWith("#")) {
      score += 5;
    }
    if (title.toLowerCase().includes(query)) {
      score += 6;
    }

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = {
        heading: activeHeading,
        line,
        lineIndex: index,
        score,
      };
    }
  }

  if (!bestMatch && !title.toLowerCase().includes(query)) {
    return null;
  }

  const previewLine = bestMatch?.line ?? lines.find((line) => line.trim()) ?? "";
  const preview = buildPreview(previewLine, query);
  const heading = bestMatch?.heading;
  const targetId = bestMatch?.line.match(/^(#{1,6})\s+/)
    ? heading?.id
    : bestMatch
      ? `line-${bestMatch.lineIndex + 1}`
      : heading?.id;
  const href = targetId
    ? `/?file=${encodeURIComponent(relativePath)}#${targetId}`
    : `/?file=${encodeURIComponent(relativePath)}`;

  return {
    path: relativePath,
    title,
    folder,
    href,
    preview,
    targetId,
    sectionId: heading?.id,
    sectionTitle: heading?.text,
    score: bestMatch?.score ?? 6,
  };
}

function buildPreview(line: string, query: string) {
  const cleaned = line
    .replace(/^#{1,6}\s+/, "")
    .replace(/[*_`>#-]/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .trim();

  if (!cleaned) {
    return "";
  }

  const lower = cleaned.toLowerCase();
  const matchIndex = lower.indexOf(query);
  if (matchIndex === -1) {
    return cleaned.slice(0, 140);
  }

  const start = Math.max(0, matchIndex - 45);
  const end = Math.min(cleaned.length, matchIndex + query.length + 95);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < cleaned.length ? "..." : "";
  return `${prefix}${cleaned.slice(start, end).trim()}${suffix}`;
}
