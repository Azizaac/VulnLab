# VulnLab Authentication — UI/UX implementation spec

**Objective:** Make sign in and sign up feel premium and calm rather than generic authentication forms. Visual direction from LegaxyyFPS screenshot: near-black editorial canvas, restrained blue highlights, faint technical grid. No extravagant neon or glowing borders.

## Design tokens

| Token | Dark | Light |
|---|---|---|
| page | `#0B111B` | `#F7F9FC` |
| surface | `#111D2D` | `#FFFFFF` |
| elevated | `#17273B` | `#EDF3FA` |
| border | `#28364A` | `#DDE5F1` |
| text | `#F5F8FF` | `#122033` |
| muted | `#98A8BF` | `#60728A` |
| brand accent | `#74AAFF` | `#74AAFF` |
| actionable accent | `#74AAFF` | `#2867B8` |
| danger | `#FF7E8E` | `#B52640` |
| success | `#7FD9B1` | `#17764F` |

**Fonts:** prefer existing app font; otherwise Plus Jakarta Sans / Inter / system-ui. Scale: H1 48/36 desktop, 32 mobile; label 13/14; body 15–16; caption 12–13. Radii: inputs 10, cards 16, pills 999; shadows subtle, no neon. 8px spacing grid; max auth canvas 1200.

## Layout desktop (≥1024px)

- `100vh` layout, simple brand at top left. Optional small `Kembali ke Beranda` link.
- Left **editorial panel** 50–54%: tiny eyebrow `VULNLAB / LEARNING LAB`, headline “Belajar keamanan web, satu eksperimen setiap hari.”, short honest subcopy, 3-step `Pelajari / Praktik / Buktikan`, restrained original abstract blueprint/grid with line and circle geometry. Avoid testimonial figures, fake live achievements and misleading metrics.
- Right **form panel** 46–50%, max form width 424. Segmented `Masuk` / `Daftar` controls with stable URL routes (real `/login` and `/register`), descriptive header, login or register form. Use responsive inputs with leading icons only if they do not occlude labels.
- Subtle top border, not huge floating white cards. Form stays clear when browser password manager fills.

## Layout mobile (≤767px)

- Brand row and theme button on top. Form appears first, no horizontal overflow, hero condensed to a two-line intro, explanatory journey chip below the form or hidden. Safe area, 16px input fonts (avoid iOS zoom), targets ≥44px.

## Copy & interactions

**Login:** title “Lanjutkan perjalanan belajarmu.”; help “Masuk untuk melanjutkan modul, lab, dan progres terakhir.”; email, password, eye button, `Ingat perangkat ini`, `Lupa password?`, `Masuk ke VulnLab`, swap CTA `Belum punya akun? Daftar`.

**Register:** title “Mulai belajar dengan cara yang benar.”; help “Bangun pemahaman, uji sendiri di lab, lalu catat progresmu.”; nama tampilan, username if schema supports, email, password, konfirmasi, privacy/terms policy link (only published); CTA `Buat akun`; post-register verification message only when account/backend configured.

**Errors:** password/email invalid below control; invalid credentials use generic “Email atau kata sandi tidak cocok.”; account enumeration avoided in recovery. Loading `Memproses...`, server success → redirect, no fake toast. Existing global notification system reused, not replaced.

**Password strength:** optional visual meter / rules in clear, nonjudgmental language; never send passwords to analytics, no forced composition rules beyond actual backend policy. Don't block paste. Show/hide password with accessible name and `aria-pressed`.

**Security checks:** Laravel CSRF, session ID regeneration, `throttle` on login/register/reset, no new separate token store, intended redirect sanitized to local app, server validation source of truth, protected published policies.

## Minimum screen states

Idle, focused, empty, invalid field, server 422, invalid credentials, throttled 429, network unavailable, submitting, success redirect, email verification required, expired reset token, password manager autofill, theme change, narrow viewport.

## Acceptance

1. Matches preview design direction, responsive light/dark.
2. All real auth functions remain working against existing Laravel backend.
3. UI strings Indonesian, error messages explicit, focus on first invalid input.
4. Theme persists without flash of wrong theme if existing system permits.
5. Playwright checks interactions, keyboard, screen-reader semantics and 200% zoom.
6. Never claim register/login success until server responds.

`auth-preview.html` is a **clickable visual prototype only**, no simulated login success, no backend or credential storage. Codex must translate UI into actual components and connect existing auth endpoints.
