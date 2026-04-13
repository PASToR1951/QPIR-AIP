import { MODELS } from './schemaData.js';

export const CARD_W = 230;
export const HEADER_H = 36;
export const ROW_H = 22;
const GAP_X = 80;
const GAP_Y = 70;

function cardHeight(model) {
  return HEADER_H + model.fields.length * ROW_H + 8;
}

const LAYOUT = {
  Cluster: { col: 0, row: 0 },
  User: { col: 0, row: 1 },
  School: { col: 1, row: 0 },
  AIP: { col: 1, row: 1 },
  AIPActivity: { col: 1, row: 2 },
  PIRActivityReview: { col: 1, row: 3 },
  Program: { col: 2, row: 0 },
  PIR: { col: 2, row: 2 },
  PIRFactor: { col: 2, row: 3 },
  Deadline: { col: 3, row: 2 },
};

export function computePositions() {
  const rowHeights = {};
  for (const model of MODELS) {
    const layout = LAYOUT[model.name];
    const height = cardHeight(model);
    rowHeights[layout.row] = Math.max(rowHeights[layout.row] || 0, height);
  }

  const positions = {};
  for (const model of MODELS) {
    const layout = LAYOUT[model.name];
    let y = 20;
    for (let row = 0; row < layout.row; row += 1) {
      y += (rowHeights[row] || 0) + GAP_Y;
    }
    positions[model.name] = {
      x: 20 + layout.col * (CARD_W + GAP_X),
      y,
      w: CARD_W,
      h: cardHeight(model),
    };
  }

  return positions;
}

export function computeViewBounds(positions) {
  let maxX = 0;
  let maxY = 0;

  for (const model of MODELS) {
    const position = positions[model.name];
    maxX = Math.max(maxX, position.x + position.w + 40);
    maxY = Math.max(maxY, position.y + position.h + 40);
  }

  return { maxX, maxY };
}

export function getEdgePoint(rect, tx, ty) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const dx = tx - cx;
  const dy = ty - cy;
  const hw = rect.w / 2;
  const hh = rect.h / 2;
  if (dx === 0 && dy === 0) return { x: cx, y: cy, edge: 'none' };

  const sx = hw / (Math.abs(dx) || 1);
  const sy = hh / (Math.abs(dy) || 1);
  const edge = sx <= sy
    ? (dx > 0 ? 'right' : 'left')
    : (dy > 0 ? 'bottom' : 'top');
  const scale = Math.min(sx, sy);

  return { x: cx + dx * scale, y: cy + dy * scale, edge };
}

export function ctrlDelta(edge, distance) {
  if (edge === 'right') return [distance, 0];
  if (edge === 'left') return [-distance, 0];
  if (edge === 'bottom') return [0, distance];
  if (edge === 'top') return [0, -distance];
  return [0, 0];
}

export function bezierAt(t, x0, y0, cx1, cy1, cx2, cy2, x1, y1) {
  const m = 1 - t;
  return {
    x: m * m * m * x0 + 3 * m * m * t * cx1 + 3 * m * t * t * cx2 + t * t * t * x1,
    y: m * m * m * y0 + 3 * m * m * t * cy1 + 3 * m * t * t * cy2 + t * t * t * y1,
  };
}
