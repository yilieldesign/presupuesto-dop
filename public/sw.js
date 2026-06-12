self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow("/");
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "SHOW_REMINDER") return;

  const { title, body, tag } = event.data;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      icon: "/icon",
      badge: "/icon",
      data: { url: "/" },
    })
  );
});
