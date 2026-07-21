import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:-translate-y-0.5",
  secondary:
    "border border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
  danger:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  ghost:
    "text-muted-foreground hover:text-foreground hover:bg-accent",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
        size === "sm" ? "px-4 py-1.5 text-sm" : "px-6 py-2.5 text-sm",
        variants[variant],
        className,
      )}
      disabled={disabled}
      {...props}
    />
  );
}
