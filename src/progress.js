export function renderProgressBar(state) {
    const { s1, s2, s3, total } = countsByStage(state.cards);
  
    const yellow = state.cards.filter(c => c.stage >= 2).length;
    const blue = state.cards.filter(c => c.stage === 3).length;
    const green = state.cards.filter(c => c.stage === 3 && c.stage3Mastered).length;
  
    const maxChunks = total * 3;
    const filled = yellow + blue + green;
    const grey = Math.max(0, maxChunks - filled);
  
    const chunks =
      Array.from({ length: yellow }, () => `<span class="chunk chunk-y"></span>`).join("") +
      Array.from({ length: blue }, () => `<span class="chunk chunk-b"></span>`).join("") +
      Array.from({ length: green }, () => `<span class="chunk chunk-g"></span>`).join("") +
      Array.from({ length: grey }, () => `<span class="chunk chunk-x"></span>`).join("");
  
    const styles = `
      <style>
        .stage1Txt{ color:#b45309; font-weight:700; }
        .stage2Txt{ color:#1d4ed8; font-weight:700; }
        .stage3Txt{ color:#15803d; font-weight:700; }
  
        .chunkWrap{
          display:flex; width:100%; height:14px;
          border:1px solid var(--border);
          border-radius:999px;
          overflow:hidden;
          background:#f9fafb;
        }
        .chunk{
          flex: 1 1 0;
          height:100%;
          border-right:1px solid rgba(17,24,39,0.08);
        }
        .chunk:last-child{ border-right:none; }
        .chunk-y{ background:#fde68a; }
        .chunk-b{ background:#bfdbfe; }
        .chunk-g{ background:#bbf7d0; }
        .chunk-x{ background:#e5e7eb; }
      </style>
    `;
  
    return `
      ${styles}
      <div style="margin-bottom:12px;">
        <div class="small" style="margin-bottom:6px;">
          Stage 1: <span class="stage1Txt">${s1}</span> ·
          Stage 2: <span class="stage2Txt">${s2}</span> ·
          Stage 3: <span class="stage3Txt">${s3}</span>
        </div>
  
        <div class="chunkWrap" title="Total chunks: ${maxChunks}. Filled: ${filled}. Grey: ${grey}">
          ${chunks}
        </div>
  
        <div class="small" style="margin-top:6px;">
          Progress chunks: <span class="stage1Txt">${yellow}</span>Y +
          <span class="stage2Txt">${blue}</span>B +
          <span class="stage3Txt">${green}</span>G =
          <strong>${filled}</strong> / ${maxChunks}
        </div>
      </div>
    `;
  }
  
  export function countsByStage(cards) {
    let s1 = 0, s2 = 0, s3 = 0;
    for (const c of cards) {
      if (c.stage === 1) s1++;
      else if (c.stage === 2) s2++;
      else if (c.stage === 3) s3++;
    }
    return { s1, s2, s3, total: cards.length };
  }
  