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

  const splitWords = element => {
    if (element.dataset.wordsReady) return [...element.querySelectorAll('.assemble-word, .work-assemble-word')];
    const text = element.textContent.trim();
    element.setAttribute('aria-label', text);
    const fragment = document.createDocumentFragment();
    text.split(/\s+/).forEach((word, i) => {
      if (i) fragment.append(' ');
      const span = document.createElement('span');
      span.textContent = word;
      span.className = element.matches('[data-assemble]') ? 'assemble-word' : 'work-assemble-word';
      span.setAttribute('aria-hidden', 'true');
      fragment.append(span);
    });
    element.replaceChildren(fragment);
    element.dataset.wordsReady = 'true';
    return [...element.children];
  };

  const hero = document.querySelector('[data-assemble]');
  const selected = document.querySelector('[data-work-assemble]');
  if (window.gsap && window.ScrollTrigger && hero) {
    gsap.registerPlugin(ScrollTrigger);
    const words = splitWords(hero);
    const workWords = selected ? splitWords(selected) : [];
    const media = gsap.matchMedia();
    media.add({ desktop: '(min-width: 701px)', mobile: '(max-width: 700px)', reduce: '(prefers-reduced-motion: reduce)' }, context => {
      if (cue) cue.textContent = context.conditions.reduce ? 'Explore selected work' : 'Scroll to bring it together';
      if (context.conditions.reduce) return;
      const mobile = context.conditions.mobile;
      const compact = innerWidth <= 370;
      const x = compact ? [0, 0, 0, 0, 0, 0] : mobile ? [-2, 2, -2, 2, -2, 2] : [-6, 5, -4, 5, -4, 6];
      const y = compact ? [0, 0, 0, 0, 0, 0] : mobile ? [14, 3, 15, 5, 21, 15] : [22, 4, 24, 8, 32, 22];
      const rotate = compact ? [0, 0, 0, 0, 0, 0] : [-3, 2, -2, 2, -3, 2];
      const assembly = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          id: 'sky-assembly', trigger: '.sky-intro', start: 'top top',
          end: () => `+=${Math.round(innerHeight * (mobile ? .72 : .95))}`,
          pin: '.sky-scene', scrub: .55, anticipatePin: 1, invalidateOnRefresh: true
        }
      });
      assembly.fromTo(words,
        { x: i => x[i % x.length], y: i => y[i % y.length], rotation: i => rotate[i % rotate.length], opacity: .78 },
        { x: 0, y: 0, rotation: 0, opacity: 1, duration: .72, stagger: { amount: .12 }, immediateRender: true }, 0);
      assembly.fromTo('.sky-image', { scale: 1.08, yPercent: 0 }, { scale: 1.01, yPercent: -4, duration: 1 }, 0);
      if (workWords.length) gsap.fromTo(workWords,
        { y: i => i ? 30 : -18, x: i => i ? 14 : -14, rotation: i => i ? 3 : -3, opacity: .65 },
        { x: 0, y: 0, rotation: 0, opacity: 1, ease: 'none', scrollTrigger: {
          id: 'work-assembly', trigger: selected, start: 'top 88%', end: 'top 56%', scrub: .4
        } });
      return () => { if (cue) cue.textContent = 'Explore selected work'; };
    });
    // Real layout changes, including font loading, recalculate pinned scroll distances.
    const initialHash = location.hash;
    const loaded = document.readyState === 'complete' ? Promise.resolve() : new Promise(resolve => addEventListener('load', resolve, { once: true }));
    Promise.all([document.fonts?.ready, loaded]).then(() => {
      ScrollTrigger.refresh();
      // Pin spacing changes document offsets. Resolve incoming anchors only after
      // images and fonts have settled, without animating or changing the hash.
      if (!initialHash || location.hash !== initialHash) return;
      let id;
      try { id = decodeURIComponent(initialHash.slice(1)); } catch { return; }
      const target = document.getElementById(id);
      if (target) requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: 'instant', block: 'start' });
        ScrollTrigger.update();
      });
    });
    // Keyboard readers never have to follow moving words to reach a link.
    document.addEventListener('keydown', event => {
      if (event.key === 'Tab' || event.key === 'Enter' || event.key.startsWith('Arrow')) document.documentElement.classList.add('keyboard-navigation');
    });
    document.addEventListener('pointerdown', () => document.documentElement.classList.remove('keyboard-navigation'), { passive: true });
  } else if (cue) cue.textContent = 'Explore selected work';

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
