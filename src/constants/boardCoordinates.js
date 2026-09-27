// Player Colors
export const PLAYER_COLORS = ['red', 'green', 'yellow', 'blue'];

// Grid scaling factor
export const CELL_SIZE = 1.0;
export const BOARD_SURFACE_Y = 0.15;
export const TOKEN_HEIGHT_Y = 0.35;

/**
 * Converts grid (col, row) [0..14] to 3D world [x, y, z]
 * Board is centered at (7, 7) -> (0, 0, 0)
 */
export function gridToWorld(col, row, y = TOKEN_HEIGHT_Y) {
  const x = (col - 7) * CELL_SIZE;
  const z = (row - 7) * CELL_SIZE;
  return [x, y, z];
}

// 52 Perimeter circuit cells (col, row)
export const CIRCUIT_GRID = [
  // Top-left arm going right (Red start at index 0)
  [1, 6], [2, 6], [3, 6], [4, 6], [5, 6],
  // Top arm going up
  [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0],
  // Top edge cross
  [7, 0], [8, 0],
  // Top arm going down (Green start at index 13)
  [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
  // Right arm going right
  [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
  // Right edge cross
  [14, 7], [14, 8],
  // Right arm going left (Yellow start at index 26)
  [13, 8], [12, 8], [11, 8], [10, 8], [9, 8],
  // Bottom arm going down
  [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14],
  // Bottom edge cross
  [7, 14], [6, 14],
  // Bottom arm going up (Blue start at index 39)
  [6, 13], [6, 12], [6, 11], [6, 10], [6, 9],
  // Left arm going left
  [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  // Left edge cross
  [0, 7], [0, 6]
];

// Pre-compute 3D world coordinates for all 52 circuit tiles
export const CIRCUIT_COORDINATES = CIRCUIT_GRID.map(([c, r]) => gridToWorld(c, r));

// Base token slot coordinates for each color (steps = -1)
export const BASE_SLOTS = {
  red: [
    gridToWorld(2.0, 2.0),
    gridToWorld(3.5, 2.0),
    gridToWorld(2.0, 3.5),
    gridToWorld(3.5, 3.5),
  ],
  green: [
    gridToWorld(11.0, 2.0),
    gridToWorld(12.5, 2.0),
    gridToWorld(11.0, 3.5),
    gridToWorld(12.5, 3.5),
  ],
  yellow: [
    gridToWorld(11.0, 11.0),
    gridToWorld(12.5, 11.0),
    gridToWorld(11.0, 12.5),
    gridToWorld(12.5, 12.5),
  ],
  blue: [
    gridToWorld(2.0, 11.0),
    gridToWorld(3.5, 11.0),
    gridToWorld(2.0, 12.5),
    gridToWorld(3.5, 12.5),
  ],
};

// Home stretches for each color (steps 51 to 55) and Center Home (step 56)
export const HOME_STRETCHES = {
  red: [
    gridToWorld(1, 7),
    gridToWorld(2, 7),
    gridToWorld(3, 7),
    gridToWorld(4, 7),
    gridToWorld(5, 7),
    gridToWorld(6.3, 7.0), // Home final
  ],
  green: [
    gridToWorld(7, 1),
    gridToWorld(7, 2),
    gridToWorld(7, 3),
    gridToWorld(7, 4),
    gridToWorld(7, 5),
    gridToWorld(7.0, 6.3), // Home final
  ],
  yellow: [
    gridToWorld(13, 7),
    gridToWorld(12, 7),
    gridToWorld(11, 7),
    gridToWorld(10, 7),
    gridToWorld(9, 7),
    gridToWorld(7.7, 7.0), // Home final
  ],
  blue: [
    gridToWorld(7, 13),
    gridToWorld(7, 12),
    gridToWorld(7, 11),
    gridToWorld(7, 10),
    gridToWorld(7, 9),
    gridToWorld(7.0, 7.7), // Home final
  ],
};

export const COLOR_PALETTE = {
  red: {
    primary: '#EF4444',
    secondary: '#FCA5A5',
    dark: '#991B1B',
    glow: '#FF6B6B'
  },
  green: {
    primary: '#10B981',
    secondary: '#6EE7B7',
    dark: '#065F46',
    glow: '#34D399'
  },
  yellow: {
    primary: '#F59E0B',
    secondary: '#FDE68A',
    dark: '#92400E',
    glow: '#FCD34D'
  },
  blue: {
    primary: '#3B82F6',
    secondary: '#93C5FD',
    dark: '#1E40AF',
    glow: '#60A5FA'
  }
};

export const START_TILES = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39
};

export const SAFE_CIRCUIT_TILES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

/**
 * Returns the exact 3D position [x, y, z] for a token of `color` at `step`
 * - step == -1: Base slot `tokenIndex`
 * - 0 <= step <= 50: Circuit tile
 * - 51 <= step <= 56: Home stretch / final home
 */
export function getToken3DPosition(color, tokenIndex, step) {
  if (step === -1) {
    return BASE_SLOTS[color][tokenIndex];
  }
  if (step >= 0 && step <= 50) {
    const circuitIndex = (START_TILES[color] + step) % 52;
    return CIRCUIT_COORDINATES[circuitIndex];
  }
  if (step >= 51 && step <= 56) {
    const stretchIndex = step - 51;
    return HOME_STRETCHES[color][stretchIndex];
  }
  return [0, TOKEN_HEIGHT_Y, 0];
}
