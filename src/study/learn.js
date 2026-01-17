import { buildMCOptions } from "./study.js";

export function renderLearn(appEl, state, current, deps) {
  const progress = deps.renderProgressBar(state);
  const options = buildMCOptions(current, state.cards);

  appEl.innerHTML = `
    <section class="card">
      ${progress}

      <div style="display:flex; gap:10px; align-items: baseline; margin-top:12px;">
        <h2 style="margin:0;">Learn</h2>
        <span class="small">(Multiple choice)</span>
      </div>

      <p class="help" style="margin-top:10px;">
        <strong>Front:</strong> ${current.front}
      </p>

      <p class="help" style="margin-top:-6px;">
        Choose the correct definition:
      </p>

      <div style="display:grid; gap:10px; margin-top:10px;">
        ${options.map((opt, i) => `
          <button class="mcOpt" data-idx="${i}">
            ${opt.text}
          </button>
        `).join("")}
      </div>

      <div class="btns" style="margin-top:14px;">
        <button class="danger" id="backToCreate">Back to Create</button>
      </div>
    </section>
  `;

  appEl.querySelector("#backToCreate").addEventListener("click", () => {
    deps.setScreen("create");
    deps.save();
    deps.renderAll();
  });

  appEl.querySelectorAll(".mcOpt").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const i = Number(e.currentTarget.getAttribute("data-idx"));
      const choice = options[i];
  
      const c = state.cards.find(x => x.id === current.id);
      if (!c) return;
  
      if (choice.isCorrect) {
        c.stage = 2;
      }
  
      deps.save();
      deps.feedback({
        correct: Boolean(choice.isCorrect),
        current,
        userAnswer: choice.text,
        label: "Answer"
      });
    });
  });
}
