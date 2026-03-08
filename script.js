// ===========================
// UTILITY FUNCTIONS
// ===========================

function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(index) {
  const colors = ['', 'av-green', 'av-orange', 'av-pink', 'av-cyan'];
  return colors[index % colors.length];
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ===========================
// AUTH FUNCTIONS
// ===========================

function getStaff() {
  return JSON.parse(localStorage.getItem('ac_staff') || '[]');
}

function saveStaff(staff) {
  localStorage.setItem('ac_staff', JSON.stringify(staff));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('ac_current_user') || 'null');
}

function setCurrentUser(user) {
  localStorage.setItem('ac_current_user', JSON.stringify(user));
}

function logout() {
  localStorage.removeItem('ac_current_user');
  window.location.href = 'index.html';
}

function checkAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

// ===========================
// ALUMNI DATA FUNCTIONS
// ===========================

function getAlumni() {
  return JSON.parse(localStorage.getItem('ac_alumni') || '[]');
}

function saveAlumni(alumni) {
  localStorage.setItem('ac_alumni', JSON.stringify(alumni));
}

function addAlumni(data) {
  const alumni = getAlumni();
  const newAlumni = { ...data, id: generateId(), createdAt: Date.now() };
  alumni.push(newAlumni);
  saveAlumni(alumni);
  return newAlumni;
}

function deleteAlumni(id) {
  const alumni = getAlumni().filter(a => a.id !== id);
  saveAlumni(alumni);
}

function searchAlumni(query, dept = '', year = '') {
  let alumni = getAlumni();
  if (query) {
    const q = query.toLowerCase();
    alumni = alumni.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.company.toLowerCase().includes(q) ||
      a.location.toLowerCase().includes(q) ||
      a.department.toLowerCase().includes(q)
    );
  }
  if (dept) {
    alumni = alumni.filter(a => a.department === dept);
  }
  if (year) {
    alumni = alumni.filter(a => a.passoutYear === year);
  }
  return alumni;
}

// ===========================
// SIGNUP PAGE
// ===========================

function initSignup() {
  const form = document.getElementById('signupForm');
  if (!form) return;

  // Redirect if already logged in
  if (getCurrentUser()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const emailInput = document.getElementById('signupEmail');
  const passwordInput = document.getElementById('signupPassword');
  const confirmInput = document.getElementById('signupConfirm');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearErrors();

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirm = confirmInput.value;
    let valid = true;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('emailError', 'Please enter a valid email address');
      valid = false;
    }
    if (!password || password.length < 6) {
      showError('passwordError', 'Password must be at least 6 characters');
      valid = false;
    }
    if (password !== confirm) {
      showError('confirmError', 'Passwords do not match');
      valid = false;
    }

    if (!valid) return;

    const staff = getStaff();
    if (staff.find(s => s.email === email)) {
      showError('emailError', 'An account with this email already exists');
      return;
    }

    const newStaff = { id: generateId(), email, password, createdAt: Date.now() };
    staff.push(newStaff);
    saveStaff(staff);

    showToast('Account created successfully! Redirecting...', 'success');
    setTimeout(() => { window.location.href = 'login.html'; }, 1500);
  });

  // Password toggle
  setupPasswordToggles();

  // Strength meter
  if (passwordInput) {
    passwordInput.addEventListener('input', function () {
      updateStrengthMeter(this.value);
    });
  }
}

// ===========================
// LOGIN PAGE
// ===========================

function initLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  if (getCurrentUser()) {
    window.location.href = 'dashboard.html';
    return;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearErrors();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    let valid = true;

    if (!email) {
      showError('emailError', 'Email is required');
      valid = false;
    }
    if (!password) {
      showError('passwordError', 'Password is required');
      valid = false;
    }
    if (!valid) return;

    const staff = getStaff();
    const user = staff.find(s => s.email === email && s.password === password);

    if (!user) {
      showToast('Invalid email or password. Please try again.', 'error');
      document.getElementById('loginPassword').value = '';
      return;
    }

    setCurrentUser({ id: user.id, email: user.email });
    showToast('Login successful! Redirecting...', 'success');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
  });

  setupPasswordToggles();
}

