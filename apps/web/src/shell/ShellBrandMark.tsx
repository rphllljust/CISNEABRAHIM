type ShellBrandMarkProps = {
  className?: string;
};

export function ShellBrandMark({ className }: ShellBrandMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 18c3-6 5-9 8-9s5 3 8 9" />
      <path d="M4 18h16" />
      <circle cx="12" cy="7" r="2" />
    </svg>
  );
}
