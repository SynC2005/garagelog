"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wrench,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
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

export function MasukWrapper() {
  const router = useRouter();
  const [email, setEmail] = React.useState("admin@garagelog.com");
  const [password, setPassword] = React.useState("bengkel123");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const res = await loginStaffAction({
      email,
      kataSandi: password,
    });

    setIsLoading(false);

    if (res.success && res.data) {
      sessionStorage.setItem("active_user", JSON.stringify(res.data));
      toast.success(`Selamat datang, ${res.data.nama}`);
      const targetRoute =
        res.data.defaultRoute ||
        (res.data.peran === "Montir" ? "/tugas" : "/dashboard");
      router.push(targetRoute);
      router.refresh();
    } else {
      setError(res.error || "Email atau kata sandi tidak valid.");
    }
  };

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
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
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
                disabled={isLoading}
                className="w-full h-10 text-sm font-semibold"
              >
                {isLoading ? "Memproses..." : "Masuk"}
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
                  onClick={() => {
                    setEmail("budi.montir@garagelog.com");
                    setPassword("bengkel123");
                    setError(null);
                  }}
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
                  onClick={() => {
                    setEmail("admin@garagelog.com");
                    setPassword("bengkel123");
                    setError(null);
                  }}
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
                  onClick={() => {
                    setEmail("owner@garagelog.com");
                    setPassword("bengkel123");
                    setError(null);
                  }}
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
