/**
 * Chaos Todo — Application Logic
 *
 * A todo app with three gimmicks:
 * 1. Chaos Mode — randomly reorders todos
 * 2. Todo Decay — todos fade and expire over 24 hours
 * 3. Karma System — earn points and unlock achievements
 */

// ============================================================
// Constants
// ============================================================

const STORAGE_KEY = 'chaos-todo-data';
const DECAY_HOURS = 24;
const DECAY_MS = DECAY_HOURS * 60 * 60 * 1000;
const DECAY_UPDATE_INTERVAL = 1000; // Update decay UI every second

const CHAOS_WARNING_SHOWN_KEY = 'chaos-warning-shown';

// Karma milestones and achievements
const ACHIEVEMENTS = [
  { id: 'first_karma', name: 'First Steps', description: 'Earn your first karma point', threshold: 1, icon: '🌱', unlocked: false },
  { id: 'ten_karma', name: 'Getting Started', description: 'Earn 10 karma points', threshold: 10, icon: '⭐', unlocked: false },
  { id: 'twentyfive_karma', name: 'On a Roll', description: 'Earn 25 karma points', threshold: 25, icon: '🔥', unlocked: false },
  { id: 'fifty_karma', name: 'Karma Master', description: 'Earn 50 karma points', threshold: 50, icon: '👑', unlocked: false },
  { id: 'hundred_karma', name: 'Legendary', description: 'Earn 100 karma points', threshold: 100, icon: '🏆', unlocked: false },
  { id: 'first_todo', name: 'Humble Beginnings', description: 'Create your first todo', threshold: 1, icon: '📝', unlocked: false, type: 'created' },
  { id: 'ten_todos', name: 'Todo Creator', description: 'Create 10 todos', threshold: 10, icon: '📋', unlocked: false, type: 'created' },
  { id: 'fifty_todos', name: 'Productivity God', description: 'Create 50 todos', threshold: 50, icon: '🤯', unlocked: false, type: 'created' },
  { id: 'chaos_user', name: 'Chaos Enthusiast', description: 'Toggle Chaos Mode on', threshold: 1, icon: '🌀', unlocked: false, type: 'chaos' },
  { id: 'chaos_master', name: 'Chaos Lord', description: 'Toggle Chaos Mode 10 times', threshold: 10, icon: '🎲', unlocked: false, type: 'chaos' },
  { id: 'first_reset', name: 'Second Chance', description: 'Reset a todo\'s decay', threshold: 1, icon: '⏰', unlocked: false, type: 'reset' },
  { id: 'five_resets', name: 'Persistent', description: 'Reset decay 5 times', threshold: 5, icon: '💪', unlocked: false, type: 'reset' },
];

// ============================================================
// TodoStore — localStorage persistence
// ============================================================

