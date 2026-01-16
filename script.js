"use strict";

/**
 * LocalStorage key
 */
const STORAGE_KEY = "flashcards_app_v1";

/**
 * App state
 */
let state = loadState() ?? {
  screen: "create", // "create" | "study"
  draft: {
    totalCards: null,
    currentIndex: 0,
  },
  cards: [], // {id, front, back, stage, nextReviewAt, createdAt, lastSeenAt}
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

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sampleN(arr, n) {
  const a = shuffle(arr);
  return a.slice(0, n);
}

/**
 * ---------- Study Logic ----------
 */
function countsByStage(cards) {
  let s1 = 0, s2 = 0, s3 = 0;
  for (const c of cards) {
    if (c.stage === 1) s1++;
    else if (c.stage === 2) s2++;
    else if (c.stage === 3) s3++;
  }
  return { s1, s2, s3, total: cards.length };
}

function pickNextCard(cards) {
  // For now: prioritize Stage 1, then Stage 2, then due Stage 3
  const now = Date.now();

  const stage1 = cards.filter(c => c.stage === 1);
  if (stage1.length) return pickLeastRecentlySeen(stage1);

  const stage2 = cards.filter(c => c.stage === 2);
  if (stage2.length) return pickLeastRecentlySeen(stage2);

  const stage3due = cards.filter(c => c.stage === 3 && (c.nextReviewAt ?? 0) <= now);
  if (stage3due.length) return pickLeastRecentlySeen(stage3due);

  return null; // none due
}

function pickLeastRecentlySeen(list) {
  // Choose among the oldest lastSeenAt (or never seen)
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

function buildMCOptions(currentCard, allCards) {
  // exactly 4 options: 1 correct + 3 wrong (random each time)
  const correct = { cardId: currentCard.id, text: currentCard.back, isCorrect: true };

  const others = allCards
    .filter(c => c.id !== currentCard.id)
    .map(c => ({ cardId: c.id, text: c.back, isCorrect: false }));

  // If fewer than 3 other cards exist, degrade gracefully by sampling what we can
  const wrongs = sampleN(others, Math.min(3, others.length));

  // If still < 3 wrongs (deck too small), we can add filler options
  while (wrongs.length < 3) {
    wrongs.push({ cardId: "filler-" + wrongs.length, text: "(Add more cards for better choices)", isCorrect: false });
  }

  return shuffle([correct, ...wrongs]);
}

function markSeen(cardId) {
  const c = state.cards.find(x => x.id === cardId);
  if (!c) return;
  c.lastSeenAt = Date.now();
}

/**
 * ---------- Rendering ----------
 */
function render() {
  if (state.screen === "create") {
    renderCreateScreen();
  } else {
    renderStudyScreen();
  }
}

function renderCreateScreen() {
  const total = state.draft.totalCards;
  const created = state.cards.length;

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
    document.getElementById("startCreate").addEventListener("click", () => {
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

    document.getElementById("resetAll").addEventListener("click", () => {
      const ok = confirm("Reset all app data? This will delete your deck progress.");
      if (ok) resetAll();
    });

    return;
  }

  const isFinished = created >= total;

  appEl.innerHTML = `
    <section class="card">
      <h2 style="margin:0 0 6px;">Create your deck</h2>

      <div class="kpi">
        <div><strong>${created}</strong> / ${total} cards saved</div>
        <div>Stage 1 needs <strong>4</strong> choices</div>
      </div>

      <hr />

      ${
        isFinished
          ? `<p class="help" style="margin-top:0;">Deck complete. You can start studying now.</p>`
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
          ? `<p class="help"><strong>Note:</strong> Stage 1 uses 4 choices (1 correct + 3 wrong). For best results, create at least <strong>4</strong> cards.</p>`
          : `<p class="help">You’re good to go for Stage 1 multiple choice.</p>`
      }
    </section>
  `;

  document.getElementById("startStudy").addEventListener("click", () => {
    if (state.cards.length === 0) {
      alert("Please create at least 1 card first.");
      return;
    }
    state.screen = "study";
    saveState();
    render();
  });

  if (isFinished) return;

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
      lastSeenAt: null,
    };

    state.cards.push(card);
    state.draft.currentIndex = state.cards.length;
    saveState();

    frontEl.value = "";
    backEl.value = "";
    frontEl.focus();

    render();
  });

  document.getElementById("finishEarly").addEventListener("click", () => {
    const ok = confirm("Finish early? You can still study with fewer cards.");
    if (!ok) return;
    state.draft.totalCards = state.cards.length;
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

function renderStudyScreen() {
  const { s1, s2, s3, total } = countsByStage(state.cards);

  const current = pickNextCard(state.cards);

  if (!current) {
    appEl.innerHTML = `
      <section class="card">
        ${renderProgressBar(s1, s2, s3, total)}
        <h2 style="margin:12px 0 8px;">No cards due</h2>
        <p class="help">You have no Stage 1 or Stage 2 cards right now, and no Stage 3 cards are due yet.</p>
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
    return;
  }

  // For now, implement Stage 1 only. If card is Stage 2/3, show placeholder.
  if (current.stage !== 1) {
    appEl.innerHTML = `
      <section class="card">
        ${renderProgressBar(s1, s2, s3, total)}
        <h2 style="margin:12px 0 8px;">Study (Stage ${current.stage})</h2>
        <p class="help"><strong>Front:</strong> ${escapeHtml(current.front)}</p>
        <p class="help">Stage ${current.stage} will be implemented next (exact recall + memorization scheduling).</p>
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
    return;
  }

  // Stage 1 (Multiple choice)
  markSeen(current.id);
  saveState();

  const options = buildMCOptions(current, state.cards);

  appEl.innerHTML = `
    <section class="card">
      ${renderProgressBar(s1, s2, s3, total)}

      <div style="display:flex; gap:10px; align-items: baseline; margin-top:12px;">
        <h2 style="margin:0;">Stage 1</h2>
        <span class="small">(Multiple choice)</span>
      </div>

      <p class="help" style="margin-top:10px;"><strong>Front:</strong> ${escapeHtml(current.front)}</p>
      <p class="help" style="margin-top:-6px;">Choose the correct definition:</p>

      <div class="row" id="mcArea" style="margin-top:10px;">
        ${options.map((opt, i) => `
          <button class="mcOpt" data-idx="${i}">${escapeHtml(opt.text)}</button>
        `).join("")}
      </div>

      <div class="btns" style="margin-top:14px;">
        <button class="danger" id="backToCreate">Back to Create</button>
      </div>

      <p class="small" style="margin-top:10px;">Stage 1 options re-randomize each time.</p>
    </section>
  `;

  document.getElementById("backToCreate").addEventListener("click", () => {
    state.screen = "create";
    saveState();
    render();
  });

  const buttons = Array.from(document.querySelectorAll(".mcOpt"));
  buttons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      const i = Number(e.currentTarget.getAttribute("data-idx"));
      const choice = options[i];

      // Apply transition:
      if (choice.isCorrect) {
        // Stage 1 success -> Stage 2
        const c = state.cards.find(x => x.id === current.id);
        if (c) c.stage = 2;
        saveState();
        renderWithFeedback(true);
      } else {
        // Stage 1 fail -> stay Stage 1
        saveState();
        renderWithFeedback(false);
      }
    });
  });

  function renderWithFeedback(correct) {
    // Re-render quickly with a small feedback message, then next card
    const { s1: ns1, s2: ns2, s3: ns3, total: ntotal } = countsByStage(state.cards);
    appEl.innerHTML = `
      <section class="card">
        ${renderProgressBar(ns1, ns2, ns3, ntotal)}
        <h2 style="margin:12px 0 8px;">${correct ? "✅ Correct" : "❌ Incorrect"}</h2>
        <p class="help"><strong>Front:</strong> ${escapeHtml(current.front)}</p>
        <p class="help"><strong>Correct definition:</strong> ${escapeHtml(current.back)}</p>
        <div class="btns">
          <button class="primary" id="nextBtn">Next</button>
          <button class="danger" id="backToCreate2">Back to Create</button>
        </div>
      </section>
    `;
    document.getElementById("nextBtn").addEventListener("click", () => {
      render();
    });
    document.getElementById("backToCreate2").addEventListener("click", () => {
      state.screen = "create";
      saveState();
      render();
    });
  }
}

function renderProgressBar(s1, s2, s3, total) {
  // widths proportional to counts
  const w1 = total ? Math.round((s1 / total) * 100) : 0;
  const w2 = total ? Math.round((s2 / total) * 100) : 0;
  const w3 = Math.max(0, 100 - w1 - w2);

  return `
    <div style="margin-bottom:12px;">
      <div class="small" style="margin-bottom:6px;">
        Stage 1: <strong>${s1}</strong> · Stage 2: <strong>${s2}</strong> · Stage 3: <strong>${s3}</strong>
      </div>
      <div style="height:14px; border:1px solid var(--border); border-radius:999px; overflow:hidden; background:#f9fafb;">
        <div style="height:100%; width:${w1}%; background:#fde68a; display:inline-block;"></div>
        <div style="height:100%; width:${w2}%; background:#bfdbfe; display:inline-block;"></div>
        <div style="height:100%; width:${w3}%; background:#bbf7d0; display:inline-block;"></div>
      </div>
      <div class="small" style="margin-top:6px;">Total cards: <strong>${total}</strong></div>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Initial render
render();
