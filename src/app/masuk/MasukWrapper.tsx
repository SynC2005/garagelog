"use client";

import * as React from "react";
import Link from "next/link";
import {
  Wrench,
  Lock,
  Mail,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { useRouteTransition } from "@/components/route-transition-provider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { loginStaffAction } from "@/server/api/auth/authApi";

const LOCKOUT_STORAGE_KEY = "garagelog_login_lockout_until";

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function MasukWrapper() {
  const { startRouteTransition } = useRouteTransition();
  const [email, setEmail] = React.useState("admin@garagelog.com");
  const [password, setPassword] = React.useState("bengkel123");
  const [error, setError] = React.useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);

  const hasLockout = lockoutSeconds > 0;

  // Pulihkan hitung mundur jika user memuat ulang halaman saat masih masa tunggu
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedUntil = sessionStorage.getItem(LOCKOUT_STORAGE_KEY);
        if (!savedUntil) return;
        const untilMs = Number(savedUntil);
        const remaining = Math.ceil((untilMs - Date.now()) / 1000);
        if (remaining > 0) {
          setLockoutSeconds(remaining);
          setError(
            "Batas 3x percobaan masuk tercapai. Tunggu hingga hitung mundur selesai sebelum mencoba lagi."
          );
        } else {
          sessionStorage.removeItem(LOCKOUT_STORAGE_KEY);
        }
      } catch {}
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (!hasLockout) return;

    const timer = window.setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          try {
            sessionStorage.removeItem(LOCKOUT_STORAGE_KEY);
          } catch {}
          setError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [hasLockout]);

  const applyDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("bengkel123");
    if (lockoutSeconds === 0) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0 || isLoading) return;

    setError(null);
    setIsLoading(true);

    try {
      const res = await loginStaffAction({
        email,
        kataSandi: password,
      });

      if (res.success && res.data) {
        try {
          sessionStorage.removeItem(LOCKOUT_STORAGE_KEY);
          sessionStorage.setItem("active_user", JSON.stringify(res.data));
        } catch {}
        toast.success(`Selamat datang, ${res.data.nama}`);
        const targetRoute =
          res.data.defaultRoute ||
          (res.data.peran === "Montir" ? "/tugas" : "/dashboard");
        startRouteTransition({
          href: targetRoute,
          subtitle: `MASUK • ${res.data.peran.toUpperCase()}`,
          ariaLabel: `Memuat halaman ${res.data.peran} GarageLog`,
          refresh: true,
        });
        return;
      }

      if (res.retryAfterSeconds && res.retryAfterSeconds > 0) {
        const untilMs = Date.now() + res.retryAfterSeconds * 1000;
        try {
          sessionStorage.setItem(LOCKOUT_STORAGE_KEY, String(untilMs));
        } catch {}
        setLockoutSeconds(res.retryAfterSeconds);
      }
      setError(res.error || "Email atau kata sandi tidak sesuai.");
      setIsLoading(false);
    } catch {
      setError("Gagal terhubung ke server. Periksa koneksi dan coba lagi.");
      setIsLoading(false);
    }
  };

  const isLocked = lockoutSeconds > 0;

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col justify-between p-4">
      <div className="flex justify-end p-2">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md mx-auto">
        <Card className="py-0 gap-0">
          <CardHeader className="pt-6 pb-4 text-center space-y-2">
            <div className="size-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
              <Wrench className="size-6" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Masuk Staf
            </CardTitle>
            <CardDescription className="text-xs">
              Khusus admin, montir, dan pemilik usaha bengkel.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-2 space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {isLocked ? (
                <Alert variant="destructive">
                  <Clock className="size-4" aria-hidden="true" />
                  <AlertDescription className="text-xs space-y-1.5">
                    <p role="alert" className="font-medium">
                      {error ||
                        "Terlalu banyak percobaan masuk yang gagal. Tunggu 1 menit sebelum mencoba lagi."}
                    </p>
                    <p className="tabular-nums font-semibold">
                      Waktu tunggu tersisa: {formatCountdown(lockoutSeconds)}
                    </p>
                  </AlertDescription>
                </Alert>
              ) : (
                error && (
                  <Alert variant="destructive" role="alert">
                    <AlertCircle className="size-4" aria-hidden="true" />
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                )
              )}

              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-xs font-semibold">
                  Email
                </Label>
                <div className="relative">
                  <Mail
                    className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@garagelog.com"
                    className="pl-9 h-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-password" className="text-xs font-semibold">
                  Kata sandi
                </Label>
                <div className="relative">
                  <Lock
                    className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="pl-9 h-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || isLocked}
                className="w-full h-10 text-sm font-semibold tabular-nums"
              >
                {isLoading
                  ? "Memproses..."
                  : isLocked
                  ? `Tunggu ${formatCountdown(lockoutSeconds)}`
                  : "Masuk"}
              </Button>
            </form>

            <Separator />

            {/* Akses Cepat Akun Demo */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-muted-foreground text-center">
                Pilih Akun Cepat (Demo)
              </p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={email === "budi.montir@garagelog.com" ? "secondary" : "outline"}
                  onClick={() => applyDemoAccount("budi.montir@garagelog.com")}
                  className={
                    email === "budi.montir@garagelog.com"
                      ? "border-primary text-primary text-xs"
                      : "text-xs"
                  }
                >
                  <Wrench className="size-3.5" aria-hidden="true" />
                  <span>Montir</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={email === "admin@garagelog.com" ? "secondary" : "outline"}
                  onClick={() => applyDemoAccount("admin@garagelog.com")}
                  className={
                    email === "admin@garagelog.com"
                      ? "border-primary text-primary text-xs"
                      : "text-xs"
                  }
                >
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                  <span>Admin</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={email === "owner@garagelog.com" ? "secondary" : "outline"}
                  onClick={() => applyDemoAccount("owner@garagelog.com")}
                  className={
                    email === "owner@garagelog.com"
                      ? "border-primary text-primary text-xs"
                      : "text-xs"
                  }
                >
                  <Crown className="size-3.5" aria-hidden="true" />
                  <span>Pemilik</span>
                </Button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t border-border py-4 justify-center">
            <Link
              href="/lacak"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
            >
              <span>Pelanggan? Lacak pesanan dengan kode</span>
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </CardFooter>
        </Card>
      </div>

      <div className="text-center py-4 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} GarageLog. Seluruh hak cipta dilindungi.
      </div>
    </div>
  );
}
