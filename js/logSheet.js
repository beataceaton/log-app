// ============================================================
// SEA SERVICE LOGGER — Log Entry Bottom Sheet
// ============================================================

import { saveLogEntry, getActiveVessel, todayISO, newId } from './store.js';

/**
 * Open the log entry sheet.
 * @param {Object} opts
 * @param {string}   opts.date     - ISO date string (YYYY-MM-DD)
 * @param {Object}   opts.vessel   - Vessel record
 * @param {Object}   [opts.existing] - Existing log entry (for editing)
 * @param {Function} [opts.onSave]  - Callback after save
 */
export function openLogSheet({ date, vessel, existing, onSave }) {
  const overlay = document.getElementById('sheet-overlay');
  const sheet   = document.getElementById('sheet');

  const isEdit = !!existing;
  const entry  = existing || {
    date,
    vesselId: vessel.id,
    status:   'underway',
    waters:   getLastWaters() || 'near_coastal',
    hours:    8,
    location: '',
    notes:    '',
  };

  function render() {
    sheet.innerHTML = `
      <div class="sheet-handle"></div>
      <div class="sheet-title">${isEdit ? 'Edit entry' : 'Log today'} · ${formatDate(date)}</div>

      <!-- Status -->
      <div class="form-group">
        <span class="form-label">Status</span>
        <div class="seg-control" id="seg-status">
          <button class="seg-btn ${entry.status === 'underway' ? 'active' : ''}" data-val="underway">Underway</button>
          <button class="seg-btn ${entry.status === 'anchor'   ? 'active' : ''}" data-val="anchor">At anchor</button>
        </div>
      </div>

      <!-- Waters -->
      <div class="form-group">
        <span class="form-label">Waters</span>
        <div class="seg-control" id="seg-waters" style="flex-wrap:wrap">
          <button class="seg-btn ${entry.waters === 'inland'       ? 'active' : ''}" data-val="inland">Inland</button>
          <button class="seg-btn ${entry.waters === 'near_coastal' ? 'active' : ''}" data-val="near_coastal">Near coastal</button>
          <button class="seg-btn ${entry.waters === 'offshore'     ? 'active' : ''}" data-val="offshore">Offshore</button>
          <button class="seg-btn ${entry.waters === 'great_lakes'  ? 'active' : ''}" data-val="great_lakes">Great Lakes</button>
        </div>
      </div>

      <!-- Hours -->
      <div class="form-group">
        <span class="form-label">Hours</span>
        <div class="seg-control" id="seg-hours">
          <button class="seg-btn ${entry.hours === 8  ? 'active' : ''}" data-val="8">8 hours</button>
          <button
            class="seg-btn ${entry.hours === 12 ? 'active' : ''} ${!vessel.coiTwoWatch ? 'btn-locked' : ''}"
            data-val="12"
            ${!vessel.coiTwoWatch ? 'disabled title="Requires COI two-watch authorisation"' : ''}
          >12 hours</button>
        </div>
        ${!vessel.coiTwoWatch
          ? `<span style="font-size:var(--text-xxs);color:var(--color-text-tertiary);margin-top:2px">
               12h requires COI two-watch authorisation on vessel profile
             </span>`
          : ''
        }
      </div>

      <!-- Location (optional) -->
      <div class="form-group">
        <span class="form-label">Location <span style="color:var(--color-text-tertiary)">(optional)</span></span>
        <input
          class="form-input"
          id="input-location"
          type="text"
          placeholder="e.g. 39.50°N / 19.82°E or Corfu"
          value="${entry.location || ''}"
          autocomplete="off"
        />
      </div>

      <!-- Submit -->
      <button class="btn-log" id="sheet-submit-btn" style="margin-top: var(--space-2)">
        ${isEdit ? 'Save changes' : 'Log this day'}
      </button>

      ${isEdit ? `
        <button class="btn" id="sheet-delete-btn" style="margin-top:var(--space-2);color:var(--color-error);border-color:var(--color-error)">
          Delete entry
        </button>
      ` : ''}
    `;

    // --- Segmented control logic ---
    bindSeg('seg-status',  val => { entry.status = val; });
    bindSeg('seg-waters',  val => { entry.waters = val; });
    bindSeg('seg-hours',   val => { entry.hours  = parseInt(val); });

    // --- GPS autofill ---
    autoFillLocation(entry.location);

    // --- Submit ---
    document.getElementById('sheet-submit-btn').addEventListener('click', () => {
      entry.location = document.getElementById('input-location').value.trim();
      if (!entry.id) entry.id = newId();
      saveLogEntry(entry);
      saveLastWaters(entry.waters);
      closeSheet();
      if (onSave) onSave();
    });

    // --- Delete ---
    document.getElementById('sheet-delete-btn')?.addEventListener('click', () => {
      import('./store.js').then(({ deleteLogEntry }) => {
        deleteLogEntry(entry.date, entry.vesselId);
        closeSheet();
        if (onSave) onSave();
      });
    });
  }

  overlay.classList.add('open');
  sheet.classList.add('open');
  render();

  overlay.onclick = closeSheet;
}

// --- Segmented controls ---

function bindSeg(containerId, onChange) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.seg-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onChange(btn.dataset.val);
    });
  });
}

// --- GPS ---

function autoFillLocation(existing) {
  if (existing) return;
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(pos => {
    const input = document.getElementById('input-location');
    if (!input || input.value) return;
    const lat = pos.coords.latitude.toFixed(2);
    const lng = pos.coords.longitude.toFixed(2);
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    input.value = `${Math.abs(lat)}°${latDir} / ${Math.abs(lng)}°${lngDir}`;
    input.placeholder = input.value;
  }, () => {
    // GPS unavailable — silent fail
  });
}

// --- Last waters memory ---

function getLastWaters() {
  return localStorage.getItem('ssl_last_waters') || null;
}

function saveLastWaters(waters) {
  localStorage.setItem('ssl_last_waters', waters);
}

// --- Close ---

function closeSheet() {
  document.getElementById('sheet-overlay').classList.remove('open');
  document.getElementById('sheet').classList.remove('open');
  document.getElementById('sheet').innerHTML = '';
}

// --- Helpers ---

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}
