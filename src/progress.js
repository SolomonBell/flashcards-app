export function renderProgressBar(state) {
  const total = state.cards.length;

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
      .chunkWrap{
        display:flex;
        width:100%;
        height:14px;
        border:2px solid #000;       /* outer black outline */
        border-radius:999px;
        overflow:hidden;
        background:#f9fafb;
        margin-bottom:12px;
      }

      .chunk{
        flex:1 1 0;
        height:100%;
        border-right:1px solid #000; /* black dividers */
      }

      .chunk:last-child{
        border-right:none;
      }

      .chunk-y{ background:#fde68a; } /* yellow */
      .chunk-b{ background:#bfdbfe; } /* blue */
      .chunk-g{ background:#bbf7d0; } /* green */
      .chunk-x{ background:#e5e7eb; } /* grey */
    </style>
  `;

  return `
    ${styles}
    <div class="chunkWrap">
      ${chunks}
    </div>
  `;
}
