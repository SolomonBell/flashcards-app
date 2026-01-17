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

  let locked = false;

  appEl.querySelectorAll(".mcOpt").forEach(btn => {
    btn.addEventListener("click", (e) => {
      if (locked) return;
      locked = true;

      const i = Number(e.currentTarget.getAttribute("data-idx"));
      const choice = options[i];

      // Disable all buttons to prevent double-clicks
      const allBtns = Array.from(appEl.querySelectorAll(".mcOpt"));
      allBtns.forEach(b => (b.disabled = true));

      // Light background feedback on the selected button
      const selectedBtn = e.currentTarget;
      if (choice.isCorrect) {
        selectedBtn.style.background = "#bbf7d0"; // light green
      } else {
        selectedBtn.style.background = "#fecaca"; // light red
      }

      const c = state.cards.find(x => x.id === current.id);
      if (!c) return;

      // Stage transitions for Learn:
      // correct -> Stage 2, incorrect -> stay Stage 1
      if (choice.isCorrect) {
        c.stage = 2;
      }

      deps.save();

      // Auto-advance on correct after a brief flash.
      if (choice.isCorrect) {
        setTimeout(() => {
          deps.renderAll(); // goes to next card
        }, 350);
        return;
      }

      // If wrong: show feedback (after brief red flash) so they see the correct answer
      setTimeout(() => {
        deps.feedback({
          correct: false,
          current,
          userAnswer: choice.text
        });
      }, 350);
    });
  });
}
