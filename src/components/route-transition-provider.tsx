"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { GooeyPreloader } from "@/components/ui/GooeyPreloader";

export interface RouteTransitionOptions {
  href: string;
  subtitle?: string;
  ariaLabel?: string;
  refresh?: boolean;
}

interface RouteTransitionContextValue {
  startRouteTransition: (options: RouteTransitionOptions) => void;
}

const RouteTransitionContext = React.createContext<RouteTransitionContextValue>({
  startRouteTransition: () => {},
});

export function useRouteTransition() {
  return React.useContext(RouteTransitionContext);
}

interface TransitionState {
  active: boolean;
  readyToReveal: boolean;
  targetPathname: string | null;
  subtitle: string;
  ariaLabel: string;
}

const INITIAL_STATE: TransitionState = {
  active: false,
  readyToReveal: false,
  targetPathname: null,
  subtitle: "",
  ariaLabel: "Memuat halaman GarageLog",
};

export function RouteTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = React.useState<TransitionState>(INITIAL_STATE);

  const startRouteTransition = React.useCallback(
    ({ href, subtitle, ariaLabel, refresh }: RouteTransitionOptions) => {
      const targetPathname = new URL(href, window.location.origin).pathname;

      setState({
        active: true,
        readyToReveal: false,
        targetPathname,
        subtitle: subtitle?.trim() ?? "",
        ariaLabel: ariaLabel?.trim() || "Memuat halaman GarageLog",
      });

      router.push(href);
      if (refresh) {
        router.refresh();
      }
    },
    [router]
  );

  // Tunggu halaman tujuan ter-render DAN gambar eager di viewport selesai dimuat
  React.useEffect(() => {
    if (!state.active || !state.targetPathname) return;

    let cancelled = false;
    let rafId = 0;
    const markReady = () => {
      if (!cancelled) {
        setState((prev) =>
          prev.active && !prev.readyToReveal
            ? { ...prev, readyToReveal: true }
            : prev
        );
      }
    };

    if (pathname === state.targetPathname) {
      rafId = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (cancelled) return;
          const pending = Array.from(document.images).filter(
            (img) => img.loading !== "lazy" && !img.complete
          );

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
    }

    const failsafeTimer = window.setTimeout(markReady, 2600);

    return () => {
      cancelled = true;
      if (rafId) window.cancelAnimationFrame(rafId);
      window.clearTimeout(failsafeTimer);
    };
  }, [state.active, state.targetPathname, pathname]);

  const handleComplete = React.useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const contextValue = React.useMemo(
    () => ({ startRouteTransition }),
    [startRouteTransition]
  );

  return (
    <RouteTransitionContext.Provider value={contextValue}>
      {children}
      <GooeyPreloader
        active={state.active}
        readyToReveal={state.readyToReveal}
        subtitle={state.subtitle}
        ariaLabel={state.ariaLabel}
        onComplete={handleComplete}
      />
    </RouteTransitionContext.Provider>
  );
}

