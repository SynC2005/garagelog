import type { SVGProps } from "react";

/**
 * Emblema geometris bengkel modifikasi kustom (hex bolt + crown piston).
 * Memakai currentColor agar kontras otomatis di Light Mode & Dark Mode.
 */
export function WorkshopEmblem({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {/* Bingkai mur heksagonal */}
      <path
        d="M14 2.5L24 8.25V19.75L14 25.5L4 19.75V8.25L14 2.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Kepala & ring piston */}
      <path
        d="M9.5 11.5C9.5 9.8 11.4 8.75 14 8.75C16.6 8.75 18.5 9.8 18.5 11.5V16.75C18.5 18.1 17.6 19.25 16.4 19.65L15.8 18H12.2L11.6 19.65C10.4 19.25 9.5 18.1 9.5 16.75V11.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <line
        x1="9.5"
        y1="12.5"
        x2="18.5"
        y2="12.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* Titik pin piston */}
      <circle cx="14" cy="15.4" r="1.35" fill="currentColor" />
    </svg>
  );
}

