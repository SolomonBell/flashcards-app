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
          <button class="danger" id="resetAll">Reset</button>
        </div>
      </div>

      <div class="deckStats" style="margin-top:10px;">
        <div>Total cards: <strong>${totalCount}</strong></div>
      </div>

      <div id="cardsList" style="margin-top:12px;"></div>

      <!-- Bottom action row -->
      <div class="btns" style="margin-top:16px; justify-content:space-between;">
        <button class="primary" id="startStudy" ${validCount < 1 ? "disabled" : ""}>
          Start Studying
        </button>
        <button class="primary" id="addCardBottom">
          Add Card
        </button>
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

  function addCardAndScrollToTop() {
    const newC = blankCard();
    state.cards.unshift(newC); // add at top
    save();
    renderAll();

    requestAnimationFrame(() => {
      const el = document.querySelector(`.cardRow[data-id="${newC.id}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      el?.querySelector('textarea[data-field="front"]')?.focus();
    });
  }

  appEl.querySelector("#addCardBottom").addEventListener("click", addCardAndScrollToTop);

  // Render list + wire handlers
  const listWrap = appEl.querySelector("#cardsList");
  listWrap.innerHTML = renderCardsList(state);

  wireCardsListHandlers(listWrap, state, {
    save,
    render: renderAll,
    blankCard,
  });
}
