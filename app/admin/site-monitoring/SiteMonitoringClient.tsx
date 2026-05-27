'use client';

import React, { useState, useMemo } from 'react';

interface Hospital {
  id: string;
  name: string;
  is_active: boolean;
}

interface Case {
  id: string;
  hospital_id: string;
  created_at: string;
  monitor_validated: boolean;
  locked: boolean;
}

interface FollowUp {
  case_id: string;
  followup_type: string;
  completed: boolean;
  mace: boolean;
}

interface Media {
  case_id: string;
  is_key_image: boolean;
}

interface CoreLabReview {
  case_id: string;
  quality_rating: string;
}

interface Objective {
  id: string;
  hospital_id: string;
  year: number;
  target_cases: number | null;
}

interface SiteMonitoringClientProps {
  hospitals: Hospital[];
  cases: Case[];
  followups: FollowUp[];
  media: Media[];
  coreLabReviews: CoreLabReview[];
  objectives: Objective[];
}

interface HospitalMetric {
  hospitalId: string;
  hospitalName: string;
  casesRegistered: number;
  casesCompleted: number;
  casesIncomplete: number;
  targetCases: number | null;
  completionPercentage: number;
  followup30Pending: number;
  followup6mPending: number;
  followup12mPending: number;
  imagesPending: number;
  coreLabPending: number;
  dataQualityScore: number;
  status: 'green' | 'amber' | 'red';
  lastCaseDate: string | null;
  daysSinceLastCase: number;
  alerts: string[];
}

