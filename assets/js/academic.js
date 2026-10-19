// Retire caches created by the previous theme so repeat visitors see the update.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      const worker = registration.active || registration.waiting || registration.installing;
      if (worker && new URL(worker.scriptURL).pathname.endsWith('/sw.min.js')) registration.unregister();
    }
  }).catch(() => {});
}
