/**
 * Daily Target - Statistics Module
 * Calculates progress, streaks, and renders charts.
 */

/**
 * Streak Logic:
 * - A day counts toward the streak ONLY when it has at least one task AND all tasks are completed.
 * - Days with no tasks are neutral — they neither increment nor break the streak.
 * - A day with incomplete tasks breaks the streak when encountered while counting backwards.
 * - Current streak is calculated from today (or yesterday if today has incomplete tasks) going backwards.
 */

/**
 * Get completion stats for a specific date
 */
function getDateStats(dateKey) {
  const tasks = getTasksByDate(dateKey);
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, pending, rate, tasks };
}

/**
 * Check if a day qualifies for streak (has tasks and all completed)
 */
function isStreakDay(dateKey) {
  const tasks = getTasksByDate(dateKey);
  if (tasks.length === 0) return null; // neutral
  return tasks.every(t => t.completed);
}

/**
 * Get date key for N days before a given date
 */
function getDateKeyOffset(baseDateKey, offsetDays) {
  const [y, m, d] = baseDateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + offsetDays);
  return formatDateKey(date);
}

/**
 * Calculate current streak
 */
function calculateCurrentStreak() {
  let streak = 0;
  let dateKey = getTodayKey();
  let safety = 365;

  // If today has tasks but not all completed, start from yesterday
  const todayStatus = isStreakDay(dateKey);
  if (todayStatus === false) {
    dateKey = getDateKeyOffset(dateKey, -1);
  } else if (todayStatus === true) {
    streak = 1;
    dateKey = getDateKeyOffset(dateKey, -1);
  } else {
    // Today has no tasks, start checking from yesterday
    dateKey = getDateKeyOffset(dateKey, -1);
  }

  while (safety-- > 0) {
    const status = isStreakDay(dateKey);
    if (status === true) {
      streak++;
      dateKey = getDateKeyOffset(dateKey, -1);
    } else if (status === false) {
      break;
    } else {
      // No tasks — skip this day
      dateKey = getDateKeyOffset(dateKey, -1);
    }
  }

  return streak;
}

/**
 * Calculate longest streak from all stored data
 */
function calculateLongestStreak() {
  const tasks = getAllTasks();
  if (tasks.length === 0) return 0;

  const dates = [...new Set(tasks.map(t => t.date))].sort();
  const minDate = dates[0];
  const maxDate = getTodayKey();

  let longest = 0;
  let current = 0;
  let dateKey = minDate;
  let safety = 3650;

  while (dateKey <= maxDate && safety-- > 0) {
    const status = isStreakDay(dateKey);
    if (status === true) {
      current++;
      longest = Math.max(longest, current);
    } else if (status === false) {
      current = 0;
    }
    // null (no tasks) — don't reset current streak
    dateKey = getDateKeyOffset(dateKey, 1);
  }

  return longest;
}

/**
 * Get weekly completion data (Mon-Sun of current week)
 */
function getWeeklyData() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const data = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = formatDateKey(d);
    const stats = getDateStats(key);
    data.push({
      label: days[i],
      dateKey: key,
      rate: stats.rate,
      total: stats.total,
      completed: stats.completed,
      isToday: key === getTodayKey()
    });
  }

  return data;
}

/**
 * Get monthly completion data
 */
function getMonthlyStats() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let totalTasks = 0;
  let completedTasks = 0;
  let activeDays = 0;
  let perfectDays = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const key = formatDateKey(new Date(year, month, d));
    const stats = getDateStats(key);
    if (stats.total > 0) {
      activeDays++;
      totalTasks += stats.total;
      completedTasks += stats.completed;
      if (stats.rate === 100) perfectDays++;
    }
  }

  const rate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  return { totalTasks, completedTasks, activeDays, perfectDays, rate };
}

/**
 * Get overall statistics
 */
function getOverallStats() {
  const tasks = getAllTasks();
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    pending,
    rate,
    currentStreak: calculateCurrentStreak(),
    longestStreak: calculateLongestStreak()
  };
}

/**
 * Get calendar day indicator status
 * Returns: 'none' | 'partial' | 'complete'
 */
function getDayIndicator(dateKey) {
  const tasks = getTasksByDate(dateKey);
  if (tasks.length === 0) return 'none';
  const completed = tasks.filter(t => t.completed).length;
  if (completed === tasks.length) return 'complete';
  if (completed > 0) return 'partial';
  return 'partial'; // has tasks but none completed
}

/**
 * Render circular progress ring
 */
function renderProgressRing(container, percentage) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const isComplete = percentage === 100;

  container.innerHTML = `
    <div class="progress-ring-wrapper ${isComplete ? 'progress-complete' : ''}">
      <svg class="progress-ring" viewBox="0 0 160 160" aria-hidden="true">
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#6366F1"/>
            <stop offset="100%" stop-color="#8B5CF6"/>
          </linearGradient>
        </defs>
        <circle class="progress-ring-bg" cx="80" cy="80" r="${radius}" />
        <circle class="progress-ring-fill" cx="80" cy="80" r="${radius}"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${offset}" />
      </svg>
      <div class="progress-ring-text">
        <span class="progress-percent" data-value="${percentage}">${percentage}%</span>
        ${isComplete ? '<span class="progress-celebration">Day completed! 🎉</span>' : ''}
      </div>
    </div>
  `;
}

/**
 * Render weekly bar chart
 */
