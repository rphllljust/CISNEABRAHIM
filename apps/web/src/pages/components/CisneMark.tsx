import { useId } from 'react';
import { cn } from '../../ui/utils/cn';

type CisneMarkProps = {
  compact?: boolean;
  className?: string;
};

export function CisneMark({ compact = false, className }: CisneMarkProps) {
  const markId = useId().replace(/:/g, '');

  return (
    <svg
      className={cn('cisne-mark', compact && 'cisne-mark--compact', className)}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${markId}-fill`} x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1a3250" />
          <stop offset="1" stopColor="#0a1626" />
        </linearGradient>
        <linearGradient id={`${markId}-stroke`} x1="10" y1="8" x2="38" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#d4c4a8" />
          <stop offset="0.5" stopColor="#b8a88a" />
          <stop offset="1" stopColor="#8f816c" />
        </linearGradient>
      </defs>
      <rect
        x="1.25"
        y="1.25"
        width="45.5"
        height="45.5"
        rx="11.5"
        fill={`url(#${markId}-fill)`}
        stroke={`url(#${markId}-stroke)`}
        strokeWidth="1"
      />
      <path
        d="M13.5 33.5C13.5 24.5 18.5 17.5 26.5 15.5C31 14.5 34.5 16 36.5 19"
        stroke="#e8edf4"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <path
        d="M36.5 19C38.2 17.2 39.2 15.1 38.8 13.2"
        stroke="#b8a88a"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="38.6" cy="12.6" r="1.35" fill="#f4f7fb" />
      <path
        d="M16 31.5C19.5 28.5 23.5 27 27.5 27.5"
        stroke="#b8a88a"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}
