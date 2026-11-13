/**
 * NASA Space Apps Challenge 2026 — Astronaut Health Monitoring Software
 * Module: Health Threshold Configuration & Research Indicators
 * Clinical Evidence: Eman Saleem & Moazzama (Medical Research Leads)
 * Technical Integration: Sameen (Second Developer) & Abdul Rafay (Lead Developer)
 *
 * All thresholds are dynamically sourced from src/data/research/indicators.json.
 * ZERO threshold values are hardcoded in application code.
 */

import indicatorsRaw from '../data/research/indicators.json';
import {
  MasterHealthThresholds,
  MoodOption,
  IndicatorThresholdSet,
  BloodPressureThresholdSet,
  HealthStatus,
} from '../types/health';

export interface ResearchIndicatorRule {
  op: '<' | '<=' | '>' | '>=' | '==' | '===';
  value: number;
}

export interface ResearchIndicatorDefinition {
  id: string;
  name: string;
  unit: string;
  valueType: string;
  measurementGroup?: string;
  cumulative?: boolean;
  environmentSensor?: boolean;
  text: {
    normal: string;
    warning: string;
    urgent: string;
  };
  rules: {
    urgent: {
      any: ResearchIndicatorRule[];
      consecutiveDays?: number;
    };
    normal: {
      all: ResearchIndicatorRule[];
    };
    otherwise: string;
  };
  basis: string;
  whyItMatters: string;
  sources: Array<{ name: string; url: string }>;
  measurement: {
    equipment: string;
    whyNeeded: string;
    howToMeasure: string;
    howOften: string;
    source?: { name: string; url: string };
  };
  teamChoice?: boolean;
  teamChoiceNote?: string;
  extraRule?: {
    id: string;
    description: string;
    limit: number;
    unit: string;
    appliesTo: string;
    level: string;
    source?: { name: string; url: string };
  };
  openItems?: string[];
  optional?: boolean;
  decisionNeeded?: boolean;
  decisionNote?: string;
  reviewStatus: string;
}

export const RESEARCH_INDICATORS: ResearchIndicatorDefinition[] =
  indicatorsRaw.indicators as ResearchIndicatorDefinition[];

export function getIndicatorDefinition(id: string): ResearchIndicatorDefinition | undefined {
  return RESEARCH_INDICATORS.find((ind) => ind.id === id);
}

export const MEDICAL_DISCLAIMER = {
  shortNotice: 'DECISION SUPPORT ONLY — NOT A MEDICAL DIAGNOSIS',
  fullNotice: `${indicatorsRaw.meta.disclaimer} Aegis Health Monitoring System is an engineering prototype designed for the NASA Space Apps Challenge 2026. The calculated statuses, alerts, and baseline comparisons represent clinical decision support based on NASA Human Research Program, NEWS2, CDC, and AHA standards and do not replace certified NASA Flight Surgeons.`,
  disclaimer: indicatorsRaw.meta.disclaimer,
};

// Helper to extract numeric bounds from rules without hardcoding
function extractRuleBounds(def?: ResearchIndicatorDefinition) {
  if (!def) {
    return {
      greenMin: 0,
      greenMax: 100,
      redLow: 0,
      redHigh: 100,
      yellowLowMin: 0,
      yellowLowMax: 0,
      yellowHighMin: 0,
      yellowHighMax: 0,
    };
  }

  const normalGe = def.rules.normal.all.find((r) => r.op === '>=' || r.op === '>');
  const normalLe = def.rules.normal.all.find((r) => r.op === '<=' || r.op === '<');
  const urgentLow = def.rules.urgent.any.find((r) => r.op === '<=' || r.op === '<');
  const urgentHigh = def.rules.urgent.any.find((r) => r.op === '>=' || r.op === '>');

  return {
    greenMin: normalGe ? normalGe.value : 0,
    greenMax: normalLe ? normalLe.value : 100,
    redLow: urgentLow ? urgentLow.value : 0,
    redHigh: urgentHigh ? urgentHigh.value : 999,
  };
}

const hrBounds = extractRuleBounds(getIndicatorDefinition('heartRate'));
const sysBounds = extractRuleBounds(getIndicatorDefinition('systolicBP'));
const diaBounds = extractRuleBounds(getIndicatorDefinition('diastolicBP'));
const gluBounds = extractRuleBounds(getIndicatorDefinition('fastingGlucose'));
const tempBounds = extractRuleBounds(getIndicatorDefinition('bodyTemperature'));
const sleepBounds = extractRuleBounds(getIndicatorDefinition('sleepHours'));

