function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function clampToRange(position, size, rangeStart, rangeSize, margin) {
  const min = rangeStart + margin;
  const max = Math.max(min, rangeStart + rangeSize - size - margin);
  return clamp(position, min, max);
}

function readSafeTop(fallback) {
  if (typeof window === 'undefined') return fallback;
  const value = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue('--tour-safe-top')
    .trim();
  if (!value) return fallback;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(parsed, fallback) : fallback;
}

function getRectOverlapArea(a, b) {
  const overlapWidth = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const overlapHeight = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return overlapWidth * overlapHeight;
}

function getPlacementOrder(placement, targetRect, viewW, viewH) {
  const normalizedPlacement = ['top', 'bottom', 'left', 'right'].includes(placement)
    ? placement
    : 'bottom';
  const oppositePlacement = {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left',
  }[normalizedPlacement];

  if (normalizedPlacement === 'top' || normalizedPlacement === 'bottom') {
    const sidePlacements = viewW - targetRect.right >= targetRect.left
      ? ['right', 'left']
      : ['left', 'right'];
    return [normalizedPlacement, oppositePlacement, ...sidePlacements];
  }

  const verticalPlacements = viewH - targetRect.bottom >= targetRect.top
    ? ['bottom', 'top']
    : ['top', 'bottom'];
  return [normalizedPlacement, oppositePlacement, ...verticalPlacements];
}

function buildCardCandidate(targetRect, placement, cardW, cardH, viewport) {
  const { width: viewW, height: viewH, offsetTop, offsetLeft, marginTop, marginSide } = viewport;
  const GAP = 16;
  const centeredLeft = targetRect.left + targetRect.width / 2 - cardW / 2;
  const centeredTop = targetRect.top + targetRect.height / 2 - cardH / 2;

  let preferredTop = centeredTop;
  let preferredLeft = centeredLeft;

  if (placement === 'top') {
    preferredTop = targetRect.top - cardH - GAP;
  } else if (placement === 'bottom') {
    preferredTop = targetRect.bottom + GAP;
  } else if (placement === 'left') {
    preferredLeft = targetRect.left - cardW - GAP;
  } else if (placement === 'right') {
    preferredLeft = targetRect.right + GAP;
  }

  const top = clampToRange(preferredTop, cardH, offsetTop, viewH, marginTop);
  const left = clampToRange(preferredLeft, cardW, offsetLeft, viewW, marginSide);
  const rect = {
    top,
    left,
    right: left + cardW,
    bottom: top + cardH,
  };

  return {
    placement,
    top,
    left,
    width: cardW,
    overlapArea: getRectOverlapArea(rect, targetRect),
    clampOffset: Math.abs(preferredTop - top) + Math.abs(preferredLeft - left),
  };
}

function resolveViewportBounds(rawViewport) {
  if (rawViewport && typeof rawViewport === 'object' && 'width' in rawViewport) {
    const marginSide = 16;
    const marginTop = readSafeTop(marginSide);
    return {
      width: rawViewport.width,
      height: rawViewport.height,
      offsetTop: rawViewport.offsetTop ?? 0,
      offsetLeft: rawViewport.offsetLeft ?? 0,
      marginTop,
      marginSide,
    };
  }

  // Legacy positional-args fallback for safety.
  const marginSide = 16;
  const marginTop = readSafeTop(marginSide);
  return {
    width: rawViewport ?? (typeof window !== 'undefined' ? window.innerWidth : 0),
    height: arguments[1] ?? (typeof window !== 'undefined' ? window.innerHeight : 0),
    offsetTop: 0,
    offsetLeft: 0,
    marginTop,
    marginSide,
  };
}

export function getCardPosition(targetRect, placement, cardH, viewportArg, legacyViewH) {
  const viewport = typeof viewportArg === 'object' && viewportArg !== null
    ? resolveViewportBounds(viewportArg)
    : resolveViewportBounds({
        width: viewportArg,
        height: legacyViewH,
        offsetTop: 0,
        offsetLeft: 0,
      });
  const cardW = Math.min(360, viewport.width - viewport.marginSide * 2);
  const candidates = getPlacementOrder(placement, targetRect, viewport.width, viewport.height)
    .map((candidatePlacement, priority) => ({
      priority,
      ...buildCardCandidate(targetRect, candidatePlacement, cardW, cardH, viewport),
    }));

  const bestCandidate = candidates.reduce((best, candidate) => {
    if (!best) return candidate;
    if (candidate.overlapArea !== best.overlapArea) {
      return candidate.overlapArea < best.overlapArea ? candidate : best;
    }
    if (candidate.clampOffset !== best.clampOffset) {
      return candidate.clampOffset < best.clampOffset ? candidate : best;
    }
    return candidate.priority < best.priority ? candidate : best;
  }, null);

  return {
    top: bestCandidate?.top ?? (viewport.offsetTop + viewport.marginTop),
    left: bestCandidate?.left ?? (viewport.offsetLeft + viewport.marginSide),
    width: bestCandidate?.width ?? cardW,
  };
}

export function getDetachedCardPosition(cardH, viewportArg, legacyViewH) {
  const viewport = typeof viewportArg === 'object' && viewportArg !== null
    ? resolveViewportBounds(viewportArg)
    : resolveViewportBounds({
        width: viewportArg,
        height: legacyViewH,
        offsetTop: 0,
        offsetLeft: 0,
      });
  const cardW = Math.min(360, viewport.width - viewport.marginSide * 2);
  const left = viewport.width < 640
    ? clamp(viewport.offsetLeft + (viewport.width - cardW) / 2, viewport.offsetLeft + viewport.marginSide, viewport.offsetLeft + viewport.width - cardW - viewport.marginSide)
    : viewport.offsetLeft + viewport.width - cardW - viewport.marginSide;

  return {
    top: clamp(viewport.offsetTop + viewport.marginTop, viewport.offsetTop + viewport.marginTop, viewport.offsetTop + viewport.height - cardH - viewport.marginSide),
    left,
    width: cardW,
  };
}
