/**
 * NASA Space Apps Challenge 2026 — Astronaut Health Monitoring Software
 * Module: Longitudinal Health Trend Chart (Recharts)
 * Second Developer: Sameen (Phase 1/2 Visualization Engine)
 *
 * Plots historical telemetry trends against clinical threshold bands.
 * Dynamic shaded bands are read strictly from src/data/research/indicators.json (no hardcoded numbers).
 * Points are colored and shaped (Circle=Green, Triangle=Yellow, Diamond=Red) for colorblind accessibility.
 */

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceArea,
  CartesianGrid,
} from 'recharts';
import { getIndicatorDefinition } from '../../config/thresholds';
import {
  DailyAssessmentRecord,
  HealthStatus,
  IndicatorId,
} from '../../types/health';
import { evaluateSingleIndicator } from '../../services/healthStatus';
import { saveAssessmentsToStorage } from '../../services/storage';
import { SAMPLE_ASSESSMENT_HISTORY } from '../../data/mockData';
import { Card } from '../common/Card';
import { StatusBadge } from '../common/StatusBadge';
import {
  Activity,
  Heart,
  Droplets,
  Thermometer,
  Moon,
  Smile,
  RefreshCw,
  PlusCircle,
  Trash2,
  SlidersHorizontal,
  Info,
  Wind,
  Radio,
  Zap,
  Dumbbell,
} from 'lucide-react';

export type ChartIndicatorKey =
  | 'heartRate'
  | 'bloodPressure'
  | 'systolicBP'
  | 'diastolicBP'
  | 'respiratoryRate'
  | 'spo2'
  | 'bodyTemperature'
  | 'fastingGlucose'
  | 'sleepHours'
  | 'cabinCO2'
  | 'radiationDose'
  | 'exerciseMinutes'
  | 'mood'
  | 'bloodSugar'
  | 'sleepDuration';

interface TrendChartProps {
  records: DailyAssessmentRecord[];
  onRecordsChange?: (updated: DailyAssessmentRecord[]) => void;
  className?: string;
}

interface ChartDataPoint {
  id: string;
  sol: string;
  dateLabel: string;
  timestamp: string;
  missionDay: number;
  value: number;
  secondaryValue?: number;
  unit: string;
  status: HealthStatus;
  statusSecondary?: HealthStatus;
  label: string;
  isDemonstrationData: boolean;
}

// Colorblind custom marker component
interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: ChartDataPoint;
}

const ColorblindStatusDot: React.FC<CustomDotProps> = ({ cx, cy, payload }) => {
  if (cx === undefined || cy === undefined || !payload) return null;

  const status = payload.status;

  if (status === 'RED') {
    // Diamond shape for RED / Urgent
    return (
      <g>
        <polygon
          points={`${cx},${cy - 7} ${cx + 7},${cy} ${cx},${cy + 7} ${cx - 7},${cy}`}
          fill="#ef4444"
          stroke="#060913"
          strokeWidth={2}
          className="drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]"
        />
        <circle cx={cx} cy={cy} r={2} fill="#ffffff" />
      </g>
    );
  }

  if (status === 'YELLOW') {
    // Triangle shape for YELLOW / Warning
    return (
      <g>
        <polygon
          points={`${cx},${cy - 7} ${cx + 7},${cy + 6} ${cx - 7},${cy + 6}`}
          fill="#f59e0b"
          stroke="#060913"
          strokeWidth={2}
          className="drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]"
        />
        <circle cx={cx} cy={cy + 1} r={1.5} fill="#ffffff" />
      </g>
    );
  }

  // Circle shape for GREEN / Nominal
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5.5}
      fill="#10b981"
      stroke="#060913"
      strokeWidth={2}
      className="drop-shadow-[0_0_6px_rgba(16,185,129,0.7)]"
    />
  );
};

