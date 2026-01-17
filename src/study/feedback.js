import { escapeHtml } from "../utils.js";

export function renderFeedback(appEl, state, { correct, current, userAnswer }, deps) {
  const progress = deps.renderProgressBar(state);

  const safeFront = escapeHtml(current.front ?? "");
  const safeCorrect = escapeHtml(current.back ?? "");
  const safeUser = escapeHtml(userAnswer ?? "");

  appEl.innerHTML = `
    <section class="card">
      ${progress}
      <h2 style="margin:12px 0 8px;">${correct ? "✅ Correct" : "❌ Incorrect"}</h2>

      <p class="help"><strong>Front:</strong> ${safeFront}</p>

      <p class="help" style="margin-top:8px;"><strong>Answer:</strong></p>
      <div class="card" style="border-radius:10px; padding:12px; margin-top:-6px;">
        <pre style="margin:0; white-space:pre-wrap; font-family:inherit;">${safeUser}</pre>
      </div>

      <p class="help" style="margin-top:10px;"><strong>Correct Answer:</strong></p>
      <div class="card" style="border-radius:10px; padding:12px; margin-top:-6px;">
        <pre style="margin:0; white-space:pre-wrap; font-family:inherit;">${safeCorrect}</pre>
      </div>

      <div class="btns" style="margin-top:14px;">
        <button class="primary" id="nextBtn">Next</button>
        <button class="danger" id="backToCreate2">Back to Create</button>
      </div>
    </section>
  `;

  appEl.querySelector("#nextBtn").addEventListener("click", () => deps.next());
  appEl.querySelector("#backToCreate2").addEventListener("click", () => {
    deps.setScreen("create");
    deps.save();
    deps.renderAll();
  });
}
