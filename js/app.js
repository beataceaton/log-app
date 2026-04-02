// ============================================================
// SEA SERVICE LOGGER — App Entry Point
// ============================================================

import { initDashboard, renderDashboard } from './ui/dashboard.js';
import { initCalendar,  renderCalendar  } from './ui/calendar.js';
import { initProfile,   renderProfile   } from './ui/profile.js';

const TABS = ['calendar', 'dashboard', 'profile'];

function init() {
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  // Tab routing
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });

  // Init all screens
  initDashboard();
  initCalendar();
  initProfile();

  // Default: dashboard
  switchTab('dashboard');
}

function switchTab(tab) {
  // Update buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
    btn.setAttribute('aria-selected', btn.dataset.tab === tab);
  });

  // Update screens
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.toggle('active', screen.id === `screen-${tab}`);
  });

  // Re-render the activated screen for fresh data
  if (tab === 'dashboard') renderDashboard();
  if (tab === 'calendar')  renderCalendar();
  if (tab === 'profile')   renderProfile();
}

document.addEventListener('DOMContentLoaded', init);
