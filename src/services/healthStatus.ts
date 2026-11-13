/**
 * NASA Space Apps Challenge 2026 — Astronaut Health Monitoring Software
 * Module: Health Status Calculation & Verification Engine
 * Authors: Abdul Rafay (Lead), Sameen (Second Developer)
 * Clinical Evidence: Eman Saleem & Moazzama (Medical Research Leads)
 *
 * Sourced directly from src/data/research/indicators.json.
 * Pure typed calculation engine with zero hardcoded threshold values.
 */

import {
  getIndicatorDefinition,
  ResearchIndicatorRule,
  ResearchIndicatorDefinition,
} from '../config/thresholds';
import {
  HealthStatus,
  IndicatorResult,
  IndicatorId,
  MoodType,
  OverallHealthResult,
  ParsedAssessmentValues,
  AstronautProfile,
  DailyAssessmentRecord,
} from '../types/health';

/**
 * Evaluates an individual mathematical condition against a value
 */
export function checkCondition(val: number, cond: ResearchIndicatorRule): boolean {
  switch (cond.op) {
    case '<':
      return val < cond.value;
    case '<=':
      return val <= cond.value;
    case '>':
      return val > cond.value;
    case '>=':
      return val >= cond.value;
    case '==':
    case '===':
      return val === cond.value;
    default:
      return false;
  }
}

/**
 * Pure evaluation function implementing the researcher specification:
 * 1. If any 'urgent' condition is true:
 *    - if consecutiveDays > 1, verify it was true for that many consecutive days ending today.
 *    - otherwise -> RED.
 * 2. Else if all 'normal' conditions are true -> GREEN.
 * 3. Otherwise -> YELLOW.
 */
export function evaluateIndicatorRule(
  indicatorId: string,
  value: number,
  historyValues?: number[]
): HealthStatus {
  const def = getIndicatorDefinition(indicatorId);
  if (!def) return 'GREEN';

  // 1. Evaluate Urgent
  const urgentRule = def.rules.urgent;
  const isUrgentToday = urgentRule.any.some((cond) => checkCondition(value, cond));

  if (isUrgentToday) {
    const requiredDays = urgentRule.consecutiveDays ?? 1;
    if (requiredDays <= 1) {
      return 'RED';
    }

    // For multi-day streaks, historyValues are previous days in chronological order immediately preceding today:
    // [day-1 (yesterday), day-2, ...]
    if (historyValues && historyValues.length >= requiredDays - 1) {
      let streakIntact = true;
      for (let i = 0; i < requiredDays - 1; i++) {
        const pastVal = historyValues[i];
        if (pastVal === undefined || !urgentRule.any.some((cond) => checkCondition(pastVal, cond))) {
          streakIntact = false;
          break;
        }
      }
      if (streakIntact) {
        return 'RED';
      }
    }
  }

  // 2. Evaluate Normal
  const normalRule = def.rules.normal;
  const isNormal = normalRule.all.every((cond) => checkCondition(value, cond));
  if (isNormal) {
    return 'GREEN';
  }

  // 3. Otherwise Warning
  return 'YELLOW';
}

function getStatusLabel(status: HealthStatus): string {
  switch (status) {
    case 'RED':
      return 'Urgent Attention';
    case 'YELLOW':
      return 'Warning (Sub-nominal)';
    case 'GREEN':
    default:
      return 'Normal (Nominal)';
  }
}

function getReasonText(
  def: ResearchIndicatorDefinition,
  status: HealthStatus,
  val: number,
  unit: string
): string {
  if (status === 'RED') {
    return `${def.name} of ${val} ${unit} has exceeded urgent flight rules (${def.text.urgent}). Contact flight surgeon. ${def.whyItMatters}`;
  }
  if (status === 'YELLOW') {
    return `${def.name} of ${val} ${unit} is in the warning band (${def.text.warning}). Monitor and apply countermeasures.`;
  }
  return `${def.name} of ${val} ${unit} is within nominal operational boundaries (${def.text.normal} ${unit}).`;
}

/**
 * Evaluates a single indicator and returns the complete typed IndicatorResult
 */
