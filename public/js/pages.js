/**
 * MeetIQ Pages - Dashboard & Upload
 */

let allDashboardMeetings = [];

function renderDashboard() {
  const container = document.getElementById('page-content');
  container.innerHTML = `
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <p>Welcome back, ${currentUser?.name || 'User'}! Here's your meeting overview.</p>
    </div>
    <div class="stats-grid" id="stats-grid">
      <div class="stat-card"><div class="stat-icon purple">📊</div><div class="stat-value" id="s-total">0</div><div class="stat-label">Total Meetings</div></div>
      <div class="stat-card"><div class="stat-icon green">✅</div><div class="stat-value" id="s-done">0</div><div class="stat-label">Completed Meetings</div></div>
    </div>
    <div class="dashboard-grid">
      <div class="dashboard-section">
        <div class="section-title"><h3>Recent Meetings</h3><a href="#" onclick="navigateTo('history')">View All</a></div>
        <div id="recent-meetings"><div class="empty-state"><p>Loading...</p></div></div>
      </div>
      <div class="dashboard-section">
        <div class="section-title"><h3>Quick Actions</h3></div>
        <div style="padding:24px;display:flex;flex-direction:column;gap:12px;">
          <button class="btn btn-primary btn-full" onclick="navigateTo('upload')"><i data-lucide="upload-cloud"></i> Upload Meeting</button>
          <button class="btn btn-outline btn-full" onclick="navigateTo('history')"><i data-lucide="history"></i> Meeting History</button>
          <button class="btn btn-ghost btn-full" onclick="navigateTo('settings')"><i data-lucide="settings"></i> Settings</button>
        </div>
        <div class="section-title" style="border-top:1px solid var(--border-color)"><h3>Recent Reports</h3></div>
        <div id="recent-reports"><div class="empty-state"><p>No reports yet</p></div></div>
      </div>
    </div>`;
  lucide.createIcons();
  loadDashboardData();
}

async function loadDashboardData() {
  try {
    const res = await api.getDashboard();
    const s = res.data.stats;
    document.getElementById('s-total').textContent = s.totalMeetings;
    document.getElementById('s-done').textContent = s.completedMeetings;

    allDashboardMeetings = res.data.recentMeetings || [];
    filterAndRenderDashboard();
  } catch (e) {
    console.error('Dashboard load error:', e);
  }
}

function filterAndRenderDashboard() {
  const globalSearchInput = document.getElementById('global-search');
  const query = (globalSearchInput?.value || '').trim();

  const list = document.getElementById('recent-meetings');
  if (!list) return;

  const filteredMeetings = allDashboardMeetings.filter(m => {
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

  if (!filteredMeetings.length) {
    list.innerHTML = '<div class="empty-state"><p>No meetings found</p></div>';
    return;
  }

  list.innerHTML = filteredMeetings.map(m => `
    <div class="recent-meeting-item" onclick="handleMeetingClick('${m._id}','${m.status}')">
      <div class="meeting-item-icon ${m.fileType||'video'}"><i data-lucide="${m.fileType==='audio'?'music':'video'}"></i></div>
      <div class="meeting-item-info"><h4>${esc(m.title)}</h4><p>${timeAgo(m.createdAt)} · ${formatDur(m.duration)}</p></div>
      <span class="meeting-item-status status-${m.status}">${m.status}</span>
    </div>`).join('');

  // Filter completed reports
  const completed = filteredMeetings.filter(m => m.status === 'completed');
  const rr = document.getElementById('recent-reports');
  if (rr) {
    if (completed.length) {
      rr.innerHTML = completed.slice(0, 3).map(m => `
        <div class="recent-meeting-item" onclick="navigateTo('report','${m._id}')">
          <div class="meeting-item-icon video"><i data-lucide="file-text"></i></div>
          <div class="meeting-item-info"><h4>${esc(m.title)}</h4><p>${timeAgo(m.createdAt)}</p></div>
          <div class="meeting-item-actions">
            <button onclick="event.stopPropagation();navigateTo('report','${m._id}')" title="View"><i data-lucide="eye"></i></button>
            <button onclick="event.stopPropagation();downloadPDF('${m._id}')" title="PDF"><i data-lucide="download"></i></button>
          </div>
        </div>`).join('');
    } else {
      rr.innerHTML = '<div class="empty-state"><p>No reports found</p></div>';
    }
  }
  lucide.createIcons();
}

function handleMeetingClick(id, status) {
  if (status === 'completed') navigateTo('report', id);
  else if (status === 'uploaded') navigateTo('upload', id);
  else if (['processing','extracting_audio','transcribing','diarizing','analyzing','summarizing','generating_report'].includes(status)) navigateTo('processing', id);
  else navigateTo('report', id);
}

/* ============================================
   Upload Page
   ============================================ */
let selectedFile = null;
let uploadXhr = null;

function renderUpload(meetingId) {
  selectedFile = null;
  const container = document.getElementById('page-content');
  container.innerHTML = `
    <div class="upload-page-header">
      <h1>Upload Meeting</h1>
      <p>Drag & drop or browse to upload your meeting recording</p>
    </div>
    <div class="upload-zone" id="upload-zone">
      <div class="upload-icon"><i data-lucide="upload-cloud"></i></div>
      <h3>Drop your file here</h3>
      <p>or click to browse</p>
      <div class="formats">
        <span class="format-tag">mp4</span><span class="format-tag">mov</span><span class="format-tag">avi</span>
        <span class="format-tag">wav</span><span class="format-tag">mp3</span><span class="format-tag">m4a</span>
      </div>
      <input type="file" id="file-input" accept=".mp4,.mov,.avi,.wav,.mp3,.m4a,.webm" onchange="handleFileSelect(this)">
    </div>
    <div id="upload-preview-area" class="hidden"></div>
    <div class="upload-title-input hidden" id="title-input-area">
      <input type="text" id="meeting-title" placeholder="Meeting title (optional)">
    </div>
    <div class="upload-actions hidden" id="upload-actions">
      <button class="btn btn-outline" onclick="cancelUpload()"><i data-lucide="x"></i> Cancel</button>
      <button class="btn btn-primary" id="analyze-btn" onclick="startUploadAndAnalyze()"><i data-lucide="zap"></i> Analyze with AI</button>
    </div>`;
  lucide.createIcons();
  setupDragDrop();

  if (meetingId) {
    // If meeting already uploaded, go to analyze
    startAnalysis(meetingId);
  }
}

function setupDragDrop() {
  const zone = document.getElementById('upload-zone');
  if (!zone) return;
  ['dragenter','dragover'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.add('drag-over'); }));
  ['dragleave','drop'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.remove('drag-over'); }));
  zone.addEventListener('drop', e => {
    const files = e.dataTransfer.files;
    if (files.length) handleFile(files[0]);
  });
}

