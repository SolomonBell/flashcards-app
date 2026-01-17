import { buildMCOptions } from "./study.js";

export function renderLearn(appEl, state, current, deps) {
  const progress = deps.renderProgressBar(state);
  const options = buildMCOptions(current, state.cards);

  appEl.innerHTML = `
    <section class="card">
      ${progress}

      <!-- Centered stage title -->
      <h2 style="margin:12px 0 10px; text-align:center;">Learn</h2>

      <!-- Front prompt: large, bold, centered -->
      <div
        style="
          font-size:1.6rem;
          font-weight:700;
          text-align:center;
          margin:12px 0 18px;
        "
      >
        ${current.front}
      </div>

      <p class="help" style="text-align:center; margin-bottom:10px;">
        Choose the correct answer:
      </p>

      <div style="display:grid; gap:10px;">
        ${options.map((opt, i) => `
          <button class="mcOpt" data-idx="${i}">
            ${opt.text}
          </button>
        `).join("")}
      </div>

      <div class="btns" style="margin-top:16px;">
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

      // Learn: correct → Stage 2, incorrect → stay Stage 1
      if (choice.isCorrect) {
        c.stage = 2;
      }

      deps.save();
      deps.feedback({
        correct: Boolean(choice.isCorrect),
        current,
        userAnswer: choice.text
      });
    });
  });
}
