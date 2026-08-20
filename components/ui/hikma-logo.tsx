import Image from "next/image";
import { cn } from "@/lib/utils";

const logoSizes = {
  sm: { width: 64, height: 64, className: "size-16" },
  md: { width: 104, height: 104, className: "size-[104px]" },
  lg: { width: 128, height: 128, className: "size-32" },
} as const;

export function HikmaLogo({
  size = "md",
  className,
  priority = false,
}: {
  size?: keyof typeof logoSizes;
  className?: string;
  priority?: boolean;
}) {
  const dimensions = logoSizes[size];

  return (
    <Image
      src="/logo/logo_hikma.png"
      alt="Hikma — comprendre le Coran, mot par mot"
      width={dimensions.width}
      height={dimensions.height}
      priority={priority}
      className={cn("shrink-0 object-contain", dimensions.className, className)}
    />
  );
}