function renderWeeklyChart(container) {
  const data = getWeeklyData();
  const maxRate = 100;

  const barsHtml = data.map(day => {
    const height = day.total > 0 ? Math.max(day.rate, 4) : 0;
    const barClass = day.isToday ? 'chart-bar today-bar' : 'chart-bar';
    const title = day.total > 0
      ? `${day.label}: ${day.completed}/${day.total} (${day.rate}%)`
      : `${day.label}: No targets`;

    return `
      <div class="chart-bar-group" title="${escapeHtml(title)}">
        <div class="chart-bar-container">
          <div class="${barClass}" style="height: ${height}%" role="img" aria-label="${escapeHtml(title)}">
            ${day.total > 0 ? `<span class="chart-bar-value">${day.rate}%</span>` : ''}
          </div>
        </div>
        <span class="chart-bar-label ${day.isToday ? 'today-label' : ''}">${day.label}</span>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="weekly-chart" role="group" aria-label="Weekly completion chart">
      ${barsHtml}
    </div>
  `;
}

/**
 * Render statistics page content
 */
function renderStatisticsPage() {
  const todayStats = getDateStats(getTodayKey());
  const weeklyData = getWeeklyData();
  const monthlyStats = getMonthlyStats();
  const overall = getOverallStats();

  const weeklyTotal = weeklyData.reduce((s, d) => s + d.total, 0);
  const weeklyCompleted = weeklyData.reduce((s, d) => s + d.completed, 0);
  const weeklyRate = weeklyTotal > 0 ? Math.round((weeklyCompleted / weeklyTotal) * 100) : 0;

  // Today completion
  const todayEl = document.getElementById('stat-today');
  if (todayEl) {
    todayEl.textContent = todayStats.rate + '%';
  }

  // Weekly
  const weeklyEl = document.getElementById('stat-weekly');
  if (weeklyEl) {
    weeklyEl.textContent = weeklyRate + '%';
  }

  // Monthly
  const monthlyEl = document.getElementById('stat-monthly');
  if (monthlyEl) {
    monthlyEl.textContent = monthlyStats.rate + '%';
  }

  // Totals
  const totalCompletedEl = document.getElementById('stat-total-completed');
  if (totalCompletedEl) totalCompletedEl.textContent = overall.completed;

  const totalTargetsEl = document.getElementById('stat-total-targets');
  if (totalTargetsEl) totalTargetsEl.textContent = overall.total;

  const currentStreakEl = document.getElementById('stat-current-streak');
  if (currentStreakEl) currentStreakEl.textContent = overall.currentStreak;

  const longestStreakEl = document.getElementById('stat-longest-streak');
  if (longestStreakEl) longestStreakEl.textContent = overall.longestStreak;

  // Sidebar streak
  const sidebarStreak = document.getElementById('sidebar-streak-count');
  if (sidebarStreak) sidebarStreak.textContent = overall.currentStreak;

  // Weekly chart
  const chartContainer = document.getElementById('weekly-chart-container');
  if (chartContainer) renderWeeklyChart(chartContainer);

  // Monthly details
  const monthlyDetails = document.getElementById('monthly-details');
  if (monthlyDetails) {
    monthlyDetails.innerHTML = `
      <div class="detail-row">
        <span>Active Days</span>
        <strong>${monthlyStats.activeDays}</strong>
      </div>
      <div class="detail-row">
        <span>Perfect Days</span>
        <strong>${monthlyStats.perfectDays}</strong>
      </div>
      <div class="detail-row">
        <span>Completed</span>
        <strong>${monthlyStats.completedTasks} / ${monthlyStats.totalTasks}</strong>
      </div>
    `;
  }
}

/**
 * Update dashboard stat cards
 */
function updateStatCards(dateKey) {
  const stats = getDateStats(dateKey);

  const els = {
    'stat-card-total': stats.total,
    'stat-card-completed': stats.completed,
    'stat-card-pending': stats.pending,
    'stat-card-rate': stats.rate + '%'
  };

  Object.entries(els).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });

  // Progress section
  const progressText = document.getElementById('progress-text');
  if (progressText) {
    if (stats.total === 0) {
      progressText.textContent = 'No targets for today';
    } else if (stats.rate === 100) {
      progressText.textContent = `${stats.completed} of ${stats.total} targets completed`;
    } else {
      progressText.textContent = `${stats.completed} of ${stats.total} targets completed`;
    }
  }

  const progressRing = document.getElementById('progress-ring-container');
  if (progressRing) renderProgressRing(progressRing, stats.rate);

  // Summary card
  updateSummaryCard(stats);
}

/**
 * Update daily summary card
 */
function updateSummaryCard(stats) {
  const summaryTotal = document.getElementById('summary-total');
  const summaryCompleted = document.getElementById('summary-completed');
  const summaryRemaining = document.getElementById('summary-remaining');
  const summaryProgress = document.getElementById('summary-progress');
  const summaryMessage = document.getElementById('summary-message');

  if (summaryTotal) summaryTotal.textContent = stats.total;
  if (summaryCompleted) summaryCompleted.textContent = stats.completed;
  if (summaryRemaining) summaryRemaining.textContent = stats.pending;
  if (summaryProgress) summaryProgress.textContent = stats.rate + '%';

  if (summaryMessage) {
    if (stats.total === 0) {
      summaryMessage.textContent = 'Add your first target and make today productive.';
    } else if (stats.rate === 100) {
      summaryMessage.textContent = 'Perfect day! All targets completed. 🎉';
    } else if (stats.rate === 0) {
      summaryMessage.textContent = 'Start your day with your first target.';
    } else if (stats.rate >= 75) {
      summaryMessage.textContent = 'Keep going — you\'re doing great!';
    } else if (stats.rate >= 50) {
      summaryMessage.textContent = 'Good progress! Stay focused.';
    } else {
      summaryMessage.textContent = 'You\'ve got this — keep pushing forward!';
    }
  }
}
