// These files are stored in static cache  
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/db.js',
    '/index.js',
    '/style.css'
  ];
  
  // Will store static files
  const STATIC_CACHE = "static-cache-v1";
  // Cache handles all dynamic elements that will update when application goes back online
  const RUNTIME= "runtime";
  
  // Installation of caches
  self.addEventListener("install", event => {
    // Adds files to static cache
    event.waitUntil(
      caches
        .open(STATIC_CACHE)
        .then(cache => cache.addAll(FILES_TO_CACHE))
        .then(() => self.skipWaiting())
    );
  });
  

  // Deletes caches if they currently exist
  self.addEventListener("activate", event => {
    const currentCaches = [STATIC_CACHE, RUNTIME];
    event.waitUntil(
      caches
        .keys()
        .then(cacheNames => {
          return cacheNames.filter(
            cacheName => !currentCaches.includes(cacheName)
          );
        })
        .then(cachesToDelete => {
          return Promise.all(
            cachesToDelete.map(cacheToDelete => {
              return caches.delete(cacheToDelete);
            })
          );
        })
        // Sets itself as controller for all clients within scope
        .then(() => self.clients.claim())
    );
  });
  
  self.addEventListener("fetch", event => {
    // If fetch event is not using GET request or routing to a different url,  
    if (
      event.request.method !== "GET" ||
      !event.request.url.startsWith(self.location.origin)
    ) {
      event.respondWith(fetch(event.request));
      return;
    }
  
    if (event.request.url.includes("/api/images")) {
      event.respondWith(
        caches.open(RUNTIME).then(cache => {
          return fetch(event.request)
            .then(response => {
              cache.put(event.request, response.clone());
              return response;
            })
            .catch(() => caches.match(event.request));
        })
      );
      return;
    }
    // Update UI with runtime cache
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return caches.open(RUNTIME).then(cache => {
          return fetch(event.request).then(response => {
            return cache.put(event.request, response.clone()).then(() => {
              return response;
            });
          });
        });
      })
    );
  });