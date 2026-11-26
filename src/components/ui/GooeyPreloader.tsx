"use client";

import * as React from "react";
import { useId, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Wrench } from "lucide-react";
import { useBrand } from "@/components/brand-provider";

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

interface LiquidDropletSpec {
  startAngle: number;
  startRadius: number;
  turns: number;
  baseR: number;
  delayFrac: number;
  stretchGain: number;
}

const BEAT_TARGETS = [25, 50, 75, 100] as const;

const LIQUID_DROPLETS: readonly LiquidDropletSpec[] = [
  { startAngle: -2.4, startRadius: 148, turns: 0.92, baseR: 25, delayFrac: 0.0, stretchGain: 0.42 },
  { startAngle: -0.45, startRadius: 156, turns: 0.88, baseR: 23, delayFrac: 0.05, stretchGain: 0.45 },
  { startAngle: 0.85, startRadius: 144, turns: 0.95, baseR: 21, delayFrac: 0.08, stretchGain: 0.38 },
  { startAngle: 2.25, startRadius: 152, turns: 0.9, baseR: 24, delayFrac: 0.03, stretchGain: 0.4 },
  { startAngle: -1.5, startRadius: 122, turns: 1.05, baseR: 15, delayFrac: 0.14, stretchGain: 0.55 },
  { startAngle: 0.2, startRadius: 132, turns: 1.02, baseR: 13, delayFrac: 0.18, stretchGain: 0.52 },
  { startAngle: 1.65, startRadius: 126, turns: 1.08, baseR: 14, delayFrac: 0.2, stretchGain: 0.54 },
  { startAngle: 2.95, startRadius: 136, turns: 0.98, baseR: 12, delayFrac: 0.22, stretchGain: 0.5 },
  { startAngle: -2.8, startRadius: 108, turns: 1.15, baseR: 16, delayFrac: 0.1, stretchGain: 0.48 },
];

// Geometri piston dalam koordinat SVG 360x360 (pusat 180, 180)
const PISTON_BODY_PATH = [
  "M 112 104",
  "Q 180 78 248 104",
  "L 254 112",
  "L 254 164",
  "L 248 171",
  "L 248 205",
  "L 254 212",
  "L 254 260",
  "Q 254 274 240 274",
  "L 220 274",
  "Q 180 242 140 274",
  "L 120 274",
  "Q 106 274 106 260",
  "L 106 212",
  "L 112 205",
  "L 112 171",
  "L 106 164",
  "L 106 112",
  "Z",
].join(" ");

