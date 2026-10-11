import { useEffect, useRef, useState } from "react";
import lottie, { type AnimationItem } from "lottie-web";
import { useTheme } from "next-themes";
import splashData from "@/assets/splash.json";

const NAVY_LAYERS = new Set(["dark_b1", "dark_b2", "dark_b3", "dark_E", "dark_R", "dark_P"]);
const WHITE: [number, number, number, number] = [1, 1, 1, 1];

function recolorForDark(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(recolorForDark);
  if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    const clone: Record<string, unknown> = {};
    for (const key in obj) clone[key] = recolorForDark(obj[key]);
    if ((clone.ty === "fl" || clone.ty === "st") && clone.c && typeof clone.c === "object") {
      const c = clone.c as Record<string, unknown>;
      if (c.a === 0) clone.c = { ...c, k: WHITE };
    }
    return clone;
  }
  return node;
}

function buildDarkData() {
  const data = structuredClone(splashData) as { layers?: { nm?: string; shapes?: unknown }[] };
  for (const layer of data.layers ?? []) {
    if (layer.nm && NAVY_LAYERS.has(layer.nm)) {
      layer.shapes = recolorForDark(layer.shapes);
    }
  }
  return data;
}

let darkSplashData: unknown = null;

export function LottieSplash({ size = 200, className }: { size?: number; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    const isDark = resolvedTheme === "dark";
    if (isDark && !darkSplashData) darkSplashData = buildDarkData();

    const anim: AnimationItem = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: false,
      autoplay: true,
      animationData: isDark ? darkSplashData : splashData,
    });

    return () => anim.destroy();
  }, [mounted, resolvedTheme]);

  return <div ref={containerRef} className={className} style={{ width: size, height: size }} />;
}
