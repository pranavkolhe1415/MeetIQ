/**
 * MeetIQ Pages - History, Profile, Settings, About
 */

/* History Page */
let historyFilter = { sort: '-createdAt', status: '' };
let allHistoryMeetings = [];

function renderHistory() {
  const container = document.getElementById('page-content');
  container.innerHTML = `
    <div class="history-header">
      <h1>Meeting History</h1>
      <div class="history-controls">
        <div class="history-search"><i data-lucide="search"></i><input type="text" id="history-search" placeholder="Search meetings..." onkeyup="searchMeetings(this.value)"></div>
        <button class="btn btn-outline btn-sm" onclick="showFilterPopup()"><i data-lucide="sliders-horizontal"></i> Filter</button>
      </div>
    </div>
    <div class="meetings-list" id="meetings-list"><div class="empty-state"><p>Loading...</p></div></div>
    <div id="filter-popup-container"></div>`;
  lucide.createIcons();
  loadMeetings();
}

async function loadMeetings() {
  try {
    let params = `limit=1000&sort=${historyFilter.sort}`;
    if (historyFilter.status) params += `&status=${historyFilter.status}`;
    const res = await api.getMeetings(params);
    allHistoryMeetings = res.data.meetings || [];
    filterAndRenderHistory();
  } catch (e) {
    showToast('Failed to load meetings', 'error');
  }
}

function filterAndRenderHistory() {
  const searchInput = document.getElementById('history-search');
  const globalSearchInput = document.getElementById('global-search');
  const query = (searchInput?.value || globalSearchInput?.value || '').trim();

  const list = document.getElementById('meetings-list');
  if (!list) return;

  const filtered = allHistoryMeetings.filter(m => {
    if (!query) return true;
    const q = query.toLowerCase();
    const titleMatch = m.title && m.title.toLowerCase().includes(q);
    const statusMatch = m.status && m.status.toLowerCase().includes(q);
    const dateStr = m.createdAt ? new Date(m.createdAt).toLocaleDateString().toLowerCase() : '';
    const timeAgoStr = m.createdAt ? timeAgo(m.createdAt).toLowerCase() : '';
    const dateMatch = dateStr.includes(q) || timeAgoStr.includes(q);
    const participantsMatch = m.participants && m.participants.some(p => p.name && p.name.toLowerCase().includes(q));
    return titleMatch || statusMatch || dateMatch || participantsMatch;
  });

  if (!filtered.length) {
    list.innerHTML = '<div class="empty-state"><i data-lucide="inbox"></i><h4>No meetings found</h4><p>Try refining your search</p></div>';
    lucide.createIcons();
    return;
  }

  list.innerHTML = filtered.map(m => `
    <div class="recent-meeting-item" onclick="handleMeetingClick('${m._id}','${m.status}')">
      <div class="meeting-item-icon ${m.fileType||'video'}"><i data-lucide="${m.fileType==='audio'?'music':'video'}"></i></div>
      <div class="meeting-item-info">
        <h4>${esc(m.title)}</h4>
        <p>${timeAgo(m.createdAt)} · ${formatDur(m.duration)} · ${formatSize(m.fileSize)}</p>
      </div>
      <span class="meeting-item-status status-${m.status}">${m.status}</span>
      <div class="meeting-item-actions">
        ${m.status==='completed'?`<button onclick="event.stopPropagation();navigateTo('report','${m._id}')" title="Report"><i data-lucide="eye"></i></button><button onclick="event.stopPropagation();downloadPDF('${m._id}')" title="PDF"><i data-lucide="download"></i></button>`:''}
        <button onclick="event.stopPropagation();deleteMeeting('${m._id}')" title="Delete"><i data-lucide="trash-2"></i></button>
      </div>
    </div>`).join('');
  lucide.createIcons();
}

