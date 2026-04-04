// Module-level SSE client registry.
// Maps userId → set of sender callbacks, one per open SSE connection.
// Call pushNotification() / pushNotifications() after any notification.create
// or notification.createManyAndReturn to instantly deliver to connected clients.

type Notif = {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: Date;
};

type Sender = (notif: Notif) => void;

const clients = new Map<number, Set<Sender>>();

/** Maximum concurrent SSE connections per user to prevent memory exhaustion. */
const MAX_CONNECTIONS_PER_USER = 5;

/** Maximum total SSE connections across all users to prevent server memory exhaustion. */
const MAX_GLOBAL_CONNECTIONS = 500;

/** Current total active SSE connections. */
let totalConnections = 0;

/** Register an SSE connection. Returns an unsubscribe cleanup function, or null if limit exceeded. */
export function subscribe(userId: number, sender: Sender): (() => void) | null {
  if (totalConnections >= MAX_GLOBAL_CONNECTIONS) {
    return null; // Global connection limit exceeded
  }

  if (!clients.has(userId)) clients.set(userId, new Set());
  const userClients = clients.get(userId)!;

  if (userClients.size >= MAX_CONNECTIONS_PER_USER) {
    return null; // Per-user connection limit exceeded
  }

  userClients.add(sender);
  totalConnections++;
  return () => {
    const set = clients.get(userId);
    if (!set) return;
    set.delete(sender);
    if (set.size === 0) clients.delete(userId);
    totalConnections--;
  };
}

/** Push a single notification to all SSE connections for a user. */
export function pushNotification(notif: Notif): void {
  clients.get(notif.user_id)?.forEach(s => {
    try { s(notif); } catch { /* dead connection — ignore */ }
  });
}

/** Push an array of notifications (e.g. result of createManyAndReturn). */
export function pushNotifications(notifs: Notif[]): void {
  for (const notif of notifs) pushNotification(notif);
}
