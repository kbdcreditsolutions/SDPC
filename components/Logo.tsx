export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Sridatri Physio Care logo"
    >
      <defs>
        <linearGradient id="figGrad" x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>

      {/* Outer purple arc — nearly complete circle, open at top-right ~40° gap */}
      {/* Center (50,52) r=40; gap from ~320° to 360° */}
      <path
        d="M 80.6 26.3 A 40 40 0 1 0 90 52"
        stroke="#7c3aed"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Inner yellow/gold arc — same gap, r=34 */}
      <path
        d="M 76 28.8 A 34 34 0 1 0 84 52"
        stroke="#f59e0b"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Head */}
      <circle cx="50" cy="21" r="7" fill="url(#figGrad)" />

      {/* Left arm sweeping up-left from shoulder */}
      <path
        d="M 47 28 Q 35 28 22 20"
        stroke="url(#figGrad)"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Body sweeping down — S-curve */}
      <path
        d="M 48 28 Q 44 42 40 54 Q 37 63 40 72"
        stroke="url(#figGrad)"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />

      {/* Lower body leaf/wing shape (right-sweeping) */}
      <path
        d="M 40 72 Q 54 82 64 72 Q 56 60 44 58 Z"
        fill="url(#figGrad)"
        opacity="0.9"
      />

      {/* Red spine dots — diagonal */}
      <circle cx="44" cy="46" r="2.2" fill="#dc2626" />
      <circle cx="42" cy="53" r="2.2" fill="#dc2626" />
      <circle cx="40" cy="60" r="2" fill="#dc2626" />
      <circle cx="39" cy="67" r="1.8" fill="#dc2626" />

      {/* Bottom purple leaf petal */}
      <path
        d="M 38 80 Q 50 92 62 80 Q 52 75 38 80 Z"
        fill="url(#leafGrad)"
        opacity="0.85"
      />
    </svg>
  );
}