function searchMeetings(query) {
  const globalSearch = document.getElementById('global-search');
  if (globalSearch) {
    globalSearch.value = query;
    const clearBtn = document.getElementById('search-clear-btn');
    if (query) clearBtn?.classList.remove('hidden');
    else clearBtn?.classList.add('hidden');
  }
  filterAndRenderHistory();
}

function showFilterPopup() {
  document.getElementById('filter-popup-container').innerHTML = `
    <div class="filter-popup" onclick="if(event.target===this)closeFilter()">
      <div class="filter-popup-card">
        <h3>Filter Meetings</h3>
        <div class="filter-group"><label>Sort By</label>
          <div class="filter-options">
            <span class="filter-chip ${historyFilter.sort==='-createdAt'?'active':''}" onclick="historyFilter.sort='-createdAt';refreshChips()">Newest</span>
            <span class="filter-chip ${historyFilter.sort==='createdAt'?'active':''}" onclick="historyFilter.sort='createdAt';refreshChips()">Oldest</span>
            <span class="filter-chip ${historyFilter.sort==='-duration'?'active':''}" onclick="historyFilter.sort='-duration';refreshChips()">Duration</span>
          </div>
        </div>
        <div class="filter-group"><label>Status</label>
          <div class="filter-options">
            <span class="filter-chip ${historyFilter.status===''?'active':''}" onclick="historyFilter.status='';refreshChips()">All</span>
            <span class="filter-chip ${historyFilter.status==='completed'?'active':''}" onclick="historyFilter.status='completed';refreshChips()">Completed</span>
            <span class="filter-chip ${historyFilter.status==='processing'?'active':''}" onclick="historyFilter.status='processing';refreshChips()">Processing</span>
          </div>
        </div>
        <div class="filter-actions">
          <button class="btn btn-ghost" onclick="historyFilter={sort:'-createdAt',status:''};closeFilter();loadMeetings()">Reset</button>
          <button class="btn btn-primary" onclick="closeFilter();loadMeetings()">Apply</button>
        </div>
      </div>
    </div>`;
}
function closeFilter() { document.getElementById('filter-popup-container').innerHTML = ''; }
function refreshChips() { showFilterPopup(); }

async function deleteMeeting(id) {
  if (!confirm('Delete this meeting?')) return;
  try { await api.deleteMeeting(id); showToast('Meeting deleted', 'success'); loadMeetings(); } catch (e) { showToast(e.message, 'error'); }
}

/* Profile Page */
let isEditingProfile = false;

function renderProfile() {
  isEditingProfile = false;
  const u = currentUser || {};
  const container = document.getElementById('page-content');
  container.innerHTML = `
    <div class="profile-page">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
        <h1 style="margin:0;">Profile</h1>
        <div id="profile-action-btn-container">
          <button class="btn btn-outline" onclick="enableProfileEdit()"><i data-lucide="edit-3"></i> Edit Profile</button>
        </div>
      </div>
      <div class="profile-card">
        <div class="profile-avatar-section">
          <div class="profile-avatar-lg" id="profile-avatar-display">${u.avatar ? `<img src="${esc(u.avatar)}" style="width:100%;height:100%;object-fit:cover;border-radius:18px;" />` : (u.name||'U').charAt(0).toUpperCase()}</div>
          <div><h3 style="font-size:18px;margin:0" id="profile-name-display">${esc(u.name||'')}</h3><p style="color:var(--text-muted);font-size:13px">${esc(u.email||'')}</p></div>
        </div>
        <h3 style="margin-bottom:20px; padding-bottom:12px; border-bottom:1px solid var(--border-color);">Personal Information</h3>
        <form id="profile-form" onsubmit="saveProfile(event)">
          <div class="form-row">
            <div class="form-group"><label>Full Name</label><input type="text" id="p-name" value="${esc(u.name||'')}" readonly></div>
            <div class="form-group"><label>Email Address</label><input type="email" id="p-email" value="${esc(u.email||'')}" readonly disabled></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Company</label><input type="text" id="p-company" value="${esc(u.company||'')}" readonly></div>
            <div class="form-group"><label>Job Title</label><input type="text" id="p-job" value="${esc(u.jobTitle||'')}" readonly></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Phone</label><input type="text" id="p-phone" value="${esc(u.phone||'')}" readonly></div>
            <div class="form-group"><label>Profile Photo URL</label><input type="text" id="p-avatar" value="${esc(u.avatar||'')}" readonly></div>
          </div>
          <div id="profile-form-buttons" class="hidden" style="display:flex; gap:12px; margin-top:20px;">
            <button type="button" class="btn btn-ghost" onclick="cancelProfileEdit()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>`;
  lucide.createIcons();
  loadProfileData();
}

