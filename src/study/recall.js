import { escapeHtml } from "../utils.js";

export function renderRecall(appEl, state, current, deps) {
  const progress = deps.renderProgressBar(state);

  appEl.innerHTML = `
    <section class="card">
      ${progress}

      <h2 style="margin:12px 0 10px; text-align:center;">Recall</h2>

      <div
        style="
          font-size:1.6rem;
          font-weight:700;
          text-align:center;
          margin:12px 0 16px;
        "
      >
        ${escapeHtml(current.front)}
      </div>

      <textarea
        id="recallInput"
        placeholder="Answer here..."
        style="width:100%; min-height:90px; margin-top:8px;"
      ></textarea>

      <div class="btns" style="margin-top:14px;">
        <button class="primary" id="submitRecall">Submit</button>
        <button class="danger" id="backToCreate">Back to Create</button>
      </div>
    </section>
  `;

  appEl.querySelector("#backToCreate").addEventListener("click", () => {
    deps.setScreen("create");
    deps.save();
    deps.renderAll();
  });

  appEl.querySelector("#submitRecall").addEventListener("click", () => {
    const inputEl = appEl.querySelector("#recallInput");
    const userAnswer = inputEl.value.trim();

    if (!userAnswer) {
      alert("Please enter an answer.");
      return;
    }

    const correctAnswer = (current.back ?? "").trim();

    // Case-insensitive, exact otherwise (allows "Hello" == "hello" but not "h ello")
    const normalize = (s) => String(s).trim().toLowerCase();
    const isCorrect = normalize(userAnswer) === normalize(correctAnswer);

    const c = state.cards.find(x => x.id === current.id);
    if (!c) return;

    if (c.stage === 2) {
      if (isCorrect) {
        // Stage 2 pass -> Stage 3 (blue earned); green not yet
        c.stage = 3;
        c.stage3Mastered = false;
      } else {
        // Stage 2 fail -> back to Learn; lose green
        c.stage = 1;
        c.stage3Mastered = false;
      }
    } else if (c.stage === 3) {
      if (isCorrect) {
        // ✅ This is what makes GREEN appear
        c.stage3Mastered = true;
      } else {
        // Stage 3 fail -> drop to Stage 2 and lose green
        c.stage = 2;
        c.stage3Mastered = false;
      }
    }

    deps.save();
    deps.feedback({
      correct: isCorrect,
      current,
      userAnswer
    });
  });
}
