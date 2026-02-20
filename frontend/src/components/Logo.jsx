export default function Logo({ className = "w-8 h-8", light = false }) {
    return (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w-w3.org/2000/svg" className={className}>
            <rect width="100" height="100" rx="24" fill={light ? "white" : "url(#paint0_linear)"} />
            <path
                d="M30 52H45L51 32L63 72L69 52H80"
                stroke={light ? "#2563EB" : "white"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M50 20V42M50 80V58M20 50H42M80 50H58"
                stroke={light ? "#2563EB" : "white"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.2"
            />
            <defs>
                <linearGradient id="paint0_linear" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#2563EB" />
                    <stop offset="1" stopColor="#06B6D4" />
                </linearGradient>
            </defs>
        </svg>
    );
}
