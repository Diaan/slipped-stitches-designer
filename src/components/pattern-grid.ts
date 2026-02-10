import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Grid, GridCell } from '../slipped-stitches-app';

@customElement('pattern-grid')
export class PatternGrid extends LitElement {
  @property({ type: Number })
  rows = 10;

  @property({ type: Number })
  stitches = 10;

  @property({ type: Array })
  pattern: Grid = [];

  private handleCellClick(rowIndex: number, stitchIndex: number) {
    const newPattern = this.pattern.map((row, i) =>
      row.map((cell, j) => {
        if (i === rowIndex && j === stitchIndex) {
          return cell === 'knit' ? ('slip' as GridCell) : ('knit' as GridCell);
        }
        return cell;
      })
    );

    this.dispatchEvent(
      new CustomEvent('pattern-change', {
        detail: { pattern: newPattern },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <div class="grid-container">
        <div
          class="grid"
          style="grid-template-columns: repeat(${this.stitches}, 20px)"
        >
          ${this.pattern.map(
            (row, rowIndex) => html`
              ${row.map(
                (cell, stitchIndex) => html`
                  <div
                    class="cell ${cell}"
                    @click=${() => this.handleCellClick(rowIndex, stitchIndex)}
                    title="Row ${rowIndex + 1}, Stitch ${stitchIndex +
                    1}: ${cell === 'knit' ? 'Knit' : 'Slip'}"
                  ></div>
                `
              )}
            `
          )}
        </div>
        <div class="legend">
          <div class="legend-item">
            <div class="cell knit"></div>
            <span>Knit (K)</span>
          </div>
          <div class="legend-item">
            <div class="cell slip"></div>
            <span>Slip (S)</span>
          </div>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }

    .grid-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .grid {
      display: grid;
      gap: 1px;
      background-color: #ccc;
      border: 1px solid #999;
      width: fit-content;
    }

    .cell {
      width: 20px;
      height: 20px;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .cell:hover {
      opacity: 0.7;
    }

    .cell.knit {
      background-color: #000;
    }

    .cell.slip {
      background-color: #fff;
    }

    .legend {
      display: flex;
      gap: 1.5rem;
      font-size: 0.9rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .legend .cell {
      cursor: default;
      border: 1px solid #999;
    }

    .legend .cell:hover {
      opacity: 1;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'pattern-grid': PatternGrid;
  }
}
