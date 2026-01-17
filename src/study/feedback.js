import { escapeHtml } from "../utils.js";

export function renderFeedback(appEl, state, { correct, current, userAnswer }, deps) {
  const progress = deps.renderProgressBar(state);

  const safeFront = escapeHtml(current.front ?? "");
  const safeCorrect = escapeHtml(current.back ?? "");
  const safeUser = escapeHtml(userAnswer ?? "");

  appEl.innerHTML = `
    <section class="card">
      ${progress}

      <!-- Centered status -->
      <h2 style="margin:12px 0 10px; text-align:center;">
        ${correct ? "✅ Correct" : "❌ Incorrect"}
      </h2>

      <!-- Front value, larger and without label -->
      <div
        style="
          font-size:1.6rem;
          font-weight:700;
          text-align:center;
          margin:12px 0 16px;
        "
      >
        ${safeFront}
      </div>

      <div style="margin-top:6px;">
        <p class="help" style="text-align:center; margin:0 0 8px;">
          <strong>Answer</strong>
        </p>
        <div class="card" style="border-radius:10px; padding:12px;">
          <pre style="margin:0; white-space:pre-wrap; font-family:inherit;">${safeUser}</pre>
        </div>
      </div>

      <div style="margin-top:14px;">
        <p class="help" style="text-align:center; margin:0 0 8px;">
          <strong>Correct Answer</strong>
        </p>
        <div class="card" style="border-radius:10px; padding:12px;">
          <pre style="margin:0; white-space:pre-wrap; font-family:inherit;">${safeCorrect}</pre>
        </div>
      </div>

      <div class="btns" style="margin-top:16px;">
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
