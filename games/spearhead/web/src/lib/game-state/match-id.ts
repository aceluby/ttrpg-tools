export function createMatchId() {
  return `match-${crypto.randomUUID().slice(0, 8)}`;
}
