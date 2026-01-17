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

  const mcWrap = appEl.querySelector("#mcWrap");
  const buttons = Array.from(appEl.querySelectorAll(".mcOpt"));

  // step: "answer" -> waiting for first click
  // step: "revealing" -> showing correct option after delay
  // step: "ready" -> next click advances
  let step = "answer";

  function setAllButtonsUnclickableLook() {
    // Makes it feel like you already "answered", but still clickable for next-step
    buttons.forEach(b => {
      b.style.opacity = "0.95";
    });
  }

  function revealCorrect() {
    buttons.forEach((b, i) => {
      if (options[i].isCorrect) {
        b.style.background = "#bbf7d0"; // light green
      }
    });
  }

  // Second click: anywhere inside mcWrap advances, but only when step === "ready"
  mcWrap.addEventListener("click", (e) => {
    if (step !== "ready") return;

    // Only advance if they clicked on a button (keeps it intuitive)
    const btn = e.target.closest(".mcOpt");
    if (!btn) return;

    deps.renderAll();
  });

  buttons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      // If already ready, do nothing here — mcWrap handles advancing
      if (step !== "answer") return;

      step = "revealing";

      const idx = Number(btn.getAttribute("data-idx"));
      const choice = options[idx];

      // Immediate color on the clicked option
      if (choice.isCorrect) {
        btn.style.background = "#bbf7d0"; // light green
      } else {
        btn.style.background = "#fecaca"; // light red
      }

      setAllButtonsUnclickableLook();

      // Apply Learn-stage logic immediately
      const c = state.cards.find(x => x.id === current.id);
      if (!c) return;

      if (choice.isCorrect) {
        c.stage = 2; // correct -> Stage 2
      }
      // wrong stays Stage 1
      deps.save();

      // After short delay, show the correct one green (especially useful when wrong)
      setTimeout(() => {
        revealCorrect();
        step = "ready";
        // Optional: subtle hint by changing cursor
        buttons.forEach(b => (b.style.cursor = "pointer"));
      }, 300);
    });
  });
}
