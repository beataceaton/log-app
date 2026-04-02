// ============================================================
// SEA SERVICE LOGGER — Profile / Export Screen
// ============================================================

import {
  getUser, saveUser, getVessels, saveVessel, deleteVessel,
  getLogEntries, getActiveVessel, setActiveVessel, getSettings,
  newId,
} from '../store.js';
import { computeCompliance } from '../compliance.js';
import { showUpgradeSheet } from '../tier.js';

export function initProfile() {
  renderProfile();
}

export function renderProfile() {
  const user    = getUser();
  const vessels = getVessels();
  const entries = getLogEntries();
  const compliance = vessels.length > 0
    ? computeCompliance(entries, vessels, user.regulatoryFramework || 'USCG')
    : null;

  const screen = document.getElementById('screen-profile');

  screen.innerHTML = `
    <!-- Profile card -->
    <div class="profile-section">
      <div class="section-title" style="margin-bottom: var(--space-4)">Mariner profile</div>
      <div class="profile-card">
        <div class="profile-name">${user.name || 'Tap to set your name'}</div>
        <div class="profile-meta">
          <div class="profile-meta-row">
            <span class="profile-meta-key">MMC / CoC</span>
            <span class="profile-meta-val">${user.mmcNumber || '—'}</span>
          </div>
          <div class="profile-meta-row">
            <span class="profile-meta-key">Framework</span>
            <span class="profile-meta-val">${user.regulatoryFramework || 'USCG'}</span>
          </div>
        </div>
        <button class="btn" id="edit-profile-btn" style="align-self:flex-start">Edit profile</button>
      </div>
    </div>

    <!-- Career stats -->
    ${compliance ? `
    <div class="profile-section">
      <div class="section-title" style="margin-bottom: var(--space-4)">Career stats</div>
      <div class="career-stats-grid">
        <div class="stat-cell">
          <span class="stat-value">${compliance.totalDays}</span>
          <span class="stat-label">Total days</span>
        </div>
        <div class="stat-cell">
          <span class="stat-value">${compliance.nmcMonths}</span>
          <span class="stat-label">Months (NMC)</span>
        </div>
        <div class="stat-cell">
          <span class="stat-value">${compliance.daysPast3Years}</span>
          <span class="stat-label">Past 3 yrs</span>
        </div>
        <div class="stat-cell">
          <span class="stat-value">${compliance.daysPast5Years}</span>
          <span class="stat-label">Past 5 yrs</span>
        </div>
        <div class="stat-cell">
          <span class="stat-value">${compliance.daysByWaters.near_coastal}</span>
          <span class="stat-label">Near coastal</span>
        </div>
        <div class="stat-cell">
          <span class="stat-value">${compliance.daysByWaters.offshore}</span>
          <span class="stat-label">Offshore</span>
        </div>
      </div>
    </div>
    ` : ''}

    <!-- Vessels -->
    <div class="profile-section">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4)">
        <span class="section-title">Vessels</span>
        <button class="btn" id="add-vessel-btn" style="padding: var(--space-1) var(--space-3)">+ Add</button>
      </div>
      ${vessels.length === 0
        ? `<span style="font-size:var(--text-sm);color:var(--color-text-tertiary)">No vessels yet.</span>`
        : vessels.map(v => `
            <div class="vessel-item" data-vessel-id="${v.id}" style="padding: var(--space-3) 0;border-bottom:var(--border-thin) solid var(--color-border-subtle)">
              <div class="vessel-item-info">
                <span class="vessel-item-name">${v.name}</span>
                <span class="vessel-item-meta">${[v.type, v.grt ? v.grt + ' GRT' : null, v.propulsion].filter(Boolean).join(' · ')}</span>
              </div>
              <button class="btn" data-edit-vessel="${v.id}" style="padding: var(--space-1) var(--space-2);font-size:var(--text-xs)">Edit</button>
            </div>
          `).join('')
      }
    </div>

    <!-- Document export -->
    <div class="profile-section">
      <div class="section-title" style="margin-bottom: var(--space-2)">Export documents</div>
      <p style="font-size:var(--text-xs);color:var(--color-text-secondary);margin-bottom:var(--space-4);line-height:var(--leading-loose)">
        Generates a pre-filled PDF ready for captain signature. Requires an internet connection to generate.
      </p>
      <div class="export-actions">
        <button class="btn btn-upgrade" id="export-cg719s-btn"${vessels.length === 0 ? ' disabled' : ''}>
          Export CG-719S (USCG)
        </button>
        <button class="btn btn-upgrade" id="export-mca-btn"${vessels.length === 0 ? ' disabled' : ''}>
          MCA Sea Service Testimonial
        </button>
        <button class="btn btn-locked">Tankerman PIC letter</button>
        <button class="btn btn-locked">Qualified instructor letter</button>
      </div>
      ${vessels.length === 0 ? `
        <p style="font-size:var(--text-xs);color:var(--color-text-tertiary);margin-top:var(--space-3)">
          Add a vessel and log some days to enable exports.
        </p>
      ` : ''}
    </div>

    <!-- Legal -->
    <div class="profile-section" style="padding-bottom: var(--space-2)">
      <div class="section-title" style="margin-bottom: var(--space-3)">Legal</div>
      <div style="display:flex;flex-direction:column;gap:var(--space-1)">
        <a href="/privacy.html" class="legal-link">Privacy Policy</a>
        <a href="/terms.html"   class="legal-link">Terms of Service</a>
      </div>
      <p style="font-size:var(--text-xs);color:var(--color-text-tertiary);margin-top:var(--space-3);line-height:var(--leading-loose)">
        Sea Service Logger v1.0 · Documents generated by this app require captain signature for submission.
      </p>
    </div>
  `;

  // --- Events ---

  document.getElementById('edit-profile-btn')?.addEventListener('click', openEditProfileSheet);
  document.getElementById('add-vessel-btn')?.addEventListener('click', () => openAddVesselSheet({ onSave: renderProfile }));

  screen.querySelectorAll('[data-edit-vessel]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.editVessel;
      const vessel = getVessels().find(v => v.id === id);
      if (vessel) openAddVesselSheet({ vessel, onSave: renderProfile });
    });
  });

  // --- Export buttons ---

  document.getElementById('export-cg719s-btn')?.addEventListener('click', () => {
    showUpgradeSheet('export');
  });

  document.getElementById('export-mca-btn')?.addEventListener('click', () => {
    showUpgradeSheet('export');
  });
}

