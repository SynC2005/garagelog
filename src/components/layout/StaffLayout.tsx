"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Wrench, LogOut, ExternalLink } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  StaggeredMenu,
  type StaggeredMenuItem,
} from "@/components/ui/StaggeredMenu";
import { useTheme } from "next-themes";
import type { FeatureCode } from "@/lib/rbac";
import { logoutStaffAction } from "@/server/api/auth/authApi";

interface StaffLayoutProps {
  children: React.ReactNode;
  activeStaff?: {
    nama: string;
    peran: "Admin" | "Montir" | "Pemilik";
  };
  allowedFeatures?: Partial<Record<FeatureCode, boolean>>;
}

const navItems: {
  label: string;
  href: string;
  feature: FeatureCode;
}[] = [
  { label: "Dashboard", href: "/dashboard", feature: "dashboard" },
  { label: "Pesanan", href: "/pesanan", feature: "pesanan" },
  { label: "Tugas Pengerjaan", href: "/tugas", feature: "tugas" },
  { label: "Pelanggan & Kendaraan", href: "/pelanggan", feature: "pelanggan" },
  { label: "Katalog Jasa", href: "/jasa", feature: "jasa" },
  { label: "Stok", href: "/stok", feature: "stok" },
  { label: "Laporan", href: "/laporan", feature: "laporan" },
  { label: "Pengaturan", href: "/pengaturan", feature: "pengaturan" },
];

const DEFAULT_FALLBACK_STAFF: {
  nama: string;
  peran: "Admin" | "Montir" | "Pemilik";
} = { nama: "Staf Bengkel", peran: "Admin" };

let cachedSessionRaw: string | null = null;
let cachedSessionStaff = DEFAULT_FALLBACK_STAFF;

function getFallbackStaffSnapshot() {
  try {
    const raw = sessionStorage.getItem("active_user");
    if (raw === cachedSessionRaw) return cachedSessionStaff;
    cachedSessionRaw = raw;
    if (raw) {
      const parsed = JSON.parse(raw) as {
        nama?: string;
        peran?: "Admin" | "Montir" | "Pemilik";
      };
      if (parsed.nama && parsed.peran) {
        cachedSessionStaff = { nama: parsed.nama, peran: parsed.peran };
        return cachedSessionStaff;
      }
    }
  } catch {}
  cachedSessionStaff = DEFAULT_FALLBACK_STAFF;
  return cachedSessionStaff;
}

const emptySubscribe = () => () => {};

export function StaffLayout({
  children,
  activeStaff,
  allowedFeatures,
}: StaffLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const isDark = mounted && resolvedTheme === "dark";

  const fallbackUser = React.useSyncExternalStore(
    emptySubscribe,
    getFallbackStaffSnapshot,
    () => DEFAULT_FALLBACK_STAFF
  );

  const currentUser = activeStaff || fallbackUser;

  const visibleNavItems = navItems.filter((item) => {
    if (!allowedFeatures) return true;
    return allowedFeatures[item.feature] === true;
  });

  const homeHref =
    currentUser.peran === "Montir" && (!allowedFeatures || allowedFeatures.tugas)
      ? "/tugas"
      : !allowedFeatures || allowedFeatures.dashboard
      ? "/dashboard"
      : visibleNavItems[0]?.href || "/pesanan";

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem("active_user");
    } catch {}
    await logoutStaffAction();
    router.push("/masuk");
    router.refresh();
  };

  const menuItems: StaggeredMenuItem[] = visibleNavItems.map((item) => {
    const isActive =
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(item.href));

    return {
      label: item.label,
      link: item.href,
      ariaLabel: `Buka halaman ${item.label}`,
      active: isActive,
    };
  });

  const SidebarBrand = (
    <Link
      href={homeHref}
      className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
    >
      <div className="size-9 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
        <Wrench className="size-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <span className="font-bold text-base tracking-tight text-foreground">
          Garage<span className="text-primary">Log</span>
        </span>
        <p className="text-[11px] text-muted-foreground font-medium -mt-0.5 hidden sm:block">
          POS &amp; Progres Bengkel
        </p>
      </div>
    </Link>
  );

  const HeaderControls = (
    <>
      <div className="hidden md:flex items-center gap-2 pr-1">
        <span className="text-xs font-semibold text-foreground max-w-[160px] truncate">
          {currentUser.nama}
        </span>
        <Badge variant="outline" className="text-[11px]">
          {currentUser.peran}
        </Badge>
      </div>
      <ThemeToggle />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        aria-label="Keluar dari akun staf"
        className="hidden sm:inline-flex gap-1.5 text-xs"
      >
        <LogOut className="size-3.5 text-destructive" aria-hidden="true" />
        <span>Keluar</span>
      </Button>
    </>
  );

  const DrawerFooter = (
    <div className="space-y-3">
      <Link
        href="/lacak"
        target="_blank"
        className="flex items-center justify-between text-xs text-muted-foreground hover:text-primary px-1 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span>Buka Lacak Publik</span>
        <ExternalLink className="size-3.5" aria-hidden="true" />
      </Link>

      <Separator />

      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight truncate">
            {currentUser.nama}
          </p>
          <p className="text-xs text-primary font-medium mt-0.5">
            Peran: {currentUser.peran}
          </p>
        </div>
        <ThemeToggle />
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleLogout}
        className="w-full justify-center"
      >
        <LogOut className="size-3.5 text-destructive" aria-hidden="true" />
        <span>Keluar</span>
      </Button>
    </div>
  );

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      {/* Sidebar Navigasi StaggeredMenu (Header bar + Animated Drawer dari kiri) */}
      <StaggeredMenu
        position="left"
        isFixed
        headerVariant="bar"
        items={menuItems}
        displaySocials={false}
        displayItemNumbering
        closeOnClickAway
        colors={isDark ? ["#27272a", "#c2410c"] : ["#fed7aa", "#c2410c"]}
        accentColor={isDark ? "#f97316" : "#c2410c"}
        logoNode={SidebarBrand}
        headerRight={HeaderControls}
        panelFooter={DrawerFooter}
      />

      {/* Spacer h-16 di bawah fixed header bar StaggeredMenu */}
      <div className="h-16 shrink-0" aria-hidden="true" />

      {/* Area Konten Utama */}
      <main className="flex-1 min-w-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
