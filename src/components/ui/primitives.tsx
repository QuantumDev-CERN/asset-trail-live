import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "default" | "primary" | "success" | "warning" | "destructive" | "info" | "muted";

const toneClasses: Record<Tone, string> = {
  default: "border-border-strong bg-surface-raised text-foreground",
  primary: "border-primary/40 bg-primary/10 text-primary",
  success: "border-success/40 bg-success/10 text-success",
  warning: "border-warning/40 bg-warning/10 text-warning",
  destructive: "border-destructive/45 bg-destructive/12 text-destructive",
  info: "border-info/40 bg-info/10 text-info",
  muted: "border-border bg-muted text-muted-foreground",
};

export function Chip({
  children,
  tone = "default",
  className,
  mono,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  mono?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] leading-5 font-medium whitespace-nowrap",
        mono && "font-mono tracking-tight",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Panel({
  children,
  className,
  as: As = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article" | "aside";
}) {
  return <As className={cn("panel", className)}>{children}</As>;
}

export function PanelHeader({
  title,
  subtitle,
  right,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3", className)}>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold tracking-wide text-foreground">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {right ? <div className="flex shrink-0 items-center gap-2">{right}</div> : null}
    </div>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase", className)}>
      {children}
    </p>
  );
}

export function Field({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <SectionLabel>{label}</SectionLabel>
      <div className={cn("mt-1 text-sm break-words text-foreground", mono && "font-mono text-[12px]")}>{value}</div>
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  className,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "outline" | "danger";
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
}) {
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/85",
    ghost: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
    outline: "border border-border-strong text-foreground hover:bg-accent",
    danger: "border border-destructive/50 text-destructive hover:bg-destructive/12",
  } as const;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function DisclosureNote({
  title,
  children,
  tone = "warning",
}: {
  title: string;
  children: ReactNode;
  tone?: "warning" | "destructive" | "info";
}) {
  const border = {
    warning: "border-warning/40 bg-warning/8",
    destructive: "border-destructive/45 bg-destructive/10",
    info: "border-info/40 bg-info/8",
  }[tone];
  const text = { warning: "text-warning", destructive: "text-destructive", info: "text-info" }[tone];
  return (
    <div className={cn("rounded-md border px-3 py-2.5", border)}>
      <p className={cn("text-[11px] font-bold tracking-[0.1em] uppercase", text)}>{title}</p>
      <div className="mt-1 text-xs leading-relaxed text-foreground/85">{children}</div>
    </div>
  );
}
