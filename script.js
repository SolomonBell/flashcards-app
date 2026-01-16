"use strict";

const STORAGE_KEY = "flashcards_app_v1";

// How often to "inject" a Stage 3 (memorized) card during normal study.
// 0.20 = ~20% of prompts become Stage 3 if any exist.
const STAGE3_INJECTION_CHANCE = 0.20;

let state = loadState() ?? {
  screen: "create", // "create" | "study"
  cards: [],        // {id, front, back, stage, createdAt, lastSeenAt}
};

const appEl = document.getElementById("app");

/* ---------------- Utilities ---------------- */
function uid() {
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

// NOT case sensitive, otherwise exact (trim ends only)
function normalizeForExactNoCase(s) {
  return String(s ?? "").trim().toLowerCase();
}

function isCorrectRecall(userAnswer, correctAnswer) {
  return normalizeForExactNoCase(userAnswer) === normalizeForExactNoCase(correctAnswer);
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
    createdAt: Date.now(),
    lastSeenAt: null,
  };
}

function getValidCards() {
  return state.cards.filter(c => c.front.trim() && c.back.trim());
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

// Stage 3 should appear randomly throughout study, and forever if all are Stage 3.
function pickNextCard(cards) {
  const stage1 = cards.filter(c => c.stage === 1);
  const stage2 = cards.filter(c => c.stage === 2);
  const stage3 = cards.filter(c => c.stage === 3);

  if (stage1.length === 0 && stage2.length === 0) {
    return stage3.length ? pickLeastRecentlySeen(stage3) : null;
  }

  if (stage3.length > 0 && Math.random() < STAGE3_INJECTION_CHANCE) {
    return pickLeastRecentlySeen(stage3);
  }

  if (stage1.length) return pickLeastRecentlySeen(stage1);
  if (stage2.length) return pickLeastRecentlySeen(stage2);

  return stage3.length ? pickLeastRecentlySeen(stage3) : null;
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

/* -------- Create Screen -------- */
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
      const ok = confirm("Stage 1 multiple choice is best with 4+ cards. Start studying anyway?");
      if (!ok) return;
    }

    state.cards = valid.map(c => ({
      ...c,
      front: c.front.trim(),
      back: c.back.trim(),
      stage: [1, 2, 3].includes(c.stage) ? c.stage : 1,
    }));

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

  listEl.querySelectorAll("input[data-field], textarea[data-field]").forEach(el => {
    el.addEventListener("input", (e) => {
      const row = e.target.closest(".cardRow");
      const id = row.getAttribute("data-id");
      const field = e.target.getAttribute("data-field");
      const card = state.cards.find(x => x.id === id);
      if (!card) return;
      card[field] = e.target.value;
      saveState();
      renderCreateScreen();
    });
  });

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

  requestAnimationFrame(() => {
    const el = document.querySelector(`.cardRow[data-id="${newCard.id}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    el?.querySelector('input[data-field="front"]')?.focus();
  });
}

/* -------- Study Screen -------- */
function renderStudyScreen() {
  const counts = countsByStage(state.cards);
  const current = pickNextCard(state.cards);

  if (!current) {
    appEl.innerHTML = `
      <section class="card">
        ${renderProgressBar(counts)}
        <h2 style="margin:12px 0 8px;">No cards available</h2>
        <p class="help">Add some valid cards (Front + Back) to study.</p>
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

  if (current.stage === 1) renderStage1(current);
  else renderRecall(current);
}

function renderStage1(current) {
  const counts = countsByStage(state.cards);
  const options = buildMCOptions(current, state.cards);

  appEl.innerHTML = `
    <section class="card">
      ${renderProgressBar(counts)}

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

  document.querySelectorAll(".mcOpt").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const i = Number(e.currentTarget.getAttribute("data-idx"));
      const choice = options[i];

      if (choice.isCorrect) {
        const c = state.cards.find(x => x.id === current.id);
        if (c) c.stage = 2;
        saveState();
        renderFeedback({ correct: true, current, userAnswer: "(multiple choice)" });
      } else {
        saveState();
        renderFeedback({ correct: false, current, userAnswer: "(multiple choice)" });
      }
    });
  });
}

function renderRecall(current) {
  const counts = countsByStage(state.cards);

  const stageLabel = current.stage === 2 ? "Stage 2" : "Stage 3";
  const stageSub = current.stage === 2 ? "(Exact recall)" : "(Memorization check)";

  appEl.innerHTML = `
    <section class="card">
      ${renderProgressBar(counts)}

      <div style="display:flex; gap:10px; align-items: baseline; margin-top:12px;">
        <h2 style="margin:0;">${stageLabel}</h2>
        <span class="small">${stageSub}</span>
      </div>

      <p class="help" style="margin-top:10px;"><strong>Front:</strong> ${escapeHtml(current.front)}</p>
      <p class="help" style="margin-top:-6px;">Type the exact definition (not case sensitive):</p>

      <textarea id="recallInput" placeholder="Type the definition..."></textarea>

      <div class="btns">
        <button class="primary" id="submitRecall">Submit</button>
        <button class="danger" id="backToCreate">Back to Create</button>
      </div>

      <p class="small" style="margin-top:10px;">
        Matching rule: case-insensitive; otherwise exact (leading/trailing spaces ignored).
      </p>
    </section>
  `;

  document.getElementById("backToCreate").addEventListener("click", () => {
    state.screen = "create";
    saveState();
    render();
  });

  const inputEl = document.getElementById("recallInput");
  inputEl.focus();

  inputEl.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      document.getElementById("submitRecall").click();
    }
  });

  document.getElementById("submitRecall").addEventListener("click", () => {
    const userAnswer = inputEl.value ?? "";
    const correct = isCorrectRecall(userAnswer, current.back);

    const c = state.cards.find(x => x.id === current.id);
    if (!c) return;

    if (c.stage === 2) {
      if (correct) c.stage = 3;
      else c.stage = 1;
    } else if (c.stage === 3) {
      if (correct) c.stage = 3;
      else c.stage = 2;
    }

    saveState();
    renderFeedback({ correct, current, userAnswer });
  });
}

function renderFeedback({ correct, current, userAnswer }) {
  const counts = countsByStage(state.cards);

  appEl.innerHTML = `
    <section class="card">
      ${renderProgressBar(counts)}
      <h2 style="margin:12px 0 8px;">${correct ? "✅ Correct" : "❌ Incorrect"}</h2>

      <p class="help"><strong>Front:</strong> ${escapeHtml(current.front)}</p>

      <p class="help" style="margin-top:8px;"><strong>Your answer:</strong></p>
      <div class="card" style="border-radius:10px; padding:12px; margin-top:-6px;">
        <pre style="margin:0; white-space:pre-wrap; font-family:inherit;">${escapeHtml(String(userAnswer))}</pre>
      </div>

      <p class="help" style="margin-top:10px;"><strong>Correct answer:</strong></p>
      <div class="card" style="border-radius:10px; padding:12px; margin-top:-6px;">
        <pre style="margin:0; white-space:pre-wrap; font-family:inherit;">${escapeHtml(current.back)}</pre>
      </div>

      <div class="btns" style="margin-top:14px;">
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

/* ---------------- NEW PROGRESS BAR (chunk-based) ---------------- */
function renderProgressBar({ s1, s2, s3, total }) {
  // Chunk logic:
  // Yellow chunks: every card has Stage 1 done -> total
  // Blue chunks: cards that have reached Stage 2 or 3 -> s2 + s3
  // Green chunks: cards in Stage 3 -> s3
  const yellow = total;
  const blue = s2 + s3;
  const green = s3;

  const maxChunks = total * 3;
  const filled = yellow + blue + green;
  const grey = Math.max(0, maxChunks - filled);

  // Build HTML chunks (ordered: all yellow then blue then green then grey)
  const chunks = []
    .concat(Array.from({ length: yellow }, () => `<span class="chunk chunk-y"></span>`))
    .concat(Array.from({ length: blue }, () => `<span class="chunk chunk-b"></span>`))
    .concat(Array.from({ length: green }, () => `<span class="chunk chunk-g"></span>`))
    .concat(Array.from({ length: grey }, () => `<span class="chunk chunk-x"></span>`))
    .join("");

  // Inline styles so you don't have to touch CSS right now
  const styles = `
    <style>
      .stage1Txt{ color:#b45309; font-weight:600; }   /* yellow-ish */
      .stage2Txt{ color:#1d4ed8; font-weight:600; }   /* blue */
      .stage3Txt{ color:#15803d; font-weight:600; }   /* green */

      .chunkWrap{
        display:flex;
        flex-wrap:nowrap;
        overflow:hidden;
        border:1px solid var(--border);
        border-radius:999px;
        background:#f9fafb;
        height:14px;
      }
      .chunk{
        display:inline-block;
        height:100%;
        width:10px;               /* chunk width */
        border-right:1px solid rgba(17,24,39,0.08);
      }
      .chunk-y{ background:#fde68a; } /* yellow */
      .chunk-b{ background:#bfdbfe; } /* blue */
      .chunk-g{ background:#bbf7d0; } /* green */
      .chunk-x{ background:#e5e7eb; } /* grey */
      .chunk:last-child{ border-right:none; }
    </style>
  `;

  return `
    ${styles}
    <div style="margin-bottom:12px;">
      <div class="small" style="margin-bottom:6px;">
        Stage 1: <span class="stage1Txt">${s1}</span> ·
        Stage 2: <span class="stage2Txt">${s2}</span> ·
        Stage 3: <span class="stage3Txt">${s3}</span>
      </div>

      <div class="chunkWrap" title="Total chunks: ${maxChunks}. Filled: ${filled}. Grey: ${grey}">
        ${chunks}
      </div>

      <div class="small" style="margin-top:6px;">
        Total cards: <strong>${total}</strong> · Total progress chunks: <strong>${maxChunks}</strong>
      </div>
    </div>
  `;
}

/* Initial render */
render();