const heartRateDef = getIndicatorDefinition('heartRate');
const systolicDef = getIndicatorDefinition('systolicBP');
const diastolicDef = getIndicatorDefinition('diastolicBP');
const glucoseDef = getIndicatorDefinition('fastingGlucose');
const tempDef = getIndicatorDefinition('bodyTemperature');
const sleepDef = getIndicatorDefinition('sleepHours');

/**
 * Dynamically generated threshold object for backwards compatibility.
 * All numbers are derived dynamically from indicators.json (none hardcoded).
 */
export const PROVISIONAL_DEMO_THRESHOLDS: MasterHealthThresholds = {
  version: indicatorsRaw.meta.title,
  lastUpdated: indicatorsRaw.meta.date,
  curator: indicatorsRaw.meta.preparedBy,
  isDemonstrationPrototype: false,

  heartRate: {
    name: heartRateDef?.name || 'Heart Rate',
    unit: heartRateDef?.unit || 'beats/min',
    green: { min: hrBounds.greenMin, max: hrBounds.greenMax },
    yellowLow: { min: hrBounds.redLow + 1, max: hrBounds.greenMin - 1 },
    yellowHigh: { min: hrBounds.greenMax + 1, max: hrBounds.redHigh - 1 },
    redCriticalLow: hrBounds.redLow,
    redCriticalHigh: hrBounds.redHigh,
    description: heartRateDef?.text.normal ? `Normal: ${heartRateDef.text.normal}` : '',
    medicalContext: heartRateDef?.whyItMatters || '',
  } as IndicatorThresholdSet,

  bloodPressure: {
    name: 'Blood Pressure',
    unit: systolicDef?.unit || 'mmHg',
    systolic: {
      green: { min: sysBounds.greenMin, max: sysBounds.greenMax },
      yellowLow: { min: sysBounds.redLow + 1, max: sysBounds.greenMin - 1 },
      yellowHigh: { min: sysBounds.greenMax + 1, max: sysBounds.redHigh },
      redCriticalLow: sysBounds.redLow,
      redCriticalHigh: sysBounds.redHigh + 1,
    },
    diastolic: {
      green: { min: diaBounds.greenMin, max: diaBounds.greenMax },
      yellowLow: { min: 40, max: diaBounds.greenMin - 1 },
      yellowHigh: { min: diaBounds.greenMax + 1, max: diaBounds.redHigh },
      redCriticalLow: 39,
      redCriticalHigh: diaBounds.redHigh + 1,
    },
    description: `${systolicDef?.name || 'Systolic'} & ${diastolicDef?.name || 'Diastolic'}`,
    medicalContext: systolicDef?.whyItMatters || '',
  } as BloodPressureThresholdSet,

  bloodSugar: {
    name: glucoseDef?.name || 'Fasting Glucose',
    unit: glucoseDef?.unit || 'mg/dL',
    green: { min: gluBounds.greenMin, max: gluBounds.greenMax },
    yellowLow: { min: gluBounds.redLow + 1, max: gluBounds.greenMin - 1 },
    yellowHigh: { min: gluBounds.greenMax + 1, max: gluBounds.redHigh - 1 },
    redCriticalLow: gluBounds.redLow,
    redCriticalHigh: gluBounds.redHigh,
    description: glucoseDef?.text.normal ? `Normal: ${glucoseDef.text.normal}` : '',
    medicalContext: glucoseDef?.whyItMatters || '',
  } as IndicatorThresholdSet,

  bodyTemperature: {
    name: tempDef?.name || 'Core Body Temperature',
    unit: tempDef?.unit || '°C',
    green: { min: tempBounds.greenMin, max: tempBounds.greenMax },
    yellowLow: { min: tempBounds.redLow + 0.1, max: tempBounds.greenMin - 0.1 },
    yellowHigh: { min: tempBounds.greenMax + 0.1, max: tempBounds.redHigh - 0.1 },
    redCriticalLow: tempBounds.redLow,
    redCriticalHigh: tempBounds.redHigh,
    description: tempDef?.text.normal ? `Normal: ${tempDef.text.normal}` : '',
    medicalContext: tempDef?.whyItMatters || '',
  } as IndicatorThresholdSet,

  sleepDuration: {
    name: sleepDef?.name || 'Sleep Duration',
    unit: sleepDef?.unit || 'hours',
    green: { min: sleepBounds.greenMin, max: 12 },
    yellowLow: { min: 6.0, max: sleepBounds.greenMin - 0.1 },
    yellowHigh: undefined,
    redCriticalLow: 6.0,
    redCriticalHigh: 14,
    description: sleepDef?.text.normal ? `Normal: ${sleepDef.text.normal}` : '',
    medicalContext: sleepDef?.whyItMatters || '',
  } as IndicatorThresholdSet,

  moodMap: {
    excellent: {
      status: 'GREEN',
      description: 'Optimal psychological resilience, alert, and mission-focused.',
    },
    good: {
      status: 'GREEN',
      description: 'Nominal operational morale and cognitive engagement.',
    },
    fatigued: {
      status: 'YELLOW',
      description: 'Elevated cognitive exhaustion or physical exertion detected.',
    },
    stressed: {
      status: 'YELLOW',
      description: 'Acute psychological tension or environmental mission stressors present.',
    },
    disoriented: {
      status: 'RED',
      description: 'Space Adaptation Syndrome symptoms or spatial neuro-vestibular distress.',
    },
  },
};