// ===========================
// HELPER: FORM ERRORS
// ===========================

function showError(id, message) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = message;
    el.classList.add('show');
  }
}

function clearErrors() {
  document.querySelectorAll('.error-text').forEach(el => {
    el.textContent = '';
    el.classList.remove('show');
  });
}

function setupPasswordToggles() {
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', function () {
      const input = this.previousElementSibling || this.parentElement.querySelector('input');
      const targetId = this.dataset.target;
      const targetInput = targetId ? document.getElementById(targetId) : input;
      if (targetInput) {
        const isPassword = targetInput.type === 'password';
        targetInput.type = isPassword ? 'text' : 'password';
        this.textContent = isPassword ? '🙈' : '👁';
      }
    });
  });
}

function updateStrengthMeter(password) {
  const meter = document.getElementById('strengthMeter');
  const label = document.getElementById('strengthLabel');
  if (!meter || !label) return;

  let strength = 0;
  if (password.length >= 6) strength++;
  if (password.length >= 10) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  const levels = [
    { label: '', color: '#e2e8f0', width: '0%' },
    { label: 'Very Weak', color: '#ef4444', width: '20%' },
    { label: 'Weak', color: '#f59e0b', width: '40%' },
    { label: 'Fair', color: '#eab308', width: '60%' },
    { label: 'Strong', color: '#22c55e', width: '80%' },
    { label: 'Very Strong', color: '#10b981', width: '100%' },
  ];

  const level = levels[Math.min(strength, 5)];
  meter.style.width = password.length > 0 ? level.width : '0%';
  meter.style.background = level.color;
  label.textContent = password.length > 0 ? level.label : '';
  label.style.color = level.color;
}

// ===========================
// DASHBOARD
// ===========================

let currentSection = 'overview';
let activityLog = JSON.parse(localStorage.getItem('ac_activity') || '[]');

function logActivity(text) {
  activityLog.unshift({ text, time: Date.now() });
  if (activityLog.length > 20) activityLog = activityLog.slice(0, 20);
  localStorage.setItem('ac_activity', JSON.stringify(activityLog));
}

function initDashboard() {
  const user = checkAuth();
  if (!user) return;

  // Set user info
  const emailParts = user.email.split('@');
  const userName = emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
  const initials = userName.slice(0, 2).toUpperCase();

  const userNameEl = document.getElementById('userName');
  const userEmailEl = document.getElementById('userEmail');
  const userAvatarEl = document.getElementById('userAvatar');
  const topbarUserEl = document.getElementById('topbarUser');

  if (userNameEl) userNameEl.textContent = userName;
  if (userEmailEl) userEmailEl.textContent = user.email;
  if (userAvatarEl) userAvatarEl.textContent = initials;
  if (topbarUserEl) topbarUserEl.textContent = initials;

  // Sidebar navigation
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.addEventListener('click', function () {
      const section = this.dataset.section;
      if (section) navigateTo(section);
    });
  });

  // Hamburger
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('show');
    });
  }
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });
  }

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      showToast('Logged out successfully', 'info');
      setTimeout(() => logout(), 1000);
    });
  }

  // Global search
  const globalSearch = document.getElementById('globalSearch');
  if (globalSearch) {
    globalSearch.addEventListener('input', function () {
      if (currentSection !== 'alumni') navigateTo('alumni');
      const tableSearch = document.getElementById('tableSearch');
      if (tableSearch) {
        tableSearch.value = this.value;
        renderAlumniTable();
      }
    });
  }

  // Add alumni form
  const alumniForm = document.getElementById('addAlumniForm');
  if (alumniForm) {
    alumniForm.addEventListener('submit', handleAddAlumni);
  }

  // Table search
  const tableSearch = document.getElementById('tableSearch');
  if (tableSearch) {
    tableSearch.addEventListener('input', renderAlumniTable);
  }

  // Filters
  const deptFilter = document.getElementById('deptFilter');
  const yearFilter = document.getElementById('yearFilter');
  if (deptFilter) deptFilter.addEventListener('change', renderAlumniTable);
  if (yearFilter) yearFilter.addEventListener('change', renderAlumniTable);

  // Init
  updateStats();
  renderAlumniTable();
  renderOverview();
  navigateTo('overview');
}

