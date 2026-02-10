# Slipped Stitches Designer

A web-based tool for visualizing slipped stitch knitting patterns. Design patterns using a simple grid interface and instantly see how they'll look in the finished knitted fabric.

## What are Slipped Stitches?

In knitting, a slipped stitch means you don't knit a stitch in the current row, but elongate the stitch from the row below. When working with different colors on different rows, you can create vertical lines while still using only one color per row.

## Features

- **Pattern Grid**: Create patterns with a simple black/white grid
  - Black = Knit (K)
  - White = Slip (S)
- **Color Selection**: Assign colors to each row
- **Live Preview**: See the resulting slipped stitch pattern in real-time
- **Customizable Grid**: Set the number of rows and stitches

## Roadmap

- [ ] PNG import: Load patterns from images (1 pixel = 1 stitch)
- [ ] PNG export: Save designs as images (1 grid square = 1 pixel)
- [ ] Pattern saving and loading
- [ ] Additional export formats (PDF, chart)

## Tech Stack

- **Lit**: Fast, lightweight web components
- **TypeScript**: Type-safe development
- **Vite**: Lightning-fast build tooling
- **Vitest**: Unit testing

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open your browser to the URL shown in the terminal (usually `http://localhost:5173`).

### Build

```bash
npm run build
```

### Testing

```bash
npm run test       # Run tests in watch mode
npm run test:ui    # Run tests with UI
```

### Linting

```bash
npm run lint       # Check for linting errors
npm run lint:fix   # Auto-fix linting errors
```

### Format

```bash
npm run format     # Format code with Prettier
```

## Project Structure

```
src/
├── components/
│   ├── pattern-grid.ts      # Grid for knit/slip pattern input
│   ├── color-picker.ts      # Row color selection
│   └── output-display.ts    # Visual output of slipped stitch pattern
├── slipped-stitches-app.ts  # Main application component
└── index.css                # Global styles
```

## Usage

1. Set the number of rows and stitches using the input fields
2. Click cells in the pattern grid to toggle between Knit (K) and Slip (S)
3. Choose colors for each row using the color pickers
4. View the resulting pattern in the output panel

## License

Personal project - no license specified yet.

## Author

Diana Broeders (https://github.com/Diaan)