function enableProfileEdit() {
  isEditingProfile = true;
  document.getElementById('p-name').removeAttribute('readonly');
  document.getElementById('p-company').removeAttribute('readonly');
  document.getElementById('p-job').removeAttribute('readonly');
  document.getElementById('p-phone').removeAttribute('readonly');
  document.getElementById('p-avatar').removeAttribute('readonly');
  
  document.getElementById('profile-action-btn-container').innerHTML = '';
  document.getElementById('profile-form-buttons').classList.remove('hidden');
}

function cancelProfileEdit() {
  renderProfile();
}

async function loadProfileData() {
  try {
    const res = await api.getProfile();
    currentUser = res.data.user;
    storeUser(currentUser);
  } catch {}
}

async function saveProfile(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span>Saving...</span>';

  try {
    const name = document.getElementById('p-name').value.trim();
    const company = document.getElementById('p-company').value.trim();
    const jobTitle = document.getElementById('p-job').value.trim();
    const phone = document.getElementById('p-phone').value.trim();
    const avatar = document.getElementById('p-avatar').value.trim();

    if (!name) throw new Error('Full Name is required');

    await api.updateProfile({ name, company, jobTitle, phone, avatar });
    showToast('Profile updated successfully!', 'success');
    
    const res = await api.getProfile();
    currentUser = res.data.user;
    storeUser(currentUser);

    document.getElementById('user-name').textContent = currentUser.name;
    document.getElementById('user-avatar').textContent = currentUser.name.charAt(0).toUpperCase();
    if (currentUser.avatar) {
      document.getElementById('user-avatar').innerHTML = `<img src="${esc(currentUser.avatar)}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" />`;
    }

    renderProfile();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

async function changePassword(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span>Updating...</span>';
  try {
    const res = await api.updatePassword({
      currentPassword: document.getElementById('pw-current').value,
      newPassword: document.getElementById('pw-new').value,
    });
    api.setToken(res.data.token);
    showToast('Password updated!', 'success');
    document.getElementById('pw-current').value = '';
    document.getElementById('pw-new').value = '';
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

/* Settings Page */
function renderSettings() {
  const container = document.getElementById('page-content');
  container.innerHTML = `
    <div class="settings-page">
      <h1>Settings</h1>
      
      <div class="settings-section">
        <h3>Profile</h3>
        <div class="setting-row">
          <div class="setting-info">
            <h4>Profile Details</h4>
            <p>View and manage your personal information</p>
          </div>
          <button class="btn btn-outline btn-sm" onclick="navigateTo('profile')">Go to Profile</button>
        </div>
      </div>

      <div class="settings-section">
        <h3>Security</h3>
        <div class="setting-row" style="flex-direction: column; align-items: stretch; border: none;">
          <div class="setting-info" style="margin-bottom: 16px;">
            <h4>Change Password</h4>
            <p>Ensure your account is using a secure password</p>
          </div>
          <form onsubmit="changePassword(event)" style="display: flex; flex-direction: column; gap: 16px; max-width: 400px;">
            <div class="form-group-full">
              <label>Current Password</label>
              <input type="password" id="pw-current" required placeholder="••••••••">
            </div>
            <div class="form-group-full">
              <label>New Password</label>
              <input type="password" id="pw-new" required minlength="6" placeholder="Min. 6 characters">
            </div>
            <div>
              <button type="submit" class="btn btn-primary btn-sm">Update Password</button>
            </div>
          </form>
        </div>
      </div>

      <div class="settings-section">
        <h3>Theme</h3>
        <div class="setting-row">
          <div class="setting-info">
            <h4>Dark Mode</h4>
            <p>Toggle between dark and light theme</p>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="set-dark" ${document.documentElement.dataset.theme==='dark'?'checked':''} onchange="toggleThemeFromSettings(this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="settings-section">
        <h3>Notifications</h3>
        <div class="setting-row">
          <div class="setting-info">
            <h4>Push Notifications</h4>
            <p>Receive in-app notifications</p>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" checked id="set-push">
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <h4>Email Notifications</h4>
            <p>Receive email when reports are ready</p>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="set-email">
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <h4>Report Ready Alerts</h4>
            <p>Get notified when analysis is complete</p>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" checked id="set-report">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="settings-section">
        <h3>Language</h3>
        <div class="setting-row">
          <div class="setting-info">
            <h4>Language</h4>
            <p>Currently only English is supported</p>
          </div>
          <select style="width:auto; min-width:150px;"><option>English</option></select>
        </div>
      </div>

      <div style="margin-top:24px;">
        <button class="btn btn-primary" onclick="saveSettings()">Save Settings</button>
      </div>
    </div>`;
  lucide.createIcons();
}

async function saveSettings() {
  const btn = document.querySelector('.settings-page button[onclick="saveSettings()"]');
  const originalHtml = btn ? btn.innerHTML : 'Save Settings';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>Saving...</span>';
  }
  try {
    await api.updateSettings({
      theme: document.getElementById('set-dark').checked ? 'dark' : 'light',
      notifications: {
        push: document.getElementById('set-push').checked,
        email: document.getElementById('set-email').checked,
        reportReady: document.getElementById('set-report').checked,
      }
    });
    showToast('Settings saved successfully!', 'success');
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  }
}

function toggleThemeFromSettings(isDark) {
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  localStorage.setItem('meetiq_theme', isDark ? 'dark' : 'light');
  updateThemeIcon();
}

/* About Page */
function renderAbout() {
  document.getElementById('page-content').innerHTML = `
    <div class="about-page">
      <h1>About MeetIQ</h1>
      <div class="about-card"><h3>🎯 Our Mission</h3><p>MeetIQ transforms meetings into actionable intelligence. We use cutting-edge AI to automatically transcribe, analyze, and summarize your meetings so you can focus on what matters most.</p></div>
      <div class="about-card"><h3>✨ Key Features</h3><p>• AI-powered transcription with speaker identification<br>• Smart summaries with action items and key decisions<br>• Professional PDF report generation<br>• AI chat for meeting Q&A<br>• Real-time processing with live progress updates<br>• Dark and light theme support</p></div>
      <div class="about-card"><h3>🛠️ Technology Stack</h3>
        <div class="tech-stack-grid">
          <div class="tech-item">Node.js</div><div class="tech-item">Express.js</div><div class="tech-item">MongoDB</div>
          <div class="tech-item">Vanilla JS</div><div class="tech-item">FFmpeg</div><div class="tech-item">Whisper AI</div>
          <div class="tech-item">Hugging Face</div><div class="tech-item">PDFKit</div><div class="tech-item">Chart.js</div>
          <div class="tech-item">GSAP</div><div class="tech-item">Lucide Icons</div><div class="tech-item">JWT Auth</div>
        </div>
      </div>
      <div class="about-card"><h3>👨‍💻 Developer</h3><p>Built with ❤️ by the MeetIQ team. Powered by open-source AI models.</p></div>
      <div class="about-card"><h3>📌 Version</h3><p>MeetIQ v1.0.0<br>Released: 2024</p></div>
    </div>`;
}
