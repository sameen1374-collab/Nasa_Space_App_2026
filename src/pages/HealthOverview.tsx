/**
 * NASA Space Apps Challenge 2026 — Astronaut Health Monitoring Software
 * Module: Health Overview & Baseline Comparison Page
 * Authors: Abdul Rafay (Lead), Sameen (Second Developer)
 * Clinical Evidence: Eman Saleem & Moazzama (Medical Research Leads)
 */

import React from 'react';
import { AstronautProfile, DailyAssessmentRecord, IndicatorId } from '../types/health';
import { Card } from '../components/common/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { RESEARCH_INDICATORS, MEDICAL_DISCLAIMER } from '../config/thresholds';
import {
  Activity,
  HeartPulse,
  Gauge,
  Droplet,
  Thermometer,
  Moon,
  Smile,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  Wind,
  Radio,
  Zap,
  Dumbbell,
  ExternalLink,
} from 'lucide-react';

interface HealthOverviewProps {
  profile: AstronautProfile;
  latestAssessment?: DailyAssessmentRecord;
}

export const HealthOverview: React.FC<HealthOverviewProps> = ({
  profile,
  latestAssessment,
}) => {
  const getIndicatorIcon = (id: string) => {
    switch (id) {
      case 'heartRate':
        return <HeartPulse className="w-4 h-4 text-rose-400" />;
      case 'systolicBP':
      case 'diastolicBP':
        return <Gauge className="w-4 h-4 text-blue-400" />;
      case 'respiratoryRate':
        return <Wind className="w-4 h-4 text-cyan-400" />;
      case 'spo2':
        return <Droplet className="w-4 h-4 text-sky-400" />;
      case 'bodyTemperature':
        return <Thermometer className="w-4 h-4 text-orange-400" />;
      case 'fastingGlucose':
        return <Zap className="w-4 h-4 text-purple-400" />;
      case 'sleepHours':
        return <Moon className="w-4 h-4 text-indigo-400" />;
      case 'cabinCO2':
        return <Radio className="w-4 h-4 text-emerald-400" />;
      case 'radiationDose':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'exerciseMinutes':
        return <Dumbbell className="w-4 h-4 text-teal-400" />;
      case 'mood':
        return <Smile className="w-4 h-4 text-emerald-300" />;
      default:
        return <Activity className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getBaselineString = (id: string): string => {
    switch (id) {
      case 'heartRate':
        return `${profile.restingHeartRateBaseline} BPM`;
      case 'systolicBP':
        return `${profile.bloodPressureBaseline.systolic} mmHg`;
      case 'diastolicBP':
        return `${profile.bloodPressureBaseline.diastolic} mmHg`;
      case 'bodyTemperature':
        return `${profile.bodyTemperatureBaseline.toFixed(1)} °C`;
      case 'sleepHours':
        return '8.0 Hours (Prescribed)';
      case 'exerciseMinutes':
        return '120 Min (Target)';
      case 'radiationDose':
        return `${profile.previousCareerRadiationDose || 0} mSv (Career Base)`;
      case 'spo2':
        return '≥ 96%';
      case 'respiratoryRate':
        return '14 breaths/min';
      case 'cabinCO2':
        return '≤ 3.0 mmHg';
      case 'fastingGlucose':
        return '90 mg/dL (Target)';
      case 'mood':
        return '4 — Nominal';
      default:
        return 'Nominal';
    }
  };

  const baselineMatrix = RESEARCH_INDICATORS.map((def) => {
    const result = latestAssessment?.results[def.id as IndicatorId];
    const isRecorded =
      result !== undefined &&
      result.valueDisplay !== 'N/A' &&
      result.valueDisplay !== 'Not recorded';

    const currentVal = isRecorded ? `${result.valueDisplay} ${def.unit}` : 'Not recorded';
    const status = isRecorded ? result.status : 'GREEN';
    const statusLabel = isRecorded ? (result.statusLabel || 'Nominal') : 'Not recorded';

    return {
      id: def.id,
      name: def.name,
      unit: def.unit,
      icon: getIndicatorIcon(def.id),
      baseline: getBaselineString(def.id),
      current: currentVal,
      status,
      statusLabel,
      nominalGreen: `${def.text.normal} ${def.unit}`,
      warningYellow: `${def.text.warning} ${def.unit}`,
      criticalRed: `${def.text.urgent} ${def.unit}`,
      clinicalContext: def.whyItMatters,
      basis: def.basis,
      sources: def.sources,
      teamChoice: def.teamChoice,
      teamChoiceNote: def.teamChoiceNote,
    };
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 font-sans tracking-wide">
              Health Overview & Baseline Telemetry
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-sans">
            Baseline comparison, active physiological thresholds, and clinical configuration for all 12 indicators
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs px-3 py-1.5 rounded-xl bg-space-900 border border-slate-800">
          <span className="text-slate-400">CLINICAL ENGINE:</span>
          <span className="text-cyan-300 font-bold">12 Monitored Indicators</span>
        </div>
      </div>

      {/* Medical Researcher Callout */}
      <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-slate-300 space-y-1.5 font-sans">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold">
            <Info className="w-4 h-4" />
            <span>CLINICAL EVIDENCE ENGINE (RESEARCH DATASET INTEGRATION)</span>
          </div>
          <span className="text-[11px] font-mono text-amber-300">
            {MEDICAL_DISCLAIMER.disclaimer}
          </span>
        </div>
        <p className="leading-relaxed">
          All thresholds displayed below are sourced directly from{' '}
          <code className="bg-space-900 px-1.5 py-0.5 rounded text-cyan-300 font-mono">
            src/data/research/indicators.json
          </code>
          . Range bands reflect evidence from NASA Human Research Program, NEWS2 scoring, CDC, and the American Heart Association.
        </p>
      </div>

      {/* 1. Baseline Comparison Matrix */}
      <Card
        glow="cyan"
        title="Crew Baseline vs. Current Reading Variance"
        subtitle={`Telemetry compared against Cmdr. ${profile.name}'s pre-flight biometric baselines`}
        icon={<Sliders className="w-4 h-4" />}
      >
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-space-950/60">
              <tr>
                <th className="py-3 px-3">Indicator</th>
                <th className="py-3 px-3">Pre-Flight Baseline</th>
                <th className="py-3 px-3">Latest Sol Reading</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Nominal Green Target</th>
                <th className="py-3 px-3">Warning Yellow Range</th>
                <th className="py-3 px-3">Urgent Red Boundary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {baselineMatrix.map((item) => (
                <tr key={item.id} className="hover:bg-space-850/40 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-200">
                    <div className="flex items-center gap-2 font-sans">
                      <span className="p-1 rounded bg-space-900 border border-slate-800">
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                      {item.teamChoice && (
                        <span
                          title={item.teamChoiceNote || 'Team-defined threshold, pending approval'}
                          className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-400 cursor-help"
                        >
                          Team
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-cyan-300 font-bold">{item.baseline}</td>
                  <td className="py-3 px-3 text-slate-100 font-bold">{item.current}</td>
                  <td className="py-3 px-3">
                    <StatusBadge status={item.status} label={item.statusLabel} size="sm" />
                  </td>
                  <td className="py-3 px-3 text-emerald-300">{item.nominalGreen}</td>
                  <td className="py-3 px-3 text-amber-300">{item.warningYellow}</td>
                  <td className="py-3 px-3 text-rose-400">{item.criticalRed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 2. Detailed Physiological Threshold Guide */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono mb-3">
          Microgravity Flight Rules & Threshold Definitions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {baselineMatrix.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-space-900/80 border border-slate-800 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <h4 className="font-sans font-semibold text-xs text-slate-200 uppercase">
                      {item.name}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-space-950 text-cyan-300 border border-slate-800">
                    {item.unit}
                  </span>
                </div>

                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  {item.clinicalContext}
                </p>

                <p className="text-[11px] text-slate-500 font-sans mt-1 italic">
                  Clinical Basis: {item.basis}
                </p>
              </div>

              {/* Threshold Tiers */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                <div className="flex items-center justify-between bg-emerald-950/30 px-2 py-1 rounded border border-emerald-500/20 text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>GREEN (Nominal)</span>
                  </span>
                  <span>{item.nominalGreen}</span>
                </div>

                <div className="flex items-center justify-between bg-amber-950/30 px-2 py-1 rounded border border-amber-500/20 text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span>YELLOW (Warning)</span>
                  </span>
                  <span className="truncate ml-2">{item.warningYellow}</span>
                </div>

                <div className="flex items-center justify-between bg-rose-950/30 px-2 py-1 rounded border border-rose-500/20 text-rose-300">
                  <span className="flex items-center gap-1.5">
                    <AlertOctagon className="w-3 h-3 text-rose-400" />
                    <span>RED (Urgent)</span>
                  </span>
                  <span>{item.criticalRed}</span>
                </div>

                {item.sources && item.sources.length > 0 && (
                  <div className="pt-2 flex items-center gap-2 flex-wrap text-[10px] font-mono text-slate-500">
                    <span>Evidence:</span>
                    {item.sources.map((s, idx) => (
                      <a
                        key={idx}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-0.5 underline transition-colors"
                      >
                        <span>{s.name}</span>
                        <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
