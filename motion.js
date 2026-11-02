/* Progressive enhancement: content stays readable without JavaScript or motion. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const ease = 'cubic-bezier(0.23, 1, 0.32, 1)';
  const active = new Set();
  const animate = (element, frames, options) => {
    if (reduce.matches || !element.animate) return;
    const animation = element.animate(frames, { easing: ease, ...options });
    active.add(animation);
    animation.finished.then(() => active.delete(animation), () => active.delete(animation));
  };
  const cancelMotion = () => { active.forEach(animation => animation.cancel()); active.clear(); };
  reduce.addEventListener('change', cancelMotion);

  // A single opening sequence; never delay a click or hide the page in CSS.
  if (!location.hash && scrollY < 40) {
    animate(document.querySelector('#top h1'), [
      { clipPath: 'inset(0 0 100% 0)', transform: 'translateY(8px)' },
      { clipPath: 'inset(0 0 0 0)', transform: 'translateY(0)' }
    ], { duration: 600 });
    document.querySelectorAll('#top > p, #top > div').forEach((element, index) => {
      animate(element, [
        { opacity: .65, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 300, delay: index * 60 });
    });
  }

  // Reveal each project once, only when it enters view. Keyboard focus cancels
  // motion immediately so links are always visible and usable.
  if ('IntersectionObserver' in window) {
    const projects = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        projects.unobserve(entry.target);
        if (entry.target.contains(document.activeElement)) return;
        animate(entry.target, [
          { opacity: .65, transform: 'translateY(12px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 500 });
      });
    }, { rootMargin: '0px 0px -32px 0px', threshold: 0 });
    document.querySelectorAll('#work > div').forEach(project => projects.observe(project));
  }
  document.addEventListener('keydown', event => {
    if (event.key === 'Tab' || event.key === 'Enter' || event.key.startsWith('Arrow')) {
      document.documentElement.classList.add('keyboard-navigation');
      cancelMotion();
    }
  });
  document.addEventListener('pointerdown', () => document.documentElement.classList.remove('keyboard-navigation'), { passive: true });
  document.addEventListener('focusin', cancelMotion);

  const progress = document.querySelector('.reading-progress');
  const links = [...document.querySelectorAll('nav a[href^="#"]')];
  let scheduled = false;
  const update = () => {
    scheduled = false;
    const distance = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${distance > 0 ? Math.min(1, Math.max(0, scrollY / distance)) : 0})`;
    let current = '#top';
    for (const id of ['work', 'skills']) {
      if (document.getElementById(id).getBoundingClientRect().top <= innerHeight * .35) current = `#${id}`;
    }
    links.forEach(link => {
      if (link.hash === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  const requestUpdate = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } };
  addEventListener('scroll', requestUpdate, { passive: true });
  addEventListener('resize', requestUpdate);
  addEventListener('load', requestUpdate);
  document.fonts?.ready.then(requestUpdate);
  update();

  const shell = document.querySelector('.roll-shell');
  const toggle = document.querySelector('.motion-toggle');
  toggle.addEventListener('click', () => {
    const paused = toggle.getAttribute('aria-pressed') !== 'true';
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', `${paused ? 'Resume' : 'Pause'} moving tool names`);
    shell.classList.toggle('is-paused-by-user', paused);
  });
  const visibility = () => shell.classList.toggle('is-paused', document.hidden);
  document.addEventListener('visibilitychange', visibility);
  visibility();
})();
