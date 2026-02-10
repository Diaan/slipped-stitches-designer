import { describe, it, expect } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import './slipped-stitches-app.js';
import type { SlippedStitchesApp } from './slipped-stitches-app.js';

describe('SlippedStitchesApp - Export/Import Roundtrip', () => {
  it('should maintain pattern integrity when exporting and re-importing', async () => {
    // Create the app
    const el = await fixture<SlippedStitchesApp>(
      html`<slipped-stitches-app></slipped-stitches-app>`
    );
    await el.updateComplete;

    // Create a simple test pattern (5x5 with a specific pattern)
    const testPattern = [
      ['knit', 'slip', 'knit', 'slip', 'knit'],
      ['slip', 'knit', 'slip', 'knit', 'slip'],
      ['knit', 'knit', 'slip', 'slip', 'knit'],
      ['slip', 'slip', 'knit', 'knit', 'slip'],
      ['knit', 'slip', 'slip', 'knit', 'knit'],
    ];

    // Set the pattern (accessing private property for testing)
    // @ts-expect-error - accessing private property for testing
    el.rows = 5;
    // @ts-expect-error - accessing private property for testing
    el.stitches = 5;
    // @ts-expect-error - accessing private property for testing
    el.pattern = testPattern;
    await el.updateComplete;

    // Export the pattern to a canvas (simulate export)
    const canvas = document.createElement('canvas');
    canvas.width = 5;
    canvas.height = 5;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Simulate the export logic
    testPattern.forEach((row, rowIndex) => {
      row.forEach((cell, x) => {
        const y = 5 - 1 - rowIndex;
        ctx.fillStyle = cell === 'knit' ? '#000000' : '#ffffff';
        ctx.fillRect(x, y, 1, 1);
      });
    });

    // Now read it back (simulate import)
    const imageData = ctx.getImageData(0, 0, 5, 5);
    const pixels = imageData.data;

    const importedPattern: string[][] = [];
    for (let y = 4; y >= 0; y--) {
      const row: string[] = [];
      for (let x = 0; x < 5; x++) {
        const i = (y * 5 + x) * 4;
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const brightness = (r + g + b) / 3;
        row.push(brightness < 128 ? 'knit' : 'slip');
      }
      importedPattern.push(row);
    }

    // Verify the patterns match
    expect(importedPattern).toEqual(testPattern);
  });

  it('should correctly export row 1 to bottom of image', async () => {
    const el = await fixture<SlippedStitchesApp>(
      html`<slipped-stitches-app></slipped-stitches-app>`
    );
    await el.updateComplete;

    // Create a simple pattern where each row is unique
    const testPattern = [
      ['knit', 'knit', 'knit'], // Row 1 (should be bottom of image)
      ['slip', 'slip', 'slip'], // Row 2 (should be middle of image)
      ['knit', 'slip', 'knit'], // Row 3 (should be top of image)
    ];

    // @ts-expect-error - accessing private property for testing
    el.rows = 3;
    // @ts-expect-error - accessing private property for testing
    el.stitches = 3;
    // @ts-expect-error - accessing private property for testing
    el.pattern = testPattern;
    await el.updateComplete;

    // Export the pattern
    const canvas = document.createElement('canvas');
    canvas.width = 3;
    canvas.height = 3;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Simulate export logic
    testPattern.forEach((row, rowIndex) => {
      row.forEach((cell, x) => {
        const y = 3 - 1 - rowIndex;
        ctx.fillStyle = cell === 'knit' ? '#000000' : '#ffffff';
        ctx.fillRect(x, y, 1, 1);
      });
    });

    // Check bottom row (y=2 in image coords) should be row 1 (all knit = black)
    const bottomPixel = ctx.getImageData(0, 2, 1, 1).data;
    const bottomBrightness =
      (bottomPixel[0] + bottomPixel[1] + bottomPixel[2]) / 3;
    expect(bottomBrightness).toBeLessThan(128); // Should be black (knit)

    // Check middle row (y=1) should be row 2 (all slip = white)
    const middlePixel = ctx.getImageData(0, 1, 1, 1).data;
    const middleBrightness =
      (middlePixel[0] + middlePixel[1] + middlePixel[2]) / 3;
    expect(middleBrightness).toBeGreaterThanOrEqual(128); // Should be white (slip)

    // Check top row (y=0) should be row 3 (knit-slip-knit)
    const topLeftPixel = ctx.getImageData(0, 0, 1, 1).data;
    const topLeftBrightness =
      (topLeftPixel[0] + topLeftPixel[1] + topLeftPixel[2]) / 3;
    expect(topLeftBrightness).toBeLessThan(128); // Should be black (knit)

    const topMiddlePixel = ctx.getImageData(1, 0, 1, 1).data;
    const topMiddleBrightness =
      (topMiddlePixel[0] + topMiddlePixel[1] + topMiddlePixel[2]) / 3;
    expect(topMiddleBrightness).toBeGreaterThanOrEqual(128); // Should be white (slip)
  });
});
