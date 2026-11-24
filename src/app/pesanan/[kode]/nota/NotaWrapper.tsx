"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Download, Wrench } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";

interface NotaWrapperProps {
  order: any;
}

export function NotaWrapper({ order }: NotaWrapperProps) {
  const nomorNota = `NT-${order.id.toString().padStart(4, "0")}`;
  const tanggal = formatDate(order.created_at);

  const jasaList = order.itemJasa.map((j: any) => ({
    nama: j.jasa?.nama || "Layanan Jasa",
    harga: j.harga,
  }));

  const partsList = order.itemSukuCadang.map((p: any) => ({
    nama: p.sukuCadang?.nama || "Suku Cadang",
    jml: p.jumlah,
    harga: p.harga,
  }));

  const pembayaranList = order.pembayaran.map((p: any) => ({
    metode: p.metode.toUpperCase(),
    tanggal: formatDate(p.tanggal),
    jumlah: Number(p.jumlah),
  }));

  const totalJasa = jasaList.reduce((s: number, j: any) => s + j.harga, 0);
  const totalSukuCadang = partsList.reduce((s: number, p: any) => s + p.harga * p.jml, 0);
  const grandTotal = Number(order.estimasi_total) || totalJasa + totalSukuCadang;
  const totalDibayar = pembayaranList.reduce((s: number, p: any) => s + p.jumlah, 0);
  const sisaTagihan = Math.max(0, grandTotal - totalDibayar);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-zinc-950 p-4 sm:p-8">
      {/* Top Action Bar (hidden when printing) */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link href={`/pesanan/${order.kode_pesanan}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Kembali ke pesanan</span>
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Download className="w-4 h-4 mr-1.5" />
            <span>Simpan PDF</span>
          </Button>
          <Button size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1.5" />
            <span>Cetak Nota</span>
          </Button>
        </div>
      </div>

      {/* Printable Sheet (Sesuai Wireframe Page 12) */}
      <div className="max-w-3xl mx-auto bg-white text-slate-900 border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-sm print:shadow-none print:border-none print:p-0 print:m-0">
        {/* Header Nota */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 border-b border-slate-200 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold">
                <Wrench className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-black tracking-tight">GarageLog Workshop</h1>
            </div>
            <p className="text-xs text-slate-500">
              Jalan Raya Otomotif No. 123, Jakarta Selatan &bull; Telp: 0812-3456-7890
            </p>
            <p className="text-xs text-slate-500 font-mono">Spesialis Modifikasi & Kustom Motor</p>
          </div>

          <div className="sm:text-right space-y-1">
            <h2 className="text-lg font-bold text-slate-900 tracking-wider">NOTA PEMBAYARAN</h2>
            <p className="text-xs font-mono font-semibold text-slate-700">{nomorNota}</p>
            <p className="text-xs text-slate-500">Tanggal: {tanggal}</p>
          </div>
        </div>

        {/* Info Pelanggan & Kendaraan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
          <div>
            <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Data Pelanggan:
            </span>
            <p className="font-bold text-sm text-slate-900">{order.pelanggan?.nama}</p>
            <p className="text-slate-600">Telepon: {order.pelanggan?.telepon}</p>
            <div className="mt-2 inline-block px-2.5 py-1 bg-slate-100 rounded text-slate-700 font-mono font-bold">
              Kode Lacak: {order.kode_pesanan}
            </div>
          </div>

          <div>
            <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Kendaraan:
            </span>
            <p className="font-bold text-sm text-slate-900">
              {order.kendaraan?.merek} {order.kendaraan?.model}
            </p>
            <p className="text-slate-600">
              Tahun: {order.kendaraan?.tahun} &bull; Plat: {order.kendaraan?.nomor_polisi}
            </p>
            <p className="text-slate-600">
              Perkiraan Selesai: {formatDate(order.perkiraan_selesai)}
            </p>
          </div>
        </div>

        {/* Tabel Rincian Jasa & Suku Cadang */}
        <div className="py-6 border-b border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-300 font-bold text-slate-700">
                <th className="py-2">Deskripsi Layanan / Komponen</th>
                <th className="py-2 text-center w-16">Jml</th>
                <th className="py-2 text-right w-28">Harga</th>
                <th className="py-2 text-right w-28">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jasaList.map((j: any, i: number) => (
                <tr key={`j-${i}`}>
                  <td className="py-2.5 font-medium">{j.nama} (Jasa)</td>
                  <td className="py-2.5 text-center font-mono">1</td>
                  <td className="py-2.5 text-right">{formatCurrency(j.harga)}</td>
                  <td className="py-2.5 text-right font-semibold">{formatCurrency(j.harga)}</td>
                </tr>
              ))}
              {partsList.map((p: any, i: number) => (
                <tr key={`p-${i}`}>
                  <td className="py-2.5 font-medium">{p.nama} (Suku Cadang)</td>
                  <td className="py-2.5 text-center font-mono">{p.jml}</td>
                  <td className="py-2.5 text-right">{formatCurrency(p.harga)}</td>
                  <td className="py-2.5 text-right font-semibold">
                    {formatCurrency(p.harga * p.jml)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total Ringkasan & Riwayat Pembayaran */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
          {/* Riwayat Pembayaran */}
          <div>
            <span className="font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Riwayat Pembayaran:
            </span>
            {pembayaranList.length === 0 ? (
              <p className="text-slate-400">Belum ada pembayaran yang dicatat.</p>
            ) : (
              <div className="space-y-1.5 font-mono">
                {pembayaranList.map((pay: any, idx: number) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-slate-100">
                    <span>
                      {pay.tanggal} ({pay.metode})
                    </span>
                    <span className="font-bold text-emerald-700">
                      {formatCurrency(pay.jumlah)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subtotal & Sisa Tagihan */}
          <div className="space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal Jasa:</span>
              <span>{formatCurrency(totalJasa)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Subtotal Suku Cadang:</span>
              <span>{formatCurrency(totalSukuCadang)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>Total Estimasi:</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
            <div className="flex justify-between font-bold text-emerald-600">
              <span>Total Diterima:</span>
              <span>{formatCurrency(totalDibayar)}</span>
            </div>
            <div className="flex justify-between font-black text-sm text-orange-600 pt-1 border-t border-slate-200">
              <span>Sisa Tagihan:</span>
              <span>{formatCurrency(sisaTagihan)}</span>
            </div>
          </div>
        </div>

        {/* Footer & Ketentuan */}
        <div className="pt-6 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs text-slate-500">
          <div className="space-y-1 max-w-sm">
            <p className="font-bold text-slate-700">Petunjuk Pelacakan Online:</p>
            <p>
              Pantau tahapan pengerjaan motor dan foto dokumentasi secara transparan di{" "}
              <strong>https://garagelog.id/lacak</strong> dengan kode:{" "}
              <strong className="text-slate-900">{order.kode_pesanan}</strong>.
            </p>
          </div>

          <div className="text-center sm:text-right space-y-8">
            <p>Hormat kami,</p>
            <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 w-36">
              GarageLog Workshop
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
