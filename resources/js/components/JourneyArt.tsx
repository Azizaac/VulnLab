import { useId } from "react";

// Original vector artwork. Interactive labels and waypoints are separate HTML.
export function HeroIllustration() {
    const id = useId().replace(/:/g, "");
    return (
        <svg
            className="hero-illustration"
            viewBox="0 0 1400 420"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id={`${id}sky`} x2="1" y2=".4">
                    <stop stopColor="#edf7ff" />
                    <stop offset=".45" stopColor="#d8eeff" />
                    <stop offset="1" stopColor="#0569e5" />
                </linearGradient>
                <linearGradient id={`${id}hill`} x2="0" y2="1">
                    <stop stopColor="#7eadc6" />
                    <stop offset="1" stopColor="#253e78" />
                </linearGradient>
                <linearGradient id={`${id}dome`}>
                    <stop stopColor="#95d6f2" />
                    <stop offset=".45" stopColor="#e0f4ff" />
                    <stop offset=".6" stopColor="#65b1d8" />
                    <stop offset="1" stopColor="#25568f" />
                </linearGradient>
                <linearGradient id={`${id}river`} x2="1" y2="1">
                    <stop stopColor="#8cecff" />
                    <stop offset="1" stopColor="#1473db" />
                </linearGradient>
            </defs>
            <path fill={`url(#${id}sky)`} d="M0 0h1400v420H0z" />
            <path
                d="M590 280Q725-80 1035 8"
                fill="none"
                stroke="#effaff"
                strokeWidth="3"
            />
            <path
                d="M640 294Q755 10 1080 35"
                fill="none"
                stroke="#79cfff"
                strokeDasharray="3 12"
            />
            {[
                [760, 65],
                [850, 39],
                [1060, 75],
                [1185, 38],
                [1300, 95],
            ].map(([x, y]) => (
                <path
                    key={x}
                    d={`M${x - 4} ${y}h8m-4-4v8`}
                    stroke="#d5f4ff"
                    strokeWidth="2"
                />
            ))}
            <g fill="#fff" opacity=".7">
                <path d="M600 140q-15-20 3-29 7-29 29-14 23-11 25 17 29-3 34 26Z" />
                <path d="M1130 116q-12-19 9-22 1-30 26-16 23-12 28 12 22-2 28 26Z" />
                <path d="M727 203q-12-25 13-25 10-22 25-2 21-9 25 27Z" />
            </g>
            <path
                d="m570 420 170-162 44 48 109-166 109 126 90-100 72 90 85-134 151 180v118Z"
                fill="#859bdb"
            />
            <path
                d="m784 306 109-166 28 93-28-22-23 53-11-31Z"
                fill="#e5ddff"
            />
            <path d="m1164 256 85-134 20 89-21-20-31 49-6-21Z" fill="#d4c9f9" />
            <path
                d="m900 320 83-123 43 90 65-121-11 100 45 81 124-225-44 176 66 122H900Z"
                fill="#757ec0"
            />
            <path
                d="M520 420q190-120 290-110 60-70 158-37 83 42 158 22 120 4 274 82v43Z"
                fill={`url(#${id}hill)`}
            />
            <path
                d="M862 285q-36 43 87 51t-13 42q-101 9-130 42h-99q30-50 165-65t-10-70Z"
                fill={`url(#${id}river)`}
            />
            <path
                d="M670 350q75-62 143-53l70-28 76 18-39 31-68-6-68 40Z"
                fill="#a7cb99"
            />
            <path d="m680 351 25 55 79-54 68-40-47 8-52 30Z" fill="#617d93" />
            <g transform="translate(860 165)">
                <path d="m-52 116 65-23 84 19-53 26Z" fill="#375a73" />
                <path d="M-30 40h91v75l-46 13-45-12Z" fill="#d4e6ec" />
                <path d="M15 40h46v75l-46 13Z" fill="#91b0cf" />
                <path d="M-39 39a55 55 0 0 1 110 0Z" fill={`url(#${id}dome)`} />
                <path d="M12-16Q-7 5-4 38h17q-5-34 7-54Z" fill="#254f80" />
                <path d="M-43 39h119v9H-43Z" fill="#527e9e" />
                <path d="M-38 51h108v7H-38Z" fill="#f3f7fc" />
                <path d="M3-19h28v6H3Z" fill="#e7f7ff" />
                <path d="M16-33v14" stroke="#305d82" strokeWidth="4" />
                {[-18, 8, 36].map((x) => (
                    <g key={x}>
                        <path
                            d={`M${x} 70a7 7 0 0 1 14 0v17h-14Z`}
                            fill="#2b527c"
                        />
                        <path
                            d={`M${x + 7} 65v21`}
                            stroke="#91cce8"
                            strokeWidth="2"
                        />
                    </g>
                ))}
                <path d="M5 128v-22a10 10 0 0 1 20 0v17Z" fill="#254e72" />
                <path d="m-45 122 58 14 60-16v7l-60 17-58-15Z" fill="#c4d6de" />
            </g>
            {Array.from({ length: 23 }, (_, i) => {
                const x = 1000 + ((i * 73) % 400),
                    y = 286 + ((i * 29) % 125),
                    s = 0.45 + (i % 4) * 0.2;
                return (
                    <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
                        <path d="M-3 0h6v20h-6Z" fill="#355366" />
                        <path
                            d="m0-70-24 40h12l-21 30h18l-24 25h78L15 0h18L12-30h12Z"
                            fill={i % 2 ? "#17435e" : "#21667b"}
                        />
                        <path
                            d="M0-70v95h39L15 0h18L12-30h12Z"
                            fill="#0c344f"
                        />
                    </g>
                );
            })}
            <path d="m1130 383 36-23 29 16 26-5 32 49h-154Z" fill="#384d85" />
            <g fill="#fff2a8">
                <circle cx="809" cy="310" r="3" />
                <circle cx="767" cy="337" r="2" />
                <circle cx="1047" cy="344" r="3" />
                <circle cx="1140" cy="392" r="2" />
            </g>
        </svg>
    );
}

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
                <linearGradient id={`${id}night`} x2="0" y2="1">
                    <stop stopColor="#02132d" />
                    <stop offset=".5" stopColor="#073163" />
                    <stop offset="1" stopColor="#032231" />
                </linearGradient>
                <radialGradient id={`${id}glow`}>
                    <stop stopColor="#7558ff" stopOpacity=".8" />
                    <stop offset="1" stopColor="#0e2450" stopOpacity="0" />
                </radialGradient>
                <filter id={`${id}blur`}>
                    <feGaussianBlur stdDeviation="9" />
                </filter>
                <linearGradient id={`${id}path`}>
                    <stop stopColor="#167bff" />
                    <stop offset=".38" stopColor="#2cffe4" />
                    <stop offset=".7" stopColor="#1bcaff" />
                    <stop offset="1" stopColor="#bc7bff" />
                </linearGradient>
            </defs>
            <path d="M0 0h1200v720H0Z" fill={`url(#${id}night)`} />
            <ellipse
                cx="735"
                cy="120"
                rx="260"
                ry="220"
                fill={`url(#${id}glow)`}
            />
            {Array.from({ length: 80 }, (_, i) => (
                <circle
                    key={i}
                    cx={(i * 173 + 39) % 1200}
                    cy={(i * 47 + 24) % 340}
                    r={i % 5 === 0 ? 1.7 : 0.8}
                    fill={i % 3 ? "#86c7ff" : "#b7a1ff"}
                    opacity={0.3 + (i % 4) * 0.18}
                />
            ))}
            <circle
                cx="105"
                cy="184"
                r="30"
                fill="#3ba7f5"
                opacity=".25"
                filter={`url(#${id}blur)`}
            />
            <path
                d="M113 155a29 29 0 1 0 18 49 29 29 0 0 1-18-49Z"
                fill="#94c9ff"
            />
            <path
                d="m0 380 86-112 62 74 110-151 99 130 90-188 63 134 123-157 103 165 87-100 104 170 100-104 93 102v377H0Z"
                fill="#12417c"
            />
            <path
                d="m148 342 110-151-29 128 28-30 38 79 62-47 90-188-31 185 32-26 62-25 123-157-49 191 32-29 54 67 66-64 87-100-28 142 41 63 91-35 100-104-37 124 130-22v400H0V380Z"
                fill="#092b58"
            />
            <path
                d="m184 425 125-124 84 82 101-178 90 147 150-232 96 221 116-58 133 117 121-56v376H0V465Z"
                fill="#071c3a"
            />
            <path
                d="m393 383 101-178-25 128 25-32 31 69 59-18 150-232-27 115-26-28-22 93-21-25-31 96 58-24 65-6 116-58-62 118 90-32 105 36 121-56-40 120-223 81-80-82-127 57-90-72-117 82-158-36Z"
                fill="#144274"
            />
            <path
                d="m584 352 150-232-27 115-26-28-22 93-21-25-31 96Z"
                fill="#3066a2"
            />
            <path
                d="M0 635q180-120 330-99t193-99q-38-48 147-85t70-125q110 109-50 152t-95 83Q600 540 390 574T0 720Z"
                fill="#0d5269"
                opacity=".7"
            />
            <path
                d="M90 625C110 562 215 588 245 530S414 527 425 443 530 410 555 345 683 304 695 235 729 201 740 170"
                fill="none"
                stroke={`url(#${id}path)`}
                strokeWidth="26"
                opacity=".65"
                filter={`url(#${id}blur)`}
            />
            <path
                d="M90 625C110 562 215 588 245 530S414 527 425 443 530 410 555 345 683 304 695 235 729 201 740 170"
                fill="none"
                stroke={`url(#${id}path)`}
                strokeWidth="7"
            />
            <path
                d="M90 625C110 562 215 588 245 530S414 527 425 443 530 410 555 345 683 304 695 235 729 201 740 170"
                fill="none"
                stroke="#d8ffff"
                strokeWidth="2"
            />
            {Array.from({ length: 65 }, (_, i) => {
                const x = (i * 107 + 15) % 1200,
                    y = 350 + ((i * 83) % 370),
                    s = 0.3 + (i % 5) * 0.12;
                return (
                    <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
                        <path d="M-3-10h6v33h-6Z" fill="#0c2838" />
                        <path
                            d="m0-85-25 43h12l-25 37h15l-28 32h102L23-5h15L13-42h12Z"
                            fill={i % 3 ? "#031a29" : "#0c5261"}
                        />
                        <path
                            d="M0-85v112h51L23-5h15L13-42h12Z"
                            fill="#021422"
                        />
                    </g>
                );
            })}
            <g transform="translate(470 566)">
                <ellipse cy="14" rx="65" ry="12" fill="#041d29" />
                <path d="m-36 9 28-43 44 43Z" fill="#edab55" />
                <path d="m-8-34 44 43h-55Z" fill="#a55b39" />
                <path d="m-8-19 15 28h-25Z" fill="#133448" />
                <circle
                    cx="54"
                    cy="12"
                    r="10"
                    fill="#ffa74a"
                    opacity=".45"
                    filter={`url(#${id}blur)`}
                />
                <path d="m51 13 4-14 5 14Z" fill="#ffd789" />
            </g>
            <path d="M740 170v-65" stroke="#c2b5ff" strokeWidth="3" />
            <path d="m742 105 42 9-12 12 12 13-42-8Z" fill="#a47bff" />
            <path
                d="m0 695 62-25 55 50H0m950 25 91-71 55 14 104-30v62Z"
                fill="#021321"
            />
        </svg>
    );
}
