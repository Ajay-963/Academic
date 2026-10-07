type AcademicLogoProps = {
  showName?: boolean;
  size?: "sm" | "md" | "lg";
  href?: string;
};

const sizes = {
  sm: {
    icon: "h-8 w-8",
    text: "text-base",
  },
  md: {
    icon: "h-9 w-9",
    text: "text-lg",
  },
  lg: {
    icon: "h-12 w-12",
    text: "text-2xl",
  },
};

export default function AcademicLogo({
  showName = true,
  size = "md",
  href,
}: AcademicLogoProps) {
  const content = (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={`${sizes[size].icon} flex shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-[58%] w-[58%]"
        >
          <path
            d="M4 7.5 12 4l8 3.5L12 11 4 7.5Z"
            fill="currentColor"
          />
          <path
            d="M7 9.2V14c0 1.8 2.2 3.5 5 3.5s5-1.7 5-3.5V9.2"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M20 8v5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </span>

      {showName && (
        <span
          className={`${sizes[size].text} font-semibold tracking-tight text-slate-950 dark:text-white`}
        >
          Academic
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <a
        href={href}
        aria-label="Academic home"
        className="inline-flex rounded-lg outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:focus-visible:ring-slate-500 dark:focus-visible:ring-offset-slate-950"
      >
        {content}
      </a>
    );
  }

  return content;
}