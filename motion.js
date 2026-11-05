/* Progressive enhancement. Failed scripts and reduced motion leave complete, readable content. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const progress = document.querySelector('.reading-progress');
  const links = [...document.querySelectorAll('nav a[href^="#"]')];
  const cue = document.querySelector('.scroll-cue span');
  let scheduled = false;
  const updateNavigation = () => {
    scheduled = false;
    const distance = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.transform = `scaleX(${distance > 0 ? Math.min(1, Math.max(0, scrollY / distance)) : 0})`;
    let current = '#top';
    for (const id of ['work', 'skills']) {
      if (document.getElementById(id)?.getBoundingClientRect().top <= innerHeight * .35) current = `#${id}`;
    }
    links.forEach(link => {
      if (link.hash === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  const scheduleNavigation = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(updateNavigation); } };
  addEventListener('scroll', scheduleNavigation, { passive: true });
  addEventListener('resize', scheduleNavigation);

  if (cue) cue.textContent = 'Scroll to explore';

  const shell = document.querySelector('.roll-shell');
  const toggle = document.querySelector('.motion-toggle');
  toggle?.addEventListener('click', () => {
    const paused = toggle.getAttribute('aria-pressed') !== 'true';
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', `${paused ? 'Resume' : 'Pause'} moving tool names`);
    shell?.classList.toggle('is-paused-by-user', paused);
  });
  const visibility = () => shell?.classList.toggle('is-paused', document.hidden);
  document.addEventListener('visibilitychange', visibility);
  visibility();
  reduced.addEventListener('change', scheduleNavigation);
  updateNavigation();
})();
