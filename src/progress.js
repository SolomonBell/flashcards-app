export function renderProgressBar(state) {
  const { s1, s2, s3, total } = countsByStage(state.cards);

  // Progress chunk logic (your current system):
  // Yellow chunk = passed Learn (stage >= 2)
  // Blue chunk   = passed Stage 2 (stage === 3)
  // Green chunk  = passed Stage 3 check at least once (stage3Mastered)
  const yellow = state.cards.filter(c => c.stage >= 2).length;
  const blue = state.cards.filter(c => c.stage === 3).length;
  const green = state.cards.filter(c => c.stage === 3 && c.stage3Mastered).length;

  const maxChunks = total * 3;
  const filled = yellow + blue + green;
  const grey = Math.max(0, maxChunks - filled);

  // Ordered: all yellow then blue then green then grey
  const chunks =
    Array.from({ length: yellow }, () => `<span class="chunk chunk-y"></span>`).join("") +
    Array.from({ length: blue }, () => `<span class="chunk chunk-b"></span>`).join("") +
    Array.from({ length: green }, () => `<span class="chunk chunk-g"></span>`).join("") +
    Array.from({ length: grey }, () => `<span class="chunk chunk-x"></span>`).join("");

  // IMPORTANT: label colors now exactly match bar colors
  const styles = `
    <style>
      .stage1Txt{ color:#fde68a; font-weight:800; }
      .stage2Txt{ color:#bfdbfe; font-weight:800; }
      .stage3Txt{ color:#bbf7d0; font-weight:800; }

      /* helps light colors stay readable */
      .stage1Txt, .stage2Txt, .stage3Txt {
        text-shadow: 0 1px 0 rgba(0,0,0,0.25);
      }

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
        Total cards: <strong>${total}</strong>
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
