/**
 * NASA Space Apps Challenge 2026 — Astronaut Health Monitoring Software
 * Module: Daily Health Check-in Page — 12 Indicators with Measurement Guides & Clinical Evidence
 * Authors: Abdul Rafay (Lead), Sameen (Second Developer)
 * Clinical Evidence: Eman Saleem & Moazzama (Medical Research Leads)
 */

import React, { useState } from 'react';
import {
  Heart,
  Gauge,
  Droplets,
  Thermometer,
  Moon,
  Smile,
  CheckCircle,
  RotateCcw,
  Wind,
  Activity,
  Zap,
  Radio,
  Dumbbell,
  Info,
  ExternalLink,
} from 'lucide-react';
import {
  AssessmentFormValues,
  DailyAssessmentRecord,
  AstronautProfile,
  ParsedAssessmentValues,
  IndicatorMeasurementGuide,
  IndicatorSourceRef,
} from '../types/health';
import { MOOD_OPTIONS, getIndicatorDefinition, MEDICAL_DISCLAIMER } from '../config/thresholds';
import { evaluateAllIndicators, calculateOverallHealth } from '../services/healthStatus';
import { getStoredAssessments, getCumulativeRadiationDose } from '../services/storage';

interface DailyAssessmentProps {
  profile: AstronautProfile;
  onSubmitSuccess: (record: DailyAssessmentRecord) => void;
  onNavigateToDashboard: () => void;
}

/* ── Reusable vital input card with clinical metadata ────────────────── */
interface VitalInputProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  step?: string;
  min?: number;
  max?: number;
  error?: string;
  type?: string;
  measurement?: IndicatorMeasurementGuide;
  sources?: IndicatorSourceRef[];
  teamChoice?: boolean;
  teamChoiceNote?: string;
  optional?: boolean;
  extraNote?: string;
}

