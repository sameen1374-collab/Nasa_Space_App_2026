/**
 * NASA Space Apps Challenge 2026 — Astronaut Health Monitoring Software
 * Module: Storage Service (LocalStorage Prototype)
 * Lead Developer: Abdul Rafay (Phase 1 Architecture)
 * 
 * Manages assessment records and crew profile in browser LocalStorage.
 * Auto-seeds realistic sample demonstration data if empty.
 */

import { DailyAssessmentRecord, AstronautProfile } from '../types/health';
import { SAMPLE_ASTRONAUT_PROFILE, SAMPLE_ASSESSMENT_HISTORY } from '../data/mockData';

const ASSESSMENTS_STORAGE_KEY = 'aegis_astronaut_health_records_v1';
const PROFILE_STORAGE_KEY = 'aegis_astronaut_profile_v1';

/**
 * Retrieves all stored assessment records (newest first).
 * Automatically seeds sample demonstration data on first launch.
 */
export function getStoredAssessments(): DailyAssessmentRecord[] {
  try {
    const raw = localStorage.getItem(ASSESSMENTS_STORAGE_KEY);
    if (!raw) {
      // Seed with initial realistic demonstration records
      saveAssessmentsToStorage(SAMPLE_ASSESSMENT_HISTORY);
      return SAMPLE_ASSESSMENT_HISTORY;
    }
    const parsed = JSON.parse(raw) as DailyAssessmentRecord[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveAssessmentsToStorage(SAMPLE_ASSESSMENT_HISTORY);
      return SAMPLE_ASSESSMENT_HISTORY;
    }
    // Ensure records are always sorted newest first (by timestamp descending, Sol descending)
    return parsed.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
        return timeB - timeA;
      }
      return b.missionDay - a.missionDay;
    });
  } catch (err) {
    console.error('[Aegis Storage] Failed reading records from LocalStorage:', err);
    return SAMPLE_ASSESSMENT_HISTORY;
  }
}

/**
 * Saves full array of records to LocalStorage
 */
export function saveAssessmentsToStorage(records: DailyAssessmentRecord[]): void {
  try {
    localStorage.setItem(ASSESSMENTS_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('[Aegis Storage] Failed saving records to LocalStorage:', err);
  }
}

/**
 * Adds a new daily assessment record at the top of history
 */
export function saveAssessment(record: DailyAssessmentRecord): DailyAssessmentRecord[] {
  const current = getStoredAssessments();
  const filtered = current.filter((r) => r.id !== record.id);
  const updated = [record, ...filtered].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
      return timeB - timeA;
    }
    return b.missionDay - a.missionDay;
  });
  saveAssessmentsToStorage(updated);
  return updated;
}

/**
 * Finds an assessment by unique ID
 */
export function getAssessmentById(id: string): DailyAssessmentRecord | undefined {
  const all = getStoredAssessments();
  return all.find((item) => item.id === id);
}

/**
 * Gets the most recent submitted assessment record.
 * Prioritizes actual astronaut check-ins over demonstration seed records.
 */
export function getLatestAssessment(): DailyAssessmentRecord | undefined {
  const all = getStoredAssessments();
  if (all.length === 0) return undefined;
  const realRecords = all.filter((r) => !r.isDemonstrationData);
  return (realRecords.length > 0 ? realRecords : all)[0];
}

/**
 * Checks if a real assessment was completed on the current mission day
 */
export function hasCompletedTodayAssessment(currentMissionDay: number): boolean {
  const all = getStoredAssessments();
  const realToday = all.find(
    (r) => !r.isDemonstrationData && r.missionDay === currentMissionDay
  );
  return !!realToday;
}

/**
 * Retrieves the astronaut profile
 */
export function getAstronautProfile(): AstronautProfile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(SAMPLE_ASTRONAUT_PROFILE));
      return SAMPLE_ASTRONAUT_PROFILE;
    }
    return JSON.parse(raw) as AstronautProfile;
  } catch (err) {
    console.error('[Aegis Storage] Failed reading profile from LocalStorage:', err);
    return SAMPLE_ASTRONAUT_PROFILE;
  }
}

/**
 * Updates the astronaut profile
 */
export function saveAstronautProfile(profile: AstronautProfile): void {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('[Aegis Storage] Failed saving profile to LocalStorage:', err);
  }
}

/**
 * Computes running cumulative career radiation dose:
 * astronaut baseline (default 0) + sum of all daily doses entered in history
 */
export function getCumulativeRadiationDose(profile: AstronautProfile, additionalTodayDose: number = 0): number {
  const records = getStoredAssessments();
  const pastDailyDoses = records.reduce((sum, r) => sum + (r.values.radiationDose || 0), 0);
  const baseline = profile.previousCareerRadiationDose || 0;
  return Number((baseline + pastDailyDoses + additionalTodayDose).toFixed(2));
}

/**
 * Resets storage back to initial sample demonstration data
 */
export function resetToSampleData(): DailyAssessmentRecord[] {
  saveAssessmentsToStorage(SAMPLE_ASSESSMENT_HISTORY);
  saveAstronautProfile(SAMPLE_ASTRONAUT_PROFILE);
  return SAMPLE_ASSESSMENT_HISTORY;
}

/**
 * Completely clears all assessment records (useful for fresh testing)
 */
export function clearAllAssessments(): void {
  localStorage.removeItem(ASSESSMENTS_STORAGE_KEY);
}

