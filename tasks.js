/**
 * Daily Target - Tasks Module
 * Task rendering, filtering, search, and modal operations.
 */

let currentViewDate = getTodayKey();
let currentFilter = 'all';
let currentCategoryFilter = 'all';
let currentSearch = '';
let editingTaskId = null;
let deleteTaskId = null;

/**
 * Sort tasks by time then title
 */
function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time) return -1;
    if (b.time) return 1;
    return a.title.localeCompare(b.title);
  });
}

/**
 * Format time for display (24h to 12h)
 */
function formatTimeDisplay(time) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * Get priority class
 */
function getPriorityClass(priority) {
  const map = { Low: 'priority-low', Medium: 'priority-medium', High: 'priority-high' };
  return map[priority] || 'priority-medium';
}

/**
 * Render a single task item
 */
function renderTaskItem(task, options = {}) {
  const { compact = false } = options;
  const timeStr = task.time ? formatTimeDisplay(task.time) : '';
  const meta = [timeStr, task.category, task.priority].filter(Boolean).join(' · ');
  const completedClass = task.completed ? 'task-completed' : '';
  const priorityClass = getPriorityClass(task.priority);

  if (compact) {
    return `
      <div class="task-item task-compact ${completedClass}" data-id="${task.id}">
        <label class="task-checkbox-label">
          <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${task.completed ? 'checked' : ''} aria-label="Mark ${escapeHtml(task.title)} as ${task.completed ? 'incomplete' : 'complete'}">
          <span class="checkbox-custom"></span>
        </label>
        <div class="task-content">
          <span class="task-title">${escapeHtml(task.title)}</span>
          ${meta ? `<span class="task-meta">${escapeHtml(meta)}</span>` : ''}
        </div>
        <span class="priority-dot ${priorityClass}" title="${escapeHtml(task.priority)} priority" aria-hidden="true"></span>
      </div>
    `;
  }

  return `
    <article class="task-item ${completedClass}" data-id="${task.id}">
      <label class="task-checkbox-label">
        <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${task.completed ? 'checked' : ''} aria-label="Mark ${escapeHtml(task.title)} as ${task.completed ? 'incomplete' : 'complete'}">
        <span class="checkbox-custom"></span>
      </label>
      <div class="task-content">
        <h3 class="task-title">${escapeHtml(task.title)}</h3>
        ${meta ? `<p class="task-meta"><span class="task-time">${escapeHtml(timeStr)}</span> · <span class="task-category">${escapeHtml(task.category)}</span> · <span class="task-priority ${priorityClass}">${escapeHtml(task.priority)}</span></p>` : ''}
        ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
      </div>
      <div class="task-actions">
        <button type="button" class="btn-icon btn-edit" data-id="${task.id}" aria-label="Edit ${escapeHtml(task.title)}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button type="button" class="btn-icon btn-delete" data-id="${task.id}" aria-label="Delete ${escapeHtml(task.title)}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </article>
  `;
}

/**
 * Filter tasks based on current filters
 */
function filterTasks(tasks) {
  let filtered = [...tasks];

  if (currentFilter === 'pending') {
    filtered = filtered.filter(t => !t.completed);
  } else if (currentFilter === 'completed') {
    filtered = filtered.filter(t => t.completed);
  }

  if (currentCategoryFilter !== 'all') {
    filtered = filtered.filter(t => t.category === currentCategoryFilter);
  }

  if (currentSearch.trim()) {
    const query = currentSearch.toLowerCase();
    filtered = filtered.filter(t =>
      t.title.toLowerCase().includes(query) ||
      (t.description && t.description.toLowerCase().includes(query))
    );
  }

  return sortTasks(filtered);
}

/**
 * Render task list for current view date
 */
function buildTaskListHTML(allTasks, tasks) {
  if (tasks.length === 0) {
    const hasFilters = currentFilter !== 'all' || currentCategoryFilter !== 'all' || currentSearch.trim();
    if (allTasks.length > 0 && hasFilters) {
      return `
        <div class="empty-state">
          <span class="empty-icon" aria-hidden="true">🔍</span>
          <h3>No matching targets</h3>
          <p>Try adjusting your filters or search query.</p>
        </div>
      `;
    }
    return `
      <div class="empty-state">
        <span class="empty-icon" aria-hidden="true">🎯</span>
        <h3>No targets for this day</h3>
        <p>Add your first target and make today productive.</p>
        <button type="button" class="btn btn-primary" data-action="add-target">
          + Add Target
        </button>
      </div>
    `;
  }
  return tasks.map(task => renderTaskItem(task)).join('');
}

