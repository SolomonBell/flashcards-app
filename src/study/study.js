import { escapeHtml, sampleN, shuffle, pickLeastRecentlySeen, markSeen, STAGE3_INJECTION_CHANCE } from "../utils.js";
import { renderStage1 } from "./stage1.js";
import { renderRecall } from "./recall.js";

export function buildMCOptions(currentCard, allCards) {
  const correct = { text: escapeHtml(currentCard.back), isCorrect: true };

  const others = allCards
    .filter(c => c.id !== currentCard.id)
    .map(c => ({ text: escapeHtml(c.back), isCorrect: false }));

  const wrongs = sampleN(others, Math.min(3, others.length));
  while (wrongs.length < 3) {
    wrongs.push({ text: "(Add more cards for better choices)", isCorrect: false });
  }

  return shuffle([correct, ...wrongs]);
}

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

export function renderStudyScreen(appEl, state, deps) {
  const current = pickNextCard(state.cards);

  if (!current) {
    appEl.innerHTML = `
      <section class="card">
        ${deps.renderProgressBar(state)}
        <h2 style="margin:12px 0 8px;">No cards available</h2>
        <p class="help">Add some valid cards (Front + Back) to study.</p>
        <div class="btns">
          <button class="danger" id="backToCreate">Back to Create</button>
        </div>
      </section>
    `;
    appEl.querySelector("#backToCreate").addEventListener("click", () => {
      deps.setScreen("create");
      deps.save();
      deps.renderAll();
    });
    return;
  }

  // mark seen
  const inState = state.cards.find(x => x.id === current.id) ?? current;
  markSeen(inState);
  deps.save();

  // Ensure safe HTML in display fields
  const safeCurrent = {
    ...inState,
    front: escapeHtml(inState.front),
    back: escapeHtml(inState.back),
  };

  if (safeCurrent.stage === 1) {
    renderStage1(appEl, state, safeCurrent, deps);
  } else {
    renderRecall(appEl, state, safeCurrent, deps);
  }
}
