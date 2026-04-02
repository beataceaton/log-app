// ============================================================
// SEA SERVICE LOGGER — Store (localStorage persistence)
// ============================================================

const KEYS = {
  VESSELS:     'ssl_vessels',
  LOG_ENTRIES: 'ssl_log_entries',
  ACTIVE_VESSEL: 'ssl_active_vessel',
  USER:        'ssl_user',
  SETTINGS:    'ssl_settings',
};

// --- Helpers ---

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    console.error('Store write failed:', key);
    return false;
  }
}

// --- Vessels ---

export function getVessels() {
  return read(KEYS.VESSELS) || [];
}

export function saveVessel(vessel) {
  const vessels = getVessels();
  const idx = vessels.findIndex(v => v.id === vessel.id);
  if (idx >= 0) {
    vessels[idx] = vessel;
  } else {
    vessels.push(vessel);
  }
  write(KEYS.VESSELS, vessels);
  return vessel;
}

export function deleteVessel(id) {
  const vessels = getVessels().filter(v => v.id !== id);
  write(KEYS.VESSELS, vessels);
}

export function getActiveVessel() {
  const id = read(KEYS.ACTIVE_VESSEL);
  if (!id) return null;
  return getVessels().find(v => v.id === id) || null;
}

export function setActiveVessel(id) {
  write(KEYS.ACTIVE_VESSEL, id);
}

// --- Log Entries ---

export function getLogEntries() {
  return read(KEYS.LOG_ENTRIES) || [];
}

export function getLogEntry(date) {
  return getLogEntries().find(e => e.date === date) || null;
}

export function saveLogEntry(entry) {
  const entries = getLogEntries();
  const idx = entries.findIndex(e => e.date === entry.date && e.vesselId === entry.vesselId);
  if (idx >= 0) {
    entries[idx] = entry;
  } else {
    entries.push(entry);
  }
  write(KEYS.LOG_ENTRIES, entries);
  return entry;
}

export function deleteLogEntry(date, vesselId) {
  const entries = getLogEntries().filter(
    e => !(e.date === date && e.vesselId === vesselId)
  );
  write(KEYS.LOG_ENTRIES, entries);
}

export function getEntriesForMonth(year, month) {
  // month is 0-indexed (JS Date convention)
  return getLogEntries().filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export function getEntriesForVessel(vesselId) {
  return getLogEntries().filter(e => e.vesselId === vesselId);
}

// --- User ---

export function getUser() {
  return read(KEYS.USER) || {
    name: '',
    mmcNumber: '',
    stcwEndorsements: [],
    regulatoryFramework: 'USCG', // 'MCA' | 'USCG' | 'both'
  };
}

export function saveUser(user) {
  write(KEYS.USER, user);
  return user;
}

// --- Settings ---

export function getSettings() {
  return read(KEYS.SETTINGS) || {
    watchkeepingEnabled: false,
    units: 'NM',
    darkMode: 'system', // 'system' | 'dark' | 'light'
    notifications: false,
  };
}

export function saveSettings(settings) {
  write(KEYS.SETTINGS, settings);
  return settings;
}

// --- ID generator ---

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// --- Date helpers ---

export function todayISO() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export function formatDateISO(date) {
  return date.toISOString().slice(0, 10);
}
