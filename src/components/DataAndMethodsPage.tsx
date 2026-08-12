import React from 'react';
import { Database, ExternalLink, ShieldCheck, BookOpen } from 'lucide-react';
import { Crater } from '../types/crater';

interface DataAndMethodsPageProps {
  crater: Crater;
}

export const DataAndMethodsPage: React.FC<DataAndMethodsPageProps> = ({ crater }) => {
  return (
    <div className="w-full h-full bg-[#060913] p-8 overflow-y-auto font-sans select-none space-y-6 text-slate-200">
      <div className="border-b border-[#14203a] pb-4">
        <h1 className="text-2xl font-extrabold font-mono text-white tracking-wide flex items-center space-x-3">
          <BookOpen className="w-6 h-6 text-cyan-400" />
          <span>DATA PROVENANCE & METHODOLOGY</span>
        </h1>
        <p className="text-sm text-slate-400 font-mono mt-1">
          Chandrayaan-2 Dual-Frequency SAR (DFSAR) & Orbiter High Resolution Camera (OHRC) Ice Detection Model
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#090e1a] rounded-xl border border-[#1a2540] p-5 space-y-3 font-mono">
          <div className="flex items-center space-x-2 text-cyan-300 font-bold text-sm">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>PRADAN Portal Integration</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Orbiter datasets are ingested directly from ISRO's PRADAN portal (pradan.issdc.gov.in/ch2).
            L-band Full Polarimetric (_fp_) imagery products are processed into ground-range detected (GRI) matrices.
          </p>

          <div className="bg-[#070b14] rounded-lg p-3 border border-[#14203a] space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-slate-500">DFSAR File:</span><span className="text-cyan-300">{crater.provenance.dfsarFile}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Mode:</span><span className="text-slate-200">{crater.provenance.dfsarMode}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Orbit:</span><span className="text-slate-200">{crater.provenance.dfsarOrbit}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Acquisition Date:</span><span className="text-slate-200">{crater.provenance.dfsarDate}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">OHRC Resolution:</span><span className="text-slate-200">{crater.provenance.ohrcRes_m} m/pixel</span></div>
          </div>

          <a
            href={crater.provenance.pradanPortalUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-2 text-xs text-cyan-400 hover:text-cyan-300 transition underline pt-1"
          >
            <span>Open ISRO PRADAN Data Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="bg-[#090e1a] rounded-xl border border-[#1a2540] p-5 space-y-3 font-mono">
          <div className="flex items-center space-x-2 text-emerald-300 font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>ISRO Ice Detection Criteria</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Subsurface water ice is characterized by enhanced coherent backscatter due to the Coherent Backscatter Enhancement Effect (CBEE).
            Candidate craters must satisfy dual polarimetric thresholds:
          </p>

          <div className="bg-[#070b14] rounded-lg p-3 border border-[#14203a] space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">1. Circular Polarization Ratio (CPR &gt; 1.0):</span>
              <span className={`font-bold ${crater.cpr > 1.0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {crater.cpr} {crater.cpr > 1.0 ? '✓ PASS' : '✗ FAIL'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">2. Degree of Polarization (DOP &lt; 0.13):</span>
              <span className={`font-bold ${crater.dop < 0.13 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {crater.dop} {crater.dop < 0.13 ? '✓ PASS' : '✗ FAIL'}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-1">
            <b>Resulting Classification:</b>{' '}
            <span className={crater.classification === 'ICE_POSITIVE' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {crater.classification.replace('_', ' ')} ({crater.iceProbability}% Probability)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
