import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Crosshair, Layers } from 'lucide-react';
import { Crater } from '../types/crater';
import { Moon3DGlobe } from './Moon3DGlobe';
import { SouthPoleMap } from './SouthPoleMapV2';

interface OverviewPageProps {
  craters: Crater[];
  selectedCrater: Crater | null;
  onSelectCrater: (crater: Crater) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  craters,
  selectedCrater,
  onSelectCrater,
}) => {
  const [viewMode, setViewMode] = useState<'3D' | '2D'>('3D');
  const [layers, setLayers] = useState({
    dfsar: true,
    ohrc: true,
    psr: true,
    illumination: true,
  });

  const icePos = craters.filter(c => c.classification === 'ICE_POSITIVE').length;
  const ambig = craters.filter(c => c.classification === 'AMBIGUOUS').length;
  const neg = craters.filter(c => c.classification === 'ICE_NEGATIVE').length;

  return (
    <div className="relative w-full h-full bg-[#060913] flex flex-col overflow-hidden select-none">
      {/* Top Header Strip */}
      <div className="px-6 py-3 flex items-center justify-between border-b border-[#14203a] shrink-0 bg-[#070b14]/90 backdrop-blur z-20">
        <div>
          <h1 className="text-base font-extrabold font-mono text-slate-100 tracking-wider flex items-center space-x-3">
            <span>SOUTH POLE OVERVIEW</span>
            <span className="text-xs font-normal text-slate-500 font-sans">80°S - 90°S Region</span>
          </h1>
        </div>

        {/* Ice Probability Gradient Legend */}
        <div className="flex items-center space-x-3 bg-[#0c1427]/80 border border-[#1a2540] px-4 py-1.5 rounded-lg">
          <span className="text-xs text-slate-400 font-mono font-medium">Ice Probability (%)</span>
          <div className="flex flex-col items-center">
            <div
              className="w-36 h-2.5 rounded-sm"
              style={{
                background: 'linear-gradient(to right, #8b5cf6, #3b82f6, #10b981, #f59e0b, #ef4444)',
              }}
            ></div>
            <div className="flex justify-between w-full text-[9px] font-mono text-slate-400 mt-0.5">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Full-Screen Map / 3D Globe Container */}
      <div className="relative flex-1 min-h-0 w-full">
        {viewMode === '3D' ? (
          <Moon3DGlobe
            craters={craters}
            selectedCrater={selectedCrater}
            onSelectCrater={onSelectCrater}
            layers={layers}
          />
        ) : (
          <SouthPoleMap
            craters={craters}
            selectedCrater={selectedCrater}
            onSelectCrater={onSelectCrater}
          />
        )}

        {/* Map Layer Controls Box */}
        <div className="absolute top-4 right-16 bg-[#0a1020]/90 border border-[#1a2a4a] rounded-xl p-3.5 text-xs font-mono backdrop-blur-md shadow-2xl z-20 space-y-2 min-w-48">
          <div className="text-[11px] text-slate-400 font-bold tracking-wider uppercase flex items-center space-x-1.5 mb-2">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Map Layers</span>
          </div>
          {[
            { key: 'dfsar', label: 'DFSAR Backscatter' },
            { key: 'ohrc', label: 'OHRC Mosaic' },
            { key: 'psr', label: 'PSR Boundaries' },
            { key: 'illumination', label: 'Illumination Overlay' },
          ].map(l => (
            <label
              key={l.key}
              className="flex items-center space-x-2.5 text-slate-200 cursor-pointer hover:text-cyan-300 transition"
            >
              <input
                type="checkbox"
                checked={(layers as any)[l.key]}
                onChange={() => setLayers(p => ({ ...p, [l.key]: !(p as any)[l.key] }))}
                className="accent-cyan-400 w-3.5 h-3.5 rounded border-slate-700 cursor-pointer"
              />
              <span className="text-[11px]">{l.label}</span>
            </label>
          ))}
        </div>

        {/* Zoom & 2D/3D Mode Controls */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2 bg-[#0a1020]/90 border border-[#1a2a4a] rounded-xl p-1.5 backdrop-blur-md z-20 shadow-xl">
          <button
            onClick={() => setViewMode(v => (v === '3D' ? '2D' : '3D'))}
            className={`px-2 py-1.5 rounded-lg text-xs font-mono font-extrabold transition ${
              viewMode === '3D'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Toggle 3D Globe / 2D Map"
          >
            3D
          </button>
          <div className="w-full h-px bg-slate-800"></div>
          <button className="p-2 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 rounded-lg transition" title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 rounded-lg transition" title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 rounded-lg transition" title="Recenter">
            <Crosshair className="w-4 h-4" />
          </button>
        </div>

        {/* Total Craters Legend Box */}
        <div className="absolute bottom-5 left-6 bg-[#0a1020]/90 border border-[#1a2a4a] rounded-xl px-4 py-3 backdrop-blur-md z-20 shadow-2xl min-w-44">
          <div className="text-xs font-mono text-slate-200 font-bold mb-2">
            Total Craters: <span className="text-cyan-300 text-sm font-extrabold">{craters.length}</span>
          </div>
          <div className="space-y-1 text-[11px] font-mono">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block shadow-sm shadow-emerald-500/50"></span>
              <span className="text-slate-300">Positive: <b className="text-emerald-400 font-extrabold">{icePos}</b></span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block"></span>
              <span className="text-slate-300">Ambiguous: <b className="text-amber-400 font-extrabold">{ambig}</b></span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block"></span>
              <span className="text-slate-300">Negative: <b className="text-blue-400 font-extrabold">{neg}</b></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