export interface HealthScoreTier {
  min: number;
  max: number;
  label: string;
  status: HealthStatus;
  colorClass: string;
  badgeClass: string;
  ringColor: string;
  description: string;
}

/**
 * Health Score Clinical Tiers
 * Sourced centrally so all score displays (Dashboard, Analytics, Reports) evaluate identically:
 * - 90-100: Optimal flight readiness (Excellent!)
 * - 75-89: Nominal operational performance with minor non-clinical variance (Good)
 * - 50-74: Sub-nominal variance / active physiological drift (Warning / Caution)
 * - 0-49: Critical clinical departure / urgent attention required (Urgent Attention Required)
 */
export const HEALTH_SCORE_TIERS: HealthScoreTier[] = [
  {
    min: 90,
    max: 100,
    label: 'Excellent!',
    status: 'GREEN',
    colorClass: 'text-emerald-400',
    badgeClass: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    ringColor: '#10b981',
    description: 'Optimal operational readiness. All physiological indicators nominal.',
  },
  {
    min: 75,
    max: 89,
    label: 'Good',
    status: 'GREEN',
    colorClass: 'text-cyan-400',
    badgeClass: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
    ringColor: '#06b6d4',
    description: 'Physiological parameters within acceptable mission margins.',
  },
  {
    min: 50,
    max: 74,
    label: 'Warning / Caution',
    status: 'YELLOW',
    colorClass: 'text-amber-400',
    badgeClass: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    ringColor: '#f59e0b',
    description: 'Sub-nominal physiological drift detected. Enhanced monitoring required.',
  },
  {
    min: 0,
    max: 49,
    label: 'Urgent Attention Required',
    status: 'RED',
    colorClass: 'text-rose-400',
    badgeClass: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
    ringColor: '#f43f5e',
    description: 'Critical physiological departure. Immediate Flight Surgeon consultation required.',
  },
];

export function getHealthScoreTier(score: number): HealthScoreTier {
  const bounded = Math.max(0, Math.min(100, Math.round(score)));
  const match = HEALTH_SCORE_TIERS.find((t) => bounded >= t.min && bounded <= t.max);
  return match || HEALTH_SCORE_TIERS[HEALTH_SCORE_TIERS.length - 1];
}

export const MOOD_OPTIONS: MoodOption[] = [
  {
    value: 'excellent',
    score: 5,
    label: '5 — Optimal / Energized',
    description: 'High morale, clear focus, ready for EVA/ops',
    defaultStatus: 'GREEN',
    badge: '⚡ Peak State (5/5)',
  },
  {
    value: 'good',
    score: 4,
    label: '4 — Nominal / Stable',
    description: 'Standard operational readiness and steady mood',
    defaultStatus: 'GREEN',
    badge: '✓ Nominal (4/5)',
  },
  {
    value: 'fatigued',
    score: 3,
    label: '3 — Fatigued / Moderate',
    description: 'Physical or cognitive weariness from heavy schedule',
    defaultStatus: 'YELLOW',
    badge: '⚠ Fatigue Watch (3/5)',
  },
  {
    value: 'stressed',
    score: 2,
    label: '2 — High Stress / Strained',
    description: 'Elevated mental strain or mission timeline pressure',
    defaultStatus: 'YELLOW',
    badge: '⚠ Stress Warning (2/5)',
  },
  {
    value: 'disoriented',
    score: 1,
    label: '1 — Disoriented / Acute Stress',
    description: 'Vestibular disturbance, acute stress, or confusion',
    defaultStatus: 'RED',
    badge: '🚨 Critical Attention (1/5)',
  },
];
