"use client";

import {
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Matter from "matter-js";

import "./FolderFloat.css";

const { Bodies, Body, Composite, Engine } = Matter;

export type FolderFloatTrigger = "hover" | "click";

export type FolderFloatItem =
  | string
  | {
      label: string;
      value: string;
    };

export interface FolderFloatProps {
  items?: FolderFloatItem[];
  label?: string;
  sublabel?: string;
  trigger?: FolderFloatTrigger;
  defaultOpen?: boolean;
  closeOnSelect?: boolean;
  physics?: boolean;
  drift?: number;
  onSelect?: (value: string, index: number) => void;
  onOpenChange?: (open: boolean) => void;
  folderColor?: string;
  frontColor?: string;
  paperColor?: string;
  itemColor?: string;
  itemTextColor?: string;
  labelColor?: string;
  width?: number;
  height?: number;
  radius?: number;
  spread?: number;
  lift?: number;
  tilt?: number;
  flapAngle?: number;
  restAngle?: number;
  openDuration?: number;
  stagger?: number;
  bounce?: number;
  className?: string;
}

interface PillSize {
  w: number;
  h: number;
}

interface PillPosition {
  x: number;
  y: number;
  r: number;
}

interface PhysicsWorldState {
  engine: Matter.Engine | null;
  bodies: Matter.Body[];
  phases: number[];
  sizes: PillSize[];
  raf: number;
  last: number;
  t0: number;
  drag: {
    i: number;
    id: number;
    dx: number;
    dy: number;
    sx: number;
    sy: number;
    moved: boolean;
  } | null;
  zone: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  } | null;
  live: boolean;
}

type FolderFloatCSSVars = CSSProperties &
  Record<`--ff-${string}`, string | number | undefined>;

const DEFAULT_ITEMS: FolderFloatItem[] = [
  "Try a warmer palette",
  "Tighten the spacing",
  "Logo feels small",
  "Love the new hero",
];

const PAD = 28;
const CHAR = 6.8;
const GAP = 12;
const ROW = 52;
const DRAG_MIN = 4;
const ZONE_PAD = 8;

const jitter = (i: number) => {
  const x = Math.sin(i * 12.9898 + 4.1414) * 43758.5453;
  return x - Math.floor(x);
};

const computeLayout = (
  list: { label: string; value: string }[],
  spread: number,
  lift: number,
  tilt: number,
  sizes: PillSize[]
): PillPosition[] => {
  const rows: { items: { i: number; pw: number }[]; width: number }[] = [];
  let row: { i: number; pw: number }[] = [];
  let width = 0;

  list.forEach((item, i) => {
    const pw = sizes[i]?.w ?? PAD + item.label.length * CHAR;
    if (row.length && width + GAP + pw > spread * 2) {
      rows.push({ items: row, width });
      row = [];
      width = 0;
    }
    row.push({ i, pw });
    width += (row.length > 1 ? GAP : 0) + pw;
  });
  if (row.length) rows.push({ items: row, width });

  const pos: PillPosition[] = [];
  rows.forEach((r, ri) => {
    let x = -r.width / 2;
    const shift = (ri % 2 ? 1 : -1) * Math.min(16, spread * 0.1);
    r.items.forEach(({ i, pw }) => {
      const j = jitter(i);
      pos[i] = {
        x: x + pw / 2 + shift + (j - 0.5) * 6,
        y: -lift - ri * ROW - j * 6,
        r: tilt * (j * 2 - 1),
      };
      x += pw + GAP;
    });
  });

  return pos;
};

