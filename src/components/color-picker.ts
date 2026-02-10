import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import styles from './color-picker.css?inline';

@customElement('color-picker')
export class ColorPicker extends LitElement {
  @property({ type: Number })
  rows = 10;

  @property({ type: Number })
  stitches = 10;

  @property({ type: Array })
  colors: string[] = [];

  @property({ type: Array })
  palette: string[] = ['#db8fff', '#ffbe33', '#ffffff', '#ffffff'];

  @property({ type: String })
  foundationColor: string = '#db8fff';

  private handleRowColorSelect(rowIndex: number, paletteIndex: number) {
    const newColors = [...this.colors];
    newColors[rowIndex] = this.palette[paletteIndex];

    this.dispatchEvent(
      new CustomEvent('color-change', {
        detail: { colors: newColors },
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleFoundationColorSelect(paletteIndex: number) {
    this.dispatchEvent(
      new CustomEvent('foundation-color-change', {
        detail: { foundationColor: this.palette[paletteIndex] },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    // Reverse colors for display (knitters work bottom-up)
    const reversedColors = [...this.colors].reverse();
    // Calculate responsive cell size (min 8px, max 20px) to match grid
    const cellSize = Math.max(8, Math.min(20, Math.floor(600 / this.stitches)));

    return html`
      <div class="color-grid-container">
        <div class="grid-with-labels">
          <div
            class="color-grid"
            style="grid-template-rows: repeat(${this.rows +
            1}, ${cellSize}px); grid-template-columns: repeat(4, ${cellSize}px)"
          >
            ${reversedColors.map((color, displayIndex) => {
              // Calculate actual row index (reversed)
              const actualRowIndex = this.colors.length - 1 - displayIndex;
              return html`
                ${this.palette.map(
                  (paletteColor, paletteIndex) => html`
                    <div
                      class="color-cell ${color === paletteColor
                        ? 'selected'
                        : ''}"
                      style="background-color: ${paletteColor}; width: ${cellSize}px; height: ${cellSize}px"
                      @click=${() =>
                        this.handleRowColorSelect(actualRowIndex, paletteIndex)}
                      title="Row ${actualRowIndex + 1}: Color ${paletteIndex +
                      1}"
                    ></div>
                  `
                )}
              `;
            })}

            <!-- Foundation Row (Row 0) -->
            ${this.palette.map(
              (paletteColor, paletteIndex) => html`
                <div
                  class="color-cell foundation ${this.foundationColor ===
                  paletteColor
                    ? 'selected'
                    : ''}"
                  style="background-color: ${paletteColor}; width: ${cellSize}px; height: ${cellSize}px"
                  @click=${() => this.handleFoundationColorSelect(paletteIndex)}
                  title="Foundation: Color ${paletteIndex + 1}"
                ></div>
              `
            )}
          </div>
          <div class="row-labels">
            ${reversedColors.map((_, displayIndex) => {
              const actualRowIndex = this.colors.length - 1 - displayIndex;
              return html`
                <div class="row-label" style="height: ${cellSize}px">
                  ${actualRowIndex + 1}
                </div>
              `;
            })}
            <div class="row-label" style="height: ${cellSize}px">F</div>
          </div>
        </div>
      </div>
    `;
  }

  static styles = unsafeCSS(styles);
}

declare global {
  interface HTMLElementTagNameMap {
    'color-picker': ColorPicker;
  }
}
