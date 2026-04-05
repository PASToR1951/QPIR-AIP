/**
 * useTextMeasure — DOM-reflow-free text height measurement via @chenglou/pretext.
 *
 * Mobile/tablet aware:
 *  - Accepts responsive font config keyed by Tailwind-style breakpoints.
 *  - Tracks container width via ResizeObserver (handles orientation changes).
 *  - Busts the pretext cache whenever the active font changes.
 *  - Rounds maxWidth to device-pixel boundaries to avoid sub-pixel drift on
 *    high-DPR screens (retina, AMOLED).
 *
 * Basic usage (fixed font):
 *   const { measureText, containerRef } = useTextMeasure({
 *     font: '14px Inter',
 *     lineHeight: 20,
 *   });
 *   const { height, lineCount } = measureText(text);   // width auto-detected
 *   <div ref={containerRef}>…</div>
 *
 * Responsive usage (font changes at breakpoints):
 *   const { measureText, containerRef } = useTextMeasure({
 *     responsiveFont: {
 *       default:  '14px Inter',   // mobile-first base
 *       768:      '15px Inter',   // ≥ 768 px  (tablet)
 *       1024:     '16px Inter',   // ≥ 1024 px (desktop)
 *     },
 *     lineHeight: 22,
 *   });
 *   const { height, lineCount } = measureText(text);
 *   <div ref={containerRef}>…</div>
 *
 * You may still pass an explicit maxWidth as the second argument to measureText
 * when you already know the container width (e.g. inside a virtualised list).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { prepare, layout } from '@chenglou/pretext';

/**
 * Resolve which font string applies for a given viewport width.
 *
 * @param {Record<string|number, string>} responsiveFont
 *   Keys are breakpoint px values (numbers or numeric strings) plus "default".
 * @param {number} viewportWidth
 * @returns {string}
 */
function resolveFont(responsiveFont, viewportWidth) {
  const breakpoints = Object.keys(responsiveFont)
    .filter((k) => k !== 'default')
    .map(Number)
    .sort((a, b) => a - b);

  let active = responsiveFont.default;
  for (const bp of breakpoints) {
    if (viewportWidth >= bp) active = responsiveFont[bp];
  }
  return active;
}

/**
 * Round a pixel value down to the nearest device pixel to avoid sub-pixel
 * measurement drift on high-DPR (retina / AMOLED) displays.
 *
 * @param {number} px
 * @returns {number}
 */
function snapToDevicePixel(px) {
  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio ?? 1) : 1;
  return Math.floor(px * dpr) / dpr;
}

/**
 * @param {object}  options
 * @param {string}  [options.font]            Fixed canvas font string (mutually exclusive with responsiveFont).
 * @param {Record<string|number,string>} [options.responsiveFont]
 *                                            Breakpoint-keyed font map (see file header).
 * @param {number}  options.lineHeight        Line-height in pixels — must match your CSS.
 *
 * @returns {{
 *   measureText: (text: string, maxWidth?: number) => { height: number, lineCount: number },
 *   containerRef: React.RefObject,
 *   containerWidth: number,
 *   activeFont: string,
 * }}
 */
export function useTextMeasure({ font, responsiveFont, lineHeight }) {
  // ── container width (tracked via ResizeObserver) ────────────────────────────
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentBoxSize
          ? entry.contentBoxSize[0].inlineSize
          : entry.contentRect.width;
        setContainerWidth(snapToDevicePixel(w));
      }
    });

    observer.observe(el);
    // Capture initial size immediately.
    setContainerWidth(snapToDevicePixel(el.getBoundingClientRect().width));

    return () => observer.disconnect();
  }, []);

  // ── active font (responsive breakpoint resolution) ──────────────────────────
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    if (!responsiveFont) return;

    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize, { passive: true });
    // Orientation change fires resize on all modern browsers, but keep this
    // for legacy iOS Safari compatibility.
    window.addEventListener('orientationchange', onResize, { passive: true });

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [responsiveFont]);

  const activeFont = responsiveFont
    ? resolveFont(responsiveFont, viewportWidth)
    : font;

  // ── pretext cache (busted when font changes) ────────────────────────────────
  const cache = useRef(new Map());
  const prevFont = useRef(activeFont);

  if (prevFont.current !== activeFont) {
    cache.current.clear();
    prevFont.current = activeFont;
  }

  // ── public measureText ───────────────────────────────────────────────────────
  const measureText = useCallback(
    (text, maxWidth) => {
      const width = maxWidth != null ? snapToDevicePixel(maxWidth) : containerWidth;

      if (!text || width <= 0) return { height: lineHeight, lineCount: 1 };

      // Cache key is text only — prepare() depends on text+font, not width.
      // width is only used in the layout() call below.
      const cacheKey = text;
      let prepared = cache.current.get(cacheKey);

      if (!prepared) {
        prepared = prepare(text, activeFont);
        cache.current.set(cacheKey, prepared);

        // LRU-lite: evict oldest entry when cache grows too large.
        if (cache.current.size > 500) {
          cache.current.delete(cache.current.keys().next().value);
        }
      }

      return layout(prepared, width, lineHeight);
    },
    [activeFont, lineHeight, containerWidth]
  );

  return { measureText, containerRef, containerWidth, activeFont };
}