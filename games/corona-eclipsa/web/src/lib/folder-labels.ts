const FOLDER_LABELS = new Map([
  ["root", "Overview"],
  ["references", "References"],
  ["continuity", "Continuity"],
  ["plans", "Sessions"],
]);

export function getFolderLabel(folder: string) {
  return FOLDER_LABELS.get(folder) ?? folder;
}
