/**
 * MeetIQ - Main Application Controller
 * Handles routing, theme, notifications, utility functions
 */

let currentPage = 'dashboard';

/* ============================================
   Initialization
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Loading screen
  setTimeout(() => {
    document.getElementById('loading-screen').style.opacity = '0';
    setTimeout(() => {
      document.getElementById('loading-screen').classList.add('hidden');
      initApp();
    }, 500);
  }, 1800);
});

function initApp() {
  // Load theme
  const savedTheme = localStorage.getItem('meetiq_theme') || 'dark';
  document.documentElement.dataset.theme = savedTheme;
  updateThemeIcon();

  // Setup event listeners
  setupSidebar();
  setupThemeToggle();
  setupNotifications();
  setupGlobalSearch();

  // ESC key handler for closing modals, notification panels, and filter popups
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const panel = document.getElementById('notification-panel');
      if (panel && !panel.classList.contains('hidden')) {
        panel.classList.add('hidden');
      }
      const filterContainer = document.getElementById('filter-popup-container');
      if (filterContainer && filterContainer.innerHTML !== '') {
        if (typeof closeFilter === 'function') closeFilter();
      }
    }
  });

  // Check auth
  if (isAuthenticated()) {
    showApp();
    navigateTo('dashboard');
    loadNotifications();
  } else {
    showLanding();
  }
  lucide.createIcons();
}

/* ============================================
   Routing
   ============================================ */
function navigateTo(page, param) {
  currentPage = page;
  // Update active nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('mobile-open');

  // Render page
  switch (page) {
    case 'dashboard': renderDashboard(); break;
    case 'upload': renderUpload(param); break;
    case 'history': renderHistory(); break;
    case 'processing': renderProcessing(param); break;
    case 'report': renderReport(param); break;
    case 'profile': renderProfile(); break;
    case 'settings': renderSettings(); break;
    case 'about': renderAbout(); break;
    default: renderDashboard();
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Re-init icons
  setTimeout(() => lucide.createIcons(), 100);
}

/* ============================================
   Sidebar
   ============================================ */
function setupSidebar() {
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const mobileBtn = document.getElementById('mobile-menu-btn');

  if (toggle) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  }

  if (mobileBtn) {
    mobileBtn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });
  }

  // Close mobile sidebar on outside click
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && sidebar.classList.contains('mobile-open')) {
      if (!sidebar.contains(e.target) && e.target !== mobileBtn && !mobileBtn.contains(e.target)) {
        sidebar.classList.remove('mobile-open');
      }
    }
  });
}

/* ============================================
   Theme
   ============================================ */
function setupThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.addEventListener('click', toggleTheme);
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme;
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('meetiq_theme', next);
  updateThemeIcon();
  // Sync settings toggle if visible
  const setDark = document.getElementById('set-dark');
  if (setDark) setDark.checked = next === 'dark';
}

function updateThemeIcon() {
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.setAttribute('data-lucide', document.documentElement.dataset.theme === 'dark' ? 'moon' : 'sun');
    lucide.createIcons();
  }
}

/* ============================================
   Notifications
   ============================================ */
function setupNotifications() {
  const btn = document.getElementById('notification-btn');
  const panel = document.getElementById('notification-panel');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.classList.toggle('hidden');
      if (!panel.classList.contains('hidden')) loadNotifications();
    });
  }
  document.addEventListener('click', (e) => {
    if (panel && !panel.contains(e.target) && e.target !== btn && !btn?.contains(e.target)) {
      panel.classList.add('hidden');
    }
  });
}

