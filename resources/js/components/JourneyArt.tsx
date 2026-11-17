import { useId } from "react";

// Layered atmospheric artwork + crisp interactive vector overlays.
// Pure text-free painted backdrops live in /images/v9/*.jpg; live milestones & controls remain semantic HTML.
export function HeroIllustration() {
    const id = useId().replace(/:/g, "");
    return (
        <svg
            className="hero-illustration"
            viewBox="0 0 1400 420"
            preserveAspectRatio="xMaxYMid slice"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id={`${id}base`} x1="0" y1="0" x2="1" y2="0.4">
                    <stop offset="0%" stopColor="#051120" />
                    <stop offset="45%" stopColor="#0a1e38" />
                    <stop offset="100%" stopColor="#0f2f57" />
                </linearGradient>
                <linearGradient id={`${id}fade`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#061426" stopOpacity="0.92" />
                    <stop offset="40%" stopColor="#07182d" stopOpacity="0.56" />
                    <stop offset="72%" stopColor="#07182d" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#07182d" stopOpacity="0" />
                </linearGradient>
                <radialGradient
                    id={`${id}domeGlow`}
                    cx="0.81"
                    cy="0.39"
                    r="0.22"
                >
                    <stop offset="0%" stopColor="#ffcf87" stopOpacity="0.26" />
                    <stop offset="55%" stopColor="#5cc8ff" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#07182d" stopOpacity="0" />
                </radialGradient>
            </defs>
            <rect width="1400" height="420" fill={`url(#${id}base)`} />
            <image
                href="/images/v9/hero-observatory.jpg"
                x="0"
                y="0"
                width="1400"
                height="420"
                preserveAspectRatio="xMaxYMid slice"
            />
            <rect width="1400" height="420" fill={`url(#${id}domeGlow)`} />
            <rect width="1400" height="420" fill={`url(#${id}fade)`} />
            {/* Subtle starlight & orbital telemetry accents */}
            <path
                d="M 560 300 Q 740 -30 1120 26"
                fill="none"
                stroke="#9fd8ff"
                strokeOpacity="0.22"
                strokeWidth="1.5"
                strokeDasharray="4 10"
            />
            {[
                [640, 68, 1.6],
                [790, 44, 2.1],
                [955, 58, 1.5],
                [1145, 36, 1.9],
                [1285, 76, 1.4],
            ].map(([cx, cy, r]) => (
                <circle
                    key={`${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="#e2f3ff"
                    opacity="0.72"
                />
            ))}
        </svg>
    );
}

const ROADMAP_TRAIL =
    "M 102 598 C 154 570, 198 538, 246 497 C 298 452, 348 424, 396 382 C 436 344, 468 306, 498 266 C 534 222, 560 190, 582 158 C 587 132, 585 108, 583 88";

export function PathIllustration() {
    const id = useId().replace(/:/g, "");
    return (
        <svg
            className="path-illustration"
            viewBox="0 0 1200 720"
            preserveAspectRatio="none"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id={`${id}night`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#041022" />
                    <stop offset="55%" stopColor="#08203e" />
                    <stop offset="100%" stopColor="#041325" />
                </linearGradient>
                <linearGradient
                    id={`${id}vignette`}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                >
                    <stop offset="0%" stopColor="#041020" stopOpacity="0.35" />
                    <stop offset="58%" stopColor="#041020" stopOpacity="0.04" />
                    <stop
                        offset="100%"
                        stopColor="#041020"
                        stopOpacity="0.72"
                    />
                </linearGradient>
                <linearGradient
                    id={`${id}bottomFade`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                >
                    <stop offset="0%" stopColor="#041020" stopOpacity="0.45" />
                    <stop offset="22%" stopColor="#041020" stopOpacity="0" />
                    <stop offset="78%" stopColor="#041020" stopOpacity="0" />
                    <stop
                        offset="100%"
                        stopColor="#041020"
                        stopOpacity="0.82"
                    />
                </linearGradient>
                <radialGradient
                    id={`${id}summitAura`}
                    cx="0.486"
                    cy="0.13"
                    r="0.24"
                >
                    <stop offset="0%" stopColor="#a87bff" stopOpacity="0.48" />
                    <stop offset="52%" stopColor="#38bdf8" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="#041020" stopOpacity="0" />
                </radialGradient>
                <linearGradient id={`${id}trail`} x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0%" stopColor="#2c84ff" />
                    <stop offset="35%" stopColor="#26f2d0" />
                    <stop offset="70%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
                <filter
                    id={`${id}glow`}
                    x="-25%"
                    y="-25%"
                    width="150%"
                    height="150%"
                >
                    <feGaussianBlur stdDeviation="10" />
                </filter>
                <filter
                    id={`${id}softGlow`}
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                >
                    <feGaussianBlur stdDeviation="4" />
                </filter>
            </defs>

            <rect width="1200" height="720" fill={`url(#${id}night)`} />
            <image
                href="/images/v9/roadmap-panorama.jpg"
                x="0"
                y="0"
                width="1200"
                height="720"
                preserveAspectRatio="xMidYMid slice"
            />
            <rect width="1200" height="720" fill={`url(#${id}summitAura)`} />
            <rect width="1200" height="720" fill={`url(#${id}vignette)`} />
            <rect width="1200" height="720" fill={`url(#${id}bottomFade)`} />

            {/* Outer atmospheric bloom of the ascending trail */}
            <path
                d={ROADMAP_TRAIL}
                fill="none"
                stroke={`url(#${id}trail)`}
                strokeWidth="24"
                strokeLinecap="round"
                opacity="0.55"
                filter={`url(#${id}glow)`}
            />
            {/* Mid luminous ribbon */}
            <path
                d={ROADMAP_TRAIL}
                fill="none"
                stroke={`url(#${id}trail)`}
                strokeWidth="7.5"
                strokeLinecap="round"
                filter={`url(#${id}softGlow)`}
            />
            {/* Crisp bright core filament */}
            <path
                d={ROADMAP_TRAIL}
                fill="none"
                stroke="#e6fbff"
                strokeWidth="2.4"
                strokeLinecap="round"
            />

            {/* Subtle waypoint halos on the path */}
            {[
                [102, 598, "#3b82f6"],
                [246, 497, "#10b981"],
                [396, 382, "#06b6d4"],
                [498, 266, "#60a5fa"],
                [582, 158, "#a855f7"],
            ].map(([cx, cy, color]) => (
                <circle
                    key={`${cx}-${cy}`}
                    cx={Number(cx)}
                    cy={Number(cy)}
                    r="20"
                    fill={String(color)}
                    opacity="0.28"
                    filter={`url(#${id}softGlow)`}
                />
            ))}

            {/* Glowing summit beacon & expedition flag right on the mountain peak */}
            <g transform="translate(583 88)">
                <circle
                    cx="0"
                    cy="-18"
                    r="22"
                    fill="#c084fc"
                    opacity="0.38"
                    filter={`url(#${id}softGlow)`}
                />
                <path
                    d="M 0 4 V -44"
                    stroke="#ede9fe"
                    strokeWidth="3"
                    strokeLinecap="round"
                />
                <path
                    d="M 1.5 -43 L 38 -35 L 28 -25 L 38 -15 L 1.5 -22 Z"
                    fill="#a855f7"
                    stroke="#f3e8ff"
                    strokeWidth="1.2"
                />
                <circle cx="0" cy="-45" r="3.2" fill="#ffffff" />
            </g>
        </svg>
    );
}

export function ProfileBannerArt() {
    const id = useId().replace(/:/g, "");
    return (
        <svg
            className="profile-banner-art"
            viewBox="0 0 1200 220"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id={`${id}fade`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#061325" stopOpacity="0.12" />
                    <stop
                        offset="100%"
                        stopColor="#09192e"
                        stopOpacity="0.78"
                    />
                </linearGradient>
            </defs>
            <rect width="1200" height="220" fill="#071526" />
            <image
                href="/images/v9/profile-banner.jpg"
                x="0"
                y="0"
                width="1200"
                height="220"
                preserveAspectRatio="xMidYMid slice"
            />
            <rect width="1200" height="220" fill={`url(#${id}fade)`} />
        </svg>
    );
}
