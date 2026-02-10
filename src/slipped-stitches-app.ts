import { LitElement, html, unsafeCSS } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './components/color-picker';
import './components/output-display';
import './components/pattern-grid';
import './components/pattern-preview';
import styles from './slipped-stitches-app.css?inline';

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

  @state()
  private palette: string[] = ['#db8fff', '#ffbe33', '#ffffff', '#ffffff'];

  @state()
  private foundationColor: string = '#db8fff';

  @state()
  private showPreview = false;

  @state()
  private previewScale = 2;

  connectedCallback() {
    super.connectedCallback();
    this.initializePattern();
  }

  private initializePattern() {
    // Initialize pattern grid with all 'knit' cells
    this.pattern = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.stitches }, () => 'knit' as GridCell)
    );
    // Initialize row colors alternating every 2 rows between purple and orange
    this.rowColors = Array.from({ length: this.rows }, (_, i) =>
      Math.floor(i / 2) % 2 === 0 ? '#db8fff' : '#ffbe33'
    );
  }

  private handleRowsChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const newRows = parseInt(input.value, 10);
    if (newRows > 0 && newRows <= 100) {
      const oldRows = this.rows;
      this.rows = newRows;

      if (newRows > oldRows) {
        // Add new rows at the end (top in display)
        const rowsToAdd = newRows - oldRows;
        for (let i = 0; i < rowsToAdd; i++) {
          this.pattern.push(
            Array.from({ length: this.stitches }, () => 'knit' as GridCell)
          );
          // Add color following the alternating pattern
          const colorIndex = Math.floor((oldRows + i) / 2) % 2;
          this.rowColors.push(colorIndex === 0 ? '#db8fff' : '#ffbe33');
        }
      } else if (newRows < oldRows) {
        // Remove rows from the end (top in display)
        this.pattern = this.pattern.slice(0, newRows);
        this.rowColors = this.rowColors.slice(0, newRows);
      }
    }
  }

  private handleStitchesChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const newStitches = parseInt(input.value, 10);
    if (newStitches > 0 && newStitches <= 100) {
      const oldStitches = this.stitches;
      this.stitches = newStitches;

      if (newStitches > oldStitches) {
        // Add new stitches to the right of each row
        const stitchesToAdd = newStitches - oldStitches;
        this.pattern = this.pattern.map((row) => [
          ...row,
          ...Array.from({ length: stitchesToAdd }, () => 'knit' as GridCell),
        ]);
      } else if (newStitches < oldStitches) {
        // Remove stitches from the right of each row
        this.pattern = this.pattern.map((row) => row.slice(0, newStitches));
      }
    }
  }

  private handlePatternChange(e: CustomEvent) {
    this.pattern = e.detail.pattern;
  }

  private handleColorChange(e: CustomEvent) {
    this.rowColors = e.detail.colors;
  }

  private handleFoundationColorChange(e: CustomEvent) {
    this.foundationColor = e.detail.foundationColor;
  }

  private handlePaletteColorChange(index: number, e: Event) {
    const input = e.target as HTMLInputElement;
    const oldPalette = [...this.palette];
    const newPalette = [...this.palette];
    newPalette[index] = input.value;

    // Update row colors that were using the changed palette color
    this.rowColors = this.rowColors.map((color) => {
      if (color === oldPalette[index]) {
        return newPalette[index];
      }
      return color;
    });

    // Update foundation color if it was using the changed palette color
    if (this.foundationColor === oldPalette[index]) {
      this.foundationColor = newPalette[index];
    }

    this.palette = newPalette;
  }

  private handleImportPNG(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create a canvas to read pixel data
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const pixels = imageData.data;

        // Convert pixels to pattern (brightness threshold for knit/slip)
        // Read from bottom to top to match knitting orientation
        const newPattern: Grid = [];
        for (let y = img.height - 1; y >= 0; y--) {
          const row: GridCell[] = [];
          for (let x = 0; x < img.width; x++) {
            const i = (y * img.width + x) * 4;
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            // Calculate brightness (0-255)
            const brightness = (r + g + b) / 3;
            // Dark pixels = knit, light pixels = slip
            row.push(brightness < 128 ? 'knit' : 'slip');
          }
          newPattern.push(row);
        }

        // Update grid dimensions and pattern
        this.rows = img.height;
        this.stitches = img.width;
        this.pattern = newPattern;

        // Initialize row colors for new dimensions
        this.rowColors = Array.from({ length: this.rows }, (_, i) =>
          Math.floor(i / 2) % 2 === 0 ? '#db8fff' : '#ffbe33'
        );
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be selected again
    input.value = '';
  }

  private handleExportPNG() {
    // Create canvas matching grid dimensions (1 pixel per cell)
    const canvas = document.createElement('canvas');
    canvas.width = this.stitches;
    canvas.height = this.rows;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw pattern from bottom to top to match import orientation
    this.pattern.forEach((row, rowIndex) => {
      row.forEach((cell, x) => {
        // Flip y-coordinate: row 0 becomes bottom row in image
        const y = this.rows - 1 - rowIndex;
        ctx.fillStyle = cell === 'knit' ? '#000000' : '#ffffff';
        ctx.fillRect(x, y, 1, 1);
      });
    });

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'slipped-stitches-pattern.png';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  private generateOutputImage(): string | null {
    // Calculate output colors
    const output: string[][] = [];
    const stitchCount = this.pattern[0]?.length || 0;
    const lastKnitRow: number[] = Array(stitchCount).fill(-1);

    for (let rowIndex = 0; rowIndex < this.pattern.length; rowIndex++) {
      const row = this.pattern[rowIndex];
      const outputRow: string[] = [];

      for (let stitchIndex = 0; stitchIndex < row.length; stitchIndex++) {
        const cell = row[stitchIndex];

        if (cell === 'knit') {
          lastKnitRow[stitchIndex] = rowIndex;
          outputRow.push(this.rowColors[rowIndex]);
        } else {
          const lastKnitRowIndex = lastKnitRow[stitchIndex];
          outputRow.push(
            lastKnitRowIndex >= 0
              ? this.rowColors[lastKnitRowIndex]
              : this.foundationColor
          );
        }
      }

      output.push(outputRow);
    }

    // Create canvas and draw the output
    const canvas = document.createElement('canvas');
    canvas.width = this.stitches;
    canvas.height = this.rows;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    output.forEach((row, rowIndex) => {
      row.forEach((color, x) => {
        // Flip y-coordinate: row 0 becomes bottom row in image
        const y = this.rows - 1 - rowIndex;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      });
    });

    return canvas.toDataURL();
  }

  private handlePreview() {
    this.showPreview = true;
  }

  private handleClearPattern() {
    // Reset all pattern cells to 'knit'
    this.pattern = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.stitches }, () => 'knit' as GridCell)
    );
  }

  private handlePreviewClose() {
    this.showPreview = false;
  }

  private handlePreviewScaleChange(e: CustomEvent) {
    this.previewScale = e.detail.scale;
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
            <label class="file-input-label">
              Import PNG
              <input
                type="file"
                accept="image/png"
                @change=${this.handleImportPNG}
                class="file-input"
              />
            </label>
            <button class="export-button" @click=${this.handleExportPNG}>
              Export PNG
            </button>
            <button class="preview-button" @click=${this.handlePreview}>
              Preview Repeat
            </button>
            <button class="clear-button" @click=${this.handleClearPattern}>
              Clear Pattern
            </button>
            <div class="palette-section">
              <label>Palette:</label>
              <div class="palette-colors">
                ${this.palette.map(
                  (color, index) => html`
                    <input
                      type="color"
                      .value=${color}
                      @input=${(e: Event) =>
                        this.handlePaletteColorChange(index, e)}
                      title="Palette Color ${index + 1}"
                      class="palette-color-input"
                    />
                  `
                )}
              </div>
            </div>
          </div>
        </header>

        <div class="workspace">
          <div class="panel">
            <div class="grids-container">
              <div class="grid-section">
                <h2>Pattern (K/S)</h2>
                <pattern-grid
                  .rows=${this.rows}
                  .stitches=${this.stitches}
                  .pattern=${this.pattern}
                  @pattern-change=${this.handlePatternChange}
                ></pattern-grid>
              </div>

              <div class="grid-section">
                <h2>Output</h2>
                <output-display
                  .pattern=${this.pattern}
                  .colors=${this.rowColors}
                  .foundationColor=${this.foundationColor}
                ></output-display>
              </div>

              <div class="grid-section">
                <h2>Colors</h2>
                <color-picker
                  .rows=${this.rows}
                  .stitches=${this.stitches}
                  .colors=${this.rowColors}
                  .palette=${this.palette}
                  .foundationColor=${this.foundationColor}
                  @color-change=${this.handleColorChange}
                  @foundation-color-change=${this.handleFoundationColorChange}
                ></color-picker>
              </div>
            </div>
          </div>
        </div>

        <pattern-preview
          .show=${this.showPreview}
          .imageDataUrl=${this.generateOutputImage()}
          .patternWidth=${this.stitches}
          .patternHeight=${this.rows}
          .scale=${this.previewScale}
          @close=${this.handlePreviewClose}
          @scale-change=${this.handlePreviewScaleChange}
        ></pattern-preview>
      </div>
    `;
  }

  static styles = unsafeCSS(styles);
}

declare global {
  interface HTMLElementTagNameMap {
    'slipped-stitches-app': SlippedStitchesApp;
  }
}