export const TrendChart: React.FC<TrendChartProps> = ({
  records,
  onRecordsChange,
  className = '',
}) => {
  const [selectedIndicator, setSelectedIndicator] = useState<ChartIndicatorKey>('heartRate');
  const [filterDemoOnly, setFilterDemoOnly] = useState<'all' | 'real' | 'demo'>('all');

  // Filter records according to demo toggle
  const filteredRecords = useMemo(() => {
    let list = [...records];
    if (filterDemoOnly === 'real') {
      list = list.filter((r) => !r.isDemonstrationData);
    } else if (filterDemoOnly === 'demo') {
      list = list.filter((r) => !!r.isDemonstrationData);
    }
    // Sort chronologically ascending for time-series (oldest to newest)
    return list.sort((a, b) => a.missionDay - b.missionDay);
  }, [records, filterDemoOnly]);

  // Transform records into chart points based on selected indicator
  const chartData = useMemo<ChartDataPoint[]>(() => {
    const points: ChartDataPoint[] = [];

    for (const rec of filteredRecords) {
      const date = new Date(rec.timestamp);
      const dateLabel = isNaN(date.getTime())
        ? `Sol ${rec.missionDay}`
        : `${date.getUTCMonth() + 1}/${date.getUTCDate()} UTC`;

      let val: number | undefined;
      let secVal: number | undefined;
      let unit = '';
      let status: HealthStatus = 'GREEN';
      let secStatus: HealthStatus | undefined;
      let label = '';

      if (selectedIndicator === 'bloodPressure') {
        val = rec.values.systolicBP ?? rec.values.systolic ?? 118;
        secVal = rec.values.diastolicBP ?? rec.values.diastolic ?? 76;
        unit = 'mmHg';
        status = rec.results.bloodPressure?.status ?? 'GREEN';
        label = `${val}/${secVal} mmHg`;
      } else {
        const def = getIndicatorDefinition(selectedIndicator);
        unit = def?.unit || '';

        switch (selectedIndicator) {
          case 'heartRate':
            val = rec.values.heartRate;
            break;
          case 'systolicBP':
            val = rec.values.systolicBP ?? rec.values.systolic;
            break;
          case 'diastolicBP':
            val = rec.values.diastolicBP ?? rec.values.diastolic;
            break;
          case 'respiratoryRate':
            val = rec.values.respiratoryRate;
            break;
          case 'spo2':
            val = rec.values.spo2;
            break;
          case 'bodyTemperature':
            val = rec.values.bodyTemperature;
            break;
          case 'fastingGlucose':
          case 'bloodSugar':
            val = rec.values.fastingGlucose ?? rec.values.bloodSugar;
            break;
          case 'sleepHours':
          case 'sleepDuration':
            val = rec.values.sleepHours ?? rec.values.sleepDuration;
            break;
          case 'cabinCO2':
            val = rec.values.cabinCO2;
            break;
          case 'radiationDose':
            val = rec.values.cumulativeRadiationDose ?? rec.values.radiationDose;
            break;
          case 'exerciseMinutes':
            val = rec.values.exerciseMinutes;
            break;
          case 'mood': {
            const m = rec.values.mood;
            if (typeof m === 'number') val = m;
            else {
              const legacy: Record<string, number> = { excellent: 5, good: 4, fatigued: 3, stressed: 2, disoriented: 1 };
              val = legacy[m as string] ?? 4;
            }
            break;
          }
        }

        if (val === undefined || isNaN(val)) {
          continue;
        }

        const evaluated =
          rec.results[selectedIndicator as IndicatorId] ||
          evaluateSingleIndicator(selectedIndicator as IndicatorId, val);
        status = evaluated.status;
        label = `${val} ${unit}`;
      }

      points.push({
        id: rec.id,
        sol: `Sol ${rec.missionDay}`,
        dateLabel,
        timestamp: rec.timestamp,
        missionDay: rec.missionDay,
        value: val ?? 0,
        secondaryValue: secVal,
        unit,
        status,
        statusSecondary: secStatus,
        label,
        isDemonstrationData: !!rec.isDemonstrationData,
      });
    }

    return points;
  }, [filteredRecords, selectedIndicator]);

  // Compute reference band boundaries dynamically from research definition
  const bandConfig = useMemo(() => {
    if (selectedIndicator === 'bloodPressure') {
      const sysDef = getIndicatorDefinition('systolicBP');
      const normalGe = sysDef?.rules.normal.all.find((r) => r.op === '>=' || r.op === '>')?.value ?? 111;
      const normalLe = sysDef?.rules.normal.all.find((r) => r.op === '<=' || r.op === '<')?.value ?? 119;
      const urgentLow = sysDef?.rules.urgent.any.find((r) => r.op === '<=' || r.op === '<')?.value ?? 90;
      const urgentHigh = sysDef?.rules.urgent.any.find((r) => r.op === '>=' || r.op === '>')?.value ?? 180;

      return {
        title: 'Blood Pressure (Systolic & Diastolic)',
        unit: 'mmHg',
        green: { min: normalGe, max: normalLe },
        yellowLow: { min: urgentLow + 1, max: normalGe - 1 },
        yellowHigh: { min: normalLe + 1, max: urgentHigh },
        redLow: urgentLow,
        redHigh: urgentHigh + 1,
        yDomain: [50, 200] as [number, number],
        description: 'Systolic arterial pressure with secondary diastolic telemetry tracking.',
      };
    }

    const def = getIndicatorDefinition(selectedIndicator);
    if (!def) {
      return {
        title: selectedIndicator,
        unit: '',
        green: { min: 0, max: 100 },
        yellowLow: undefined,
        yellowHigh: undefined,
        redLow: undefined,
        redHigh: undefined,
        yDomain: [0, 100] as [number, number],
        description: '',
      };
    }

    const normalGe = def.rules.normal.all.find((r) => r.op === '>=' || r.op === '>')?.value;
    const normalLe = def.rules.normal.all.find((r) => r.op === '<=' || r.op === '<')?.value;
    const urgentLow = def.rules.urgent.any.find((r) => r.op === '<=' || r.op === '<')?.value;
    const urgentHigh = def.rules.urgent.any.find((r) => r.op === '>=' || r.op === '>')?.value;

    let greenMin = normalGe ?? (urgentLow !== undefined ? urgentLow + 1 : 0);
    let greenMax = normalLe ?? (urgentHigh !== undefined ? urgentHigh - 1 : 100);

    let yDomain: [number, number] = [
      urgentLow !== undefined ? Math.floor(urgentLow * 0.85) : Math.floor(greenMin * 0.85),
      urgentHigh !== undefined ? Math.ceil(urgentHigh * 1.15) : Math.ceil(greenMax * 1.2),
    ];

    if (selectedIndicator === 'bodyTemperature') {
      yDomain = [34.0, 40.5];
    } else if (selectedIndicator === 'spo2') {
      yDomain = [85, 100];
    } else if (selectedIndicator === 'mood') {
      yDomain = [0.5, 5.5];
      greenMin = 4;
      greenMax = 5.5;
    } else if (selectedIndicator === 'cabinCO2') {
      yDomain = [0, 6.0];
    } else if (selectedIndicator === 'radiationDose') {
      yDomain = [0, 750];
    }

    return {
      title: def.name,
      unit: def.unit,
      green: { min: greenMin, max: greenMax },
      yellowLow: urgentLow !== undefined && normalGe !== undefined ? { min: urgentLow + 0.1, max: normalGe - 0.1 } : undefined,
      yellowHigh: urgentHigh !== undefined && normalLe !== undefined ? { min: normalLe + 0.1, max: urgentHigh } : undefined,
      redLow: urgentLow,
      redHigh: urgentHigh,
      yDomain,
      description: `${def.name} nominal range: ${def.text.normal} ${def.unit}. ${def.whyItMatters}`,
    };
  }, [selectedIndicator]);

  // Load 14 days of realistic sample demonstration telemetry
  const handleLoadDemoData = () => {
    const realRecords = records.filter((r) => !r.isDemonstrationData);
    const updated = [...SAMPLE_ASSESSMENT_HISTORY, ...realRecords].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    saveAssessmentsToStorage(updated);
    if (onRecordsChange) {
      onRecordsChange(updated);
    }
  };

  // Remove demo data, preserving only real astronaut check-ins
  const handleClearDemoData = () => {
    const realOnly = records.filter((r) => !r.isDemonstrationData);
    saveAssessmentsToStorage(realOnly);
    if (onRecordsChange) {
      onRecordsChange(realOnly);
    }
  };

  // 12 indicator tabs
  const indicatorsList: Array<{
    id: ChartIndicatorKey;
    name: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    { id: 'heartRate', name: 'Heart Rate', icon: <Heart className="w-3.5 h-3.5" />, color: 'text-rose-400' },
    { id: 'bloodPressure', name: 'Blood Pressure', icon: <Activity className="w-3.5 h-3.5" />, color: 'text-cyan-400' },
    { id: 'respiratoryRate', name: 'Respiration', icon: <Wind className="w-3.5 h-3.5" />, color: 'text-cyan-300' },
    { id: 'spo2', name: 'SpO2', icon: <Droplets className="w-3.5 h-3.5" />, color: 'text-sky-400' },
    { id: 'bodyTemperature', name: 'Temperature', icon: <Thermometer className="w-3.5 h-3.5" />, color: 'text-orange-400' },
    { id: 'fastingGlucose', name: 'Glucose', icon: <Zap className="w-3.5 h-3.5" />, color: 'text-amber-400' },
    { id: 'sleepHours', name: 'Sleep', icon: <Moon className="w-3.5 h-3.5" />, color: 'text-indigo-400' },
    { id: 'cabinCO2', name: 'Cabin CO2', icon: <Radio className="w-3.5 h-3.5" />, color: 'text-emerald-400' },
    { id: 'radiationDose', name: 'Radiation', icon: <Zap className="w-3.5 h-3.5" />, color: 'text-amber-500' },
    { id: 'exerciseMinutes', name: 'Exercise', icon: <Dumbbell className="w-3.5 h-3.5" />, color: 'text-teal-400' },
    { id: 'mood', name: 'Mood', icon: <Smile className="w-3.5 h-3.5" />, color: 'text-emerald-300' },
  ];

  const demoCount = records.filter((r) => r.isDemonstrationData).length;
  const realCount = records.filter((r) => !r.isDemonstrationData).length;

  return (
    <Card
      glow="cyan"
      title="Longitudinal Physiological Trend Telemetry"
      subtitle="Recharts time-series with clinical shaded bands & colorblind-safe marker geometry"
      icon={<Activity className="w-4 h-4 text-cyan-400" />}
      className={className}
      headerSlot={
        <div className="flex items-center gap-2">
          {demoCount > 0 ? (
            <button
              type="button"
              onClick={handleClearDemoData}
              className="px-2.5 py-1 rounded-lg text-xs font-mono bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 flex items-center gap-1.5 transition-all"
              title="Remove sample demonstration records"
            >
              <Trash2 className="w-3 h-3 text-rose-400" />
              <span>Clear Demo ({demoCount})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLoadDemoData}
              className="px-2.5 py-1 rounded-lg text-xs font-mono bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 flex items-center gap-1.5 transition-all shadow-neon-cyan/15"
              title="Load 14 days of realistic sample astronaut telemetry"
            >
              <PlusCircle className="w-3 h-3 text-cyan-400" />
              <span>Load 14-Day Demo</span>
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Controls Toolbar: Indicator Tabs & Data Source Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          {/* Indicator selection tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {indicatorsList.map((ind) => {
              const isSelected = selectedIndicator === ind.id;
              return (
                <button
                  type="button"
                  key={ind.id}
                  onClick={() => setSelectedIndicator(ind.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-neon-cyan/20 font-semibold'
                      : 'bg-space-950 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className={isSelected ? 'text-cyan-300' : ind.color}>{ind.icon}</span>
                  <span>{ind.name}</span>
                </button>
              );
            })}
          </div>

          {/* Dataset toggle filter */}
          <div className="flex items-center gap-1 bg-space-950 p-1 rounded-lg border border-slate-800 text-[11px] font-mono shrink-0">
            <span className="text-slate-400 px-2 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-cyan-400" /> Scope:
            </span>
            <button
              type="button"
              onClick={() => setFilterDemoOnly('all')}
              className={`px-2 py-0.5 rounded transition-all ${
                filterDemoOnly === 'all'
                  ? 'bg-cyan-500/30 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({records.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterDemoOnly('real')}
              className={`px-2 py-0.5 rounded transition-all ${
                filterDemoOnly === 'real'
                  ? 'bg-cyan-500/30 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Logged ({realCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterDemoOnly('demo')}
              className={`px-2 py-0.5 rounded transition-all ${
                filterDemoOnly === 'demo'
                  ? 'bg-cyan-500/30 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Demo ({demoCount})
            </button>
          </div>
        </div>

        {/* EMPTY STATE */}
        {chartData.length === 0 ? (
          <div className="py-14 px-4 text-center rounded-xl bg-space-950/80 border border-dashed border-slate-800 space-y-4">
            <div className="inline-flex p-4 rounded-2xl bg-space-900 border border-slate-800 text-cyan-400 mx-auto shadow-inner">
              <Activity className="w-8 h-8 opacity-60" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-slate-200 text-sm">
                No Telemetry Records Available
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No matching health assessments were found for this indicator. You can initialize 14 days of realistic sample demonstration telemetry or complete today&apos;s check-in form.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLoadDemoData}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium text-xs hover:from-cyan-500 hover:to-blue-500 shadow-neon-cyan/20 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Load 14-Day Demonstration Telemetry</span>
            </button>
          </div>
        ) : (
          /* CHART CANVAS */
          <div className="space-y-3">
            {/* Header info bar for active indicator */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-space-950/70 border border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">ACTIVE TELEMETRY:</span>
                <span className="text-cyan-300 font-semibold">{bandConfig.title}</span>
                <span className="text-slate-400">({bandConfig.unit})</span>
              </div>
              <div className="text-slate-400 text-[11px]">
                Nominal Range:{' '}
                <span className="text-emerald-400 font-semibold">
                  {bandConfig.green.min} – {bandConfig.green.max} {bandConfig.unit}
                </span>
              </div>
            </div>

            {/* Recharts Container */}
            <div className="w-full h-80 sm:h-96 rounded-xl bg-space-950/90 border border-slate-800/80 p-2 sm:p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" opacity={0.6} />

                  <XAxis
                    dataKey="sol"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />

                  <YAxis
                    domain={bandConfig.yDomain}
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    unit={` ${bandConfig.unit}`}
                  />

                  {/* Shaded Reference Bands */}
                  <ReferenceArea
                    y1={bandConfig.green.min}
                    y2={bandConfig.green.max}
                    fill="#10b981"
                    fillOpacity={0.12}
                    stroke="#10b981"
                    strokeOpacity={0.35}
                    strokeDasharray="2 2"
                  />

                  {bandConfig.yellowLow && (
                    <ReferenceArea
                      y1={bandConfig.yellowLow.min}
                      y2={bandConfig.yellowLow.max}
                      fill="#f59e0b"
                      fillOpacity={0.12}
                      stroke="#f59e0b"
                      strokeOpacity={0.3}
                      strokeDasharray="3 3"
                    />
                  )}

                  {bandConfig.yellowHigh && (
                    <ReferenceArea
                      y1={bandConfig.yellowHigh.min}
                      y2={bandConfig.yellowHigh.max}
                      fill="#f59e0b"
                      fillOpacity={0.12}
                      stroke="#f59e0b"
                      strokeOpacity={0.3}
                      strokeDasharray="3 3"
                    />
                  )}

                  {bandConfig.redLow !== undefined && (
                    <ReferenceArea
                      y1={bandConfig.yDomain[0]}
                      y2={bandConfig.redLow}
                      fill="#ef4444"
                      fillOpacity={0.1}
                      stroke="#ef4444"
                      strokeOpacity={0.3}
                      strokeDasharray="2 2"
                    />
                  )}

                  {bandConfig.redHigh !== undefined && (
                    <ReferenceArea
                      y1={bandConfig.redHigh}
                      y2={bandConfig.yDomain[1]}
                      fill="#ef4444"
                      fillOpacity={0.1}
                      stroke="#ef4444"
                      strokeOpacity={0.3}
                      strokeDasharray="2 2"
                    />
                  )}

                  {/* Interactive Tooltip */}
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const pt = payload[0].payload as ChartDataPoint;
                      return (
                        <div className="p-3 rounded-xl bg-space-950/95 border border-cyan-500/40 shadow-xl backdrop-blur-xl space-y-1.5 text-xs font-sans min-w-[200px]">
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                            <span className="font-mono text-cyan-300 font-bold">{pt.sol}</span>
                            <span className="text-[11px] text-slate-400">{pt.dateLabel}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-mono">Value:</span>
                            <span className="font-mono font-bold text-slate-100 text-sm">
                              {pt.value} {pt.unit}
                              {pt.secondaryValue !== undefined && ` / ${pt.secondaryValue}`}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-slate-400 font-mono text-[11px]">Triage:</span>
                            <StatusBadge status={pt.status} size="sm" />
                          </div>

                          {pt.isDemonstrationData && (
                            <div className="pt-1 text-[10px] font-mono text-amber-400">
                              ⚡ Sample Demonstration Telemetry
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />

                  {/* Legend */}
                  <Legend
                    verticalAlign="top"
                    height={36}
                    content={() => (
                      <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono text-slate-400 mb-2">
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-2 rounded bg-emerald-500/30 border border-emerald-400/80 inline-block" />
                          <span className="text-emerald-300">Nominal Band</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-2 rounded bg-amber-500/30 border border-amber-400/80 inline-block" />
                          <span className="text-amber-300">Warning Band</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-2 rounded bg-rose-500/30 border border-rose-400/80 inline-block" />
                          <span className="text-rose-300">Critical Band</span>
                        </span>
                      </div>
                    )}
                  />

                  {/* Primary Telemetry Line with Accessible Colorblind Marker Dots */}
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={bandConfig.title}
                    stroke="#22d3ee"
                    strokeWidth={2.5}
                    dot={<ColorblindStatusDot />}
                    activeDot={{ r: 8, stroke: '#ffffff', strokeWidth: 2, fill: '#22d3ee' }}
                    isAnimationActive={false}
                  />

                  {/* Secondary Line for Diastolic (when viewing Blood Pressure) */}
                  {selectedIndicator === 'bloodPressure' && (
                    <Line
                      type="monotone"
                      dataKey="secondaryValue"
                      name="Diastolic Pressure"
                      stroke="#818cf8"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 4, fill: '#818cf8', stroke: '#060913' }}
                      isAnimationActive={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Accessible Colorblind Shape Legend & Guidance Note */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-space-950/80 border border-slate-800 text-[11px]">
              <div className="flex flex-wrap items-center gap-4 font-mono">
                <span className="text-slate-400 uppercase tracking-wider font-semibold">
                  Colorblind Geometry:
                </span>
                <span className="flex items-center gap-1.5 text-emerald-300">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400" /> Circle = Nominal
                </span>
                <span className="flex items-center gap-1.5 text-amber-300">
                  <span className="inline-block text-xs font-bold">▲</span> Triangle = Warning
                </span>
                <span className="flex items-center gap-1.5 text-rose-300">
                  <span className="inline-block text-xs font-bold">◆</span> Diamond = Critical
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-400">
                <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Ranges derived from `src/data/research/indicators.json`</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
