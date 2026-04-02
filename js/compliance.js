// ============================================================
// SEA SERVICE LOGGER — Compliance Calculation Engine
// NMC (USCG) and MCA rules
// ============================================================

/**
 * Compute credential-relevant metrics from raw log entries.
 *
 * @param {Array}  entries  - LogEntry records
 * @param {Array}  vessels  - Vessel records (for COI two-watch lookup)
 * @param {string} mode     - 'USCG' | 'MCA' | 'both'
 * @returns {Object}        - Compliance summary
 */
export function computeCompliance(entries, vessels, mode = 'USCG') {
  const vesselMap = Object.fromEntries(vessels.map(v => [v.id, v]));
  const now = new Date();
  const threeYearsAgo = new Date(now);
  threeYearsAgo.setFullYear(now.getFullYear() - 3);
  const fiveYearsAgo = new Date(now);
  fiveYearsAgo.setFullYear(now.getFullYear() - 5);

  let totalDays = 0;
  let daysPast3Years = 0;
  let daysPast5Years = 0;
  let totalHours = 0;
  let watchHours = 0;

  const daysByWaters = { inland: 0, near_coastal: 0, offshore: 0, great_lakes: 0 };
  const daysByVessel = {};

  // Deduplicate: same calendar date across vessels — count max once per day
  // (NMC policy: can't claim same day on two vessels)
  const datesSeen = new Set();

  for (const entry of entries) {
    if (entry.status === 'off_hire') continue;

    const vessel = vesselMap[entry.vesselId];
    const entryDate = new Date(entry.date);

    // --- Day credit calculation ---
    let dayCredit = 0;
    const hours = entry.hours || 8;

    if (mode === 'USCG') {
      // On vessels under 100 GRT: minimum 4 hours required, credit = 1 day
      // On two-watch authorised vessels: 12h = 1.5 days
      const grt = vessel?.grt || 9999;
      const twoWatch = vessel?.coiTwoWatch || false;

      if (grt < 100 && hours < 4) {
        // No credit
        dayCredit = 0;
      } else if (twoWatch && hours === 12) {
        dayCredit = 1.5;
      } else {
        dayCredit = 1;
      }
    } else {
      // MCA: days as logged
      dayCredit = 1;
    }

    if (dayCredit === 0) continue;

    // --- Deduplicate dates ---
    const dateKey = entry.date;
    if (datesSeen.has(dateKey)) {
      // Date already counted — skip but still warn (handled upstream)
      continue;
    }
    datesSeen.add(dateKey);

    totalDays += dayCredit;
    totalHours += hours;
    watchHours += entry.watchkeepingHours || 0;

    // Waters breakdown
    const waters = entry.waters || 'inland';
    if (daysByWaters[waters] !== undefined) {
      daysByWaters[waters] += dayCredit;
    }

    // Time windows
    if (entryDate >= threeYearsAgo) daysPast3Years += dayCredit;
    if (entryDate >= fiveYearsAgo)  daysPast5Years += dayCredit;

    // Per-vessel accumulation
    if (!daysByVessel[entry.vesselId]) {
      daysByVessel[entry.vesselId] = {
        vesselId:  entry.vesselId,
        name:      vessel?.name || 'Unknown vessel',
        days:      0,
        start:     entry.date,
        end:       entry.date,
      };
    }
    const vEntry = daysByVessel[entry.vesselId];
    vEntry.days += dayCredit;
    if (entry.date < vEntry.start) vEntry.start = entry.date;
    if (entry.date > vEntry.end)   vEntry.end   = entry.date;
  }

  // NMC equivalents: 1 month = 30 days, 1 year = 360 days
  const nmcMonths = totalDays / 30;
  const nmcYears  = totalDays / 360;

  return {
    totalDays:       round2(totalDays),
    daysPast3Years:  round2(daysPast3Years),
    daysPast5Years:  round2(daysPast5Years),
    totalHours,
    watchHours,
    daysByWaters,
    daysByVessel:    Object.values(daysByVessel),
    nmcMonths:       round2(nmcMonths),
    nmcYears:        round2(nmcYears),
  };
}

// --- CG-719S box validation ---

/**
 * Validate that the waters boxes sum correctly (NMC requirement).
 * Box 1 = Box 2 + Box 3 + Box 4
 */
export function validateWatersBoxes(greatLakes, inland, nearCoastal, total) {
  const sum = greatLakes + inland + nearCoastal;
  return Math.abs(sum - total) < 0.01; // floating point tolerance
}

/**
 * Validate that claimed days don't exceed the number of days in a month.
 */
export function validateMonthDays(year, month, claimedDays) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return claimedDays <= daysInMonth;
}

/**
 * Check for duplicate days across vessels in the same month.
 * Returns array of conflicting dates.
 */
export function findDuplicateDays(entries) {
  const dateCount = {};
  for (const entry of entries) {
    if (entry.status === 'off_hire') continue;
    dateCount[entry.date] = (dateCount[entry.date] || 0) + 1;
  }
  return Object.entries(dateCount)
    .filter(([, count]) => count > 1)
    .map(([date]) => date);
}

/**
 * Estimated GRT from vessel dimensions.
 * Formula: GRT ≈ 0.353 × L × B × D
 */
export function estimateGRT(lengthFt, beamFt, depthFt) {
  if (!lengthFt || !beamFt || !depthFt) return null;
  return Math.round(0.353 * lengthFt * beamFt * depthFt);
}

/**
 * Format a day count for display — shows both raw and NMC-equivalent.
 */
export function formatDays(days) {
  const months = (days / 30).toFixed(1);
  return { days: Math.round(days), months };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}
