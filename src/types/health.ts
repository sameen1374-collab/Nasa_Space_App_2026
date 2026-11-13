/**
 * NASA Space Apps Challenge 2026 — Astronaut Health Monitoring Software
 * Module: Health Type Definitions
 * Authors: Abdul Rafay (Lead), Sameen (Second Developer)
 * Clinical Evidence: Eman Saleem & Moazzama (Medical Research Leads)
 */

export type HealthStatus = 'GREEN' | 'YELLOW' | 'RED';

export type MoodType = 'excellent' | 'good' | 'fatigued' | 'stressed' | 'disoriented';

export type MoodScore = 1 | 2 | 3 | 4 | 5;

export interface MoodOption {
  value: MoodType;
  score: MoodScore;
  label: string;
  description: string;
  defaultStatus: HealthStatus;
  badge: string;
}

export type IndicatorId =
  | 'heartRate'
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
  // Legacy aliases for backward compatibility
  | 'bloodPressure'
  | 'bloodSugar'
  | 'sleepDuration';

export interface AssessmentFormValues {
  heartRate: string;
  systolicBP: string;
  diastolicBP: string;
  respiratoryRate: string;
  spo2: string;
  bodyTemperature: string;
  fastingGlucose: string;
  sleepHours: string;
  cabinCO2: string;
  radiationDose: string; // Today's logged dose (mSv)
  exerciseMinutes: string;
  mood: string; // "1" - "5"
  notes?: string;

  // Legacy field aliases
  systolic?: string;
  diastolic?: string;
  bloodSugar?: string;
  sleepDuration?: string;
}

export interface ParsedAssessmentValues {
  heartRate: number;
  systolicBP: number;
  diastolicBP: number;
  respiratoryRate?: number;
  spo2?: number;
  bodyTemperature: number;
  fastingGlucose?: number;
  sleepHours: number;
  cabinCO2?: number;
  radiationDose?: number; // Today's increment (mSv)
  cumulativeRadiationDose?: number; // Running career total (mSv)
  exerciseMinutes?: number;
  mood: number; // 1 - 5
  notes?: string;

  // Legacy aliases
  systolic?: number;
  diastolic?: number;
  bloodSugar?: number;
  sleepDuration?: number;
}

export interface IndicatorMeasurementGuide {
  equipment: string;
  whyNeeded: string;
  howToMeasure: string;
  howOften: string;
  source?: {
    name: string;
    url: string;
  };
}

export interface IndicatorSourceRef {
  name: string;
  url: string;
}

export interface IndicatorResult {
  indicatorId: IndicatorId;
  displayName: string;
  valueDisplay: string;
  numericValue?: number;
  secondaryValue?: number;
  unit: string;
  status: HealthStatus;
  statusLabel: string;
  reason: string;
  nominalRangeLabel: string;
  baselineNominal?: string;
  deviationPercent?: number;
  criticality: 'low' | 'medium' | 'high';
  teamChoice?: boolean;
  teamChoiceNote?: string;
  sources?: IndicatorSourceRef[];
  measurement?: IndicatorMeasurementGuide;
}

export interface OverallHealthResult {
  status: HealthStatus;
  statusLabel: string;
  summary: string;
  alertTitle: string;
  normalCount: number;
  warningCount: number;
  urgentCount: number;
  score: number; // 0 - 100 health composite index
  recommendationSnippet: string;
}

export interface DailyAssessmentRecord {
  id: string;
  timestamp: string; // ISO 8601
  missionDay: number;
  astronautId: string;
  values: ParsedAssessmentValues;
  results: {
    heartRate: IndicatorResult;
    systolicBP?: IndicatorResult;
    diastolicBP?: IndicatorResult;
    respiratoryRate?: IndicatorResult;
    spo2?: IndicatorResult;
    bodyTemperature: IndicatorResult;
    fastingGlucose?: IndicatorResult;
    sleepHours?: IndicatorResult;
    cabinCO2?: IndicatorResult;
    radiationDose?: IndicatorResult;
    exerciseMinutes?: IndicatorResult;
    mood: IndicatorResult;

    // Legacy backward-compatibility getters
    bloodPressure: IndicatorResult;
    bloodSugar: IndicatorResult;
    sleepDuration: IndicatorResult;
    [key: string]: IndicatorResult | undefined;
  };
  overall: OverallHealthResult;
  isDemonstrationData?: boolean;
}

export interface AstronautProfile {
  id: string;
  name: string;
  callSign: string;
  rank: string;
  role: string;
  missionName: string;
  spacecraft: string;
  currentMissionDay: number;
  age: number;
  bloodType: string;
  restingHeartRateBaseline: number; // BPM
  bloodPressureBaseline: { systolic: number; diastolic: number };
  bodyTemperatureBaseline: number; // °C
  previousCareerRadiationDose?: number; // Baseline accumulated mSv
  avatarUrl?: string;
}

export interface ThresholdBoundary {
  min: number;
  max: number;
}

export interface IndicatorThresholdSet {
  name: string;
  unit: string;
  green: ThresholdBoundary;
  yellowLow?: ThresholdBoundary;
  yellowHigh?: ThresholdBoundary;
  redCriticalLow: number;
  redCriticalHigh: number;
  description: string;
  medicalContext: string;
}

export interface BloodPressureThresholdSet {
  name: string;
  unit: string;
  systolic: {
    green: ThresholdBoundary;
    yellowLow?: ThresholdBoundary;
    yellowHigh?: ThresholdBoundary;
    redCriticalLow: number;
    redCriticalHigh: number;
  };
  diastolic: {
    green: ThresholdBoundary;
    yellowLow?: ThresholdBoundary;
    yellowHigh?: ThresholdBoundary;
    redCriticalLow: number;
    redCriticalHigh: number;
  };
  description: string;
  medicalContext: string;
}

export interface MasterHealthThresholds {
  version: string;
  lastUpdated: string;
  curator: string;
  isDemonstrationPrototype: boolean;
  heartRate: IndicatorThresholdSet;
  bloodPressure: BloodPressureThresholdSet;
  bloodSugar: IndicatorThresholdSet;
  bodyTemperature: IndicatorThresholdSet;
  sleepDuration: IndicatorThresholdSet;
  moodMap: Record<MoodType, { status: HealthStatus; description: string }>;
}
