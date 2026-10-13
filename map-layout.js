/* Keep labels apart without changing the underlying map scores. */
(function (root) {
  const LABEL_WIDTH = 110;
  const LABEL_HEIGHT = 24;
  const X_GAP = 8;
  const Y_GAP = 7;

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function overlaps(a, b) {
    return Math.abs(a.x - b.x) < LABEL_WIDTH + X_GAP &&
      Math.abs(a.y - b.y) < LABEL_HEIGHT + Y_GAP;
  }

  function place(points, width, height) {
    const offsets = [[0, 0]];
    for (let radius = 1; radius <= 8; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) === radius) offsets.push([dx * 42, dy * 30]);
        }
      }
    }
    offsets.sort((a, b) => (a[0] ** 2 + a[1] ** 2) - (b[0] ** 2 + b[1] ** 2));
    const placed = [];
    for (const point of points) {
      const xMin = point.sideX === 'left' ? 62 : width / 2 + 64;
      const xMax = point.sideX === 'left' ? width / 2 - 64 : width - 62;
      const yMin = point.sideY === 'top' ? 65 : height / 2 + 25;
      const yMax = point.sideY === 'top' ? height / 2 - 25 : height - 55;
      const anchorX = clamp(point.x * width, xMin, xMax);
      const anchorY = clamp(point.y * height, yMin, yMax);
      let best = null;
      for (const [dx, dy] of offsets) {
        const candidate = { id: point.id, x: clamp(anchorX + dx, xMin, xMax), y: clamp(anchorY + dy, yMin, yMax) };
        if (placed.every(other => !overlaps(candidate, other))) { best = candidate; break; }
      }
      if (!best) best = { id: point.id, x: anchorX, y: anchorY };
      placed.push(best);
    }
    return placed;
  }

  const api = { place, overlaps, LABEL_WIDTH, LABEL_HEIGHT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MPSMapLayout = api;
})(typeof window !== 'undefined' ? window : globalThis);
