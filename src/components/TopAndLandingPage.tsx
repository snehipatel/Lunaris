import React, { useState, useRef, useEffect } from 'react';
import { Filter, Eye } from 'lucide-react';
import { Crater } from '../types/crater';

interface TopAndLandingPageProps {
  craters: Crater[];
  selectedCrater: Crater;
  onSelectCrater: (crater: Crater) => void;
  onNavigateToDetail: (crater: Crater) => void;
}

function noiseVal(x: number, y: number, s: number): number {
  let h = s + x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return (h & 0x7fffffff) / 0x7fffffff;
}

export const TopAndLandingPage: React.FC<TopAndLandingPageProps> = ({
  craters,
  selectedCrater,
  onSelectCrater,
  onNavigateToDetail,
}) => {
  const [sortBy, setSortBy] = useState<'iceProbability' | 'diameter_km' | 'depthToDiameterRatio'>('iceProbability');
  const [minDiameter, setMinDiameter] = useState(10);
  const [minDdRatio, setMinDdRatio] = useState(0.05);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rec = selectedCrater.landingRecommendation;

  const sortedCraters = [...craters]
    .filter(c => c.diameter_km >= minDiameter && c.depthToDiameterRatio >= minDdRatio)
    .sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#0a0d16';
    ctx.fillRect(0, 0, w, h);

    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const n1 = noiseVal(Math.floor(x / 5), Math.floor(y / 5), 88);
        const n2 = noiseVal(Math.floor(x / 14), Math.floor(y / 14), 44);
        let base = n1 * 0.4 + n2 * 0.6;

        const cdx = x - w * 0.72;
        const cdy = y - h * 0.35;
        const cdist = Math.hypot(cdx, cdy);
        const craterR = Math.min(w, h) * 0.32;
        if (cdist < craterR * 1.3) {
          const t = cdist / craterR;
          if (t < 0.75) base *= 0.15 + t * 0.3;
          else if (t < 1.1) base = Math.min(1, base + 0.35);
        }

        const scdx = x - w * 0.35;
        const scdy = y - h * 0.32;
        const scdist = Math.hypot(scdx, scdy);
        if (scdist < craterR * 0.35) {
          base *= 0.3;
        }

        const grey = Math.floor(20 + base * 90);
        ctx.fillStyle = `rgb(${grey},${Math.floor(grey * 1.02)},${Math.floor(grey * 1.12)})`;
        ctx.fillRect(x, y, 2, 2);
      }
    }

    ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
    ctx.beginPath();
    ctx.arc(w * 0.72, h * 0.35, Math.min(w, h) * 0.36, -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(w * 0.35, h * 0.32, Math.min(w, h) * 0.1, 0, 2 * Math.PI);
    ctx.stroke();

    const lx = w * 0.32, ly = h * 0.75;
    const targetX = w * 0.62, targetY = h * 0.48;

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.quadraticCurveTo(w * 0.48, h * 0.6, targetX, targetY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#10b981';
    ctx.beginPath(); ctx.arc(lx, ly, 6, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(lx, ly, 13, 0, 2 * Math.PI); ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.fillRect(targetX - 5, targetY - 5, 10, 10);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(20, h - 30, 60, 2);
    ctx.fillRect(20, h - 34, 2, 6);
    ctx.fillRect(80, h - 34, 2, 6);
    ctx.font = '11px monospace';
    ctx.fillText('2 km', 34, h - 35);

    const nx = w - 30, ny = h - 30;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('N', nx - 4, ny - 16);
    ctx.beginPath();
    ctx.moveTo(nx, ny - 12); ctx.lineTo(nx - 4, ny); ctx.lineTo(nx + 4, ny);
    ctx.closePath(); ctx.fill();
  }, [selectedCrater]);

  const classBadge = (cls: string) => {
    if (cls === 'ICE_POSITIVE') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
    if (cls === 'AMBIGUOUS') return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
    return 'bg-rose-500/20 text-rose-400 border-rose-500/50';
  };

  const formatVol = (v: number) => {
    if (v >= 1e9) return `${(v / 1e9).toFixed(2)} × 10⁹`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(2)} × 10⁶`;
    return '-';
  };

  return (
    <div className="w-full h-full bg-[#060913] p-6 flex gap-6 overflow-hidden select-none font-sans">
      <div className="w-[52%] bg-[#090e1a] rounded-xl border border-[#1a2540] flex flex-col min-h-0 overflow-hidden">
        <div className="p-4 border-b border-[#14203a] shrink-0 font-mono">
          <h2 className="text-base font-extrabold text-white tracking-wide">TOP CRATERS</h2>
          <div className="text-xs text-slate-400 mt-0.5">Ranked by Ice Probability</div>

          <div className="flex items-center space-x-3 mt-3">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] text-slate-500">Sort By</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-[#0c1427] border border-[#1a2540] rounded-lg px-2.5 py-1 text-xs text-cyan-300 focus:outline-none"
              >
                <option value="iceProbability">Ice Probability</option>
                <option value="diameter_km">Diameter</option>
                <option value="depthToDiameterRatio">D/d Ratio</option>
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[10px] text-slate-500">Min Diameter (km)</label>
              <input
                type="number"
                value={minDiameter}
                onChange={e => setMinDiameter(Number(e.target.value))}
                className="bg-[#0c1427] border border-[#1a2540] rounded-lg px-2.5 py-1 w-16 text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[10px] text-slate-500">Min D/d Ratio</label>
              <input
                type="number"
                step="0.01"
                value={minDdRatio}
                onChange={e => setMinDdRatio(Number(e.target.value))}
                className="bg-[#0c1427] border border-[#1a2540] rounded-lg px-2.5 py-1 w-20 text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <button className="mt-4 px-3 py-1.5 bg-[#0c1427] border border-[#1a2540] rounded-lg text-xs text-slate-300 hover:text-cyan-300 flex items-center space-x-1.5 transition">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <table className="w-full text-left font-mono text-xs">
            <thead className="sticky top-0 bg-[#070b14] border-b border-[#14203a] text-slate-400 z-10">
              <tr>
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Crater ID</th>
                <th className="py-2.5 px-3">Diameter (km)</th>
                <th className="py-2.5 px-3">Ice Prob. (%)</th>
                <th className="py-2.5 px-3">Classification</th>
                <th className="py-2.5 px-3">Volume (m³)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#14203a]/50">
              {sortedCraters.map((c, idx) => {
                const isSelected = c.id === selectedCrater.id;
                return (
                  <tr
                    key={c.id}
                    onClick={() => {
                      onSelectCrater(c);
                      onNavigateToDetail(c);
                    }}
                    className={`cursor-pointer transition hover:bg-cyan-950/20 ${
                      isSelected ? 'bg-cyan-950/40' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-2.5 px-3 text-slate-200 font-extrabold">{c.id.substring(3, 10)}</td>
                    <td className="py-2.5 px-3 text-slate-300">{c.diameter_km}</td>
                    <td className="py-2.5 px-3">
                      <span className={`font-black ${
                        c.iceProbability > 70 ? 'text-emerald-400' : c.iceProbability > 40 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {c.iceProbability}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${classBadge(c.classification)}`}>
                        {c.classification === 'ICE_POSITIVE' ? 'Ice Positive' : c.classification === 'AMBIGUOUS' ? 'Ambiguous' : 'Negative'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{formatVol(c.volumeEstimate.iceVolume_m3)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="w-[48%] bg-[#090e1a] rounded-xl border border-[#1a2540] flex flex-col min-h-0 overflow-hidden">
        <div className="p-4 border-b border-[#14203a] shrink-0 font-mono">
          <h2 className="text-base font-extrabold text-white tracking-wide">LANDING SITE RECOMMENDATION</h2>
        </div>

        <div className="flex-1 relative min-h-0 p-4">
          <div className="relative w-full h-full rounded-xl overflow-hidden border border-[#1a2540]">
            <canvas ref={canvasRef} width={600} height={400} className="w-full h-full object-cover" />

            <div className="absolute top-4 left-4 bg-[#070b14]/90 border border-[#1a2a4a] rounded-xl p-3 text-xs font-mono text-slate-200 space-y-2 backdrop-blur-md shadow-xl">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Legend</div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                <span>Landing Site</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-0.5 bg-emerald-500 inline-block border-t border-dashed border-emerald-400"></span>
                <span>Safe Approach Zone</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-blue-500/50 inline-block border border-blue-400"></span>
                <span>Illuminated Terrain</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/50 inline-block border border-rose-400"></span>
                <span>Steep Slope (&gt;25°)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#14203a] shrink-0 font-mono bg-[#070b14]/50">
          <div className="text-xs text-slate-400 font-bold mb-3">Recommended Landing Site</div>
          <div className="grid grid-cols-4 gap-4 text-xs mb-3">
            <div>
              <span className="text-slate-500 block text-[10px]">Latitude</span>
              <span className="text-slate-100 font-extrabold">{rec.landingLat.toFixed(3)}° S</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Longitude</span>
              <span className="text-slate-100 font-extrabold">{rec.landingLon.toFixed(3)}° E</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Elevation</span>
              <span className="text-slate-100 font-extrabold">{(rec.landingElevation_m / 1000).toFixed(1)} km</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Illumination</span>
              <span className="text-amber-400 font-extrabold">{rec.rimIllumination_pct}%</span>
            </div>
          </div>

          <button className="w-full py-2 bg-[#0c1427] border border-cyan-500/50 rounded-lg text-xs font-mono text-cyan-300 hover:bg-cyan-950/50 transition flex items-center justify-center space-x-2 font-bold shadow-lg shadow-cyan-900/20">
            <Eye className="w-4 h-4" />
            <span>View in 3D</span>
          </button>
        </div>
      </div>
    </div>
  );
};
