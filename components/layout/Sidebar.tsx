"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
};

const managementNav: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    match: (p) => p === "/",
  },
  {
    href: "/planning",
    label: "Planning",
    match: (p) => p.startsWith("/planning"),
  },
  {
    href: "/batches/active",
    label: "Batches",
    match: (p) => p.startsWith("/batches"),
  },
  {
    href: "/materials",
    label: "Materials",
    match: (p) => p.startsWith("/materials"),
  },
];

const team402Nav: NavItem[] = [
  {
    href: "/402",
    label: "402 Today",
    match: (p) => p.startsWith("/402"),
  },
];

function NavLink({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = item.match(pathname);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={[
        "block rounded-md px-3 py-[11px] text-[13px] leading-snug transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80",
        active
          ? "bg-white/10 text-sidebar-text"
          : "text-[#d2ddd5] hover:bg-white/[0.09] hover:text-sidebar-text",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
    >
      {item.label}
    </Link>
  );
}

type SidebarProps = {
  mobileOpen: boolean;
  onNavigate?: () => void;
};

export function Sidebar({ mobileOpen, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const in402 = pathname.startsWith("/402");

  return (
    <>
      <div
        className={[
          "fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        aria-hidden={!mobileOpen}
        onClick={onNavigate}
      />

      <aside
        id="app-sidebar"
        className={[
          "flex h-full min-h-screen w-[var(--sidebar-width)] shrink-0 flex-col gap-6 bg-sidebar px-4 py-[22px] text-sidebar-text",
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:shadow-card max-lg:transition-transform max-lg:duration-200",
          mobileOpen ? "max-lg:translate-x-0" : "max-lg:hidden",
          "lg:sticky lg:top-0 lg:z-auto lg:max-h-screen lg:translate-x-0",
        ].join(" ")}
        aria-label="Application navigation"
      >
        <div className="flex items-center gap-3 px-2 pb-1">
          <div
            className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-md bg-[#dfece3] text-[15px] font-extrabold text-green-dark"
            aria-hidden
          >
            V
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-bold leading-tight">Växa Production</p>
            <p className="text-[11px] text-sidebar-text-secondary">
              Operational workspace
            </p>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5">
          <p className="px-3 pb-1 text-[9px] font-bold tracking-[0.12em] text-sidebar-text-muted uppercase">
            Management
          </p>
          {managementNav.map((item) => (
            <NavLink key={item.href} item={item} onNavigate={onNavigate} />
          ))}

          <p className="mt-3 px-3 pb-1 text-[9px] font-bold tracking-[0.12em] text-[#8fa094] uppercase">
            Team 402
          </p>
          <div
            className={[
              "rounded-lg bg-white/[0.08] p-3",
              in402 ? "ring-1 ring-white/10" : "",
            ].join(" ")}
          >
            <p className="text-[9px] font-bold tracking-[0.1em] text-sidebar-text-muted uppercase">
              Current team
            </p>
            <p className="mt-1 text-[13px] font-semibold">402 · Cultivation</p>
            <p className="text-[10px] text-[#c7d2ca]">Team production workspace</p>
          </div>
          {team402Nav.map((item) => (
            <NavLink key={item.href} item={item} onNavigate={onNavigate} />
          ))}
        </nav>
      </aside>
    </>
  );
}
