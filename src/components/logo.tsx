import { cn } from "@/lib/utils";

export const Logo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
    className={cn("text-primary", props.className)}
  >
    <title>TryFit Logo</title>
    <path d="M14 3l-12 18h4l7 -12h-4l7 -6z" />
    <path d="M22 3l-12 18h4l7 -12h-4l7 -6z" />
  </svg>
);
