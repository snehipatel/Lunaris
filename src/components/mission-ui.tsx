import { Link, useRouterState } from "@tanstack/react-router";
import { Satellite } from "lucide-react";

const STEPS = [
  { n: "01", to: "/", label: "Screening Map" },
  { n: "02", to: "/crater", label: "Crater Detail" },
  { n: "03", to: "/volume", label: "Ice Volume" },
  { n: "04", to: "/landing", label: "Landing Site" },
  { n: "05", to: "/traverse", label: "Rover Traverse" },
  { n: "06", to: "/methodology", label: "Provenance" },
  { n: "07", to: "/stats", label: "Summary" },
] as const;

export function StepNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="flex items-center gap-4 px-4 py-2">
        <div className="flex items-center gap-2">
          <Satellite className="size-4 text-primary" aria-hidden />
          <span className="font-display text-[13px] tracking-[0.16em] text-foreground">
            CH-2 · SOUTH POLE ICE SCREENING
          </span>
        </div>
        <nav className="ml-auto flex flex-wrap items-center gap-1">
          {STEPS.map((s) => {
            const active = s.to === "/" ? pathname === "/" : pathname.startsWith(s.to);
            return (
              <Link
                key={s.n}
                to={s.to}
                className={
                  "flex items-center gap-1.5 rounded-sm border px-2 py-1 font-display text-[11px] tracking-[0.1em] transition-colors " +
                  (active
                    ? "border-primary/70 bg-primary/15 text-primary"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground")
                }
              >
                <span className="readout text-[10px] opacity-70">{s.n}</span>
                <span className="hidden sm:inline">{s.label.toUpperCase()}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export function StepTitle({ n, title, right }: { n: string; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-2.5">
      <span className="readout rounded-sm border border-primary/50 bg-primary/10 px-2 py-0.5 text-xs text-primary">
        {n}
      </span>
      <h1 className="font-display text-lg tracking-[0.14em] text-foreground">{title}</h1>
      <div className="ml-auto flex items-center gap-4">{right}</div>
    </div>
  );
}

export function Panel({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={"panel flex min-h-0 flex-col " + (className ?? "")}>
      {title && (
        <h2 className="label-xs border-b border-border px-3 py-1.5 text-[10px]">{title}</h2>
      )}
      <div className="min-h-0 flex-1 p-3">{children}</div>
    </section>
  );
}

export function Field({ k, v, accent }: { k: string; v: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/50 py-1 last:border-0">
      <span className="label-xs text-[10px]">{k}</span>
      <span className={"readout text-[13px] " + (accent ? "text-primary" : "text-foreground")}>
        {v}
      </span>
    </div>
  );
}
