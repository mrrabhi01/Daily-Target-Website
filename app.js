/**
 * Daily Target - Main Application
 * Initialization, navigation, theme, toasts, and settings.
 */

let currentPage = 'dashboard';

/**
 * Initialize the application
 */
function initApp() {
  loadTheme();
  getAllTasks(); // ensures demo data if first launch
  initNavigation();
  initTaskEvents();
  initCalendarEvents();
  initSettings();
  initThemeToggle();
  initQuickAdd();

  setViewDate(getTodayKey());
  updateGreeting();
  renderCalendar();
  renderStatisticsPage();
  renderUpcomingTargets();
  navigateToPage('dashboard');
}

/**
 * Get time-based greeting
 */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/**
 * Update greeting text
 */
function updateGreeting() {
  const settings = loadSettings();
  const greetingEl = document.getElementById('greeting-text');
  if (greetingEl) {
    greetingEl.textContent = `${getGreeting()}, ${settings.userName} 👋`;
  }
}

/**
 * Navigate to a page/section
 */
function navigateToPage(page) {
  currentPage = page;

  // Update nav links
  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
    const isActive = link.dataset.page === page;
    link.classList.toggle('active', isActive);
    link.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  // Show/hide page sections
  document.querySelectorAll('.page-section').forEach(section => {
    section.classList.toggle('active', section.dataset.page === page);
  });

  // Page-specific refresh
  if (page === 'calendar') renderCalendar();
  if (page === 'statistics') renderStatisticsPage();
  if (page === 'today') {
    renderTaskList();
    updateStatCards(currentViewDate);
  }
  if (page === 'dashboard') {
    setViewDate(getTodayKey());
    renderUpcomingTargets();
  }
}

/**
 * Initialize navigation
 */
function initNavigation() {
  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToPage(link.dataset.page);
    });
  });
}

/**
 * Initialize quick add floating button
 */
function initQuickAdd() {
  const fab = document.getElementById('fab-add');
  if (fab) {
    fab.addEventListener('click', () => openTaskModal());
  }

  document.querySelectorAll('[data-page-link]').forEach(link => {
    link.addEventListener('click', () => navigateToPage(link.dataset.pageLink));
  });

  const notifBtn = document.getElementById('notification-btn');
  if (notifBtn) {
    notifBtn.addEventListener('click', () => {
      const pending = getTasksByDate(getTodayKey()).filter(t => !t.completed).length;
      if (pending > 0) {
        showToast(`You have ${pending} pending target${pending !== 1 ? 's' : ''} today`);
      } else {
        showToast('All targets completed for today! 🎉');
      }
    });
  }
}

/* ===== THEME SYSTEM ===== */

function loadTheme() {
  const settings = loadSettings();
  applyTheme(settings.theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
}

function toggleTheme() {
  const settings = loadSettings();
  const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
  settings.theme = newTheme;
  saveSettings(settings);
  applyTheme(newTheme);

  // Sync settings page radio
  const darkRadio = document.getElementById('theme-dark');
  const lightRadio = document.getElementById('theme-light');
  if (darkRadio && lightRadio) {
    darkRadio.checked = newTheme === 'dark';
    lightRadio.checked = newTheme === 'light';
  }

  showToast(`Switched to ${newTheme} mode`);
}

function initThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  if (toggle) toggle.addEventListener('click', toggleTheme);
}

/* ===== TOAST NOTIFICATIONS ===== */

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${type === 'error' ? '✕' : type === 'success' ? '✓' : 'ℹ'}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ===== SETTINGS ===== */

function initSettings() {
  const settings = loadSettings();

  // Theme radios
  const darkRadio = document.getElementById('theme-dark');
  const lightRadio = document.getElementById('theme-light');
  if (darkRadio) darkRadio.checked = settings.theme === 'dark';
  if (lightRadio) lightRadio.checked = settings.theme === 'light';

  if (darkRadio) {
    darkRadio.addEventListener('change', () => {
      if (darkRadio.checked) {
        settings.theme = 'dark';
        saveSettings(settings);
        applyTheme('dark');
        showToast('Settings saved');
      }
    });
  }
  if (lightRadio) {
    lightRadio.addEventListener('change', () => {
      if (lightRadio.checked) {
        settings.theme = 'light';
        saveSettings(settings);
        applyTheme('light');
        showToast('Settings saved');
      }
    });
  }

  // Default category
  const defaultCategory = document.getElementById('default-category');
  if (defaultCategory) {
    defaultCategory.value = settings.defaultCategory;
    defaultCategory.addEventListener('change', () => {
      settings.defaultCategory = defaultCategory.value;
      saveSettings(settings);
      showToast('Settings saved');
    });
  }

  // Default priority
  const defaultPriority = document.getElementById('default-priority');
  if (defaultPriority) {
    defaultPriority.value = settings.defaultPriority;
    defaultPriority.addEventListener('change', () => {
      settings.defaultPriority = defaultPriority.value;
      saveSettings(settings);
      showToast('Settings saved');
    });
  }

  // Export
  const exportBtn = document.getElementById('export-data-btn');
  if (exportBtn) exportBtn.addEventListener('click', exportData);

  // Import
  const importInput = document.getElementById('import-data-input');
  if (importInput) {
    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) importData(file);
      importInput.value = '';
    });
  }

  // Clear data
  const clearBtn = document.getElementById('clear-data-btn');
  if (clearBtn) clearBtn.addEventListener('click', () => openConfirmModal(
    'Are you sure you want to delete all targets?',
    clearAllData
  ));
}

/**
 * Export tasks as JSON file
 */
function exportData() {
  const tasks = getAllTasks();
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'daily-target-backup.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Data exported successfully');
}

/**
 * Import tasks from JSON file
 */
function importData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      let tasksArray;

      if (Array.isArray(data)) {
        tasksArray = data;
      } else if (data && Array.isArray(data.tasks)) {
        tasksArray = data.tasks;
      } else {
        throw new Error('Invalid format');
      }

      const valid = tasksArray.every(isValidTask);
      if (!valid && tasksArray.length > 0) {
        // Try to salvage valid tasks
        const filtered = tasksArray.filter(isValidTask);
        if (filtered.length === 0) throw new Error('No valid tasks');
        importTasks(filtered);
        showToast(`Imported ${filtered.length} targets`);
      } else {
        importTasks(tasksArray);
        showToast(`Imported ${tasksArray.length} targets`);
      }

      refreshUI();
      navigateToPage('dashboard');
    } catch {
      showToast('Invalid JSON file. Import failed.', 'error');
    }
  };
  reader.readAsText(file);
}

/**
 * Clear all data
 */
function clearAllData() {
  clearAllTasks();
  closeConfirmModal();
  showToast('All data cleared');
  setViewDate(getTodayKey());
  refreshUI();
  navigateToPage('dashboard');
}

/* ===== CONFIRM MODAL ===== */

let confirmCallback = null;

function openConfirmModal(message, callback) {
  confirmCallback = callback;
  const modal = document.getElementById('confirm-modal');
  const msgEl = document.getElementById('confirm-message');
  if (msgEl) msgEl.textContent = message;
  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }
}

function closeConfirmModal() {
  confirmCallback = null;
  const modal = document.getElementById('confirm-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }
}

function initConfirmModal() {
  const confirmBtn = document.getElementById('confirm-action-btn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      if (confirmCallback) confirmCallback();
    });
  }
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
  initConfirmModal();
  initApp();
});
