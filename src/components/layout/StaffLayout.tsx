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
  X,
  ExternalLink,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100 flex">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 z-40 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
            <Wrench className="w-4 h-4" />
          </div>
          <span className="font-bold text-base tracking-tight">
            Garage<span className="text-orange-500">Log</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar for Desktop & Mobile Overlay */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 lg:static",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Top: Logo & Nav items */}
        <div>
          {/* Logo Area */}
          <div className="h-16 px-6 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  Garage<span className="text-orange-500">Log</span>
                </span>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium -mt-0.5">
                  POS & Progres Bengkel
                </p>
              </div>
            </Link>
          </div>

          {/* Nav List */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 font-semibold"
                      : "text-slate-600 hover:text-slate-950 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/60"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-orange-500" : "text-slate-400 dark:text-zinc-500")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Staff info, Theme toggle & Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800/80 space-y-3">
          <Link
            href="/lacak"
            target="_blank"
            className="flex items-center justify-between text-xs text-slate-500 hover:text-orange-600 dark:text-zinc-400 dark:hover:text-orange-400 px-1 transition-colors"
          >
            <span>Buka Lacak Publik</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {activeStaff.nama}
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                Peran: {activeStaff.peran}
              </p>
            </div>
            <ThemeToggle />
          </div>

          <Link
            href="/masuk"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-500" />
            <span>Keluar</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full pt-16 lg:pt-0 min-h-screen overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}

