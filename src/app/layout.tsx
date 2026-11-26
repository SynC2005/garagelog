import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { BrandProvider } from "@/components/brand-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { RouteTransitionProvider } from "@/components/route-transition-provider";
import { Toaster } from "@/components/ui/sonner";
import { getBrandIdentitySafe } from "@/server/services/pengaturan/landingService";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GarageLog — POS & Pelacakan Progres Bengkel Modifikasi Motor",
  description:
    "Sistem Point of Sale terpadu dan pelacakan progres pengerjaan modifikasi motor secara real-time dan transparan untuk pelanggan dan bengkel.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialBrand = await getBrandIdentitySafe();

  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased selection:bg-primary/20 selection:text-primary">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <BrandProvider initialBrand={initialBrand}>
            <RouteTransitionProvider>{children}</RouteTransitionProvider>
            <Toaster richColors position="top-right" closeButton />
          </BrandProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
