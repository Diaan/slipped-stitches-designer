import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Grid } from '../slipped-stitches-app';

@customElement('output-display')
export class OutputDisplay extends LitElement {
  @property({ type: Array })
  pattern: Grid = [];

  @property({ type: Array })
  colors: string[] = [];

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
          // This stitch is slipped, use color from last knit row
          const lastKnitRowIndex = lastKnitRow[stitchIndex];
          outputRow.push(
            lastKnitRowIndex >= 0 ? this.colors[lastKnitRowIndex] : '#cccccc'
          );
        }
      }

      output.push(outputRow);
    }

    return output;
  }

  render() {
    const output = this.calculateOutput();
    const stitchCount = output[0]?.length || 0;

    return html`
      <div class="output-container">
        <div
          class="output-grid"
          style="grid-template-columns: repeat(${stitchCount}, 20px)"
        >
          ${output.map(
            (row) => html`
              ${row.map(
                (color) => html`
                  <div
                    class="output-cell"
                    style="background-color: ${color}"
                  ></div>
                `
              )}
            `
          )}
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }

    .output-container {
      display: flex;
      justify-content: center;
    }

    .output-grid {
      display: grid;
      gap: 1px;
      background-color: #ccc;
      border: 1px solid #999;
      width: fit-content;
    }

    .output-cell {
      width: 20px;
      height: 20px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'output-display': OutputDisplay;
  }
}
