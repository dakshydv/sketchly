import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "icon";
  size?: "sm" | "md" | "lg" | "icon";
  isActive?: boolean;
}

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  isActive = false,
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

  const variants = {
    primary: "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90",
    secondary: "bg-[var(--color-surface)] text-[var(--color-foreground)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)]",
    ghost: "hover:bg-[var(--color-surface-hover)] text-[var(--color-foreground)]",
    icon: "text-[var(--color-foreground)] hover:bg-[var(--color-surface-hover)]",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 py-2 text-sm",
    lg: "h-12 px-6 text-base",
    icon: "h-10 w-10 p-2",
  };

  const activeStyles = isActive
    ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
    : "";

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${activeStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
