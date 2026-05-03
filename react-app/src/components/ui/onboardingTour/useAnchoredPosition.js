import { useEffect, useState } from 'react';
import { areRectsEqual, resolveTargetSnapshot } from './dom.js';
import { useViewportSize } from './useViewportSize.js';

const HINT_WIDTH = 288;
const SAFE_MARGIN = 16;

export function useAnchoredPosition({ target, enabled = true, gap = 12 }) {
  const viewport = useViewportSize();
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (!enabled || !target) return undefined;

    let frameId = 0;
    const refresh = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        const { rect: nextRect } = resolveTargetSnapshot(target);
        setRect((prev) => (areRectsEqual(prev, nextRect) ? prev : nextRect));
      });
    };

    refresh();

    const mutationObserver = new MutationObserver(refresh);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'data-tour'],
    });

    window.addEventListener('resize', refresh);
    window.addEventListener('scroll', refresh, true);

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(refresh);
      const el = document.querySelector(`[data-tour="${Array.isArray(target) ? target[0] : target}"]`);
      if (el) resizeObserver.observe(el);
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      mutationObserver.disconnect();
      window.removeEventListener('resize', refresh);
      window.removeEventListener('scroll', refresh, true);
      resizeObserver?.disconnect();
    };
  }, [enabled, target]);

  if (!rect) return null;

  const visTop = viewport.offsetTop ?? 0;
  const visLeft = viewport.offsetLeft ?? 0;
  const visBottom = visTop + viewport.height;
  const visRight = visLeft + viewport.width;

  const overlapsViewport =
    rect.top < visBottom &&
    rect.bottom > visTop &&
    rect.left < visRight &&
    rect.right > visLeft;
  if (!overlapsViewport) return null;

  const desiredTop = rect.bottom + gap;
  const minTop = visTop + SAFE_MARGIN;
  const maxTop = visTop + viewport.height - SAFE_MARGIN;
  const top = Math.min(Math.max(desiredTop, minTop), maxTop);

  const desiredLeft = rect.left;
  const maxLeft = visLeft + viewport.width - HINT_WIDTH - SAFE_MARGIN;
  const minLeft = visLeft + SAFE_MARGIN;
  const left = Math.min(Math.max(desiredLeft, minLeft), maxLeft);

  return { top, left, width: HINT_WIDTH };
}
