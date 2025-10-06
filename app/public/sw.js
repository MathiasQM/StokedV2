/* eslint-disable no-restricted-globals */
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from 'workbox-precaching'
import { setDefaultHandler, setCatchHandler } from 'workbox-routing'
import { NetworkOnly } from 'workbox-strategies'

/* ────────────────── one-time cleanup ────────────────── */
self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k)))),
  )
})

/* ────────────────── SW life-cycle ───────────────────── */
self.skipWaiting()
clientsClaim()
self.__WB_DISABLE_DEV_LOGS = true // silence Workbox banner

/* ───────────── 1)  precache just the offline page ───── */
precacheAndRoute([
  ...self.__WB_MANIFEST,
  { url: '/offline.html', revision: null },
])
/* ───────────── 2)  serve everything network-only ────── */
setDefaultHandler(new NetworkOnly())

/* ───────────── 3)  offline fallback for navigations ─── */
setCatchHandler(async ({ request }) => {
  if (request.destination === 'document') {
    return caches.match('/offline.html')
  }
  return Response.error()
})

/* ───────────── 4)  PUSH notifications ───────────────── */
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const title = data.title ?? 'New notification'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body ?? '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data, // keep custom payload
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((tabs) => {
        for (const tab of tabs) {
          if (tab.url === url && 'focus' in tab) return tab.focus()
        }
        return clients.openWindow(url)
      }),
  )
})
