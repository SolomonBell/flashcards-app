"use strict";

/**
 * LocalStorage key
 */
const STORAGE_KEY = "flashcards_app_v1";

/**
 * App state
 */
let state = loadState() ?? {
  screen: "create", // "create" | "study" (study later)
  draft: {
    totalCards: null,
    currentIndex: 0,
  },
  cards: [], // {id, front, back, stage, nextReviewAt, createdAt}
};

const appEl = document.getElementById("app");

/**
 * ---------- Utilities ----------
 */
function uid() {
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

function normalizeText(s) {
  return (s ?? "").trim();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function resetAll() {
  localStorage.removeItem(STORAGE_KEY);
  state = {
    screen: "create",
    draft: { totalCards: null, currentIndex: 0 },
    cards: [],
  };
  render();
}

/**
 * ---------- Rendering ----------
 */
function render() {
  if (state.screen === "create") {
    renderCreateScreen();
  } else {
    // Study screen comes next
    appEl.innerHTML = `
      <section class="card">
        <h2 style="margin:0 0 8px;">Study Mode (next step)</h2>
        <p class="help">We’ll implement Stage 1/2/3 after Create Deck is solid.</p>
        <div class="btns">
          <button class="danger" id="backToCreate">Back to Create</button>
        </div>
      </section>
    `;
    document.getElementById("backToCreate").addEventListener("click", () => {
      state.screen = "create";
      saveState();
      render();
    });
  }
}

function renderCreateScreen() {
  const total = state.draft.totalCards;
  const idx = state.draft.currentIndex; // 0-based
  const created = state.cards.length;

  // If no total set yet, show "How many cards?"
  if (!Number.isFinite(total) || total === null) {
    appEl.innerHTML = `
      <section class="card">
        <h2 style="margin:0 0 12px;">Create your deck</h2>

        <label class="label" for="numCards">How many flashcards?</label>
        <input id="numCards" type="number" min="1" step="1" placeholder="e.g., 20" />

        <div class="btns">
          <button class="primary" id="startCreate">Start</button>
          <button class="danger" id="resetAll">Reset app data</button>
        </div>

        <p class="help">
          You’ll enter the <strong>front</strong> and <strong>back</strong> for each card, then start studying.
        </p>
      </section>
    `;

    const numInput = document.getElementById("numCards");
    const startBtn = document.getElementById("startCreate");
    const resetBtn = document.getElementById("resetAll");

    startBtn.addEventListener("click", () => {
      const n = Number(numInput.value);
      if (!Number.isInteger(n) || n <= 0) {
        alert("Please enter a valid number of cards (1 or more).");
        return;
      }

      state.draft.totalCards = n;
      state.draft.currentIndex = 0;
      state.cards = [];
      saveState();
      render();
    });

    resetBtn.addEventListener("click", () => {
      const ok = confirm("Reset all app data? This will delete your deck progress.");
      if (ok) resetAll();
    });

    return;
  }

  // Total is set: show entry form
  const isFinished = created >= total;

  appEl.innerHTML = `
    <section class="card">
      <h2 style="margin:0 0 6px;">Create your deck</h2>

      <div class="kpi">
        <div><strong>${created}</strong> / ${total} cards saved</div>
        <div>Minimum for multiple choice later: <strong>4</strong></div>
      </div>

      <hr />

      ${
        isFinished
          ? `
            <p class="help" style="margin-top:0;">
              Deck complete. You can start studying now.
            </p>
          `
          : `
            <p class="help" style="margin-top:0;">
              Enter card <strong>${created + 1}</strong> of <strong>${total}</strong>.
            </p>

            <div class="row two">
              <div>
                <label class="label" for="frontInput">Front</label>
                <input id="frontInput" type="text" placeholder="Term / question" />
                <p class="small">Example: “Photosynthesis”</p>
              </div>
              <div>
                <label class="label" for="backInput">Back</label>
                <textarea id="backInput" placeholder="Definition / answer"></textarea>
                <p class="small">Example: “Process by which plants convert light into energy.”</p>
              </div>
            </div>

            <div class="btns">
              <button class="primary" id="saveCard">Save card</button>
              <button id="finishEarly">Finish early</button>
              <button class="danger" id="startOver">Start over</button>
            </div>
          `
      }

      <div class="btns" style="margin-top: 14px;">
        <button class="primary" id="startStudy" ${created < 1 ? "disabled" : ""}>Start studying</button>
      </div>

      ${
        created < 4
          ? `<p class="help"><strong>Note:</strong> Stage 1 uses 4 choices (1 correct + 3 wrong). For the cleanest experience, create at least <strong>4</strong> cards.</p>`
          : `<p class="help">You’re good to go for Stage 1 multiple choice once Study Mode is implemented.</p>`
      }
    </section>
  `;

  // Buttons that always exist on this screen:
  document.getElementById("startStudy").addEventListener("click", () => {
    if (state.cards.length === 0) {
      alert("Please create at least 1 card first.");
      return;
    }
    state.screen = "study";
    saveState();
    render();
  });

  // If finished, we don’t attach entry handlers
  if (isFinished) {
    // Still allow "start over" via reset app data path
    return;
  }

  const frontEl = document.getElementById("frontInput");
  const backEl = document.getElementById("backInput");

  document.getElementById("saveCard").addEventListener("click", () => {
    const front = normalizeText(frontEl.value);
    const back = normalizeText(backEl.value);

    if (!front || !back) {
      alert("Please fill in both Front and Back.");
      return;
    }

    const card = {
      id: uid(),
      front,
      back,
      stage: 1,
      nextReviewAt: null,
      createdAt: Date.now(),
    };

    state.cards.push(card);
    state.draft.currentIndex = state.cards.length; // keep consistent
    saveState();

    // Clear inputs
    frontEl.value = "";
    backEl.value = "";
    frontEl.focus();

    render(); // refresh counts and next index
  });

  document.getElementById("finishEarly").addEventListener("click", () => {
    const ok = confirm("Finish early? You can still study with fewer cards.");
    if (!ok) return;
    state.draft.totalCards = state.cards.length; // lock in what you have
    saveState();
    render();
  });

  document.getElementById("startOver").addEventListener("click", () => {
    const ok = confirm("Start over? This clears your current deck.");
    if (!ok) return;
    state.draft.totalCards = null;
    state.draft.currentIndex = 0;
    state.cards = [];
    saveState();
    render();
  });
}

// Initial render
render();
