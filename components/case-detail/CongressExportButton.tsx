import React from 'react';

export default function CongressExportButton() {
  return (
    <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-50 mb-1">Congress Export</h2>
          <p className="text-xs text-slate-400">
            Prepare publication-ready summary for scientific presentations and congresses
          </p>
        </div>

        <button
          disabled
          title="Feature coming soon"
          className="px-6 py-3 bg-slate-950 border border-slate-800 text-slate-500 rounded-xl text-xs font-bold transition-all cursor-not-allowed opacity-60 hover:opacity-60 flex items-center gap-2 whitespace-nowrap"
        >
          <span>📄</span>
          Generate Summary
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-6 pt-6 border-t border-slate-800">
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4">
          <p className="text-xs font-bold text-slate-400 mb-2">🚀 Coming Soon</p>
          <p className="text-xs text-slate-500 font-mono">
            Export anonymous case summary as publication-ready PDF with:
          </p>
          <ul className="mt-2 space-y-1 text-xs text-slate-500 font-mono ml-4">
            <li>✓ Anonymized patient and hospital information</li>
            <li>✓ Clinical timeline with key procedure metrics</li>
            <li>✓ AI analysis findings and strategy modifications</li>
            <li>✓ Optimization results and follow-up outcomes</li>
            <li>✓ Publication-ready formatting and layout</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
