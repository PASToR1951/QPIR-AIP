import { lazy } from 'react';

// After a new deploy, content-hashed chunk files from the previous build are
// removed from the server. Browser tabs still running the old entry point at
// those dead filenames, so dynamic imports 404 with "Failed to fetch
// dynamically imported module". The fix: when a chunk fails to load, reload the
// page once to pull the fresh index.html + matching chunks.
//
// A sessionStorage flag guards against an infinite reload loop — if the import
// still fails after one reload (i.e. a genuine error, offline, etc.), we let
// the error propagate so the error boundary can render.
const RELOAD_FLAG = 'chunk-reload-attempted';

function isChunkLoadError(error) {
  const message = String(error?.message || error || '');
  return (
    /Failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message)
  );
}

function reloadOnce() {
  let alreadyReloaded = false;
  try {
    alreadyReloaded = window.sessionStorage.getItem(RELOAD_FLAG) === '1';
    window.sessionStorage.setItem(RELOAD_FLAG, '1');
  } catch {
    /* sessionStorage unavailable — fall through */
  }
  if (!alreadyReloaded) {
    window.location.reload();
    return true;
  }
  return false;
}

// Catch chunk-load failures that don't flow through a React.lazy boundary:
// route/preload prefetch hints (preload/onMouseEnter handlers) and on-demand
// dynamic imports such as the PDF export path (jspdf/html2canvas/doc chunks).
// Vite emits `vite:preloadError` for failed preloads; unhandledrejection
// covers the rest. Either way we reload once to fetch the fresh build.
export function registerChunkErrorReload() {
  if (typeof window === 'undefined') return;

  window.addEventListener('vite:preloadError', (event) => {
    if (reloadOnce()) event.preventDefault();
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (isChunkLoadError(event.reason)) {
      if (reloadOnce()) event.preventDefault();
    }
  });
}

export default function lazyWithRetry(factory) {
  return lazy(() =>
    factory()
      .then((module) => {
        // Successful load — clear the guard so future deploys can retry.
        try {
          window.sessionStorage.removeItem(RELOAD_FLAG);
        } catch {
          /* sessionStorage unavailable — ignore */
        }
        return module;
      })
      .catch((error) => {
        if (!isChunkLoadError(error)) {
          throw error;
        }

        if (reloadOnce()) {
          // Return a never-resolving promise so React doesn't flash the error
          // boundary during the brief moment before the reload takes effect.
          return new Promise(() => {});
        }

        throw error;
      })
  );
}