function renderTaskList() {
  const containers = ['task-list', 'today-task-list'];
  const allTasks = getTasksByDate(currentViewDate);
  const tasks = filterTasks(allTasks);
  const html = buildTaskListHTML(allTasks, tasks);

  containers.forEach(id => {
    const container = document.getElementById(id);
    if (container) container.innerHTML = html;
  });
}

/**
 * Set view date and refresh
 */
function setViewDate(dateKey) {
  currentViewDate = dateKey;
  updateDateDisplays();
  renderTaskList();
  updateStatCards(currentViewDate);
  renderStatisticsPage();
}

/**
 * Update date display elements
 */
function updateDateDisplays() {
  const date = new Date(currentViewDate + 'T12:00:00');
  const formatted = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const headerDate = document.getElementById('header-date');
  if (headerDate) headerDate.textContent = formatted;

  const todayDateLabel = document.getElementById('today-date-label');
  if (todayDateLabel) todayDateLabel.textContent = formatted;

  const isToday = currentViewDate === getTodayKey();
  const todaySectionTitle = document.getElementById('tasks-section-title');
  if (todaySectionTitle) {
    todaySectionTitle.textContent = isToday ? "Today's Targets" : 'Targets';
  }
}

/**
 * Open task modal for add or edit
 */
function openTaskModal(taskId = null, presetDate = null) {
  const modal = document.getElementById('task-modal');
  const form = document.getElementById('task-form');
  const title = document.getElementById('modal-title');
  const submitBtn = document.getElementById('task-submit-btn');
  if (!modal || !form) return;

  editingTaskId = taskId;
  form.reset();

  const settings = loadSettings();

  if (taskId) {
    const task = getTaskById(taskId);
    if (!task) return;

    title.textContent = 'Edit Target';
    submitBtn.textContent = 'Save Changes';
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-date').value = task.date;
    document.getElementById('task-time').value = task.time || '';
    document.getElementById('task-category').value = task.category;
    document.getElementById('task-priority').value = task.priority;
  } else {
    title.textContent = 'Add Target';
    submitBtn.textContent = 'Add Target';
    document.getElementById('task-date').value = presetDate || currentViewDate;
    document.getElementById('task-category').value = settings.defaultCategory;
    document.getElementById('task-priority').value = settings.defaultPriority;
  }

  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.getElementById('task-title').focus();
  document.body.classList.add('modal-open');
}

/**
 * Close task modal
 */
function closeTaskModal() {
  const modal = document.getElementById('task-modal');
  if (!modal) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  editingTaskId = null;
  document.body.classList.remove('modal-open');
}

/**
 * Handle task form submission
 */
function handleTaskSubmit(e) {
  e.preventDefault();

  const titleInput = document.getElementById('task-title');
  const title = titleInput.value.trim();

  if (!title) {
    titleInput.focus();
    titleInput.classList.add('input-error');
    showToast('Task title is required', 'error');
    return;
  }
  titleInput.classList.remove('input-error');

  const taskData = {
    title,
    description: document.getElementById('task-description').value,
    date: document.getElementById('task-date').value,
    time: document.getElementById('task-time').value,
    category: document.getElementById('task-category').value,
    priority: document.getElementById('task-priority').value
  };

  if (!taskData.date) {
    showToast('Please select a valid date', 'error');
    return;
  }

  if (editingTaskId) {
    updateTask(editingTaskId, taskData);
    showToast('Target updated successfully');
  } else {
    addTask(taskData);
    showToast('Target added successfully');
  }

  closeTaskModal();
  refreshUI();
}

/**
 * Open delete confirmation modal
 */
