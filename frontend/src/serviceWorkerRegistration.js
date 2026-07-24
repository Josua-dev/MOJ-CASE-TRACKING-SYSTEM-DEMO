/**
 * Service Worker registration utility
 *
 * Registers the service worker for offline support and PWA installability.
 * Only registers in production builds — skipped during development.
 */

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.\d+){3}$/)
);

export function registerServiceWorker(config) {
  if (process.env.NODE_ENV !== 'production') {
    // Service worker only enabled in production
    return;
  }

  if (!('serviceWorker' in navigator)) {
    // Service workers not supported
    return;
  }

  const publicUrl = new URL(process.env.PUBLIC_URL || '/', window.location.href);
  if (publicUrl.origin !== window.location.origin) {
    // Service worker won't work if PUBLIC_URL is on a different origin
    return;
  }

  const swUrl = `${process.env.PUBLIC_URL || '/'}service-worker.js`;

  if (isLocalhost) {
    // Running on localhost — check if service worker exists
    checkValidServiceWorker(swUrl, config);
    navigator.serviceWorker.ready.then(() => {
      console.log('📡 SW ready (localhost)');
    });
  } else {
    // Production — register the service worker
    registerValidSW(swUrl, config);
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('📡 New content available — please refresh.');
              if (config && config.onUpdate) config.onUpdate(registration);
            } else {
              console.log('📡 Content cached for offline use.');
              if (config && config.onSuccess) config.onSuccess(registration);
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('📡 Error registering SW:', error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType && contentType.indexOf('javascript') === -1)
      ) {
        // Service worker not found — unregister
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('📡 No internet connection — running in offline mode.');
    });
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}
