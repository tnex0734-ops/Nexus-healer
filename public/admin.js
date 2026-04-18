// =============================================
// Nexus Healer — Admin Dashboard Logic
// =============================================

let allAssessments = [];

document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  loadDashboard();
});

// --- Sidebar Mobile Toggle ---
function initSidebar() {
  const btn = document.getElementById('mobileSidebarBtn');
  const sidebar = document.getElementById('sidebar');

  if (btn) {
    btn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    // Close sidebar on outside click
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('open') &&
          !sidebar.contains(e.target) &&
          !btn.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }
}

// --- Load Dashboard ---
async function loadDashboard() {
  showLoading(true);

  try {
    // Check if Firebase is configured
    if (typeof db === 'undefined') {
      showEmpty();
      return;
    }

    // Load assessments
    allAssessments = await getAssessments();

    // Load stats
    const stats = await getAssessmentStats();
    renderStats(stats);
    renderCharts(stats);

    // Render records
    renderRecords(allAssessments);
  } catch (error) {
    console.error('Dashboard load error:', error);
    showEmpty();
  }

  showLoading(false);
}

// --- Render Stats ---
function renderStats(stats) {
  animateValue('statTotal', stats.total);
  animateValue('statHigh', stats.high);
  animateValue('statMedium', stats.medium);
  animateValue('statLow', stats.low);
  animateValue('statAvgRisk', stats.avgRiskScore);
  animateValue('statToday', stats.todayCount);
}

function animateValue(id, target) {
  const el = document.getElementById(id);
  if (!el) return;

  const duration = 800;
  const start = performance.now();

  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * ease);

    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

// --- Render Charts ---
function renderCharts(stats) {
  const total = stats.total || 1;

  // Priority bars
  setTimeout(() => {
    const highPct = Math.max((stats.high / total) * 100, 2);
    const medPct = Math.max((stats.medium / total) * 100, 2);
    const lowPct = Math.max((stats.low / total) * 100, 2);

    document.getElementById('chartBarHigh').style.height = highPct + '%';
    document.getElementById('chartBarMedium').style.height = medPct + '%';
    document.getElementById('chartBarLow').style.height = lowPct + '%';
  }, 300);

  // Risk gauge
  setTimeout(() => {
    const gaugeArc = document.getElementById('gaugeArc');
    const gaugeValue = document.getElementById('gaugeValue');
    const maxDash = 251; // half-circle arc length
    const dashValue = (stats.avgRiskScore / 100) * maxDash;

    gaugeArc.style.strokeDasharray = `${dashValue} ${maxDash}`;
    gaugeValue.textContent = stats.avgRiskScore;

    // Color based on risk
    if (stats.avgRiskScore >= 70) {
      gaugeArc.style.stroke = 'var(--danger)';
    } else if (stats.avgRiskScore >= 40) {
      gaugeArc.style.stroke = 'var(--secondary)';
    } else {
      gaugeArc.style.stroke = 'var(--success)';
    }
  }, 500);
}

