import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './components/pattern-grid';
import './components/color-picker';
import './components/output-display';

export type GridCell = 'knit' | 'slip';
export type Grid = GridCell[][];

@customElement('slipped-stitches-app')
export class SlippedStitchesApp extends LitElement {
  @state()
  private rows = 10;

  @state()
  private stitches = 10;

  @state()
  private pattern: Grid = [];

  @state()
  private rowColors: string[] = [];

  connectedCallback() {
    super.connectedCallback();
    this.initializePattern();
  }

  private initializePattern() {
    // Initialize pattern grid with all 'knit' cells
    this.pattern = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.stitches }, () => 'knit' as GridCell)
    );
    // Initialize row colors with default black
    this.rowColors = Array.from({ length: this.rows }, () => '#000000');
  }

  private handleRowsChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const newRows = parseInt(input.value, 10);
    if (newRows > 0 && newRows <= 100) {
      this.rows = newRows;
      this.initializePattern();
    }
  }

  private handleStitchesChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const newStitches = parseInt(input.value, 10);
    if (newStitches > 0 && newStitches <= 100) {
      this.stitches = newStitches;
      this.initializePattern();
    }
  }

  private handlePatternChange(e: CustomEvent) {
    this.pattern = e.detail.pattern;
  }

  private handleColorChange(e: CustomEvent) {
    this.rowColors = e.detail.colors;
  }

  render() {
    return html`
      <div class="container">
        <header>
          <h1>Slipped Stitches Designer</h1>
          <div class="controls">
            <label>
              Rows:
              <input
                type="number"
                .value=${this.rows.toString()}
                @input=${this.handleRowsChange}
                min="1"
                max="100"
              />
            </label>
            <label>
              Stitches:
              <input
                type="number"
                .value=${this.stitches.toString()}
                @input=${this.handleStitchesChange}
                min="1"
                max="100"
              />
            </label>
          </div>
        </header>

        <div class="workspace">
          <div class="panel pattern-panel">
            <h2>Pattern (K/S)</h2>
            <pattern-grid
              .rows=${this.rows}
              .stitches=${this.stitches}
              .pattern=${this.pattern}
              @pattern-change=${this.handlePatternChange}
            ></pattern-grid>
          </div>

          <div class="panel color-panel">
            <h2>Row Colors</h2>
            <color-picker
              .rows=${this.rows}
              .colors=${this.rowColors}
              @color-change=${this.handleColorChange}
            ></color-picker>
          </div>

          <div class="panel output-panel">
            <h2>Output</h2>
            <output-display
              .pattern=${this.pattern}
              .colors=${this.rowColors}
            ></output-display>
          </div>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background-color: #f5f5f5;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
    }

    header {
      margin-bottom: 2rem;
    }

    h1 {
      color: #333;
      margin: 0 0 1rem 0;
    }

    .controls {
      display: flex;
      gap: 1rem;
    }

    .controls label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 500;
    }

    .controls input {
      width: 80px;
      padding: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    .workspace {
      display: grid;
      grid-template-columns: 2fr 1fr 2fr;
      gap: 1.5rem;
      align-items: start;
    }

    .panel {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .panel h2 {
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 1.2rem;
    }

    @media (max-width: 1024px) {
      .workspace {
        grid-template-columns: 1fr;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'slipped-stitches-app': SlippedStitchesApp;
  }
}
