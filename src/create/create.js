import { uid } from "../utils.js";
import { renderCardsList, wireCardsListHandlers } from "./cardsList.js";

export function blankCard() {
  return {
    id: uid(),
    front: "",
    back: "",
    stage: 1,
    createdAt: Date.now(),
    lastSeenAt: null,
    stage3Mastered: false,
  };
}

export function getValidCards(state) {
  return state.cards.filter(c => c.front.trim() && c.back.trim());
}

export function ensureAtLeastOneCard(state, save) {
  if (state.cards.length === 0) {
    state.cards.push(blankCard());
    save();
  }
}

export function renderCreateScreen(appEl, state, { save, setScreen, renderAll, resetAll }) {
  ensureAtLeastOneCard(state, save);

  const validCount = getValidCards(state).length;
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

  appEl.querySelector("#resetAll").addEventListener("click", () => {
    if (confirm("Reset all app data? This deletes your deck + progress.")) resetAll();
  });

  appEl.querySelector("#startStudy").addEventListener("click", () => {
    const valid = getValidCards(state);
    if (valid.length < 1) {
      alert("Please fill in at least 1 card (Front and Back).");
      return;
    }
    if (valid.length < 4) {
      const ok = confirm("Stage 1 multiple choice is best with 4+ cards. Start studying anyway?");
      if (!ok) return;
    }

    // Keep only valid cards; normalize trims; keep progress
    state.cards = valid.map(c => ({
      ...c,
      front: c.front.trim(),
      back: c.back.trim(),
      stage: [1, 2, 3].includes(c.stage) ? c.stage : 1,
      stage3Mastered: Boolean(c.stage3Mastered),
    }));

    save();
    setScreen("study");
    renderAll();
  });

  function addCardAndScroll() {
    const newC = blankCard();
    state.cards.push(newC);
    save();
    renderAll();
    requestAnimationFrame(() => {
      const el = document.querySelector(`.cardRow[data-id="${newC.id}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      el?.querySelector('input[data-field="front"]')?.focus();
    });
  }

  appEl.querySelector("#addCardTop").addEventListener("click", addCardAndScroll);
  appEl.querySelector("#addCardBottom").addEventListener("click", addCardAndScroll);

  // Render list + wire handlers
  const listWrap = appEl.querySelector("#cardsList");
  listWrap.innerHTML = renderCardsList(state);

  wireCardsListHandlers(listWrap, state, {
    save,
    render: renderAll,
    blankCard
  });
}
