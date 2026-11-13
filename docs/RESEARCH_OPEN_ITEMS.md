# Research Open Items & Clinical Baseline Gaps

**Project:** Aegis Health — NASA Space Apps Challenge 2026  
**Document Authors:** Abdul Rafay (Lead Developer), Sameen (Second Developer)  
**Primary Research Sources:**
- `src/data/research/indicators.json` (Curated by Eman Saleem & Moazzama)
- `docs/research/Eman_Research_Phase1_2.pdf`
- `docs/research/nasa_final.xlsx`

This document tracks ambiguities, mathematical boundary gaps, and unresolved team decisions identified during the clinical data integration on branch `sameen`.

---

## 1. Diastolic Blood Pressure Below 60 mmHg
- **Current Research Definition:**
  - Normal: 60 – 79 mmHg
  - Warning: 80 – 120 mmHg
  - Urgent: > 120 mmHg
- **Identified Gap:** The research literature defines no explicit category for diastolic arterial pressure strictly below 60 mmHg (hypotension).
- **Engineering Fallback Applied:** Fallback to **YELLOW (Warning / Sub-nominal)** in accordance with `indicators.json` fallback rule (`"otherwise": "warning"`).
- **Action Item for Medical Lead (Eman):** Confirm whether diastolic $\le 50$ mmHg or $\le 40$ mmHg should trigger RED (hypotensive crisis / perfusion syncope in microgravity).

---

## 2. Single-Day Sub-Threshold Fallbacks (Streak Indicators)
Three indicators incorporate multi-day streak criteria for critical alerts:
1. **Sleep Duration (`sleepHours`):**
   - Urgent rule: $< 6$ hours for 3 consecutive nights in a row $\to$ **RED**.
   - Normal rule: $\ge 7$ hours $\to$ **GREEN**.
   - *Gap:* Research does not explicitly define single or double nights $< 6$ hours.
   - *Fallback:* Evaluates to **YELLOW (Warning)** for 1 or 2 nights $< 6$ hours.
2. **Exercise Duration (`exerciseMinutes`):**
   - Urgent rule: $< 60$ minutes for 2 consecutive days $\to$ **RED**.
   - Normal rule: $\ge 120$ minutes $\to$ **GREEN**.
   - *Gap:* Single missed or truncated exercise session ($< 60$ min) not defined.
   - *Fallback:* Evaluates to **YELLOW (Warning)** for a single day $< 60$ minutes.
3. **Psychological Morale / Mood Score (`mood` 1–5):**
   - Urgent rule: Score $\le 2$ for 2 consecutive days $\to$ **RED**.
   - Normal rule: Score $\ge 4$ $\to$ **GREEN**.
   - *Gap:* Single day score $\le 2$ not explicitly defined.
   - *Fallback:* Evaluates to **YELLOW (Warning)** for a single day $\le 2$.

---

## 3. Fasting Blood Glucose Protocol Decision
- **Research Note:** *"Decision needed, team to decide whether to keep it."*
- **Operational Reality:** Astronauts aboard the ISS/Orion do not routinely perform daily finger-prick fasting capillary blood glucose testing due to consumable limitations and minimal microgravity necessity.
- **Implementation Status:** Maintained as an **OPTIONAL** check-in indicator. Astronauts can leave the field empty without blocking daily check-in completion or mission streak calculations.

---

## 4. Radiation Dose Career Total & Baseline Origin
- **Research Definition:**
  - Normal: $< 300$ mSv (career total)
  - Warning: 300 – 599 mSv
  - Urgent: $\ge 600$ mSv (NASA lifetime career limit)
- **Identified Gap:** Daily personal dosimeters measure incremental exposure (e.g., $0.3 - 1.2$ mSv/day). The research document does not specify where previous career baseline doses originate.
- **Engineering Solution:** 
  - Astronaut profile provides `previousCareerRadiationDose` (defaulting to 0 mSv for first-time flyers).
  - The check-in form prompts for today's dosimeter reading (mSv).
  - The software computes and displays the running career total: $\text{Profile Baseline} + \sum \text{Daily Logged Doses}$.
  - Threshold status evaluation evaluates against the running career total.
  - A dedicated informational note highlights the NASA OCHMO TB-020 rule: single Solar Particle Event (SPE) threshold limit of 250 mSv.

---

## 5. Team-Defined Thresholds Requiring Official Review
The following thresholds represent engineering and mission design assumptions made by the team rather than NASA standard clinical rules:
- `sleepHours`: 3-night red streak rule.
- `radiationDose`: 300 mSv warning boundary (50% career limit).
- `exerciseMinutes`: 60 min cut-off and 2-day consecutive red streak rule.
- `mood`: 1–5 qualitative Likert scale and 2-day streak rule.

Each of these four indicators displays a `"Team-defined threshold, pending approval"` badge with tooltip explanation in the user interface.

