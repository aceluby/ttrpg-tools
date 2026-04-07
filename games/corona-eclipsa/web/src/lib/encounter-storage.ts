import fs from "node:fs/promises";
import path from "node:path";

const GAME_ROOT = path.resolve(process.cwd(), "..");
const ENCOUNTERS_DIR = path.join(GAME_ROOT, "encounters");

export type SavedEncounterFile = {
  file: string;
  name: string;
  updatedAt: string;
};

export async function listEncounterFiles(): Promise<SavedEncounterFile[]> {
  await fs.mkdir(ENCOUNTERS_DIR, { recursive: true });
  const entries = await fs.readdir(ENCOUNTERS_DIR, { withFileTypes: true });

  const files = await Promise.all(entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map(async (entry) => {
      const absolutePath = path.join(ENCOUNTERS_DIR, entry.name);
      const stats = await fs.stat(absolutePath);

      return {
        file: entry.name,
        name: entry.name.replace(/\.json$/i, "").replace(/[-_]/g, " "),
        updatedAt: stats.mtime.toISOString(),
      } satisfies SavedEncounterFile;
    }));

  return files.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function readEncounterFile(fileName: string) {
  const safeName = sanitizeEncounterFileName(fileName);
  const absolutePath = path.join(ENCOUNTERS_DIR, safeName);
  const contents = await fs.readFile(absolutePath, "utf8");
  return JSON.parse(contents) as unknown;
}

export async function writeEncounterFile(fileName: string, data: unknown) {
  const safeName = sanitizeEncounterFileName(fileName);
  await fs.mkdir(ENCOUNTERS_DIR, { recursive: true });
  const absolutePath = path.join(ENCOUNTERS_DIR, safeName);
  await fs.writeFile(absolutePath, JSON.stringify(data, null, 2), "utf8");
  return safeName;
}

export async function deleteEncounterFile(fileName: string) {
  const safeName = sanitizeEncounterFileName(fileName);
  const absolutePath = path.join(ENCOUNTERS_DIR, safeName);
  await fs.rm(absolutePath, { force: true });
  return safeName;
}

function sanitizeEncounterFileName(fileName: string) {
  const base = fileName
    .trim()
    .toLowerCase()
    .replace(/\.json$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!base) {
    throw new Error("Encounter name is required.");
  }

  return `${base}.json`;
}
