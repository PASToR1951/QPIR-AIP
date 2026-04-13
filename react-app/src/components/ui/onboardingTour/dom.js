export function getTargetNames(target) {
  if (Array.isArray(target)) return target.filter(Boolean);
  return target ? [target] : [];
}

export function isElementVisible(element) {
  if (!element) return false;

  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

export function getTargetElement(target) {
  for (const name of getTargetNames(target)) {
    const matches = [...document.querySelectorAll(`[data-tour="${name}"]`)];
    const visibleMatch = matches.find(isElementVisible);
    if (visibleMatch) return visibleMatch;
  }

  return null;
}

export function getRectSnapshot(element) {
  if (!element || !isElementVisible(element)) return null;

  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    bottom: rect.bottom,
    right: rect.right,
  };
}

export function resolveTargetSnapshot(target) {
  const element = getTargetElement(target);
  return {
    element,
    rect: getRectSnapshot(element),
  };
}

export function areRectsEqual(a, b) {
  if (a === b) return true;
  if (!a || !b) return !a && !b;

  return ['top', 'left', 'width', 'height', 'bottom', 'right']
    .every((key) => Math.abs(a[key] - b[key]) < 0.5);
}