// ── Export flow ────────────────────────────────────────────────

async function handleExport(type) {
  const vessels = getVessels();
  if (vessels.length === 0) return;

  if (vessels.length === 1) {
    await runExport(type, vessels[0].id);
  } else {
    openExportVesselPicker(type);
  }
}

async function runExport(type, vesselId) {
  const btnId = type === 'cg719s' ? 'export-cg719s-btn' : 'export-mca-btn';
  const btn   = document.getElementById(btnId);
  const originalText = btn?.textContent;

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Generating PDF…';
  }

  try {
    const { exportCG719S, exportMCATestimonial } = await import('../export.js');
    if (type === 'cg719s') {
      await exportCG719S(vesselId);
    } else {
      await exportMCATestimonial(vesselId);
    }
  } catch (err) {
    console.error('Export error:', err);
    const msg = err.message?.includes('internet')
      ? err.message
      : `Export failed: ${err.message || 'Unknown error'}`;
    showExportError(msg);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }
}

function openExportVesselPicker(type) {
  const vessels = getVessels();
  const overlay = document.getElementById('sheet-overlay');
  const sheet   = document.getElementById('sheet');
  const label   = type === 'cg719s' ? 'CG-719S (USCG)' : 'MCA Sea Service Testimonial';

  sheet.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="sheet-title">Export ${label}</div>
    <p style="font-size:var(--text-sm);color:var(--color-text-secondary);margin-bottom:var(--space-4)">
      Select vessel to export for:
    </p>
    ${vessels.map(v => `
      <div class="vessel-item export-vessel-pick" data-vessel-id="${v.id}" style="cursor:pointer;padding: var(--space-3) 0;border-bottom:var(--border-thin) solid var(--color-border-subtle)">
        <div class="vessel-item-info">
          <span class="vessel-item-name">${v.name}</span>
          <span class="vessel-item-meta">${[v.type, v.grt ? v.grt + ' GRT' : null].filter(Boolean).join(' · ')}</span>
        </div>
        <svg viewBox="0 0 10 10" width="12" height="12" aria-hidden="true" style="stroke:var(--color-accent);fill:none;stroke-width:1.5;flex-shrink:0">
          <polyline points="2,2 7,5 2,8"/>
        </svg>
      </div>
    `).join('')}
  `;

  overlay.classList.add('open');
  sheet.classList.add('open');

  sheet.querySelectorAll('.export-vessel-pick').forEach(item => {
    item.addEventListener('click', async () => {
      closeSheet();
      await runExport(type, item.dataset.vesselId);
    });
  });

  overlay.onclick = closeSheet;
}

function showExportError(message) {
  const overlay = document.getElementById('sheet-overlay');
  const sheet   = document.getElementById('sheet');

  sheet.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="sheet-title">Export failed</div>
    <p style="font-size:var(--text-sm);color:var(--color-text-secondary);margin: var(--space-4) 0;line-height:var(--leading-loose)">
      ${message}
    </p>
    <button class="btn btn-primary" id="err-close-btn" style="width:100%">OK</button>
  `;

  overlay.classList.add('open');
  sheet.classList.add('open');
  document.getElementById('err-close-btn')?.addEventListener('click', closeSheet);
  overlay.onclick = closeSheet;
}