export function evaluateSingleIndicator(
  indicatorId: IndicatorId,
  value: number | undefined,
  historyValues?: number[],
  baseline?: number
): IndicatorResult {
  const def = getIndicatorDefinition(indicatorId);
  const displayName = def?.name || indicatorId;
  const unit = def?.unit || '';

  if (value === undefined || isNaN(value)) {
    return {
      indicatorId,
      displayName,
      valueDisplay: 'Not recorded',
      unit,
      status: 'GREEN',
      statusLabel: 'Not recorded',
      reason: 'No telemetry recorded for this indicator.',
      nominalRangeLabel: def?.text.normal ? `${def.text.normal} ${unit}` : 'Nominal',
      criticality: 'low',
      teamChoice: def?.teamChoice,
      teamChoiceNote: def?.teamChoiceNote,
      sources: def?.sources,
      measurement: def?.measurement,
    };
  }

  const status = evaluateIndicatorRule(indicatorId, value, historyValues);
  const statusLabel = getStatusLabel(status);
  const reason = def ? getReasonText(def, status, value, unit) : `Value: ${value} ${unit}`;

  let deviationPercent: number | undefined;
  if (baseline && baseline > 0) {
    deviationPercent = Math.round(((value - baseline) / baseline) * 100);
  }

  return {
    indicatorId,
    displayName,
    valueDisplay: Number.isInteger(value) ? `${value}` : `${value.toFixed(1)}`,
    numericValue: value,
    unit,
    status,
    statusLabel,
    reason,
    nominalRangeLabel: def?.text.normal ? `${def.text.normal} ${unit}` : 'Nominal',
    baselineNominal: baseline !== undefined ? `${baseline} ${unit}` : undefined,
    deviationPercent,
    criticality: status === 'RED' ? 'high' : status === 'YELLOW' ? 'medium' : 'low',
    teamChoice: def?.teamChoice,
    teamChoiceNote: def?.teamChoiceNote,
    sources: def?.sources,
    measurement: def?.measurement,
  };
}

/**
 * Backward-compatible helper for Heart Rate
 */
export function evaluateHeartRate(bpm: number, baseline?: number, history?: number[]): IndicatorResult {
  return evaluateSingleIndicator('heartRate', bpm, history, baseline);
}

/**
 * Backward-compatible helper for Blood Pressure
 */
export function evaluateBloodPressure(
  systolic: number,
  diastolic: number,
  baseline?: { systolic: number; diastolic: number },
  historySys?: number[],
  historyDia?: number[]
): IndicatorResult {
  const sysResult = evaluateSingleIndicator('systolicBP', systolic, historySys, baseline?.systolic);
  const diaResult = evaluateSingleIndicator('diastolicBP', diastolic, historyDia, baseline?.diastolic);

  let combinedStatus: HealthStatus = 'GREEN';
  if (sysResult.status === 'RED' || diaResult.status === 'RED') {
    combinedStatus = 'RED';
  } else if (sysResult.status === 'YELLOW' || diaResult.status === 'YELLOW') {
    combinedStatus = 'YELLOW';
  }

  const statusLabel = getStatusLabel(combinedStatus);
  const sysDef = getIndicatorDefinition('systolicBP');
  const diaDef = getIndicatorDefinition('diastolicBP');

  return {
    indicatorId: 'bloodPressure',
    displayName: 'Blood Pressure',
    valueDisplay: `${systolic}/${diastolic}`,
    numericValue: systolic,
    secondaryValue: diastolic,
    unit: 'mmHg',
    status: combinedStatus,
    statusLabel,
    reason: `Systolic ${systolic} mmHg (${sysResult.statusLabel}), Diastolic ${diastolic} mmHg (${diaResult.statusLabel}).`,
    nominalRangeLabel: `${sysDef?.text.normal || '111-119'} / ${diaDef?.text.normal || '60-79'} mmHg`,
    baselineNominal: baseline ? `${baseline.systolic}/${baseline.diastolic} mmHg` : undefined,
    criticality: combinedStatus === 'RED' ? 'high' : combinedStatus === 'YELLOW' ? 'medium' : 'low',
    sources: sysDef?.sources,
    measurement: sysDef?.measurement,
  };
}

/**
 * Backward-compatible helper for Blood Sugar (Fasting Glucose)
 */
export function evaluateBloodSugar(glucose: number, history?: number[]): IndicatorResult {
  return evaluateSingleIndicator('fastingGlucose', glucose, history);
}

/**
 * Backward-compatible helper for Body Temperature
 */
export function evaluateBodyTemperature(temp: number, baseline?: number, history?: number[]): IndicatorResult {
  return evaluateSingleIndicator('bodyTemperature', temp, history, baseline);
}

