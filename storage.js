/**
 * Daily Target - Storage Module
 * Handles all localStorage operations for tasks and settings.
 */

const STORAGE_KEY = 'dailyTarget_tasks';
const SETTINGS_KEY = 'dailyTarget_settings';

const DEFAULT_SETTINGS = {
  theme: 'dark',
  defaultCategory: 'Study',
  defaultPriority: 'Medium',
  userName: 'Abhi'
};

const CATEGORIES = ['Study', 'Coding', 'Data Analytics', 'Fitness', 'Work', 'Personal', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High'];

/**
 * Generate a unique task ID
 */
function generateId() {
  return 'task_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDateKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date key
 */
function getTodayKey() {
  return formatDateKey(new Date());
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

/**
 * Load tasks from localStorage
 */
function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null; // first launch
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(isValidTask);
  } catch {
    console.warn('Corrupted task data, resetting.');
    return null;
  }
}

/**
 * Validate task object structure
 */
function isValidTask(task) {
  return (
    task &&
    typeof task.id === 'string' &&
    typeof task.title === 'string' &&
    typeof task.date === 'string' &&
    typeof task.completed === 'boolean'
  );
}

/**
 * Save tasks array to localStorage
 */
function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch (e) {
    console.error('Failed to save tasks:', e);
    return false;
  }
}

/**
 * Get all tasks
 */
function getAllTasks() {
  let tasks = loadTasks();
  if (tasks === null) {
    tasks = createDemoData();
    saveTasks(tasks);
  }
  return tasks;
}

/**
 * Add a new task
 */
function addTask(taskData) {
  const tasks = getAllTasks();
  const task = {
    id: generateId(),
    title: taskData.title.trim(),
    description: (taskData.description || '').trim(),
    date: taskData.date || getTodayKey(),
    time: taskData.time || '',
    category: taskData.category || 'Other',
    priority: taskData.priority || 'Medium',
    completed: false,
    completedAt: null,
    createdAt: new Date().toISOString()
  };
  tasks.push(task);
  saveTasks(tasks);
  return task;
}

/**
 * Update an existing task
 */
function updateTask(id, updates) {
  const tasks = getAllTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return null;

  const task = tasks[index];
  if (updates.title !== undefined) task.title = updates.title.trim();
  if (updates.description !== undefined) task.description = updates.description.trim();
  if (updates.date !== undefined) task.date = updates.date;
  if (updates.time !== undefined) task.time = updates.time;
  if (updates.category !== undefined) task.category = updates.category;
  if (updates.priority !== undefined) task.priority = updates.priority;
  if (updates.completed !== undefined) {
    task.completed = updates.completed;
    task.completedAt = updates.completed ? new Date().toISOString() : null;
  }

  tasks[index] = task;
  saveTasks(tasks);
  return task;
}

/**
 * Delete a task by ID
 */
function deleteTask(id) {
  const tasks = getAllTasks();
  const filtered = tasks.filter(t => t.id !== id);
  if (filtered.length === tasks.length) return false;
  saveTasks(filtered);
  return true;
}

/**
 * Toggle task completion
 */
function toggleTask(id) {
  const tasks = getAllTasks();
  const task = tasks.find(t => t.id === id);
  if (!task) return null;

  task.completed = !task.completed;
  task.completedAt = task.completed ? new Date().toISOString() : null;
  saveTasks(tasks);
  return task;
}

/**
 * Get tasks for a specific date
 */
function getTasksByDate(dateKey) {
  return getAllTasks().filter(t => t.date === dateKey);
}

/**
 * Get task by ID
 */
function getTaskById(id) {
  return getAllTasks().find(t => t.id === id) || null;
}

/**
 * Clear all tasks
 */
function clearAllTasks() {
  saveTasks([]);
}

/**
 * Import tasks from validated array
 */
function importTasks(tasksArray) {
  if (!Array.isArray(tasksArray)) return false;
  const valid = tasksArray.filter(isValidTask);
  if (valid.length === 0 && tasksArray.length > 0) return false;
  saveTasks(valid);
  return true;
}

/**
 * Load settings
 */
function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Save settings
 */
function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

/**
 * Create demo data for first launch only
 */
function createDemoData() {
  const today = getTodayKey();
  const tomorrow = formatDateKey(new Date(Date.now() + 86400000));

  return [
    {
      id: generateId(),
      title: 'Study Python',
      description: 'Complete chapter 5 exercises',
      date: today,
      time: '09:00',
      category: 'Study',
      priority: 'High',
      completed: true,
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: generateId(),
      title: 'Practice SQL',
      description: 'Work on JOIN queries',
      date: today,
      time: '11:00',
      category: 'Study',
      priority: 'Medium',
      completed: true,
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: generateId(),
      title: 'Power BI Practice',
      description: 'Build a sample dashboard',
      date: today,
      time: '14:00',
      category: 'Data Analytics',
      priority: 'High',
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString()
    },
    {
      id: generateId(),
      title: 'Read Documentation',
      description: 'Review API docs',
      date: today,
      time: '16:00',
      category: 'Coding',
      priority: 'Low',
      completed: true,
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: generateId(),
      title: 'Gym Workout',
      description: 'Leg day session',
      date: today,
      time: '18:00',
      category: 'Fitness',
      priority: 'High',
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString()
    },
    {
      id: generateId(),
      title: 'Review Today\'s Learning',
      description: 'Journal and summarize',
      date: today,
      time: '21:00',
      category: 'Personal',
      priority: 'Medium',
      completed: true,
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: generateId(),
      title: 'Prepare Presentation',
      description: 'Slides for Monday meeting',
      date: tomorrow,
      time: '10:00',
      category: 'Work',
      priority: 'High',
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString()
    }
  ];
}
