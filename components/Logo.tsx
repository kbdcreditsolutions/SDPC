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
      {/* Outer arc */}
      <path
        d="M 15 80 A 45 45 0 1 1 85 80"
        stroke="url(#arcGrad)"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Leaf shape at bottom */}
      <path
        d="M 30 82 Q 50 95 70 82"
        stroke="url(#arcGrad)"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      {/* Human figure */}
      <circle cx="62" cy="28" r="6" fill="url(#figGrad)" />
      <path
        d="M 62 34 L 55 55 L 48 70"
        stroke="url(#figGrad)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M 62 34 L 70 55 L 72 70"
        stroke="url(#figGrad)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M 55 44 L 70 44"
        stroke="url(#figGrad)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Spine dots */}
      <circle cx="42" cy="52" r="2.5" fill="#e53e3e" />
      <circle cx="40" cy="60" r="2.5" fill="#e53e3e" />
      <circle cx="38" cy="68" r="2.5" fill="#e53e3e" />
      <defs>
        <linearGradient id="arcGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="figGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
    </svg>
  );
}