function navigateTo(section) {
  currentSection = section;

  // Update sidebar
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.section === section);
  });

  // Show/hide sections
  document.querySelectorAll('.dashboard-section').forEach(sec => {
    sec.classList.toggle('active-section', sec.id === `section-${section}`);
  });

  // Update topbar title
  const titles = {
    overview: { title: 'Dashboard Overview', sub: 'Welcome back! Here\'s what\'s happening.' },
    add: { title: 'Add Alumni', sub: 'Register a new alumni member to the system.' },
    alumni: { title: 'Alumni Records', sub: 'Manage and search all alumni data.' },
  };
  const titleData = titles[section] || titles.overview;
  const titleEl = document.getElementById('pageTitle');
  const subEl = document.getElementById('pageSubtitle');
  if (titleEl) titleEl.textContent = titleData.title;
  if (subEl) subEl.textContent = titleData.sub;

  // Close sidebar on mobile
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar && window.innerWidth <= 900) {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  }

  if (section === 'overview') renderOverview();
}

function handleAddAlumni(e) {
  e.preventDefault();
  const form = e.target;

  const name = form.querySelector('#alumName').value.trim();
  const email = form.querySelector('#alumEmail').value.trim();
  const phone = form.querySelector('#alumPhone').value.trim();
  const department = form.querySelector('#alumDept').value;
  const passoutYear = form.querySelector('#alumYear').value;
  const company = form.querySelector('#alumCompany').value.trim();
  const location = form.querySelector('#alumLocation').value.trim();

  if (!name || !email || !phone || !department || !passoutYear || !company || !location) {
    showToast('Please fill in all required fields.', 'error');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast('Please enter a valid email address.', 'error');
    return;
  }

  const alumni = getAlumni();
  if (alumni.find(a => a.email === email)) {
    showToast('An alumni with this email already exists.', 'error');
    return;
  }

  const newAlumni = addAlumni({ name, email, phone, department, passoutYear, company, location });
  logActivity(`<strong>${name}</strong> was added to alumni records`);

  showToast(`${name} has been added successfully!`, 'success');
  form.reset();
  updateStats();
  renderAlumniTable();

  // Navigate to alumni list
  setTimeout(() => navigateTo('alumni'), 1000);
}

function handleDeleteAlumni(id, name) {
  if (!confirm(`Are you sure you want to remove ${name} from the alumni records?`)) return;
  deleteAlumni(id);
  logActivity(`<strong>${name}</strong> was removed from alumni records`);
  showToast(`${name} has been removed.`, 'info');
  updateStats();
  renderAlumniTable();
  renderOverview();
}

function updateStats() {
  const alumni = getAlumni();
  const total = alumni.length;
  const depts = [...new Set(alumni.map(a => a.department))].length;
  const companies = [...new Set(alumni.map(a => a.company))].length;

  const thisYear = new Date().getFullYear();
  const recent = alumni.filter(a => new Date(a.createdAt).getFullYear() === thisYear).length;

  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setEl('statTotal', total);
  setEl('statDepts', depts);
  setEl('statCompanies', companies);
  setEl('statRecent', recent);

  // Update alumni count badge in sidebar
  const badge = document.querySelector('[data-section="alumni"] .nav-badge');
  if (badge) badge.textContent = total;
}

