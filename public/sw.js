/* Hommies push notifications service worker */

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = { title: "Hommies", body: "Du har en ny notifikation", url: "/" };

  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch (_) {
    // ignore parse errors and use defaults
  }

  const options = {
    body: payload.body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: { url: payload.url || "/" },
    vibrate: [120, 60, 120],
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