// ── Edit profile sheet ──────────────────────────────────────────

function openEditProfileSheet() {
  const user = getUser();
  const overlay = document.getElementById('sheet-overlay');
  const sheet   = document.getElementById('sheet');

  sheet.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="sheet-title">Edit profile</div>

    <div class="form-group">
      <label class="form-label" for="input-name">Full name</label>
      <input class="form-input" id="input-name" type="text" value="${user.name || ''}" placeholder="Your name" autocomplete="name"/>
    </div>

    <div class="form-group">
      <label class="form-label" for="input-mmc">MMC / CoC number</label>
      <input class="form-input" id="input-mmc" type="text" value="${user.mmcNumber || ''}" placeholder="e.g. 1234567"/>
    </div>

    <div class="form-group">
      <span class="form-label">Regulatory framework</span>
      <div class="seg-control" id="seg-framework">
        <button class="seg-btn ${user.regulatoryFramework === 'USCG' ? 'active' : ''}" data-val="USCG">USCG/NMC</button>
        <button class="seg-btn ${user.regulatoryFramework === 'MCA'  ? 'active' : ''}" data-val="MCA">MCA (UK)</button>
        <button class="seg-btn ${user.regulatoryFramework === 'both' ? 'active' : ''}" data-val="both">Both</button>
      </div>
    </div>

    <button class="btn-log" id="save-profile-btn">Save profile</button>
  `;

  let framework = user.regulatoryFramework || 'USCG';
  bindSeg('seg-framework', val => { framework = val; });

  document.getElementById('save-profile-btn').addEventListener('click', () => {
    saveUser({
      ...user,
      name: document.getElementById('input-name').value.trim(),
      mmcNumber: document.getElementById('input-mmc').value.trim(),
      regulatoryFramework: framework,
    });
    closeSheet();
    renderProfile();
  });

  overlay.classList.add('open');
  sheet.classList.add('open');
  overlay.onclick = closeSheet;
}

// ── Add/edit vessel sheet ───────────────────────────────────────

export function openAddVesselSheet({ vessel, onSave }) {
  const overlay = document.getElementById('sheet-overlay');
  const sheet   = document.getElementById('sheet');
  const isEdit  = !!vessel;
  const v = vessel || {
    id: newId(), name: '', officialNumber: '', type: 'Motor Yacht',
    propulsion: 'Motor', grt: '', hp: '', coiTwoWatch: false,
    captainName: '', captainEmail: '', flag: '',
  };

  sheet.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="sheet-title">${isEdit ? 'Edit vessel' : 'Add vessel'}</div>

    <div class="form-group">
      <label class="form-label" for="v-name">Vessel name *</label>
      <input class="form-input" id="v-name" type="text" value="${v.name}" placeholder="e.g. S/Y Perseverance" autocomplete="off"/>
    </div>

    <div class="form-group">
      <label class="form-label" for="v-offnum">Official number / state reg *</label>
      <input class="form-input" id="v-offnum" type="text" value="${v.officialNumber || ''}" placeholder="e.g. 1234567 or NC1234AB"/>
    </div>

    <div class="form-group">
      <label class="form-label" for="v-flag">Flag state</label>
      <input class="form-input" id="v-flag" type="text" value="${v.flag || ''}" placeholder="e.g. Cayman Islands, UK, USA"/>
    </div>

    <div class="form-group">
      <span class="form-label">Vessel type</span>
      <div class="seg-control" id="seg-vtype" style="flex-wrap:wrap">
        ${['Motor Yacht','Sailing Yacht','Motor Vessel','Tug','Supply Boat','Tanker'].map(t =>
          `<button class="seg-btn ${v.type === t ? 'active' : ''}" data-val="${t}">${t}</button>`
        ).join('')}
      </div>
    </div>

    <div class="form-group">
      <span class="form-label">Propulsion</span>
      <div class="seg-control" id="seg-prop">
        ${['Motor','Sail','Aux Sail','Steam'].map(p =>
          `<button class="seg-btn ${v.propulsion === p ? 'active' : ''}" data-val="${p}">${p}</button>`
        ).join('')}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
      <div class="form-group">
        <label class="form-label" for="v-grt">GRT</label>
        <input class="form-input" id="v-grt" type="number" value="${v.grt || ''}" placeholder="e.g. 48"/>
      </div>
      <div class="form-group">
        <label class="form-label" for="v-hp">Engine HP</label>
        <input class="form-input" id="v-hp" type="number" value="${v.hp || ''}" placeholder="e.g. 420"/>
      </div>
    </div>

    <div class="form-group">
      <label style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer">
        <input type="checkbox" id="v-twwatch" ${v.coiTwoWatch ? 'checked' : ''}/>
        <span class="form-label" style="margin:0">COI authorises two-watch system (12h day eligible)</span>
      </label>
    </div>

    <div class="form-group">
      <label class="form-label" for="v-captain-name">Captain / Master name</label>
      <input class="form-input" id="v-captain-name" type="text" value="${v.captainName || ''}" placeholder="For pre-filling export documents"/>
    </div>

    <div class="form-group">
      <label class="form-label" for="v-captain-email">Captain email (for document sending)</label>
      <input class="form-input" id="v-captain-email" type="email" value="${v.captainEmail || ''}" placeholder="captain@vessel.com"/>
    </div>

    <button class="btn-log" id="save-vessel-btn">${isEdit ? 'Save vessel' : 'Add vessel'}</button>

    ${isEdit ? `
      <button class="btn" id="delete-vessel-btn" style="margin-top:var(--space-2);color:var(--color-error);border-color:var(--color-error)">
        Delete vessel
      </button>
    ` : ''}
  `;

  let vtype = v.type;
  let prop  = v.propulsion;
  bindSeg('seg-vtype', val => { vtype = val; });
  bindSeg('seg-prop',  val => { prop  = val; });

  document.getElementById('save-vessel-btn').addEventListener('click', () => {
    const name = document.getElementById('v-name').value.trim();
    if (!name) { alert('Vessel name is required.'); return; }
    const offnum = document.getElementById('v-offnum').value.trim();
    if (!offnum) { alert('Official number or state registration is required.'); return; }

    saveVessel({
      ...v,
      name,
      officialNumber: offnum,
      flag:         document.getElementById('v-flag').value.trim(),
      type:         vtype,
      propulsion:   prop,
      grt:          parseFloat(document.getElementById('v-grt').value) || null,
      hp:           parseFloat(document.getElementById('v-hp').value)  || null,
      coiTwoWatch:  document.getElementById('v-twwatch').checked,
      captainName:  document.getElementById('v-captain-name').value.trim(),
      captainEmail: document.getElementById('v-captain-email').value.trim(),
    });

    // Auto-set as active if it's the first vessel
    if (getVessels().length === 1) setActiveVessel(v.id);

    closeSheet();
    if (onSave) onSave();
  });

  document.getElementById('delete-vessel-btn')?.addEventListener('click', () => {
    if (confirm(`Delete "${v.name}"? This won't delete your log entries.`)) {
      deleteVessel(v.id);
      closeSheet();
      if (onSave) onSave();
    }
  });

  overlay.classList.add('open');
  sheet.classList.add('open');
  overlay.onclick = closeSheet;
}

// ── Helpers ─────────────────────────────────────────────────────

function bindSeg(containerId, onChange) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onChange(btn.dataset.val);
    });
  });
}

function closeSheet() {
  document.getElementById('sheet-overlay').classList.remove('open');
  document.getElementById('sheet').classList.remove('open');
  document.getElementById('sheet').innerHTML = '';
}
