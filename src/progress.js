export function renderProgressBar(state) {
  const { s1, s2, s3, total } = countsByStage(state.cards);

  const yellow = state.cards.filter(c => c.stage >= 2).length;
  const blue = state.cards.filter(c => c.stage === 3).length;
  const green = state.cards.filter(c => c.stage === 3 && c.stage3Mastered).length;

  const maxChunks = total * 3;
  const filled = yellow + blue + green;
  const grey = Math.max(0, maxChunks - filled);

  const denom = maxChunks > 0 ? maxChunks : 1;

  const yellowW = (yellow / denom) * 100;
  const blueW = (blue / denom) * 100;
  const greenW = (green / denom) * 100;

  const yellowCenter = yellowW / 2;
  const blueCenter = yellowW + blueW / 2;
  const greenCenter = yellowW + blueW + greenW / 2;

  const chunks =
    Array.from({ length: yellow }, () => `<span class="chunk chunk-y"></span>`).join("") +
    Array.from({ length: blue }, () => `<span class="chunk chunk-b"></span>`).join("") +
    Array.from({ length: green }, () => `<span class="chunk chunk-g"></span>`).join("") +
    Array.from({ length: grey }, () => `<span class="chunk chunk-x"></span>`).join("");

  const styles = `
    <style>
      /* === LABEL COLORS + BLACK OUTLINE === */
      .stage1Txt{ color:#fde68a; }
      .stage2Txt{ color:#bfdbfe; }
      .stage3Txt{ color:#bbf7d0; }

      .stage1Txt,
      .stage2Txt,
      .stage3Txt{
        font-weight:800;
        -webkit-text-stroke: 0.6px #000;
        text-shadow:
          0 0 1px #000,
          0 1px 0 #000;
      }

      /* === BAR CONTAINER === */
      .chunkWrap{
        display:flex;
        width:100%;
        height:14px;
        border:2px solid #000;      /* black outline around whole bar */
        border-radius:999px;
        overflow:hidden;
        background:#f9fafb;
      }

      /* === INDIVIDUAL CHUNKS === */
      .chunk{
        flex:1 1 0;
        height:100%;
        border-right:1px solid #000; /* black dividers */
      }
      .chunk:last-child{
        border-right:none;
      }

      .chunk-y{ background:#fde68a; }
      .chunk-b{ background:#bfdbfe; }
      .chunk-g{ background:#bbf7d0; }
      .chunk-x{ background:#e5e7eb; }

      /* === LABEL POSITIONING === */
      .labelsUnderBar{
        position: relative;
        height: 18px;
        margin-top: 6px;
        font-size: 12px;
        user-select: none;
      }

      .lbl{
        position:absolute;
        top:0;
        transform: translateX(-50%);
        white-space: nowrap;
      }
    </style>
  `;

  return `
    ${styles}
    <div style="margin-bottom:12px;">
      <div class="chunkWrap">
        ${chunks}
      </div>

      <div class="labelsUnderBar">
        ${
          total > 0
            ? `
              <div class="lbl stage1Txt" style="left:${yellowCenter}%;">Stage 1: ${s1}</div>
              <div class="lbl stage2Txt" style="left:${blueCenter}%;">Stage 2: ${s2}</div>
              <div class="lbl stage3Txt" style="left:${greenCenter}%;">Stage 3: ${s3}</div>
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
