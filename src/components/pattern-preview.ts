import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import styles from './pattern-preview.css?inline';

@customElement('pattern-preview')
export class PatternPreview extends LitElement {
  @property({ type: Boolean })
  show = false;

  @property({ type: String })
  imageDataUrl: string | null = null;

  @property({ type: Number })
  patternWidth = 0;

  @property({ type: Number })
  patternHeight = 0;

  @property({ type: Number })
  scale = 2;

  private handleClose() {
    this.dispatchEvent(
      new CustomEvent('close', {
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleScaleChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const newScale = parseInt(input.value, 10);
    this.dispatchEvent(
      new CustomEvent('scale-change', {
        detail: { scale: newScale },
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleOverlayClick() {
    this.handleClose();
  }

  private handleDialogClick(e: Event) {
    e.stopPropagation();
  }

  render() {
    if (!this.show) {
      return html``;
    }

    return html`
      <div class="preview-overlay" @click=${this.handleOverlayClick}>
        <div class="preview-dialog" @click=${this.handleDialogClick}>
          <div class="preview-header">
            <h2>Preview Repeating Pattern</h2>
            <button class="close-button" @click=${this.handleClose}>✕</button>
          </div>
          <div class="preview-controls">
            <label>
              Repeat Scale: ${this.scale}x
              <input
                type="range"
                min="1"
                max="10"
                .value=${this.scale.toString()}
                @input=${this.handleScaleChange}
              />
            </label>
          </div>
          <div
            class="preview-content"
            style="background-image: url(${this
              .imageDataUrl}); background-size: ${this.patternWidth *
            this.scale}px ${this.patternHeight * this.scale}px"
          ></div>
        </div>
      </div>
    `;
  }

  static styles = unsafeCSS(styles);
}

declare global {
  interface HTMLElementTagNameMap {
    'pattern-preview': PatternPreview;
  }
}
