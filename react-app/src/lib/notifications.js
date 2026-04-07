function notificationTimeValue(notification) {
  const timestamp = new Date(notification?.created_at ?? 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function mergeNotifications(existing = [], incoming = []) {
  const byId = new Map();

  for (const notification of [...existing, ...incoming]) {
    if (!notification || notification.id == null) continue;

    const current = byId.get(notification.id);
    byId.set(notification.id, current ? { ...current, ...notification } : notification);
  }

  return Array.from(byId.values()).sort((a, b) => {
    if (a.read !== b.read) return Number(a.read) - Number(b.read);
    return notificationTimeValue(b) - notificationTimeValue(a);
  });
}
