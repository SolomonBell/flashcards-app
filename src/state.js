export const STORAGE_KEY = "flashcards_app_v1";

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    // Migration: ensure stage + stage3Mastered exist
    if (parsed?.cards?.length) {
      parsed.cards = parsed.cards.map(c => ({
        ...c,
        stage: [1, 2, 3].includes(c.stage) ? c.stage : 1,
        stage3Mastered: Boolean(c.stage3Mastered),
      }));
    }

    return parsed;
  } catch {
    return null;
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function newState() {
  return {
    screen: "create", // "create" | "study"
    cards: [],
  };
}

export function resetAll(setStateAndRender) {
  localStorage.removeItem(STORAGE_KEY);
  setStateAndRender(newState());
}
