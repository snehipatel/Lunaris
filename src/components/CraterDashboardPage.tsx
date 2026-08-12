import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, GitCompare } from 'lucide-react';
import { Crater } from '../types/crater';

interface CraterDashboardPageProps {
  crater: Crater;
  onBackToOverview: () => void;
}

function noiseVal(x: number, y: number, s: number): number {
  let h = s + x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return (h & 0x7fffffff) / 0x7fffffff;
}

export const CraterDashboardPage: React.FC<CraterDashboardPageProps> = ({ crater, onBackToOverview }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'radar' | 'morphometry' | 'ice' | 'provenance'>('overview');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'radar', label: 'Radar Analysis' },
    { id: 'morphometry', label: 'Morphometry' },
    { id: 'ice', label: 'Ice & Volume' },
    { id: 'provenance', label: 'Data Provenance' },
  ] as const;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.38;

    ctx.fillStyle = '#0a0d16';
    ctx.fillRect(0, 0, w, h);

    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.hypot(dx, dy);

        const n1 = noiseVal(Math.floor(x / 6), Math.floor(y / 6), 11);
        const n2 = noiseVal(Math.floor(x / 14), Math.floor(y / 14), 22);
        const n3 = noiseVal(Math.floor(x / 30), Math.floor(y / 30), 33);
        let base = n1 * 0.3 + n2 * 0.4 + n3 * 0.3;

        if (dist < radius * 1.3) {
          const t = dist / radius;
          if (t < 0.7) {
            base *= 0.2 + t * 0.3;
          } else if (t < 1.05) {
            base = Math.min(1, base + 0.35 * (1 - Math.abs(t - 0.95) / 0.15));
          }
        }

        const grey = Math.floor(18 + base * 95);
        ctx.fillStyle = `rgb(${grey},${Math.floor(grey * 1.02)},${Math.floor(grey * 1.1)})`;
        ctx.fillRect(x, y, 2, 2);
      }
    }

    for (let y = 0; y < h; y += 3) {
      for (let x = 0; x < w; x += 3) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.hypot(dx, dy);

        if (dist < radius * 0.85) {
          const t = dist / (radius * 0.85);
          const n1 = noiseVal(Math.floor(x / 4), Math.floor(y / 4), 42);
          const n2 = noiseVal(Math.floor(x / 10), Math.floor(y / 10), 77);

          let val = n1 * 0.5 + n2 * 0.5;
          if (t < 0.6) {
            val = Math.min(1, val + (0.6 - t) * crater.cpr * 0.55);
          }

          let r = 0, g = 0, b = 0;
          if (val < 0.25) {
            r = 60; g = 20; b = 160;
          } else if (val < 0.5) {
            const f = (val - 0.25) / 0.25;
            r = 20; g = Math.floor(f * 180); b = Math.floor(220 - f * 40);
          } else if (val < 0.75) {
            const f = (val - 0.5) / 0.25;
            r = Math.floor(f * 180); g = 220; b = Math.floor(40 * (1 - f));
          } else {
            const f = (val - 0.75) / 0.25;
            r = 240; g = Math.floor(220 - f * 60); b = 20;
          }

          ctx.fillStyle = `rgba(${r},${g},${b},0.65)`;
          ctx.fillRect(x, y, 3, 3);
        }
      }
    }

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.lineWidth = 1;
    [0.3, 0.6, 0.85].forEach(rRatio => {
      ctx.beginPath();
      ctx.arc(cx, cy, radius * rRatio, 0, 2 * Math.PI);
      ctx.setLineDash([3, 4]);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    for (let a = 0; a < 360; a += 45) {
      const rad = (a * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + radius * 0.85 * Math.sin(rad), cy - radius * 0.85 * Math.cos(rad));
      ctx.stroke();
    }
  }, [crater]);

  const classColor = crater.classification === 'ICE_POSITIVE'
    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
    : crater.classification === 'AMBIGUOUS'
    ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
    : 'bg-rose-500/20 text-rose-400 border-rose-500/50';

  const confColor = crater.confidence === 'HIGH'
    ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
    : 'bg-slate-500/20 text-slate-400 border-slate-500/50';

  return (
    <div className="w-full h-full bg-[#060913] flex flex-col overflow-y-auto font-sans select-none p-6 space-y-4">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-[#14203a] pb-3 shrink-0">
        <div>
          <button
            onClick={onBackToOverview}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 mb-1 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Overview</span>
          </button>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-extrabold font-mono text-white tracking-wide">
              Crater ID: {crater.id.replace('SP_', 'SP_').substring(0, 10)}
            </h1>
            <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${classColor}`}>
              {crater.classification.replace('_', ' ')}
            </span>
            <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${confColor}`}>
              {crater.confidence} Confidence
            </span>
          </div>
        </div>

        <button className="px-3 py-1.5 bg-[#0c1427] border border-[#1a2540] rounded-lg text-xs font-mono text-slate-300 hover:text-cyan-300 flex items-center space-x-1.5 transition">
          <GitCompare className="w-3.5 h-3.5 text-cyan-400" />
          <span>Add to Compare</span>
        </button>
      </div>

      {/* Sub-tabs Bar */}
      <div className="flex space-x-2 border-b border-[#14203a] pb-1 shrink-0 font-mono">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2 text-xs font-medium rounded-t-lg transition border-b-2 ${
              activeTab === t.id
                ? 'text-cyan-300 border-cyan-400 bg-cyan-500/10'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 bg-[#090e1a] rounded-xl border border-[#1a2540] p-4 flex flex-col relative overflow-hidden">
          <div className="absolute top-3 left-4 text-xs font-mono font-bold text-slate-200 bg-[#070b14]/80 px-2.5 py-1 rounded border border-slate-800 z-10">
            CPR Map Overlay
          </div>

          <div className="flex-1 relative rounded-lg overflow-hidden flex items-center justify-center min-h-[360px]">
            <canvas ref={canvasRef} width={640} height={420} className="w-full h-full object-cover rounded-lg" />

            <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#070b14]/90 border border-slate-800 rounded-lg p-2 flex flex-col items-center shadow-xl">
              <span className="text-[9px] font-mono text-slate-400 mb-1">CPR</span>
              <div
                className="w-3.5 h-36 rounded-sm"
                style={{
                  background: 'linear-gradient(to bottom, #f0e020, #10b981, #3b82f6, #6b21a8)',
                }}
              ></div>
              <div className="flex flex-col justify-between h-36 text-[8px] font-mono text-slate-300 ml-1 absolute right-1">
                <span>2.0</span>
                <span>1.5</span>
                <span>1.0</span>
                <span>0.5</span>
                <span>0</span>
              </div>
            </div>
          </div>

          <div className="mt-3 bg-[#0c1427] rounded-lg border border-[#1a2540] p-3">
            <div className="text-xs font-mono text-slate-400 font-bold mb-2">Radar Derived Values</div>
            <div className="grid grid-cols-8 gap-3 text-center font-mono">
              {[
                ['CPR', crater.cpr, 'text-emerald-400'],
                ['DOP', crater.dop, 'text-cyan-400'],
                ['Entropy', crater.decomposition.entropy, 'text-slate-200'],
                ['Alpha (°)', crater.decomposition.alpha, 'text-slate-200'],
                ['m-chi', (crater.decomposition.mChi.volumetric / 100).toFixed(2), 'text-slate-200'],
                ['σ0 HH (dB)', crater.backscatter.sigmaHH, 'text-slate-200'],
                ['σ0 HV (dB)', crater.backscatter.sigmaHV, 'text-slate-200'],
                ['σ0 VV (dB)', crater.backscatter.sigmaVV, 'text-slate-200'],
              ].map(([label, val, color]) => (
                <div key={label as string} className="bg-[#070c18] p-1.5 rounded border border-[#14203a]">
                  <div className="text-[9px] text-slate-500">{label as string}</div>
                  <div className={`text-xs font-extrabold ${color}`}>{val as any}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-[320px] shrink-0 space-y-4 flex flex-col">
          <div className="bg-[#090e1a] rounded-xl border border-[#1a2540] p-4 font-mono">
            <div className="text-xs text-slate-400 font-bold mb-3 uppercase tracking-wider">Crater Information</div>
            <div className="space-y-2 text-xs">
              {[
                ['Latitude', `${crater.lat.toFixed(3)}° S`],
                ['Longitude', `${crater.lon.toFixed(3)}° E`],
                ['Diameter', `${crater.diameter_km} km`],
                ['Depth', `${crater.depth_km} km`],
                ['D/d Ratio', `${crater.depthToDiameterRatio}`],
                ['PSR Status', 'Doubly Shadowed'],
                ['Rim Freshness', crater.morphometry.rimFreshness],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-0.5 border-b border-[#14203a]/50">
                  <span className="text-slate-500">{k}</span>
                  <span className="text-slate-200 font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#090e1a] rounded-xl border border-[#1a2540] p-4 text-center font-mono">
            <div className="text-xs text-slate-400 font-bold mb-1">Ice Probability</div>
            <div className={`text-3xl font-black ${
              crater.iceProbability > 70 ? 'text-emerald-400' : crater.iceProbability > 40 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {crater.iceProbability}%
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
              <div
                style={{ width: `${crater.iceProbability}%` }}
                className="bg-emerald-500 h-full rounded-full"
              ></div>
            </div>
            <div className="flex justify-between text-xs mt-3 pt-2 border-t border-[#14203a]">
              <div>
                <span className="text-slate-500 block text-[10px]">Classification</span>
                <span className="text-emerald-400 font-bold">{crater.classification.replace('_', ' ')}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px]">Confidence</span>
                <span className="text-cyan-400 font-bold">{crater.confidence}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#090e1a] rounded-xl border border-[#1a2540] p-3 flex-1 flex flex-col font-mono">
            <div className="text-xs text-slate-400 font-bold mb-2">OHRC Rim/Wall Image</div>
            <div className="flex-1 bg-[#070c18] rounded-lg border border-[#14203a] relative overflow-hidden flex items-center justify-center min-h-[100px]">
              <div
                className="absolute inset-0 opacity-80"
                style={{
                  background: 'radial-gradient(circle at 60% 70%, #1e293b 0%, #070c18 80%)',
                }}
              ></div>
              <span className="text-[10px] text-slate-500 relative z-10">{crater.provenance.ohrcFile}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
