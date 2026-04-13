function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function clampToViewport(position, size, viewportSize, margin) {
  return clamp(position, margin, Math.max(margin, viewportSize - size - margin));
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

function buildCardCandidate(targetRect, placement, cardW, cardH, viewW, viewH) {
  const MARGIN = 16;
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

  const top = clampToViewport(preferredTop, cardH, viewH, MARGIN);
  const left = clampToViewport(preferredLeft, cardW, viewW, MARGIN);
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

export function getCardPosition(targetRect, placement, cardH, viewW, viewH) {
  const MARGIN = 16;
  const cardW = Math.min(360, viewW - MARGIN * 2);
  const candidates = getPlacementOrder(placement, targetRect, viewW, viewH)
    .map((candidatePlacement, priority) => ({
      priority,
      ...buildCardCandidate(targetRect, candidatePlacement, cardW, cardH, viewW, viewH),
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
    top: bestCandidate?.top ?? MARGIN,
    left: bestCandidate?.left ?? MARGIN,
    width: bestCandidate?.width ?? cardW,
  };
}

export function getDetachedCardPosition(cardH, viewW, viewH) {
  const MARGIN = 16;
  const cardW = Math.min(360, viewW - MARGIN * 2);
  const left = viewW < 640
    ? clamp((viewW - cardW) / 2, MARGIN, viewW - cardW - MARGIN)
    : viewW - cardW - MARGIN;

  return {
    top: clamp(MARGIN, MARGIN, viewH - cardH - MARGIN),
    left,
    width: cardW,
  };
}
