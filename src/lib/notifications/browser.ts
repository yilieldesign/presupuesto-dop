export type NotificationPermissionState =
  | "granted"
  | "denied"
  | "default"
  | "unsupported";

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";

  const result = await Notification.requestPermission();
  return result;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

export async function showFixedExpenseReminder(
  title: string,
  body: string,
  tag: string
): Promise<void> {
  if (!isNotificationSupported() || Notification.permission !== "granted") {
    return;
  }

  const registration = await navigator.serviceWorker?.ready.catch(() => null);

  if (registration?.active) {
    registration.active.postMessage({
      type: "SHOW_REMINDER",
      title,
      body,
      tag,
    });
    return;
  }

  new Notification(title, {
    body,
    tag,
    icon: "/icon",
    badge: "/icon",
  });
}
