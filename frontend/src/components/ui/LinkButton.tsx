import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { BUTTON_BASE_CLASSES, SIZE_CLASSES, VARIANT_CLASSES, type ButtonSize, type ButtonVariant } from "./Button";
import { cn } from "@/utils/cn";

interface LinkButtonProps extends LinkProps, Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export function LinkButton({ className, variant = "secondary", size = "md", children, ...props }: LinkButtonProps) {
  return (
    <Link
      className={cn(BUTTON_BASE_CLASSES, variant !== "icon" && variant !== "link" && SIZE_CLASSES[size], VARIANT_CLASSES[variant], className)}
      {...props}
    >
      {children}
    </Link>
  );
}
