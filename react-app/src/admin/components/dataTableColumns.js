export function withResponsiveHide(columns, hideBelow = {}) {
  const keyToBreakpoint = {};
  for (const [bp, keys] of Object.entries(hideBelow)) {
    for (const k of keys) keyToBreakpoint[k] = bp;
  }
  return columns.map(col =>
    keyToBreakpoint[col.key] ? { ...col, hideBelow: keyToBreakpoint[col.key] } : col
  );
}
