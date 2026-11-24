import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GarageLog — POS & Pelacakan Progres Bengkel Modifikasi Motor",
  description:
    "Sistem Point of Sale terpadu dan pelacakan progres pengerjaan modifikasi motor secara real-time dan transparan untuk pelanggan dan bengkel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased selection:bg-orange-500/20 selection:text-orange-500">
        {children}
      </body>
    </html>
  );
}

