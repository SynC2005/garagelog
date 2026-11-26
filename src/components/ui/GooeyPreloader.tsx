"use client";

import * as React from "react";
import { useId, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Wrench } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

export interface GooeyPreloaderProps {
  active: boolean;
  readyToReveal: boolean;
  orderCode?: string;
  onComplete?: () => void;
}

const BEAT_TARGETS = [25, 50, 75, 100] as const;

export function GooeyPreloader({
  active,
  readyToReveal,
  orderCode,
  onComplete,
}: GooeyPreloaderProps) {
  const rawId = useId();
  const safeId = rawId.replace(/:/g, "");
  const filterId = `gm-gooey-${safeId}`;
  const maskId = `gm-hole-mask-${safeId}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const backdropRectRef = useRef<SVGRectElement>(null);
  const holeCircleRef = useRef<SVGCircleElement>(null);
  const blobsStageRef = useRef<HTMLDivElement>(null);
  const centerDiscRef = useRef<HTMLDivElement>(null);
  const rimRingRef = useRef<HTMLDivElement>(null);
  const blob0Ref = useRef<HTMLDivElement>(null);
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const blob3Ref = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const counterWrapRef = useRef<HTMLDivElement>(null);
  const counterValueRef = useRef<HTMLSpanElement>(null);

  const readyRef = useRef(readyToReveal);
  const minBeatsDoneRef = useRef(false);
  const revealedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  React.useEffect(() => {
    readyRef.current = readyToReveal;
  }, [readyToReveal]);

  React.useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const tryStartReveal = React.useCallback(() => {
    if (!active || revealedRef.current) return;
    if (!minBeatsDoneRef.current || !readyRef.current) return;

    revealedRef.current = true;
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const maxRadius =
      Math.hypot(window.innerWidth, window.innerHeight) / 2 + 64;

    if (reduce) {
      if (containerRef.current) {
        gsap.to(containerRef.current, {
          opacity: 0,
          duration: 0.25,
          ease: "power2.out",
          onComplete: () => onCompleteRef.current?.(),
        });
      } else {
        onCompleteRef.current?.();
      }
      return;
    }

    const revealTl = gsap.timeline({
      onComplete: () => {
        onCompleteRef.current?.();
      },
    });

    if (counterWrapRef.current) {
      revealTl.to(
        counterWrapRef.current,
        {
          opacity: 0,
          y: 14,
          duration: 0.22,
          ease: "power2.in",
        },
        0
      );
    }

    if (logoRef.current) {
      revealTl.to(
        logoRef.current,
        {
          opacity: 0,
          scale: 0.9,
          duration: 0.24,
          ease: "power2.in",
        },
        0
      );
    }

    if (blobsStageRef.current) {
      revealTl.set(
        [
          blob0Ref.current,
          blob1Ref.current,
          blob2Ref.current,
          blob3Ref.current,
        ].filter(Boolean),
        { opacity: 0 },
        0.1
      );
    }

    if (centerDiscRef.current) {
      revealTl.to(
        centerDiscRef.current,
        {
          scale: 1.15,
          opacity: 0,
          duration: 0.28,
          ease: "power2.out",
        },
        0.1
      );
    }

    if (holeCircleRef.current) {
      revealTl.fromTo(
        holeCircleRef.current,
        { attr: { r: 64 } },
        {
          attr: { r: maxRadius },
          duration: 0.78,
          ease: "power4.inOut",
        },
        0.14
      );
    }

    if (rimRingRef.current) {
      const targetScale = Math.max(8, (maxRadius * 2) / 140);
      revealTl.fromTo(
        rimRingRef.current,
        { scale: 1, opacity: 0.9 },
        {
          scale: targetScale,
          opacity: 0,
          duration: 0.78,
          ease: "power4.inOut",
        },
        0.14
      );
    }
  }, [active]);

  useGSAP(
    () => {
      if (!active) return;

      minBeatsDoneRef.current = false;
      revealedRef.current = false;

      const reduce =
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

      const counterSpan = Math.min(220, Math.round(window.innerWidth * 0.26));

      if (counterValueRef.current) counterValueRef.current.textContent = "00";
      if (holeCircleRef.current) gsap.set(holeCircleRef.current, { attr: { r: 0 } });
      if (backdropRectRef.current) gsap.set(backdropRectRef.current, { opacity: 1 });
      if (rimRingRef.current) gsap.set(rimRingRef.current, { scale: 0.9, opacity: 0 });
      if (logoRef.current) gsap.set(logoRef.current, { opacity: 0, scale: 0.84 });
      if (centerDiscRef.current) gsap.set(centerDiscRef.current, { scale: 0.45, opacity: 1 });
      if (counterWrapRef.current) {
        gsap.set(counterWrapRef.current, {
          opacity: 1,
          y: 0,
          xPercent: -50,
          x: -counterSpan,
        });
      }

      const blobs = [
        blob0Ref.current,
        blob1Ref.current,
        blob2Ref.current,
        blob3Ref.current,
      ];

      if (reduce) {
        if (centerDiscRef.current) gsap.set(centerDiscRef.current, { scale: 1 });
        if (logoRef.current) gsap.set(logoRef.current, { opacity: 1, scale: 1 });
        if (counterValueRef.current) counterValueRef.current.textContent = "100";
        gsap.delayedCall(0.45, () => {
          minBeatsDoneRef.current = true;
          tryStartReveal();
        });
        return;
      }

      const startCoords = [
        { x: -130, y: -90, scale: 0.85 },
        { x: 140, y: -70, scale: 0.95 },
        { x: -115, y: 95, scale: 0.8 },
        { x: 120, y: 95, scale: 0.9 },
      ];

      blobs.forEach((blob, idx) => {
        if (!blob) return;
        const pos = startCoords[idx];
        gsap.set(blob, {
          x: pos.x,
          y: pos.y,
          scale: pos.scale,
          opacity: 1,
          rotation: idx * 90,
        });
      });

      const introTl = gsap.timeline();
      const beatDuration = 0.28;

      // 4 beats: blobs swirl into central melted disc while counter steps to 100 across screen
      BEAT_TARGETS.forEach((targetVal, beatIdx) => {
        const beatTime = beatIdx * 0.3;
        const progress = (beatIdx + 1) / BEAT_TARGETS.length;
        const remain = 1 - progress;
        const angleOffset = progress * Math.PI * 1.15;

        blobs.forEach((blob, idx) => {
          if (!blob) return;
          const pos = startCoords[idx];
          const cos = Math.cos(angleOffset);
          const sin = Math.sin(angleOffset);
          const nextX = (pos.x * cos - pos.y * sin) * remain;
          const nextY = (pos.x * sin + pos.y * cos) * remain;

          introTl.to(
            blob,
            {
              x: nextX,
              y: nextY,
              scale: remain > 0.05 ? 0.95 : 0.7,
              duration: beatDuration,
              ease: "power2.inOut",
            },
            beatTime
          );
        });

        if (centerDiscRef.current) {
          introTl.to(
            centerDiscRef.current,
            {
              scale: 0.55 + progress * 0.45,
              duration: beatDuration,
              ease: "power2.out",
            },
            beatTime
          );
        }

        if (counterWrapRef.current) {
          introTl.to(
            counterWrapRef.current,
            {
              x: -counterSpan + progress * counterSpan * 2,
              duration: beatDuration,
              ease: "power3.out",
              onStart: () => {
                if (counterValueRef.current) {
                  counterValueRef.current.textContent = String(targetVal).padStart(
                    2,
                    "0"
                  );
                }
              },
            },
            beatTime
          );
        }
      });

      // Logo fades in onto the central melted disc after the 4 beats
      if (logoRef.current) {
        introTl.to(
          logoRef.current,
          {
            opacity: 1,
            scale: 1,
            duration: 0.32,
            ease: "power3.out",
          },
          1.15
        );
      }

      introTl.call(
        () => {
          minBeatsDoneRef.current = true;
          tryStartReveal();
        },
        undefined,
        1.48
      );
    },
    { scope: containerRef, dependencies: [active] }
  );

  React.useEffect(() => {
    if (active && readyToReveal) {
      tryStartReveal();
    }
  }, [active, readyToReveal, tryStartReveal]);

  if (!active) return null;

  return (
    <div
      ref={containerRef}
      role="status"
      aria-live="polite"
      aria-label="Memuat halaman pelacakan pesanan"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden select-none"
    >
      {/* SVG Backdrop dengan Lubang Lingkaran Membuka ke Halaman Pelacakan */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      >
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white" />
            <circle ref={holeCircleRef} cx="50%" cy="50%" r="0" fill="black" />
          </mask>
        </defs>
        <rect
          ref={backdropRectRef}
          width="100%"
          height="100%"
          className="fill-background"
          mask={`url(#${maskId})`}
        />
      </svg>

      {/* Ring Ekspansi Portal saat Disc Membuka */}
      <div
        ref={rimRingRef}
        aria-hidden="true"
        className="pointer-events-none absolute size-[140px] rounded-full border-2 border-primary/80"
      />

      {/* Stage Gooey Blobs -> Melted Center Disc */}
      <div
        ref={blobsStageRef}
        aria-hidden="true"
        className="relative flex items-center justify-center w-80 h-80 pointer-events-none"
        style={{ filter: `url(#${filterId})` }}
      >
        <div
          ref={blob0Ref}
          className="absolute size-20 rounded-full bg-primary"
        />
        <div
          ref={blob1Ref}
          className="absolute size-16 rounded-full bg-primary"
        />
        <div
          ref={blob2Ref}
          className="absolute size-18 rounded-full bg-primary"
        />
        <div
          ref={blob3Ref}
          className="absolute size-14 rounded-full bg-primary"
        />
        <div
          ref={centerDiscRef}
          className="relative size-36 rounded-full bg-primary shadow-lg"
        />
      </div>

      {/* Logo GarageLog & Kode Pesanan di Tengah Disc */}
      <div
        ref={logoRef}
        className="pointer-events-none absolute flex flex-col items-center justify-center text-primary-foreground text-center px-4"
      >
        <div className="size-10 rounded-xl bg-background/15 border border-primary-foreground/25 flex items-center justify-center mb-1.5">
          <Wrench className="size-5" aria-hidden="true" />
        </div>
        <span className="font-extrabold text-sm tracking-tight leading-none">
          GarageLog
        </span>
        {orderCode && (
          <span className="mt-1 font-mono text-[10px] font-semibold tracking-wider opacity-90">
            {orderCode}
          </span>
        )}
      </div>

      {/* Counter Melangkah ke 100 dalam 4 Ketukan */}
      <div
        ref={counterWrapRef}
        className="pointer-events-none absolute bottom-12 sm:bottom-16 left-1/2 flex items-baseline gap-1 text-foreground"
      >
        <span
          ref={counterValueRef}
          className="font-mono text-5xl sm:text-6xl font-black tracking-tighter tabular-nums"
        >
          00
        </span>
        <span className="font-mono text-lg font-bold text-primary">%</span>
      </div>
    </div>
  );
}

export default GooeyPreloader;
