import React, { useState } from 'react';
import { Settings, Sliders, Palette } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [iceThickness, setIceThickness] = useState(2.5);
  const [mixingModel, setMixingModel] = useState('MAXWELL_GARNETT');
  const [icePurity, setIcePurity] = useState(45);
  const [regolithDensity, setRegolithDensity] = useState(1.6);
  const [colorTheme, setColorTheme] = useState('LUNAR_CYAN');

  return (
    <div className="w-full h-full bg-[#060913] p-8 overflow-y-auto font-sans select-none space-y-6 text-slate-200">
      <div className="border-b border-[#14203a] pb-4">
        <h1 className="text-2xl font-extrabold font-mono text-white tracking-wide flex items-center space-x-3">
          <Settings className="w-6 h-6 text-cyan-400" />
          <span>APPLICATION & ICE MODEL SETTINGS</span>
        </h1>
        <p className="text-sm text-slate-400 font-mono mt-1">
          Configure physical ice volume parameters, polarimetric threshold boundaries, and display themes
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 font-mono">
        <div className="bg-[#090e1a] rounded-xl border border-[#1a2540] p-5 space-y-4">
          <div className="flex items-center space-x-2 text-cyan-300 font-bold text-sm">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Subsurface Ice Estimation Parameters</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Effective Ice Layer Thickness (meters): {iceThickness}m</label>
              <input
                type="range"
                min="0.5"
                max="10.0"
                step="0.5"
                value={iceThickness}
                onChange={e => setIceThickness(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Dielectric Mixing Model</label>
              <select
                value={mixingModel}
                onChange={e => setMixingModel(e.target.value)}
                className="w-full bg-[#070b14] border border-[#1a2540] rounded-lg p-2 text-xs text-cyan-300 focus:outline-none"
              >
                <option value="MAXWELL_GARNETT">Maxwell-Garnett Inclusion Model</option>
                <option value="BIRCHAK_REFRACTIVE">Birchak Refractive Index Model</option>
                <option value="LOOYENGA">Looyenga Volumetric Scattering Model</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Volumetric Ice Purity (%): {icePurity}%</label>
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={icePurity}
                onChange={e => setIcePurity(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Lunar Regolith Bulk Density (g/cm³)</label>
              <input
                type="number"
                step="0.1"
                value={regolithDensity}
                onChange={e => setRegolithDensity(Number(e.target.value))}
                className="w-full bg-[#070b14] border border-[#1a2540] rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#090e1a] rounded-xl border border-[#1a2540] p-5 space-y-4">
          <div className="flex items-center space-x-2 text-purple-300 font-bold text-sm">
            <Palette className="w-4 h-4 text-purple-400" />
            <span>Display & Map Visuals</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Radar CPR Heatmap Theme</label>
              <select
                value={colorTheme}
                onChange={e => setColorTheme(e.target.value)}
                className="w-full bg-[#070b14] border border-[#1a2540] rounded-lg p-2 text-xs text-purple-300 focus:outline-none"
              >
                <option value="LUNAR_CYAN">ISRO Standard (Purple - Blue - Green - Yellow)</option>
                <option value="THERMAL">NASA MoonTrek Thermal (Blue - Yellow - Red)</option>
                <option value="GREYSCALE">OHRC High Contrast Greyscale</option>
              </select>
            </div>

            <div className="pt-4 border-t border-[#14203a]">
              <button className="w-full py-2 bg-cyan-500 text-black font-bold font-mono rounded-lg hover:bg-cyan-400 transition shadow-lg shadow-cyan-900/30">
                Save & Apply Configuration
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
