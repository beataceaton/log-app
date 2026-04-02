// ============================================================
// SEA SERVICE LOGGER — PDF Export
// Generates CG-719S (USCG) and MCA Sea Service Testimonial
// Uses jsPDF loaded from CDN (required at export time)
// ============================================================

import { getUser, getVessels, getLogEntries } from './store.js';
import { computeCompliance } from './compliance.js';

// ── CDN loader ────────────────────────────────────────────────

const JSPDF_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
let _jsPDFClass = null;

async function loadJsPDF() {
  if (_jsPDFClass) return _jsPDFClass;
  if (window.jspdf?.jsPDF) {
    _jsPDFClass = window.jspdf.jsPDF;
    return _jsPDFClass;
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = JSPDF_CDN;
    s.onload = () => {
      _jsPDFClass = window.jspdf?.jsPDF;
      if (_jsPDFClass) resolve(_jsPDFClass);
      else reject(new Error('jsPDF loaded but class not found'));
    };
    s.onerror = () => reject(new Error(
      'Could not load PDF library. An internet connection is required to generate PDFs.'
    ));
    document.head.appendChild(s);
  });
}

// ── Date helpers ──────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDateLong(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// Group entries by calendar month, applying USCG credit rules.
// Returns months sorted chronologically with credited day totals
// so the monthly table is consistent with the Box 1 total.
function groupByMonth(entries, vessels = []) {
  const vesselMap = Object.fromEntries(vessels.map(v => [v.id, v]));
  const map = {};
  for (const e of entries) {
    if (e.status === 'off_hire') continue;
    const d = new Date(e.date + 'T00:00:00');
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,'0')}`;
    if (!map[key]) {
      map[key] = { year: d.getFullYear(), month: d.getMonth(), days: 0 };
    }
    // Apply the same USCG credit logic used by computeCompliance:
    // vessels <100 GRT with <4h = no credit; COI two-watch 12h = 1.5 days
    const vessel   = vesselMap[e.vesselId];
    const hours    = e.hours || 8;
    const grt      = vessel?.grt || 9999;
    const twoWatch = vessel?.coiTwoWatch || false;
    let credit = 1;
    if (grt < 100 && hours < 4) credit = 0;
    else if (twoWatch && hours === 12) credit = 1.5;
    map[key].days += credit;
  }
  return Object.values(map).sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month
  );
}

// ── Shared drawing helpers ────────────────────────────────────

// Draw a box with a small label at top-left and value text inside
function drawLabeledBox(doc, label, value, x, y, w, h = 10) {
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.25);
  doc.rect(x, y, w, h);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text(label, x + 1.5, y + 3.2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  if (value) doc.text(String(value), x + 1.5, y + 8.2);
}

// Draw a dark header bar with white text
function drawSectionHeader(doc, label, x, y, w) {
  doc.setFillColor(40, 40, 40);
  doc.setDrawColor(40, 40, 40);
  doc.rect(x, y, w, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(label, x + 2.5, y + 4.5);
  doc.setTextColor(0, 0, 0);
}

// Draw a shaded key/value row for the MCA testimonial tables
function drawKeyValueRow(doc, key, value, x, y, totalW, keyW = 58, h = 7) {
  // Key cell — light grey background
  doc.setFillColor(238, 238, 238);
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.rect(x, y, keyW, h, 'FD');
  // Value cell
  doc.setFillColor(255, 255, 255);
  doc.rect(x + keyW, y, totalW - keyW, h, 'FD');
  // Key text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(40, 40, 40);
  doc.text(key, x + 2, y + h * 0.68);
  // Value text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  if (value) doc.text(String(value), x + keyW + 3, y + h * 0.68);
}


// ============================================================
// USCG FORM CG-719S
// Small Vessel Sea Service Form
// Letter size (215.9 × 279.4 mm)
// ============================================================

export async function exportCG719S(vesselId) {
  const jsPDF = await loadJsPDF();

  const user     = getUser();
  const vessels  = getVessels();
  const vessel   = vessels.find(v => v.id === vesselId);
  if (!vessel) throw new Error('Vessel not found');

  const allEntries = getLogEntries()
    .filter(e => e.vesselId === vesselId && e.status !== 'off_hire');

  if (allEntries.length === 0) {
    throw new Error('No log entries found for this vessel. Log some days first.');
  }

  const compliance   = computeCompliance(allEntries, vessels, 'USCG');
  const monthGroups  = groupByMonth(allEntries, vessels);
  const sortedDates  = [...allEntries].map(e => e.date).sort();
  const startDate    = sortedDates[0];
  const endDate      = sortedDates[sortedDates.length - 1];

  const { inland, near_coastal, offshore, great_lakes } = compliance.daysByWaters;
  const totalDays    = Math.round(compliance.totalDays);
  const nearCoastalTotal = Math.round(near_coastal + offshore); // Box 4

  const avgHours = allEntries.length > 0
    ? Math.round((compliance.totalHours / allEntries.length) * 10) / 10
    : 8;

  const watersDesc = [
    great_lakes    > 0 ? 'Great Lakes'   : null,
    inland         > 0 ? 'Inland'        : null,
    near_coastal   > 0 ? 'Near Coastal'  : null,
    offshore       > 0 ? 'Offshore'      : null,
  ].filter(Boolean).join(', ') || 'Near Coastal';

  // ── Document setup ─────────────────────────────────────────
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const PW   = 215.9;  // page width
  const ML   = 17;     // left margin
  const MR   = 17;     // right margin
  const IW   = PW - ML - MR;  // inner width = 181.9 mm
  let y      = 13;

  // ── HEADER ─────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  doc.text('DEPARTMENT OF HOMELAND SECURITY', ML, y);
  doc.text('U.S. COAST GUARD', ML, y + 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('SMALL VESSEL SEA SERVICE FORM', PW / 2, y + 2, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text('Form CG-719S (04/17)', PW - MR, y,     { align: 'right' });
  doc.text('OMB No. 1625-0040',   PW - MR, y + 4,  { align: 'right' });
  doc.text('Expires: 09/30/2026', PW - MR, y + 8,  { align: 'right' });

  doc.setTextColor(0, 0, 0);
  doc.setLineWidth(0.6);
  doc.line(ML, y + 11, PW - MR, y + 11);
  doc.setLineWidth(0.2);
  doc.line(ML, y + 12.5, PW - MR, y + 12.5);
  y += 17;

  // ── SECTION I — APPLICANT & VESSEL INFO ────────────────────
  drawSectionHeader(doc, 'SECTION I — APPLICANT AND VESSEL INFORMATION', ML, y, IW);
  y += 9;

  // Row 1: Name | MMC number
  const r1c1 = IW * 0.65;
  const r1c2 = IW - r1c1;
  drawLabeledBox(doc, '1. APPLICANT NAME (Last, First, Middle)', user.name || '', ML, y, r1c1);
  drawLabeledBox(doc, '2. MMC REFERENCE NUMBER (NOT SSN)', user.mmcNumber || '', ML + r1c1, y, r1c2);
  y += 11;

  // Row 2: Vessel name | Official # | GRT
  const r2c1 = IW * 0.43;
  const r2c2 = IW * 0.32;
  const r2c3 = IW - r2c1 - r2c2;
  drawLabeledBox(doc, '3. NAME OF VESSEL', vessel.name || '', ML, y, r2c1);
  drawLabeledBox(doc, '4. OFFICIAL NUMBER OR STATE REG. NUMBER', vessel.officialNumber || '', ML + r2c1, y, r2c2);
  drawLabeledBox(doc, '5. GROSS REGISTER TONS (GRT)', vessel.grt ? String(vessel.grt) : '', ML + r2c1 + r2c2, y, r2c3);
  y += 11;

  // Row 3: Propulsion | Waters description
  const r3c1 = IW * 0.28;
  const r3c2 = IW - r3c1;
  drawLabeledBox(doc, '6. PROPULSION (Motor / Sail / Aux Sail / Steam)', vessel.propulsion || '', ML, y, r3c1);
  drawLabeledBox(doc, '7. DESCRIPTION OF WATERS ON WHICH EXPERIENCE WAS OBTAINED', watersDesc, ML + r3c1, y, r3c2);
  y += 11;

  // Row 4: Capacity | Avg hours | Date from | Date to
  const r4c1 = IW * 0.34;
  const r4c2 = IW * 0.18;
  const r4c3 = IW * 0.24;
  const r4c4 = IW - r4c1 - r4c2 - r4c3;
  drawLabeledBox(doc, '8. CAPACITY IN WHICH EMPLOYED', '', ML, y, r4c1);
  drawLabeledBox(doc, '9. AVG HOURS/DAY UNDERWAY', String(avgHours), ML + r4c1, y, r4c2);
  drawLabeledBox(doc, '10. DATE FROM (DD/MM/YYYY)', fmtDate(startDate), ML + r4c1 + r4c2, y, r4c3);
  drawLabeledBox(doc, '11. DATE TO (DD/MM/YYYY)', fmtDate(endDate), ML + r4c1 + r4c2 + r4c3, y, r4c4);
  y += 14;

  // ── SECTION II — DAYS OF SEA SERVICE ───────────────────────
  drawSectionHeader(doc, 'SECTION II — DAYS OF SEA SERVICE', ML, y, IW);
  y += 9;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(50, 50, 50);
  const instrLines = doc.splitTextToSize(
    'Enter the number of days of service obtained in each month. Do not include days at anchor or mooring if not underway. ' +
    'All boxes (1–4) must contain a number, even if zero. BOX 1 must equal the sum of BOX 2 + BOX 3 + BOX 4.',
    IW
  );
  doc.text(instrLines, ML, y);
  y += instrLines.length * 3.5 + 4;
  doc.setTextColor(0, 0, 0);

  // Monthly table
  const tMonthW  = 72;
  const tYearW   = 26;
  const tDaysW   = IW - tMonthW - tYearW;
  const tRowH    = 7.5;

  // Table header
  doc.setFillColor(210, 210, 210);
  doc.setDrawColor(130, 130, 130);
  doc.setLineWidth(0.25);
  doc.rect(ML, y, IW, tRowH, 'FD');
  doc.line(ML + tMonthW, y, ML + tMonthW, y + tRowH);
  doc.line(ML + tMonthW + tYearW, y, ML + tMonthW + tYearW, y + tRowH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('MONTH', ML + tMonthW / 2, y + tRowH * 0.68, { align: 'center' });
  doc.text('YEAR', ML + tMonthW + tYearW / 2, y + tRowH * 0.68, { align: 'center' });
  doc.text('DAYS OF SERVICE', ML + tMonthW + tYearW + tDaysW / 2, y + tRowH * 0.68, { align: 'center' });
  y += tRowH;

  // Data rows — all logged months + 2 blank rows padding
  const rows = [...monthGroups, null, null];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  for (const row of rows) {
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.2);
    doc.rect(ML, y, IW, tRowH);
    doc.line(ML + tMonthW, y, ML + tMonthW, y + tRowH);
    doc.line(ML + tMonthW + tYearW, y, ML + tMonthW + tYearW, y + tRowH);
    if (row) {
      doc.text(`${MONTH_NAMES[row.month]}`, ML + 3, y + tRowH * 0.7);
      doc.text(String(row.year), ML + tMonthW + tYearW / 2, y + tRowH * 0.7, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      const daysDisplay = Number.isInteger(row.days) ? String(row.days) : row.days.toFixed(1);
      doc.text(daysDisplay, ML + tMonthW + tYearW + tDaysW / 2, y + tRowH * 0.7, { align: 'center' });
      doc.setFont('helvetica', 'normal');
    }
    y += tRowH;
  }
  y += 5;

  // Summary boxes — 2×2 grid
  const bW = (IW - 3) / 2;
  const bH = 15;

  function drawSummaryBox(num, label, value, bx, by) {
    doc.setDrawColor(60, 60, 60);
    doc.setLineWidth(0.5);
    doc.rect(bx, by, bW, bH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`BOX ${num}`, bx + 2.5, by + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(70, 70, 70);
    doc.text(label, bx + 2.5, by + 9.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(0, 0, 0);
    doc.text(String(value), bx + bW - 3, by + bH - 2.5, { align: 'right' });
  }

  drawSummaryBox(1, 'TOTAL DAYS  (must equal BOX 2 + BOX 3 + BOX 4)', totalDays, ML, y);
  drawSummaryBox(2, 'GREAT LAKES', Math.round(great_lakes), ML + bW + 3, y);
  y += bH + 2;
  drawSummaryBox(3, 'INLAND (shoreward of COLREGS demarcation lines)', Math.round(inland), ML, y);
  drawSummaryBox(4, 'NEAR COASTAL / OCEAN (seaward of boundary lines)', nearCoastalTotal, ML + bW + 3, y);
  y += bH + 7;

  // ── SECTION III — SIGNATURES ────────────────────────────────
  drawSectionHeader(doc, 'SECTION III — SIGNATURE AND VERIFICATION', ML, y, IW);
  y += 9;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(40, 40, 40);
  const cert1 = doc.splitTextToSize(
    'I certify that the above information is true and correct. I understand that a false statement made on ' +
    'this form is punishable by fine and/or imprisonment under 18 U.S.C. §1001.',
    IW
  );
  doc.text(cert1, ML, y);
  doc.setTextColor(0, 0, 0);
  y += cert1.length * 3.5 + 5;

  // Applicant sig line
  const sigHalf = (IW - 8) / 2;
  doc.setLineWidth(0.4);
  doc.line(ML, y + 9, ML + sigHalf, y + 9);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text('Applicant Signature', ML, y + 12);
  doc.line(ML + sigHalf + 8, y + 9, ML + IW, y + 9);
  doc.text('Date', ML + sigHalf + 8, y + 12);
  doc.setTextColor(0, 0, 0);
  y += 18;

  // Master attestation
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('OWNER / OPERATOR / MASTER ATTESTATION', ML, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(40, 40, 40);
  const cert2 = doc.splitTextToSize(
    'I certify that the above individual served on the above named vessel in the capacity stated, for the period indicated, ' +
    'and that the information provided is correct to the best of my knowledge.',
    IW
  );
  doc.text(cert2, ML, y);
  doc.setTextColor(0, 0, 0);
  y += cert2.length * 3.5 + 5;

  // Master name line (pre-filled if stored)
  doc.setLineWidth(0.4);
  if (vessel.captainName) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(vessel.captainName, ML, y + 6);
  }
  doc.line(ML, y + 9, ML + sigHalf, y + 9);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text('Printed Name of Owner / Operator / Master', ML, y + 12);
  doc.line(ML + sigHalf + 8, y + 9, ML + IW, y + 9);
  doc.text('Signature', ML + sigHalf + 8, y + 12);
  doc.setTextColor(0, 0, 0);
  y += 18;

  doc.setLineWidth(0.4);
  doc.line(ML, y + 9, ML + sigHalf, y + 9);
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text('Date', ML, y + 12);
  if (vessel.captainEmail) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text(vessel.captainEmail, ML + sigHalf + 8, y + 6);
  }
  doc.line(ML + sigHalf + 8, y + 9, ML + IW, y + 9);
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text('Phone / Email', ML + sigHalf + 8, y + 12);
  doc.setTextColor(0, 0, 0);
  y += 18;

  // ── FOOTER ─────────────────────────────────────────────────
  doc.setLineWidth(0.3);
  doc.line(ML, y, PW - MR, y);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(120, 120, 120);
  doc.text(
    'Generated by Sea Service Logger · Data source: manually logged entries · ' +
    'Captain/Master signature required for NMC submission · Form CG-719S valid for vessels under 200 GRT',
    ML, y + 3.5
  );

  // ── SAVE ────────────────────────────────────────────────────
  const safeName = vessel.name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`CG-719S_${safeName}_${startDate}.pdf`);
}


// ============================================================
// MCA SEA SERVICE TESTIMONIAL
// Pursuant to MSN 1856 (M+F)
// A4 size (210 × 297 mm)
// ============================================================

export async function exportMCATestimonial(vesselId) {
  const jsPDF = await loadJsPDF();

  const user    = getUser();
  const vessels = getVessels();
  const vessel  = vessels.find(v => v.id === vesselId);
  if (!vessel) throw new Error('Vessel not found');

  const allEntries = getLogEntries()
    .filter(e => e.vesselId === vesselId && e.status !== 'off_hire');

  if (allEntries.length === 0) {
    throw new Error('No log entries found for this vessel. Log some days first.');
  }

  const compliance  = computeCompliance(allEntries, vessels, 'MCA');
  const sortedDates = [...allEntries].map(e => e.date).sort();
  const startDate   = sortedDates[0];
  const endDate     = sortedDates[sortedDates.length - 1];

  const underwayEntries = allEntries.filter(e => e.status === 'underway');
  const anchorEntries   = allEntries.filter(e => e.status === 'anchor');
  const totalOnBoard    = allEntries.length;
  const totalUnderway   = underwayEntries.length;
  const totalAnchor     = anchorEntries.length;

  const { inland, near_coastal, offshore } = compliance.daysByWaters;
  const watchHours = allEntries.reduce((s, e) => s + (e.watchkeepingHours || 0), 0);

  const grtDisplay = vessel.grt
    ? `${vessel.grt} GRT${vessel.grt < 24 ? ' (Small vessel)' : vessel.grt < 500 ? ' (Yacht)' : ''}`
    : '— (not recorded)';

  // ── Document setup ─────────────────────────────────────────
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW  = 210;
  const ML  = 20;
  const MR  = 20;
  const IW  = PW - ML - MR;  // 170mm
  const KW  = 60;              // key column width in tables
  let y     = 15;

  // ── HEADER ─────────────────────────────────────────────────
  // Top border pair
  doc.setLineWidth(1.2);
  doc.setDrawColor(30, 30, 30);
  doc.line(ML, y, PW - MR, y);
  doc.setLineWidth(0.3);
  doc.line(ML, y + 2.5, PW - MR, y + 2.5);
  y += 9;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('SEA SERVICE TESTIMONIAL', PW / 2, y, { align: 'center' });
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(70, 70, 70);
  doc.text('Issued pursuant to MSN 1856 (M+F) — Maritime and Coastguard Agency (MCA)', PW / 2, y, { align: 'center' });
  y += 5;

  doc.setLineWidth(0.3);
  doc.line(ML, y, PW - MR, y);
  doc.setLineWidth(1.2);
  doc.line(ML, y + 2.5, PW - MR, y + 2.5);
  doc.setTextColor(0, 0, 0);
  y += 10;

  // ── SECTION A — VESSEL DETAILS ──────────────────────────────
  drawSectionHeader(doc, 'A.  VESSEL DETAILS', ML, y, IW);
  y += 8;

  drawKeyValueRow(doc, 'Vessel Name',                  vessel.name || '',          ML, y, IW, KW); y += 7;
  drawKeyValueRow(doc, 'IMO / Official Number',        vessel.officialNumber || '', ML, y, IW, KW); y += 7;
  drawKeyValueRow(doc, 'Vessel Type',                  vessel.type || '',           ML, y, IW, KW); y += 7;
  drawKeyValueRow(doc, 'Gross Registered Tonnage',     grtDisplay,                  ML, y, IW, KW); y += 7;
  drawKeyValueRow(doc, 'Propulsion',                   vessel.propulsion || '',     ML, y, IW, KW); y += 7;
  drawKeyValueRow(doc, 'Flag State',                   vessel.flag || '',           ML, y, IW, KW); y += 7;
  y += 5;

  // ── SECTION B — SEA SERVICE RECORD ─────────────────────────
  drawSectionHeader(doc, 'B.  SEA SERVICE RECORD', ML, y, IW);
  y += 8;

  drawKeyValueRow(doc, 'Full Name of Seafarer',          user.name || '',            ML, y, IW, KW); y += 7;
  drawKeyValueRow(doc, 'CoC / Discharge Book Number',    user.mmcNumber || '',       ML, y, IW, KW); y += 7;
  drawKeyValueRow(doc, 'Capacity Served (Rank / Role)',  '',                         ML, y, IW, KW); y += 7;
  drawKeyValueRow(doc, 'Date Joined Vessel',             fmtDateLong(startDate),     ML, y, IW, KW); y += 7;
  drawKeyValueRow(doc, 'Date Signed Off',                fmtDateLong(endDate),       ML, y, IW, KW); y += 7;
  drawKeyValueRow(doc, 'Total Days on Board',            String(totalOnBoard),       ML, y, IW, KW); y += 7;
  drawKeyValueRow(doc, 'Sea Service Days (Underway)',    String(totalUnderway),      ML, y, IW, KW); y += 7;
  drawKeyValueRow(doc, 'Port / Standby Days',            String(totalAnchor),        ML, y, IW, KW); y += 7;
  y += 5;

  // ── SECTION C — TRADING AREA ────────────────────────────────
  drawSectionHeader(doc, 'C.  TRADING AREA AND WATERS', ML, y, IW);
  y += 8;

  // Sub-table header
  const tDaysColW = 30;
  const tLabelColW = IW - tDaysColW;

  doc.setFillColor(222, 222, 222);
  doc.setDrawColor(160, 160, 160);
  doc.setLineWidth(0.2);
  doc.rect(ML, y, IW, 6.5, 'FD');
  doc.line(ML + tLabelColW, y, ML + tLabelColW, y + 6.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Waters Category', ML + 2.5, y + 4.5);
  doc.text('Days', ML + tLabelColW + tDaysColW / 2, y + 4.5, { align: 'center' });
  y += 6.5;

  const watersRows = [
    ['Inland / Sheltered Waters',       Math.round(inland)],
    ['Near Coastal Waters (0–20 nm)',   Math.round(near_coastal)],
    ['Offshore / Ocean (>20 nm)',       Math.round(offshore)],
  ];
  for (const [label, val] of watersRows) {
    doc.setFillColor(255, 255, 255);
    doc.rect(ML, y, IW, 7, 'FD');
    doc.line(ML + tLabelColW, y, ML + tLabelColW, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(label, ML + 2.5, y + 4.9);
    doc.setFont('helvetica', 'bold');
    doc.text(String(val), ML + tLabelColW + tDaysColW / 2, y + 4.9, { align: 'center' });
    y += 7;
  }
  y += 6;

  // ── SECTION D — WATCHKEEPING ────────────────────────────────
  drawSectionHeader(doc, 'D.  WATCHKEEPING SERVICE  (MCA STCW II/1 / III/1)', ML, y, IW);
  y += 8;

  drawKeyValueRow(doc, 'Watchkeeping Undertaken',
    watchHours > 0 ? 'Yes' : 'Not recorded in this log', ML, y, IW, KW); y += 7;
  drawKeyValueRow(doc, 'Bridge Watch Hours Recorded',
    watchHours > 0 ? `${watchHours} hours` : 'N/A', ML, y, IW, KW); y += 7;
  y += 6;

  // ── SECTION E — MASTER'S DECLARATION ───────────────────────
  drawSectionHeader(doc, 'E.  MASTER\'S DECLARATION', ML, y, IW);
  y += 9;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(20, 20, 20);

  const seafarerName = user.name || '[Seafarer Name]';
  const vesselName   = vessel.name || '[Vessel Name]';
  const declText =
    `I confirm that ${seafarerName} served on board ${vesselName} in the capacity stated above, ` +
    `for the period ${fmtDateLong(startDate)} to ${fmtDateLong(endDate)}, ` +
    `and that the details given in this testimonial are correct to the best of my knowledge and belief. ` +
    `The above seafarer conducted themselves satisfactorily throughout the period of service.`;

  const splitDecl = doc.splitTextToSize(declText, IW);
  doc.text(splitDecl, ML, y);
  doc.setTextColor(0, 0, 0);
  y += splitDecl.length * 5 + 8;

  // Signature block
  const sigW = (IW - 10) / 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Master / Employer', ML, y);
  doc.text('Date (DD/MM/YYYY)', ML + sigW + 10, y);
  y += 3;

  // Pre-fill captain name if stored
  if (vessel.captainName) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(vessel.captainName, ML, y + 6);
  }
  doc.setLineWidth(0.35);
  doc.line(ML, y + 10, ML + sigW, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(90, 90, 90);
  doc.text('Printed name', ML, y + 13);
  doc.line(ML + sigW + 10, y + 10, ML + IW, y + 10);
  doc.text('Date', ML + sigW + 10, y + 13);
  y += 18;

  doc.line(ML, y + 10, ML + sigW, y + 10);
  doc.setFontSize(7.5);
  doc.text('Signature', ML, y + 13);
  doc.line(ML + sigW + 10, y + 10, ML + IW, y + 10);
  doc.text('Position / Rank', ML + sigW + 10, y + 13);
  doc.setTextColor(0, 0, 0);
  y += 18;

  // Vessel / company stamp box
  doc.setLineWidth(0.25);
  doc.setLineDash([2.5, 1.5]);
  doc.setDrawColor(160, 160, 160);
  doc.rect(ML, y, 55, 24);
  doc.setLineDash([]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(160, 160, 160);
  doc.text('VESSEL / COMPANY STAMP', ML + 27.5, y + 12.5, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y += 30;

  // ── FOOTER ─────────────────────────────────────────────────
  doc.setLineWidth(0.3);
  doc.setDrawColor(100, 100, 100);
  doc.line(ML, y, PW - MR, y);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.8);
  doc.setTextColor(120, 120, 120);
  y += 4;
  doc.text(
    'Generated by Sea Service Logger · For MCA Certificate of Competency applications · ' +
    'Data source: manually logged entries by seafarer.',
    ML, y
  );
  doc.text(
    'Master signature and vessel stamp required for MCA submission. ' +
    'This document supports but does not replace an official Discharge Book entry.',
    ML, y + 4
  );

  // ── SAVE ────────────────────────────────────────────────────
  const safeName = vessel.name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`MCA_Sea_Service_Testimonial_${safeName}_${startDate}.pdf`);
}
