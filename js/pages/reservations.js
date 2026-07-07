import { sidebar } from '../components/sidebar.js';
import { loadReservations, updateReservationStatus } from '../services/reservations.service.js';
import { AREA_NAMES } from '../config/booking-times.js';
import { statusLabel, depositLabel, reservationTypeLabel } from '../components/reservation-card.js';

let allRows = [];

export function render() {
  return `
    <div class="app-shell">
      ${sidebar('reservations')}

      <main class="main">
        <div class="topbar">
          <div>
            <h2>ניהול הזמנות</h2>
            <p>טבלת עבודה מלאה מתוך Google Sheets</p>
          </div>

          <div class="actions">
            <button class="btn primary" id="refreshBtn">רענון</button>
          </div>
        </div>

        <section class="panel">
          <div class="filters">
            <div class="field">
              <label>תאריך</label>
              <input id="dateFilter" type="date">
            </div>

            <div class="field">
              <label>מתחם</label>
              <select id="areaFilter">
                <option value="">הכל</option>
                <option value="covered">מקורה</option>
                <option value="inside">פנימי</option>
                <option value="outside">חיצוני</option>
              </select>
            </div>

            <div class="field">
              <label>סטטוס</label>
              <select id="statusFilter">
                <option value="">הכל</option>
                <option value="new">חדש</option>
                <option value="confirmed">אושר</option>
                <option value="arrived">הגיע</option>
                <option value="done">הסתיים</option>
                <option value="waiting">המתנה</option>
                <option value="cancelled">בוטל</option>
              </select>
            </div>

            <div class="field wide">
              <label>חיפוש</label>
              <input id="searchFilter" placeholder="שם / טלפון / שולחן / שעה">
            </div>
          </div>

          <div class="reservations-table-wrap">
            <table class="reservations-table">
              <thead>
                <tr>
                  <th>שעה</th>
                  <th>שם</th>
                  <th>טלפון</th>
                  <th>סועדים</th>
                  <th>סוג</th>
                  <th>מתחם</th>
                  <th>שולחן</th>
                  <th>Bit</th>
                  <th>קבלה</th>
                  <th>סטטוס</th>
                  <th>פעולה</th>
                </tr>
              </thead>

              <tbody id="reservationsBody">
                <tr>
                  <td colspan="11" class="empty">טוען...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  `;
}

export async function init() {
  document.getElementById('refreshBtn').onclick = refresh;

  ['dateFilter', 'areaFilter', 'statusFilter', 'searchFilter'].forEach(id => {
    document.getElementById(id).oninput = applyFilters;
  });

  await refresh();
}

async function refresh() {
  const btn = document.getElementById('refreshBtn');

  btn.disabled = true;
  btn.textContent = 'טוען...';

  try {
    allRows = await loadReservations();

    allRows.sort((a, b) => {
      return `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
    });

    applyFilters();
  } finally {
    btn.disabled = false;
    btn.textContent = 'רענון';
  }
}

function applyFilters() {
  const date = document.getElementById('dateFilter').value;
  const area = document.getElementById('areaFilter').value;
  const status = document.getElementById('statusFilter').value;
  const q = document.getElementById('searchFilter').value.trim();

  let rows = [...allRows];

  if (date) rows = rows.filter(r => r.date === date);
  if (area) rows = rows.filter(r => r.area === area);
  if (status) rows = rows.filter(r => r.status === status);

  if (q) {
    rows = rows.filter(r =>
      [
        r.customerName,
        r.phone,
        r.tableId,
        r.time,
        AREA_NAMES[r.area],
        reservationTypeLabel(r.reservationType),
        statusLabel(r.status)
      ].some(v => String(v || '').includes(q))
    );
  }

  renderRows(rows);
}

function renderRows(rows) {
  const body = document.getElementById('reservationsBody');

  if (!rows.length) {
    body.innerHTML = `
      <tr>
        <td colspan="11" class="empty">לא נמצאו הזמנות</td>
      </tr>
    `;
    return;
  }

  body.innerHTML = rows.map(r => {
    const hasReceipt = Boolean(r.receiptUrl);
    const bitOk = r.depositStatus === 'receipt_uploaded' || r.depositStatus === 'paid';

    return `
      <tr class="table-row-status-${r.status || 'new'}">
        <td><strong>${escapeHtml(r.time || '-')}</strong></td>
        <td>${escapeHtml(r.customerName || '-')}</td>
        <td>${escapeHtml(r.phone || '-')}</td>
        <td>${r.guests || 0}</td>
        <td>${reservationTypeLabel(r.reservationType)}</td>
        <td>${AREA_NAMES[r.area] || r.area || '-'}</td>
        <td>${r.tableId || 'המתנה'}</td>
        <td>${bitOk ? '✔' : '—'}</td>
        <td>
          ${
            hasReceipt
              ? `<a class="table-receipt-btn" href="${escapeAttr(r.receiptUrl)}" target="_blank" rel="noopener">📷</a>`
              : '—'
          }
        </td>
        <td>
          <span class="badge ${r.status || 'new'}">
            ${statusLabel(r.status)}
          </span>
        </td>
        <td>
          <select class="status-select" data-status-id="${escapeAttr(r.id)}">
            <option value="">פעולה</option>
            <option value="confirmed">אשר</option>
            <option value="arrived">הגיע</option>
            <option value="done">סיים</option>
            <option value="cancelled">בטל</option>
          </select>
        </td>
      </tr>
    `;
  }).join('');

  bindStatusSelects();
}

function bindStatusSelects() {
  document.querySelectorAll('.status-select').forEach(select => {
    select.onchange = async () => {
      if (!select.value) return;

      select.disabled = true;
      await updateReservationStatus(select.dataset.statusId, select.value);
      await refresh();
    };
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[s]));
}

function escapeAttr(str) {
  return escapeHtml(str);
}}

async function refresh(){
  allRows = await loadReservations();
  allRows.sort((a,b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  applyFilters();
}

function applyFilters(){
  const date = document.getElementById('dateFilter').value;
  const area = document.getElementById('areaFilter').value;
  const q = document.getElementById('searchFilter').value.trim();

  let rows = allRows;
  if (date) rows = rows.filter(r => r.date === date);
  if (area) rows = rows.filter(r => r.area === area);
  if (q) rows = rows.filter(r =>
    [r.customerName,r.phone,r.tableId,r.time].some(v => String(v||'').includes(q))
  );

  document.getElementById('reservationsList').innerHTML =
    rows.length ? rows.map(r => reservationCard(r)).join('') : '<div class="empty">לא נמצאו הזמנות</div>';

  document.querySelectorAll('[data-status-id]').forEach(btn => {
    btn.onclick = async () => {
      await updateReservationStatus(btn.dataset.statusId, btn.dataset.status);
      await refresh();
    };
  });
}