const VitalCard: React.FC<VitalInputProps> = ({
  icon,
  iconBg,
  label,
  unit,
  value,
  onChange,
  placeholder,
  step,
  min,
  max,
  error,
  type = 'number',
  measurement,
  sources,
  teamChoice,
  teamChoiceNote,
  optional,
  extraNote,
}) => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div
      className={`p-4 rounded-2xl bg-[#111827] border transition-all flex flex-col justify-between ${
        error ? 'border-red-500/40' : 'border-white/5 hover:border-blue-500/20'
      }`}
    >
      <div>
        {/* Header with Title, Optional Flag & Team Choice Badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-semibold text-white">{label}</span>
                {optional && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    Optional
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Toggle Help & Team Choice Badge */}
          <div className="flex items-center gap-1.5 shrink-0">
            {teamChoice && (
              <span
                title={teamChoiceNote || 'Team-defined threshold, pending approval'}
                className="cursor-help inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/30 text-[10px] text-cyan-300 font-mono"
              >
                <Info className="w-2.5 h-2.5 text-cyan-400" />
                <span>Team Rule</span>
              </span>
            )}
            {measurement && (
              <button
                type="button"
                onClick={() => setShowHelp((prev) => !prev)}
                className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                title="Measurement Instructions"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Input Field */}
        <div className="flex items-baseline gap-2 mt-2">
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            step={step}
            min={min}
            max={max}
            className="flex-1 bg-transparent text-2xl font-bold text-white placeholder-slate-600 outline-none focus:outline-none w-full"
            style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
          />
          <span className="text-xs text-slate-400 shrink-0 font-mono">{unit}</span>
        </div>

        {error && <p className="mt-1 text-[11px] text-red-400 font-mono">{error}</p>}

        {/* Extra Note (e.g., Radiation SPE or Glucose Decision) */}
        {extraNote && (
          <p className="mt-2 text-[11px] text-amber-300/90 font-mono bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 leading-tight">
            {extraNote}
          </p>
        )}

        {/* Expandable Measurement Help Guide */}
        {showHelp && measurement && (
          <div className="mt-3 p-2.5 rounded-xl bg-space-950 border border-slate-800 text-[11px] text-slate-300 space-y-1 font-sans">
            <div>
              <strong className="text-cyan-400 font-mono">Equipment:</strong> {measurement.equipment}
            </div>
            <div>
              <strong className="text-cyan-400 font-mono">How to Measure:</strong> {measurement.howToMeasure}
            </div>
            <div>
              <strong className="text-cyan-400 font-mono">Frequency:</strong> {measurement.howOften}
            </div>
          </div>
        )}
      </div>

      {/* Sources Links */}
      {sources && sources.length > 0 && (
        <div className="mt-3 pt-2 border-t border-white/5 flex items-center gap-1.5 flex-wrap text-[10px] font-mono text-slate-500">
          <span>Source:</span>
          {sources.map((s, idx) => (
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
  );
};

/* ── Main Daily Assessment Component ─────────────────────────────────── */
export const DailyAssessment: React.FC<DailyAssessmentProps> = ({
  profile,
  onSubmitSuccess,
  onNavigateToDashboard,
}) => {
  const hrDef = getIndicatorDefinition('heartRate');
  const respDef = getIndicatorDefinition('respiratoryRate');
  const spo2Def = getIndicatorDefinition('spo2');
  const tempDef = getIndicatorDefinition('bodyTemperature');
  const gluDef = getIndicatorDefinition('fastingGlucose');
  const sleepDef = getIndicatorDefinition('sleepHours');
  const co2Def = getIndicatorDefinition('cabinCO2');
  const radDef = getIndicatorDefinition('radiationDose');
  const exeDef = getIndicatorDefinition('exerciseMinutes');
  const moodDef = getIndicatorDefinition('mood');

  const initialValues: AssessmentFormValues = {
    heartRate: '',
    systolicBP: '',
    diastolicBP: '',
    respiratoryRate: '',
    spo2: '',
    bodyTemperature: '',
    fastingGlucose: '',
    sleepHours: '',
    cabinCO2: '',
    radiationDose: '',
    exerciseMinutes: '',
    mood: '4',
    notes: '',
  };

  const [formValues, setFormValues] = useState<AssessmentFormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successFeedback, setSuccessFeedback] = useState<DailyAssessmentRecord | null>(null);

  // Running radiation calculation
  const todayDoseNum = parseFloat(formValues.radiationDose) || 0;
  const runningCareerRadiation = getCumulativeRadiationDose(profile, todayDoseNum);

  /* Quick Test Prefills */
  const handlePrefillNominal = () => {
    setFormValues({
      heartRate: '68',
      systolicBP: '116',
      diastolicBP: '74',
      respiratoryRate: '15',
      spo2: '98',
      bodyTemperature: '36.8',
      fastingGlucose: '85',
      sleepHours: '8.0',
      cabinCO2: '2.4',
      radiationDose: '0.45',
      exerciseMinutes: '130',
      mood: '4',
      notes: 'Nominal operational test condition.',
    });
    setErrors({});
  };

  const handlePrefillWarning = () => {
    setFormValues({
      heartRate: '96',
      systolicBP: '132',
      diastolicBP: '86',
      respiratoryRate: '22',
      spo2: '94',
      bodyTemperature: '37.6',
      fastingGlucose: '115',
      sleepHours: '6.2',
      cabinCO2: '3.6',
      radiationDose: '1.20',
      exerciseMinutes: '75',
      mood: '3',
      notes: 'Sub-nominal warning departure condition.',
    });
    setErrors({});
  };

  const handlePrefillCritical = () => {
    setFormValues({
      heartRate: '134',
      systolicBP: '185',
      diastolicBP: '95',
      respiratoryRate: '26',
      spo2: '90',
      bodyTemperature: '39.2',
      fastingGlucose: '50',
      sleepHours: '4.5',
      cabinCO2: '4.8',
      radiationDose: '3.50',
      exerciseMinutes: '45',
      mood: '1',
      notes: 'Critical clinical departure test condition.',
    });
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Heart Rate (Required)
    const hr = parseFloat(formValues.heartRate);
    if (!formValues.heartRate || isNaN(hr) || hr < 20 || hr > 240) {
      newErrors.heartRate = 'Enter valid resting heart rate (20–240 BPM)';
    }

    // Blood Pressure (Required)
    const sys = parseFloat(formValues.systolicBP);
    if (!formValues.systolicBP || isNaN(sys) || sys < 50 || sys > 260) {
      newErrors.systolicBP = 'Enter valid systolic (50–260 mmHg)';
    }
    const dia = parseFloat(formValues.diastolicBP);
    if (!formValues.diastolicBP || isNaN(dia) || dia < 30 || dia > 180) {
      newErrors.diastolicBP = 'Enter valid diastolic (30–180 mmHg)';
    } else if (!isNaN(sys) && dia >= sys) {
      newErrors.diastolicBP = 'Diastolic must be lower than systolic';
    }

    // Body Temperature (Required)
    const temp = parseFloat(formValues.bodyTemperature);
    if (!formValues.bodyTemperature || isNaN(temp) || temp < 30 || temp > 45) {
      newErrors.bodyTemperature = 'Enter valid temperature (30–45 °C)';
    }

    // Sleep (Required)
    const sleep = parseFloat(formValues.sleepHours);
    if (!formValues.sleepHours || isNaN(sleep) || sleep < 0 || sleep > 24) {
      newErrors.sleepHours = 'Enter valid sleep (0–24 hours)';
    }

    // Optional / non-blocking fields: validate range only if provided
    if (formValues.respiratoryRate) {
      const resp = parseFloat(formValues.respiratoryRate);
      if (isNaN(resp) || resp < 4 || resp > 60) {
        newErrors.respiratoryRate = 'Valid range: 4–60 breaths/min';
      }
    }

    if (formValues.spo2) {
      const spo2 = parseFloat(formValues.spo2);
      if (isNaN(spo2) || spo2 < 50 || spo2 > 100) {
        newErrors.spo2 = 'Valid range: 50–100%';
      }
    }

    if (formValues.fastingGlucose) {
      const glu = parseFloat(formValues.fastingGlucose);
      if (isNaN(glu) || glu < 20 || glu > 500) {
        newErrors.fastingGlucose = 'Valid range: 20–500 mg/dL';
      }
    }

    if (formValues.cabinCO2) {
      const co2 = parseFloat(formValues.cabinCO2);
      if (isNaN(co2) || co2 < 0 || co2 > 20) {
        newErrors.cabinCO2 = 'Valid range: 0–20 mmHg';
      }
    }

    if (formValues.radiationDose) {
      const rad = parseFloat(formValues.radiationDose);
      if (isNaN(rad) || rad < 0 || rad > 1000) {
        newErrors.radiationDose = 'Valid range: 0–1000 mSv';
      }
    }

    if (formValues.exerciseMinutes) {
      const exe = parseFloat(formValues.exerciseMinutes);
      if (isNaN(exe) || exe < 0 || exe > 600) {
        newErrors.exerciseMinutes = 'Valid range: 0–600 min';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const historyRecords = getStoredAssessments();

    const parsed: ParsedAssessmentValues = {
      heartRate: parseFloat(formValues.heartRate),
      systolicBP: parseFloat(formValues.systolicBP),
      diastolicBP: parseFloat(formValues.diastolicBP),
      bodyTemperature: parseFloat(formValues.bodyTemperature),
      sleepHours: parseFloat(formValues.sleepHours),
      mood: parseInt(formValues.mood, 10) || 4,
      notes: formValues.notes?.trim() || undefined,

      respiratoryRate: formValues.respiratoryRate ? parseFloat(formValues.respiratoryRate) : undefined,
      spo2: formValues.spo2 ? parseFloat(formValues.spo2) : undefined,
      fastingGlucose: formValues.fastingGlucose ? parseFloat(formValues.fastingGlucose) : undefined,
      cabinCO2: formValues.cabinCO2 ? parseFloat(formValues.cabinCO2) : undefined,
      radiationDose: formValues.radiationDose ? parseFloat(formValues.radiationDose) : undefined,
      cumulativeRadiationDose: runningCareerRadiation,
      exerciseMinutes: formValues.exerciseMinutes ? parseFloat(formValues.exerciseMinutes) : undefined,

      // Legacy aliases
      systolic: parseFloat(formValues.systolicBP),
      diastolic: parseFloat(formValues.diastolicBP),
      bloodSugar: formValues.fastingGlucose ? parseFloat(formValues.fastingGlucose) : undefined,
      sleepDuration: parseFloat(formValues.sleepHours),
    };

    const evaluatedResults = evaluateAllIndicators(parsed, profile, historyRecords);
    const overall = calculateOverallHealth(evaluatedResults);

    const newRecord: DailyAssessmentRecord = {
      id: `REC-${Date.now()}`,
      timestamp: new Date().toISOString(),
      missionDay: profile.currentMissionDay,
      astronautId: profile.id,
      values: parsed,
      results: evaluatedResults,
      overall,
      isDemonstrationData: false,
    };

    setSuccessFeedback(newRecord);
    onSubmitSuccess(newRecord);
  };

  /* ── Success screen ───────────────────────────────────────────────── */
  if (successFeedback) {
    const statusColor =
      successFeedback.overall.status === 'GREEN'
        ? 'text-green-400'
        : successFeedback.overall.status === 'RED'
        ? 'text-red-400'
        : 'text-yellow-400';
    const statusBg =
      successFeedback.overall.status === 'GREEN'
        ? 'bg-green-500/15 border-green-500/30'
        : successFeedback.overall.status === 'RED'
        ? 'bg-red-500/15 border-red-500/30'
        : 'bg-yellow-500/15 border-yellow-500/30';

    return (
      <div className="max-w-xl mx-auto text-center animate-fade-in py-10 space-y-6">
        <div className={`inline-flex flex-col items-center gap-3 p-8 rounded-3xl border ${statusBg}`}>
          <CheckCircle className={`w-14 h-14 ${statusColor}`} />
          <h2 className="text-xl font-bold text-white">Daily Check-in Recorded!</h2>
          <div className={`px-4 py-1.5 rounded-full font-semibold text-sm ${statusColor} border ${statusBg}`}>
            {successFeedback.overall.statusLabel}
          </div>
          <p className="text-sm text-slate-300 leading-relaxed max-w-md">
            {successFeedback.overall.summary}
          </p>
          <p className="text-xs text-slate-400 italic">
            {successFeedback.overall.recommendationSnippet}
          </p>
        </div>

        <div className="text-xs font-mono text-slate-500">
          {MEDICAL_DISCLAIMER.disclaimer}
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onNavigateToDashboard}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-900/30"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => {
              setSuccessFeedback(null);
              setFormValues(initialValues);
              setErrors({});
            }}
            className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-sm border border-white/10 transition-all"
          >
            Log Another Sol
          </button>
        </div>
      </div>
    );
  }

  /* ── Form View ─────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Daily Health Assessment</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            12 Monitored Physiological Indicators for Mission Sol {profile.currentMissionDay}
          </p>
        </div>

        {/* Quick Test Prefills */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">Quick Test:</span>
          <button
            type="button"
            onClick={handlePrefillNominal}
            className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-green-500/15 text-green-300 border border-green-500/20 hover:bg-green-500/25 transition-colors"
          >
            Nominal
          </button>
          <button
            type="button"
            onClick={handlePrefillWarning}
            className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-yellow-500/15 text-yellow-300 border border-yellow-500/20 hover:bg-yellow-500/25 transition-colors"
          >
            Warning
          </button>
          <button
            type="button"
            onClick={handlePrefillCritical}
            className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-red-500/15 text-red-300 border border-red-500/20 hover:bg-red-500/25 transition-colors"
          >
            Critical
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Banner with Mandatory Notice */}
        <div className="p-4 rounded-2xl border border-white/5 bg-gradient-to-br from-blue-900/20 via-indigo-900/10 to-transparent flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center shrink-0">
              <Activity className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                Clinical Evidence Integration Active
              </h2>
              <p className="text-xs text-slate-400">
                Evaluation thresholds sourced from NASA Human Research Program, NEWS2, CDC, and AHA standards.
              </p>
            </div>
          </div>
          <div className="text-[11px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl shrink-0">
            {MEDICAL_DISCLAIMER.disclaimer}
          </div>
        </div>

        {/* 12 Vitals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Heart Rate */}
          <VitalCard
            icon={<Heart className="w-4 h-4 text-red-400" />}
            iconBg="bg-red-400/10"
            label="Resting Heart Rate"
            unit="BPM"
            value={formValues.heartRate}
            onChange={(v) => setFormValues({ ...formValues, heartRate: v })}
            placeholder="68"
            min={20}
            max={240}
            error={errors.heartRate}
            measurement={hrDef?.measurement}
            sources={hrDef?.sources}
          />

          {/* 2. Blood Pressure (Dual Systolic / Diastolic) */}
          <div
            className={`p-4 rounded-2xl bg-[#111827] border transition-all flex flex-col justify-between ${
              errors.systolicBP || errors.diastolicBP ? 'border-red-500/40' : 'border-white/5 hover:border-blue-500/20'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-blue-400/10">
                    <Gauge className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-sm font-semibold text-white">Blood Pressure</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Sys / Dia</span>
              </div>

              <div className="flex items-baseline gap-2 mt-2">
                <input
                  type="number"
                  value={formValues.systolicBP}
                  onChange={(e) => setFormValues({ ...formValues, systolicBP: e.target.value })}
                  placeholder="116"
                  min={50}
                  max={260}
                  className="w-20 bg-transparent text-2xl font-bold text-white placeholder-slate-600 outline-none"
                  style={{ WebkitAppearance: 'none' }}
                />
                <span className="text-slate-400 text-lg">/</span>
                <input
                  type="number"
                  value={formValues.diastolicBP}
                  onChange={(e) => setFormValues({ ...formValues, diastolicBP: e.target.value })}
                  placeholder="74"
                  min={30}
                  max={180}
                  className="w-20 bg-transparent text-2xl font-bold text-white placeholder-slate-600 outline-none"
                  style={{ WebkitAppearance: 'none' }}
                />
                <span className="text-xs text-slate-400 font-mono">mmHg</span>
              </div>

              {(errors.systolicBP || errors.diastolicBP) && (
                <p className="mt-1 text-[11px] text-red-400 font-mono">
                  {errors.systolicBP || errors.diastolicBP}
                </p>
              )}
            </div>

            <div className="mt-3 pt-2 border-t border-white/5 flex items-center gap-2 text-[10px] font-mono text-slate-500">
              <span>Source: AHA / NEWS2</span>
            </div>
          </div>

          {/* 3. Respiratory Rate */}
          <VitalCard
            icon={<Wind className="w-4 h-4 text-cyan-400" />}
            iconBg="bg-cyan-400/10"
            label="Breathing Rate"
            unit="breaths/min"
            value={formValues.respiratoryRate}
            onChange={(v) => setFormValues({ ...formValues, respiratoryRate: v })}
            placeholder="15"
            min={4}
            max={60}
            error={errors.respiratoryRate}
            optional={true}
            measurement={respDef?.measurement}
            sources={respDef?.sources}
          />

          {/* 4. SpO2 */}
          <VitalCard
            icon={<Droplets className="w-4 h-4 text-sky-400" />}
            iconBg="bg-sky-400/10"
            label="Blood Oxygen (SpO2)"
            unit="%"
            value={formValues.spo2}
            onChange={(v) => setFormValues({ ...formValues, spo2: v })}
            placeholder="98"
            min={50}
            max={100}
            error={errors.spo2}
            optional={true}
            measurement={spo2Def?.measurement}
            sources={spo2Def?.sources}
          />

          {/* 5. Core Body Temperature */}
          <VitalCard
            icon={<Thermometer className="w-4 h-4 text-orange-400" />}
            iconBg="bg-orange-400/10"
            label="Core Body Temperature"
            unit="°C"
            value={formValues.bodyTemperature}
            onChange={(v) => setFormValues({ ...formValues, bodyTemperature: v })}
            placeholder="36.8"
            step="0.1"
            min={30}
            max={45}
            error={errors.bodyTemperature}
            measurement={tempDef?.measurement}
            sources={tempDef?.sources}
          />

          {/* 6. Fasting Glucose (Optional per research note) */}
          <VitalCard
            icon={<Zap className="w-4 h-4 text-purple-400" />}
            iconBg="bg-purple-400/10"
            label="Fasting Blood Glucose"
            unit="mg/dL"
            value={formValues.fastingGlucose}
            onChange={(v) => setFormValues({ ...formValues, fastingGlucose: v })}
            placeholder="88"
            min={20}
            max={500}
            error={errors.fastingGlucose}
            optional={true}
            extraNote="Team decision pending: Kept optional for routine daily check-ins."
            measurement={gluDef?.measurement}
            sources={gluDef?.sources}
          />

          {/* 7. Sleep Duration (Team Choice Streak Rule) */}
          <VitalCard
            icon={<Moon className="w-4 h-4 text-indigo-400" />}
            iconBg="bg-indigo-400/10"
            label="Sleep Last Night"
            unit="hours"
            value={formValues.sleepHours}
            onChange={(v) => setFormValues({ ...formValues, sleepHours: v })}
            placeholder="8.0"
            step="0.25"
            min={0}
            max={24}
            error={errors.sleepHours}
            teamChoice={sleepDef?.teamChoice}
            teamChoiceNote={sleepDef?.teamChoiceNote}
            measurement={sleepDef?.measurement}
            sources={sleepDef?.sources}
          />

          {/* 8. Cabin CO2 (Environment Sensor) */}
          <VitalCard
            icon={<Radio className="w-4 h-4 text-emerald-400" />}
            iconBg="bg-emerald-400/10"
            label="Cabin CO2 (1-hr Avg)"
            unit="mmHg"
            value={formValues.cabinCO2}
            onChange={(v) => setFormValues({ ...formValues, cabinCO2: v })}
            placeholder="2.4"
            step="0.1"
            min={0}
            max={20}
            error={errors.cabinCO2}
            optional={true}
            measurement={co2Def?.measurement}
            sources={co2Def?.sources}
          />

          {/* 9. Radiation Dose (Today's Increment + Career Running Total Display) */}
          <VitalCard
            icon={<Zap className="w-4 h-4 text-amber-400" />}
            iconBg="bg-amber-400/10"
            label="Radiation Dose Today"
            unit="mSv"
            value={formValues.radiationDose}
            onChange={(v) => setFormValues({ ...formValues, radiationDose: v })}
            placeholder="0.45"
            step="0.05"
            min={0}
            max={1000}
            error={errors.radiationDose}
            optional={true}
            teamChoice={radDef?.teamChoice}
            teamChoiceNote={radDef?.teamChoiceNote}
            extraNote={`Running Career Total: ${runningCareerRadiation.toFixed(1)} mSv / 600 mSv limit. Solar Particle Event limit: 250 mSv.`}
            measurement={radDef?.measurement}
            sources={radDef?.sources}
          />

          {/* 10. Exercise Minutes */}
          <VitalCard
            icon={<Dumbbell className="w-4 h-4 text-teal-400" />}
            iconBg="bg-teal-400/10"
            label="Exercise Today"
            unit="minutes"
            value={formValues.exerciseMinutes}
            onChange={(v) => setFormValues({ ...formValues, exerciseMinutes: v })}
            placeholder="125"
            min={0}
            max={600}
            error={errors.exerciseMinutes}
            optional={true}
            teamChoice={exeDef?.teamChoice}
            teamChoiceNote={exeDef?.teamChoiceNote}
            measurement={exeDef?.measurement}
            sources={exeDef?.sources}
          />

          {/* 11. Mood / Mental Readiness (1-5 Scale) */}
          <div className="p-4 rounded-2xl bg-[#111827] border border-white/5 hover:border-blue-500/20 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-yellow-400/10">
                    <Smile className="w-4 h-4 text-yellow-400" />
                  </div>
                  <span className="text-sm font-semibold text-white">Mood / Readiness</span>
                </div>
                {moodDef?.teamChoice && (
                  <span
                    title={moodDef.teamChoiceNote || 'Team-defined threshold, pending approval'}
                    className="cursor-help inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/30 text-[10px] text-cyan-300 font-mono"
                  >
                    <Info className="w-2.5 h-2.5 text-cyan-400" />
                    <span>Team Rule</span>
                  </span>
                )}
              </div>

              <div className="space-y-2 mt-3">
                <select
                  value={formValues.mood}
                  onChange={(e) => setFormValues({ ...formValues, mood: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-space-950 border border-slate-800 text-white text-sm font-sans focus:outline-none focus:border-cyan-500"
                >
                  {MOOD_OPTIONS.map((opt) => (
                    <option key={opt.score} value={opt.score.toString()}>
                      {opt.label} — {opt.description}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 font-sans">
                  Rate your subjective mental morale, alertness, and mission readiness on a 1–5 scale.
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-white/5 flex items-center gap-2 text-[10px] font-mono text-slate-500">
              <span>Source: NASA HRP Behavioral Health</span>
            </div>
          </div>
        </div>

        {/* 12. Clinical Notes */}
        <div className="p-4 rounded-2xl bg-[#111827] border border-white/5">
          <label className="block text-sm font-semibold text-white mb-2">
            Clinical Notes & Mission Activities <span className="text-slate-500 font-normal">(Optional)</span>
          </label>
          <textarea
            rows={3}
            value={formValues.notes}
            onChange={(e) => setFormValues({ ...formValues, notes: e.target.value })}
            placeholder="Report any symptoms, countermeasures performed, EVA suits worn, or unusual habitat environmental factors..."
            className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => {
              setFormValues(initialValues);
              setErrors({});
            }}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm font-medium transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Form
          </button>
          <button
            type="submit"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-cyan-900/30 transition-all font-sans"
          >
            <CheckCircle className="w-4 h-4" />
            Record Biometric Check-in
          </button>
        </div>
      </form>
    </div>
  );
};