function openDeleteModal(taskId) {
  deleteTaskId = taskId;
  const modal = document.getElementById('delete-modal');
  if (!modal) return;
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

/**
 * Close delete confirmation modal
 */
function closeDeleteModal() {
  deleteTaskId = null;
  const modal = document.getElementById('delete-modal');
  if (!modal) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

/**
 * Confirm task deletion
 */
function confirmDelete() {
  if (!deleteTaskId) return;
  deleteTask(deleteTaskId);
  closeDeleteModal();
  showToast('Target deleted');
  refreshUI();
}

/**
 * Handle task checkbox toggle
 */
function handleTaskToggle(taskId) {
  const task = toggleTask(taskId);
  if (!task) return;

  if (task.completed) {
    showToast('Target completed 🎉');
    const stats = getDateStats(task.date);
    if (stats.rate === 100 && stats.total > 0) {
      setTimeout(() => showToast('Day completed! All targets done 🎉', 'success'), 600);
    }
  }

  refreshUI();
}

/**
 * Refresh all UI components
 */
function refreshUI() {
  renderTaskList();
  updateStatCards(currentViewDate);
  renderStatisticsPage();
  renderCalendar();
  renderUpcomingTargets();
}

/**
 * Render upcoming targets (next few days)
 */
function renderUpcomingTargets() {
  const container = document.getElementById('upcoming-targets');
  if (!container) return;

  const today = getTodayKey();
  const upcoming = [];

  for (let i = 1; i <= 7; i++) {
    const dateKey = getDateKeyOffset(today, i);
    const tasks = getTasksByDate(dateKey).filter(t => !t.completed);
    if (tasks.length > 0) {
      const date = new Date(dateKey + 'T12:00:00');
      upcoming.push({
        dateKey,
        label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        tasks: sortTasks(tasks).slice(0, 3),
        total: tasks.length
      });
    }
  }

  if (upcoming.length === 0) {
    container.innerHTML = `
      <div class="upcoming-empty">
        <p>No upcoming targets. Plan ahead!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = upcoming.map(day => `
    <div class="upcoming-day">
      <div class="upcoming-day-header">
        <span class="upcoming-date">${escapeHtml(day.label)}</span>
        <span class="upcoming-count">${day.total} target${day.total !== 1 ? 's' : ''}</span>
      </div>
      <ul class="upcoming-list">
        ${day.tasks.map(t => `
          <li class="upcoming-item">
            <span class="priority-dot ${getPriorityClass(t.priority)}" aria-hidden="true"></span>
            ${escapeHtml(t.title)}
            ${t.time ? `<span class="upcoming-time">${escapeHtml(formatTimeDisplay(t.time))}</span>` : ''}
          </li>
        `).join('')}
        ${day.total > 3 ? `<li class="upcoming-more">+${day.total - 3} more</li>` : ''}
      </ul>
    </div>
  `).join('');
}

/**
 * Initialize task event listeners
 */
function initTaskEvents() {
  // Task list delegation
  document.addEventListener('click', (e) => {
    const addBtn = e.target.closest('[data-action="add-target"]');
    if (addBtn) {
      const presetDate = addBtn.dataset.date || null;
      openTaskModal(null, presetDate);
      return;
    }

    const editBtn = e.target.closest('.btn-edit');
    if (editBtn) {
      openTaskModal(editBtn.dataset.id);
      return;
    }

    const deleteBtn = e.target.closest('.btn-delete');
    if (deleteBtn) {
      openDeleteModal(deleteBtn.dataset.id);
      return;
    }
  });

  // Checkbox delegation
  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('task-checkbox')) {
      handleTaskToggle(e.target.dataset.id);
    }
  });

  // Task form
  const form = document.getElementById('task-form');
  if (form) form.addEventListener('submit', handleTaskSubmit);

  // Modal close buttons
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeTaskModal();
      closeDeleteModal();
      closeConfirmModal();
    });
  });

  // Delete confirm
  const deleteConfirm = document.getElementById('delete-confirm-btn');
  if (deleteConfirm) deleteConfirm.addEventListener('click', confirmDelete);

  // Filter buttons
  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderTaskList();
    });
  });

  // Category filter
  const categorySelect = document.getElementById('category-filter');
  if (categorySelect) {
    categorySelect.addEventListener('change', () => {
      currentCategoryFilter = categorySelect.value;
      renderTaskList();
    });
  }

  // Search
  const searchInput = document.getElementById('task-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      currentSearch = searchInput.value;
      renderTaskList();
    });
  }

  // Close modal on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeTaskModal();
        closeDeleteModal();
        closeConfirmModal();
      }
    });
  });

  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeTaskModal();
      closeDeleteModal();
      closeConfirmModal();
    }
  });
}

/**
 * Callback when date is selected from calendar
 */
function onDateSelected(dateKey) {
  setViewDate(dateKey);
  navigateToPage('today');
}
