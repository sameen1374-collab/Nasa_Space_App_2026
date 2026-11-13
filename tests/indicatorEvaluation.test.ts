/**
 * NASA Space Apps Challenge 2026 — Astronaut Health Monitoring Software
 * Unit Tests: Health Indicator Boundary Value & Clinical Rule Verification
 * Authors: Sameen & Abdul Rafay
 *
 * Verifies exact boundary values for all 12 indicators specified in the research data.
 */

import { describe, it, expect } from 'vitest';
import { evaluateIndicatorRule } from '../src/services/healthStatus';

describe('Health Indicator Clinical Rule & Boundary Evaluation Engine', () => {

  // 1. Heart Rate: 40=red 41=yellow 50=yellow 51=green 90=green 91=yellow 130=yellow 131=red
  describe('1. Heart Rate (BPM)', () => {
    it('evaluates exact boundary values', () => {
      expect(evaluateIndicatorRule('heartRate', 40)).toBe('RED');
      expect(evaluateIndicatorRule('heartRate', 41)).toBe('YELLOW');
      expect(evaluateIndicatorRule('heartRate', 50)).toBe('YELLOW');
      expect(evaluateIndicatorRule('heartRate', 51)).toBe('GREEN');
      expect(evaluateIndicatorRule('heartRate', 90)).toBe('GREEN');
      expect(evaluateIndicatorRule('heartRate', 91)).toBe('YELLOW');
      expect(evaluateIndicatorRule('heartRate', 130)).toBe('YELLOW');
      expect(evaluateIndicatorRule('heartRate', 131)).toBe('RED');
    });
  });

  // 2. Systolic Blood Pressure: 90=red 91=yellow 110=yellow 111=green 119=green 120=yellow 180=yellow 181=red
  describe('2. Systolic Blood Pressure (mmHg)', () => {
    it('evaluates exact boundary values', () => {
      expect(evaluateIndicatorRule('systolicBP', 90)).toBe('RED');
      expect(evaluateIndicatorRule('systolicBP', 91)).toBe('YELLOW');
      expect(evaluateIndicatorRule('systolicBP', 110)).toBe('YELLOW');
      expect(evaluateIndicatorRule('systolicBP', 111)).toBe('GREEN');
      expect(evaluateIndicatorRule('systolicBP', 119)).toBe('GREEN');
      expect(evaluateIndicatorRule('systolicBP', 120)).toBe('YELLOW');
      expect(evaluateIndicatorRule('systolicBP', 180)).toBe('YELLOW');
      expect(evaluateIndicatorRule('systolicBP', 181)).toBe('RED');
    });
  });

  // 3. Diastolic Blood Pressure: 59=yellow 60=green 79=green 80=yellow 120=yellow 121=red
  describe('3. Diastolic Blood Pressure (mmHg)', () => {
    it('evaluates exact boundary values and below-60 gap fallback', () => {
      expect(evaluateIndicatorRule('diastolicBP', 59)).toBe('YELLOW');
      expect(evaluateIndicatorRule('diastolicBP', 60)).toBe('GREEN');
      expect(evaluateIndicatorRule('diastolicBP', 79)).toBe('GREEN');
      expect(evaluateIndicatorRule('diastolicBP', 80)).toBe('YELLOW');
      expect(evaluateIndicatorRule('diastolicBP', 120)).toBe('YELLOW');
      expect(evaluateIndicatorRule('diastolicBP', 121)).toBe('RED');
    });
  });

  // 4. Respiratory Rate: 8=red 9=yellow 11=yellow 12=green 20=green 21=yellow 24=yellow 25=red
  describe('4. Respiratory Rate (breaths/min)', () => {
    it('evaluates exact boundary values', () => {
      expect(evaluateIndicatorRule('respiratoryRate', 8)).toBe('RED');
      expect(evaluateIndicatorRule('respiratoryRate', 9)).toBe('YELLOW');
      expect(evaluateIndicatorRule('respiratoryRate', 11)).toBe('YELLOW');
      expect(evaluateIndicatorRule('respiratoryRate', 12)).toBe('GREEN');
      expect(evaluateIndicatorRule('respiratoryRate', 20)).toBe('GREEN');
      expect(evaluateIndicatorRule('respiratoryRate', 21)).toBe('YELLOW');
      expect(evaluateIndicatorRule('respiratoryRate', 24)).toBe('YELLOW');
      expect(evaluateIndicatorRule('respiratoryRate', 25)).toBe('RED');
    });
  });

  // 5. SpO2: 91=red 92=yellow 95=yellow 96=green
  describe('5. Blood Oxygen SpO2 (%)', () => {
    it('evaluates exact boundary values', () => {
      expect(evaluateIndicatorRule('spo2', 91)).toBe('RED');
      expect(evaluateIndicatorRule('spo2', 92)).toBe('YELLOW');
      expect(evaluateIndicatorRule('spo2', 95)).toBe('YELLOW');
      expect(evaluateIndicatorRule('spo2', 96)).toBe('GREEN');
    });
  });

  // 6. Body Temperature: 35.0=red 35.1=yellow 36.0=yellow 36.1=green 38.0=green 38.1=yellow 39.0=yellow 39.1=red
  describe('6. Core Body Temperature (°C)', () => {
    it('evaluates exact boundary values', () => {
      expect(evaluateIndicatorRule('bodyTemperature', 35.0)).toBe('RED');
      expect(evaluateIndicatorRule('bodyTemperature', 35.1)).toBe('YELLOW');
      expect(evaluateIndicatorRule('bodyTemperature', 36.0)).toBe('YELLOW');
      expect(evaluateIndicatorRule('bodyTemperature', 36.1)).toBe('GREEN');
      expect(evaluateIndicatorRule('bodyTemperature', 38.0)).toBe('GREEN');
      expect(evaluateIndicatorRule('bodyTemperature', 38.1)).toBe('YELLOW');
      expect(evaluateIndicatorRule('bodyTemperature', 39.0)).toBe('YELLOW');
      expect(evaluateIndicatorRule('bodyTemperature', 39.1)).toBe('RED');
    });
  });

  // 7. Fasting Glucose: 53=red 54=yellow 69=yellow 70=green 99=green 100=yellow 125=yellow 126=red
  describe('7. Fasting Blood Glucose (mg/dL)', () => {
    it('evaluates exact boundary values', () => {
      expect(evaluateIndicatorRule('fastingGlucose', 53)).toBe('RED');
      expect(evaluateIndicatorRule('fastingGlucose', 54)).toBe('YELLOW');
      expect(evaluateIndicatorRule('fastingGlucose', 69)).toBe('YELLOW');
      expect(evaluateIndicatorRule('fastingGlucose', 70)).toBe('GREEN');
      expect(evaluateIndicatorRule('fastingGlucose', 99)).toBe('GREEN');
      expect(evaluateIndicatorRule('fastingGlucose', 100)).toBe('YELLOW');
      expect(evaluateIndicatorRule('fastingGlucose', 125)).toBe('YELLOW');
      expect(evaluateIndicatorRule('fastingGlucose', 126)).toBe('RED');
    });
  });

  // 8. Cabin CO2: 3.0=green 3.1=yellow 4.5=yellow 4.6=red
  describe('8. Cabin CO2 (mmHg)', () => {
    it('evaluates exact boundary values', () => {
      expect(evaluateIndicatorRule('cabinCO2', 3.0)).toBe('GREEN');
      expect(evaluateIndicatorRule('cabinCO2', 3.1)).toBe('YELLOW');
      expect(evaluateIndicatorRule('cabinCO2', 4.5)).toBe('YELLOW');
      expect(evaluateIndicatorRule('cabinCO2', 4.6)).toBe('RED');
    });
  });

  // 9. Radiation Dose: 299=green 300=yellow 599=yellow 600=red
  describe('9. Radiation Dose Career Total (mSv)', () => {
    it('evaluates exact boundary values', () => {
      expect(evaluateIndicatorRule('radiationDose', 299)).toBe('GREEN');
      expect(evaluateIndicatorRule('radiationDose', 300)).toBe('YELLOW');
      expect(evaluateIndicatorRule('radiationDose', 599)).toBe('YELLOW');
      expect(evaluateIndicatorRule('radiationDose', 600)).toBe('RED');
    });
  });

  // 10. Sleep Hours: 7=green 6.9=yellow, one night 5.9=yellow, three nights in a row under 6=red
  describe('10. Sleep Duration & Consecutive Nights Streak Rule', () => {
    it('evaluates nominal and single-night sub-thresholds', () => {
      expect(evaluateIndicatorRule('sleepHours', 7.0)).toBe('GREEN');
      expect(evaluateIndicatorRule('sleepHours', 6.9)).toBe('YELLOW');
      // Single night 5.9 without history is YELLOW (not RED)
      expect(evaluateIndicatorRule('sleepHours', 5.9, [])).toBe('YELLOW');
      // Two nights under 6 without 3rd is still YELLOW
      expect(evaluateIndicatorRule('sleepHours', 5.9, [5.5])).toBe('YELLOW');
      // Three nights in a row under 6 (today 5.9, yesterday 5.8, day before 5.5) -> RED
      expect(evaluateIndicatorRule('sleepHours', 5.9, [5.8, 5.5])).toBe('RED');
    });
  });

  // 11. Exercise Minutes: 120=green 119=yellow, one day 59=yellow, two days in a row under 60=red
  describe('11. Exercise Duration & 2-Day Streak Rule', () => {
    it('evaluates nominal and multi-day streak conditions', () => {
      expect(evaluateIndicatorRule('exerciseMinutes', 120)).toBe('GREEN');
      expect(evaluateIndicatorRule('exerciseMinutes', 119)).toBe('YELLOW');
      // One day under 60 is YELLOW
      expect(evaluateIndicatorRule('exerciseMinutes', 59, [])).toBe('YELLOW');
      // Two days in a row under 60 (today 59, yesterday 50) -> RED
      expect(evaluateIndicatorRule('exerciseMinutes', 59, [50])).toBe('RED');
      // Interrupted streak (today 59, yesterday 120) -> YELLOW
      expect(evaluateIndicatorRule('exerciseMinutes', 59, [120])).toBe('YELLOW');
    });
  });

  // 12. Mood (1-5): 4=green 3=yellow, one day of 2=yellow, two days in a row of 1 or 2=red
  describe('12. Mood Self-Check & 2-Day Streak Rule', () => {
    it('evaluates nominal and multi-day streak conditions', () => {
      expect(evaluateIndicatorRule('mood', 4)).toBe('GREEN');
      expect(evaluateIndicatorRule('mood', 3)).toBe('YELLOW');
      // One day of 2 is YELLOW
      expect(evaluateIndicatorRule('mood', 2, [])).toBe('YELLOW');
      // One day of 1 is YELLOW
      expect(evaluateIndicatorRule('mood', 1, [])).toBe('YELLOW');
      // Two days in a row of 1 or 2 (today 2, yesterday 2) -> RED
      expect(evaluateIndicatorRule('mood', 2, [2])).toBe('RED');
      // Two days in a row of 1 or 2 (today 1, yesterday 2) -> RED
      expect(evaluateIndicatorRule('mood', 1, [2])).toBe('RED');
      // Interrupted streak (today 2, yesterday 4) -> YELLOW
      expect(evaluateIndicatorRule('mood', 2, [4])).toBe('YELLOW');
    });
  });
});

