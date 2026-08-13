import React, { useState, useEffect } from 'react';
import { Download, Printer, ShieldCheck, FileText, CheckCircle2, Award, HardDrive, Calendar, FileSpreadsheet } from 'lucide-react';

export default function NTCAReportModal() {
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    fetch('/api/export/ntca')
      .then(res => res.json())
      .then(data => setReportData(data))
      .catch(err => console.error('Export fetch error:', err));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    if (!reportData) return;
    const headers = ['Tiger ID,Name,Sex,Estimated Home Range Area (sq km),Last Captured Date,Status\n'];
    const rows = reportData.tigerCatalog.map(t => `${t.id},"${t.name}",${t.sex},${t.estimatedAreaKm2},${t.lastCaptured},"${t.status}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PENCH_TIGER_CENSUS_REPORT_2026.csv`;
    a.click();
  };

  if (!reportData) {
    return <div className="p-12 text-center text-gray-400 font-mono">Loading Official NTCA Census Report...</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Printable Action Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-amber-800/40 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
            <Award className="w-4 h-4" />
            <span>Government Census & Intelligence Export</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">NTCA & M-STrIPES Compliant Census Report</h2>
          <p className="text-xs text-gray-400 mt-0.5">Ready for Field Officers, Principal Chief Conservator of Forests (PCCF) & NTCA Review</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownloadCSV}
            className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center space-x-2 shadow-lg"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Census CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black text-xs font-extrabold px-5 py-2.5 rounded-xl transition flex items-center space-x-2 shadow-lg"
          >
            <Printer className="w-4 h-4" />
            <span>📄 Print / Export Official PDF</span>
          </button>
        </div>
      </div>

      {/* Official Government Document Paper Preview */}
      <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-2xl space-y-8 font-serif border border-slate-300 print:shadow-none print:p-0">
        
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-6 flex items-start justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-widest text-emerald-800 font-sans">
              NATIONAL TIGER CONSERVATION AUTHORITY (NTCA) & MP FOREST DEPT
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              PENCH TIGER RESERVE — PHASE-IV TIGER CENSUS REPORT
            </h1>
            <p className="text-xs font-sans text-slate-600">
              Automated Camera Trap StripeID Classification & Spatial Movement Analysis • Season 2026
            </p>
          </div>

          <div className="text-right font-sans text-xs space-y-1">
            <span className="inline-block bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded font-bold">
              VERIFIED OFFICIAL
            </span>
            <div className="text-slate-500 text-[11px]">{new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {/* Executive Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-sans text-xs">
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="text-slate-500 text-[10px] uppercase font-bold">Total Tigers Identified</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{reportData.censusSummary.totalIdentifiedTigers}</div>
            <span className="text-[10px] text-slate-600">Individual Flank Signatures</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="text-slate-500 text-[10px] uppercase font-bold">Sex Ratio</div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {reportData.censusSummary.maleTigers} ♂ : {reportData.censusSummary.femaleTigers} ♀
            </div>
            <span className="text-[10px] text-slate-600">Breeding Dynamics</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="text-slate-500 text-[10px] uppercase font-bold">Active Camera Stations</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{reportData.censusSummary.totalCameraStations}</div>
            <span className="text-[10px] text-slate-600">Core & Buffer Grid</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="text-slate-500 text-[10px] uppercase font-bold">AI Triage Efficiency</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{reportData.metrics.aiBlankReductionRate}</div>
            <span className="text-[10px] text-slate-600">{reportData.metrics.blankImagesRemoved} Blanks Quarantined</span>
          </div>
        </div>

        {/* Individual Tigers Catalog Table */}
        <div className="space-y-3 font-sans">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b pb-2">
            Identified Tiger Individuals & Territory Measurements
          </h3>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 bg-slate-100 text-slate-700">
                <th className="py-2 px-3">Tiger ID</th>
                <th className="py-2 px-3">Name / Alias</th>
                <th className="py-2 px-3">Sex</th>
                <th className="py-2 px-3">Home Range Area</th>
                <th className="py-2 px-3">Last Recorded Capture</th>
                <th className="py-2 px-3">NTCA Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {reportData.tigerCatalog.map((t, idx) => (
                <tr key={t.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{t.id}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{t.name}</td>
                  <td className="py-2.5 px-3">{t.sex}</td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-emerald-800">{t.estimatedAreaKm2} sq km</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{t.lastCaptured}</td>
                  <td className="py-2.5 px-3">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Official Signatures Bar */}
        <div className="pt-8 border-t-2 border-slate-900 flex items-center justify-between text-xs font-sans">
          <div className="text-center space-y-8">
            <div className="font-serif italic text-slate-400">Dr. S. K. Sharma</div>
            <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
              Field Director, Pench Tiger Reserve
            </div>
          </div>

          <div className="text-center space-y-8">
            <div className="font-serif italic text-slate-400">NTCA Wildlife Biologist</div>
            <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
              Lead Scientist, Phase-IV Monitoring
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
