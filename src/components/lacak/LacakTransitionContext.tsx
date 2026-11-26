"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { GooeyPreloader } from "@/components/ui/GooeyPreloader";

interface LacakTransitionContextValue {
  startTrackingTransition: (kode: string) => void;
}

const LacakTransitionContext = React.createContext<LacakTransitionContextValue>({
  startTrackingTransition: () => {},
});

export function useLacakTransition() {
  return React.useContext(LacakTransitionContext);
}

interface TransitionState {
  active: boolean;
  readyToReveal: boolean;
  targetPath: string | null;
  orderCode: string;
}

export function LacakTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = React.useState<TransitionState>({
    active: false,
    readyToReveal: false,
    targetPath: null,
    orderCode: "",
  });

  const startTrackingTransition = React.useCallback(
    (kode: string) => {
      const cleanCode = kode.trim().toUpperCase();
      const nextPath = `/lacak/${cleanCode}`;

      setState({
        active: true,
        readyToReveal: false,
        targetPath: nextPath,
        orderCode: cleanCode,
      });

      router.push(nextPath);
    },
    [router]
  );

  // Tunggu halaman tujuan ter-render DAN seluruh gambar di dalamnya selesai dimuat
  React.useEffect(() => {
    if (!state.active || !state.targetPath) return;
    if (pathname !== state.targetPath) return;

    let cancelled = false;
    const markReady = () => {
      if (!cancelled) {
        setState((prev) =>
          prev.active && !prev.readyToReveal
            ? { ...prev, readyToReveal: true }
            : prev
        );
      }
    };

    const rafId = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (cancelled) return;
        const images = Array.from(
          document.querySelectorAll<HTMLImageElement>("main img")
        );
        const pending = images.filter((img) => !img.complete);

        if (pending.length === 0) {
          markReady();
          return;
        }

        let remaining = pending.length;
        const settleOne = () => {
          remaining -= 1;
          if (remaining <= 0) {
            markReady();
          }
        };

        pending.forEach((img) => {
          img.addEventListener("load", settleOne, { once: true });
          img.addEventListener("error", settleOne, { once: true });
        });
      });
    });

    const failsafeTimer = window.setTimeout(markReady, 2600);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(failsafeTimer);
    };
  }, [state.active, state.targetPath, pathname]);

  const handleComplete = React.useCallback(() => {
    setState({
      active: false,
      readyToReveal: false,
      targetPath: null,
      orderCode: "",
    });
  }, []);

  const contextValue = React.useMemo(
    () => ({ startTrackingTransition }),
    [startTrackingTransition]
  );

  return (
    <LacakTransitionContext.Provider value={contextValue}>
      {children}
      <GooeyPreloader
        active={state.active}
        readyToReveal={state.readyToReveal}
        orderCode={state.orderCode}
        onComplete={handleComplete}
      />
    </LacakTransitionContext.Provider>
  );
}

