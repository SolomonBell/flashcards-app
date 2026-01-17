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

  const buttons = Array.from(appEl.querySelectorAll(".mcOpt"));

  // Two-step state machine for this card:
  // step = "answer" -> first click shows feedback
  // step = "advance" -> second click moves to next card
  let step = "answer";
  let revealTimerDone = false;

  function goNext() {
    deps.renderAll();
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idx = Number(e.currentTarget.getAttribute("data-idx"));
      const choice = options[idx];

      // SECOND CLICK: advance (only after reveal completes)
      if (step === "advance") {
        goNext();
        return;
      }

      // FIRST CLICK: show feedback
      step = "advance";

      // Disable buttons so they don't look clickable for choosing again
      // But they still receive click events; that's okay because we use "step".
      buttons.forEach(b => {
        b.disabled = true;
        b.style.cursor = "pointer"; // still feels like "tap to continue"
      });

      // Immediate color on chosen option
      const selectedBtn = e.currentTarget;
      if (choice.isCorrect) {
        selectedBtn.style.background = "#bbf7d0"; // light green
      } else {
        selectedBtn.style.background = "#fecaca"; // light red
      }

      // Apply stage logic immediately (no waiting)
      const c = state.cards.find(x => x.id === current.id);
      if (!c) return;

      if (choice.isCorrect) {
        c.stage = 2; // correct in Learn -> Stage 2
      }
      // wrong stays stage 1
      deps.save();

      // After a brief delay, reveal the correct answer in green (especially useful when wrong)
      setTimeout(() => {
        buttons.forEach((b, i) => {
          if (options[i].isCorrect) {
            b.style.background = "#bbf7d0"; // light green
          }
        });

        // Now the user can click again to continue (step already set)
        revealTimerDone = true;
      }, 300);
    });
  });

  // Extra safety: if user clicks extremely fast (double click),
  // the second click might happen before the reveal shows.
  // We ensure they only advance after reveal delay completes.
  function guardAdvanceClicks() {
    if (step !== "advance") return;
    if (!revealTimerDone) return;
  }

  // Patch: override advance behavior to wait for reveal completion.
  buttons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      if (step === "advance" && !revealTimerDone) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    }, true);
  });
}
