import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('color-picker')
export class ColorPicker extends LitElement {
  @property({ type: Number })
  rows = 10;

  @property({ type: Array })
  colors: string[] = [];

  private handleColorChange(rowIndex: number, e: Event) {
    const input = e.target as HTMLInputElement;
    const newColors = [...this.colors];
    newColors[rowIndex] = input.value;

    this.dispatchEvent(
      new CustomEvent('color-change', {
        detail: { colors: newColors },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <div class="color-list">
        ${this.colors.map(
          (color, index) => html`
            <div class="color-row">
              <label>Row ${index + 1}:</label>
              <input
                type="color"
                .value=${color}
                @input=${(e: Event) => this.handleColorChange(index, e)}
              />
              <div class="color-preview" style="background-color: ${color}"></div>
            </div>
          `
        )}
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }

    .color-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .color-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .color-row label {
      min-width: 60px;
      font-size: 0.9rem;
    }

    input[type='color'] {
      width: 50px;
      height: 30px;
      border: 1px solid #ccc;
      border-radius: 4px;
      cursor: pointer;
    }

    .color-preview {
      width: 30px;
      height: 30px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'color-picker': ColorPicker;
  }
}