export function FolderFloat({
  items = DEFAULT_ITEMS,
  label = "Design feedback",
  sublabel = "",
  trigger = "hover",
  defaultOpen = false,
  closeOnSelect = true,
  physics = true,
  drift = 0.5,
  onSelect,
  onOpenChange,
  folderColor = "#3f3f46",
  frontColor = "#52525b",
  paperColor = "#f5f5f5",
  itemColor = "#f5f5f5",
  itemTextColor = "#18181b",
  labelColor = "#f5f5f5",
  width = 200,
  height = 148,
  radius = 14,
  spread = 180,
  lift = 26,
  tilt = 8,
  flapAngle = 34,
  restAngle = 16,
  openDuration = 520,
  stagger = 45,
  bounce = 0.3,
  className = "",
}: FolderFloatProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [popped, setPopped] = useState(-1);
  const [live, setLive] = useState(false);
  const [sizes, setSizes] = useState<PillSize[]>([]);
  const anchorRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const world = useRef<PhysicsWorldState>({
    engine: null,
    bodies: [],
    phases: [],
    sizes: [],
    raf: 0,
    last: 0,
    t0: 0,
    drag: null,
    zone: null,
    live: false,
  });

  const latest = useRef<{
    onSelect?: (value: string, index: number) => void;
    onOpenChange?: (open: boolean) => void;
    drift: number;
    reduce: boolean;
  }>({
    onSelect,
    onOpenChange,
    drift,
    reduce: false,
  });

  useEffect(() => {
    latest.current.onSelect = onSelect;
    latest.current.onOpenChange = onOpenChange;
    latest.current.drift = drift;
  }, [onSelect, onOpenChange, drift]);

  const popTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const liveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const list = useMemo(
    () =>
      items.map((item) =>
        typeof item === "string" ? { label: item, value: item } : item
      ),
    [items]
  );
  const n = list.length;
  const sub = sublabel || `${n} ${n === 1 ? "note" : "notes"}`;
  const pos = useMemo(
    () => computeLayout(list, spread, lift, tilt, sizes),
    [list, spread, lift, tilt, sizes]
  );

  const labelsKey = list.map((item) => item.label).join("|");
  useLayoutEffect(() => {
    const measure = () => {
      const next: PillSize[] = [];
      for (let i = 0; i < n; i++) {
        const el = pillRefs.current[i];
        if (!el) return;
        next.push({ w: el.offsetWidth, h: el.offsetHeight });
      }
      setSizes((prev) =>
        prev.length === next.length &&
        prev.every((s, i) => s.w === next[i].w && s.h === next[i].h)
          ? prev
          : next
      );
    };
    measure();
    document.fonts?.ready.then(measure);
  }, [n, labelsKey]);

  const stopPhysics = useCallback(() => {
    const w = world.current;
    if (liveTimer.current) clearTimeout(liveTimer.current);
    cancelAnimationFrame(w.raf);
    w.raf = 0;
    if (w.engine) {
      w.bodies.forEach((b, i) => {
        const el = pillRefs.current[i];
        const size = w.sizes[i];
        if (!el || !size) return;
        el.style.setProperty("--x", `${b.position.x.toFixed(1)}px`);
        el.style.setProperty(
          "--y",
          `${(b.position.y - size.h / 2).toFixed(1)}px`
        );
      });
      Composite.clear(w.engine.world, false, true);
      Engine.clear(w.engine);
      w.engine = null;
    }
    w.bodies = [];
    w.phases = [];
    w.drag = null;
    w.live = false;
    setLive(false);
  }, []);

  const posKey = pos.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("|");

  const startPhysics = useCallback(() => {
    const w = world.current;
    if (w.engine) return;
    const els: HTMLButtonElement[] = [];
    for (let i = 0; i < n; i++) {
      const el = pillRefs.current[i];
      if (!el) return;
      els.push(el);
    }

    const engine = Engine.create({ gravity: { x: 0, y: 0 } });
    engine.enableSleeping = false;
    w.engine = engine;
    w.sizes = els.map((el) => ({ w: el.offsetWidth, h: el.offsetHeight }));
    const ys = pos.map((p) => p.y);
    const zone = {
      left: -spread - ZONE_PAD,
      right: spread + ZONE_PAD,
      top: Math.min(...ys) - ZONE_PAD,
      bottom: -lift + Math.max(...w.sizes.map((s) => s.h)),
    };
    w.zone = zone;
    w.phases = els.map((_, i) => jitter(i) * Math.PI * 2);
    w.bodies = els.map((_, i) => {
      const { w: bw, h: bh } = w.sizes[i];
      return Bodies.rectangle(pos[i].x, pos[i].y + bh / 2, bw, bh, {
        chamfer: { radius: Math.min(Math.max(1, bh / 2 - 1), 16) },
        restitution: 0.55,
        friction: 0,
        frictionAir: 0.08,
        inertia: Infinity,
      });
    });

    const T = 80;
    const walls = [
      Bodies.rectangle(
        (zone.left + zone.right) / 2,
        zone.top - T / 2,
        zone.right - zone.left + 2 * T,
        T,
        { isStatic: true }
      ),
      Bodies.rectangle(
        (zone.left + zone.right) / 2,
        zone.bottom + T / 2,
        zone.right - zone.left + 2 * T,
        T,
        { isStatic: true }
      ),
      Bodies.rectangle(
        zone.left - T / 2,
        (zone.top + zone.bottom) / 2,
        T,
        zone.bottom - zone.top + 2 * T,
        { isStatic: true }
      ),
      Bodies.rectangle(
        zone.right + T / 2,
        (zone.top + zone.bottom) / 2,
        T,
        zone.bottom - zone.top + 2 * T,
        { isStatic: true }
      ),
    ];
    Composite.add(engine.world, [...w.bodies, ...walls]);
    w.live = true;
    w.last = 0;
    w.t0 = performance.now();
    setLive(true);

    const tick = (now: number) => {
      const s = world.current;
      if (!s.engine) return;
      const dt = s.last ? Math.min(32, now - s.last) : 16;
      s.last = now;
      const t = (now - s.t0) / 1000;
      const k = latest.current.drift * 0.00005 * Math.min(1, t / 2);
      s.bodies.forEach((b, i) => {
        if (s.drag && s.drag.i === i) return;
        const ph = s.phases[i] ?? 0;
        Body.applyForce(b, b.position, {
          x: Math.sin(t * 0.9 + ph) * k * b.mass,
          y: Math.cos(t * 1.3 + ph * 1.7) * k * b.mass,
        });
      });
      Engine.update(s.engine, dt);
      s.bodies.forEach((b, i) => {
        const el = pillRefs.current[i];
        const size = s.sizes[i];
        if (!el || !size) return;
        el.style.setProperty("--x", `${b.position.x.toFixed(1)}px`);
        el.style.setProperty(
          "--y",
          `${(b.position.y - size.h / 2).toFixed(1)}px`
        );
      });
      s.raf = requestAnimationFrame(tick);
    };
    w.raf = requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, spread, lift, posKey]);

  const setOpenState = useCallback(
    (next: boolean) => {
      if (!next) stopPhysics();
      setOpen((prev) => {
        if (prev === next) return prev;
        latest.current.onOpenChange?.(next);
        return next;
      });
    },
    [stopPhysics]
  );

  useEffect(() => {
    if (liveTimer.current) clearTimeout(liveTimer.current);
    if (!open || !physics || latest.current.reduce) {
      stopPhysics();
      return undefined;
    }
    liveTimer.current = setTimeout(
      startPhysics,
      openDuration + (n - 1) * stagger + 80
    );
    return () => {
      if (liveTimer.current) clearTimeout(liveTimer.current);
    };
  }, [open, physics, openDuration, stagger, n, startPhysics, stopPhysics]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      latest.current.reduce = mq.matches;
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(
    () => () => {
      if (popTimer.current) clearTimeout(popTimer.current);
      stopPhysics();
    },
    [stopPhysics]
  );

  const pick = (item: { label: string; value: string }, i: number) => {
    latest.current.onSelect?.(item.value, i);
    if (popTimer.current) clearTimeout(popTimer.current);
    setPopped(i);
    popTimer.current = setTimeout(() => setPopped(-1), 320);
    if (closeOnSelect) setOpenState(false);
  };

  const pointerAt = (e: PointerEvent<HTMLButtonElement>) => {
    const r = anchorRef.current?.getBoundingClientRect();
    return r ? { x: e.clientX - r.left, y: e.clientY - r.top } : { x: 0, y: 0 };
  };

  const down = (e: PointerEvent<HTMLButtonElement>, i: number) => {
    const w = world.current;
    if (!w.live || e.button !== 0) return;
    const b = w.bodies[i];
    if (!b) return;
    const p = pointerAt(e);
    w.drag = {
      i,
      id: e.pointerId,
      dx: b.position.x - p.x,
      dy: b.position.y - p.y,
      sx: e.clientX,
      sy: e.clientY,
      moved: false,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const move = (e: PointerEvent<HTMLButtonElement>, i: number) => {
    const w = world.current;
    const d = w.drag;
    if (!d || d.i !== i || d.id !== e.pointerId) return;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) >= DRAG_MIN) {
      d.moved = true;
      e.currentTarget.setAttribute("data-drag", "");
    }
    if (!d.moved) return;
    const b = w.bodies[i];
    const size = w.sizes[i];
    const z = w.zone;
    if (!b || !size || !z) return;
    const p = pointerAt(e);
    const x = Math.min(
      z.right - size.w / 2,
      Math.max(z.left + size.w / 2, p.x + d.dx)
    );
    const y = Math.min(
      z.bottom - size.h / 2,
      Math.max(z.top + size.h / 2, p.y + d.dy)
    );
    Body.setVelocity(b, {
      x: (x - b.position.x) * 0.6,
      y: (y - b.position.y) * 0.6,
    });
    Body.setPosition(b, { x, y });
  };

  const up = (
    e: PointerEvent<HTMLButtonElement>,
    i: number,
    item: { label: string; value: string }
  ) => {
    const w = world.current;
    const d = w.drag;
    if (!d || d.i !== i || d.id !== e.pointerId) return;
    w.drag = null;
    e.currentTarget.removeAttribute("data-drag");
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}
    if (!d.moved && e.type === "pointerup") pick(item, i);
  };

  const hover = trigger === "hover";

  const rootStyle: FolderFloatCSSVars = {
    "--ff-w": `${width}px`,
    "--ff-h": `${height}px`,
    "--ff-r": `${radius}px`,
    "--ff-back": folderColor,
    "--ff-front": frontColor,
    "--ff-paper": paperColor,
    "--ff-item": itemColor,
    "--ff-item-ink": itemTextColor,
    "--ff-label": labelColor,
    "--ff-spread": `${spread}px`,
    "--ff-lift": `${lift}px`,
    "--ff-angle": `${flapAngle}deg`,
    "--ff-rest": `${restAngle}deg`,
    "--ff-open": `${openDuration}ms`,
    "--ff-close": `${Math.round(openDuration * 0.6)}ms`,
    "--ff-stagger": `${stagger}ms`,
    "--ff-n": n,
    "--ff-spring": `cubic-bezier(0.34, ${(1 + bounce * 1.9).toFixed(2)}, 0.64, 1)`,
  };

  return (
    <div
      className={`folder-float${className ? ` ${className}` : ""}`}
      data-open={open ? "" : undefined}
      data-live={live ? "" : undefined}
      data-physics={physics ? "" : undefined}
      data-trigger={trigger}
      onPointerEnter={hover ? () => setOpenState(true) : undefined}
      onPointerLeave={
        hover
          ? () => {
              if (!world.current.drag) setOpenState(false);
            }
          : undefined
      }
      onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          setOpenState(false);
        }
      }}
      style={rootStyle}
    >
      <div ref={anchorRef} className="folder-float__items">
        {list.map((item, i) => {
          const p = pos[i] ?? { x: 0, y: -lift, r: 0 };
          return (
            <button
              key={`${item.value}-${i}`}
              ref={(el) => {
                pillRefs.current[i] = el;
              }}
              type="button"
              className="folder-float__item"
              tabIndex={open ? 0 : -1}
              aria-hidden={!open}
              data-pop={popped === i ? "" : undefined}
              style={
                {
                  "--i": i,
                  "--x": `${p.x.toFixed(1)}px`,
                  "--y": `${p.y.toFixed(1)}px`,
                  "--r": `${p.r.toFixed(2)}deg`,
                } as FolderFloatCSSVars
              }
              onPointerDown={(e) => down(e, i)}
              onPointerMove={(e) => move(e, i)}
              onPointerUp={(e) => up(e, i, item)}
              onPointerCancel={(e) => up(e, i, item)}
              onClick={(e: MouseEvent<HTMLButtonElement>) => {
                if (!world.current.live || e.detail === 0) pick(item, i);
              }}
            >
              <span className="folder-float__drift">{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="folder-float__folder">
        <span className="folder-float__back" aria-hidden="true" />
        <span className="folder-float__paper" aria-hidden="true" />
        <span className="folder-float__front" aria-hidden="true">
          <span className="folder-float__label">{label}</span>
          <span className="folder-float__sub">{sub}</span>
        </span>
        <button
          type="button"
          className="folder-float__trigger"
          aria-expanded={open}
          aria-label={`${label}, ${sub}`}
          onClick={() => setOpenState(!open)}
        />
      </div>
    </div>
  );
}

export default FolderFloat;

