/**
 * NASA Space Apps Challenge 2026 — Astronaut Health Monitoring Software
 * Module: Fictional Sample / Demonstration Records
 * Authors: Abdul Rafay (Lead), Sameen (Second Developer)
 *
 * 14-day realistic demonstration dataset incorporating all 12 clinical indicators.
 * Demonstrates nominal operations, sub-nominal yellow days, a 3-night sleep restriction
 * streak (<6h triggering RED), and an acute tachycardia red moment.
 */

import { AstronautProfile, DailyAssessmentRecord, ParsedAssessmentValues } from '../types/health';
import { evaluateAllIndicators, calculateOverallHealth } from '../services/healthStatus';

export const SAMPLE_ASTRONAUT_PROFILE: AstronautProfile = {
  id: 'ASTRO-7704',
  name: 'Cmdr. Alex Vance',
  callSign: 'ORION-LEAD',
  rank: 'Commander / Senior Pilot',
  role: 'Mission Commander & Lead Flight Specialist',
  missionName: 'Artemis VII — Deep Space Habitat Mars Transit Analog',
  spacecraft: 'Aegis Deep-Space Transit Habitat (DSH-04)',
  currentMissionDay: 143,
  age: 39,
  bloodType: 'O-Negative',
  restingHeartRateBaseline: 62, // BPM
  bloodPressureBaseline: {
    systolic: 116,
    diastolic: 74,
  },
  bodyTemperatureBaseline: 36.8, // °C
  previousCareerRadiationDose: 140, // Baseline career mSv before mission
};

interface RawDayTelemetry {
  missionDay: number;
  daysAgo: number;
  hr: number;
  sys: number;
  dia: number;
  resp: number;
  spo2: number;
  temp: number;
  glucose: number;
  sleep: number;
  co2: number;
  rad: number;
  exercise: number;
  mood: number;
  notes: string;
}

