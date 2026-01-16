export const STAGE3_INJECTION_CHANCE = 0.20;

export function uid() {
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

export function normalizeForExactNoCase(s) {
  return String(s ?? "").trim().toLowerCase();
}

export function isCorrectRecall(userAnswer, correctAnswer) {
  return normalizeForExactNoCase(userAnswer) === normalizeForExactNoCase(correctAnswer);
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sampleN(arr, n) {
  return shuffle(arr).slice(0, n);
}

export function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function pickLeastRecentlySeen(list) {
  let best = list[0];
  let bestSeen = best.lastSeenAt ?? 0;
  for (const c of list) {
    const seen = c.lastSeenAt ?? 0;
    if (seen < bestSeen) {
      best = c;
      bestSeen = seen;
    }
  }
  return best;
}

export function markSeen(card) {
  card.lastSeenAt = Date.now();
}
