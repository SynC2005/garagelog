"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  MessageSquareQuote,
  RotateCw,
  Star,
  Wrench,
} from "lucide-react";
import { FlipCard } from "@/components/ui/FlipCard";
import { FolderFloat, type FolderFloatItem } from "@/components/ui/FolderFloat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CustomerReview {
  id: string;
  nama: string;
  motor: string;
  rating: number;
  ringkas: string;
  komentar: string;
}

const CUSTOMER_REVIEWS: CustomerReview[] = [
  {
    id: "rev-1",
    nama: "Budi Santoso",
    motor: "Yamaha Scorpio 225 (Cafe Racer)",
    rating: 5,
    ringkas: "★ 5.0 · Budi — Tangki & cat rapi",
    komentar:
      "Las tangki kustomnya halus dan cat ovennya rapi banget. Dari awal bongkar sampai pengujian, foto progres selalu masuk jadi tidak perlu tanya-tanya terus.",
  },
  {
    id: "rev-2",
    nama: "Raka Pratama",
    motor: "Kawasaki W175 (Scrambler)",
    rating: 5,
    ringkas: "★ 5.0 · Raka — Progres update",
    komentar:
      "Suka fitur lacak kodenya. Waktu nunggu shockbreaker datang pun dikasih pembaruan info oleh montir, pengerjaan selesai tepat estimasi.",
  },
  {
    id: "rev-3",
    nama: "Dimas Wijaya",
    motor: "Honda CB150R (Tracker)",
    rating: 5,
    ringkas: "★ 5.0 · Dimas — Kelistrikan rapi",
    komentar:
      "Jalur kabel lampu LED dirapikan tersembunyi di bawah jok dan diuji pakai multimeter sebelum serah terima. Sampai sekarang dipakai hujan tetap aman.",
  },
  {
    id: "rev-4",
    nama: "Fajar Nugroho",
    motor: "Yamaha XSR 155 (Brat Style)",
    rating: 5,
    ringkas: "★ 5.0 · Fajar — Biaya transparan",
    komentar:
      "Rincian jasa sama suku cadangnya jelas dari awal sebelum dikerjakan. Tidak ada biaya mendadak dan nota cetaknya detail.",
  },
  {
    id: "rev-5",
    nama: "Bagus Setiawan",
    motor: "Suzuki Thunder 250 (Bobber)",
    rating: 4,
    ringkas: "★ 4.0 · Bagus — Setting enteng",
    komentar:
      "Setting karburator dan knalpot stainless langsung terasa responsif saat tes jalan. Sempat mundur sehari karena antre ruang cat oven, tapi hasilnya memuaskan.",
  },
  {
    id: "rev-6",
    nama: "Reza Mahendra",
    motor: "Honda Tiger 2000 (Japstyle)",
    rating: 5,
    ringkas: "★ 5.0 · Reza — Rangka kokoh",
    komentar:
      "Subframe belakang dipotong ulang dan disambung rapi banget, posisi berkendara jauh lebih nyaman buat turing jarak jauh.",
  },
];

const AVERAGE_RATING = (
  CUSTOMER_REVIEWS.reduce((sum, item) => sum + item.rating, 0) /
  CUSTOMER_REVIEWS.length
).toFixed(1);

const emptySubscribe = () => () => {};