/**
 * Backward-compatible helper for Sleep Duration
 */
export function evaluateSleepDuration(hours: number, history?: number[]): IndicatorResult {
  return evaluateSingleIndicator('sleepHours', hours, history);
}

/**
 * Backward-compatible helper for Mood
 */
export function evaluateMood(mood: MoodType | number, history?: number[]): IndicatorResult {
  let score: number;
  if (typeof mood === 'number') {
    score = mood;
  } else {
    const moodScoreMap: Record<MoodType, number> = {
      excellent: 5,
      good: 4,
      fatigued: 3,
      stressed: 2,
      disoriented: 1,
    };
    score = moodScoreMap[mood] ?? 4;
  }

  return evaluateSingleIndicator('mood', score, history);
}

/**
 * Evaluates all 12 indicators from a check-in record against clinical research rules
 */
export function evaluateAllIndicators(
  values: ParsedAssessmentValues,
  profile?: AstronautProfile,
  historyRecords: DailyAssessmentRecord[] = []
): DailyAssessmentRecord['results'] {
  // Extract history values arrays for indicators that require consecutive streak checks
  const getHistoryFor = (extractor: (rec: DailyAssessmentRecord) => number | undefined): number[] => {
    return historyRecords
      .map(extractor)
      .filter((v): v is number => v !== undefined && !isNaN(v));
  };

  const sleepHistory = getHistoryFor((r) => r.values.sleepHours ?? r.values.sleepDuration);
  const exerciseHistory = getHistoryFor((r) => r.values.exerciseMinutes);
  const moodHistory = getHistoryFor((r) => {
    const m = r.values.mood;
    if (typeof m === 'number') return m;
    const legacyMap: Record<string, number> = { excellent: 5, good: 4, fatigued: 3, stressed: 2, disoriented: 1 };
    return legacyMap[m as string] ?? 4;
  });

  const hrHistory = getHistoryFor((r) => r.values.heartRate);
  const sysHistory = getHistoryFor((r) => r.values.systolicBP ?? r.values.systolic);
  const diaHistory = getHistoryFor((r) => r.values.diastolicBP ?? r.values.diastolic);
  const tempHistory = getHistoryFor((r) => r.values.bodyTemperature);
  const glucoseHistory = getHistoryFor((r) => r.values.fastingGlucose ?? r.values.bloodSugar);
  const spo2History = getHistoryFor((r) => r.values.spo2);
  const respHistory = getHistoryFor((r) => r.values.respiratoryRate);
  const co2History = getHistoryFor((r) => r.values.cabinCO2);

  const sysVal = values.systolicBP ?? values.systolic ?? 118;
  const diaVal = values.diastolicBP ?? values.diastolic ?? 76;
  const sleepVal = values.sleepHours ?? values.sleepDuration ?? 8;
  const glucoseVal = values.fastingGlucose ?? values.bloodSugar;

  // Cumulative radiation dose calculation: profile baseline + past daily records + today's dose
  const previousCareerDose = profile?.previousCareerRadiationDose ?? 0;
  const pastDailyRadiationSum = historyRecords.reduce((acc, r) => acc + (r.values.radiationDose ?? 0), 0);
  const todayDose = values.radiationDose ?? 0;
  const totalCareerRadiationDose = values.cumulativeRadiationDose ?? (previousCareerDose + pastDailyRadiationSum + todayDose);

  const hrResult = evaluateHeartRate(values.heartRate, profile?.restingHeartRateBaseline, hrHistory);
  const sysResult = evaluateSingleIndicator('systolicBP', sysVal, sysHistory, profile?.bloodPressureBaseline.systolic);
  const diaResult = evaluateSingleIndicator('diastolicBP', diaVal, diaHistory, profile?.bloodPressureBaseline.diastolic);
  const bpResult = evaluateBloodPressure(sysVal, diaVal, profile?.bloodPressureBaseline, sysHistory, diaHistory);
  const tempResult = evaluateBodyTemperature(values.bodyTemperature, profile?.bodyTemperatureBaseline, tempHistory);
  const sleepResult = evaluateSingleIndicator('sleepHours', sleepVal, sleepHistory);
  const moodResult = evaluateMood(values.mood, moodHistory);
  const glucoseResult = glucoseVal !== undefined ? evaluateSingleIndicator('fastingGlucose', glucoseVal, glucoseHistory) : undefined;
  const spo2Result = values.spo2 !== undefined ? evaluateSingleIndicator('spo2', values.spo2, spo2History) : undefined;
  const respResult = values.respiratoryRate !== undefined ? evaluateSingleIndicator('respiratoryRate', values.respiratoryRate, respHistory) : undefined;
  const co2Result = values.cabinCO2 !== undefined ? evaluateSingleIndicator('cabinCO2', values.cabinCO2, co2History) : undefined;
  const exerciseResult = values.exerciseMinutes !== undefined ? evaluateSingleIndicator('exerciseMinutes', values.exerciseMinutes, exerciseHistory) : undefined;
  const radiationResult = evaluateSingleIndicator('radiationDose', totalCareerRadiationDose);

  return {
    heartRate: hrResult,
    systolicBP: sysResult,
    diastolicBP: diaResult,
    respiratoryRate: respResult,
    spo2: spo2Result,
    bodyTemperature: tempResult,
    fastingGlucose: glucoseResult,
    sleepHours: sleepResult,
    cabinCO2: co2Result,
    radiationDose: radiationResult,
    exerciseMinutes: exerciseResult,
    mood: moodResult,

    // Legacy getters
    bloodPressure: bpResult,
    bloodSugar: glucoseResult || evaluateSingleIndicator('fastingGlucose', undefined),
    sleepDuration: sleepResult,
  };
}

