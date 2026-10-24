export default function ProgressRing({ percent }: { percent: number }) {
    const radius = 58;
    const length = 2 * Math.PI * radius;
    return (
        <div
            className="progress-ring"
            role="img"
            aria-label={`${percent}% roadmap selesai`}
        >
            <svg viewBox="0 0 144 144" aria-hidden="true">
                <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    stroke="currentColor"
                    className="ring-track"
                />
                <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    stroke="currentColor"
                    className="ring-value"
                    strokeDasharray={length}
                    strokeDashoffset={length * (1 - percent / 100)}
                    transform="rotate(-90 72 72)"
                />
            </svg>
            <div>
                <strong>
                    {percent}
                    <span>%</span>
                </strong>
                <small>selesai</small>
            </div>
        </div>
    );
}
