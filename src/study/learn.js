import { buildMCOptions } from "./study.js";

export function renderLearn(appEl, state, current, deps) {
  const progress = deps.renderProgressBar(state);
  const options = buildMCOptions(current, state.cards);

  appEl.innerHTML = `
    <section class="card">
      ${progress}

      <h2 style="margin:12px 0 10px; text-align:center;">Learn</h2>

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

      <div id="mcWrap" style="display:grid; gap:10px;">
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

  let resolved = false;

  const buttons = Array.from(appEl.querySelectorAll(".mcOpt"));

  buttons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      if (resolved) {
        // After reveal, clicking anywhere advances
        deps.renderAll();
        return;
      }

      resolved = true;

      const i = Number(e.currentTarget.getAttribute("data-idx"));
      const choice = options[i];

      // Disable all buttons
      buttons.forEach(b => (b.disabled = true));

      const selectedBtn = e.currentTarget;

      // Immediate feedback on selection
      if (choice.isCorrect) {
        selectedBtn.style.background = "#bbf7d0"; // light green
      } else {
        selectedBtn.style.background = "#fecaca"; // light red
      }

      const c = state.cards.find(x => x.id === current.id);
      if (!c) return;

      // Learn stage logic
      if (choice.isCorrect) {
        c.stage = 2;
      }

      deps.save();

      // After delay, reveal the correct answer in green
      setTimeout(() => {
        buttons.forEach((b, idx) => {
          if (options[idx].isCorrect) {
            b.style.background = "#bbf7d0"; // light green
          }
        });
      }, 350);
    });
  });
}