class TodoStore {
  constructor() {
    this.todos = [];
    this.karma = 0;
    this.totalCreated = 0;
    this.chaosToggles = 0;
    this.totalResets = 0;
    this.unlockedAchievements = new Set();
    this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        this.todos = Array.isArray(data.todos) ? data.todos : [];
        this.karma = typeof data.karma === 'number' ? data.karma : 0;
        this.totalCreated = typeof data.totalCreated === 'number' ? data.totalCreated : 0;
        this.chaosToggles = typeof data.chaosToggles === 'number' ? data.chaosToggles : 0;
        this.totalResets = typeof data.totalResets === 'number' ? data.totalResets : 0;
        this.unlockedAchievements = new Set(data.unlockedAchievements || []);
      }
    } catch {
      // Corrupted data — start fresh
      this.todos = [];
      this.karma = 0;
      this.totalCreated = 0;
      this.chaosToggles = 0;
      this.totalResets = 0;
      this.unlockedAchievements = new Set();
    }
  }

  _save() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          todos: this.todos,
          karma: this.karma,
          totalCreated: this.totalCreated,
          chaosToggles: this.chaosToggles,
          totalResets: this.totalResets,
          unlockedAchievements: [...this.unlockedAchievements],
        })
      );
    } catch {
      // localStorage full — can't save
    }
  }

  addTodo(text) {
    const now = Date.now();
    const todo = {
      id: crypto.randomUUID ? crypto.randomUUID() : `todo-${now}-${Math.random().toString(36).slice(2, 9)}`,
      text,
      completed: false,
      createdAt: now,
      decayStartedAt: now,
      decayDeadline: now + DECAY_MS,
      decayResetCount: 0,
    };
    this.todos.push(todo);
    this.totalCreated++;
    this._save();
    return todo;
  }

  deleteTodo(id) {
    this.todos = this.todos.filter((t) => t.id !== id);
    this._save();
  }

  toggleComplete(id) {
    const todo = this.todos.find((t) => t.id === id);
    if (!todo) return null;

    const wasCompleted = todo.completed;
    const remainingBeforeToggle = this.getDecayRemaining(todo);
    todo.completed = !wasCompleted;

    let karmaGain = 0;
    if (todo.completed && !wasCompleted) {
      karmaGain = this._calculateKarmaGain(todo, remainingBeforeToggle);
      this.karma += karmaGain;
    }

    this._save();
    return { todo, karmaGain };
  }

  updateText(id, newText) {
    const todo = this.todos.find((t) => t.id === id);
    if (!todo) return;
    todo.text = newText.trim();
    this._save();
  }

  resetDecay(id) {
    const todo = this.todos.find((t) => t.id === id);
    if (!todo || todo.completed) return false;

    const now = Date.now();
    todo.decayStartedAt = now;
    todo.decayDeadline = now + DECAY_MS;
    todo.decayResetCount++;
    this.totalResets++;
    this._save();
    return true;
  }

  isExpired(todo) {
    return !todo.completed && Date.now() >= todo.decayDeadline;
  }

  getDecayProgress(todo) {
    if (todo.completed) return 1;
    const startedAt = todo.decayStartedAt || todo.createdAt;
    const elapsed = Date.now() - startedAt;
    return Math.min(elapsed / DECAY_MS, 1);
  }

  getDecayRemaining(todo) {
    if (todo.completed) return 0;
    const remaining = todo.decayDeadline - Date.now();
    return Math.max(remaining, 0);
  }

  getTodos(filter) {
    let filtered = [...this.todos];

    switch (filter) {
      case 'active':
        filtered = filtered.filter((t) => !t.completed && !this.isExpired(t));
        break;
      case 'completed':
        filtered = filtered.filter((t) => t.completed);
        break;
      case 'expired':
        filtered = filtered.filter((t) => !t.completed && this.isExpired(t));
        break;
      default: // 'all'
        break;
    }

    return filtered;
  }

  getExpiredCount() {
    return this.todos.filter((t) => !t.completed && this.isExpired(t)).length;
  }

  getActiveCount() {
    return this.todos.filter((t) => !t.completed && !this.isExpired(t)).length;
  }

  getCompletedCount() {
    return this.todos.filter((t) => t.completed).length;
  }

  _calculateKarmaGain(todo, remaining = this.getDecayRemaining(todo)) {
    let gain = 1;
    if (remaining > DECAY_MS * 0.5) {
      gain += 1;
    }
    if (remaining < DECAY_MS * 0.1 && remaining > 0) {
      gain += 2;
    }
    return gain;
  }

  toggleChaos() {
    this.chaosToggles++;
    this._save();
  }

  shuffleTodos() {
    this.todos = this.todos
      .map((todo) => ({ todo, sortKey: Math.random() }))
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ todo }) => todo);
    this._save();
  }

  // Check and unlock achievements
  checkAchievements() {
    const newlyUnlocked = [];

    for (const achievement of ACHIEVEMENTS) {
      if (this.unlockedAchievements.has(achievement.id)) continue;

      let value = 0;
      if (achievement.type === 'created') {
        value = this.totalCreated;
      } else if (achievement.type === 'chaos') {
        value = this.chaosToggles;
      } else if (achievement.type === 'reset') {
        value = this.totalResets;
      } else {
        value = this.karma;
      }

      if (value >= achievement.threshold) {
        this.unlockedAchievements.add(achievement.id);
        newlyUnlocked.push(achievement);
        this._save();
      }
    }

    return newlyUnlocked;
  }

  getUnlockedAchievements() {
    return ACHIEVEMENTS.filter((a) => this.unlockedAchievements.has(a.id));
  }

  getLockedAchievements() {
    return ACHIEVEMENTS.filter((a) => !this.unlockedAchievements.has(a.id));
  }

  getAchievementCount() {
    return this.unlockedAchievements.size;
  }
}

