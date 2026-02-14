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

  @state()
  private showColorColumnDialog = false;

  @state()
  private pendingImportData: {
    pattern: Grid;
    fullPattern: Grid;
    rows: number;
    stitches: number;
    lastColumn: string[];
  } | null = null;

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

        // Helper to get pixel color as hex
        const getPixelColor = (x: number, y: number): string => {
          const i = (y * img.width + x) * 4;
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        };

        // Helper to check if color is black or white
        const isBlackOrWhite = (color: string): boolean => {
          return color === '#000000' || color === '#ffffff';
        };

        // Extract last column colors
        const lastColumn: string[] = [];
        for (let y = img.height - 1; y >= 0; y--) {
          lastColumn.push(getPixelColor(img.width - 1, y));
        }

        // Check if last column has any non-black/white colors
        const hasColorInfo = lastColumn.some((color) => !isBlackOrWhite(color));

        // Convert pixels to pattern - read both with and without last column
        // Read from bottom to top to match knitting orientation
        const readPattern = (width: number): Grid => {
          const pattern: Grid = [];
          for (let y = img.height - 1; y >= 0; y--) {
            const row: GridCell[] = [];
            for (let x = 0; x < width; x++) {
              const i = (y * img.width + x) * 4;
              const r = pixels[i];
              const g = pixels[i + 1];
              const b = pixels[i + 2];
              const brightness = (r + g + b) / 3;
              row.push(brightness < 128 ? 'knit' : 'slip');
            }
            pattern.push(row);
          }
          return pattern;
        };

        const patternWidth = img.width - 1; // Exclude last column
        const newPattern = readPattern(patternWidth);
        const fullPattern = readPattern(img.width); // Include last column

        if (hasColorInfo) {
          // Automatically use colors from last column
          this.applyImportedData(
            newPattern,
            img.height,
            patternWidth,
            lastColumn
          );
        } else {
          // Ask user if last column should be interpreted as colors
          this.pendingImportData = {
            pattern: newPattern,
            fullPattern: fullPattern,
            rows: img.height,
            stitches: patternWidth,
            lastColumn: lastColumn,
          };
          this.showColorColumnDialog = true;
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be selected again
    input.value = '';
  }

  private applyImportedData(
    pattern: Grid,
    rows: number,
    stitches: number,
    colors: string[]
  ) {
    // Pattern and colors are built bottom-up, so foundation is at the end
    const foundationColor = colors[colors.length - 1];
    const rowColors = colors.slice(0, -1); // All except last

    // Extract unique colors from all imported colors to update palette
    const uniqueColors = Array.from(new Set([foundationColor, ...rowColors]));

    // Update palette with imported colors (pad with white if less than 4)
    const newPalette = [...uniqueColors];
    while (newPalette.length < 4) {
      newPalette.push('#ffffff');
    }
    // Only use first 4 colors if more than 4 unique colors
    this.palette = newPalette.slice(0, 4);

    // Update grid dimensions and pattern
    this.rows = rows - 1; // Exclude foundation row from row count
    this.stitches = stitches;
    this.pattern = pattern.slice(0, -1); // Remove last element (foundation row)
    this.foundationColor = foundationColor;
    this.rowColors = rowColors;
  }

  private handleColorColumnDialogYes() {
    if (!this.pendingImportData) return;

    const { pattern, rows, stitches, lastColumn } = this.pendingImportData;
    this.applyImportedData(pattern, rows, stitches, lastColumn);
    this.showColorColumnDialog = false;
    this.pendingImportData = null;
  }

  private handleColorColumnDialogNo() {
    if (!this.pendingImportData) return;

    const { fullPattern, rows } = this.pendingImportData;

    // Treat entire image as pattern (including last column)
    this.rows = rows - 1; // Exclude foundation
    this.stitches = fullPattern[0].length; // Full width
    this.pattern = fullPattern.slice(0, -1); // Remove last element (foundation row)

    // Initialize default colors
    this.rowColors = Array.from({ length: this.rows }, (_, i) =>
      Math.floor(i / 2) % 2 === 0 ? '#db8fff' : '#ffbe33'
    );

    this.showColorColumnDialog = false;
    this.pendingImportData = null;
  }

  private handleExportPNG() {
    // Create canvas with extra column for color info and extra row for foundation
    const canvas = document.createElement('canvas');
    canvas.width = this.stitches + 1; // +1 for color column
    canvas.height = this.rows + 1; // +1 for foundation row
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw pattern from bottom to top to match import orientation
    // Foundation row at y = 0 (bottom), pattern rows above it
    this.pattern.forEach((row, rowIndex) => {
      row.forEach((cell, x) => {
        // Flip y-coordinate: row 0 becomes row 1 in image (foundation is at 0)
        const y = this.rows - rowIndex;
        ctx.fillStyle = cell === 'knit' ? '#000000' : '#ffffff';
        ctx.fillRect(x, y, 1, 1);
      });
    });

    // Draw foundation row at bottom (y = 0) - all knit for now
    for (let x = 0; x < this.stitches; x++) {
      ctx.fillStyle = '#000000'; // Foundation is always knit
      ctx.fillRect(x, 0, 1, 1);
    }

    // Draw color information column (rightmost column)
    // Pattern rows (from bottom up, starting at y = 1)
    this.rowColors.forEach((color, rowIndex) => {
      const y = this.rows - rowIndex;
      ctx.fillStyle = color;
      ctx.fillRect(this.stitches, y, 1, 1);
    });

    // Foundation row color at bottom
    ctx.fillStyle = this.foundationColor;
    ctx.fillRect(this.stitches, 0, 1, 1);

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

        ${this.showColorColumnDialog
          ? html`
              <div class="dialog-overlay">
                <div class="dialog">
                  <h2>Import Last Column as Colors?</h2>
                  <p>
                    The last column of the imported image contains only black
                    and white pixels. Should it be interpreted as color
                    information or as part of the pattern?
                  </p>
                  <div class="dialog-buttons">
                    <button
                      class="dialog-button primary"
                      @click=${this.handleColorColumnDialogYes}
                    >
                      Yes, use as colors
                    </button>
                    <button
                      class="dialog-button"
                      @click=${this.handleColorColumnDialogNo}
                    >
                      No, include in pattern
                    </button>
                  </div>
                </div>
              </div>
            `
          : ''}
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
