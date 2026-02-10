import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { Grid, GridCell } from '../slipped-stitches-app';
import styles from './pattern-grid.css?inline';

@customElement('pattern-grid')
export class PatternGrid extends LitElement {
  @property({ type: Number })
  rows = 10;

  @property({ type: Number })
  stitches = 10;

  @property({ type: Array })
  pattern: Grid = [];

  @state()
  private isDrawing = false;

  @state()
  private drawValue: GridCell | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.handleMouseUp = this.handleMouseUp.bind(this);
    window.addEventListener('mouseup', this.handleMouseUp);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('mouseup', this.handleMouseUp);
  }

  private handleMouseUp() {
    this.isDrawing = false;
    this.drawValue = null;
  }

  private handleCellMouseDown(rowIndex: number, stitchIndex: number) {
    // Toggle the cell and remember what we toggled it to
    const currentValue = this.pattern[rowIndex][stitchIndex];
    const newValue = currentValue === 'knit' ? 'slip' : 'knit';

    this.isDrawing = true;
    this.drawValue = newValue;

    this.updateCell(rowIndex, stitchIndex, newValue);
  }

  private handleCellMouseEnter(rowIndex: number, stitchIndex: number) {
    if (this.isDrawing && this.drawValue) {
      this.updateCell(rowIndex, stitchIndex, this.drawValue);
    }
  }

  private updateCell(rowIndex: number, stitchIndex: number, value: GridCell) {
    const newPattern = this.pattern.map((row, i) =>
      row.map((cell, j) => {
        if (i === rowIndex && j === stitchIndex) {
          return value;
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
    // Reverse pattern for display (knitters work bottom-up)
    const reversedPattern = [...this.pattern].reverse();
    // Calculate responsive cell size (min 8px, max 20px)
    const cellSize = Math.max(8, Math.min(20, Math.floor(600 / this.stitches)));

    return html`
      <div class="grid-container">
        <div class="grid-with-labels">
          <div class="row-labels">
            ${reversedPattern.map((_, displayIndex) => {
              const actualRowIndex = this.pattern.length - 1 - displayIndex;
              return html`
                <div class="row-label" style="height: ${cellSize}px">
                  ${actualRowIndex + 1}
                </div>
              `;
            })}
          </div>
          <div
            class="grid"
            style="grid-template-columns: repeat(${this
              .stitches}, ${cellSize}px)"
          >
            ${reversedPattern.map(
              (row, displayIndex) => html`
                ${row.map((cell, stitchIndex) => {
                  // Calculate actual row index (reversed)
                  const actualRowIndex = this.pattern.length - 1 - displayIndex;
                  return html`
                    <div
                      class="cell ${cell}"
                      style="width: ${cellSize}px; height: ${cellSize}px"
                      @mousedown=${() =>
                        this.handleCellMouseDown(actualRowIndex, stitchIndex)}
                      @mouseenter=${() =>
                        this.handleCellMouseEnter(actualRowIndex, stitchIndex)}
                      title="Row ${actualRowIndex + 1}, Stitch ${stitchIndex +
                      1}: ${cell === 'knit' ? 'Knit' : 'Slip'}"
                    ></div>
                  `;
                })}
              `
            )}
          </div>
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

  static styles = unsafeCSS(styles);
}

declare global {
  interface HTMLElementTagNameMap {
    'pattern-grid': PatternGrid;
  }
}
