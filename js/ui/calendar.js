// ============================================================
// SEA SERVICE LOGGER — Calendar Screen
// ============================================================

import {
  getEntriesForMonth, getActiveVessel, getVessels,
} from '../store.js';
import { openLogSheet } from '../logSheet.js';

let currentYear  = new Date().getFullYear();
let currentMonth = new Date().getMonth();

export function initCalendar() {
  renderCalendar();
}

export function renderCalendar() {
  const screen = document.getElementById('screen-calendar');
  const vessels = getVessels();
  const entries = getEntriesForMonth(currentYear, currentMonth);
  const activeVessel = getActiveVessel();

  const entryMap = {};
  for (const e of entries) {
    entryMap[e.date] = e;
  }

  const today     = new Date();
  const todayISO  = today.toISOString().slice(0, 10);
  const monthName = new Date(currentYear, currentMonth, 1)
    .toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    .toUpperCase();

  const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0=Sun
  const startOffset = (firstDay + 6) % 7; // Monday-first offset
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  screen.innerHTML = `
    <!-- Calendar header -->
    <div class="calendar-header">
      <div class="calendar-nav">
        <button class="calendar-nav-btn" id="cal-prev">◁</button>
        <span class="calendar-month-label">${monthName}</span>
        <button class="calendar-nav-btn" id="cal-next">▷</button>
      </div>
      <span class="section-title">${countUnderwayDays(entries)} days</span>
    </div>

    <!-- Day-of-week headers -->
    <div class="calendar-grid-wrap">
      <div class="calendar-dow">
        ${['M','T','W','T','F','S','S'].map(d => `<span>${d}</span>`).join('')}
      </div>

      <!-- Day grid -->
      <div class="calendar-grid" id="cal-grid">
        ${buildGrid(startOffset, daysInMonth, currentYear, currentMonth, entryMap, todayISO)}
      </div>
    </div>

    <!-- Month summary -->
    ${buildMonthlySummary(entries, vessels)}
  `;

  // Navigation
  document.getElementById('cal-prev').addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
  });

  document.getElementById('cal-next').addEventListener('click', () => {
    const now = new Date();
    // Don't go past current month
    if (currentYear === now.getFullYear() && currentMonth >= now.getMonth()) return;
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar();
  });

  // Day tap
  document.getElementById('cal-grid').addEventListener('click', e => {
    const cell = e.target.closest('.calendar-day[data-date]');
    if (!cell) return;
    const date = cell.dataset.date;
    const vessel = activeVessel;
    if (!vessel) {
      alert('Select a vessel first (tap the vessel chip on the Dashboard tab).');
      return;
    }
    const existing = entryMap[date] || null;
    openLogSheet({
      date,
      vessel,
      existing,
      onSave: renderCalendar,
    });
  });
}

// --- Grid builder ---

function buildGrid(startOffset, daysInMonth, year, month, entryMap, todayISO) {
  let cells = '';

  // Empty cells before first day
  for (let i = 0; i < startOffset; i++) {
    cells += `<div class="calendar-day empty"></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateISO = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const entry   = entryMap[dateISO];
    const isToday = dateISO === todayISO;
    const isFuture = dateISO > todayISO;

    let cls = 'calendar-day';
    if (isFuture) cls += ' future';
    else if (isToday) cls += ' today';

    if (entry) {
      if (entry.status === 'underway') cls += ' underway';
      else if (entry.status === 'anchor') cls += ' anchor';
    }

    cells += `<div class="${cls}" data-date="${dateISO}">${d}</div>`;
  }

  return cells;
}

// --- Monthly summary ---

function buildMonthlySummary(entries, vessels) {
  if (entries.length === 0) {
    return `
      <div class="empty-state" style="padding: var(--space-10) var(--space-8)">
        <svg class="empty-state-glyph" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="2" x2="12" y2="22"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <line x1="4.22" y1="4.22" x2="19.78" y2="19.78"/>
        </svg>
        <span class="empty-state-text">No entries this month.<br>Tap a day to log service.</span>
      </div>
    `;
  }

  const underway = entries.filter(e => e.status === 'underway').length;
  const anchor   = entries.filter(e => e.status === 'anchor').length;

  const waterCounts = {};
  for (const e of entries) {
    if (e.status === 'underway') {
      waterCounts[e.waters] = (waterCounts[e.waters] || 0) + 1;
    }
  }

  return `
    <div class="profile-section">
      <div class="section-title" style="margin-bottom: var(--space-3)">This month</div>
      <div class="mini-stats" style="border-top:none;padding:0">
        <div class="stat-cell">
          <span class="stat-value">${underway}</span>
          <span class="stat-label">Underway</span>
        </div>
        <div class="stat-cell">
          <span class="stat-value">${anchor}</span>
          <span class="stat-label">At anchor</span>
        </div>
        ${Object.entries(waterCounts).map(([w, n]) => `
          <div class="stat-cell">
            <span class="stat-value">${n}</span>
            <span class="stat-label">${w.replace('_',' ')}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function countUnderwayDays(entries) {
  return entries.filter(e => e.status === 'underway').length;
}