function renderAlumniTable() {
  const tbody = document.getElementById('alumniTableBody');
  const emptyState = document.getElementById('emptyState');
  const tableInfo = document.getElementById('tableInfo');
  if (!tbody) return;

  const query = document.getElementById('tableSearch')?.value || '';
  const dept = document.getElementById('deptFilter')?.value || '';
  const year = document.getElementById('yearFilter')?.value || '';

  const alumni = searchAlumni(query, dept, year);
  tbody.innerHTML = '';

  if (alumni.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    if (tableInfo) tableInfo.textContent = 'No records found';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  alumni.forEach((a, index) => {
    const initials = getInitials(a.name);
    const avColor = getAvatarColor(index);
    const deptClass = getDeptClass(a.department);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="alumni-name">
          <div class="alumni-avatar ${avColor}">${initials}</div>
          <div>
            <div class="alumni-name-text">${escapeHtml(a.name)}</div>
            <div class="alumni-email">${escapeHtml(a.email)}</div>
          </div>
        </div>
      </td>
      <td>${escapeHtml(a.phone)}</td>
      <td><span class="dept-badge ${deptClass}">${escapeHtml(a.department)}</span></td>
      <td class="year-text">${escapeHtml(a.passoutYear)}</td>
      <td>${escapeHtml(a.company)}</td>
      <td>${escapeHtml(a.location)}</td>
      <td>
        <button class="btn btn-danger" onclick="handleDeleteAlumni('${a.id}', '${escapeHtml(a.name).replace(/'/g, "\\'")}')">
          🗑 Remove
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  const total = getAlumni().length;
  if (tableInfo) {
    tableInfo.textContent = query || dept || year
      ? `Showing ${alumni.length} of ${total} records`
      : `Showing all ${total} records`;
  }
}

function renderOverview() {
  renderDeptChart();
  renderActivityLog();
}

function renderDeptChart() {
  const container = document.getElementById('deptChart');
  if (!container) return;

  const alumni = getAlumni();
  const deptCounts = {};
  alumni.forEach(a => {
    deptCounts[a.department] = (deptCounts[a.department] || 0) + 1;
  });

  const sorted = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]);
  const max = sorted.length > 0 ? sorted[0][1] : 1;

  if (sorted.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-title">No data yet</div><div class="empty-desc">Add alumni to see department statistics</div></div>`;
    return;
  }

  container.innerHTML = sorted.map(([dept, count]) => `
    <div class="chart-bar-item">
      <div class="chart-bar-label">${dept.length > 8 ? dept.slice(0, 8) + '…' : dept}</div>
      <div class="chart-bar-track">
        <div class="chart-bar-fill" style="width: ${(count / max) * 100}%"></div>
      </div>
      <div class="chart-bar-count">${count}</div>
    </div>
  `).join('');
}

function renderActivityLog() {
  const container = document.getElementById('activityLog');
  if (!container) return;

  if (activityLog.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:30px;color:var(--text-muted);font-size:14px;">No recent activity</div>`;
    return;
  }

  container.innerHTML = activityLog.slice(0, 8).map(a => `
    <div class="activity-item">
      <div class="activity-dot"></div>
      <div class="activity-content">
        <div class="activity-text">${a.text}</div>
        <div class="activity-time">${formatDate(a.time)}</div>
      </div>
    </div>
  `).join('');
}

function getDeptClass(dept) {
  const map = {
    'Computer Science': 'dept-cs',
    'Information Technology': 'dept-it',
    'Electronics': 'dept-ec',
    'Mechanical': 'dept-mech',
    'Civil': 'dept-civil',
  };
  return map[dept] || 'dept-default';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ===========================
// LANDING PAGE
// ===========================

function initLanding() {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    });
  }
}

// ===========================
// INIT ON LOAD
// ===========================

document.addEventListener('DOMContentLoaded', function () {
  const page = document.body.dataset.page;
  if (page === 'landing') initLanding();
  else if (page === 'login') initLogin();
  else if (page === 'signup') initSignup();
  else if (page === 'dashboard') initDashboard();
});
