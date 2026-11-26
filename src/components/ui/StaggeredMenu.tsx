"use client";

import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { gsap } from "gsap";

import "./StaggeredMenu.css";

export type StaggeredMenuPosition = "left" | "right";

export interface StaggeredMenuItem {
  label: string;
  link: string;
  ariaLabel?: string;
  active?: boolean;
}

export interface StaggeredMenuSocialItem {
  label: string;
  link: string;
}

export interface StaggeredMenuProps {
  position?: StaggeredMenuPosition;
  colors?: string[];
  items?: StaggeredMenuItem[];
  socialItems?: StaggeredMenuSocialItem[];
  displaySocials?: boolean;
  displayItemNumbering?: boolean;
  className?: string;
  logoUrl?: string;
  logoNode?: ReactNode;
  headerRight?: ReactNode;
  headerVariant?: "overlay" | "bar";
  panelFooter?: ReactNode;
  menuButtonColor?: string;
  openMenuButtonColor?: string;
  accentColor?: string;
  changeMenuColorOnOpen?: boolean;
  isFixed?: boolean;
  closeOnClickAway?: boolean;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
}

type StaggeredMenuCSSVars = CSSProperties &
  Record<`--sm-${string}`, string | undefined>;

export function StaggeredMenu({
  position = "right",
  colors = ["#fed7aa", "#c2410c"],
  items = [],
  socialItems = [],
  displaySocials = true,
  displayItemNumbering = true,
  className,
  logoUrl,
  logoNode,
  headerRight,
  headerVariant = "overlay",
  panelFooter,
  menuButtonColor,
  openMenuButtonColor,
  accentColor,
  changeMenuColorOnOpen = true,
  isFixed = false,
  closeOnClickAway = true,
  onMenuOpen,
  onMenuClose,
}: StaggeredMenuProps) {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const panelRef = useRef<HTMLElement>(null);
  const preLayersRef = useRef<HTMLDivElement>(null);
  const preLayerElsRef = useRef<HTMLDivElement[]>([]);
  const plusHRef = useRef<HTMLSpanElement>(null);
  const plusVRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const textInnerRef = useRef<HTMLSpanElement>(null);
  const textWrapRef = useRef<HTMLSpanElement>(null);
  const [textLines, setTextLines] = useState<string[]>(["Menu", "Tutup"]);

  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);
  const spinTweenRef = useRef<gsap.core.Tween | null>(null);
  const textCycleAnimRef = useRef<gsap.core.Tween | null>(null);
  const colorTweenRef = useRef<gsap.core.Tween | null>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const busyRef = useRef(false);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;
      const plusH = plusHRef.current;
      const plusV = plusVRef.current;
      const icon = iconRef.current;
      const textInner = textInnerRef.current;
      if (!panel || !plusH || !plusV || !icon || !textInner) return;

      let preLayers: HTMLDivElement[] = [];
      if (preContainer) {
        preLayers = Array.from(
          preContainer.querySelectorAll<HTMLDivElement>(".sm-prelayer")
        );
      }
      preLayerElsRef.current = preLayers;

      const offscreen = position === "left" ? -100 : 100;
      const isOpen = openRef.current;
      gsap.set([panel, ...preLayers], {
        xPercent: isOpen ? 0 : offscreen,
        opacity: 1,
        visibility: isOpen ? "visible" : "hidden",
      });
      if (preContainer) {
        gsap.set(preContainer, {
          xPercent: 0,
          opacity: 1,
          visibility: isOpen ? "visible" : "hidden",
        });
      }
      gsap.set(plusH, { transformOrigin: "50% 50%", rotate: 0 });
      gsap.set(plusV, { transformOrigin: "50% 50%", rotate: 90 });
      gsap.set(icon, { rotate: isOpen ? 225 : 0, transformOrigin: "50% 50%" });
      gsap.set(textInner, { yPercent: 0 });
      if (toggleBtnRef.current && menuButtonColor) {
        gsap.set(toggleBtnRef.current, { color: menuButtonColor });
      }
    });
    return () => ctx.revert();
  }, [position, menuButtonColor]);

  const colorsKey = (colors || []).join("|");
  useLayoutEffect(() => {
    const preContainer = preLayersRef.current;
    const panel = panelRef.current;
    if (!preContainer || !panel) return;
    const preLayers = Array.from(
      preContainer.querySelectorAll<HTMLDivElement>(".sm-prelayer")
    );
    preLayerElsRef.current = preLayers;
    const offscreen = position === "left" ? -100 : 100;
    const isOpen = openRef.current;
    gsap.set(preContainer, {
      opacity: 1,
      visibility: isOpen ? "visible" : "hidden",
    });
    gsap.set([panel, ...preLayers], {
      xPercent: isOpen ? 0 : offscreen,
      opacity: 1,
      visibility: isOpen ? "visible" : "hidden",
    });
  }, [colorsKey, position]);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();
    if (closeTweenRef.current) {
      closeTweenRef.current.kill();
      closeTweenRef.current = null;
    }

    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const preContainer = preLayersRef.current;
    const itemEls = Array.from(
      panel.querySelectorAll<HTMLElement>(".sm-panel-itemLabel")
    );
    const numberEls = Array.from(
      panel.querySelectorAll<HTMLElement>(
        ".sm-panel-list[data-numbering] .sm-panel-item"
      )
    );
    const socialTitle = panel.querySelector<HTMLElement>(".sm-socials-title");
    const socialLinks = Array.from(
      panel.querySelectorAll<HTMLElement>(".sm-socials-link")
    );

    const offscreen = position === "left" ? -100 : 100;
    const layerStates = layers.map((el) => ({ el, start: offscreen }));

    if (preContainer) {
      gsap.set(preContainer, { visibility: "visible", opacity: 1 });
    }
    gsap.set([panel, ...layers], { visibility: "visible", opacity: 1 });

    if (reduce) {
      const tl = gsap.timeline({ paused: true });
      layerStates.forEach((ls) => tl.set(ls.el, { xPercent: 0 }, 0));
      tl.set(panel, { xPercent: 0 }, 0);
      if (itemEls.length) tl.set(itemEls, { yPercent: 0, rotate: 0 }, 0);
      if (numberEls.length) tl.set(numberEls, { "--sm-num-opacity": 1 }, 0);
      if (socialTitle) tl.set(socialTitle, { opacity: 1 }, 0);
      if (socialLinks.length) tl.set(socialLinks, { y: 0, opacity: 1 }, 0);
      openTlRef.current = tl;
      return tl;
    }

    if (itemEls.length) {
      gsap.set(itemEls, { yPercent: 140, rotate: 10 });
    }
    if (numberEls.length) {
      gsap.set(numberEls, { "--sm-num-opacity": 0 });
    }
    if (socialTitle) {
      gsap.set(socialTitle, { opacity: 0 });
    }
    if (socialLinks.length) {
      gsap.set(socialLinks, { y: 25, opacity: 0 });
    }

    const tl = gsap.timeline({ paused: true });

    layerStates.forEach((ls, i) => {
      tl.fromTo(
        ls.el,
        { xPercent: ls.start },
        { xPercent: 0, duration: 0.48, ease: "power4.out" },
        i * 0.06
      );
    });
    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.06 : 0;
    const panelInsertTime = lastTime + (layerStates.length ? 0.07 : 0);
    const panelDuration = 0.58;
    tl.fromTo(
      panel,
      { xPercent: offscreen },
      { xPercent: 0, duration: panelDuration, ease: "power4.out" },
      panelInsertTime
    );

    if (itemEls.length) {
      const itemsStart = panelInsertTime + panelDuration * 0.15;
      tl.to(
        itemEls,
        {
          yPercent: 0,
          rotate: 0,
          duration: 0.85,
          ease: "power4.out",
          stagger: { each: 0.06, from: "start" },
        },
        itemsStart
      );
      if (numberEls.length) {
        tl.to(
          numberEls,
          {
            duration: 0.5,
            ease: "power2.out",
            "--sm-num-opacity": 1,
            stagger: { each: 0.05, from: "start" },
          },
          itemsStart + 0.08
        );
      }
    }

    if (socialTitle || socialLinks.length) {
      const socialsStart = panelInsertTime + panelDuration * 0.4;
      if (socialTitle) {
        tl.to(
          socialTitle,
          {
            opacity: 1,
            duration: 0.45,
            ease: "power2.out",
          },
          socialsStart
        );
      }
      if (socialLinks.length) {
        tl.to(
          socialLinks,
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: "power3.out",
            stagger: { each: 0.06, from: "start" },
            onComplete: () => {
              gsap.set(socialLinks, { clearProps: "opacity" });
            },
          },
          socialsStart + 0.04
        );
      }
    }

    openTlRef.current = tl;
    return tl;
  }, [position]);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const tl = buildOpenTimeline();
    if (tl) {
      tl.eventCallback("onComplete", () => {
        busyRef.current = false;
      });
      tl.play(0);
    } else {
      busyRef.current = false;
    }
  }, [buildOpenTimeline]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    openTlRef.current = null;

    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return;

    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const preContainer = preLayersRef.current;
    const all = [...layers, panel];
    closeTweenRef.current?.kill();
    const offscreen = position === "left" ? -100 : 100;

    if (reduce) {
      gsap.set(all, { xPercent: offscreen, visibility: "hidden" });
      if (preContainer) gsap.set(preContainer, { visibility: "hidden" });
      busyRef.current = false;
      return;
    }

    closeTweenRef.current = gsap.to(all, {
      xPercent: offscreen,
      duration: 0.28,
      ease: "power3.in",
      overwrite: "auto",
      onComplete: () => {
        gsap.set(all, { visibility: "hidden" });
        if (preContainer) gsap.set(preContainer, { visibility: "hidden" });
        const itemEls = Array.from(
          panel.querySelectorAll<HTMLElement>(".sm-panel-itemLabel")
        );
        if (itemEls.length) {
          gsap.set(itemEls, { yPercent: 140, rotate: 10 });
        }
        const numberEls = Array.from(
          panel.querySelectorAll<HTMLElement>(
            ".sm-panel-list[data-numbering] .sm-panel-item"
          )
        );
        if (numberEls.length) {
          gsap.set(numberEls, { "--sm-num-opacity": 0 });
        }
        const socialTitle =
          panel.querySelector<HTMLElement>(".sm-socials-title");
        const socialLinks = Array.from(
          panel.querySelectorAll<HTMLElement>(".sm-socials-link")
        );
        if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
        if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });
        busyRef.current = false;
      },
    });
  }, [position]);

  const animateIcon = useCallback((opening: boolean) => {
    const icon = iconRef.current;
    if (!icon) return;
    spinTweenRef.current?.kill();
    if (opening) {
      spinTweenRef.current = gsap.to(icon, {
        rotate: 225,
        duration: 0.7,
        ease: "power4.out",
        overwrite: "auto",
      });
    } else {
      spinTweenRef.current = gsap.to(icon, {
        rotate: 0,
        duration: 0.32,
        ease: "power3.inOut",
        overwrite: "auto",
      });
    }
  }, []);

  const animateColor = useCallback(
    (opening: boolean) => {
      const btn = toggleBtnRef.current;
      if (!btn || (!menuButtonColor && !openMenuButtonColor)) return;
      colorTweenRef.current?.kill();
      if (changeMenuColorOnOpen) {
        const targetColor = opening ? openMenuButtonColor : menuButtonColor;
        if (targetColor) {
          colorTweenRef.current = gsap.to(btn, {
            color: targetColor,
            delay: 0.16,
            duration: 0.28,
            ease: "power2.out",
          });
        }
      } else if (menuButtonColor) {
        gsap.set(btn, { color: menuButtonColor });
      }
    },
    [openMenuButtonColor, menuButtonColor, changeMenuColorOnOpen]
  );

  useEffect(() => {
    if (!toggleBtnRef.current || (!menuButtonColor && !openMenuButtonColor)) {
      return;
    }
    if (changeMenuColorOnOpen) {
      const targetColor = openRef.current
        ? openMenuButtonColor
        : menuButtonColor;
      if (targetColor) {
        gsap.set(toggleBtnRef.current, { color: targetColor });
      }
    } else if (menuButtonColor) {
      gsap.set(toggleBtnRef.current, { color: menuButtonColor });
    }
  }, [changeMenuColorOnOpen, menuButtonColor, openMenuButtonColor]);

  const animateText = useCallback((opening: boolean) => {
    const inner = textInnerRef.current;
    if (!inner) return;
    textCycleAnimRef.current?.kill();

    const currentLabel = opening ? "Menu" : "Tutup";
    const targetLabel = opening ? "Tutup" : "Menu";
    const cycles = 3;
    const seq = [currentLabel];
    let last = currentLabel;
    for (let i = 0; i < cycles; i++) {
      last = last === "Menu" ? "Tutup" : "Menu";
      seq.push(last);
    }
    if (last !== targetLabel) seq.push(targetLabel);
    seq.push(targetLabel);
    setTextLines(seq);

    gsap.set(inner, { yPercent: 0 });
    const lineCount = seq.length;
    const finalShift = ((lineCount - 1) / lineCount) * 100;
    textCycleAnimRef.current = gsap.to(inner, {
      yPercent: -finalShift,
      duration: 0.45 + lineCount * 0.06,
      ease: "power4.out",
    });
  }, []);

  const toggleMenu = useCallback(() => {
    const target = !openRef.current;
    openRef.current = target;
    setOpen(target);
    if (target) {
      onMenuOpen?.();
      playOpen();
    } else {
      onMenuClose?.();
      playClose();
    }
    animateIcon(target);
    animateColor(target);
    animateText(target);
  }, [
    playOpen,
    playClose,
    animateIcon,
    animateColor,
    animateText,
    onMenuOpen,
    onMenuClose,
  ]);

  const closeMenu = useCallback(() => {
    if (openRef.current) {
      openRef.current = false;
      setOpen(false);
      onMenuClose?.();
      playClose();
      animateIcon(false);
      animateColor(false);
      animateText(false);
    }
  }, [playClose, animateIcon, animateColor, animateText, onMenuClose]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (!closeOnClickAway) return;
      const targetNode = event.target as Node | null;
      if (
        panelRef.current &&
        targetNode &&
        !panelRef.current.contains(targetNode) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(targetNode)
      ) {
        closeMenu();
      }
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
        toggleBtnRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeOnClickAway, open, closeMenu]);

  const rootStyle: StaggeredMenuCSSVars | undefined = accentColor
    ? { "--sm-accent": accentColor }
    : undefined;

  const toggleButton = (
    <button
      ref={toggleBtnRef}
      className="sm-toggle"
      aria-label={open ? "Tutup menu navigasi" : "Buka menu navigasi"}
      aria-expanded={open}
      aria-controls="staggered-menu-panel"
      onClick={toggleMenu}
      type="button"
    >
      <span ref={textWrapRef} className="sm-toggle-textWrap" aria-hidden="true">
        <span ref={textInnerRef} className="sm-toggle-textInner">
          {textLines.map((line, i) => (
            <span className="sm-toggle-line" key={`${line}-${i}`}>
              {line}
            </span>
          ))}
        </span>
      </span>
      <span ref={iconRef} className="sm-icon" aria-hidden="true">
        <span ref={plusHRef} className="sm-icon-line" />
        <span ref={plusVRef} className="sm-icon-line sm-icon-line-v" />
      </span>
    </button>
  );

  const brandBlock = logoNode ? (
    <div className="sm-logo">{logoNode}</div>
  ) : logoUrl ? (
    <div className="sm-logo" aria-label="Logo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt="Logo"
        className="sm-logo-img"
        draggable={false}
        width={110}
        height={24}
      />
    </div>
  ) : null;

  const layersToRender = (() => {
    const raw =
      colors && colors.length ? colors.slice(0, 4) : ["#fed7aa", "#c2410c"];
    const arr = [...raw];
    if (arr.length >= 3) {
      const mid = Math.floor(arr.length / 2);
      arr.splice(mid, 1);
    }
    return arr;
  })();

  return (
    <div
      className={`${className ? `${className} ` : ""}staggered-menu-wrapper${
        isFixed ? " fixed-wrapper" : ""
      }`}
      style={rootStyle}
      data-position={position}
      data-open={open || undefined}
    >
      {open && (
        <div
          className="sm-backdrop"
          aria-hidden="true"
          onClick={closeOnClickAway ? closeMenu : undefined}
        />
      )}

      <div ref={preLayersRef} className="sm-prelayers" aria-hidden="true">
        {layersToRender.map((color, i) => (
          <div
            key={i}
            className="sm-prelayer"
            style={{ background: color }}
          />
        ))}
      </div>

      <header
        className={`staggered-menu-header${
          headerVariant === "bar" ? " sm-header-bar" : ""
        }`}
        aria-label="Navigasi utama"
      >
        {position === "left" ? (
          <>
            <div className="sm-header-left">
              {toggleButton}
              {brandBlock}
            </div>
            {headerRight && (
              <div className="sm-header-right">{headerRight}</div>
            )}
          </>
        ) : (
          <>
            {brandBlock}
            <div className="sm-header-right">
              {headerRight}
              {toggleButton}
            </div>
          </>
        )}
      </header>

      <aside
        id="staggered-menu-panel"
        ref={panelRef}
        className="staggered-menu-panel"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="sm-panel-inner">
          <ul
            className="sm-panel-list"
            role="list"
            data-numbering={displayItemNumbering || undefined}
          >
            {items && items.length ? (
              items.map((it, idx) => (
                <li className="sm-panel-itemWrap" key={it.label + idx}>
                  <Link
                    className="sm-panel-item"
                    href={it.link}
                    aria-label={it.ariaLabel || it.label}
                    aria-current={it.active ? "page" : undefined}
                    data-active={it.active ? "true" : undefined}
                    data-index={idx + 1}
                    onClick={closeMenu}
                  >
                    <span className="sm-panel-itemLabel">{it.label}</span>
                  </Link>
                </li>
              ))
            ) : (
              <li className="sm-panel-itemWrap" aria-hidden="true">
                <span className="sm-panel-item">
                  <span className="sm-panel-itemLabel">Tidak ada menu</span>
                </span>
              </li>
            )}
          </ul>

          {displaySocials && socialItems && socialItems.length > 0 && (
            <div className="sm-socials" aria-label="Tautan terkait">
              <h3 className="sm-socials-title">Tautan</h3>
              <ul className="sm-socials-list" role="list">
                {socialItems.map((s, i) => (
                  <li key={s.label + i} className="sm-socials-item">
                    <a
                      href={s.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sm-socials-link"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {panelFooter && <div className="sm-panel-footer">{panelFooter}</div>}
        </div>
      </aside>
    </div>
  );
}

export default StaggeredMenu;

