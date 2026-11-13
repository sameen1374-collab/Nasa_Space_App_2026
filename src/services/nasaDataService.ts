/**
 * NASA Space Apps Challenge 2026 — Astronaut Health Monitoring Software
 * Module: NASA Data Import & HRP Evidence Service
 * Lead Developer: Abdul Rafay (Phase 2 Deliverable)
 * 
 * Prepares the architectural structure for importing NASA Human Research Program (HRP)
 * telemetry, Life Sciences Data Archive (LSDA) records, and flight rule databases.
 */

import hrpEvidenceData from '../data/nasa/hrpEvidence.json';
import { DailyAssessmentRecord, AstronautProfile } from '../types/health';
import { evaluateAllIndicators, calculateOverallHealth } from './healthStatus';

export interface NasaImportResult {
  recordsImported: number;
  newAssessments: DailyAssessmentRecord[];
  flightRulesLoaded: number;
  datasetVersion: string;
}

/**
 * Imports structured NASA HRP demonstration telemetry into the application's
 * assessment record format with full automatic triage evaluation.
 */
export function importNasaHrpTelemetry(profile: AstronautProfile): NasaImportResult {
  const hrp = hrpEvidenceData;
  const newAssessments: DailyAssessmentRecord[] = hrp.sampleAstronautTelemetry.map((item, index) => {
    const moodScore = item.mood === 'disoriented' ? 1 : item.mood === 'stressed' ? 2 : item.mood === 'fatigued' ? 3 : item.mood === 'good' ? 4 : 5;
    const parsedValues = {
      heartRate: item.heartRate,
      systolicBP: item.systolic,
      diastolicBP: item.diastolic,
      fastingGlucose: item.bloodSugar,
      bodyTemperature: item.bodyTemperature,
      sleepHours: item.sleepDuration,
      mood: moodScore,
      systolic: item.systolic,
      diastolic: item.diastolic,
      bloodSugar: item.bloodSugar,
      sleepDuration: item.sleepDuration,
      notes: `[NASA HRP UPLINK]: ${item.flightNotes}`,
    };

    const results = evaluateAllIndicators(parsedValues, profile);
    const overall = calculateOverallHealth(results);

    return {
      id: `NASA-HRP-SOL${item.sol}-${Date.now() + index}`,
      timestamp: new Date(Date.now() - (48 - item.sol) * 86400000).toISOString(),
      missionDay: item.sol,
      astronautId: profile.id,
      values: parsedValues,
      results,
      overall,
      isDemonstrationData: true,
    };
  });

  return {
    recordsImported: newAssessments.length,
    newAssessments,
    flightRulesLoaded: hrp.flightRules.length,
    datasetVersion: hrp.missionMetadata.datasetVersion,
  };
}

/**
 * Returns NASA Flight Rules applicable to astronaut monitoring
 */
export function getNasaFlightRules() {
  return hrpEvidenceData.flightRules;
}

