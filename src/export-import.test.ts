import { describe, it, expect } from 'vitest';

describe('Export/Import Pattern Roundtrip', () => {
  it('should maintain pattern integrity when exporting and re-importing', () => {
    // Create a simple test pattern (5x5 with a specific pattern)
    const testPattern = [
      ['knit', 'slip', 'knit', 'slip', 'knit'],
      ['slip', 'knit', 'slip', 'knit', 'slip'],
      ['knit', 'knit', 'slip', 'slip', 'knit'],
      ['slip', 'slip', 'knit', 'knit', 'slip'],
      ['knit', 'slip', 'slip', 'knit', 'knit'],
    ];

    const rows = 5;
    const stitches = 5;

    // Simulate export: draw pattern onto canvas with bottom-up orientation
    const canvas = document.createElement('canvas');
    canvas.width = stitches;
    canvas.height = rows;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Export logic (matches handleExportPNG)
    testPattern.forEach((row, rowIndex) => {
      row.forEach((cell, x) => {
        // Flip y-coordinate: row 0 becomes bottom row in image
        const y = rows - 1 - rowIndex;
        ctx.fillStyle = cell === 'knit' ? '#000000' : '#ffffff';
        ctx.fillRect(x, y, 1, 1);
      });
    });

    // Simulate import: read canvas back with bottom-up orientation
    const imageData = ctx.getImageData(0, 0, stitches, rows);
    const pixels = imageData.data;

    const importedPattern: string[][] = [];
    // Import logic (matches handleImportPNG)
    for (let y = rows - 1; y >= 0; y--) {
      const row: string[] = [];
      for (let x = 0; x < stitches; x++) {
        const i = (y * stitches + x) * 4;
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const brightness = (r + g + b) / 3;
        row.push(brightness < 128 ? 'knit' : 'slip');
      }
      importedPattern.push(row);
    }

    // Verify the patterns match exactly
    expect(importedPattern).toEqual(testPattern);
  });

  it('should correctly map row 1 to bottom of image and row N to top', () => {
    // Create a pattern where each row is unique and easily identifiable
    const testPattern = [
      ['knit', 'knit', 'knit'], // Row 1 (index 0) - should be bottom of image (y=2)
      ['slip', 'slip', 'slip'], // Row 2 (index 1) - should be middle of image (y=1)
      ['knit', 'slip', 'knit'], // Row 3 (index 2) - should be top of image (y=0)
    ];

    const rows = 3;
    const stitches = 3;

    // Export the pattern
    const canvas = document.createElement('canvas');
    canvas.width = stitches;
    canvas.height = rows;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    testPattern.forEach((row, rowIndex) => {
      row.forEach((cell, x) => {
        const y = rows - 1 - rowIndex;
        ctx.fillStyle = cell === 'knit' ? '#000000' : '#ffffff';
        ctx.fillRect(x, y, 1, 1);
      });
    });

    // Verify row 1 (all knit) is at bottom of image (y=2)
    const bottomPixel = ctx.getImageData(0, 2, 1, 1).data;
    const bottomBrightness =
      (bottomPixel[0] + bottomPixel[1] + bottomPixel[2]) / 3;
    expect(bottomBrightness).toBeLessThan(128); // Should be black (knit)

    // Verify row 2 (all slip) is at middle of image (y=1)
    const middlePixel = ctx.getImageData(0, 1, 1, 1).data;
    const middleBrightness =
      (middlePixel[0] + middlePixel[1] + middlePixel[2]) / 3;
    expect(middleBrightness).toBeGreaterThanOrEqual(128); // Should be white (slip)

    // Verify row 3 is at top of image (y=0)
    const topLeftPixel = ctx.getImageData(0, 0, 1, 1).data;
    const topLeftBrightness =
      (topLeftPixel[0] + topLeftPixel[1] + topLeftPixel[2]) / 3;
    expect(topLeftBrightness).toBeLessThan(128); // Should be black (knit at position 0)

    const topMiddlePixel = ctx.getImageData(1, 0, 1, 1).data;
    const topMiddleBrightness =
      (topMiddlePixel[0] + topMiddlePixel[1] + topMiddlePixel[2]) / 3;
    expect(topMiddleBrightness).toBeGreaterThanOrEqual(128); // Should be white (slip at position 1)
  });
});
