"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  CalendarRange,
  ChevronRight,
  FlaskConical,
  GraduationCap,
  LayoutDashboard,
  LibraryBig,
  ListChecks,
  Menu,
  Search,
  Settings2,
  UploadCloud,
  X,
} from "lucide-react";
import { BrandLockup } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/library", label: "Library", icon: LibraryBig },
  { href: "/upload", label: "Upload", icon: UploadCloud },
  { href: "/planner", label: "Study planner", icon: CalendarRange },
  { href: "/quiz", label: "Quizzes", icon: ListChecks },
  { href: "/learn", label: "Learn a topic", icon: GraduationCap },
  { href: "/reliability", label: "Where it breaks", icon: FlaskConical },
];

const SECONDARY = [{ href: "/setup", label: "Setup & status", icon: Settings2 }];

const PAGE_META: Record<string, { section: string; title: string }> = {
  "/dashboard": { section: "Workspace", title: "Dashboard" },
  "/search": { section: "Workspace", title: "Search" },
  "/library": { section: "Workspace", title: "Library" },
  "/upload": { section: "Workspace", title: "Upload material" },
  "/planner": { section: "Workspace", title: "Study planner" },
  "/quiz": { section: "Workspace", title: "Quizzes" },
  "/learn": { section: "Workspace", title: "Learn a topic" },
  "/reliability": { section: "Workspace", title: "Reliability lab" },
  "/setup": { section: "System", title: "Setup & status" },
};

