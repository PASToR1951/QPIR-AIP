export const END_OF_LIST_THRESHOLD = 6;

export function shouldShowEndOfListCue(count, threshold = END_OF_LIST_THRESHOLD) {
  return Number.isFinite(count) && count >= threshold;
}