async function loadNotifications() {
  try {
    const res = await api.getNotifications();
    const notifs = res.data.notifications || [];
    const unread = res.data.unreadCount || 0;
    const badge = document.getElementById('notification-badge');
    if (unread > 0) { badge.textContent = unread; badge.classList.remove('hidden'); }
    else { badge.classList.add('hidden'); }

    const list = document.getElementById('notification-list');
    if (!notifs.length) { list.innerHTML = '<div class="notif-empty">No notifications yet</div>'; return; }

    const iconMap = { report_ready: 'success', pdf_downloaded: 'download', meeting_uploaded: 'info', analysis_complete: 'success', error: 'error', info: 'info' };
    list.innerHTML = notifs.map(n => `
      <div class="notif-item ${n.read?'':'unread'}" onclick="markNotifRead('${n._id}')">
        <div class="notif-icon ${iconMap[n.type]||'info'}"><i data-lucide="${n.icon||'bell'}"></i></div>
        <div class="notif-text"><h4>${esc(n.title)}</h4><p>${esc(n.message)}</p><span class="notif-time">${timeAgo(n.createdAt)}</span></div>
      </div>`).join('');
    lucide.createIcons();
  } catch {}
}

async function markNotifRead(id) {
  try { await api.markNotificationRead(id); loadNotifications(); } catch {}
}

async function markAllNotificationsRead() {
  try { await api.markAllRead(); loadNotifications(); showToast('All marked as read', 'info'); } catch {}
}

function setupGlobalSearch() {
  const input = document.getElementById('global-search');
  const clearBtn = document.getElementById('search-clear-btn');
  if (input) {
    input.addEventListener('input', () => {
      if (input.value) {
        clearBtn?.classList.remove('hidden');
      } else {
        clearBtn?.classList.add('hidden');
      }

      if (currentPage === 'dashboard') {
        if (typeof filterAndRenderDashboard === 'function') {
          filterAndRenderDashboard();
        }
      } else if (currentPage === 'history') {
        const histSearch = document.getElementById('history-search');
        if (histSearch) { histSearch.value = input.value; }
        if (typeof filterAndRenderHistory === 'function') {
          filterAndRenderHistory();
        }
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        input.value = '';
        clearBtn?.classList.add('hidden');
        if (currentPage === 'dashboard') {
          if (typeof filterAndRenderDashboard === 'function') {
            filterAndRenderDashboard();
          }
        } else if (currentPage === 'history') {
          const histSearch = document.getElementById('history-search');
          if (histSearch) { histSearch.value = ''; }
          if (typeof filterAndRenderHistory === 'function') {
            filterAndRenderHistory();
          }
        }
      }
    });

    clearBtn?.addEventListener('click', () => {
      input.value = '';
      clearBtn.classList.add('hidden');
      input.focus();
      if (currentPage === 'dashboard') {
        if (typeof filterAndRenderDashboard === 'function') {
          filterAndRenderDashboard();
        }
      } else if (currentPage === 'history') {
        const histSearch = document.getElementById('history-search');
        if (histSearch) { histSearch.value = ''; }
        if (typeof filterAndRenderHistory === 'function') {
          filterAndRenderHistory();
        }
      }
    });
  }
}

/* ============================================
   PDF Download
   ============================================ */
function downloadPDF(meetingId) {
  const token = api.getToken();
  // Create a temporary link with auth header via fetch
  fetch(`/api/meetings/${meetingId}/pdf`, {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(res => {
    if (!res.ok) throw new Error('PDF not available');
    return res.blob();
  }).then(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MeetIQ_Report.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('PDF downloaded!', 'success');
  }).catch(e => showToast(e.message, 'error'));
}

/* ============================================
   FAQ Toggle (Landing Page)
   ============================================ */
function toggleFaq(el) {
  el.classList.toggle('open');
}

/* ============================================
   Utility Functions
   ============================================ */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const icons = { success: 'check-circle', error: 'alert-circle', info: 'info' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i data-lucide="${icons[type]||'info'}" class="toast-icon"></i><span class="toast-message">${message}</span><button class="toast-close" onclick="this.parentElement.remove()"><i data-lucide="x"></i></button>`;
  container.appendChild(toast);
  lucide.createIcons();
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 4000);
}

function esc(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function formatDur(seconds) {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatSize(bytes) {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
}

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  return d.toLocaleDateString();
}

// Periodically refresh notifications
setInterval(() => {
  if (isAuthenticated()) loadNotifications();
}, 30000);
