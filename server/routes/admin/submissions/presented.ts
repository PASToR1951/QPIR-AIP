export function resolvePresentedValue(
  currentPresented: boolean,
  requestedPresented: unknown,
): boolean {
  return typeof requestedPresented === "boolean"
    ? requestedPresented
    : !currentPresented;
}