export default function SiteMonitoringClient({
  hospitals,
  cases,
  followups,
  media,
  coreLabReviews,
  objectives,
}: SiteMonitoringClientProps) {
  const [selectedHospital, setSelectedHospital] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'green' | 'amber' | 'red'>('all');

  // Calculate metrics per hospital
  const hospitalMetrics = useMemo(() => {
    return hospitals.map((hospital) => {
      const hospitalCases = cases.filter((c) => c.hospital_id === hospital.id);
      const hospitalFollowups = followups.filter((f) =>
        hospitalCases.some((c) => c.id === f.case_id)
      );
      const hospitalMedia = media.filter((m) =>
        hospitalCases.some((c) => c.id === m.case_id)
      );
      const hospitalCoreLabReviews = coreLabReviews.filter((r) =>
        hospitalCases.some((c) => c.id === r.case_id)
      );

      const casesRegistered = hospitalCases.length;
      const casesCompleted = hospitalCases.filter(
        (c) => c.monitor_validated && c.locked
      ).length;
      const casesIncomplete = casesRegistered - casesCompleted;

      const objective = objectives.find((o) => o.hospital_id === hospital.id);
      const targetCases = objective?.target_cases || null;
      const completionPercentage =
        targetCases && targetCases > 0
          ? (casesRegistered / targetCases) * 100
          : 0;

      // Follow-up pending
      const followup30Pending = hospitalFollowups.filter(
        (f) => f.followup_type === '30days' && !f.completed
      ).length;
      const followup6mPending = hospitalFollowups.filter(
        (f) => f.followup_type === '6months' && !f.completed
      ).length;
      const followup12mPending = hospitalFollowups.filter(
        (f) => f.followup_type === '12months' && !f.completed
      ).length;

      // Images and core lab pending
      const imagesPending = hospitalCases.filter(
        (c) => !hospitalMedia.some((m) => m.case_id === c.id && m.is_key_image)
      ).length;

      const coreLabPending = hospitalCases.filter(
        (c) => !hospitalCoreLabReviews.some((r) => r.case_id === c.id)
      ).length;

      // Data quality score (0-100)
      let qualityScore = 100;
      if (casesIncomplete / casesRegistered > 0.3) qualityScore -= 20;
      if (followup30Pending + followup6mPending + followup12mPending > casesRegistered * 0.2)
        qualityScore -= 15;
      if (imagesPending / casesRegistered > 0.2) qualityScore -= 15;
      if (coreLabPending / casesRegistered > 0.2) qualityScore -= 10;
      qualityScore = Math.max(0, qualityScore);

      // Status logic
      let status: 'green' | 'amber' | 'red' = 'red';
      const lastCase = hospitalCases.length > 0
        ? new Date(
            Math.max(
              ...hospitalCases.map((c) => new Date(c.created_at).getTime())
            )
          )
        : null;
      const daysSinceLastCase = lastCase
        ? Math.floor(
            (new Date().getTime() - lastCase.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 999;

      const allFollowupDone =
        followup30Pending + followup6mPending + followup12mPending === 0;

      if (completionPercentage > 80 && qualityScore > 80 && allFollowupDone) {
        status = 'green';
      } else if (
        completionPercentage > 40 &&
        (casesIncomplete < casesRegistered * 0.3 ||
          followup30Pending + followup6mPending + followup12mPending < casesRegistered * 0.3)
      ) {
        status = 'amber';
      }

      // Alerts
      const alerts: string[] = [];
      if (casesRegistered === 0) alerts.push('Sin casos registrados');
      if (daysSinceLastCase > 15) alerts.push(`Sin actividad ${daysSinceLastCase} días`);
      if (casesIncomplete > casesRegistered * 0.3)
        alerts.push(`${casesIncomplete} casos incompletos`);
      if (followup30Pending > 0)
        alerts.push(`${followup30Pending} follow-up 30d pendiente`);
      if (imagesPending > casesRegistered * 0.2)
        alerts.push(`${imagesPending} casos sin imágenes`);
      if (coreLabPending > casesRegistered * 0.2)
        alerts.push(`${coreLabPending} casos sin validación`);

      return {
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        casesRegistered,
        casesCompleted,
        casesIncomplete,
        targetCases,
        completionPercentage,
        followup30Pending,
        followup6mPending,
        followup12mPending,
        imagesPending,
        coreLabPending,
        dataQualityScore: qualityScore,
        status,
        lastCaseDate: lastCase?.toISOString() || null,
        daysSinceLastCase,
        alerts,
      };
    });
  }, [hospitals, cases, followups, media, coreLabReviews, objectives]);

  // Filter metrics
  const filteredMetrics = useMemo(() => {
    return hospitalMetrics.filter((m) => {
      if (selectedHospital !== 'all' && m.hospitalId !== selectedHospital)
        return false;
      if (selectedStatus !== 'all' && m.status !== selectedStatus) return false;
      return true;
    });
  }, [hospitalMetrics, selectedHospital, selectedStatus]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    return {
      totalCases: hospitalMetrics.reduce((sum, h) => sum + h.casesRegistered, 0),
      totalCompleted: hospitalMetrics.reduce((sum, h) => sum + h.casesCompleted, 0),
      avgQuality: Math.round(
        hospitalMetrics.reduce((sum, h) => sum + h.dataQualityScore, 0) /
          hospitalMetrics.length
      ),
      greenCenters: hospitalMetrics.filter((h) => h.status === 'green').length,
      amberCenters: hospitalMetrics.filter((h) => h.status === 'amber').length,
      redCenters: hospitalMetrics.filter((h) => h.status === 'red').length,
      totalAlerts: hospitalMetrics.reduce((sum, h) => sum + h.alerts.length, 0),
    };
  }, [hospitalMetrics]);

  // Get all alerts
  const allAlerts = useMemo(() => {
    return filteredMetrics
      .flatMap((m) =>
        m.alerts.map((alert) => ({
          hospitalName: m.hospitalName,
          alert,
          status: m.status,
        }))
      )
      .slice(0, 10);
  }, [filteredMetrics]);

  return (
    <div className="space-y-6">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
            Casos Totales
          </span>
          <span className="text-2xl font-bold text-cyan-400">
            {summaryStats.totalCases}
          </span>
          <p className="text-xs text-slate-500">
            {summaryStats.totalCompleted} completados
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
            Centros Green
          </span>
          <span className="text-2xl font-bold text-emerald-400">
            {summaryStats.greenCenters}
          </span>
          <p className="text-xs text-slate-500">En objetivo</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
            Centros Amber
          </span>
          <span className="text-2xl font-bold text-yellow-400">
            {summaryStats.amberCenters}
          </span>
          <p className="text-xs text-slate-500">En riesgo</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
            Centros Red
          </span>
          <span className="text-2xl font-bold text-red-400">
            {summaryStats.redCenters}
          </span>
          <p className="text-xs text-slate-500">Bajo objetivo</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
            Calidad Promedio
          </span>
          <span className="text-2xl font-bold text-purple-400">
            {summaryStats.avgQuality}
          </span>
          <p className="text-xs text-slate-500">Data quality score</p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-wider">
            Centro
          </label>
          <select
            value={selectedHospital}
            onChange={(e) => setSelectedHospital(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Todos los centros</option>
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-wider">
            Estado
          </label>
          <select
            value={selectedStatus}
            onChange={(e) =>
              setSelectedStatus(e.target.value as 'all' | 'green' | 'amber' | 'red')
            }
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Todos los estados</option>
            <option value="green">✓ Green</option>
            <option value="amber">⚠ Amber</option>
            <option value="red">✗ Red</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setSelectedHospital('all');
              setSelectedStatus('all');
            }}
            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-sm font-medium transition-all"
          >
            Resetear filtros
          </button>
        </div>
      </div>

      {/* Alerts Panel */}
      {allAlerts.length > 0 && (
        <div className="bg-slate-900 border border-red-800/40 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-red-400">
              ⚠ {summaryStats.totalAlerts} Alertas Activas
            </h3>
            <span className="text-[10px] font-mono text-slate-500">
              {allAlerts.length} mostradas
            </span>
          </div>
          <div className="space-y-2">
            {allAlerts.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between p-3 bg-slate-950/50 border border-slate-800 rounded-lg"
              >
                <div>
                  <span className="text-sm font-bold text-slate-100">
                    {item.hospitalName}
                  </span>
                  <p className="text-xs text-slate-400 mt-1">{item.alert}</p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded ${
                    item.status === 'red'
                      ? 'bg-red-950/60 text-red-400'
                      : item.status === 'amber'
                        ? 'bg-yellow-950/60 text-yellow-400'
                        : 'bg-emerald-950/60 text-emerald-400'
                  }`}
                >
                  {item.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hospital Cards */}
      {filteredMetrics.length > 0 ? (
        <div className="space-y-4">
          {filteredMetrics.map((metric) => (
            <div
              key={metric.hospitalId}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6"
            >
              {/* Header con semáforo */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-slate-50">
                    {metric.hospitalName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {metric.casesRegistered} casos registrados
                  </p>
                </div>
                <div className="text-right">
                  <div
                    className={`text-4xl font-bold ${
                      metric.status === 'green'
                        ? 'text-emerald-400'
                        : metric.status === 'amber'
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    }`}
                  >
                    {metric.status === 'green'
                      ? '●'
                      : metric.status === 'amber'
                        ? '●'
                        : '●'}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {metric.status.toUpperCase()} STATUS
                  </p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* Completion */}
                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-center">
                  <span className="text-[10px] font-mono text-slate-400 block mb-2 uppercase">
                    Cumplimiento
                  </span>
                  <span className="text-xl font-bold text-cyan-400">
                    {metric.completionPercentage.toFixed(0)}%
                  </span>
                  {metric.targetCases && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      {metric.casesRegistered}/{metric.targetCases}
                    </p>
                  )}
                </div>

                {/* Quality Score */}
                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-center">
                  <span className="text-[10px] font-mono text-slate-400 block mb-2 uppercase">
                    Data Quality
                  </span>
                  <span className="text-xl font-bold text-purple-400">
                    {metric.dataQualityScore}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">/100</p>
                </div>

                {/* Follow-up 30 */}
                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-center">
                  <span className="text-[10px] font-mono text-slate-400 block mb-2 uppercase">
                    FU 30d
                  </span>
                  <span
                    className={`text-xl font-bold ${
                      metric.followup30Pending === 0
                        ? 'text-emerald-400'
                        : 'text-yellow-400'
                    }`}
                  >
                    {metric.followup30Pending}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">pendiente</p>
                </div>

                {/* Follow-up 6m */}
                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-center">
                  <span className="text-[10px] font-mono text-slate-400 block mb-2 uppercase">
                    FU 6m
                  </span>
                  <span
                    className={`text-xl font-bold ${
                      metric.followup6mPending === 0
                        ? 'text-emerald-400'
                        : 'text-yellow-400'
                    }`}
                  >
                    {metric.followup6mPending}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">pendiente</p>
                </div>

                {/* Images */}
                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-center">
                  <span className="text-[10px] font-mono text-slate-400 block mb-2 uppercase">
                    Imágenes
                  </span>
                  <span
                    className={`text-xl font-bold ${
                      metric.imagesPending === 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {metric.imagesPending}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">sin cargar</p>
                </div>

                {/* Core Lab */}
                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-center">
                  <span className="text-[10px] font-mono text-slate-400 block mb-2 uppercase">
                    Core Lab
                  </span>
                  <span
                    className={`text-xl font-bold ${
                      metric.coreLabPending === 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {metric.coreLabPending}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">sin validar</p>
                </div>
              </div>

              {/* Activity Info */}
              <div className="flex items-center justify-between bg-slate-950/40 border border-slate-800/50 rounded-lg p-4">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">
                    Última actividad
                  </span>
                  <span className="text-sm font-bold text-slate-100 mt-1">
                    {metric.daysSinceLastCase === 999
                      ? 'Sin casos'
                      : `${metric.daysSinceLastCase} días atrás`}
                  </span>
                </div>
                {metric.alerts.length > 0 && (
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-red-400 uppercase block font-bold">
                      {metric.alerts.length} alertas
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <svg
            className="w-12 h-12 mx-auto text-slate-600 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 12a3 3 0 100-6 3 3 0 000 6zM7 6h.01M17 12a3 3 0 100-6 3 3 0 000 6zM17 6h.01M7 18a3 3 0 100-6 3 3 0 000 6zM7 12h.01M17 18a3 3 0 100-6 3 3 0 000 6zM17 12h.01"
            />
          </svg>
          <p className="text-slate-400 text-sm">
            No hay centros que coincidan con los filtros seleccionados.
          </p>
        </div>
      )}

      {/* Export Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Exportar Datos</h3>
            <p className="text-xs text-slate-500 mt-1">
              Descarga reportes de monitoreo y casos pendientes
            </p>
          </div>
          <div className="flex gap-3">
            <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 px-4 py-2 rounded-xl text-sm font-bold transition-all">
              CSV Monitoreo
            </button>
            <button className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-400 px-4 py-2 rounded-xl text-sm font-bold transition-all">
              CSV Pendientes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
