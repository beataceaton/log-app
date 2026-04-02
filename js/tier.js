// ============================================================
// SEA SERVICE LOGGER — Tier & Paywall
// Free tier: 90 logged days, no document export.
// Pro/Navigator: unlimited logging + all export types.
// ============================================================

import { getLogEntries } from './store.js';

export const FREE_TIER_LOG_LIMIT = 90;

// Count unique logged days (non-off-hire). Deduplicates same date on two vessels.
export function getLoggedDayCount() {
  const entries = getLogEntries().filter(e => e.status !== 'off_hire');
  return new Set(entries.map(e => e.date)).size;
}

export function isLogLimitReached() {
  return getLoggedDayCount() >= FREE_TIER_LOG_LIMIT;
}

export function daysRemaining() {
  return Math.max(0, FREE_TIER_LOG_LIMIT - getLoggedDayCount());
}

// ── Upgrade sheet ─────────────────────────────────────────────

// reason: 'log' | 'export'
export function showUpgradeSheet(reason = 'export') {
  const overlay = document.getElementById('sheet-overlay');
  const sheet   = document.getElementById('sheet');

  const isExport = reason === 'export';
  const title    = isExport ? 'Pro feature' : 'Free tier limit reached';
  const lead     = isExport
    ? 'Document export is a Pro feature. Generate a pre-filled PDF ready for your captain\'s signature and send it in one tap.'
    : `You've reached the ${FREE_TIER_LOG_LIMIT}-day free tier limit. Upgrade to keep logging and unlock document export.`;

  sheet.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="sheet-title">${title}</div>
    <p class="upgrade-lead">${lead}</p>

    <div class="tier-card">
      <div class="tier-card-header">
        <span class="tier-card-name">Pro</span>
        <span class="tier-card-price">£5.99 <span class="tier-card-per">/ month</span></span>
      </div>
      <ul class="tier-card-features">
        <li>Unlimited logging</li>
        <li>CG-719S and MCA document export</li>
        <li>One-tap email to captain</li>
        <li>Cloud sync across devices</li>
      </ul>
    </div>

    <div class="tier-card" style="margin-top: var(--space-2)">
      <div class="tier-card-header">
        <span class="tier-card-name">Navigator</span>
        <span class="tier-card-price">£9.99 <span class="tier-card-per">/ month</span></span>
      </div>
      <ul class="tier-card-features">
        <li>Everything in Pro</li>
        <li>AIS log reconstruction from satellite data</li>
        <li>Endorsement milestone tracker</li>
      </ul>
    </div>

    <button class="btn-log" id="upgrade-notify-btn" style="margin-top: var(--space-5)">
      Notify me when payments launch
    </button>
    <button class="btn" id="upgrade-close-btn" style="width:100%;margin-top:var(--space-2)">
      Not now
    </button>
  `;

  overlay.classList.add('open');
  sheet.classList.add('open');

  document.getElementById('upgrade-notify-btn').addEventListener('click', () => {
    // Replace button with confirmation — no backend needed
    const btn = document.getElementById('upgrade-notify-btn');
    btn.textContent = '✓ We\'ll be in touch';
    btn.disabled = true;
    btn.style.opacity = '0.6';
  });

  document.getElementById('upgrade-close-btn').addEventListener('click', _closeSheet);
  overlay.onclick = _closeSheet;
}

function _closeSheet() {
  const overlay = document.getElementById('sheet-overlay');
  const sheet   = document.getElementById('sheet');
  overlay.classList.remove('open');
  sheet.classList.remove('open');
  sheet.innerHTML = '';
  overlay.onclick = null;
}
