import { buildMCOptions } from "./study.js";

export function renderStage1(appEl, state, current, { renderProgressBar, save, setScreen, renderAll, feedback }) {
  const counts = renderProgressBar(state);
  const options = buildMCOptions(current, state.cards);

  appEl.innerHTML = `
    <section class="card">
      ${counts}

      <div style="display:flex; gap:10px; align-items: baseline; margin-top:12px;">
        <h2 style="margin:0;">Stage 1</h2>
        <span class="small">(Multiple choice)</span>
      </div>

      <p class="help" style="margin-top:10px;"><strong>Front:</strong> ${current.front}</p>
      <p class="help" style="margin-top:-6px;">Choose the correct definition:</p>

      <div style="display:grid; gap:10px; margin-top:10px;">
        ${options.map((opt, i) => `
          <button class="mcOpt" data-idx="${i}">${opt.text}</button>
        `).join("")}
      </div>

      <div class="btns" style="margin-top:14px;">
        <button class="danger" id="backToCreate">Back to Create</button>
      </div>
    </section>
  `;

  appEl.querySelector("#backToCreate").addEventListener("click", () => {
    setScreen("create");
    save();
    renderAll();
  });

  appEl.querySelectorAll(".mcOpt").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const i = Number(e.currentTarget.getAttribute("data-idx"));
      const choice = options[i];

      const c = state.cards.find(x => x.id === current.id);
      if (!c) return;

      if (choice.isCorrect) c.stage = 2; // pass -> stage 2
      save();

      feedback({
        correct: Boolean(choice.isCorrect),
        current,
        userAnswer: "(multiple choice)"
      });
    });
  });
}