export function GooeyPreloader({
  active,
  readyToReveal,
  subtitle,
  orderCode,
  ariaLabel,
  onComplete,
}: GooeyPreloaderProps) {
  const brand = useBrand();
  const rawId = useId();
  const safeId = rawId.replace(/:/g, "");
  const filterId = `gm-gooey-${safeId}`;
  const maskId = `gm-hole-mask-${safeId}`;
  const pistonCutMaskId = `gm-piston-cut-${safeId}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const backdropRectRef = useRef<SVGRectElement>(null);
  const holeCircleRef = useRef<SVGCircleElement>(null);

  const liquidGroupRef = useRef<SVGGElement>(null);
  const poolCoreRef = useRef<SVGCircleElement>(null);
  const moldCrownRef = useRef<SVGRectElement>(null);
  const moldSkirtRef = useRef<SVGRectElement>(null);
  const dropletRefs = useRef<(SVGEllipseElement | null)[]>([]);

  const pistonCrispRef = useRef<SVGGElement>(null);
  const pistonHoleRef = useRef<SVGCircleElement>(null);

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

    if (liquidGroupRef.current) {
      revealTl.set(liquidGroupRef.current, { opacity: 0 }, 0.04);
    }

    // Piston membesar keluar sembari pusat piston & layar membuka ke halaman tujuan
    if (pistonHoleRef.current) {
      revealTl.fromTo(
        pistonHoleRef.current,
        { attr: { r: 0 } },
        {
          attr: { r: 210 },
          duration: 0.86,
          ease: "power4.inOut",
        },
        0.06
      );
    }

    if (pistonCrispRef.current) {
      revealTl.to(
        pistonCrispRef.current,
        {
          scale: 5.5,
          svgOrigin: "180 180",
          duration: 0.86,
          ease: "power4.inOut",
        },
        0.06
      );
      revealTl.to(
        pistonCrispRef.current,
        {
          opacity: 0,
          duration: 0.35,
          ease: "power2.in",
        },
        0.48
      );
    }

    if (holeCircleRef.current) {
      revealTl.fromTo(
        holeCircleRef.current,
        { attr: { r: 0 } },
        {
          attr: { r: maxRadius },
          duration: 0.86,
          ease: "power4.inOut",
        },
        0.06
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
      if (pistonHoleRef.current) gsap.set(pistonHoleRef.current, { attr: { r: 0 } });
      if (backdropRectRef.current) gsap.set(backdropRectRef.current, { opacity: 1 });
      if (logoRef.current) gsap.set(logoRef.current, { opacity: 0, scale: 0.86 });
      if (counterWrapRef.current) {
        gsap.set(counterWrapRef.current, {
          opacity: 1,
          y: 0,
          x: startX,
        });
      }

      if (reduce) {
        if (liquidGroupRef.current) gsap.set(liquidGroupRef.current, { opacity: 0 });
        if (pistonCrispRef.current) {
          gsap.set(pistonCrispRef.current, {
            opacity: 1,
            scale: 1,
            svgOrigin: "180 180",
          });
        }
        if (logoRef.current) gsap.set(logoRef.current, { opacity: 1, scale: 1 });
        if (counterWrapRef.current) gsap.set(counterWrapRef.current, { x: endX });
        if (counterValueRef.current) counterValueRef.current.textContent = "100";
        gsap.delayedCall(0.45, () => {
          minBeatsDoneRef.current = true;
          tryStartReveal();
        });
        return;
      }

      if (liquidGroupRef.current) gsap.set(liquidGroupRef.current, { opacity: 1 });
      if (poolCoreRef.current) gsap.set(poolCoreRef.current, { attr: { r: 16 } });
      if (moldCrownRef.current) {
        gsap.set(moldCrownRef.current, {
          opacity: 0,
          scaleY: 0.35,
          scaleX: 0.65,
          svgOrigin: "180 180",
        });
      }
      if (moldSkirtRef.current) {
        gsap.set(moldSkirtRef.current, {
          opacity: 0,
          scaleY: 0.35,
          scaleX: 0.65,
          svgOrigin: "180 180",
        });
      }
      if (pistonCrispRef.current) {
        gsap.set(pistonCrispRef.current, {
          opacity: 0,
          scale: 0.94,
          svgOrigin: "180 180",
        });
      }

      const updateLiquidField = (globalProgress: number) => {
        const p = Math.min(1, Math.max(0, globalProgress));

        LIQUID_DROPLETS.forEach((drop, idx) => {
          const el = dropletRefs.current[idx];
          if (!el) return;

          const local = Math.min(
            1,
            Math.max(0, (p - drop.delayFrac) / (1 - drop.delayFrac))
          );
          // Curva akselerasi cairan menyatu ke pusat
          const eased =
            local < 0.5
              ? 2 * local * local
              : 1 - Math.pow(-2 * local + 2, 2) / 2;

          const radial = drop.startRadius * Math.pow(1 - eased, 1.28);
          const angle = drop.startAngle + drop.turns * Math.PI * 2 * eased;
          const cx = 180 + Math.cos(angle) * radial;
          const cy = 180 + Math.sin(angle) * radial;

          // Konservasi luas: memanjang mengikuti arus spiral lalu membulat saat menyatu
          const stretch = Math.sin(local * Math.PI) * drop.stretchGain;
          const fadeR = local > 0.88 ? Math.max(2, drop.baseR * (1 - (local - 0.88) / 0.14)) : drop.baseR;
          const rx = fadeR * (1 + stretch);
          const ry = fadeR / (1 + stretch * 0.72);
          const tangentDeg = ((angle + Math.PI * 0.5) * 180) / Math.PI;

          el.setAttribute("cx", cx.toFixed(2));
          el.setAttribute("cy", cy.toFixed(2));
          el.setAttribute("rx", rx.toFixed(2));
          el.setAttribute("ry", ry.toFixed(2));
          el.setAttribute(
            "transform",
            `rotate(${tangentDeg.toFixed(1)} ${cx.toFixed(2)} ${cy.toFixed(2)})`
          );
        });

        if (poolCoreRef.current) {
          const coreR = 16 + Math.pow(p, 0.85) * 44 + Math.sin(p * Math.PI * 3) * 3 * (1 - p);
          poolCoreRef.current.setAttribute("r", coreR.toFixed(2));
        }
      };

      updateLiquidField(0);

      const introTl = gsap.timeline();
      const liquidTracker = { progress: 0 };

      // Fase cairan spiral menyatu mulus menuju pusat
      introTl.to(
        liquidTracker,
        {
          progress: 1,
          duration: 1.24,
          ease: "none",
          onUpdate: () => updateLiquidField(liquidTracker.progress),
        },
        0
      );

      // Saat cairan terkumpul, cetakan cair mengalir membentuk siluet piston
      if (moldCrownRef.current && moldSkirtRef.current) {
        introTl.to(
          [moldCrownRef.current, moldSkirtRef.current],
          {
            opacity: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 0.44,
            ease: "power3.out",
          },
          0.84
        );
      }

      // Cross-fade mulus dari leburan cair menjadi piston bengkel presisi
      if (pistonCrispRef.current) {
        introTl.to(
          pistonCrispRef.current,
          {
            opacity: 1,
            scale: 1,
            duration: 0.34,
            ease: "power3.out",
          },
          1.12
        );
      }

      if (liquidGroupRef.current) {
        introTl.to(
          liquidGroupRef.current,
          {
            opacity: 0,
            duration: 0.24,
            ease: "power2.out",
          },
          1.28
        );
      }

      // Counter tetap melangkah dalam 4 ketukan tegas dari ujung kiri ke ujung kanan layar
      const beatDuration = 0.26;
      const firstBeatDelay = 0.16;
      const beatInterval = 0.28;

      BEAT_TARGETS.forEach((targetVal, beatIdx) => {
        const beatTime = firstBeatDelay + beatIdx * beatInterval;
        const progress = (beatIdx + 1) / BEAT_TARGETS.length;

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

      // Logo GarageLog muncul di badan piston yang sudah terbentuk
      if (logoRef.current) {
        introTl.to(
          logoRef.current,
          {
            opacity: 1,
            scale: 1,
            duration: 0.3,
            ease: "power3.out",
          },
          1.22
        );
      }

      introTl.call(
        () => {
          minBeatsDoneRef.current = true;
          tryStartReveal();
        },
        undefined,
        1.82
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
      {/* SVG Backdrop Layar Penuh dengan Lubang Portal Membuka ke Halaman Tujuan */}
      <svg
        className="absolute inset-0 z-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      >
        <defs>
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

      {/* Stage Cairan Metaball -> Bentuk Akhir Piston Bengkel */}
      <svg
        viewBox="0 0 360 360"
        aria-hidden="true"
        className="relative z-10 w-[340px] h-[340px] sm:w-[360px] sm:h-[360px] overflow-visible pointer-events-none"
      >
        <defs>
          {/* Gooey fluid tanpa feBlend agar jembatan cairan antar-tetesan menyatu mulus */}
          <filter
            id={filterId}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="11" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10"
            />
          </filter>

          {/* Mask lubang ring piston, lengkung bawah skirt, & bukaan portal */}
          <mask id={pistonCutMaskId}>
            <rect width="360" height="360" fill="white" />
            {/* Tiga alur cincin kompresi & oli di kepala piston */}
            <rect x="102" y="113" width="156" height="4" rx="1.5" fill="black" />
            <rect x="102" y="122" width="156" height="4" rx="1.5" fill="black" />
            <rect x="102" y="131" width="156" height="4" rx="1.5" fill="black" />
            {/* Celah bukaan lubang pusat saat piston membuka halaman tujuan */}
            <circle ref={pistonHoleRef} cx="180" cy="180" r="0" fill="black" />
          </mask>
        </defs>

        {/* Grup Cairan Metaball */}
        <g ref={liquidGroupRef} filter={`url(#${filterId})`}>
          {LIQUID_DROPLETS.map((_, idx) => (
            <ellipse
              key={idx}
              ref={(el) => {
                dropletRefs.current[idx] = el;
              }}
              cx="180"
              cy="180"
              rx="16"
              ry="16"
              className="fill-primary"
            />
          ))}
          <circle
            ref={poolCoreRef}
            cx="180"
            cy="180"
            r="16"
            className="fill-primary"
          />
          <rect
            ref={moldCrownRef}
            x="108"
            y="98"
            width="144"
            height="62"
            rx="22"
            className="fill-primary"
          />
          <rect
            ref={moldSkirtRef}
            x="108"
            y="148"
            width="144"
            height="120"
            rx="22"
            className="fill-primary"
          />
        </g>

        {/* Siluet Piston Presisi (Crown + Ring Piston + Pin Notch + Skirt Arch) */}
        <g ref={pistonCrispRef} mask={`url(#${pistonCutMaskId})`}>
          <path d={PISTON_BODY_PATH} className="fill-primary" />
        </g>
      </svg>

      {/* Logo Perusahaan & Subjudul di Tengah Badan Piston */}
      <div
        ref={logoRef}
        className="pointer-events-none absolute z-20 flex flex-col items-center justify-center text-primary-foreground text-center px-4"
      >
        <div className="size-9 rounded-xl bg-background/15 border border-primary-foreground/25 flex items-center justify-center mb-1 overflow-hidden">
          {brand.logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={brand.logoUrl}
              alt=""
              className="w-full h-full object-contain p-0.5"
            />
          ) : (
            <Wrench className="size-4" aria-hidden="true" />
          )}
        </div>
        <span className="font-extrabold text-sm tracking-tight leading-none max-w-[122px] truncate">
          {brand.namaPerusahaan}
        </span>
        {(subtitle ?? orderCode) && (
          <span className="mt-1 font-mono text-[10px] font-semibold tracking-wider opacity-90 max-w-[122px] truncate">
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
