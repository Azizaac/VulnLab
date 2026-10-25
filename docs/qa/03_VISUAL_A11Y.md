# Sprint 6 — visual and accessibility checkpoint

Compared the supplied V4 poster, V5 Admin Overview and Profile references with actual rendered pages. The existing horizontal learner navigation, observatory hero, mountain roadmap, three-panel reader, split lab workspace, note editor, progress charts/table and V5 editorial/account cards are retained. This is a usability/reference review, not pixel-identity certification.

## Executed matrix

- Complete existing workflows: desktop **1440×900**, mobile **390×844**, **360×800**, **320×740**, tablet **768×1024**; light and dark screenshots in [screenshots/workflows](screenshots/workflows).
- Additional V6 checks: 14 learner/admin routes in both themes at 1440 and 320, Axe WCAG 2/2.1/2.2 A/AA tagged rules, root horizontal overflow, visible main content, keyboard tab focus and reduced-motion preference. Negative inline-script injection and history/logout behavior are checked on the real browser.
- Actual Chromium **200% tab zoom** uses the documented [Chrome tabs zoom API](https://developer.chrome.com/docs/extensions/reference/api/tabs#method-setZoom), not CSS zoom or a renamed narrow viewport. The browser reports zoom 2, DPR 1→2 and CSS viewport width 1424→712. Nine routes are checked; measurements are in [zoom-results.json](zoom-results.json).
- Existing keyboard journeys exercise mountain stages and the account dialog using Tab/Enter/Escape, focus trapping/return and visible focus. This is an agent-driven keyboard walkthrough; no independent assistive-technology or human accessibility certification was performed.

## Actual fixes and visual review

The added WCAG checks found a primary action at **4.01:1** contrast in the fresh roadmap/dashboard state. Its blue now uses the existing brand `#2563eb` for sufficient white-text contrast. Studio's filter summary was only 21px high; it now has a 40px minimum target. No navigation/sidebar redesign or new visual system was introduced.

Reviewed actual dashboard light, Studio dark, 320px Security settings dark and 200% Roadmap screenshots against the supplied references: hierarchy, branding, navigation, theme colors and responsive stacking remain recognizable. The small security screen scrolls vertically to its remaining fields; the bottom navigation remains usable. Code/workspace/table regions may scroll internally as appropriate.

The fresh screenshots contain **disposable test users/content**, not learner records. Screenshots are evidence of rendering; functional assertions and database tests establish persistence. Windows refused writes to several older screenshot files during an intermediate run, so the workflow suite now accepts `QA_SCREENSHOT_ROOT` and writes Sprint 6 evidence separately. Older evidence is preserved.

Final totals, failures/retests and remaining limitations are in [RELEASE_READINESS.md](RELEASE_READINESS.md). Lighthouse scores and screen-reader testing are **NOT RUN**; no aspirational Lighthouse score is claimed as achieved. Cross-engine Firefox/WebKit and real iOS/Android devices were not tested.