function handleFileSelect(input) {
  if (input.files.length) handleFile(input.files[0]);
}

function handleFile(file) {
  const allowed = ['video/mp4','video/quicktime','video/x-msvideo','audio/wav','audio/mpeg','audio/mp4','audio/x-m4a','video/webm','audio/webm'];
  if (!allowed.includes(file.type)) { showToast('Unsupported file type', 'error'); return; }
  if (file.size > 500 * 1024 * 1024) { showToast('File too large (max 500MB)', 'error'); return; }
  selectedFile = file;
  showFilePreview(file);
}

function showFilePreview(file) {
  const isVideo = file.type.startsWith('video/');
  const area = document.getElementById('upload-preview-area');
  area.classList.remove('hidden');
  area.innerHTML = `
    <div class="upload-preview">
      <div class="preview-file">
        <div class="preview-thumb" id="preview-thumb"><i data-lucide="${isVideo?'video':'music'}"></i></div>
        <div class="preview-info">
          <h4>${esc(file.name)}</h4>
          <div class="preview-meta">
            <span>${isVideo?'Video':'Audio'}</span>
            <span>${formatSize(file.size)}</span>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="removeFile()"><i data-lucide="trash-2"></i></button>
      </div>
      <div class="upload-progress hidden" id="upload-progress">
        <div class="progress-bar"><div class="progress-bar-fill" id="progress-fill"></div></div>
        <div class="progress-text"><span id="progress-label">Uploading...</span><span id="progress-pct">0%</span></div>
      </div>
    </div>`;
  document.getElementById('title-input-area').classList.remove('hidden');
  document.getElementById('upload-actions').classList.remove('hidden');

  // Video preview
  if (isVideo) {
    const thumb = document.getElementById('preview-thumb');
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.currentTime = 1;
    video.onloadeddata = () => { thumb.innerHTML = ''; thumb.appendChild(video); };
  }
  lucide.createIcons();
}

function removeFile() {
  selectedFile = null;
  document.getElementById('upload-preview-area').classList.add('hidden');
  document.getElementById('title-input-area').classList.add('hidden');
  document.getElementById('upload-actions').classList.add('hidden');
  document.getElementById('file-input').value = '';
}

function cancelUpload() {
  if (uploadXhr) { uploadXhr.abort(); uploadXhr = null; }
  removeFile();
}

async function startUploadAndAnalyze() {
  if (!selectedFile) { showToast('Please select a file', 'error'); return; }
  const btn = document.getElementById('analyze-btn');
  btn.disabled = true;
  btn.innerHTML = '<span>Uploading...</span>';

  const progress = document.getElementById('upload-progress');
  progress.classList.remove('hidden');

  try {
    const title = document.getElementById('meeting-title').value.trim();
    const res = await api.uploadFile(selectedFile, title, (pct) => {
      document.getElementById('progress-fill').style.width = pct + '%';
      document.getElementById('progress-pct').textContent = pct + '%';
    });

    showToast('Upload complete! Starting analysis...', 'success');
    const meetingId = res.data.meeting._id;
    startAnalysis(meetingId);
  } catch (error) {
    showToast(error.message, 'error');
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="zap"></i> Analyze with AI';
    lucide.createIcons();
  }
}

async function startAnalysis(meetingId) {
  try {
    await api.analyzeMeeting(meetingId);
    navigateTo('processing', meetingId);
  } catch (e) {
    showToast(e.message || 'Failed to start analysis', 'error');
  }
}
