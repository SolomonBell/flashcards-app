import { isCorrectRecall } from "../utils.js";

export function renderRecall(appEl, state, current, { renderProgressBar, save, setScreen, renderAll, feedback }) {
  const counts = renderProgressBar(state);

  const stageLabel = current.stage === 2 ? "Stage 2" : "Stage 3";
  const stageSub = current.stage === 2 ? "(Exact recall)" : "(Memorization check)";

  appEl.innerHTML = `
    <section class="card">
      ${counts}

      <div style="display:flex; gap:10px; align-items: baseline; margin-top:12px;">
        <h2 style="margin:0;">${stageLabel}</h2>
        <span class="small">${stageSub}</span>
      </div>

      <p class="help" style="margin-top:10px;"><strong>Front:</strong> ${current.front}</p>
      <p class="help" style="margin-top:-6px;">Type the exact definition (not case sensitive):</p>

      <textarea id="recallInput" placeholder="Type the definition..."></textarea>

      <div class="btns">
        <button class="primary" id="submitRecall">Submit</button>
        <button class="danger" id="backToCreate">Back to Create</button>
      </div>
    </section>
  `;

  appEl.querySelector("#backToCreate").addEventListener("click", () => {
    setScreen("create");
    save();
    renderAll();
  });

  const inputEl = appEl.querySelector("#recallInput");
  inputEl.focus();

  inputEl.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      appEl.querySelector("#submitRecall").click();
    }
  });

  appEl.querySelector("#submitRecall").addEventListener("click", () => {
    const userAnswer = inputEl.value ?? "";
    const correct = isCorrectRecall(userAnswer, current.back);

    const c = state.cards.find(x => x.id === current.id);
    if (!c) return;

    if (c.stage === 2) {
      if (correct) {
        c.stage = 3;
        c.stage3Mastered = false;
      } else {
        c.stage = 1;
        c.stage3Mastered = false;
      }
    } else if (c.stage === 3) {
      if (correct) {
        c.stage3Mastered = true;
      } else {
        c.stage = 2;
        c.stage3Mastered = false;
      }
    }

    save();
    feedback({ correct, current, userAnswer });
  });
}
