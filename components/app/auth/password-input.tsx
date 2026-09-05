"use client";

import { useState, forwardRef } from "react";
import { EyeIcon, EyeOffIcon, LockIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  showIcon?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showIcon = true, disabled, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div
        className={cn(
          "relative flex w-full items-center rounded-xl border border-border bg-surface text-foreground shadow-xs/5 transition-all duration-150 ease-[var(--ease-hikma)]",
          "focus-within:border-hikma-teal-700 focus-within:ring-2 focus-within:ring-hikma-teal-700/20",
          disabled && "opacity-60 cursor-not-allowed",
          className,
        )}
      >
        {showIcon && (
          <div className="pointer-events-none flex items-center pl-3.5 text-muted-foreground/70">
            <LockIcon className="size-4 shrink-0" aria-hidden="true" />
          </div>
        )}

        <input
          ref={ref}
          type={visible ? "text" : "password"}
          disabled={disabled}
          className={cn(
            "h-12 w-full min-w-0 bg-transparent px-3.5 text-body-md text-foreground placeholder:text-muted-foreground/60 focus:outline-none sm:h-11",
            showIcon ? "pl-2.5" : "pl-3.5",
            "pr-11",
          )}
          {...props}
        />

        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-lg text-muted-foreground/70 transition-colors hover:bg-surface-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:pointer-events-none"
        >
          {visible ? (
            <EyeOffIcon className="size-4 shrink-0" aria-hidden="true" />
          ) : (
            <EyeIcon className="size-4 shrink-0" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";