const RAW_14_DAY_TELEMETRY: RawDayTelemetry[] = [
  // Day 1 (Sol 130) - Baseline Nominal
  { missionDay: 130, daysAgo: 13, hr: 62, sys: 115, dia: 72, resp: 14, spo2: 98, temp: 36.6, glucose: 84, sleep: 8.0, co2: 2.1, rad: 0.4, exercise: 130, mood: 5, notes: 'Mission Sol 130 start. All telemetry nominal. Completed 130 min on ARED and T2 treadmill.' },
  // Day 2 (Sol 131) - Nominal
  { missionDay: 131, daysAgo: 12, hr: 64, sys: 116, dia: 74, resp: 15, spo2: 99, temp: 36.7, glucose: 88, sleep: 7.8, co2: 2.3, rad: 0.5, exercise: 125, mood: 5, notes: 'Nominal habitat systems maintenance and plant growth experiment inspection.' },
  // Day 3 (Sol 132) - Nominal
  { missionDay: 132, daysAgo: 11, hr: 63, sys: 114, dia: 73, resp: 14, spo2: 98, temp: 36.6, glucose: 86, sleep: 7.5, co2: 2.2, rad: 0.4, exercise: 120, mood: 4, notes: 'Standard duty cycle. Hydration electrolyte balance verified.' },
  // Day 4 (Sol 133) - Nominal
  { missionDay: 133, daysAgo: 10, hr: 66, sys: 117, dia: 75, resp: 16, spo2: 97, temp: 36.8, glucose: 90, sleep: 7.2, co2: 2.4, rad: 0.5, exercise: 125, mood: 4, notes: 'Pre-EVA robotic arm teleoperation simulation completed.' },
  // Day 5 (Sol 134) - Occasional Yellow (sub-target exercise & sleep deficit)
  { missionDay: 134, daysAgo: 9, hr: 72, sys: 118, dia: 76, resp: 16, spo2: 97, temp: 36.9, glucose: 92, sleep: 6.4, co2: 2.8, rad: 0.6, exercise: 85, mood: 3, notes: 'Extended cargo module berthing shift ran into rest period. Truncated exercise.' },
  // Day 6 (Sol 135) - Recovery Nominal
  { missionDay: 135, daysAgo: 8, hr: 65, sys: 116, dia: 74, resp: 14, spo2: 98, temp: 36.7, glucose: 85, sleep: 7.6, co2: 2.5, rad: 0.4, exercise: 130, mood: 4, notes: 'Full recovery exercise completed. Fluid intake boosted.' },
  // Day 7 (Sol 136) - Rest Sol Nominal
  { missionDay: 136, daysAgo: 7, hr: 63, sys: 115, dia: 73, resp: 15, spo2: 98, temp: 36.6, glucose: 86, sleep: 8.2, co2: 2.3, rad: 0.5, exercise: 125, mood: 5, notes: 'Earth communication uplink and recreational downtime in Cupola.' },
  // Day 8 (Sol 137) - Occasional Yellow (Elevated cabin CO2 3.4 mmHg)
  { missionDay: 137, daysAgo: 6, hr: 68, sys: 119, dia: 77, resp: 18, spo2: 96, temp: 37.0, glucose: 94, sleep: 7.1, co2: 3.4, rad: 0.6, exercise: 120, mood: 3, notes: 'CDRA bed scrubber cycle transition caused temporary cabin CO2 elevation to 3.4 mmHg. Mild headache noted.' },
  // Day 9 (Sol 138) - Acute RED Moment (Acute Post-EVA Tachycardia: 134 BPM)
  { missionDay: 138, daysAgo: 5, hr: 134, sys: 142, dia: 88, resp: 22, spo2: 94, temp: 38.3, glucose: 104, sleep: 6.2, co2: 2.7, rad: 1.2, exercise: 120, mood: 2, notes: 'Post-EVA suit ingress alert: Resting heart rate elevated to 134 BPM. Initiated oral rehydration and Flight Surgeon voice loop.' },
  // Day 10 (Sol 139) - Post-Crisis Stabilization
  { missionDay: 139, daysAgo: 4, hr: 78, sys: 122, dia: 78, resp: 15, spo2: 97, temp: 37.1, glucose: 96, sleep: 7.5, co2: 2.4, rad: 0.5, exercise: 90, mood: 4, notes: 'Heart rate stabilized after 2.0 L isotonic rehydration. Light exercise only.' },
  // Day 11 (Sol 140) - Sleep Restriction Night 1 (<6h -> Yellow)
  { missionDay: 140, daysAgo: 3, hr: 68, sys: 118, dia: 76, resp: 16, spo2: 97, temp: 36.8, glucose: 91, sleep: 5.6, co2: 2.5, rad: 0.5, exercise: 120, mood: 3, notes: 'Night 1 of emergency coolant pump repairs. Sleep truncated to 5.6 hours.' },
  // Day 12 (Sol 141) - Sleep Restriction Night 2 (<6h -> Yellow)
  { missionDay: 141, daysAgo: 2, hr: 74, sys: 122, dia: 79, resp: 16, spo2: 96, temp: 36.9, glucose: 95, sleep: 5.4, co2: 2.6, rad: 0.6, exercise: 110, mood: 3, notes: 'Night 2 of telemetry diagnostics. Sleep 5.4 hours. Noted cognitive weariness.' },
  // Day 13 (Sol 142) - Sleep Restriction Night 3 in a row (<6h -> RED STREAK TRIGGERED)
  { missionDay: 142, daysAgo: 1, hr: 82, sys: 126, dia: 82, resp: 17, spo2: 96, temp: 37.2, glucose: 98, sleep: 5.2, co2: 2.9, rad: 0.5, exercise: 95, mood: 2, notes: 'Night 3 under 6h (5.2 hrs). Triggers mandatory 3-night sleep debt RED flight alert. Stood down from high-risk tasks.' },
  // Day 14 (Sol 143) - Today: Recovery Sleep & Full Nominal Return
  { missionDay: 143, daysAgo: 0, hr: 66, sys: 116, dia: 74, resp: 15, spo2: 98, temp: 36.7, glucose: 88, sleep: 8.5, co2: 2.3, rad: 0.4, exercise: 125, mood: 5, notes: 'Protected 8.5-hour recovery sleep cycle. Cognitive readiness restored. All biometrics nominal.' },
];

function buildDemoHistory(): DailyAssessmentRecord[] {
  const records: DailyAssessmentRecord[] = [];
  const now = Date.now();

  // Process chronologically so running radiation and streaks calculate properly
  RAW_14_DAY_TELEMETRY.forEach((item, index) => {
    const timestamp = new Date(now - item.daysAgo * 86400000).toISOString();
    const parsedValues: ParsedAssessmentValues = {
      heartRate: item.hr,
      systolicBP: item.sys,
      diastolicBP: item.dia,
      respiratoryRate: item.resp,
      spo2: item.spo2,
      bodyTemperature: item.temp,
      fastingGlucose: item.glucose,
      sleepHours: item.sleep,
      cabinCO2: item.co2,
      radiationDose: item.rad,
      exerciseMinutes: item.exercise,
      mood: item.mood,
      notes: item.notes,

      // Legacy compatibility aliases
      systolic: item.sys,
      diastolic: item.dia,
      bloodSugar: item.glucose,
      sleepDuration: item.sleep,
    };

    // Past records for streak evaluation (sorted newest to oldest)
    const pastRecords = [...records].reverse();
    const results = evaluateAllIndicators(parsedValues, SAMPLE_ASTRONAUT_PROFILE, pastRecords);
    const overall = calculateOverallHealth(results);

    records.push({
      id: `REC-DEMO-SOL${item.missionDay}-${index + 1}`,
      timestamp,
      missionDay: item.missionDay,
      astronautId: SAMPLE_ASTRONAUT_PROFILE.id,
      values: parsedValues,
      results,
      overall,
      isDemonstrationData: true,
    });
  });

  // Return sorted newest first (standard Aegis convention)
  return records.reverse();
}

export const SAMPLE_ASSESSMENT_HISTORY: DailyAssessmentRecord[] = buildDemoHistory();
