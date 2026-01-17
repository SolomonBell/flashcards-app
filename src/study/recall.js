import { escapeHtml } from "../utils.js";

export function renderRecall(appEl, state, current, deps) {
  const progress = deps.renderProgressBar(state);

  appEl.innerHTML = `
    <section class="card">
      ${progress}

      <h2 style="margin:12px 0 6px;">Recall</h2>

      <p class="help" style="margin-top:10px;">
        <strong>Front:</strong> ${current.front}
      </p>

      <textarea
        id="recallInput"
        placeholder="Answer here..."
        style="width:100%; min-height:90px; margin-top:12px;"
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

    const correctAnswer = current.back.trim();

    const normalize = s =>
      s
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

    const isCorrect = normalize(userAnswer) === normalize(correctAnswer);

    const c = state.cards.find(x => x.id === current.id);
    if (!c) return;

    if (c.stage === 2) {
      if (isCorrect) {
        c.stage = 3;
      } else {
        c.stage = 1;
      }
    } else if (c.stage === 3) {
      if (!isCorrect) {
        c.stage = 2;
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
