import { useEffect, useState } from 'react';

function readViewport() {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0, offsetTop: 0, offsetLeft: 0 };
  }

  const vv = window.visualViewport;
  if (vv) {
    return {
      width: vv.width,
      height: vv.height,
      offsetTop: vv.offsetTop,
      offsetLeft: vv.offsetLeft,
    };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
    offsetTop: 0,
    offsetLeft: 0,
  };
}

export function useViewportSize() {
  const [size, setSize] = useState(readViewport);

  useEffect(() => {
    let frameId = 0;

    const update = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        setSize((prev) => {
          const next = readViewport();
          if (
            prev.width === next.width &&
            prev.height === next.height &&
            prev.offsetTop === next.offsetTop &&
            prev.offsetLeft === next.offsetLeft
          ) {
            return prev;
          }
          return next;
        });
      });
    };

    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', update);
      vv.addEventListener('scroll', update);
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      if (vv) {
        vv.removeEventListener('resize', update);
        vv.removeEventListener('scroll', update);
      }
    };
  }, []);

  return size;
}
