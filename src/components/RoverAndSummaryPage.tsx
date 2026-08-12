import React, { useRef, useEffect } from 'react';
import { Crater } from '../types/crater';

interface RoverAndSummaryPageProps {
  crater: Crater;
  allCraters: Crater[];
}

function noiseVal(x: number, y: number, s: number): number {
  let h = s + x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return (h & 0x7fffffff) / 0x7fffffff;
}

export const RoverAndSummaryPage: React.FC<RoverAndSummaryPageProps> = ({ crater, allCraters }) => {
  const terrainCanvasRef = useRef<HTMLCanvasElement>(null);
  const slopeCanvasRef = useRef<HTMLCanvasElement>(null);
  const cprCanvasRef = useRef<HTMLCanvasElement>(null);
  const dopCanvasRef = useRef<HTMLCanvasElement>(null);
  const donutCanvasRef = useRef<HTMLCanvasElement>(null);

  const traverse = crater.roverTraverse;

  const total = allCraters.length;
  const pos = allCraters.filter(c => c.classification === 'ICE_POSITIVE').length;
  const amb = allCraters.filter(c => c.classification === 'AMBIGUOUS').length;
  const neg = allCraters.filter(c => c.classification === 'ICE_NEGATIVE').length;

  useEffect(() => {
    const canvas = terrainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#0a0d16';
    ctx.fillRect(0, 0, w, h);

    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const n1 = noiseVal(Math.floor(x / 4), Math.floor(y / 4), 99);
        const n2 = noiseVal(Math.floor(x / 12), Math.floor(y / 12), 22);
        let base = n1 * 0.3 + n2 * 0.7;

        const cdx = x - w * 0.65;
        const cdy = y - h * 0.35;
        const cdist = Math.hypot(cdx, cdy);
        const craterR = Math.min(w, h) * 0.28;
        if (cdist < craterR * 1.2) {
          const t = cdist / craterR;
          if (t < 0.7) base *= 0.12 + t * 0.25;
          else if (t < 1.05) base = Math.min(1, base + 0.3);
        }

        const grey = Math.floor(22 + base * 90);
        ctx.fillStyle = `rgb(${grey},${Math.floor(grey * 1.02)},${Math.floor(grey * 1.12)})`;
        ctx.fillRect(x, y, 2, 2);
      }
    }

    const waypoints = [
      { x: w * 0.15, y: h * 0.72 },
      { x: w * 0.24, y: h * 0.65 },
      { x: w * 0.33, y: h * 0.62 },
      { x: w * 0.42, y: h * 0.58 },
      { x: w * 0.50, y: h * 0.52 },
      { x: w * 0.58, y: h * 0.42 },
      { x: w * 0.64, y: h * 0.32 },
    ];

    const start = waypoints[0]!;
    const hz = waypoints[5]!;
    const target = waypoints[6]!;

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    for (let i = 1; i < waypoints.length; i++) {
      ctx.lineTo(waypoints[i]!.x, waypoints[i]!.y);
    }
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.beginPath(); ctx.arc(start.x, start.y, 8, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();

    [waypoints[2]!, waypoints[3]!, waypoints[4]!].forEach(wp => {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(wp.x, wp.y, 5, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke();
    });

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(hz.x, hz.y - 7); ctx.lineTo(hz.x - 6, hz.y + 5); ctx.lineTo(hz.x + 6, hz.y + 5);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = '#3b82f6';
    ctx.beginPath(); ctx.arc(target.x, target.y, 9, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
  }, [crater]);

  useEffect(() => {
    const canvas = slopeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#070b14'; ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(100, 160, 220, 0.12)';
    ctx.lineWidth = 0.8;
    for (let i = 0; i <= 3; i++) {
      const y = 8 + (i / 3) * (h - 22);
      ctx.beginPath(); ctx.moveTo(35, y); ctx.lineTo(w - 10, y); ctx.stroke();
    }

    ctx.fillStyle = 'rgba(150, 170, 200, 0.6)';
    ctx.font = '9px monospace';
    ctx.fillText('30°', 10, 12);
    ctx.fillText('20°', 10, h * 0.38);
    ctx.fillText('10°', 10, h * 0.68);
    ctx.fillText('0°', 15, h - 14);

    const wps = traverse.waypoints;
    const maxDist = traverse.totalDistance_km;
    for (let i = 0; i < wps.length; i += 2) {
      const item = wps[i];
      if (item) {
        const x = 35 + (item.distance_km / maxDist) * (w - 45);
        ctx.fillText(`${item.distance_km}`, x - 6, h - 2);
      }
    }
    ctx.fillText('Distance (km)', w / 2 - 25, h + 2);

    if (wps.length > 0 && wps[0]) {
      ctx.beginPath();
      ctx.moveTo(35, h - 16);
      for (let i = 0; i < wps.length; i++) {
        const item = wps[i];
        if (item) {
          const x = 35 + (item.distance_km / maxDist) * (w - 45);
          const y = 8 + ((30 - item.slope_deg) / 30) * (h - 24);
          ctx.lineTo(x, y);
        }
      }
      const lastWp = wps[wps.length - 1];
      if (lastWp) {
        const lastX = 35 + (lastWp.distance_km / maxDist) * (w - 45);
        ctx.lineTo(lastX, h - 16);
      }
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0.02)');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < wps.length; i++) {
        const item = wps[i];
        if (item) {
          const x = 35 + (item.distance_km / maxDist) * (w - 45);
          const y = 8 + ((30 - item.slope_deg) / 30) * (h - 24);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
  }, [traverse]);

  useEffect(() => {
    const canvas = cprCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#070b14'; ctx.fillRect(0, 0, w, h);

    const bins = [0, 0.5, 1.0, 1.5, 2.0, 2.5];
    const counts = bins.slice(0, -1).map((b, i) => {
      const nextB = bins[i + 1] ?? 2.5;
      return allCraters.filter(c => c.cpr >= b && c.cpr < nextB).length;
    });
    const maxCount = Math.max(...counts, 1);

    const barW = (w - 40) / counts.length - 4;
    counts.forEach((c, i) => {
      const barH = (c / maxCount) * (h - 24);
      const x = 30 + i * (barW + 4);
      const y = h - 14 - barH;

      const grad = ctx.createLinearGradient(x, y, x, h - 14);
      grad.addColorStop(0, '#06b6d4');
      grad.addColorStop(1, 'rgba(6, 182, 212, 0.2)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barW, barH);
    });

    ctx.fillStyle = 'rgba(150, 170, 200, 0.6)';
    ctx.font = '9px monospace';
    bins.forEach((b, i) => {
      ctx.fillText(b.toString(), 28 + i * (barW + 4), h - 2);
    });
  }, [allCraters]);

  useEffect(() => {
    const canvas = dopCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#070b14'; ctx.fillRect(0, 0, w, h);

    const bins = [0, 0.05, 0.1, 0.15, 0.2, 0.3];
    const counts = bins.slice(0, -1).map((b, i) => {
      const nextB = bins[i + 1] ?? 0.3;
      return allCraters.filter(c => c.dop >= b && c.dop < nextB).length;
    });
    const maxCount = Math.max(...counts, 1);

    const barW = (w - 40) / counts.length - 4;
    counts.forEach((c, i) => {
      const barH = (c / maxCount) * (h - 24);
      const x = 30 + i * (barW + 4);
      const y = h - 14 - barH;

      const grad = ctx.createLinearGradient(x, y, x, h - 14);
      grad.addColorStop(0, '#3b82f6');
      grad.addColorStop(1, 'rgba(59, 130, 246, 0.2)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barW, barH);
    });

    ctx.fillStyle = 'rgba(150, 170, 200, 0.6)';
    ctx.font = '9px monospace';
    bins.forEach((b, i) => {
      ctx.fillText(b.toString(), 28 + i * (barW + 4), h - 2);
    });
  }, [allCraters]);

  useEffect(() => {
    const canvas = donutCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#070b14'; ctx.fillRect(0, 0, w, h);

    const cx = w * 0.32, cy = h / 2;
    const outerR = Math.min(w, h) * 0.42;
    const innerR = outerR * 0.55;

    const segments = [
      { count: pos, color: '#10b981', label: 'Ice Positive' },
      { count: amb, color: '#f59e0b', label: 'Ambiguous' },
      { count: neg, color: '#ef4444', label: 'Ice Negative' },
    ];

    let startAngle = -Math.PI / 2;
    segments.forEach(seg => {
      const sliceAngle = (seg.count / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
      ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      startAngle += sliceAngle;
    });

    ctx.font = '11px monospace';
    segments.forEach((seg, i) => {
      const ly = 16 + i * 26;
      const lx = w * 0.58;
      ctx.fillStyle = seg.color;
      ctx.fillRect(lx, ly, 10, 10);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${seg.label}`, lx + 16, ly + 9);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`${seg.count} (${((seg.count / total) * 100).toFixed(1)}%)`, lx + 110, ly + 9);
      ctx.font = '11px monospace';
    });
  }, [allCraters, pos, amb, neg, total]);

  return (
    <div className="w-full h-full bg-[#060913] p-6 flex gap-6 overflow-hidden select-none font-sans">
      <div className="w-[50%] bg-[#090e1a] rounded-xl border border-[#1a2540] flex flex-col min-h-0 overflow-hidden">
        <div className="p-4 border-b border-[#14203a] shrink-0 font-mono">
          <h2 className="text-base font-extrabold text-white tracking-wide">ROVER TRAVERSE PLAN</h2>
        </div>

        <div className="flex-1 relative min-h-0 p-4">
          <div className="relative w-full h-full rounded-xl overflow-hidden border border-[#1a2540]">
            <canvas ref={terrainCanvasRef} width={600} height={340} className="w-full h-full object-cover" />

            <div className="absolute top-4 left-4 bg-[#070b14]/90 border border-[#1a2a4a] rounded-xl p-3 text-xs font-mono text-slate-200 space-y-2 backdrop-blur-md shadow-xl">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Legend</div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                <span>Start (Landing Site)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-0.5 bg-emerald-500 inline-block"></span>
                <span>Path</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                <span>Steep Slope</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
                <span>Target (Ice Zone)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[7px] border-transparent border-b-white inline-block"></span>
                <span>Hazard (Boulder)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#14203a] shrink-0 font-mono bg-[#070b14]/50 flex gap-4">
          <div className="w-[200px] shrink-0 space-y-1.5 text-xs">
            <div className="text-xs text-slate-400 font-bold mb-2">Traverse Summary</div>
            <div className="flex justify-between"><span className="text-slate-500">Total Distance</span><span className="text-slate-100 font-bold">{traverse.totalDistance_km} km</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Estimated Time</span><span className="text-slate-100 font-bold">{traverse.estimatedTime_hours} hours</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Max Slope</span><span className="text-amber-400 font-bold">{traverse.maxSlope_deg}°</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Avg Slope</span><span className="text-slate-100 font-bold">{traverse.avgSlope_deg}°</span></div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="text-xs text-slate-400 font-bold mb-1">Slope Profile</div>
            <div className="flex-1 rounded-lg border border-[#1a2540] overflow-hidden bg-[#070b14]">
              <canvas ref={slopeCanvasRef} width={340} height={100} className="w-full h-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="w-[50%] bg-[#090e1a] rounded-xl border border-[#1a2540] flex flex-col min-h-0 overflow-hidden font-mono">
        <div className="p-4 border-b border-[#14203a] shrink-0">
          <h2 className="text-base font-extrabold text-white tracking-wide">GLOBAL SUMMARY</h2>
        </div>

        <div className="p-4 flex-1 flex flex-col space-y-4 overflow-y-auto min-h-0">
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="bg-[#070b14] rounded-lg border border-[#1a2540] p-3">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Total Craters</div>
              <div className="text-xl font-extrabold text-white mt-1">{total}</div>
            </div>
            <div className="bg-[#070b14] rounded-lg border border-emerald-500/40 p-3">
              <div className="text-[10px] text-emerald-400 uppercase font-bold">Ice Positive</div>
              <div className="text-xl font-extrabold text-emerald-400 mt-1">
                {pos} <span className="text-xs text-slate-400 font-normal">({((pos / total) * 100).toFixed(1)}%)</span>
              </div>
            </div>
            <div className="bg-[#070b14] rounded-lg border border-amber-500/40 p-3">
              <div className="text-[10px] text-amber-400 uppercase font-bold">Ambiguous</div>
              <div className="text-xl font-extrabold text-amber-400 mt-1">
                {amb} <span className="text-xs text-slate-400 font-normal">({((amb / total) * 100).toFixed(1)}%)</span>
              </div>
            </div>
            <div className="bg-[#070b14] rounded-lg border border-rose-500/40 p-3">
              <div className="text-[10px] text-rose-400 uppercase font-bold">Ice Negative</div>
              <div className="text-xl font-extrabold text-rose-400 mt-1">
                {neg} <span className="text-xs text-slate-400 font-normal">({((neg / total) * 100).toFixed(1)}%)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#070b14] rounded-xl border border-[#1a2540] p-3">
              <div className="text-xs text-slate-400 font-bold mb-2">CPR Distribution</div>
              <canvas ref={cprCanvasRef} width={260} height={120} className="w-full rounded-lg" />
            </div>
            <div className="bg-[#070b14] rounded-xl border border-[#1a2540] p-3">
              <div className="text-xs text-slate-400 font-bold mb-2">DOP Distribution</div>
              <canvas ref={dopCanvasRef} width={260} height={120} className="w-full rounded-lg" />
            </div>
          </div>

          <div className="bg-[#070b14] rounded-xl border border-[#1a2540] p-4 flex-1 flex flex-col min-h-[160px]">
            <div className="text-xs text-slate-400 font-bold mb-2">Classification Breakdown</div>
            <div className="flex-1 relative">
              <canvas ref={donutCanvasRef} width={480} height={140} className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