export function OwnerAndFeedbackSection() {
  const { resolvedTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const isDark = mounted && resolvedTheme === "dark";

  const [isOwnerFlipped, setIsOwnerFlipped] = React.useState(false);
  const [folderOpen, setFolderOpen] = React.useState(false);
  const [selectedReviewIdx, setSelectedReviewIdx] = React.useState(0);

  const folderItems: FolderFloatItem[] = React.useMemo(
    () =>
      CUSTOMER_REVIEWS.map((rev) => ({
        label: rev.ringkas,
        value: rev.id,
      })),
    []
  );

  const activeReview =
    CUSTOMER_REVIEWS[selectedReviewIdx] ?? CUSTOMER_REVIEWS[0];

  const handleStepReview = (delta: number) => {
    setSelectedReviewIdx(
      (prev) =>
        (prev + delta + CUSTOMER_REVIEWS.length) % CUSTOMER_REVIEWS.length
    );
  };

  return (
    <section
      aria-labelledby="owner-reviews-heading"
      className="max-w-6xl mx-auto px-4 pb-20 pt-4 border-t border-border overflow-x-clip"
    >
      {/* Header Section Seimbang Kiri-Kanan */}
      <div className="mb-10 pt-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="outline" className="gap-1.5 text-xs">
            <Wrench className="size-3.5 text-primary" aria-hidden="true" />
            <span>Tentang Bengkel &amp; Testimoni</span>
          </Badge>
          <h2
            id="owner-reviews-heading"
            className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground"
          >
            Pendiri Bengkel &amp; Kata Pelanggan
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl">
            Balik kartu profil untuk membaca pesan pendiri kami sejak 2016, dan
            klik folder interaktif untuk melihat komentar serta rating pelanggan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground shrink-0 pb-1">
          <div className="inline-flex items-center gap-1.5">
            <Calendar className="size-3.5 text-primary" aria-hidden="true" />
            <span className="font-semibold text-foreground">Est. 2016</span>
          </div>
          <span aria-hidden="true" className="text-border">
            &bull;
          </span>
          <div className="inline-flex items-center gap-1.5 tabular-nums">
            <Star
              className="size-3.5 fill-amber-500 text-amber-500"
              aria-hidden="true"
            />
            <span className="font-semibold text-foreground">
              {AVERAGE_RATING} / 5.0
            </span>
            <span>({CUSTOMER_REVIEWS.length} ulasan)</span>
          </div>
        </div>
      </div>

      {/* Grid 2 Kolom Sejajar Atas (items-start) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Bagian Kiri: Header Kolom + FlipCard Pemilik */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Profil Pemilik Bengkel
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isOwnerFlipped
                  ? "Klik atau geser lagi untuk melihat foto pemilik."
                  : "Klik atau geser kartu untuk membaca pesan pemilik."}
              </p>
            </div>
            <Badge variant="secondary" className="gap-1 text-[11px] shrink-0">
              <RotateCw className="size-3" aria-hidden="true" />
              <span>{isOwnerFlipped ? "Belakang" : "Klik Kartu"}</span>
            </Badge>
          </div>

          <div className="flex justify-center pt-2">
            <FlipCard
              width={296}
              height={396}
              radius={20}
              axis="y"
              flipOnClick
              draggable
              tilt
              glare
              glareOpacity={0.2}
              hoverScale={1.02}
              background={isDark ? "#18181b" : "#ffffff"}
              color={isDark ? "#f4f4f5" : "#0f172a"}
              shadowColor="#000000"
              shadowOpacity={isDark ? 0.55 : 0.22}
              ariaLabel="Kartu profil Pak Hendro, pemilik bengkel GarageLog. Tekan Enter atau klik untuk membalik kartu."
              onFlipChange={setIsOwnerFlipped}
              front={
                <div className="relative w-full h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/landing/pemilik-bengkel.jpg"
                    alt="Pak Hendro, pemilik bengkel modifikasi motor GarageLog"
                    draggable={false}
                    className="w-full h-full object-cover"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-left text-white space-y-1">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400">
                      <Calendar className="size-3" aria-hidden="true" />
                      Est. 2016
                    </span>
                    <h4 className="text-xl font-extrabold leading-tight">
                      Pak Hendro
                    </h4>
                    <p className="text-xs text-zinc-200">
                      Pemilik &amp; Kepala Mekanik GarageLog
                    </p>
                  </div>
                </div>
              }
              back={
                <div className="w-full h-full p-6 border border-border rounded-[inherit] flex flex-col justify-between text-left bg-card text-card-foreground">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="info" className="gap-1.5 text-[11px]">
                        <Calendar className="size-3" aria-hidden="true" />
                        <span>Berdiri Tahun 2016</span>
                      </Badge>
                      <Wrench
                        className="size-4 text-primary"
                        aria-hidden="true"
                      />
                    </div>

                    <div className="space-y-2">
                      <MessageSquareQuote
                        className="size-6 text-primary/80"
                        aria-hidden="true"
                      />
                      <p className="text-sm leading-relaxed text-foreground font-medium">
                        &ldquo;Modifikasi motor bukan sekadar tampilan, tapi
                        soal presisi rangka, keamanan kelistrikan, dan rasa
                        percaya. Sejak bengkel ini berdiri tahun 2016, kami
                        berkomitmen membuat setiap pemilik selalu melihat
                        progres motornya secara jujur.&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex items-end justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        Pak Hendro
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Pemilik Bengkel GarageLog &bull; Est. 2016
                      </p>
                    </div>
                    <span className="text-[11px] text-primary font-medium inline-flex items-center gap-1 shrink-0">
                      <RotateCw className="size-3" aria-hidden="true" />
                      Balik
                    </span>
                  </div>
                </div>
              }
            />
          </div>
        </div>

        {/* Bagian Kanan: Header Kolom Sejajar + FolderFloat & Ulasan */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Komentar &amp; Rating Pelanggan
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {folderOpen
                  ? "Folder terbuka — klik catatan melayang untuk membaca ulasan lengkap."
                  : "Klik folder untuk mengeluarkan komentar dan rating pelanggan."}
              </p>
            </div>

            <Badge variant="secondary" className="gap-1 text-[11px] shrink-0">
              <span>{folderOpen ? "Terbuka" : "Klik Folder"}</span>
            </Badge>
          </div>

          {/* Area Terbuka FolderFloat */}
          <div className="pt-40 pb-2 flex flex-col items-center justify-end overflow-visible">
            <FolderFloat
              items={folderItems}
              label="Ulasan Customer"
              sublabel={`${CUSTOMER_REVIEWS.length} komentar`}
              trigger="click"
              closeOnSelect={false}
              physics
              drift={0.45}
              spread={235}
              lift={34}
              tilt={6}
              width={216}
              height={150}
              folderColor="#9a3412"
              frontColor="#c2410c"
              paperColor={isDark ? "#fed7aa" : "#fff7ed"}
              itemColor={isDark ? "#27272a" : "#ffffff"}
              itemTextColor={isDark ? "#f4f4f5" : "#0f172a"}
              labelColor="#ffffff"
              onOpenChange={setFolderOpen}
              onSelect={(_, index) => setSelectedReviewIdx(index)}
            />
          </div>

          {/* Detail Komentar Minimalis dengan Hairline Atas */}
          <div
            aria-live="polite"
            className="pt-5 border-t border-border space-y-3"
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div
                className="flex items-center gap-1"
                aria-label={`Rating ${activeReview.rating} dari 5 bintang`}
              >
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`size-4 ${
                      i < activeReview.rating
                        ? "fill-amber-500 text-amber-500"
                        : "text-muted-foreground/40"
                    }`}
                    aria-hidden="true"
                  />
                ))}
                <span className="ml-1.5 text-xs font-bold tabular-nums text-foreground">
                  {activeReview.rating.toFixed(1)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleStepReview(-1)}
                  aria-label="Ulasan sebelumnya"
                >
                  <ChevronLeft className="size-3.5" aria-hidden="true" />
                </Button>
                <span className="text-[11px] font-mono tabular-nums text-muted-foreground px-1">
                  {selectedReviewIdx + 1}/{CUSTOMER_REVIEWS.length}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleStepReview(1)}
                  aria-label="Ulasan berikutnya"
                >
                  <ChevronRight className="size-3.5" aria-hidden="true" />
                </Button>
              </div>
            </div>

            <p className="text-sm sm:text-base text-foreground leading-relaxed">
              &ldquo;{activeReview.komentar}&rdquo;
            </p>

            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-bold text-foreground">
                {activeReview.nama}
              </span>
              <span className="text-muted-foreground">
                {activeReview.motor}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