// --- Render Records ---
function renderRecords(assessments) {
  const body = document.getElementById('recordsBody');
  const tableWrap = document.getElementById('recordsTableWrap');
  const empty = document.getElementById('recordsEmpty');

  if (!assessments || assessments.length === 0) {
    tableWrap.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  tableWrap.style.display = 'block';
  empty.style.display = 'none';
  body.innerHTML = '';

  assessments.forEach(a => {
    const row = document.createElement('tr');

    // Format date
    const date = a.createdAt ? new Date(a.createdAt) : new Date();
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Priority badge
    const pLevel = (a.priority || 'MEDIUM').toLowerCase();
    const pClass = `priority-badge priority-badge-${pLevel}`;

    // Risk pill
    let riskClass = 'risk-pill-low';
    if (a.riskScore >= 70) riskClass = 'risk-pill-high';
    else if (a.riskScore >= 40) riskClass = 'risk-pill-medium';

    // Conditions
    const conditions = (a.conditions || []).slice(0, 2).map(c =>
      `<span class="record-condition-tag">${esc(c.name)} <span class="conf">${c.confidence}%</span></span>`
    ).join('');

    row.innerHTML = `
      <td>
        <div class="record-date">${dateStr}</div>
        <div class="record-date-time">${timeStr}</div>
      </td>
      <td><div class="record-symptoms">${esc(a.symptoms || '-')}</div></td>
      <td class="record-vitals">${a.age || '-'} / ${a.gender || '-'}</td>
      <td><div class="record-conditions">${conditions || '-'}</div></td>
      <td><span class="${pClass}">${a.priority || 'MEDIUM'}</span></td>
      <td><span class="risk-pill ${riskClass}">${a.riskScore || 0}</span></td>
      <td>
        <div class="record-actions">
          <button class="action-btn" onclick="viewDetail('${a.id}')" title="View Details">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="action-btn action-btn-delete" onclick="handleDelete('${a.id}')" title="Delete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    `;

    body.appendChild(row);
  });
}

// --- Filters ---
function applyFilters() {
  const priority = document.getElementById('filterPriority').value;
  const search = document.getElementById('filterSearch').value.toLowerCase().trim();

  let filtered = [...allAssessments];

  if (priority) {
    filtered = filtered.filter(a => a.priority === priority);
  }

  if (search) {
    filtered = filtered.filter(a =>
      (a.symptoms || '').toLowerCase().includes(search) ||
      (a.conditions || []).some(c => c.name.toLowerCase().includes(search))
    );
  }

  renderRecords(filtered);
}

// --- View Detail Modal ---
function viewDetail(id) {
  const a = allAssessments.find(r => r.id === id);
  if (!a) return;

  const modal = document.getElementById('modalOverlay');
  const body = document.getElementById('modalBody');

  const date = a.createdAt ? new Date(a.createdAt) : new Date();
  const dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const pLevel = (a.priority || 'MEDIUM').toLowerCase();

  // Build conditions
  const conditionsHtml = (a.conditions || []).map(c => `
    <div class="detail-condition-item">
      <span class="detail-condition-name">${esc(c.name)}</span>
      <span class="detail-condition-conf">${c.confidence}%</span>
    </div>
  `).join('');

  // Build recommendations
  const recsHtml = (a.recommendations || []).map(r => `<li>${esc(r)}</li>`).join('');

  // Build symptoms tags
  const symptomsHtml = (a.extractedSymptoms || []).map(s =>
    `<span class="detail-tag">${esc(s)}</span>`
  ).join('');

  body.innerHTML = `
    <div class="detail-header">
      <span class="detail-priority priority-badge priority-badge-${pLevel}">${a.priority || 'MEDIUM'}</span>
      <span class="detail-date">${dateStr}</span>
    </div>

    <div class="detail-section">
      <div class="detail-section-title">Patient Input</div>
      <div class="detail-text">${esc(a.symptoms || '-')}</div>
    </div>

    <div class="detail-section">
      <div class="detail-section-title">Vitals</div>
      <div class="detail-vitals-grid">
        <div class="detail-vital-item">
          <div class="detail-vital-label">Age</div>
          <div class="detail-vital-value">${a.age || '-'}</div>
        </div>
        <div class="detail-vital-item">
          <div class="detail-vital-label">Gender</div>
          <div class="detail-vital-value">${a.gender || '-'}</div>
        </div>
        <div class="detail-vital-item">
          <div class="detail-vital-label">BP</div>
          <div class="detail-vital-value">${a.bloodPressure || '-'}</div>
        </div>
        <div class="detail-vital-item">
          <div class="detail-vital-label">Temp °F</div>
          <div class="detail-vital-value">${a.temperature || '-'}</div>
        </div>
        <div class="detail-vital-item">
          <div class="detail-vital-label">Heart Rate</div>
          <div class="detail-vital-value">${a.heartRate || '-'}</div>
        </div>
        <div class="detail-vital-item">
          <div class="detail-vital-label">O₂ Sat</div>
          <div class="detail-vital-value">${a.oxygenLevel || '-'}%</div>
        </div>
      </div>
    </div>

    ${symptomsHtml ? `
    <div class="detail-section">
      <div class="detail-section-title">Extracted Symptoms</div>
      <div class="detail-tags">${symptomsHtml}</div>
    </div>
    ` : ''}

    <div class="detail-section">
      <div class="detail-section-title">Risk Score</div>
      <div class="detail-text" style="font-size:28px; font-weight:800; font-family:var(--font-heading); color:var(--text);">${a.riskScore || 0}<span style="font-size:14px; color:var(--text-muted);"> / 100</span></div>
    </div>

    <div class="detail-section">
      <div class="detail-section-title">Predicted Conditions</div>
      <div class="detail-conditions-list">${conditionsHtml || '<div class="detail-text">No conditions predicted</div>'}</div>
    </div>

    ${a.vitalSignsAssessment ? `
    <div class="detail-section">
      <div class="detail-section-title">Vital Signs Assessment</div>
      <div class="detail-text">${esc(a.vitalSignsAssessment)}</div>
    </div>
    ` : ''}

    ${recsHtml ? `
    <div class="detail-section">
      <div class="detail-section-title">Recommendations</div>
      <ul class="detail-rec-list">${recsHtml}</ul>
    </div>
    ` : ''}
  `;

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
  document.body.style.overflow = '';
}

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// --- Delete ---
async function handleDelete(id) {
  if (!confirm('Delete this assessment record?')) return;

  const success = await deleteAssessment(id);
  if (success) {
    allAssessments = allAssessments.filter(a => a.id !== id);
    renderRecords(allAssessments);

    // Reload stats
    const stats = await getAssessmentStats();
    renderStats(stats);
    renderCharts(stats);
  }
}

// --- View Toggle ---
function showRecordsView() {
  document.getElementById('navDashboard').classList.remove('active');
  document.getElementById('navRecords').classList.add('active');

  // Scroll to records
  document.querySelector('.records-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// --- Helpers ---
function showLoading(show) {
  const loading = document.getElementById('recordsLoading');
  const empty = document.getElementById('recordsEmpty');

  if (show) {
    loading.style.display = 'block';
    empty.style.display = 'none';
    document.getElementById('recordsTableWrap').style.display = 'none';
  } else {
    loading.style.display = 'none';
  }
}

function showEmpty() {
  document.getElementById('recordsLoading').style.display = 'none';
  document.getElementById('recordsEmpty').style.display = 'block';
  document.getElementById('recordsTableWrap').style.display = 'none';
}

function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
