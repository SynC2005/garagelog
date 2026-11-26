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
import {
  formatReviewSummary,
  type CustomerReviewItem,
  type LandingSettingsData,
} from "@/lib/landingDefaults";

interface OwnerAndFeedbackSectionProps {
  settings: LandingSettingsData;
  reviews: CustomerReviewItem[];
}

const emptySubscribe = () => () => {};

export function OwnerAndFeedbackSection({
  settings,
  reviews,
}: OwnerAndFeedbackSectionProps) {
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
      reviews.map((rev) => ({
        label: formatReviewSummary(rev),
        value: String(rev.id),
      })),
    [reviews]
  );

  const safeReviewIdx =
    reviews.length > 0 ? Math.min(selectedReviewIdx, reviews.length - 1) : 0;
  const activeReview = reviews[safeReviewIdx] ?? null;

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length
        ).toFixed(1)
      : "0.0";

  const handleStepReview = (delta: number) => {
    if (reviews.length === 0) return;
    setSelectedReviewIdx(
      (prev) => (prev + delta + reviews.length) % reviews.length
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
            Balik kartu profil untuk membaca pesan pendiri{" "}
            {settings.namaPerusahaan} sejak {settings.tahunBerdiri}, dan klik
            folder interaktif untuk melihat komentar serta rating pelanggan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground shrink-0 pb-1">
          <div className="inline-flex items-center gap-1.5">
            <Calendar className="size-3.5 text-primary" aria-hidden="true" />
            <span className="font-semibold text-foreground">
              Est. {settings.tahunBerdiri}
            </span>
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
              {averageRating} / 5.0
            </span>
            <span>({reviews.length} ulasan)</span>
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
              ariaLabel={`Kartu profil ${settings.pemilikNama}, pemilik ${settings.namaPerusahaan}. Tekan Enter atau klik untuk membalik kartu.`}
              onFlipChange={setIsOwnerFlipped}
              front={
                <div className="relative w-full h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={settings.pemilikFotoUrl}
                    alt={`${settings.pemilikNama}, pemilik bengkel ${settings.namaPerusahaan}`}
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
                      Est. {settings.tahunBerdiri}
                    </span>
                    <h4 className="text-xl font-extrabold leading-tight">
                      {settings.pemilikNama}
                    </h4>
                    <p className="text-xs text-zinc-200">
                      {settings.pemilikJabatan} &bull; {settings.namaPerusahaan}
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
                        <span>Berdiri Tahun {settings.tahunBerdiri}</span>
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
                        &ldquo;{settings.pemilikKutipan}&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex items-end justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {settings.pemilikNama}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {settings.pemilikJabatan} {settings.namaPerusahaan} &bull; Est.{" "}
                        {settings.tahunBerdiri}
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
                {reviews.length === 0
                  ? "Ulasan pelanggan belum ditampilkan saat ini."
                  : folderOpen
                  ? "Folder terbuka — klik catatan melayang untuk membaca ulasan lengkap."
                  : "Klik folder untuk mengeluarkan komentar dan rating pelanggan."}
              </p>
            </div>

            <Badge variant="secondary" className="gap-1 text-[11px] shrink-0">
              <span>
                {reviews.length === 0
                  ? "Kosong"
                  : folderOpen
                  ? "Terbuka"
                  : "Klik Folder"}
              </span>
            </Badge>
          </div>

          {reviews.length > 0 ? (
            <>
              {/* Area Terbuka FolderFloat (Dibatasi agar tidak keluar wilayahnya) */}
              <div className="pt-[216px] pb-2 flex flex-col items-center justify-end overflow-hidden w-full">
                <FolderFloat
                  items={folderItems}
                  label="Ulasan Customer"
                  sublabel={`${reviews.length} komentar`}
                  trigger="click"
                  closeOnSelect={false}
                  physics
                  drift={0.45}
                  spread={260}
                  lift={42}
                  maxRise={204}
                  tilt={5}
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
              {activeReview && (
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
                        {safeReviewIdx + 1}/{reviews.length}
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
              )}
            </>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground border-t border-border">
              Belum ada komentar pelanggan yang dipilih untuk ditampilkan.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
