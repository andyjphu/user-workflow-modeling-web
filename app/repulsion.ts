import type { Node } from '@xyflow/react';

const MIN_DIST = 250;
const MAX_ITERS = 64;

export function applyRepulsion(nodes: Node[]): Node[] {
  let out = nodes.map((n) => ({
    ...n,
    position: { ...n.position },
  }));

  for (let iter = 0; iter < MAX_ITERS; iter++) {
    let changed = false;

    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const a = out[i];
        const b = out[j];

        const dx = b.position.x - a.position.x;
        const dy = b.position.y - a.position.y;
        const dist = Math.hypot(dx, dy) || 1;

        if (dist < MIN_DIST) {
          const overlap = (MIN_DIST - dist) / 2;
          const ux = dx / dist;
          const uy = dy / dist;

          a.position.x -= ux * overlap;
          a.position.y -= uy * overlap;
          b.position.x += ux * overlap;
          b.position.y += uy * overlap;

          changed = true;
        }
      }
    }

    if (!changed) break;
  }

  return out;
}

