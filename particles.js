/* Text remains real, selectable HTML. Canvas is a temporary, decorative overlay. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const canvas = document.createElement('canvas');
  canvas.className = 'text-particles';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  document.body.append(canvas);
  const entries = [];
  let frame = 0, started = 0, keyboard = false, width = innerWidth;
  let targetX = 0, targetY = 0, x = 0, y = 0;
  const clamp = n => Math.max(0, Math.min(1, n));
  const wake = () => { if (!frame && !document.hidden) frame = requestAnimationFrame(draw); };
  const reset = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    entries.forEach(e => { e.points = null; e.span.style.opacity = ''; });
    width = innerWidth;
    wake();
  };
  function sample(e) {
    const style = getComputedStyle(e.span);
    const origin = e.span.getBoundingClientRect();
    const size = parseFloat(style.fontSize);
    const buffer = document.createElement('canvas');
    buffer.width = Math.ceil(origin.width + size * 2);
    buffer.height = Math.ceil(origin.height + size);
    const c = buffer.getContext('2d', { willReadFrequently: true });
    if (!c || !buffer.width || !buffer.height) return [];
    c.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    c.fillStyle = '#fff';
    const range = document.createRange(), node = e.span.firstChild;
    for (let i = 0; i < node.length; i++) {
      range.setStart(node, i); range.setEnd(node, i + 1);
      const r = range.getBoundingClientRect();
      const metrics = c.measureText(node.data[i]);
      c.fillText(node.data[i], r.left - origin.left,
        r.top - origin.top + (metrics.fontBoundingBoxAscent || size * .85));
    }
    const pixels = c.getImageData(0, 0, buffer.width, buffer.height).data;
    const points = [], step = size > 35 ? 3 : 2;
    for (let py = 0; py < buffer.height; py += step) {
      for (let px = 0; px < buffer.width; px += step) {
        if (pixels[(py * buffer.width + px) * 4 + 3] < 90) continue;
        const seed = Math.sin(px * 12.9898 + py * 78.233) * 43758.5453;
        const rand = seed - Math.floor(seed);
        points.push({ x: px, y: py, dx: (rand - .5) * (size > 35 ? 150 : 60),
          dy: Math.sin(seed) * (size > 35 ? 100 : 36), z: (rand-.35)*950, delay: rand * .16 });
      }
    }
    e.color = style.color;
    return points;
  }
  function draw(now) {
    frame = 0;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    if (document.hidden) return;
    const disabled = reduced.matches || keyboard;
    let moving = false;
    for (const e of entries) {
      const r = e.span.getBoundingClientRect();
      if (disabled) { e.span.style.opacity = ''; continue; }
      if (r.bottom < -100 || r.top > innerHeight + 100 || !r.width) continue;
      const remaining = document.documentElement.scrollHeight - innerHeight - scrollY;
      const scroll = Math.max(clamp((innerHeight * .98 - r.top) / (innerHeight * .25)),
        clamp(1 - remaining / (innerHeight * .25)));
      const progress = e.initial ? clamp((now - started - e.delay) / e.duration) : scroll;
      if (progress >= 1 || e.span.closest(':focus-visible')) {
        e.span.style.opacity = ''; continue;
      }
      if (!e.points) e.points = sample(e);
      if (!e.points.length) { e.span.style.opacity = ''; continue; }
      moving = moving || e.initial || !!e.span.closest('.roll-track');
      const blend = clamp((progress - .72) / .28);
      e.span.style.opacity = String(blend);
      ctx.fillStyle = e.color;
      for (const point of e.points) {
        const t = clamp((progress - point.delay) / (1 - point.delay));
        const spread = (1 - t) ** 3;
        const z = point.z * spread;
        const perspective = 800 / (800 - z);
        const px = r.left + point.x - innerWidth / 2 + point.dx * spread - x * z * .12;
        const py = r.top + point.y - innerHeight / 2 + point.dy * spread - y * z * .08;
        ctx.globalAlpha = (1 - blend) * (.25 + .75 * t) * Math.min(1,perspective);
        const radius = Math.max(.65, 1.4 * perspective);
        ctx.fillRect(innerWidth/2 + px*perspective, innerHeight/2 + py*perspective, radius, radius);
      }
    }
    ctx.globalAlpha = 1;
    {
      if (disabled || !fine.matches) { x = y = 0; }
      else {
        x += (targetX - x) * .075; y += (targetY - y) * .075;
        moving ||= Math.abs(targetX - x) + Math.abs(targetY - y) > .002;
      }
    }
    if (moving) wake();
  }
  async function init() {
    await document.fonts.ready;
    const walker = document.createTreeWalker(document.querySelector('#pf-root'), NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.textContent.trim() && !node.parentElement.closest('script,style,svg,button')) nodes.push(node);
    }
    nodes.forEach((node, i) => {
      const span = document.createElement('span'); span.className = 'particle-copy';
      node.replaceWith(span); span.append(node);
      const rect = span.getBoundingClientRect();
      entries.push({ span, initial: rect.top < innerHeight, delay: Math.min(i * 25, 180),
        duration: span.closest('h1,h2,h3') ? 1100 : 650, points: null });
    });
    started = performance.now(); reset();
  }
  addEventListener('scroll', wake, { passive: true });
  addEventListener('resize', reset);
  addEventListener('pointermove', event => {
    if (!fine.matches || reduced.matches) return;
    targetX = event.clientX / innerWidth * 2 - 1;
    targetY = event.clientY / innerHeight * 2 - 1; wake();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { targetX = targetY = 0; wake(); });
  document.addEventListener('keydown', event => { if (event.key === 'Tab') { keyboard = true; wake(); } });
  document.addEventListener('pointerdown', () => { keyboard = false; wake(); }, { passive: true });
  document.addEventListener('visibilitychange', wake);
  reduced.addEventListener('change', reset);
  fine.addEventListener('change', wake);
  init().catch(() => { entries.forEach(e => { e.span.style.opacity = ''; }); canvas.remove(); });
})();
