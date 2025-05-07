# Massive Battleship Grid

A front-end only implementation of a massive 1000x1000 Battleship grid game with anarchistic participation (free-for-all mode).

## Overview

This project implements a massive shared battleship grid with the following features:
- 1000x1000 cell grid divided into 10x10 chunks (each chunk is 100x100 cells)
- Free-for-all gameplay where anyone can place ships and fire shots
- Heat maps showing active battle zones
- Battle simulation with configurable intensity
- Ability to zoom and pan across the massive grid

## Live Demo

The latest version is deployed at: [https://same-2ufcpbmzmz4-latest.netlify.app](https://same-2ufcpbmzmz4-latest.netlify.app)

## Features

### Grid System
- Massive 1000x1000 grid (1 million cells)
- Divided into 100 chunks (10x10) for organization
- Cell-based interaction for ship placement and firing
- Subtle chunk boundaries for visual organization

### Gameplay
- Place ships of different sizes
- Fire shots at any location on the grid
- Real-time heat map showing active battle areas
- Ships can be placed horizontally or vertically

### Battle Simulation
- Automated simulation of battle activity across the entire grid
- Three intensity levels: Low, Medium, High
- Configurable frequency and number of actions
- Visual indicators of simulation status

### Navigation
- Drag to pan around the massive grid
- Zoomed out view to see multiple chunks at once
- Visual indicators for grid boundaries

## Technical Implementation
- React with TypeScript
- Canvas rendering for efficient display of large grid
- Context API for global state management
- Tailwind CSS for UI components

## Development

### Prerequisites
- Node.js (v14 or higher)
- Bun package manager

### Installation
```bash
# Clone the repository
git clone https://github.com/galitsky94/battleship.git
cd battleship

# Install dependencies
bun install

# Start the development server
bun run dev
```

### Building for Production
```bash
bun run build
```

## Version History

- v10: More subtle grid boundaries without coordinate digits
- v9: Battle simulation across the entire grid
- v8: Grid boundary improvements with console integration
- v7: More visible chunk boundaries
- v6: Zoomed out view showing multiple chunks
- v5: Improved grid with visible chunk boundaries
- v4: Removed simulation and fixed grid issues
- v3: Initial implementation with core features

## License
MIT