// ============================================================
// KarmaSystem
// ============================================================

class KarmaSystem {
  constructor(store) {
    this.store = store;
    this.onKarmaChange = null; // callback(totalKarma, gain)
    this.onAchievement = null; // callback(achievement)
  }

  getKarma() {
    return this.store.karma;
  }

  onKarmaChangeGain(karma, gain) {
    if (this.onKarmaChange) {
      this.onKarmaChange(karma, gain);
    }
  }

  onAchievementUnlocked(achievement) {
    if (this.onAchievement) {
      this.onAchievement(achievement);
    }
  }
}

// ============================================================
// ChaosMode
// ============================================================

class ChaosMode {
  constructor() {
    this.active = false;
    this.onToggle = null; // callback(active)
    this.onReorder = null; // callback()
  }

  toggle() {
    this.active = !this.active;
    if (this.onToggle) this.onToggle(this.active);
    return this.active;
  }

  activate() {
    this.active = true;
    if (this.onToggle) this.onToggle(true);
    return true;
  }

  deactivate() {
    this.active = false;
    if (this.onToggle) this.onToggle(false);
    return false;
  }

  shuffle(arr) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  triggerReorder() {
    if (this.onReorder) this.onReorder();
  }
}

// ============================================================
// DecayManager
// ============================================================

class DecayManager {
  constructor(store) {
    this.store = store;
    this.onDecayUpdate = null; // callback()
    this._intervalId = null;
  }

  start() {
    this._intervalId = setInterval(() => {
      if (this.onDecayUpdate) this.onDecayUpdate();
    }, DECAY_UPDATE_INTERVAL);
  }

  stop() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  formatTime(ms) {
    if (ms <= 0) return '0s';

    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  getDecayState(todo) {
    const remaining = this.store.getDecayRemaining(todo);
    const progress = this.store.getDecayProgress(todo);
    const expired = this.store.isExpired(todo);
    const isDecaying = !expired && progress > 0.5;
    const isCritical = !expired && progress > 0.8;

    return {
      remaining,
      progress,
      expired,
      isDecaying,
      isCritical,
      formatted: this.formatTime(remaining),
    };
  }
}

// ============================================================
// ToastNotification
// ============================================================

class ToastNotification {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  show(icon, title, message, type = '') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <div class="toast-content">
        <div class="toast-title">${this._escapeHtml(title)}</div>
        ${message ? `<div class="toast-message">${this._escapeHtml(message)}</div>` : ''}
      </div>
      <button class="toast-close" aria-label="Close notification">&times;</button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this._remove(toast));

    this.container.appendChild(toast);

    // Auto-remove after 4 seconds
    setTimeout(() => this._remove(toast), 4000);
  }

  _remove(toast) {
    if (!toast.parentNode) return;
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    });
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// ============================================================
// UIRenderer
// ============================================================

