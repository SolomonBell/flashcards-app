export function renderFeedback(appEl, state, { correct, current, userAnswer }, { renderProgressBar, save, setScreen, renderAll, next }) {
    const counts = renderProgressBar(state);
  
    appEl.innerHTML = `
      <section class="card">
        ${counts}
        <h2 style="margin:12px 0 8px;">${correct ? "✅ Correct" : "❌ Incorrect"}</h2>
  
        <p class="help"><strong>Front:</strong> ${current.front}</p>
  
        <p class="help" style="margin-top:8px;"><strong>Your answer:</strong></p>
        <div class="card" style="border-radius:10px; padding:12px; margin-top:-6px;">
          <pre style="margin:0; white-space:pre-wrap; font-family:inherit;">${String(userAnswer)}</pre>
        </div>
  
        <p class="help" style="margin-top:10px;"><strong>Correct answer:</strong></p>
        <div class="card" style="border-radius:10px; padding:12px; margin-top:-6px;">
          <pre style="margin:0; white-space:pre-wrap; font-family:inherit;">${current.back}</pre>
        </div>
  
        <div class="btns" style="margin-top:14px;">
          <button class="primary" id="nextBtn">Next</button>
          <button class="danger" id="backToCreate2">Back to Create</button>
        </div>
      </section>
    `;
  
    appEl.querySelector("#nextBtn").addEventListener("click", () => next());
    appEl.querySelector("#backToCreate2").addEventListener("click", () => {
      setScreen("create");
      save();
      renderAll();
    });
  }
  