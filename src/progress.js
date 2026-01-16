export function renderProgressBar(state) {
  const { s1, s2, s3, total } = countsByStage(state.cards);

  // Chunk progress logic:
  // Yellow chunk = passed Learn (stage >= 2)
  // Blue chunk   = passed Stage 2 (stage === 3)
  // Green chunk  = passed Stage 3 check at least once (stage3Mastered)
  const yellow = state.cards.filter(c => c.stage >= 2).length;
  const blue = state.cards.filter(c => c.stage === 3).length;
  const green = state.cards.filter(c => c.stage === 3 && c.stage3Mastered).length;

  const maxChunks = total * 3;
  const filled = yellow + blue + green;
  const grey = Math.max(0, maxChunks - filled);

  // Guard against divide-by-zero (e.g., no cards)
  const denom = maxChunks > 0 ? maxChunks : 1;

  // Segment widths (%)
  const yellowW = (yellow / denom) * 100;
  const blueW = (blue / denom) * 100;
  const greenW = (green / denom) * 100;

  // Centers (% from left) for labels to sit under each colored segment
  const yellowCenter = yellowW / 2;
  const blueCenter = yellowW + blueW / 2;
  const greenCenter = yellowW + blueW + greenW / 2;

  // Ordered chunks: yellow then blue then green then grey
  const chunks =
    Array.from({ length: yellow }, () => `<span class="chunk chunk-y"></span>`).join("") +
    Array.from({ length: blue }, () => `<span class="chunk chunk-b"></span>`).join("") +
    Array.from({ length: green }, () => `<span class="chunk chunk-g"></span>`).join("") +
    Array.from({ length: grey }, () => `<span class="chunk chunk-x"></span>`).join("");

  const styles = `
    <style>
      .stage1Txt{ color:#fde68a; font-weight:800; }
      .stage2Txt{ color:#bfdbfe; font-weight:800; }
      .stage3Txt{ color:#bbf7d0; font-weight:800; }

      /* Light colors need contrast on white */
      .stage1Txt, .stage2Txt, .stage3Txt {
        text-shadow: 0 1px 0 rgba(0,0,0,0.25);
      }

      .chunkWrap{
        display:flex;
        width:100%;
        height:14px;
        border:1px solid var(--border);
        border-radius:999px;
        overflow:hidden;
        background:#f9fafb;
      }
      .chunk{
        flex: 1 1 0;              /* makes it one continuous full-width bar */
        height:100%;
        border-right:1px solid rgba(17,24,39,0.08);
      }
      .chunk:last-child{ border-right:none; }
      .chunk-y{ background:#fde68a; }
      .chunk-b{ background:#bfdbfe; }
      .chunk-g{ background:#bbf7d0; }
      .chunk-x{ background:#e5e7eb; }

      .labelsUnderBar{
        position: relative;
        height: 18px;
        margin-top: 6px;
        font-size: 12px;
        color: var(--muted);
      }
      .lbl{
        position:absolute;
        top:0;
        transform: translateX(-50%);
        white-space: nowrap;
        user-select: none;
      }
    </style>
  `;

  // If a segment is 0-width, centering would place labels on boundaries and can overlap.
  // We'll still render them (matches your request), but only if there are cards total.
  const showLabels = total > 0;

  return `
    ${styles}
    <div style="margin-bottom:12px;">
      <div class="chunkWrap" title="Total chunks: ${maxChunks}. Filled: ${filled}. Grey: ${grey}">
        ${chunks}
      </div>

      <div class="labelsUnderBar">
        ${
          showLabels
            ? `
              <div class="lbl stage1Txt" style="left:${yellowCenter}%;"><span>Stage 1: ${s1}</span></div>
              <div class="lbl stage2Txt" style="left:${blueCenter}%;"><span>Stage 2: ${s2}</span></div>
              <div class="lbl stage3Txt" style="left:${greenCenter}%;"><span>Stage 3: ${s3}</span></div>
            `
            : ``
        }
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
