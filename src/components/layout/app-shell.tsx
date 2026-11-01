"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  CalendarRange,
  ChevronRight,
  FlaskConical,
  LayoutDashboard,
  LibraryBig,
  ListChecks,
  Menu,
  Settings2,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { BrandLockup, BrandMark } from "@/components/brand";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/library", label: "Library", icon: LibraryBig },
  { href: "/upload", label: "Upload", icon: UploadCloud },
  { href: "/planner", label: "Study planner", icon: CalendarRange },
  { href: "/quiz", label: "Quizzes", icon: ListChecks },
  { href: "/reliability", label: "Where it breaks", icon: FlaskConical },
];

const SECONDARY = [{ href: "/setup", label: "Setup & status", icon: Settings2 }];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors",
        active
          ? "bg-violet-50 text-violet-800"
          : "text-ink-500 hover:bg-slate-50 hover:text-ink-900",
      )}
    >
      {active && (
        <span className="absolute -left-4 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-violet-600" />
      )}
      <Icon
        className={cn(
          "h-[18px] w-[18px] transition-colors",
          active ? "text-violet-600" : "text-ink-400 group-hover:text-ink-600",
        )}
        aria-hidden="true"
      />
      <span className="flex-1">{label}</span>
      {active && <ChevronRight className="h-3.5 w-3.5 text-violet-400" aria-hidden="true" />}
    </Link>
  );
}

function SidebarContent({
  pathname,
  mode,
  model,
  onNavigate,
}: {
  pathname: string;
  mode: "live" | "demo";
  model: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-6 pb-7 pt-6">
        <BrandLockup href="/dashboard" />
      </div>

      <div className="px-4">
        <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.17em] text-ink-300">
          Workspace
        </div>
        <nav className="space-y-1" aria-label="Main navigation">
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              active={
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`)) ||
                (item.href === "/library" && pathname.startsWith("/documents/"))
              }
              onClick={onNavigate}
            />
          ))}
        </nav>
      </div>

      <div className="mt-6 px-4">
        <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.17em] text-ink-300">
          System
        </div>
        <nav className="space-y-1" aria-label="System navigation">
          {SECONDARY.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              active={pathname.startsWith(item.href)}
              onClick={onNavigate}
            />
          ))}
        </nav>
      </div>

      <div className="mt-auto p-4">
        <div
          className={cn(
            "rounded-2xl border p-4",
            mode === "demo"
              ? "border-amber-200/80 bg-amber-50/70"
              : "border-emerald-200/70 bg-emerald-50/60",
          )}
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                mode === "live" ? "animate-pulse-soft bg-emerald-500" : "bg-amber-500",
              )}
            />
            <span className="text-[12px] font-bold text-ink-800">
              {mode === "live" ? "Live AI connected" : "Curated demo mode"}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] leading-5 text-ink-500">
            {mode === "live" ? (
              <>Model: <span className="font-medium text-ink-700">{model}</span></>
            ) : (
              "Samples are labelled. Add a Gemini key for live uploads."
            )}
          </p>
          <Link
            href="/setup"
            onClick={onNavigate}
            className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-violet-700 hover:text-violet-900"
          >
            {mode === "live" ? "View AI diagnostics" : "Set up live AI"}
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <p className="mt-4 px-1 text-[10px] leading-4 text-ink-300">
          Multimodal study workspace · Gemini
        </p>
      </div>
    </div>
  );
}

export function AppShell({
  mode,
  model,
  children,
}: {
  mode: "live" | "demo";
  model: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[268px] border-r border-slate-200/80 bg-white lg:block">
        <SidebarContent pathname={pathname} mode={mode} model={model} />
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl lg:hidden">
        <BrandLockup href="/dashboard" compact />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-ink-700"
          aria-label="Open navigation"
          aria-expanded={open}
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            className="absolute inset-0 bg-ink-950/45 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          />
          <div className="absolute inset-y-0 left-0 w-[min(88vw,320px)] animate-fade-in border-r border-slate-200 bg-white shadow-lift">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 hover:bg-slate-100 hover:text-ink-800"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent
              pathname={pathname}
              mode={mode}
              model={model}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="lg:pl-[268px]">
        {mode === "demo" && (
          <div className="border-b border-amber-200/70 bg-[linear-gradient(90deg,#FFF7E6_0%,#FBF3FF_55%,#F3F0FF_100%)] px-5 py-2.5 sm:px-8 lg:px-10">
            <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-amber-900">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden="true" />
              <strong className="font-bold">Demo Mode.</strong>
              <span className="text-amber-800/90">
                Sample outputs are curated and labelled — never presented as live AI.
              </span>
              <Link
                href="/setup"
                className="ml-auto shrink-0 font-bold text-violet-700 underline-offset-2 hover:underline"
              >
                Add a Gemini key →
              </Link>
            </div>
          </div>
        )}
        <main className="mx-auto w-full max-w-[1360px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
