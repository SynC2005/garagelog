"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Wrench,
  Users,
  BookOpen,
  Boxes,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  ExternalLink,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface StaffLayoutProps {
  children: React.ReactNode;
  activeStaff?: {
    nama: string;
    peran: "Admin" | "Montir" | "Pemilik";
  };
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Pesanan", href: "/pesanan", icon: ClipboardList },
  { label: "Tugas Pengerjaan", href: "/tugas", icon: Wrench },
  { label: "Pelanggan & Kendaraan", href: "/pelanggan", icon: Users },
  { label: "Katalog Jasa", href: "/jasa", icon: BookOpen },
  { label: "Stok", href: "/stok", icon: Boxes },
  { label: "Laporan", href: "/laporan", icon: BarChart3 },
  { label: "Pengaturan", href: "/pengaturan", icon: Settings },
];

export function StaffLayout({
  children,
  activeStaff = { nama: "Farid Yusron", peran: "Admin" },
}: StaffLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState(activeStaff);

  React.useEffect(() => {
    try {
      const stored = sessionStorage.getItem("active_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.nama && parsed.peran) {
          setCurrentUser({
            nama: parsed.nama,
            peran: parsed.peran,
          });
        }
      }
    } catch {}
  }, []);

  const handleLogout = () => {
    try {
      sessionStorage.removeItem("active_user");
    } catch {}
  };

  const SidebarBrand = (
    <Link
      href="/dashboard"
      onClick={() => setMobileMenuOpen(false)}
      className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
    >
      <div className="size-9 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
        <Wrench className="size-4" aria-hidden="true" />
      </div>
      <div>
        <span className="font-bold text-base tracking-tight text-foreground">
          Garage<span className="text-primary">Log</span>
        </span>
        <p className="text-[11px] text-muted-foreground font-medium -mt-0.5">
          POS &amp; Progres Bengkel
        </p>
      </div>
    </Link>
  );

  const SidebarNav = (
    <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="Navigasi Staf">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
              aria-hidden="true"
            />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const SidebarFooter = (
    <div className="p-4 border-t border-border space-y-3">
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

      <Button asChild variant="outline" size="sm" className="w-full justify-center">
        <Link href="/masuk" onClick={handleLogout}>
          <LogOut className="size-3.5 text-destructive" aria-hidden="true" />
          <span>Keluar</span>
        </Link>
      </Button>
    </div>
  );

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col lg:flex-row">
      {/* Mobile Header + Sheet Drawer */}
      <header className="lg:hidden sticky top-0 z-40 h-16 bg-card border-b border-border px-4 flex items-center justify-between">
        {SidebarBrand}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Buka menu navigasi"
              >
                <Menu className="size-4" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 flex flex-col justify-between">
              <SheetHeader className="h-16 px-5 border-b border-border flex flex-row items-center justify-between space-y-0">
                <SheetTitle className="sr-only">Menu Navigasi GarageLog</SheetTitle>
                {SidebarBrand}
              </SheetHeader>
              {SidebarNav}
              {SidebarFooter}
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:sticky lg:top-0 lg:h-dvh bg-card border-r border-border justify-between">
        <div className="h-16 px-5 border-b border-border flex items-center">
          {SidebarBrand}
        </div>
        {SidebarNav}
        {SidebarFooter}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
