# Ashton Hwoi — portfolio

A static portfolio published with GitHub Pages. No build step.

Preview locally:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open http://127.0.0.1:4173/ and scroll through the opening.

The sky opening uses an original generated cloud photograph and the existing
Instrument Serif / DM Sans typography. Its navy, cream and coral palette takes
its cue from the navy example in the supplied design Reel. Project descriptions
and destinations are preserved.

GSAP ScrollTrigger ties word assembly and the cloud movement to scroll position.
Scroll back to reverse it. Reduced motion uses a static, fully readable opening;
content also remains readable when JavaScript or the animation scripts fail.
Keyboard navigation removes spatial word movement. The existing tool strip has
its own pause control.

Files: `index.html`, `sky.css`, `motion.js`, and the locally served `assets/`.
Asset origin and generation prompt: `assets/sky-clouds.provenance.json`.
