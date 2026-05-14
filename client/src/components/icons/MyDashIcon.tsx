export default function MyDashIcon({ size = 18, className = '' }: { size?: number; className?: string }) {
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
      {/* Card base */}
      <rect x="2" y="5" width="20" height="14" rx="3" fill="currentColor" opacity="0.12" />
      <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      {/* Chip */}
      <rect x="5" y="9" width="5" height="4" rx="1" stroke="currentColor" strokeWidth="1.3" />
      {/* Trend arrow path */}
      <polyline
        points="12,16 14.5,12 17,14 19.5,10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Arrow head */}
      <polyline
        points="17.5,10 19.5,10 19.5,12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
