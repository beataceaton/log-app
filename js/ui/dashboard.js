// ============================================================
// SEA SERVICE LOGGER — Dashboard Screen
// ============================================================

import {
  getActiveVessel, getVessels, setActiveVessel,
  getLogEntry, saveLogEntry, newId, todayISO,
  getLogEntries,
} from '../store.js';
import { computeCompliance } from '../compliance.js';
import { openLogSheet } from '../logSheet.js';
import { isLogLimitReached, daysRemaining, showUpgradeSheet, FREE_TIER_LOG_LIMIT } from '../tier.js';

export function initDashboard() {
  renderDashboard();
}

export function renderDashboard() {
  const vessel   = getActiveVessel();
  const today    = todayISO();
  const todayEntry = vessel ? getLogEntry(today) : null;
  const allEntries = getLogEntries();
  const allVessels = getVessels();

  const compliance    = allVessels.length > 0
    ? computeCompliance(allEntries, allVessels, 'USCG')
    : null;

  const limitReached  = isLogLimitReached();
  const remaining     = daysRemaining();
  // Block new logging if limit reached AND today not yet logged
  const blockNewLog   = limitReached && !todayEntry;

  // Contract days (current vessel only)
  const contractDays = vessel
    ? computeCompliance(
        allEntries.filter(e => e.vesselId === vessel.id),
        allVessels,
        'USCG'
      ).totalDays
    : 0;

  const screen = document.getElementById('screen-dashboard');

  screen.innerHTML = `
    <div class="dashboard-top">

      <!-- Vessel chip -->
      <button class="vessel-chip" id="vessel-chip-btn" aria-label="Switch vessel">
        <span class="dot ${vessel ? 'active' : ''}"></span>
        <span id="vessel-chip-name">${vessel ? vessel.name : 'No vessel — tap to add'}</span>
        <svg class="chevron" viewBox="0 0 10 10" aria-hidden="true">
          <polyline points="2,3 5,7 8,3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <!-- Day counter -->
      <div class="day-counter">
        <div class="day-counter-value">${contractDays}</div>
        <div class="day-counter-label">Days this contract</div>
        ${compliance ? `<div class="day-counter-sub">${compliance.nmcMonths} mo · ${compliance.totalDays} career days total</div>` : ''}
      </div>

      <!-- Log button -->
      <div class="log-btn-wrap">
        <button
          class="btn-log ${todayEntry ? 'logged-today' : blockNewLog ? 'upgrade-gated' : ''}"
          id="log-btn"
          ${!vessel ? 'disabled' : ''}
        >
          ${todayEntry
            ? `<span>✓ Logged today</span>`
            : blockNewLog
              ? `<span>Upgrade to continue</span>`
              : `<span>Log today</span>`
          }
        </button>
        <span class="log-btn-status">
          ${!vessel
            ? 'Add a vessel to begin logging'
            : todayEntry
              ? `${todayEntry.status === 'underway' ? 'Underway' : 'At anchor'} · ${todayEntry.waters.replace('_', ' ')} · ${todayEntry.hours}h`
              : blockNewLog
                ? `${FREE_TIER_LOG_LIMIT}-day free limit reached`
                : formatDate(today)
          }
        </span>
      </div>

      <!-- Free tier progress banner (shown when ≤ 15 days remaining) -->
      ${vessel && !todayEntry && !limitReached && remaining <= 15 ? `
      <div class="free-tier-banner">
        <span>${remaining} free day${remaining === 1 ? '' : 's'} remaining</span>
        <button class="free-tier-upgrade-link" id="tier-banner-btn">Upgrade</button>
      </div>
      ` : ''}

      <!-- Mini stats -->
      ${compliance ? `
      <div class="mini-stats">
        <div class="stat-cell">
          <span class="stat-value">${compliance.totalDays}</span>
          <span class="stat-label">Career days</span>
        </div>
        <div class="stat-cell">
          <span class="stat-value">${compliance.nmcMonths}</span>
          <span class="stat-label">Months (NMC)</span>
        </div>
        <div class="stat-cell">
          <span class="stat-value">${compliance.daysByWaters.near_coastal + compliance.daysByWaters.offshore}</span>
          <span class="stat-label">Near coastal+</span>
        </div>
        <div class="stat-cell">
          <span class="stat-value">${compliance.daysPast3Years}</span>
          <span class="stat-label">Past 3 years</span>
        </div>
      </div>
      ` : `
      <div class="empty-state" style="padding: var(--space-8) 0">
        <svg class="empty-state-glyph" viewBox="0 0 24 24" aria-hidden="true">
          <polygon points="12,2 22,12 12,22 2,12"/>
          <line x1="12" y1="2" x2="12" y2="22"/>
        </svg>
        <span class="empty-state-text">Add a vessel and start<br>logging to see your stats</span>
      </div>
      `}
    </div>
  `;

  // Events
  document.getElementById('log-btn')?.addEventListener('click', () => {
    if (!vessel) return;
    if (blockNewLog) {
      showUpgradeSheet('log');
      return;
    }
    openLogSheet({ date: today, vessel, existing: todayEntry, onSave: renderDashboard });
  });

  document.getElementById('tier-banner-btn')?.addEventListener('click', () => {
    showUpgradeSheet('log');
  });

  document.getElementById('vessel-chip-btn')?.addEventListener('click', () => {
    openVesselPicker();
  });
}

// --- Vessel picker sheet ---

function openVesselPicker() {
  const vessels = getVessels();
  const active  = getActiveVessel();

  const overlay = document.getElementById('sheet-overlay');
  const sheet   = document.getElementById('sheet');

  sheet.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="sheet-title">Select vessel</div>

    ${vessels.length === 0
      ? `<div class="empty-state" style="padding: var(--space-8) 0">
           <span class="empty-state-text">No vessels yet</span>
         </div>`
      : vessels.map(v => `
          <div class="vessel-item ${v.id === active?.id ? 'active' : ''}" data-id="${v.id}">
            <div class="vessel-item-info">
              <span class="vessel-item-name">${v.name}</span>
              <span class="vessel-item-meta">${v.type || '—'} · ${v.grt ? v.grt + ' GRT' : 'GRT unknown'}</span>
            </div>
            ${v.id === active?.id ? '<span class="text-accent">◆</span>' : ''}
          </div>
        `).join('')
    }

    <div style="margin-top: var(--space-4)">
      <button class="btn btn-primary" id="add-vessel-btn" style="width:100%">+ Add vessel</button>
    </div>
  `;

  overlay.classList.add('open');
  sheet.classList.add('open');

  // Select vessel
  sheet.querySelectorAll('.vessel-item').forEach(item => {
    item.addEventListener('click', () => {
      setActiveVessel(item.dataset.id);
      closeSheet();
      renderDashboard();
    });
  });

  document.getElementById('add-vessel-btn')?.addEventListener('click', () => {
    closeSheet();
    // Switch to profile tab and open vessel form
    import('./profile.js').then(m => m.openAddVesselSheet({ onSave: renderDashboard }));
    document.querySelector('[data-tab="profile"]')?.click();
  });

  overlay.onclick = closeSheet;
}

function closeSheet() {
  document.getElementById('sheet-overlay').classList.remove('open');
  document.getElementById('sheet').classList.remove('open');
}

// --- Helpers ---

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
