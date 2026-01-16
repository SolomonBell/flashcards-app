"use strict";

const STORAGE_KEY = "flashcards_app_v1";

let state = loadState() ?? {
  screen: "create", // "create" | "study"
  cards: [],        // {id, front, back, stage, nextReviewAt, createdAt, lastSeenAt}
};

const appEl = document.getElementById("app");

/* ---------------- Utilities ---------------- */
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
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function resetAll() {
  localStorage.removeItem(STORAGE_KEY);
  state = { screen: "create", cards: [] };
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
  return shuffle(arr).slice(0, n);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ---------------- Create Deck (Quizlet-style) ---------------- */
function ensureAtLeastOneCard() {
  if (state.cards.length === 0) {
    state.cards.push(blankCard());
    saveState();
  }
}

function blankCard() {
  return {
    id: uid(),
    front: "",
    back: "",
    stage: 1,
    nextReviewAt: null,
    createdAt: Date.now(),
    lastSeenAt: null,
  };
}

function getValidCards() {
  return state.cards.filter(c => normalizeText(c.front) && normalizeText(c.back));
}

/* ---------------- Study Logic ---------------- */
function countsByStage(cards) {
  let s1 = 0, s2 = 0, s3 = 0;
  for (const c of cards) {
    if (c.stage === 1) s1++;
    else if (c.stage === 2) s2++;
    else if (c.stage === 3) s3++;
  }
  return { s1, s2, s3, total: cards.length };
}

function pickLeastRecentlySeen(list) {
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

function pickNextCard(cards) {
  const now = Date.now();
  const stage1 = cards.filter(c => c.stage === 1);
  if (stage1.length) return pickLeastRecentlySeen(stage1);

  const stage2 = cards.filter(c => c.stage === 2);
  if (stage2.length) return pickLeastRecentlySeen(stage2);

  const stage3due = cards.filter(c => c.stage === 3 && (c.nextReviewAt ?? 0) <= now);
  if (stage3due.length) return pickLeastRecentlySeen(stage3due);

  return null;
}

function buildMCOptions(currentCard, allCards) {
  const correct = { cardId: currentCard.id, text: currentCard.back, isCorrect: true };

  const others = allCards
    .filter(c => c.id !== currentCard.id)
    .map(c => ({ cardId: c.id, text: c.back, isCorrect: false }));

  const wrongs = sampleN(others, Math.min(3, others.length));

  while (wrongs.length < 3) {
    wrongs.push({
      cardId: "filler-" + wrongs.length,
      text: "(Add more cards for better choices)",
      isCorrect: false
    });
  }

  return shuffle([correct, ...wrongs]);
}

function markSeen(cardId) {
  const c = state.cards.find(x => x.id === cardId);
  if (!c) return;
  c.lastSeenAt = Date.now();
}

/* ---------------- Rendering ---------------- */
function render() {
  if (state.screen === "create") renderCreateScreen();
  else renderStudyScreen();
}

function renderCreateScreen() {
  ensureAtLeastOneCard();

  const validCount = getValidCards().length;
  const totalCount = state.cards.length;

  appEl.innerHTML = `
    <section class="card">
      <div class="deckTop">
        <h2 style="margin:0;">Create your deck</h2>
        <div class="btns" style="margin-top:0;">
          <button class="primary" id="addCardTop">Add card</button>
          <button class="danger" id="resetAll">Reset</button>
        </div>
      </div>

      <div class="deckStats" style="margin-top:10px;">
        <div>Valid cards: <strong>${validCount}</strong></div>
        <div>Total rows: <strong>${totalCount}</strong></div>
        <div>Stage 1 works best with <strong>4+</strong> valid cards</div>
      </div>

      <p class="help">
        Scroll and edit all cards here (Quizlet-style). “Start studying” uses only cards with both Front and Back filled in.
      </p>

      <div class="btns">
        <button class="primary" id="startStudy" ${validCount < 1 ? "disabled" : ""}>Start studying</button>
      </div>

      <div id="cardsList"></div>

      <div class="btns" style="margin-top:14px;">
        <button class="primary" id="addCardBottom">Add card</button>
      </div>
    </section>
  `;

  document.getElementById("resetAll").addEventListener("click", () => {
    if (confirm("Reset all app data? This deletes your deck + progress.")) resetAll();
  });

  document.getElementById("addCardTop").addEventListener("click", () => addCardAndScroll());
  document.getElementById("addCardBottom").addEventListener("click", () => addCardAndScroll());

  document.getElementById("startStudy").addEventListener("click", () => {
    const valid = getValidCards();
    if (valid.length < 1) {
      alert("Please fill in at least 1 card (Front and Back).");
      return;
    }
    if (valid.length < 4) {
      const ok = confirm(
        "Stage 1 multiple choice is best with 4+ cards. Start studying anyway?"
      );
      if (!ok) return;
    }

    // IMPORTANT: Study should operate on valid cards only.
    // Easiest: remove invalid rows before study.
    state.cards = valid.map(c => ({
      ...c,
      front: normalizeText(c.front),
      back: normalizeText(c.back),
    }));
    // Ensure all cards have stage initialized
    state.cards.forEach(c => { if (![1,2,3].includes(c.stage)) c.stage = 1; });

    saveState();
    state.screen = "study";
    saveState();
    render();
  });

  renderCardsList();
}

function renderCardsList() {
  const listEl = document.getElementById("cardsList");

  listEl.innerHTML = state.cards.map((c, idx) => `
    <div class="cardRow" data-id="${c.id}">
      <div class="cardRowHeader">
        <div class="idx">Card ${idx + 1}</div>
        <div class="btns" style="margin-top:0;">
          <button class="danger" data-action="delete">Delete</button>
        </div>
      </div>

      <div class="cardRowGrid">
        <div>
          <label class="label">Front</label>
          <input type="text" data-field="front" value="${escapeHtml(c.front)}" placeholder="Term / question" />
        </div>
        <div>
          <label class="label">Back</label>
          <textarea data-field="back" placeholder="Definition / answer">${escapeHtml(c.back)}</textarea>
        </div>
      </div>
    </div>
  `).join("");

  // Input handlers (auto-save)
  listEl.querySelectorAll("input[data-field], textarea[data-field]").forEach(el => {
    el.addEventListener("input", (e) => {
      const row = e.target.closest(".cardRow");
      const id = row.getAttribute("data-id");
      const field = e.target.getAttribute("data-field");
      const card = state.cards.find(x => x.id === id);
      if (!card) return;
      card[field] = e.target.value;
      saveState();

      // Update header stats without re-rendering everything:
      // simplest: re-render create screen (still fast for small decks)
      renderCreateScreen();
    });
  });

  // Delete handlers
  listEl.querySelectorAll('button[data-action="delete"]').forEach(btn => {
    btn.addEventListener("click", (e) => {
      const row = e.target.closest(".cardRow");
      const id = row.getAttribute("data-id");
      const card = state.cards.find(x => x.id === id);
      if (!card) return;

      if (!confirm("Delete this card?")) return;
      state.cards = state.cards.filter(x => x.id !== id);
      if (state.cards.length === 0) state.cards.push(blankCard());
      saveState();
      renderCreateScreen();
    });
  });
}

function addCardAndScroll() {
  const newCard = blankCard();
  state.cards.push(newCard);
  saveState();
  renderCreateScreen();

  // Scroll to the new card
  requestAnimationFrame(() => {
    const el = document.querySelector(`.cardRow[data-id="${newCard.id}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    const input = el?.querySelector('input[data-field="front"]');
    input?.focus();
  });
}

/* ---------------- Study Screen (Stage 1 remains) ---------------- */
function renderStudyScreen() {
  const { s1, s2, s3, total } = countsByStage(state.cards);
  const current = pickNextCard(state.cards);

  if (!current) {
    appEl.innerHTML = `
      <section class="card">
        ${renderProgressBar(s1, s2, s3, total)}
        <h2 style="margin:12px 0 8px;">No cards due</h2>
        <p class="help">No Stage 1/2 cards and no Stage 3 cards are due yet.</p>
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

  if (current.stage !== 1) {
    appEl.innerHTML = `
      <section class="card">
        ${renderProgressBar(s1, s2, s3, total)}
        <h2 style="margin:12px 0 8px;">Study (Stage ${current.stage})</h2>
        <p class="help"><strong>Front:</strong> ${escapeHtml(current.front)}</p>
        <p class="help">Stage 2/3 will be implemented next (exact recall + memorization scheduling).</p>
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

      <div style="display:grid; gap:10px; margin-top:10px;">
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

      if (choice.isCorrect) {
        const c = state.cards.find(x => x.id === current.id);
        if (c) c.stage = 2;
        saveState();
        renderWithFeedback(true);
      } else {
        saveState();
        renderWithFeedback(false);
      }
    });
  });

  function renderWithFeedback(correct) {
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
    document.getElementById("nextBtn").addEventListener("click", () => render());
    document.getElementById("backToCreate2").addEventListener("click", () => {
      state.screen = "create";
      saveState();
      render();
    });
  }
}

function renderProgressBar(s1, s2, s3, total) {
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

/* Initial render */
render();
