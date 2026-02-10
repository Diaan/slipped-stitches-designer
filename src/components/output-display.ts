import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Grid } from '../slipped-stitches-app';
import styles from './output-display.css?inline';

@customElement('output-display')
export class OutputDisplay extends LitElement {
  @property({ type: Array })
  pattern: Grid = [];

  @property({ type: Array })
  colors: string[] = [];

  @property({ type: String })
  foundationColor: string = '#db8fff';

  /**
   * Calculate the visual output based on the pattern and row colors.
   * For slipped stitches, we use the color from the last row where that stitch was knit.
   */
  private calculateOutput(): string[][] {
    if (!this.pattern.length || !this.colors.length) {
      return [];
    }

    const output: string[][] = [];
    const stitchCount = this.pattern[0]?.length || 0;

    // Track the last knit row for each stitch
    const lastKnitRow: number[] = Array(stitchCount).fill(-1);

    for (let rowIndex = 0; rowIndex < this.pattern.length; rowIndex++) {
      const row = this.pattern[rowIndex];
      const outputRow: string[] = [];

      for (let stitchIndex = 0; stitchIndex < row.length; stitchIndex++) {
        const cell = row[stitchIndex];

        if (cell === 'knit') {
          // This stitch is knit in this row, use current row color
          lastKnitRow[stitchIndex] = rowIndex;
          outputRow.push(this.colors[rowIndex]);
        } else {
          // This stitch is slipped, use color from last knit row or foundation
          const lastKnitRowIndex = lastKnitRow[stitchIndex];
          outputRow.push(
            lastKnitRowIndex >= 0
              ? this.colors[lastKnitRowIndex]
              : this.foundationColor
          );
        }
      }

      output.push(outputRow);
    }

    return output;
  }

  render() {
    const output = this.calculateOutput();
    // Reverse output for display (knitters work bottom-up)
    const reversedOutput = [...output].reverse();
    const stitchCount = reversedOutput[0]?.length || 0;
    // Calculate responsive cell size (min 8px, max 20px)
    const cellSize = Math.max(8, Math.min(20, Math.floor(600 / stitchCount)));

    return html`
      <div class="output-container">
        <div
          class="output-grid"
          style="grid-template-columns: repeat(${stitchCount}, ${cellSize}px)"
        >
          ${reversedOutput.map(
            (row) => html`
              ${row.map(
                (color) => html`
                  <div
                    class="output-cell"
                    style="background-color: ${color}; width: ${cellSize}px; height: ${cellSize}px"
                  ></div>
                `
              )}
            `
          )}
        </div>
      </div>
    `;
  }

  static styles = unsafeCSS(styles);
}

declare global {
  interface HTMLElementTagNameMap {
    'output-display': OutputDisplay;
  }
}
