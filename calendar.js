/**
 * Daily Target - Calendar Module
 * Vanilla JS calendar with task indicators.
 */

let calendarState = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  selectedDate: getTodayKey()
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Set calendar to a specific date
 */
function setCalendarDate(dateKey) {
  const [y, m] = dateKey.split('-').map(Number);
  calendarState.year = y;
  calendarState.month = m - 1;
  calendarState.selectedDate = dateKey;
}

/**
 * Navigate calendar month
 */
function navigateCalendar(direction) {
  calendarState.month += direction;
  if (calendarState.month > 11) {
    calendarState.month = 0;
    calendarState.year++;
  } else if (calendarState.month < 0) {
    calendarState.month = 11;
    calendarState.year--;
  }
  renderCalendar();
}

/**
 * Go to today in calendar
 */
function goToToday() {
  const today = getTodayKey();
  setCalendarDate(today);
  renderCalendar();
  if (typeof onDateSelected === 'function') {
    onDateSelected(today);
  }
}

/**
 * Render the calendar grid
 */
function renderCalendar() {
  const grid = document.getElementById('calendar-grid');
  const monthLabel = document.getElementById('calendar-month-label');
  if (!grid || !monthLabel) return;

  monthLabel.textContent = `${MONTH_NAMES[calendarState.month]} ${calendarState.year}`;

  const firstDay = new Date(calendarState.year, calendarState.month, 1);
  const lastDay = new Date(calendarState.year, calendarState.month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const todayKey = getTodayKey();

  let html = '';

  // Day headers
  DAY_HEADERS.forEach(day => {
    html += `<div class="cal-header-cell" aria-hidden="true">${day}</div>`;
  });

  // Empty cells before first day
  for (let i = 0; i < startDayOfWeek; i++) {
    html += '<div class="cal-cell cal-empty" aria-hidden="true"></div>';
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = formatDateKey(new Date(calendarState.year, calendarState.month, d));
    const isToday = dateKey === todayKey;
    const isSelected = dateKey === calendarState.selectedDate;
    const indicator = getDayIndicator(dateKey);
    const taskCount = getTasksByDate(dateKey).length;

    let classes = 'cal-cell cal-day';
    if (isToday) classes += ' cal-today';
    if (isSelected) classes += ' cal-selected';
    if (indicator === 'complete') classes += ' cal-all-done';
    else if (indicator === 'partial') classes += ' cal-partial';

    const ariaLabel = `${MONTH_NAMES[calendarState.month]} ${d}, ${taskCount} target${taskCount !== 1 ? 's' : ''}`;

    html += `
      <button type="button" class="${classes}" data-date="${dateKey}" aria-label="${ariaLabel}" aria-pressed="${isSelected}">
        <span class="cal-day-num">${d}</span>
        ${indicator !== 'none' ? `<span class="cal-indicator cal-indicator-${indicator}" aria-hidden="true"></span>` : ''}
      </button>
    `;
  }

  grid.innerHTML = html;

  // Render selected date tasks preview
  renderCalendarTasksPreview(calendarState.selectedDate);
}

/**
 * Render tasks preview for selected calendar date
 */
function renderCalendarTasksPreview(dateKey) {
  const container = document.getElementById('calendar-tasks-preview');
  const dateLabel = document.getElementById('calendar-selected-date');
  if (!container) return;

  const date = new Date(dateKey + 'T12:00:00');
  const formatted = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (dateLabel) dateLabel.textContent = formatted;

  const tasks = getTasksByDate(dateKey);

  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="calendar-empty">
        <span class="empty-icon" aria-hidden="true">🎯</span>
        <p>No targets for this day</p>
        <button type="button" class="btn btn-primary btn-sm" data-action="add-target" data-date="${dateKey}">
          + Add Target
        </button>
      </div>
    `;
    return;
  }

  const sorted = sortTasks(tasks);
  container.innerHTML = sorted.map(task => renderTaskItem(task, { compact: true })).join('');
}

/**
 * Initialize calendar event listeners
 */
function initCalendarEvents() {
  const grid = document.getElementById('calendar-grid');
  if (grid) {
    grid.addEventListener('click', (e) => {
      const cell = e.target.closest('.cal-day');
      if (!cell) return;

      const dateKey = cell.dataset.date;
      calendarState.selectedDate = dateKey;
      renderCalendar();

      if (typeof onDateSelected === 'function') {
        onDateSelected(dateKey);
      }
    });
  }

  const prevBtn = document.getElementById('cal-prev');
  const nextBtn = document.getElementById('cal-next');
  const todayBtn = document.getElementById('cal-today-btn');

  if (prevBtn) prevBtn.addEventListener('click', () => navigateCalendar(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => navigateCalendar(1));
  if (todayBtn) todayBtn.addEventListener('click', goToToday);
}