function pageMeta(pathname: string) {
  if (pathname.startsWith("/documents/")) return { section: "Library", title: "Document" };
  if (pathname.startsWith("/quiz/")) return { section: "Quizzes", title: "Quiz" };
  const key = `/${pathname.split("/")[1] ?? ""}`;
  return PAGE_META[key] ?? PAGE_META["/dashboard"];
}

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
        "group flex min-h-11 items-center gap-3 rounded-xl px-3 text-[14px] transition-colors",
        active
          ? "bg-parchment font-semibold text-ink-900"
          : "font-normal text-ink-600 hover:bg-[#fafafc] hover:text-ink-900",
      )}
    >
      <Icon
        className={cn(
          "h-[18px] w-[18px] transition-colors",
          active ? "text-action" : "text-ink-400 group-hover:text-ink-600",
        )}
        aria-hidden="true"
      />
      <span className="flex-1">{label}</span>
      {active && <span className="h-1.5 w-1.5 rounded-full bg-action" aria-hidden="true" />}
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
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="px-6 pb-7 pt-6">
        <BrandLockup href="/dashboard" />
      </div>

      <div className="px-4">
        <Link
          href="/search"
          onClick={onNavigate}
          aria-current={pathname.startsWith("/search") ? "page" : undefined}
          className={cn(
            "mb-6 flex min-h-11 items-center gap-2.5 rounded-full border px-4 text-[13px] transition-colors",
            pathname.startsWith("/search")
              ? "border-action bg-[#f0f7ff] text-action"
              : "border-hairline bg-parchment text-ink-500 hover:border-[#d2d2d7] hover:bg-white hover:text-ink-800",
          )}
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          <span className="flex-1">Search notes &amp; web</span>
          <kbd className="rounded-full border border-[#e0e0e0] bg-white px-1.5 py-0.5 font-mono text-[9px] text-ink-400">
            /
          </kbd>
        </Link>
      </div>

      <div className="px-4">
        <div className="mb-2 px-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-400">
          Workspace
        </div>
        <nav className="space-y-0.5" aria-label="Main navigation">
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
        <div className="mb-2 px-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-400">
          System
        </div>
        <nav className="space-y-0.5" aria-label="System navigation">
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
        <div className="rounded-2xl border border-hairline bg-white p-4">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                mode === "live" ? "animate-pulse-soft bg-emerald-500" : "bg-amber-500",
              )}
            />
            <span className="text-[13px] font-semibold text-ink-900">
              {mode === "live" ? "Live AI connected" : "Curated demo"}
            </span>
          </div>
          <p className="mt-1.5 text-[11.5px] leading-5 text-ink-500">
            {mode === "live" ? (
              <>Model: <span className="font-medium text-ink-700">{model}</span></>
            ) : (
              "Samples are labelled. Add a Gemini key for live uploads."
            )}
          </p>
          <Link
            href="/setup"
            onClick={onNavigate}
            className="mt-2.5 inline-flex items-center gap-1 text-[11.5px] font-medium text-action hover:text-[#0071e3]"
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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const meta = pageMeta(pathname);

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

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (pathname.startsWith("/search")) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      router.push("/search");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pathname, router]);

  return (
    <div className="min-h-screen bg-transparent">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] border-r border-hairline bg-white lg:block">
        <SidebarContent pathname={pathname} mode={mode} model={model} />
      </aside>

      <header className="glass sticky top-0 z-30 flex h-14 items-center justify-between border-b border-hairline px-4 lg:hidden">
        <BrandLockup href="/dashboard" compact />
        <div className="flex items-center gap-1.5">
          <Link
            href="/search"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-black/5"
            aria-label="Search notes and web"
          >
            <Search className="h-[19px] w-[19px]" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-black/5"
            aria-label="Open navigation"
            aria-expanded={open}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            className="absolute inset-0 bg-ink-950/35 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          />
          <div className="absolute inset-y-0 left-0 w-[min(88vw,320px)] animate-fade-in border-r border-hairline bg-white">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-parchment hover:text-ink-900"
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

      <div className="lg:pl-[264px]">
        <header className="glass sticky top-0 z-30 hidden border-b border-hairline lg:block">
          <div className="mx-auto flex h-14 w-full max-w-[1320px] items-center gap-4 px-8">
            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-[12px]">
              <span className="text-ink-400">{meta.section}</span>
              <ChevronRight className="h-3 w-3 shrink-0 text-ink-300" aria-hidden="true" />
              <span className="truncate font-semibold text-ink-900">{meta.title}</span>
            </nav>

            <div className="ml-auto flex shrink-0 items-center gap-2.5">
              <Link
                href="/search"
                className="group flex h-9 w-[236px] items-center gap-2 rounded-full border border-[#e0e0e0] bg-white px-4 text-[12px] text-ink-500 transition-colors hover:border-[#d2d2d7] hover:text-ink-700"
              >
                <Search className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="flex-1 truncate text-left">Search notes &amp; web</span>
                <kbd className="rounded-full border border-[#e0e0e0] bg-parchment px-1.5 py-0.5 font-mono text-[9px] text-ink-400">
                  /
                </kbd>
              </Link>

              <Link
                href="/setup"
                title={
                  mode === "live" ? `Live AI connected · ${model}` : "Curated demo mode — add a Gemini key"
                }
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium transition-colors",
                  mode === "live"
                    ? "border-[#d2d2d7] bg-white text-ink-600 hover:bg-parchment"
                    : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100/70",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    mode === "live" ? "bg-emerald-500" : "bg-amber-500",
                  )}
                />
                {mode === "live" ? "Live AI" : "Demo mode"}
              </Link>

              <Button asChild variant="primary" size="sm">
                <Link href="/upload">
                  <UploadCloud className="h-4 w-4" aria-hidden="true" />
                  Upload
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {mode === "demo" && (
          <div className="border-b border-hairline bg-white px-5 py-2.5 sm:px-8 lg:px-10">
            <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink-500">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
              <strong className="font-semibold text-ink-900">Demo mode.</strong>
              <span>Sample outputs are curated and labelled — never presented as live AI.</span>
              <Link
                href="/setup"
                className="ml-auto shrink-0 font-medium text-action underline-offset-2 hover:underline"
              >
                Add a Gemini key →
              </Link>
            </div>
          </div>
        )}
        <main className="mx-auto w-full max-w-[1320px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
