export const ONBOARDING_SIGNAL_EVENT = 'onboarding:signal';

export function emitOnboardingSignal(signal, detail = {}) {
  if (typeof window === 'undefined' || !signal) return;
  window.dispatchEvent(new CustomEvent(ONBOARDING_SIGNAL_EVENT, {
    detail: {
      signal,
      ...detail,
    },
  }));
}
