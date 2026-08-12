import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Crater } from '../types/crater';

interface SouthPoleMapProps {
  craters: Crater[];
  selectedCrater: Crater | null;
  onSelectCrater: (crater: Crater) => void;
}

function hashNoise(x: number, y: number, seed: number) {
  let h = seed + x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return (h & 0x7fffffff) / 0x7fffffff;
}

export const SouthPoleMap: React.FC<SouthPoleMapProps> = ({
  craters,
  selectedCrater,
  onSelectCrater,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredCrater, setHoveredCrater] = useState<Crater | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mouseLatLon, setMouseLatLon] = useState({ lat: -90, lon: 0 });

  const getProjection = useCallback((lat: number, lon: number, cx: number, cy: number, maxR: number) => {
    const r = ((90 - Math.abs(lat)) / 10) * maxR;
    const theta = ((lon - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(theta),
      y: cy - r * Math.sin(theta),
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2 + pan.x;
    const cy = h / 2 + pan.y;
    const maxR = (Math.min(w, h) * 0.42) * zoom;

    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, w, h);

    // Render polar stereographic canvas terrain
    ctx.fillStyle = '#111726';
    ctx.beginPath();
    ctx.arc(cx, cy, maxR, 0, 2 * Math.PI);
    ctx.fill();

    // Concentric latitude circles
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.lineWidth = 1;
    [80, 83, 86, 89].forEach(lat => {
      const r = ((90 - lat) / 10) * maxR;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.stroke();
    });

    // Crater pins
    craters.forEach(c => {
      const p = getProjection(c.lat, c.lon, cx, cy, maxR);
      const isSelected = selectedCrater && selectedCrater.id === c.id;

      let color = '#ef4444';
      if (c.classification === 'ICE_POSITIVE') color = '#10b981';
      else if (c.classification === 'AMBIGUOUS') color = '#f59e0b';

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(3, (c.diameter_km / 12) * zoom), 0, 2 * Math.PI);
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(6, (c.diameter_km / 8) * zoom), 0, 2 * Math.PI);
        ctx.stroke();
      }
    });
  }, [craters, selectedCrater, zoom, pan, getProjection]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        width={750}
        height={600}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />
    </div>
  );
};
