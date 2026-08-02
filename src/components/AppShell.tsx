import { Link, useRouterState } from "@tanstack/react-router";
import { Workflow, Bot, History, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Workflows", icon: Workflow },
  { to: "/agents", label: "Agents", icon: Bot },
  { to: "/runs", label: "Lịch sử chạy", icon: History },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-sidebar/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-6 px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight">AgentFlow</span>
          </Link>
          <nav className="flex items-center gap-1">
            {nav.map((n) => {
              const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <n.icon className="size-3.5" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}