class UIRenderer {
  constructor(store, chaosMode, decayManager, karmaSystem) {
    this.store = store;
    this.chaosMode = chaosMode;
    this.decayManager = decayManager;
    this.karmaSystem = karmaSystem;

    // DOM elements
    this.todoInput = document.getElementById('todoInput');
    this.addTodoForm = document.getElementById('addTodoForm');
    this.todoList = document.getElementById('todoList');
    this.todoListContainer = document.getElementById('todoListContainer');
    this.emptyState = document.getElementById('emptyState');
    this.chaosToggle = document.getElementById('chaosToggle');
    this.chaosStatus = document.getElementById('chaosStatus');
    this.chaosHint = document.getElementById('chaosHint');
    this.karmaDisplay = document.getElementById('karmaDisplay');
    this.karmaCount = document.getElementById('karmaCount');
    this.filterTabs = document.getElementById('filterTabs');
    this.achievementsToggle = document.getElementById('achievementsToggle');
    this.achievementsPanel = document.getElementById('achievementsPanel');
    this.achievementsList = document.getElementById('achievementsList');
    this.achievementsBadge = document.getElementById('achievementsBadge');

    this.currentFilter = 'all';

    this._bindEvents();
  }

  _bindEvents() {
    // Add todo form
    this.addTodoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.onAddTodo();
    });

    // Chaos toggle
    this.chaosToggle.addEventListener('click', () => {
      this.onToggleChaos();
    });

    // Filter tabs
    this.filterTabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.filter-tab');
      if (!tab) return;
      this.onFilterChange(tab.dataset.filter);
    });

    // Achievements toggle
    this.achievementsToggle.addEventListener('click', () => {
      this.onToggleAchievements();
    });
  }

  // ---- Event handlers (called by the app) ----

  onAddTodo() {
    const text = this.todoInput.value.trim();
    if (!text) return;

    this.store.addTodo(text);
    this.todoInput.value = '';
    this.todoInput.focus();

    const achievements = this.store.checkAchievements();
    if (achievements.length > 0) {
      this.onAchievementsUnlocked(achievements);
    }

    this._renderWithChaosIfNeeded();
  }

  onDeleteTodo(id) {
    this.store.deleteTodo(id);
    this._renderWithChaosIfNeeded();
  }

  onToggleComplete(id) {
    const result = this.store.toggleComplete(id);
    if (!result) return;

    const { karmaGain } = result;
    const achievements = this.store.checkAchievements();

    if (karmaGain > 0 && typeof this.karmaSystem.onKarmaChangeGain === 'function') {
      this.karmaSystem.onKarmaChangeGain(this.store.karma, karmaGain);
    }

    if (achievements.length > 0) {
      this.onAchievementsUnlocked(achievements);
    }

    this._renderWithChaosIfNeeded();
  }

  onEditTodo(id) {
    const todo = this.store.todos.find((t) => t.id === id);
    if (!todo) return;

    this._startEditing(id, todo.text);
  }

  onSaveEdit(id, newText) {
    const trimmed = newText.trim();
    if (!trimmed) {
      this.onDeleteTodo(id);
      return;
    }
    this.store.updateText(id, trimmed);
    this.render();
  }

  onCancelEdit() {
    this.render(); // Re-render to remove edit mode
  }

  onResetDecay(id) {
    const success = this.store.resetDecay(id);
    if (success) {
      const achievements = this.store.checkAchievements();
      if (achievements.length > 0) {
        this.onAchievementsUnlocked(achievements);
      }
      this.render();
    }
  }

  onToggleChaos() {
    const active = this.chaosMode.toggle();
    this.store.toggleChaos();
    const achievements = this.store.checkAchievements();

    if (achievements.length > 0) {
      this.onAchievementsUnlocked(achievements);
    }

    this._updateChaosUI();
    this.render();
  }

  onFilterChange(filter) {
    this.currentFilter = filter;
    this._updateFilterTabs();
    this.render();
  }

  onToggleAchievements() {
    const isVisible = this.achievementsPanel.style.display !== 'none';
    this.achievementsPanel.style.display = isVisible ? 'none' : 'block';
    this.achievementsToggle.setAttribute('aria-expanded', !isVisible);

    if (!isVisible) {
      this._renderAchievements();
    }
  }

  onAchievementsUnlocked(achievements) {
    // Show toast for each new achievement
    for (const achievement of achievements) {
      this.showToast(achievement.icon, `Achievement Unlocked!`, achievement.name, 'achievement');
    }

    // Update badge
    this._updateAchievementsBadge();

    // Re-render achievements panel if visible
    if (this.achievementsPanel.style.display !== 'none') {
      this._renderAchievements();
    }
  }

  // ---- Rendering ----

  render() {
    this._renderTodos();
    this._renderCounts();
    this._renderKarma();
    this._updateAchievementsBadge();

    if (this.achievementsPanel.style.display !== 'none') {
      this._renderAchievements();
    }
  }

  _renderTodos() {
    const todos = this.store.getTodos(this.currentFilter);
    const hasItems = todos.length > 0;

    this.todoList.style.display = hasItems ? 'flex' : 'none';
    this.emptyState.style.display = hasItems ? 'none' : 'flex';

    if (!hasItems) return;

    // Build HTML for todos
    let html = '';

    for (const todo of todos) {
      const decayState = this.decayManager.getDecayState(todo);
      const isExpired = decayState.expired;

      // Chaos animation vars
      const chaosX = this.chaosMode.active ? (Math.random() * 40 - 20) : 0;
      const chaosR = this.chaosMode.active ? (Math.random() * 6 - 3) : 0;

      let itemClass = 'todo-item';
      if (todo.completed) itemClass += ' completed';
      if (isExpired) itemClass += ' expired';
      if (decayState.isDecaying) itemClass += ' decaying';

      html += `
        <li class="${itemClass}" data-id="${todo.id}"
            style="--chaos-x: ${chaosX}px; --chaos-r: ${chaosR}deg;">
          <div class="todo-content">
            <div class="todo-text">${this._escapeHtml(todo.text)}</div>
            <div class="todo-meta">
              ${!todo.completed ? `
                <div class="todo-decay-bar">
                  <div class="todo-decay-fill ${decayState.isCritical ? 'critical' : ''}"
                       style="width: ${(1 - decayState.progress) * 100}%"></div>
                </div>
                <span class="todo-timer">${decayState.formatted}</span>
              ` : '<span class="todo-status">Completed</span>'}
            </div>
          </div>
          <div class="todo-actions">
            <button class="todo-action-btn complete-btn"
                    aria-label="${todo.completed ? 'Mark incomplete' : 'Mark complete'}"
                    data-action="complete"
                    data-id="${todo.id}">
              ${todo.completed ? '↩️' : '✅'}
            </button>
            ${!todo.completed && !isExpired ? `
              <button class="todo-action-btn edit-btn"
                      aria-label="Edit todo"
                      data-action="edit"
                      data-id="${todo.id}">
                ✏️
              </button>
              <button class="todo-action-btn reset-btn"
                      aria-label="Reset decay"
                      data-action="reset"
                      data-id="${todo.id}"
                      title="Reset decay timer">
                ⏰
              </button>
            ` : ''}
            ${isExpired ? `
              <button class="todo-action-btn reset-btn"
                      aria-label="Restore expired todo"
                      data-action="restore"
                      data-id="${todo.id}"
                      title="Restore this expired todo">
                🔄
              </button>
            ` : ''}
            <button class="todo-action-btn delete-btn"
                    aria-label="Delete todo"
                    data-action="delete"
                    data-id="${todo.id}">
              🗑️
            </button>
          </div>
        </li>
      `;
    }

    this.todoList.innerHTML = html;

    // Attach action listeners
    this.todoList.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        this._handleAction(action, id);
      });
    });
  }

  _handleAction(action, id) {
    switch (action) {
      case 'complete':
        this.onToggleComplete(id);
        break;
      case 'edit':
        this.onEditTodo(id);
        break;
      case 'delete':
        this.onDeleteTodo(id);
        break;
      case 'reset':
        this.onResetDecay(id);
        break;
      case 'restore':
        // Restore expired todo by resetting its decay
        this.onResetDecay(id);
        break;
    }
  }

  _renderCounts() {
    document.getElementById('countAll').textContent = this.store.todos.length;
    document.getElementById('countActive').textContent = this.store.getActiveCount();
    document.getElementById('countCompleted').textContent = this.store.getCompletedCount();
    document.getElementById('countExpired').textContent = this.store.getExpiredCount();
  }

  _renderKarma() {
    this.karmaCount.textContent = this.store.karma;
  }

  _updateFilterTabs() {
    this.filterTabs.querySelectorAll('.filter-tab').forEach((tab) => {
      const isActive = tab.dataset.filter === this.currentFilter;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive);
    });
  }

  _updateChaosUI() {
    const active = this.chaosMode.active;
    this.chaosToggle.setAttribute('aria-pressed', active);
    this.chaosStatus.textContent = active ? 'ON' : 'OFF';
  }

  _updateAchievementsBadge() {
    const count = this.store.getAchievementCount();
    const max = ACHIEVEMENTS.length;
    if (count > 0) {
      this.achievementsBadge.textContent = `${count}/${max}`;
      this.achievementsBadge.classList.add('visible');
    } else {
      this.achievementsBadge.classList.remove('visible');
    }
  }

  _renderAchievements() {
    const unlocked = this.store.getUnlockedAchievements();
    const locked = this.store.getLockedAchievements();

    let html = '';

    for (const a of unlocked) {
      html += `
        <div class="achievement">
          <span class="achievement-icon">${a.icon}</span>
          <span>${a.name}</span>
        </div>
      `;
    }

    // Show progress on next locked achievement
    if (locked.length > 0) {
      const next = locked[0];
      // Calculate progress toward next milestone
      let current = 0;
      if (next.type === 'created') current = this.store.totalCreated;
      else if (next.type === 'chaos') current = this.store.chaosToggles;
      else if (next.type === 'reset') current = this.store.totalResets;
      else current = this.store.karma;

      const progress = Math.min(current / next.threshold, 1);

      html += `
        <div class="achievement" style="opacity: 0.5; border-style: dashed;">
          <span class="achievement-icon">${next.icon}</span>
          <span>${next.name}</span>
          <span style="margin-left: auto; font-size: 0.7rem;">${Math.round(progress * 100)}%</span>
        </div>
      `;
    }

    this.achievementsList.innerHTML = html;
  }

  showToast(icon, title, message, type) {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <div class="toast-content">
        <div class="toast-title">${this._escapeHtml(title)}</div>
        ${message ? `<div class="toast-message">${this._escapeHtml(message)}</div>` : ''}
      </div>
      <button class="toast-close" aria-label="Close notification">&times;</button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      toast.classList.add('toast-exit');
      toast.addEventListener('animationend', () => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      });
    });

    toastContainer.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.add('toast-exit');
        toast.addEventListener('animationend', () => {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        });
      }
    }, 4000);
  }

  _startEditing(id, text) {
    const todoEl = this.todoList.querySelector(`[data-id="${id}"]`);
    if (!todoEl) return;

    todoEl.classList.add('editing');

    const content = todoEl.querySelector('.todo-content');
    const actions = todoEl.querySelector('.todo-actions');

    content.innerHTML = `
      <form class="edit-form" data-id="${id}">
        <input type="text" class="edit-input" value="${this._escapeHtml(text)}" maxlength="200"
               aria-label="Edit todo text">
        <div class="edit-actions">
          <button type="submit" class="edit-btn save-btn" aria-label="Save">✓</button>
          <button type="button" class="edit-btn cancel-btn" aria-label="Cancel">✕</button>
        </div>
      </form>
    `;

    const form = content.querySelector('.edit-form');
    const input = form.querySelector('.edit-input');
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.onSaveEdit(id, input.value);
    });

    form.querySelector('.cancel-btn').addEventListener('click', () => {
      this.onCancelEdit();
    });

    // Hide the action buttons during editing
    actions.style.display = 'none';
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---- Special UI updates ----

  onChaosReorder() {
    this.todoList.classList.add('chaos-reorder');
    this.todoList.addEventListener('animationend', () => {
      this.todoList.classList.remove('chaos-reorder');
    }, { once: true });

    const items = this.todoList.querySelectorAll('.todo-item');
    items.forEach((item) => {
      const chaosX = Math.random() * 40 - 20;
      const chaosR = Math.random() * 6 - 3;
      item.style.setProperty('--chaos-x', `${chaosX}px`);
      item.style.setProperty('--chaos-r', `${chaosR}deg`);
      item.classList.add('chaos-move');
      item.addEventListener('animationend', () => {
        item.classList.remove('chaos-move');
      }, { once: true });
    });
  }

  _renderWithChaosIfNeeded() {
    if (this.chaosMode.active) {
      this.store.shuffleTodos();
    }

    this.render();

    if (this.chaosMode.active) {
      const animate = () => this.onChaosReorder();
      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(animate);
      } else {
        setTimeout(animate, 0);
      }
    }
  }

  onKarmaGain(total, gain) {
    this.karmaCount.textContent = total;
    this.karmaDisplay.classList.add('pulse');
    this.karmaDisplay.addEventListener('animationend', () => {
      this.karmaDisplay.classList.remove('pulse');
    }, { once: true });
  }

  onDecayUpdate() {
    // Only re-render if there are todos to update
    if (this.store.todos.length === 0) return;
    this._renderTodos();
  }
}

