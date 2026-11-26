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
  subtitle?: string;
  orderCode?: string;
  ariaLabel?: string;
  onComplete?: () => void;
}

const BEAT_TARGETS = [25, 50, 75, 100] as const;

export function GooeyPreloader({
  active,
  readyToReveal,
  subtitle,
  orderCode,
  ariaLabel,
  onComplete,
}: GooeyPreloaderProps) {
  const rawId = useId();
  const safeId = rawId.replace(/:/g, "");
  const filterId = `gm-gooey-${safeId}`;
  const maskId = `gm-hole-mask-${safeId}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const backdropRectRef = useRef<SVGRectElement>(null);
  const discMaskCircleRef = useRef<SVGCircleElement>(null);
  const holeCircleRef = useRef<SVGCircleElement>(null);
  const blobsStageRef = useRef<HTMLDivElement>(null);
  const centerDiscRef = useRef<HTMLDivElement>(null);
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
  const revealTlRef = useRef<gsap.core.Timeline | null>(null);
  const onCompleteRef = useRef(onComplete);

  React.useEffect(() => {
    readyRef.current = readyToReveal;
  }, [readyToReveal]);

  React.useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  React.useEffect(() => {
    if (!active) {
      revealTlRef.current?.kill();
      revealTlRef.current = null;
    }
    return () => {
      revealTlRef.current?.kill();
      revealTlRef.current = null;
    };
  }, [active]);

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

    revealTlRef.current?.kill();
    const revealTl = gsap.timeline({
      onComplete: () => {
        revealTlRef.current = null;
        onCompleteRef.current?.();
      },
    });
    revealTlRef.current = revealTl;

    if (counterWrapRef.current) {
      revealTl.to(
        counterWrapRef.current,
        {
          opacity: 0,
          y: 12,
          duration: 0.2,
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
          duration: 0.2,
          ease: "power2.in",
        },
        0
      );
    }

    if (discMaskCircleRef.current) {
      revealTl.set(
        discMaskCircleRef.current,
        { opacity: 1, attr: { r: 72 } },
        0.06
      );
    }

    if (blobsStageRef.current) {
      revealTl.set(blobsStageRef.current, { opacity: 0 }, 0.06);
    }

    if (holeCircleRef.current) {
      revealTl.fromTo(
        holeCircleRef.current,
        { attr: { r: 0 } },
        {
          attr: { r: maxRadius },
          duration: 0.84,
          ease: "power4.inOut",
        },
        0.08
      );
    }

    if (discMaskCircleRef.current) {
      revealTl.fromTo(
        discMaskCircleRef.current,
        { attr: { r: 72 } },
        {
          attr: { r: maxRadius + 28 },
          duration: 0.84,
          ease: "power4.inOut",
        },
        0.08
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

      const edgePad = Math.max(20, Math.round(window.innerWidth * 0.03));
      let counterWidth = 132;
      if (counterWrapRef.current && counterValueRef.current) {
        counterValueRef.current.textContent = "100";
        counterWidth = Math.ceil(
          counterWrapRef.current.getBoundingClientRect().width
        );
        counterValueRef.current.textContent = "00";
      }
      const startX = edgePad;
      const endX = Math.max(
        startX,
        window.innerWidth - edgePad - counterWidth
      );

      if (counterValueRef.current) counterValueRef.current.textContent = "00";
      if (holeCircleRef.current) gsap.set(holeCircleRef.current, { attr: { r: 0 } });
      if (discMaskCircleRef.current) {
        gsap.set(discMaskCircleRef.current, { opacity: 0, attr: { r: 72 } });
      }
      if (backdropRectRef.current) gsap.set(backdropRectRef.current, { opacity: 1 });
      if (blobsStageRef.current) gsap.set(blobsStageRef.current, { opacity: 1 });
      if (logoRef.current) gsap.set(logoRef.current, { opacity: 0, scale: 0.86 });
      if (centerDiscRef.current) gsap.set(centerDiscRef.current, { scale: 0.45, opacity: 1 });
      if (counterWrapRef.current) {
        gsap.set(counterWrapRef.current, {
          opacity: 1,
          y: 0,
          x: startX,
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
        if (counterWrapRef.current) gsap.set(counterWrapRef.current, { x: endX });
        if (counterValueRef.current) counterValueRef.current.textContent = "100";
        gsap.delayedCall(0.45, () => {
          minBeatsDoneRef.current = true;
          tryStartReveal();
        });
        return;
      }

      const startCoords = [
        { x: -145, y: -105, scale: 0.9 },
        { x: 155, y: -85, scale: 1.0 },
        { x: -125, y: 110, scale: 0.85 },
        { x: 140, y: 105, scale: 0.95 },
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
      const beatDuration = 0.26;
      const firstBeatDelay = 0.16;
      const beatInterval = 0.28;

      // 4 beats: mulai dari 00% di ujung kiri layar hingga 100% di ujung kanan layar
      BEAT_TARGETS.forEach((targetVal, beatIdx) => {
        const beatTime = firstBeatDelay + beatIdx * beatInterval;
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
              scale: remain > 0.05 ? 0.95 : 0.65,
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
              scale: 0.45 + progress * 0.55,
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
              x: startX + (endX - startX) * progress,
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

      // Logo muncul pada cakram tengah begitu 4 ketukan melebur ke tengah
      if (logoRef.current) {
        introTl.to(
          logoRef.current,
          {
            opacity: 1,
            scale: 1,
            duration: 0.3,
            ease: "power3.out",
          },
          1.12
        );
      }

      introTl.call(
        () => {
          minBeatsDoneRef.current = true;
          tryStartReveal();
        },
        undefined,
        1.72
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
      aria-label={ariaLabel || "Memuat halaman GarageLog"}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden select-none"
    >
      {/* SVG Backdrop & Cakram Portal Membuka ke Halaman Tujuan */}
      <svg
        className="absolute inset-0 z-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      >
        <defs>
          <filter
            id={filterId}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
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
        <g mask={`url(#${maskId})`}>
          <rect
            ref={backdropRectRef}
            width="100%"
            height="100%"
            className="fill-background"
          />
          <circle
            ref={discMaskCircleRef}
            cx="50%"
            cy="50%"
            r="72"
            opacity="0"
            className="fill-primary"
          />
        </g>
      </svg>

      {/* Stage Gooey Blobs -> Melted Center Disc */}
      <div
        ref={blobsStageRef}
        aria-hidden="true"
        className="relative z-10 flex items-center justify-center w-96 h-96 pointer-events-none"
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
          className="relative size-36 rounded-full bg-primary"
        />
      </div>

      {/* Logo GarageLog & Subjudul di Tengah Cakram */}
      <div
        ref={logoRef}
        className="pointer-events-none absolute z-20 flex flex-col items-center justify-center text-primary-foreground text-center px-4"
      >
        <div className="size-10 rounded-xl bg-background/15 border border-primary-foreground/25 flex items-center justify-center mb-1.5">
          <Wrench className="size-5" aria-hidden="true" />
        </div>
        <span className="font-extrabold text-sm tracking-tight leading-none">
          GarageLog
        </span>
        {(subtitle ?? orderCode) && (
          <span className="mt-1 font-mono text-[10px] font-semibold tracking-wider opacity-90 max-w-[126px] truncate">
            {subtitle ?? orderCode}
          </span>
        )}
      </div>

      {/* Counter Melangkah dari Ujung Kiri ke Ujung Kanan dalam 4 Ketukan */}
      <div
        ref={counterWrapRef}
        className="pointer-events-none fixed bottom-14 sm:bottom-16 left-0 z-20 flex items-baseline gap-1 text-foreground"
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
