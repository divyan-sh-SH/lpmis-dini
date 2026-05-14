export default function MyHomeDashIcon({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Roof */}
      <path
        d="M3 11.5L12 3.5L21 11.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Walls */}
      <path
        d="M5 9.8V19.5C5 20.05 5.45 20.5 6 20.5H18C18.55 20.5 19 20.05 19 19.5V9.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.08"
      />
      {/* Person 1 - left */}
      <circle cx="9" cy="14.5" r="1.4" fill="currentColor" />
      <path d="M6.5 20.5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      {/* Person 2 - right */}
      <circle cx="15" cy="14.5" r="1.4" fill="currentColor" />
      <path d="M12.5 20.5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
