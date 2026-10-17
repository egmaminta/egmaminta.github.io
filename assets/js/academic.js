// Navigation is usable without JavaScript; this only marks the current section.
if (document.body.classList.contains('home-page') && 'IntersectionObserver' in window) {
  const links = [...document.querySelectorAll('.site-nav a')];
  const sections = [...document.querySelectorAll('main > section[id]')];
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting);
    if (!visible.length) return;
    const section = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0].target;
    for (const link of links) {
      const isCurrent = new URL(link.href).hash === `#${section.id}` || (section.id === 'writing' && new URL(link.href).pathname.endsWith('/blog/'));
      if (isCurrent) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }, { rootMargin: '-15% 0px -55% 0px' });
  sections.forEach((section) => observer.observe(section));
}

// Retire caches created by the previous theme so repeat visitors see the update.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      const worker = registration.active || registration.waiting || registration.installing;
      if (worker && new URL(worker.scriptURL).pathname.endsWith('/sw.min.js')) registration.unregister();
    }
  }).catch(() => {});
}
