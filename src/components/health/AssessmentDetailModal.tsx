/**
 * NASA Space Apps Challenge 2026 — Astronaut Health Monitoring Software
 * Module: Assessment Record Detail Modal
 * Authors: Abdul Rafay (Lead), Sameen (Second Developer)
 */

import React from 'react';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { DailyAssessmentRecord, IndicatorResult } from '../../types/health';
import { MEDICAL_DISCLAIMER } from '../../config/thresholds';
import {
  HeartPulse,
  Gauge,
  Droplet,
  Thermometer,
  Moon,
  Smile,
  FileText,
  Activity,
  Wind,
  Radio,
  Zap,
  Dumbbell,
  Info,
} from 'lucide-react';

interface AssessmentDetailModalProps {
  record: DailyAssessmentRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AssessmentDetailModal: React.FC<AssessmentDetailModalProps> = ({
  record,
  isOpen,
  onClose,
}) => {
  if (!record) return null;

  const getIndicatorIcon = (id: string) => {
    switch (id) {
      case 'heartRate':
        return <HeartPulse className="w-4 h-4 text-rose-400" />;
      case 'systolicBP':
      case 'diastolicBP':
      case 'bloodPressure':
        return <Gauge className="w-4 h-4 text-blue-400" />;
      case 'respiratoryRate':
        return <Wind className="w-4 h-4 text-cyan-400" />;
      case 'spo2':
        return <Droplet className="w-4 h-4 text-sky-400" />;
      case 'bodyTemperature':
        return <Thermometer className="w-4 h-4 text-orange-400" />;
      case 'fastingGlucose':
      case 'bloodSugar':
        return <Zap className="w-4 h-4 text-purple-400" />;
      case 'sleepHours':
      case 'sleepDuration':
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

  // Primary 12 indicator keys
  const primaryKeys = [
    'heartRate',
    'systolicBP',
    'diastolicBP',
    'respiratoryRate',
    'spo2',
    'bodyTemperature',
    'fastingGlucose',
    'sleepHours',
    'cabinCO2',
    'radiationDose',
    'exerciseMinutes',
    'mood',
  ];

  const indicators: IndicatorResult[] = primaryKeys
    .map((k) => record.results[k])
    .filter(
      (ind): ind is IndicatorResult =>
        ind !== undefined && ind.valueDisplay !== 'N/A' && ind.valueDisplay !== 'Not recorded'
    );

  // If none of the new keys are present (e.g., in an old saved check-in), fall back to legacy keys
  if (indicators.length === 0) {
    if (record.results.heartRate) indicators.push(record.results.heartRate);
    if (record.results.bloodPressure) indicators.push(record.results.bloodPressure);
    if (record.results.bloodSugar) indicators.push(record.results.bloodSugar);
    if (record.results.bodyTemperature) indicators.push(record.results.bodyTemperature);
    if (record.results.sleepDuration) indicators.push(record.results.sleepDuration);
    if (record.results.mood) indicators.push(record.results.mood);
  }

  const formattedDate = new Date(record.timestamp).toLocaleString();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Telemetry Log — Sol ${record.missionDay}`}
      subtitle={`Recorded: ${formattedDate}`}
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Demonstration banner if sample data */}
        {record.isDemonstrationData && (
          <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between text-xs text-cyan-300 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>DEMONSTRATION RECORD — 14-SOL RESEARCH DATASET VALIDATION</span>
            </div>
            <span className="text-[10px] text-amber-300">
              {MEDICAL_DISCLAIMER.disclaimer}
            </span>
          </div>
        )}

        {/* Overall Assessment Banner */}
        <div className="p-4 rounded-xl bg-space-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase text-slate-400">Composite Triage:</span>
              <StatusBadge status={record.overall.status} label={record.overall.statusLabel} size="md" />
            </div>
            <p className="text-xs text-slate-300">{record.overall.summary}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="block font-mono text-2xl font-bold text-cyan-400">
              {record.overall.score}
              <span className="text-xs text-slate-400 font-normal">/100</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Health Index</span>
          </div>
        </div>

        {/* Indicators Grid Breakdown */}
        <div>
          <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
            <span>Logged Biometric Telemetry ({indicators.length} Indicators)</span>
            <span className="text-[10px] font-normal text-slate-500">NEWS2 / NASA Standards</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
            {indicators.map((ind) => (
              <div
                key={ind.indicatorId}
                className="p-3 rounded-xl bg-space-950/70 border border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-space-900 border border-slate-800">
                        {getIndicatorIcon(ind.indicatorId)}
                      </div>
                      <span className="text-xs font-semibold text-slate-200">
                        {ind.displayName}
                      </span>
                    </div>
                    <StatusBadge status={ind.status} label={ind.statusLabel} size="sm" />
                  </div>

                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-mono text-lg font-bold text-slate-100">
                      {ind.valueDisplay}
                    </span>
                    <span className="font-mono text-xs text-cyan-400">{ind.unit}</span>
                    <span className="text-[11px] text-slate-400 ml-auto font-mono">
                      Target: {ind.nominalRangeLabel}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-1">
                    {ind.reason}
                  </p>
                </div>

                {ind.teamChoice && (
                  <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center gap-1 text-[10px] font-mono text-cyan-400">
                    <Info className="w-3 h-3" />
                    <span>Team-defined rule pending approval</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Crew Notes section */}
        {record.values.notes && (
          <div className="p-3.5 rounded-xl bg-space-950 border border-slate-800">
            <div className="flex items-center gap-2 mb-1.5 text-xs font-mono text-slate-400 uppercase">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Astronaut Clinical Notes & Mission Context</span>
            </div>
            <p className="text-xs text-slate-200 font-sans italic leading-relaxed">
              "{record.values.notes}"
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