// ============================================================
// App — Main entry point
// ============================================================

class App {
  constructor() {
    this.store = new TodoStore();
    this.karmaSystem = new KarmaSystem(this.store);
    this.chaosMode = new ChaosMode();
    this.decayManager = new DecayManager(this.store);
    this.ui = new UIRenderer(this.store, this.chaosMode, this.decayManager, this.karmaSystem);

    this._setupCallbacks();
    this._showWelcome();
    this._updateChaosUI();
    this.decayManager.start();
    this.ui.render();
  }

  _setupCallbacks() {
    // Karma system callbacks
    this.karmaSystem.onKarmaChangeGain = (total, gain) => {
      this.ui.onKarmaGain(total, gain);
    };

    this.karmaSystem.onAchievement = (achievement) => {
      this.ui.onAchievementsUnlocked([achievement]);
    };

    // Chaos mode callbacks
    this.chaosMode.onToggle = (active) => {
      this._updateChaosUI();
      if (active) {
        this.ui.showToast('🌀', 'Chaos Mode Activated!', 'Your todos will be joyfully randomized on every action!', 'chaos');
      }
    };

    this.chaosMode.onReorder = () => {
      this.ui.onChaosReorder();
    };

    // Decay manager callbacks
    this.decayManager.onDecayUpdate = () => {
      this.ui.onDecayUpdate();
    };
  }

  _updateChaosUI() {
    this.ui._updateChaosUI();
  }

  _showWelcome() {
    // Show a welcome toast on first visit
    const hasVisited = sessionStorage.getItem('chaos-todo-visited');
    if (!hasVisited) {
      setTimeout(() => {
        this.ui.showToast(
          '🌀',
          'Welcome to Chaos Todo!',
          'Add todos, earn karma, and toggle Chaos Mode for fun!',
          'chaos'
        );
        sessionStorage.setItem('chaos-todo-visited', 'true');
      }, 500);
    }
  }
}

// ============================================================
// Initialize the app
// ============================================================

const app = new App();

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TodoStore, KarmaSystem, ChaosMode, DecayManager, UIRenderer, App, ACHIEVEMENTS };
}
