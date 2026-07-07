export function PulseMark({ className = "", animate = false }: { className?: string; animate?: boolean }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="40" height="40" rx="10" fill="var(--forest)" />
      <path
        d="M6 21h5l2.5-7 4 14 3-10 2 3h11.5"
        stroke="var(--cream)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animate ? "pulse-draw" : ""}
      />
    </svg>
  );
}
