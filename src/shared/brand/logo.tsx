import Image from "next/image";
import Link from "next/link";
import { cn } from "@/shared/lib/utils";

type LogoProps = {
  href?: string | null;
  variant?: "light" | "dark";
  logoUrl?: string | null;
  companyName?: string;
  className?: string;
  onClick?: () => void;
};

/**
 * Logotipo padrão extraído do PDF oficial da marca (public/branding/logo-extracted.png).
 * Usado como fallback quando não há `logoUrl` configurado em settings.
 */
const DEFAULT_LOGO_SRC = "/branding/logo-extracted.png";

export function Logo({
  href = "/",
  variant = "light",
  logoUrl,
  companyName = "Estar On Internet",
  className,
  onClick,
}: LogoProps) {
  const src = logoUrl || DEFAULT_LOGO_SRC;

  const content = (
    <span className="inline-flex items-center rounded-xl p-1.5 dark:bg-white dark:shadow-[0_4px_20px_-4px_rgba(255,255,255,0.25)]">
      <Image
        src={src}
        alt={`${companyName} — logotipo`}
        width={180}
        height={44}
        unoptimized
        loading="eager"
        className={cn(
          "h-7 w-auto max-w-[150px] object-contain transition-transform duration-200 hover:scale-[1.02] sm:h-8 sm:max-w-[180px]",
          variant === "dark" && "h-8 sm:h-9",
        )}
      />
    </span>
  );

  const classes = cn("inline-flex items-center", className);

  if (!href) {
    return (
      <span className={classes} aria-label={`${companyName} — Estar On Indica`}>
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={classes}
      aria-label={`${companyName} — Estar On Indica`}
      onClick={onClick}
    >
      {content}
    </Link>
  );
}
