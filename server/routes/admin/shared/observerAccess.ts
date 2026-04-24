export function canUpdateObserverNotes(actor: { role: string }): boolean {
  return actor.role === "Observer";
}
