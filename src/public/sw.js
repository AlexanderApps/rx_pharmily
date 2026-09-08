// Service worker for web push. Must be served from the site root
// (public/sw.js → https://yoursite.com/sw.js) — a service worker's scope
// is limited to the directory it's served from and everything below it,
// so serving it from anywhere deeper (e.g. /static/sw.js) would only
// ever cover /static/*, not the whole app.

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    // Not JSON — show something rather than silently dropping it.
    payload = { title: "New notification", body: event.data.text() };
  }

  const title = payload.title || "New notification";
  const options = {
    body: payload.body || "",
    icon: "/icon.png", // adjust to wherever this project's actual app icon lives in public/
    badge: "/icon.png",
    data: payload.data || {}, // carries link.pathname/params through to the click handler below
    tag: payload.category, // same category replaces an unread, still-showing notification instead of stacking a duplicate
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Tapping the system notification focuses an already-open tab if one
// exists, or opens a new one — and navigates to whatever link the
// notification carried, matching the same in-app navigation every
// notification already supports when tapped from the notifications
// screen itself.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const pathname = event.notification.data?.link_pathname || "/notifications";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.postMessage({ type: "notification-click", pathname, params: event.notification.data?.link_params });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(pathname);
      }
    }),
  );
});