/**
 * Calculates Overall Health Status following strict clinical triage hierarchy:
 * 1. Any RED indicator -> Overall RED
 * 2. Any YELLOW indicator -> Overall YELLOW
 * 3. All GREEN indicators -> Overall GREEN
 */
export function calculateOverallHealth(
  results: Record<string, IndicatorResult | undefined>
): OverallHealthResult {
  // Exclude legacy alias duplicates to avoid double counting
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

  const activeIndicators = primaryKeys
    .map((k) => results[k])
    .filter((r): r is IndicatorResult => r !== undefined && r.valueDisplay !== 'N/A' && r.valueDisplay !== 'Not recorded');

  let redCount = 0;
  let yellowCount = 0;
  let greenCount = 0;

  activeIndicators.forEach((r) => {
    if (r.status === 'RED') redCount++;
    else if (r.status === 'YELLOW') yellowCount++;
    else greenCount++;
  });

  const total = activeIndicators.length || 1;
  const score = Math.max(
    10,
    Math.min(100, Math.round((greenCount / total) * 100 - yellowCount * 6 - redCount * 25))
  );

  if (redCount > 0) {
    const criticalItems = activeIndicators
      .filter((r) => r.status === 'RED')
      .map((r) => r.displayName)
      .join(', ');

    return {
      status: 'RED',
      statusLabel: 'Urgent Attention Required',
      alertTitle: 'Critical Telemetry Advisory',
      summary: `${redCount} physiological indicator${redCount > 1 ? 's have' : ' has'} reached critical departure (${criticalItems}). Immediate Flight Surgeon notification and countermeasure implementation required.`,
      normalCount: greenCount,
      warningCount: yellowCount,
      urgentCount: redCount,
      score,
      recommendationSnippet: 'Cease physical exertion, notify Flight Surgeon, and follow clinical countermeasures.',
    };
  }

  if (yellowCount > 0) {
    const warningItems = activeIndicators
      .filter((r) => r.status === 'YELLOW')
      .map((r) => r.displayName)
      .join(', ');

    return {
      status: 'YELLOW',
      statusLabel: 'Operational Warning / Monitoring',
      alertTitle: 'Sub-nominal Indicator Alert',
      summary: `${yellowCount} indicator${yellowCount > 1 ? 's exhibit' : ' exhibits'} sub-nominal variance (${warningItems}). Enhanced telemetry monitoring active.`,
      normalCount: greenCount,
      warningCount: yellowCount,
      urgentCount: 0,
      score,
      recommendationSnippet: 'Hydrate, log restorative downtime, and re-evaluate within designated interval.',
    };
  }

  return {
    status: 'GREEN',
    statusLabel: 'Nominal Mission Flight Readiness',
    alertTitle: 'All Telemetry Stable',
    summary: `All ${greenCount} active physiological indicators are within optimal operational boundaries. Cleared for standard flight duties.`,
    normalCount: greenCount,
    warningCount: 0,
    urgentCount: 0,
    score: Math.max(score, 98),
    recommendationSnippet: 'Maintain standard hydration, daily exercise countermeasures, and circadian sleep hygiene.',
  };
}
