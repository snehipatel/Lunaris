import { useEffect, useRef } from "react";

type Ramp = "cpr" | "dop";

/**
 * Synthesised CPR / DOP raster preview for a crater footprint.
 * Replaced later by the real GeoTIFF-derived overlay tiles.
 */
export function CraterRaster({
  seed,
  ramp,
  label,
  size = 260,
}: {
  seed: number;
  ramp: Ramp;
  label: string;
  size?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const n = 128;
    cv.width = n;
    cv.height = n;
    const ctx = cv.getContext("2d")!;
    const img = ctx.createImageData(n, n);
    let s = seed >>> 0;
    const rnd = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
    const field: number[] = [];
    const centers = Array.from({ length: 7 }, () => ({
      x: rnd() * n,
      y: rnd() * n,
      r: 12 + rnd() * 34,
      a: rnd(),
    }));
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const dx = x - n / 2;
        const dy = y - n / 2;
        const rad = Math.sqrt(dx * dx + dy * dy) / (n / 2);
        let v = rad < 0.98 ? 0.55 - Math.abs(rad - 0.55) * 0.7 : 0;
        centers.forEach((c) => {
          const d = Math.hypot(x - c.x, y - c.y);
          if (d < c.r) v += (1 - d / c.r) * c.a * 0.7;
        });
        v += (rnd() - 0.5) * 0.14;
        field.push(rad < 0.99 ? Math.max(0, Math.min(1, v)) : 0);
      }
    }
    const cprStops = [
      [10, 20, 70],
      [30, 120, 190],
      [40, 200, 160],
      [250, 220, 70],
      [230, 70, 40],
    ];
    const dopStops = [
      [8, 12, 45],
      [30, 60, 200],
      [40, 200, 220],
      [140, 240, 160],
      [250, 250, 200],
    ];
    const stops = ramp === "cpr" ? cprStops : dopStops;
    for (let i = 0; i < n * n; i++) {
      const v = field[i] ?? 0;
      const t = v * (stops.length - 1);
      const k = Math.min(stops.length - 2, Math.floor(t));
      const f = t - k;
      const a = stops[k]!;
      const b = stops[k + 1]!;
      img.data[i * 4] = a[0]! + (b[0]! - a[0]!) * f;
      img.data[i * 4 + 1] = a[1]! + (b[1]! - a[1]!) * f;
      img.data[i * 4 + 2] = a[2]! + (b[2]! - a[2]!) * f;
      img.data[i * 4 + 3] = v > 0 ? 255 : 0;
    }
    ctx.putImageData(img, 0, 0);
  }, [seed, ramp]);

  const gradient =
    ramp === "cpr"
      ? "linear-gradient(90deg,#0a1446,#1e78be,#28c8a0,#fadc46,#e64628)"
      : "linear-gradient(90deg,#080c2d,#1e3cc8,#28c8dc,#8cf0a0,#fafac8)";

  return (
    <figure className="flex flex-col gap-1.5">
      <figcaption className="label-xs text-[10px]">{label}</figcaption>
      <canvas
        ref={ref}
        style={{ width: size, height: size, imageRendering: "pixelated" }}
        className="w-full rounded-sm border border-border bg-background"
        aria-label={label}
      />
      <div className="h-1.5 w-full rounded-sm" style={{ background: gradient }} />
    </figure>
  );
}
