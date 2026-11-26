/* ==========================================================================
   GymLog — Personal Fitness, Nutrition & Health Analytics
   Pure Vanilla JavaScript (Zero External Dependencies, Local-Only Storage)
   ========================================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'gymlog_data_v1';
  const THEME_KEY = 'gymlog_theme';
  const SCHEMA_VERSION = 1;
  const KG_TO_LB = 2.2046226218;
  const STORAGE_BUDGET_BYTES = 5 * 1024 * 1024; // Conservative 5 MB browser localStorage budget

  const WEEKDAYS = [
    { id: 1, name: 'Monday', short: 'Mon' },
    { id: 2, name: 'Tuesday', short: 'Tue' },
    { id: 3, name: 'Wednesday', short: 'Wed' },
    { id: 4, name: 'Thursday', short: 'Thu' },
    { id: 5, name: 'Friday', short: 'Fri' },
    { id: 6, name: 'Saturday', short: 'Sat' },
    { id: 0, name: 'Sunday', short: 'Sun' }
  ];


  const MUSCLE_GROUPS = ['Chest','Back','Shoulders','Biceps','Triceps','Forearms','Abs','Obliques','Quadriceps','Hamstrings','Glutes','Calves'];
  const EQUIPMENT_TYPES = ['Barbell','Dumbbell','Cable','Machine','Bodyweight','Resistance band','Kettlebell','Other'];
  const EXERCISE_CATALOGUE = [
    ['bench_press','Bench Press','Chest','Barbell'],['incline_bench_press','Incline Bench Press','Chest','Barbell'],['dumbbell_bench_press','Dumbbell Bench Press','Chest','Dumbbell'],['incline_dumbbell_press','Incline Dumbbell Press','Chest','Dumbbell'],['cable_fly','Cable Fly','Chest','Cable'],['pec_deck','Pec Deck Fly','Chest','Machine'],
    ['barbell_row','Barbell Row','Back','Barbell'],['pull_up','Pull-Up','Back','Bodyweight'],['lat_pulldown','Lat Pulldown','Back','Machine'],['seated_cable_row','Seated Cable Row','Back','Cable'],['one_arm_dumbbell_row','One-Arm Dumbbell Row','Back','Dumbbell'],['deadlift','Deadlift','Back','Barbell'],
    ['overhead_press','Overhead Press','Shoulders','Barbell'],['dumbbell_shoulder_press','Dumbbell Shoulder Press','Shoulders','Dumbbell'],['lateral_raise','Lateral Raise','Shoulders','Dumbbell'],['cable_lateral_raise','Cable Lateral Raise','Shoulders','Cable'],['reverse_pec_deck','Reverse Pec Deck','Shoulders','Machine'],
    ['barbell_curl','Barbell Curl','Biceps','Barbell'],['dumbbell_curl','Dumbbell Bicep Curl','Biceps','Dumbbell'],['hammer_curl','Hammer Curl','Biceps','Dumbbell'],['preacher_curl','Preacher Curl','Biceps','Machine'],
    ['triceps_pushdown','Triceps Pushdown','Triceps','Cable'],['overhead_triceps_extension','Overhead Triceps Extension','Triceps','Dumbbell'],['skull_crusher','Skull Crusher','Triceps','Barbell'],['bench_dip','Bench Dip','Triceps','Bodyweight'],
    ['wrist_curl','Wrist Curl','Forearms','Dumbbell'],['reverse_wrist_curl','Reverse Wrist Curl','Forearms','Barbell'],['farmer_carry','Farmer Carry','Forearms','Dumbbell'],
    ['plank','Plank','Abs','Bodyweight'],['crunch','Crunch','Abs','Bodyweight'],['hanging_leg_raise','Hanging Leg Raise','Abs','Bodyweight'],['cable_crunch','Cable Crunch','Abs','Cable'],
    ['russian_twist','Russian Twist','Obliques','Bodyweight'],['side_plank','Side Plank','Obliques','Bodyweight'],['woodchop','Cable Woodchop','Obliques','Cable'],
    ['back_squat','Back Squat','Quadriceps','Barbell'],['front_squat','Front Squat','Quadriceps','Barbell'],['leg_press','Leg Press','Quadriceps','Machine'],['leg_extension','Leg Extension','Quadriceps','Machine'],['goblet_squat','Goblet Squat','Quadriceps','Dumbbell'],
    ['romanian_deadlift','Romanian Deadlift','Hamstrings','Barbell'],['seated_leg_curl','Seated Leg Curl','Hamstrings','Machine'],['lying_leg_curl','Lying Leg Curl','Hamstrings','Machine'],['good_morning','Good Morning','Hamstrings','Barbell'],
    ['hip_thrust','Hip Thrust','Glutes','Barbell'],['glute_bridge','Glute Bridge','Glutes','Bodyweight'],['cable_kickback','Cable Glute Kickback','Glutes','Cable'],['bulgarian_split_squat','Bulgarian Split Squat','Glutes','Dumbbell'],
    ['standing_calf_raise','Standing Calf Raise','Calves','Machine'],['seated_calf_raise','Seated Calf Raise','Calves','Machine'],['dumbbell_calf_raise','Dumbbell Calf Raise','Calves','Dumbbell']
  ];
  function makeBuiltinExercise([id,name,muscleGroup,equipment]) {
    const steps = {
      Chest:['Set your shoulder blades against the bench and plant your feet.','Lower the weight under control toward the chest.','Press smoothly without bouncing or forcing the shoulders forward.'],
      Back:['Brace your trunk and set your shoulders before moving.','Pull with controlled motion while keeping your spine neutral.','Return slowly and avoid jerking or swinging the weight.'],
      Shoulders:['Stand or sit tall with your ribs stacked over your hips.','Move the weight through a comfortable, controlled range.','Keep the neck relaxed and avoid using momentum.'],
      Biceps:['Keep your upper arms steady and wrists neutral.','Curl the weight without swinging your torso.','Lower slowly until the elbow is comfortably extended.'],
      Triceps:['Set your shoulders and keep elbows controlled.','Extend through the elbow without snapping the joint.','Return slowly while keeping the upper arm stable.'],
      Forearms:['Use a secure grip and keep the wrists aligned.','Move through a comfortable wrist or grip range.','Avoid bouncing and use a load you can control.'],
      Abs:['Brace your abdomen and keep your lower back controlled.','Move deliberately rather than pulling with the neck.','Breathe steadily and stop if you feel back pain.'],
      Obliques:['Brace your trunk and keep hips stable.','Rotate or resist rotation with controlled movement.','Avoid twisting sharply or using momentum.'],
      Quadriceps:['Set your feet firmly and brace before the repetition.','Bend your knees while keeping them tracking with your toes.','Drive through the feet and avoid collapsing inward.'],
      Hamstrings:['Set your hips and maintain a neutral spine.','Move from the hips or bend the knees as the exercise requires.','Control the return and avoid bouncing into end range.'],
      Glutes:['Brace your trunk and position feet securely.','Drive through the hips while keeping the pelvis controlled.','Finish without over-arching your lower back.'],
      Calves:['Use a stable stance and keep knees in the intended position.','Rise through the balls of your feet with a comfortable range.','Pause briefly, then lower slowly without bouncing.']
    };
    return {id:'ex_'+id,name,muscleGroup,equipment,custom:false,favorite:false,instructions:steps[muscleGroup],commonMistakes:['Using momentum instead of controlled movement','Choosing a load that compromises technique','Shortening the range of motion'],safetyTips:['Start with a manageable load and build gradually','Use a pain-free range of motion','Stop if you feel sharp pain or unusual symptoms']};
  }
  const BUILTIN_EXERCISES = EXERCISE_CATALOGUE.map(makeBuiltinExercise);

  // -------------------- Date & Math Helpers --------------------

  function getTodayISO() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function parseISODate(iso) {
    if (!iso || typeof iso !== 'string') return null;
    const parts = iso.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function shiftISODate(iso, deltaDays) {
    const dt = parseISODate(iso) || new Date();
    dt.setDate(dt.getDate() + deltaDays);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function getWeekdayFromISO(iso) {
    const dt = parseISODate(iso);
    return dt ? dt.getDay() : new Date().getDay();
  }

  function getWeekdayName(dayIndex) {
    const found = WEEKDAYS.find((w) => w.id === Number(dayIndex));
    return found ? found.name : '';
  }

  function formatDisplayDate(iso) {
    const dt = parseISODate(iso);
    if (!iso || !dt) return iso || '—';
    const today = getTodayISO();
    const weekday = dt.toLocaleDateString(undefined, { weekday: 'short' });
    const full = dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return iso === today ? `Today · ${weekday}, ${full}` : `${weekday}, ${full}`;
  }

  function formatShortDate(iso) {
    const dt = parseISODate(iso);
    if (!dt) return iso || '';
    return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function generateId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function toKg(weight, unit) {
    const n = Number(weight);
    if (!Number.isFinite(n)) return null;
    return unit === 'lb' ? n / KG_TO_LB : n;
  }

  function fromKg(weightKg, targetUnit) {
    const n = Number(weightKg);
    if (!Number.isFinite(n)) return null;
    return targetUnit === 'lb' ? n * KG_TO_LB : n;
  }

  function convertWeight(weight, fromUnit, toUnit) {
    if (weight === null || weight === undefined || weight === '') return null;
    const n = Number(weight);
    if (!Number.isFinite(n)) return null;
    if (fromUnit === toUnit) return n;
    return fromUnit === 'kg' ? n * KG_TO_LB : n / KG_TO_LB;
  }

  function roundNum(val, decimals = 1) {
    if (val === null || val === undefined || !Number.isFinite(Number(val))) return null;
    const factor = Math.pow(10, decimals);
    return Math.round(Number(val) * factor) / factor;
  }

  function calculateBMI(weightKg, heightCm) {
    const w = Number(weightKg);
    const h = Number(heightCm);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
    const meters = h / 100;
    return roundNum(w / (meters * meters), 1);
  }

  function formatWater(ml, unit) {
    if (ml === null || ml === undefined) return '—';
    const n = Number(ml);
    if (!Number.isFinite(n)) return '—';
    if (unit === 'L') return `${roundNum(n / 1000, 2)} L`;
    return `${Math.round(n)} ml`;
  }

  function esc(str) {
    return String(str === null || str === undefined ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function parseOptionalNumber(val) {
    if (val === '' || val === null || val === undefined) return null;
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  }

  // -------------------- Default State & Storage --------------------

  function createDefaultState() {
    const schedule = {};
    WEEKDAYS.forEach((w) => {
      schedule[String(w.id)] = { title: '', exercises: [] };
    });

    return {
      schemaVersion: SCHEMA_VERSION,
      profile: {
        name: '',
        heightCm: null,
        weightUnit: 'kg',
        waterUnit: 'ml',
        theme: 'light'
      },
      targets: {
        calories: null,
        protein: null,
        carbs: null,
        fat: null,
        fibre: null,
        sugar: null,
        sodium: null,
        water: 2500,
        sleep: null,
        steps: null,
        micronutrients: []
      },
      exercises: BUILTIN_EXERCISES.map((e) => ({ ...e })),
      schedule,
      workouts: [],
      nutritionLogs: {}, // { 'YYYY-MM-DD': [ { id, name, quantity, unit, calories, protein, carbs, fat, fibre, sugar, sodium, micronutrients: [] } ] }
      savedFoods: [],    // [ { id, name, baseQuantity, unit, calories, protein, carbs, fat, fibre, sugar, sodium, micronutrients: [] } ]
      weights: [],       // [ { id, date, weight, unit, heightCm } ]
      healthLogs: {},    // { 'YYYY-MM-DD': { water: number|null, sleep: number|null, steps: number|null } }
      workoutChecklists: {}, // { 'YYYY-MM-DD': { completed: string[], touched: boolean, status?: 'completed'|'missed' } }
      workoutOverrides: {}, // { 'YYYY-MM-DD': { type: 'rest'|'custom', title: string, exercises: [] } }
      photos: []         // [ { id, date, note, dataUrl, sizeBytes } ]
    };
  }

  function migrateAndNormalizeData(raw) {
    const base = createDefaultState();
    if (!raw || typeof raw !== 'object') return base;

    const merged = {
      schemaVersion: SCHEMA_VERSION,
      profile: {
        ...base.profile,
        ...(raw.profile && typeof raw.profile === 'object' ? raw.profile : {})
      },
      targets: {
        ...base.targets,
        ...(raw.targets && typeof raw.targets === 'object' ? raw.targets : {}),
        micronutrients: Array.isArray(raw.targets && raw.targets.micronutrients)
          ? raw.targets.micronutrients
          : []
      },
      exercises: (() => {
        const saved = Array.isArray(raw.exercises) ? raw.exercises : [];
        const byId = new Map(saved.map((e) => [e.id, e]));
        const mergedExercises = base.exercises.map((e) => ({ ...e, ...(byId.get(e.id) || {}) }));
        saved.filter((e) => e && e.custom && !mergedExercises.some((x) => x.id === e.id)).forEach((e) => mergedExercises.push(e));
        return mergedExercises;
      })(),
      schedule: { ...base.schedule },
      workouts: Array.isArray(raw.workouts) ? raw.workouts : [],
      nutritionLogs: raw.nutritionLogs && typeof raw.nutritionLogs === 'object' && !Array.isArray(raw.nutritionLogs)
        ? raw.nutritionLogs
        : {},
      savedFoods: Array.isArray(raw.savedFoods) ? raw.savedFoods : [],
      weights: Array.isArray(raw.weights) ? raw.weights : [],
      healthLogs: raw.healthLogs && typeof raw.healthLogs === 'object' && !Array.isArray(raw.healthLogs)
        ? raw.healthLogs
        : {},
      workoutChecklists: raw.workoutChecklists && typeof raw.workoutChecklists === 'object' && !Array.isArray(raw.workoutChecklists)
        ? raw.workoutChecklists
        : {},
      workoutOverrides: raw.workoutOverrides && typeof raw.workoutOverrides === 'object' && !Array.isArray(raw.workoutOverrides)
        ? raw.workoutOverrides
        : {},
      photos: Array.isArray(raw.photos) ? raw.photos : []
    };

    if (raw.schedule && typeof raw.schedule === 'object') {
      WEEKDAYS.forEach((w) => {
        const key = String(w.id);
        if (raw.schedule[key] && typeof raw.schedule[key] === 'object') {
          merged.schedule[key] = {
            title: String(raw.schedule[key].title || ''),
            exercises: Array.isArray(raw.schedule[key].exercises) ? raw.schedule[key].exercises : []
          };
        }
      });
    }

    if (merged.profile.weightUnit !== 'kg' && merged.profile.weightUnit !== 'lb') {
      merged.profile.weightUnit = 'kg';
    }
    if (merged.profile.waterUnit !== 'ml' && merged.profile.waterUnit !== 'L') {
      merged.profile.waterUnit = 'ml';
    }
    if (merged.profile.theme !== 'light' && merged.profile.theme !== 'dark') {
      merged.profile.theme = 'light';
    }

    return merged;
  }

  let state = createDefaultState();
  let storageAvailable = true;

  const uiState = {
    activeSection: 'home',
    homeDate: getTodayISO(),
    nutritionDate: getTodayISO(),
    workoutDate: getTodayISO(),
    homeMode: '',
    homeTrendDetailOpen: false,
    progressRange: '30',
    progressGranularity: 'daily',
    selectedStrengthExercise: '',
    compareWeekday: String(new Date().getDay()),
    compareCurrentId: '',
    compareBaselineId: '',
    libraryView: 'all',
    libraryMuscle: '',
    photoCompareA: '',
    photoCompareB: ''
  };

  function loadState() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        state = migrateAndNormalizeData(parsed);
      } else {
        state = createDefaultState();
        const savedTheme = window.localStorage.getItem(THEME_KEY);
        if (savedTheme === 'dark' || savedTheme === 'light') {
          state.profile.theme = savedTheme;
        }
      }
    } catch (err) {
      storageAvailable = false;
      state = createDefaultState();
    }
    applyTheme(state.profile.theme, false);
  }

  function saveState() {
    if (!storageAvailable) return { ok: true, inMemoryOnly: true };
    try {
      const serialized = JSON.stringify(state);
      window.localStorage.setItem(STORAGE_KEY, serialized);
      window.localStorage.setItem(THEME_KEY, state.profile.theme);
      return { ok: true };
    } catch (err) {
      if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
        showToast('Browser storage limit reached. Export a backup or remove older photos.', true);
        return { ok: false, quotaExceeded: true };
      }
      showToast('Could not save data to local storage.', true);
      return { ok: false, error: err };
    }
  }

  function getStorageStats() {
    const fullStr = JSON.stringify(state);
    const totalBytes = new Blob([fullStr]).size;
    const photosStr = JSON.stringify(state.photos);
    const photoBytes = new Blob([photosStr]).size;
    const pct = Math.min(100, roundNum((totalBytes / STORAGE_BUDGET_BYTES) * 100, 1));
    return {
      totalBytes,
      photoBytes,
      totalKB: roundNum(totalBytes / 1024, 1),
      photoKB: roundNum(photoBytes / 1024, 1),
      budgetMB: roundNum(STORAGE_BUDGET_BYTES / (1024 * 1024), 1),
      pct
    };
  }

  // -------------------- UI Feedback (Toast & Modal) --------------------

  function showToast(message, isError = false) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast${isError ? ' error' : ''}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
      el.remove();
    }, 3200);
  }

  function openModal({ title, bodyHtml, footerButtons = [], onOpen }) {
    const backdrop = document.getElementById('modal-backdrop');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    const footerEl = document.getElementById('modal-footer');

    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHtml;
    footerEl.innerHTML = '';

    footerButtons.forEach((btnCfg) => {
      const btn = document.createElement('button');
      btn.type = btnCfg.type || 'button';
      btn.className = `btn ${btnCfg.className || 'btn-secondary'}`;
      btn.textContent = btnCfg.label;
      if (btnCfg.id) btn.id = btnCfg.id;
      btn.addEventListener('click', () => {
        if (btnCfg.onClick) btnCfg.onClick();
      });
      footerEl.appendChild(btn);
    });

    backdrop.classList.remove('hidden');
    if (onOpen) onOpen(bodyEl);
  }

  function closeModal() {
    const backdrop = document.getElementById('modal-backdrop');
    backdrop.classList.add('hidden');
    document.getElementById('modal-body').innerHTML = '';
    document.getElementById('modal-footer').innerHTML = '';
  }

  function confirmAction({ title, message, confirmLabel = 'Confirm', danger = false, onConfirm }) {
    openModal({
      title,
      bodyHtml: `<p style="margin:0;font-size:0.9rem;color:var(--text-secondary);">${message}</p>`,
      footerButtons: [
        { label: 'Cancel', className: 'btn-secondary', onClick: closeModal },
        {
          label: confirmLabel,
          className: danger ? 'btn-danger' : 'btn-primary',
          id: 'modal-confirm-btn',
          onClick: () => {
            closeModal();
            onConfirm();
          }
        }
      ]
    });
  }

  // -------------------- Theme & Navigation --------------------

  function applyTheme(theme, persist = true) {
    const valid = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', valid);
    state.profile.theme = valid;

    const moon = document.getElementById('theme-icon-moon');
    const sun = document.getElementById('theme-icon-sun');
    if (moon && sun) {
      moon.classList.toggle('hidden', valid === 'dark');
      sun.classList.toggle('hidden', valid !== 'dark');
    }

    const profileThemeSelect = document.getElementById('profile-theme');
    if (profileThemeSelect) profileThemeSelect.value = valid;

    if (persist) {
      saveState();
      renderActiveSection();
    }
  }

  function navigateTo(sectionName, subtabId = null) {
    uiState.activeSection = sectionName;

    document.querySelectorAll('.page-section').forEach((sec) => {
      sec.classList.toggle('active', sec.id === `section-${sectionName}`);
    });
    document.querySelectorAll('.nav-btn, .bottom-nav-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.section === sectionName);
    });

    if (subtabId) {
      activateSubtab(sectionName, subtabId);
    }

    renderActiveSection();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function activateSubtab(sectionName, subtabId) {
    const section = document.getElementById(`section-${sectionName}`);
    if (!section) return;
    section.querySelectorAll('.subtab-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.subtab === subtabId);
    });
    section.querySelectorAll('.subtab-panel').forEach((p) => {
      p.classList.toggle('active', p.id === `subtab-${subtabId}`);
    });
  }

  function renderHeaderGreeting() {
    const el = document.getElementById('header-greeting');
    if (!el) return;
    el.textContent = state.profile.name
      ? `${state.profile.name} · Health Record`
      : 'Personal Health Record';
  }

  function renderActiveSection() {
    renderHeaderGreeting();
    switch (uiState.activeSection) {
      case 'home':
        renderHome();
        break;
      case 'workouts':
        renderWorkouts();
        break;
      case 'nutrition':
        renderNutrition();
        break;
      case 'progress':
        renderProgress();
        break;
      case 'profile':
        renderProfile();
        break;
    }
  }

  // -------------------- Data Aggregation Helpers --------------------

  function getNutritionTotalsForDate(dateISO) {
    const entries = state.nutritionLogs[dateISO];
    if (!Array.isArray(entries) || entries.length === 0) {
      return {
        hasEntries: false,
        count: 0,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fibre: 0,
        sugar: 0,
        sodium: 0,
        micronutrients: {}
      };
    }

    const totals = {
      hasEntries: true,
      count: entries.length,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fibre: 0,
      sugar: 0,
      sodium: 0,
      micronutrients: {}
    };

    entries.forEach((item) => {
      totals.calories += Number(item.calories) || 0;
      totals.protein += Number(item.protein) || 0;
      totals.carbs += Number(item.carbs) || 0;
      totals.fat += Number(item.fat) || 0;
      totals.fibre += Number(item.fibre) || 0;
      totals.sugar += Number(item.sugar) || 0;
      totals.sodium += Number(item.sodium) || 0;
      if (Array.isArray(item.micronutrients)) {
        item.micronutrients.forEach((m) => {
          if (!m || !m.name) return;
          const key = m.name.trim().toLowerCase();
          if (!totals.micronutrients[key]) {
            totals.micronutrients[key] = { name: m.name.trim(), unit: m.unit || '', amount: 0 };
          }
          totals.micronutrients[key].amount += Number(m.amount) || 0;
        });
      }
    });

    totals.calories = roundNum(totals.calories, 0);
    totals.protein = roundNum(totals.protein, 1);
    totals.carbs = roundNum(totals.carbs, 1);
    totals.fat = roundNum(totals.fat, 1);
    totals.fibre = roundNum(totals.fibre, 1);
    totals.sugar = roundNum(totals.sugar, 1);
    totals.sodium = roundNum(totals.sodium, 0);

    return totals;
  }

  function getLatestWeightEntry() {
    if (!state.weights.length) return null;
    const sorted = [...state.weights].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    return sorted[0];
  }

  function getHealthLogForDate(dateISO) {
    return state.healthLogs[dateISO] || { water: null, sleep: null, steps: null };
  }

  function ensureHealthLog(dateISO) {
    if (!state.healthLogs[dateISO]) {
      state.healthLogs[dateISO] = { water: null, sleep: null, steps: null };
    }
    return state.healthLogs[dateISO];
  }

  function getEquipmentHint(eq) {
    if (eq === 'Dumbbell') return 'Enter weight per hand.';
    if (eq === 'Machine stack') return 'Enter displayed machine-stack weight.';
    if (eq === 'Bodyweight') return 'Weight is optional for bodyweight exercises.';
    return 'Total barbell load (bar + plates).';
  }

  // -------------------- Custom Interactive SVG Chart Engine --------------------

  const tooltipEl = document.getElementById('chart-tooltip');

  function showChartTooltip(evt, html) {
    if (!tooltipEl) return;
    tooltipEl.innerHTML = html;
    tooltipEl.classList.remove('hidden');
    const pad = 12;
    const x = evt.clientX || (evt.touches && evt.touches[0] ? evt.touches[0].clientX : 0);
    const y = evt.clientY || (evt.touches && evt.touches[0] ? evt.touches[0].clientY : 0);
    const rect = tooltipEl.getBoundingClientRect();
    let left = x + pad;
    let top = y - rect.height - pad;
    if (left + rect.width > window.innerWidth - 8) left = x - rect.width - pad;
    if (top < 8) top = y + pad;
    tooltipEl.style.left = `${Math.max(8, left)}px`;
    tooltipEl.style.top = `${Math.max(8, top)}px`;
  }

  function hideChartTooltip() {
    if (tooltipEl) tooltipEl.classList.add('hidden');
  }

  /**
   * Renders an honest, responsive SVG chart (line, bar, or multi-line).
   * Missing points are `null` and rendered as explicit gaps (never coerced to 0).
   */
  function renderSVGChart(containerEl, config) {
    if (!containerEl) return;
    const {
      labels = [],
      series = [], // [{ name, color, values: (number|null)[], unit, meta?: string[] }]
      type = 'line',
      targetValue = null,
      emptyMessage = 'No logged data in this date range.',
      yMinZero = false
    } = config;

    const allValidValues = [];
    series.forEach((s) => {
      s.values.forEach((v) => {
        if (v !== null && v !== undefined && Number.isFinite(Number(v))) {
          allValidValues.push(Number(v));
        }
      });
    });

    if (allValidValues.length === 0) {
      containerEl.innerHTML = `<div class="empty-state">${esc(emptyMessage)}</div>`;
      return;
    }

    if (targetValue !== null && Number.isFinite(Number(targetValue))) {
      allValidValues.push(Number(targetValue));
    }

    let minVal = Math.min(...allValidValues);
    let maxVal = Math.max(...allValidValues);
    if (yMinZero && minVal > 0) minVal = 0;
    if (minVal === maxVal) {
      const delta = minVal === 0 ? 10 : Math.abs(minVal) * 0.15;
      minVal = yMinZero ? 0 : minVal - delta;
      maxVal = maxVal + delta;
    } else {
      const padVal = (maxVal - minVal) * 0.12;
      minVal = yMinZero ? Math.max(0, minVal - padVal) : minVal - padVal;
      maxVal = maxVal + padVal;
    }

    const width = 560;
    const height = 210;
    const padL = 48;
    const padR = 16;
    const padT = 16;
    const padB = 30;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const count = labels.length;
    const xPos = (i) => {
      if (count <= 1) return padL + plotW / 2;
      if (type === 'bar') {
        const step = plotW / count;
        return padL + step * i + step / 2;
      }
      return padL + (i / (count - 1)) * plotW;
    };
    const yPos = (val) => {
      const ratio = (val - minVal) / (maxVal - minVal || 1);
      return padT + plotH - ratio * plotH;
    };

    const yTicks = 4;
    let gridSvg = '';
    for (let t = 0; t <= yTicks; t++) {
      const v = minVal + ((maxVal - minVal) * t) / yTicks;
      const y = yPos(v);
      const labelTxt = Math.abs(v) >= 1000 ? `${roundNum(v / 1000, 1)}k` : `${roundNum(v, 1)}`;
      gridSvg += `
        <line x1="${padL}" y1="${y}" x2="${width - padR}" y2="${y}" stroke="var(--border)" stroke-width="1" />
        <text x="${padL - 8}" y="${y + 4}" text-anchor="end" font-size="10.5" fill="var(--text-muted)">${labelTxt}</text>
      `;
    }

    // Target line
    let targetSvg = '';
    if (targetValue !== null && Number.isFinite(Number(targetValue))) {
      const ty = yPos(Number(targetValue));
      targetSvg = `
        <line x1="${padL}" y1="${ty}" x2="${width - padR}" y2="${ty}" stroke="var(--accent)" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.7" />
        <text x="${width - padR}" y="${ty - 4}" text-anchor="end" font-size="9.5" fill="var(--accent)">Target: ${roundNum(targetValue, 1)}</text>
      `;
    }

    // X-axis labels (max ~6 labels)
    let xAxisSvg = '';
    const maxLabels = 6;
    const stepIdx = count <= maxLabels ? 1 : Math.ceil((count - 1) / (maxLabels - 1));
    for (let i = 0; i < count; i += stepIdx) {
      const x = xPos(i);
      xAxisSvg += `<text x="${x}" y="${height - 8}" text-anchor="middle" font-size="10" fill="var(--text-muted)">${esc(labels[i])}</text>`;
    }
    if (count > 1 && (count - 1) % stepIdx !== 0 && count - 1 - Math.floor((count - 1) / stepIdx) * stepIdx >= stepIdx / 2) {
      xAxisSvg += `<text x="${xPos(count - 1)}" y="${height - 8}" text-anchor="middle" font-size="10" fill="var(--text-muted)">${esc(labels[count - 1])}</text>`;
    }

    // Series geometry
    let seriesSvg = '';
    let hitSvg = '';

    if (type === 'bar' && series.length === 1) {
      const s = series[0];
      const barSlot = plotW / Math.max(count, 1);
      const barW = Math.max(4, Math.min(28, barSlot * 0.62));
      const baseZeroY = yPos(Math.max(0, minVal));

      s.values.forEach((v, i) => {
        if (v === null || v === undefined || !Number.isFinite(Number(v))) return;
        const val = Number(v);
        const cx = xPos(i);
        const y = yPos(val);
        const barH = Math.max(2, baseZeroY - y);
        seriesSvg += `<rect x="${cx - barW / 2}" y="${y}" width="${barW}" height="${barH}" rx="2.5" fill="${s.color}" opacity="0.88" />`;
        const meta = s.meta && s.meta[i] ? `<br>${esc(s.meta[i])}` : '';
        const tip = `<strong>${esc(labels[i])}</strong><br>${esc(s.name)}: ${roundNum(val, 1)} ${esc(s.unit || '')}${meta}`;
        hitSvg += `<rect class="chart-hit" data-tip="${esc(tip)}" x="${cx - barSlot / 2}" y="${padT}" width="${barSlot}" height="${plotH}" fill="transparent" style="cursor:pointer" />`;
      });
    } else {
      series.forEach((s) => {
        // Split into contiguous non-null segments so missing entries stay as honest gaps
        let segment = [];
        const flushSegment = () => {
          if (segment.length >= 2) {
            const d = segment.map((pt, idx) => `${idx === 0 ? 'M' : 'L'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');
            seriesSvg += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />`;
          }
          segment = [];
        };

        s.values.forEach((v, i) => {
          if (v === null || v === undefined || !Number.isFinite(Number(v))) {
            flushSegment();
            return;
          }
          const pt = { x: xPos(i), y: yPos(Number(v)), val: Number(v), idx: i };
          segment.push(pt);
          seriesSvg += `<circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="3.6" fill="var(--surface)" stroke="${s.color}" stroke-width="2" />`;
          const meta = s.meta && s.meta[i] ? `<br>${esc(s.meta[i])}` : '';
          const tip = `<strong>${esc(labels[i])}</strong><br>${esc(s.name)}: ${roundNum(pt.val, 1)} ${esc(s.unit || '')}${meta}`;
          hitSvg += `<circle class="chart-hit" data-tip="${esc(tip)}" cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="11" fill="transparent" style="cursor:pointer" />`;
        });
        flushSegment();
      });
    }

    let legendHtml = '';
    if (series.length > 1) {
      legendHtml = `<div class="chart-legend">${series
        .map((s) => `<span><span class="legend-dot" style="background:${s.color}"></span>${esc(s.name)}</span>`)
        .join('')}</div>`;
    }

    containerEl.innerHTML = `
      ${legendHtml}
      <svg class="chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
        ${gridSvg}
        ${targetSvg}
        ${seriesSvg}
        ${xAxisSvg}
        ${hitSvg}
      </svg>
    `;

    containerEl.querySelectorAll('.chart-hit').forEach((el) => {
      el.addEventListener('mouseenter', (e) => showChartTooltip(e, el.dataset.tip));
      el.addEventListener('mousemove', (e) => showChartTooltip(e, el.dataset.tip));
      el.addEventListener('mouseleave', hideChartTooltip);
      el.addEventListener('click', (e) => {
        showChartTooltip(e, el.dataset.tip);
        setTimeout(hideChartTooltip, 2600);
      });
    });
  }

  // -------------------- SECTION 1: HOME DASHBOARD --------------------

  function isGymModeNow() {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 12;
  }

  function renderHomeClock() {
    const now = new Date();
    const timeEl = document.getElementById("home-current-time");
    const dateEl = document.getElementById("home-current-date");
    if (timeEl) timeEl.textContent = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    if (dateEl) dateEl.textContent = now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }

  function ensureScheduleExerciseIds() {
    let changed = false;
    const plans = [...Object.values(state.schedule || {}), ...Object.values(state.workoutOverrides || {})];
    plans.forEach((plan) => {
      if (!plan || !Array.isArray(plan.exercises)) return;
      plan.exercises.forEach((exercise) => {
        if (!exercise.scheduleId) { exercise.scheduleId = generateId("planex"); changed = true; }
      });
    });
    if (changed) saveState();
  }

  function getWorkoutPlanForDate(dateISO) {
    const override = state.workoutOverrides && state.workoutOverrides[dateISO];
    if (override) return { ...override, isOverride: true };
    const weekday = String(getWeekdayFromISO(dateISO));
    const plan = state.schedule[weekday] || { title: '', exercises: [] };
    return { ...plan, type: plan.exercises && plan.exercises.length ? 'custom' : 'rest', isOverride: false };
  }

  function getHomeTargets() {
    return {
      water: Number(state.targets.water) > 0 ? Number(state.targets.water) : 2500,
      sleep: Number(state.targets.sleep) > 0 ? Number(state.targets.sleep) : 7,
      steps: Number(state.targets.steps) > 0 ? Number(state.targets.steps) : 7000
    };
  }

  function getWorkoutCompletionPercent(dateISO) {
    const plan = getWorkoutPlanForDate(dateISO);
    if (plan.type === 'rest' || !Array.isArray(plan.exercises) || !plan.exercises.length) return null;
    const daily = state.workoutChecklists[dateISO];
    if (!daily || daily.touched !== true || !Array.isArray(daily.completed)) return null;
    const completed = new Set(daily.completed);
    const count = plan.exercises.filter((exercise) => completed.has(exercise.scheduleId)).length;
    return Math.round((count / plan.exercises.length) * 100);
  }

  function getHomeTrendSeries(days) {
    const dates = [];
    for (let i = days - 1; i >= 0; i--) dates.push(shiftISODate(uiState.homeDate, -i));
    const targets = getHomeTargets();
    return {
      dates: dates,
      labels: dates.map((dateISO) => formatShortDate(dateISO)),
      workoutValues: dates.map((dateISO) => getWorkoutCompletionPercent(dateISO)),
      waterValues: dates.map((dateISO) => {
        const log = state.healthLogs[dateISO];
        return log && log.water !== null && log.water !== undefined
          ? Math.min(100, Math.round((Number(log.water) / targets.water) * 100))
          : null;
      }),
      sleepValues: dates.map((dateISO) => {
        const log = state.healthLogs[dateISO];
        return log && log.sleep !== null && log.sleep !== undefined
          ? Math.min(100, Math.round((Number(log.sleep) / targets.sleep) * 100))
          : null;
      })
    };
  }

  function renderHome() {
    ensureScheduleExerciseIds();
    const dateISO = uiState.homeDate;
    const gymMode = isGymModeNow();
    uiState.homeMode = gymMode ? "gym" : "normal";

    document.getElementById("home-date-picker").value = dateISO;
    document.getElementById("home-date-label").textContent = "Selected date · " + formatDisplayDate(dateISO);
    renderHomeClock();

    document.getElementById("home-gym-mode").classList.toggle("hidden", !gymMode);
    document.getElementById("home-normal-mode").classList.toggle("hidden", gymMode);
    document.getElementById("quick-workout-action").classList.toggle("hidden", !gymMode);
    const detailOpen = uiState.homeTrendDetailOpen && !gymMode;
    document.getElementById("home-dashboard-view").classList.toggle("hidden", detailOpen);
    document.getElementById("home-trends-detail").classList.toggle("hidden", !detailOpen);

    if (gymMode) renderHomeGymMode(dateISO);
    else renderHomeNormalMode(dateISO);
  }

  function renderHomeGymMode(dateISO) {
    const plan = getWorkoutPlanForDate(dateISO);
    const weekday = String(getWeekdayFromISO(dateISO));
    const note = document.getElementById("home-gym-date-note");
    const container = document.getElementById("home-gym-workout");
    document.getElementById("home-gym-heading").textContent = dateISO === getTodayISO() ? "Today's Workout" : "Scheduled Workout";
    note.textContent = formatDisplayDate(dateISO) + " · " + (plan.title || getWeekdayName(weekday)) + (plan.isOverride ? " · Date override" : "");
    if (plan.type === "rest" || !plan.exercises || !plan.exercises.length) {
      container.innerHTML = '<div class="home-rest-state"><div class="home-rest-icon" aria-hidden="true">✓</div><strong>Rest day</strong><span>' +
        esc(plan.isOverride ? "A rest day was set for this date." : getWeekdayName(weekday) + " is set as a rest day.") +
        '</span><button type="button" class="btn btn-secondary btn-sm" id="home-open-schedule">View workout plan</button></div>';
      document.getElementById("home-open-schedule").addEventListener("click", () => navigateTo("workouts", "workouts-schedule"));
      return;
    }
    const daily = state.workoutChecklists[dateISO] || { completed: [], touched: false };
    const completed = new Set(Array.isArray(daily.completed) ? daily.completed : []);
    const completedCount = plan.exercises.filter((exercise) => completed.has(exercise.scheduleId)).length;
    const total = plan.exercises.length;
    const percent = Math.round((completedCount / total) * 100);
    const rows = plan.exercises.map((exercise) => {
      const id = String(exercise.scheduleId);
      const isDone = completed.has(id);
      return '<label class="home-checklist-row ' + (isDone ? "is-complete" : "") + '">' +
        '<input type="checkbox" data-home-exercise="' + esc(id) + '" ' + (isDone ? "checked" : "") + '>' +
        '<span class="home-checklist-copy"><strong>' + esc(exercise.name || "Exercise") + '</strong>' +
        '<span>' + (Number(exercise.defaultSets) || 3) + ' sets × ' + (Number(exercise.defaultReps) || 10) + ' reps</span></span>' +
        '<span class="home-checkmark" aria-hidden="true">✓</span></label>';
    }).join("");
    container.innerHTML = '<div class="home-workout-progress"><div class="flex-between"><span class="metric-sub">' +
      completedCount + ' of ' + total + ' exercises completed</span><strong class="home-workout-percent">' + percent +
      '%</strong></div><div class="progress-track"><div class="progress-fill" style="width:' + percent + '%"></div></div></div>' +
      '<div class="home-checklist">' + rows + '</div><div class="home-workout-footer"><span class="metric-sub">Checklist is saved for this date.</span>' +
      '<button type="button" class="link-btn" id="home-open-schedule">Edit this date</button></div>';
    container.querySelectorAll("[data-home-exercise]").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const current = state.workoutChecklists[dateISO] || { completed: [], touched: false };
        const completedIds = new Set(Array.isArray(current.completed) ? current.completed : []);
        if (checkbox.checked) completedIds.add(checkbox.dataset.homeExercise);
        else completedIds.delete(checkbox.dataset.homeExercise);
        const nextCompleted = Array.from(completedIds);
        const allDone = plan.exercises.every((exercise) => completedIds.has(String(exercise.scheduleId)));
        state.workoutChecklists[dateISO] = { ...current, completed: nextCompleted, touched: true, status: allDone ? "completed" : "in_progress", updatedAt: new Date().toISOString() };
        saveState();
        renderHome();
      });
    });
    document.getElementById("home-open-schedule").addEventListener("click", () => navigateTo("workouts", "workouts-today"));
  }

  function renderHomeNormalMode(dateISO) {
    const log = getHealthLogForDate(dateISO);
    const targets = getHomeTargets();
    const water = log.water;
    const sleep = log.sleep;
    const steps = log.steps;
    const waterPercent = water === null ? null : Math.min(100, Math.round((Number(water) / targets.water) * 100));
    const sleepPercent = sleep === null ? null : Math.min(100, Math.round((Number(sleep) / targets.sleep) * 100));
    const stepsPercent = steps === null ? null : Math.min(100, Math.round((Number(steps) / targets.steps) * 100));
    const latestWeight = getLatestWeightEntry();
    const prefUnit = state.profile.weightUnit;

    document.getElementById("home-water-card").innerHTML =
      '<div class="metric-value">' + (water !== null ? formatWater(water, state.profile.waterUnit) : "—") + '</div>' +
      '<div class="metric-sub">Target: ' + formatWater(targets.water, state.profile.waterUnit) +
      (waterPercent !== null ? " · " + waterPercent + "%" : " · Not recorded") + '</div>' +
      '<div class="progress-track"><div class="progress-fill series-2" style="width:' + (waterPercent === null ? 0 : waterPercent) + '%"></div></div>';

    document.getElementById("home-sleep-card").innerHTML =
      '<div class="metric-value">' + (sleep !== null ? roundNum(sleep, 1) + '<span class="metric-unit">hrs</span>' : "—") + '</div>' +
      '<div class="metric-sub">Target: ' + targets.sleep + ' hrs' +
      (sleepPercent !== null ? " · " + sleepPercent + "%" : " · Not recorded") + '</div>' +
      '<div class="progress-track"><div class="progress-fill" style="width:' + (sleepPercent === null ? 0 : sleepPercent) + '%"></div></div>';

    document.getElementById("home-steps-card").innerHTML =
      '<div class="metric-value">' + (steps !== null ? Number(steps).toLocaleString() : "—") + '</div>' +
      '<div class="metric-sub">Target: ' + Number(targets.steps).toLocaleString() +
      (stepsPercent !== null ? " · " + stepsPercent + "%" : " · Not recorded") + '</div>' +
      '<div class="progress-track"><div class="progress-fill series-3" style="width:' + (stepsPercent === null ? 0 : stepsPercent) + '%"></div></div>';

    if (latestWeight) {
      const displayWeight = roundNum(convertWeight(latestWeight.weight, latestWeight.unit, prefUnit), 1);
      document.getElementById("home-body-weight-card").innerHTML =
        '<div class="metric-value">' + displayWeight + '<span class="metric-unit">' + prefUnit + '</span></div>' +
        '<div class="metric-sub">Latest record · ' + formatShortDate(latestWeight.date) + '</div>' +
        '<div class="metric-sub">Trend only · no target</div>';
    } else {
      document.getElementById("home-body-weight-card").innerHTML =
        '<div class="metric-value">—</div><div class="metric-sub">No weight recorded yet</div>' +
        '<div class="metric-sub">Trend only · no target</div>';
    }

    renderHomeCombinedChart();
    if (uiState.homeTrendDetailOpen) renderHomeDetailedCharts();
  }

  function renderHomeCombinedChart() {
    const data = getHomeTrendSeries(7);
    renderSVGChart(document.getElementById("home-combined-chart"), {
      labels: data.labels,
      series: [
        { name: "Workout completion", color: "var(--accent)", values: data.workoutValues, unit: "%" },
        { name: "Water", color: "var(--series-2)", values: data.waterValues, unit: "%" },
        { name: "Sleep", color: "var(--series-4)", values: data.sleepValues, unit: "%" }
      ],
      type: "line",
      targetValue: 100,
      yMinZero: true,
      emptyMessage: "Your trends will appear here as you record workouts, water and sleep."
    });
  }

  function renderHomeDetailedCharts() {
    const data = getHomeTrendSeries(30);
    const common = { labels: data.labels, type: "line", targetValue: 100, yMinZero: true };
    renderSVGChart(document.getElementById("home-detail-workout-chart"), {
      ...common,
      series: [{ name: "Workout completion", color: "var(--accent)", values: data.workoutValues, unit: "%" }],
      emptyMessage: "No workout completion records in this period."
    });
    renderSVGChart(document.getElementById("home-detail-water-chart"), {
      ...common,
      series: [{ name: "Water", color: "var(--series-2)", values: data.waterValues, unit: "%" }],
      emptyMessage: "No water records in this period."
    });
    renderSVGChart(document.getElementById("home-detail-sleep-chart"), {
      ...common,
      series: [{ name: "Sleep", color: "var(--series-4)", values: data.sleepValues, unit: "%" }],
      emptyMessage: "No sleep records in this period."
    });
  }

  function updateHomeClock() {
    const nextMode = isGymModeNow() ? "gym" : "normal";
    const quickWorkout = document.getElementById("quick-workout-action");
    if (quickWorkout) quickWorkout.classList.toggle("hidden", nextMode !== "gym");
    if (uiState.homeMode && uiState.homeMode !== nextMode && uiState.activeSection === "home") {
      renderHome();
      return;
    }
    renderHomeClock();
  }

  function renderProgressRow(label, current, target, unit, colorClass) {
    const hasTarget = target !== null && target !== undefined && Number(target) > 0;
    const pctRaw = hasTarget ? (current / target) * 100 : 0;
    const pct = Math.min(100, Math.max(0, pctRaw));
    const over = hasTarget && current > target;
    const rem = hasTarget ? roundNum(target - current, 1) : null;
    const numsText = hasTarget
      ? `${current} / ${target} ${unit} (${Math.round(pctRaw)}% · ${rem >= 0 ? `${rem} left` : `${Math.abs(rem)} over`})`
      : `${current} ${unit} (no target)`;

    return `
      <div class="progress-item">
        <div class="progress-item-header">
          <span class="progress-item-name">${esc(label)}</span>
          <span class="progress-item-nums">${numsText}</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill ${over ? 'over' : colorClass}" style="width:${hasTarget ? pct : (current > 0 ? 100 : 0)}%"></div>
        </div>
      </div>
    `;
  }

  // -------------------- Quick Log Modals --------------------

  function openQuickWeightModal(existingEntry = null) {
    const prefUnit = existingEntry ? existingEntry.unit : state.profile.weightUnit;
    const defaultHeight = existingEntry ? (existingEntry.heightCm || '') : (state.profile.heightCm || '');
    openModal({
      title: existingEntry ? 'Edit Body Weight' : 'Log Body Weight',
      bodyHtml: `
        <form id="modal-weight-form" class="form-stack">
          <div class="form-row-2">
            <div class="form-group">
              <label for="mw-date">Date</label>
              <input type="date" id="mw-date" value="${esc(existingEntry ? existingEntry.date : uiState.homeDate)}" required>
            </div>
            <div class="form-group">
              <label for="mw-unit">Unit</label>
              <select id="mw-unit">
                <option value="kg" ${prefUnit === 'kg' ? 'selected' : ''}>kg</option>
                <option value="lb" ${prefUnit === 'lb' ? 'selected' : ''}>lb</option>
              </select>
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label for="mw-weight">Body Weight</label>
              <input type="number" id="mw-weight" step="0.1" min="20" max="500" value="${existingEntry ? existingEntry.weight : ''}" placeholder="e.g. 74.5" required>
            </div>
            <div class="form-group">
              <label for="mw-height">Height for BMI (cm, optional)</label>
              <input type="number" id="mw-height" step="0.1" min="50" max="260" value="${defaultHeight}" placeholder="From Profile">
            </div>
          </div>
        </form>
      `,
      footerButtons: [
        { label: 'Cancel', className: 'btn-secondary', onClick: closeModal },
        {
          label: existingEntry ? 'Update Weight' : 'Save Weight',
          className: 'btn-primary',
          onClick: () => {
            const date = document.getElementById('mw-date').value;
            const weight = parseOptionalNumber(document.getElementById('mw-weight').value);
            const unit = document.getElementById('mw-unit').value;
            const heightCm = parseOptionalNumber(document.getElementById('mw-height').value);
            if (!date || weight === null || weight <= 0) {
              showToast('Please enter a valid date and positive weight.', true);
              return;
            }
            if (existingEntry) {
              existingEntry.date = date;
              existingEntry.weight = weight;
              existingEntry.unit = unit;
              existingEntry.heightCm = heightCm;
            } else {
              state.weights.push({
                id: generateId('wt'),
                date,
                weight,
                unit,
                heightCm: heightCm !== null ? heightCm : state.profile.heightCm
              });
            }
            if (heightCm !== null && !state.profile.heightCm) {
              state.profile.heightCm = heightCm;
            }
            saveState();
            closeModal();
            renderActiveSection();
            showToast('Body weight saved.');
          }
        }
      ]
    });
  }

  function openQuickHealthModal(type, dateISO = uiState.homeDate) {
    const existing = getHealthLogForDate(dateISO);
    const meta = {
      water: { title: 'Log Water Intake', label: 'Total Water (ml)', step: '50', placeholder: 'e.g. 2500', value: existing.water },
      sleep: { title: 'Log Sleep Duration', label: 'Sleep Duration (hours)', step: '0.25', placeholder: 'e.g. 7.5', value: existing.sleep },
      steps: { title: 'Log Daily Steps', label: 'Daily Steps', step: '1', placeholder: 'e.g. 8500', value: existing.steps }
    }[type];

    openModal({
      title: meta.title,
      bodyHtml: `
        <form id="modal-health-form" class="form-stack">
          <div class="form-group">
            <label for="mh-date">Date</label>
            <input type="date" id="mh-date" value="${esc(dateISO)}" required>
          </div>
          <div class="form-group">
            <label for="mh-value">${meta.label}</label>
            <input type="number" id="mh-value" min="0" ${type === 'sleep' ? 'max="24"' : ''} step="${meta.step}" value="${meta.value !== null && meta.value !== undefined ? meta.value : ''}" placeholder="${meta.placeholder}" required>
          </div>
          <p class="card-note">Entering 0 records an explicit zero; leave blank or clear to remove the entry.</p>
        </form>
      `,
      footerButtons: [
        { label: 'Cancel', className: 'btn-secondary', onClick: closeModal },
        {
          label: 'Save',
          className: 'btn-primary',
          onClick: () => {
            const d = document.getElementById('mh-date').value;
            const rawVal = document.getElementById('mh-value').value;
            const val = parseOptionalNumber(rawVal);
            if (!d) {
              showToast('Please select a date.', true);
              return;
            }
            if (val !== null && val < 0) {
              showToast('Value cannot be negative.', true);
              return;
            }
            if (type === 'sleep' && val !== null && val > 24) {
              showToast('Sleep duration cannot exceed 24 hours.', true);
              return;
            }
            const log = ensureHealthLog(d);
            log[type] = val;
            if (log.water === null && log.sleep === null && log.steps === null) {
              delete state.healthLogs[d];
            }
            saveState();
            closeModal();
            renderActiveSection();
            showToast(`${meta.title.replace('Log ', '')} saved.`);
          }
        }
      ]
    });
  }

  // -------------------- SECTION 2: WORKOUTS --------------------

  function startWorkoutForDate(dateISO, loadScheduled = false) {
    navigateTo('workouts', 'workouts-log');
    resetWorkoutForm(dateISO);
    if (loadScheduled) {
      loadWeekdayScheduleIntoForm();
    }
  }

  function resetWorkoutForm(dateISO = getTodayISO()) {
    document.getElementById('workout-edit-id').value = '';
    document.getElementById('workout-form-title').textContent = 'Log Workout Session';
    document.getElementById('workout-submit-btn').textContent = 'Save Workout';
    document.getElementById('workout-cancel-edit').classList.add('hidden');
    document.getElementById('workout-date').value = dateISO;
    document.getElementById('workout-title').value = '';
    document.getElementById('workout-notes').value = '';
    const rowsEl = document.getElementById('workout-exercise-rows');
    rowsEl.innerHTML = '';
    addWorkoutExerciseRow();
  }

  function addWorkoutExerciseRow(prefill = null) {
    const rowsEl = document.getElementById('workout-exercise-rows');
    const row = document.createElement('div');
    row.className = 'exercise-row-card';
    const prefUnit = prefill && prefill.unit ? prefill.unit : state.profile.weightUnit;
    const eq = prefill && prefill.equipment ? prefill.equipment : (state.exercises[0] ? state.exercises[0].equipment : 'Barbell');

    const optionsHtml = state.exercises
      .map((ex) => `<option value="${esc(ex.name)}" data-eq="${esc(ex.equipment)}" ${prefill && prefill.name === ex.name ? 'selected' : ''}>${esc(ex.name)} (${esc(ex.equipment)})</option>`)
      .join('');

    const isCustomName = prefill && prefill.name && !state.exercises.some((e) => e.name === prefill.name);

    row.innerHTML = `
      <div class="exercise-row-head">
        <span class="exercise-hint">${esc(getEquipmentHint(eq))}</span>
        <button type="button" class="btn btn-ghost btn-sm btn-remove-ex-row">Remove</button>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Exercise</label>
          <select class="ex-name-select">
            ${optionsHtml}
            ${isCustomName ? `<option value="${esc(prefill.name)}" selected>${esc(prefill.name)}</option>` : ''}
          </select>
        </div>
        <div class="form-group">
          <label>Equipment</label>
          <select class="ex-eq-select">
            ${EQUIPMENT_TYPES.map((t) => `<option value="${t}" ${t === eq ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row-4">
        <div class="form-group">
          <label>Sets</label>
          <input type="number" class="ex-sets-input" min="1" max="100" step="1" value="${prefill ? prefill.sets : 3}" required>
        </div>
        <div class="form-group">
          <label>Reps</label>
          <input type="number" class="ex-reps-input" min="1" max="500" step="1" value="${prefill ? prefill.reps : 10}" required>
        </div>
        <div class="form-group">
          <label class="ex-weight-label">${eq === 'Dumbbell' ? 'Weight / hand' : eq === 'Machine stack' ? 'Stack weight' : eq === 'Bodyweight' ? 'Added wt (opt)' : 'Weight'}</label>
          <input type="number" class="ex-weight-input" min="0" step="0.5" value="${prefill && prefill.weight !== null && prefill.weight !== undefined ? prefill.weight : ''}" placeholder="${eq === 'Bodyweight' ? 'Bodyweight' : 'e.g. 60'}">
        </div>
        <div class="form-group">
          <label>Unit</label>
          <select class="ex-unit-select">
            <option value="kg" ${prefUnit === 'kg' ? 'selected' : ''}>kg</option>
            <option value="lb" ${prefUnit === 'lb' ? 'selected' : ''}>lb</option>
          </select>
        </div>
      </div>
    `;

    const nameSel = row.querySelector('.ex-name-select');
    const eqSel = row.querySelector('.ex-eq-select');
    const hintEl = row.querySelector('.exercise-hint');
    const weightLabel = row.querySelector('.ex-weight-label');
    const weightInput = row.querySelector('.ex-weight-input');

    function syncEquipmentUI() {
      const curEq = eqSel.value;
      hintEl.textContent = getEquipmentHint(curEq);
      weightLabel.textContent =
        curEq === 'Dumbbell' ? 'Weight / hand' :
        curEq === 'Machine stack' ? 'Stack weight' :
        curEq === 'Bodyweight' ? 'Added wt (opt)' : 'Weight';
      weightInput.placeholder = curEq === 'Bodyweight' ? 'Bodyweight' : 'e.g. 60';
    }

    nameSel.addEventListener('change', () => {
      const opt = nameSel.selectedOptions[0];
      if (opt && opt.dataset.eq) {
        eqSel.value = opt.dataset.eq;
        syncEquipmentUI();
      }
    });

    eqSel.addEventListener('change', syncEquipmentUI);

    row.querySelector('.btn-remove-ex-row').addEventListener('click', () => {
      if (rowsEl.children.length <= 1) {
        showToast('A workout session needs at least one exercise.', true);
        return;
      }
      row.remove();
    });

    rowsEl.appendChild(row);
  }

  function loadWeekdayScheduleIntoForm() {
    const dateISO = document.getElementById('workout-date').value || getTodayISO();
    const wd = String(getWeekdayFromISO(dateISO));
    const plan = state.schedule[wd];
    if (!plan || (!plan.title && plan.exercises.length === 0)) {
      showToast(`No workout scheduled for ${getWeekdayName(wd)}. Configure one in the Schedule tab.`);
      return;
    }
    document.getElementById('workout-title').value = plan.title || `${getWeekdayName(wd)} Session`;
    const rowsEl = document.getElementById('workout-exercise-rows');
    rowsEl.innerHTML = '';
    if (plan.exercises.length === 0) {
      addWorkoutExerciseRow();
    } else {
      plan.exercises.forEach((ex) => {
        addWorkoutExerciseRow({
          name: ex.name,
          equipment: ex.equipment,
          sets: ex.defaultSets || 3,
          reps: ex.defaultReps || 10,
          weight: '',
          unit: state.profile.weightUnit
        });
      });
    }
    showToast(`Loaded ${getWeekdayName(wd)} schedule.`);
  }

  function handleWorkoutFormSubmit(e) {
    e.preventDefault();
    const date = document.getElementById('workout-date').value;
    const title = document.getElementById('workout-title').value.trim();
    const notes = document.getElementById('workout-notes').value.trim();
    const editId = document.getElementById('workout-edit-id').value;

    if (!date) {
      showToast('Please choose a workout date.', true);
      return;
    }

    const rows = Array.from(document.querySelectorAll('#workout-exercise-rows .exercise-row-card'));
    const exercises = [];
    for (const row of rows) {
      const name = row.querySelector('.ex-name-select').value;
      const equipment = row.querySelector('.ex-eq-select').value;
      const sets = parseOptionalNumber(row.querySelector('.ex-sets-input').value);
      const reps = parseOptionalNumber(row.querySelector('.ex-reps-input').value);
      const weight = parseOptionalNumber(row.querySelector('.ex-weight-input').value);
      const unit = row.querySelector('.ex-unit-select').value;

      if (!name || sets === null || sets <= 0 || reps === null || reps <= 0) {
        showToast('Each exercise requires valid sets and repetitions.', true);
        return;
      }
      if (equipment !== 'Bodyweight' && (weight === null || weight < 0)) {
        showToast(`Please enter a weight for ${name} (${equipment}).`, true);
        return;
      }
      exercises.push({ name, equipment, sets, reps, weight: weight !== null ? weight : null, unit });
    }

    if (editId) {
      const target = state.workouts.find((w) => w.id === editId);
      if (target) {
        target.date = date;
        target.weekday = getWeekdayFromISO(date);
        target.title = title || `${getWeekdayName(target.weekday)} Workout`;
        target.exercises = exercises;
        target.notes = notes;
      }
      showToast('Workout session updated.');
    } else {
      const weekday = getWeekdayFromISO(date);
      state.workouts.push({
        id: generateId('wk'),
        date,
        weekday,
        title: title || `${getWeekdayName(weekday)} Workout`,
        exercises,
        notes
      });
      showToast('Workout session saved.');
    }

    saveState();
    resetWorkoutForm(getTodayISO());
    renderWorkouts();
  }

  function renderWorkouts() {
    const dateInput = document.getElementById('workout-selected-date');
    if (!dateInput.value) dateInput.value = uiState.workoutDate || getTodayISO();
    uiState.workoutDate = dateInput.value;
    renderWorkoutDay(dateInput.value);
    renderWorkoutSchedule();
    renderWeekdayComparison();
    renderExerciseLibrary();
  }

  function renderWorkoutDay(dateISO) {
    const plan = getWorkoutPlanForDate(dateISO);
    const container = document.getElementById('workout-daily-content');
    const weekday = getWeekdayName(getWeekdayFromISO(dateISO));
    const daily = state.workoutChecklists[dateISO] || { completed: [], touched: false };
    const completed = new Set(Array.isArray(daily.completed) ? daily.completed : []);
    const total = plan.exercises ? plan.exercises.length : 0;
    const done = total ? plan.exercises.filter((ex) => completed.has(ex.scheduleId)).length : 0;
    const percent = total ? Math.round(done / total * 100) : 0;
    const status = daily.status || (total && done === total ? 'completed' : daily.touched ? 'in_progress' : '');
    const canMarkMissed = dateISO <= getTodayISO();
    const overrideLabel = plan.isOverride ? '<span class="badge badge-accent">Date-specific plan</span>' : '';
    const editButton = '<button type="button" class="btn btn-secondary btn-sm" id="workout-edit-date">Edit this date</button>';
    if (plan.type === 'rest' || !total) {
      container.innerHTML = '<div class="workout-day-heading"><div><div class="list-item-title">' + esc(weekday) +
        ' · ' + esc(formatDisplayDate(dateISO)) + '</div><p class="card-note">No workout planned for this date.</p></div>' + overrideLabel + '</div>' +
        '<div class="workout-rest-panel"><strong>Rest day</strong><span>Recovery is part of the plan. You can set a one-day workout without changing your weekly schedule.</span>' +
        '<div class="btn-group"><button type="button" class="btn btn-primary btn-sm" id="workout-edit-date">Change this date</button>' +
        (plan.isOverride ? '<button type="button" class="btn btn-ghost btn-sm" id="workout-clear-override">Remove date override</button>' : '') + '</div></div>';
    } else {
      const rows = plan.exercises.map((ex) => {
        const id = String(ex.scheduleId);
        const checked = completed.has(id);
        return '<label class="workout-check-row ' + (checked ? 'is-complete' : '') + '">' +
          '<input type="checkbox" data-workout-check="' + esc(id) + '" ' + (checked ? 'checked' : '') + '>' +
          '<span class="workout-check-copy"><strong>' + esc(ex.name) + '</strong><small>' +
          (Number(ex.defaultSets) || 3) + ' sets × ' + (Number(ex.defaultReps) || 10) + ' reps' +
          (ex.equipment ? ' · ' + esc(ex.equipment) : '') + '</small></span><span class="workout-check-tick">✓</span></label>';
      }).join('');
      container.innerHTML = '<div class="workout-day-heading"><div><div class="list-item-title">' + esc(plan.title || weekday + ' Workout') +
        '</div><p class="card-note">' + esc(formatDisplayDate(dateISO)) + ' · ' + done + ' of ' + total + ' completed</p></div>' +
        '<div class="workout-day-badges">' + overrideLabel + (status === 'missed' ? '<span class="badge badge-warning">Marked missed</span>' : '') + '</div></div>' +
        '<div class="workout-progress-row"><div class="progress-track"><div class="progress-fill" style="width:' + percent + '%"></div></div><strong>' + percent + '%</strong></div>' +
        '<div class="workout-checklist">' + rows + '</div>' +
        '<div class="workout-day-actions">' + editButton +
        (plan.isOverride ? '<button type="button" class="btn btn-ghost btn-sm" id="workout-clear-override">Remove date override</button>' : '') +
        (canMarkMissed ? '<button type="button" class="btn btn-ghost btn-sm" id="workout-mark-missed">' + (status === 'missed' ? 'Undo missed status' : 'Mark day missed') + '</button>' : '') + '</div>';
    }
    container.querySelectorAll('[data-workout-check]').forEach((input) => input.addEventListener('change', () => {
      const current = state.workoutChecklists[dateISO] || { completed: [], touched: false };
      const ids = new Set(Array.isArray(current.completed) ? current.completed : []);
      if (input.checked) ids.add(input.dataset.workoutCheck); else ids.delete(input.dataset.workoutCheck);
      const next = Array.from(ids);
      const nextSet = new Set(next);
      const allDone = plan.exercises.every((ex) => nextSet.has(String(ex.scheduleId)));
      state.workoutChecklists[dateISO] = { ...current, completed: next, touched: true, status: allDone ? 'completed' : 'in_progress', updatedAt: new Date().toISOString() };
      saveState(); renderWorkoutDay(dateISO); renderWeekdayComparison();
    }));
    const edit = document.getElementById('workout-edit-date');
    if (edit) edit.addEventListener('click', () => openDateWorkoutEditor(dateISO));
    const clear = document.getElementById('workout-clear-override');
    if (clear) clear.addEventListener('click', () => {
      confirmAction({ title: 'Remove date override', message: 'Restore the repeating weekday plan for this date? Your saved checklist will remain unchanged.', confirmLabel: 'Restore weekly plan', onConfirm: () => {
        delete state.workoutOverrides[dateISO]; saveState(); renderWorkoutDay(dateISO); renderWorkoutSchedule(); renderHome();
      }});
    });
    const missed = document.getElementById('workout-mark-missed');
    if (missed) missed.addEventListener('click', () => {
      const current = state.workoutChecklists[dateISO] || { completed: [], touched: false };
      state.workoutChecklists[dateISO] = { ...current, touched: true, status: current.status === 'missed' ? 'in_progress' : 'missed', updatedAt: new Date().toISOString() };
      saveState(); renderWorkoutDay(dateISO); renderWeekdayComparison();
    });
  }

  function computePersonalRecords() {
    const prefUnit = state.profile.weightUnit;
    const map = {};

    state.workouts.forEach((w) => {
      w.exercises.forEach((ex) => {
        const key = ex.name;
        if (!map[key]) {
          map[key] = {
            name: ex.name,
            equipment: ex.equipment,
            heaviestKg: null,
            heaviestDisplay: null,
            heaviestDate: null,
            highestReps: 0,
            highestRepsDate: null,
            bestSummary: null,
            bestScore: -1,
            sessions: 0
          };
        }
        const rec = map[key];
        rec.sessions += 1;
        const wKg = ex.weight !== null && ex.weight !== '' ? toKg(ex.weight, ex.unit) : null;
        if (wKg !== null && (rec.heaviestKg === null || wKg > rec.heaviestKg)) {
          rec.heaviestKg = wKg;
          rec.heaviestDisplay = `${roundNum(fromKg(wKg, prefUnit), 1)} ${prefUnit}`;
          rec.heaviestDate = w.date;
        }
        if (Number(ex.reps) > rec.highestReps) {
          rec.highestReps = Number(ex.reps);
          rec.highestRepsDate = w.date;
        }
        // Best recorded performance: prioritize highest load*reps if weighted, else highest sets*reps for bodyweight
        const perfScore = wKg !== null && wKg > 0 ? wKg * Number(ex.reps) : Number(ex.sets) * Number(ex.reps);
        if (perfScore > rec.bestScore) {
          rec.bestScore = perfScore;
          const wtTxt = wKg !== null ? ` @ ${roundNum(fromKg(wKg, prefUnit), 1)} ${prefUnit}` : ' (BW)';
          rec.bestSummary = `${ex.sets} × ${ex.reps}${wtTxt} (${formatShortDate(w.date)})`;
        }
      });
    });

    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }

  function renderPersonalRecords() {
    const container = document.getElementById('workout-prs-container');
    const query = (document.getElementById('pr-search-input').value || '').trim().toLowerCase();
    const prs = computePersonalRecords().filter((r) => !query || r.name.toLowerCase().includes(query));

    if (prs.length === 0) {
      container.innerHTML = '<div class="empty-state">Log workouts to automatically track personal records for each exercise.</div>';
      return;
    }

    container.innerHTML = `
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Exercise</th>
              <th>Equipment</th>
              <th class="table-num">Heaviest Weight</th>
              <th class="table-num">Highest Reps</th>
              <th>Best Recorded Performance</th>
            </tr>
          </thead>
          <tbody>
            ${prs.map((r) => `
              <tr>
                <td><strong>${esc(r.name)}</strong></td>
                <td><span class="badge">${esc(r.equipment)}</span></td>
                <td class="table-num">${r.heaviestDisplay ? `${r.heaviestDisplay}` : 'Bodyweight'}</td>
                <td class="table-num">${r.highestReps}</td>
                <td>${esc(r.bestSummary || '—')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderWeekdayComparison() {
    const wdSelect = document.getElementById('compare-weekday-select');
    const curSelect = document.getElementById('compare-current-session');
    const baseSelect = document.getElementById('compare-baseline-session');
    const resultsEl = document.getElementById('weekday-comparison-results');

    const wd = Number(wdSelect.value);
    const matching = state.workouts
      .filter((w) => getWeekdayFromISO(w.date) === wd)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

    if (matching.length === 0) {
      curSelect.innerHTML = '<option value="">No sessions</option>';
      baseSelect.innerHTML = '<option value="">No sessions</option>';
      resultsEl.innerHTML = `<div class="empty-state">No workouts logged on ${getWeekdayName(wd)} yet. Log at least two ${getWeekdayName(wd)} sessions to compare performance across weeks.</div>`;
      return;
    }

    const optionsHtml = matching
      .map((w) => `<option value="${esc(w.id)}">${esc(w.date)} — ${esc(w.title)}</option>`)
      .join('');
    curSelect.innerHTML = optionsHtml;
    baseSelect.innerHTML = optionsHtml;

    if (matching.some((w) => w.id === uiState.compareCurrentId)) {
      curSelect.value = uiState.compareCurrentId;
    } else {
      curSelect.value = matching[0].id;
      uiState.compareCurrentId = matching[0].id;
    }

    if (matching.length > 1) {
      if (matching.some((w) => w.id === uiState.compareBaselineId && w.id !== curSelect.value)) {
        baseSelect.value = uiState.compareBaselineId;
      } else {
        const second = matching.find((w) => w.id !== curSelect.value) || matching[0];
        baseSelect.value = second.id;
        uiState.compareBaselineId = second.id;
      }
    } else {
      resultsEl.innerHTML = `
        <div class="empty-state">
          Only one ${getWeekdayName(wd)} session logged (${esc(matching[0].date)}). Log another ${getWeekdayName(wd)} workout to unlock side-by-side comparison.
        </div>
      `;
      return;
    }

    const cur = matching.find((w) => w.id === curSelect.value);
    const base = matching.find((w) => w.id === baseSelect.value);
    if (!cur || !base) return;

    const prefUnit = state.profile.weightUnit;
    const allNames = Array.from(new Set([...cur.exercises.map((e) => e.name), ...base.exercises.map((e) => e.name)]));

    let improved = 0;
    let declined = 0;
    let stable = 0;

    const rowsHtml = allNames.map((exName) => {
      const cEx = cur.exercises.find((e) => e.name === exName);
      const bEx = base.exercises.find((e) => e.name === exName);

      const fmtEx = (ex) => {
        if (!ex) return '—';
        const wConv = ex.weight !== null && ex.weight !== '' ? roundNum(convertWeight(ex.weight, ex.unit, prefUnit), 1) : null;
        return `${ex.sets} × ${ex.reps}${wConv !== null ? ` @ ${wConv} ${prefUnit}` : ' (BW)'}`;
      };

      let deltaTxt = '—';
      let statusBadge = '<span class="badge">New</span>';

      if (cEx && bEx) {
        const cW = cEx.weight !== null && cEx.weight !== '' ? convertWeight(cEx.weight, cEx.unit, prefUnit) : 0;
        const bW = bEx.weight !== null && bEx.weight !== '' ? convertWeight(bEx.weight, bEx.unit, prefUnit) : 0;
        const diffW = roundNum(cW - bW, 1);
        const diffReps = Number(cEx.reps) - Number(bEx.reps);
        const diffSets = Number(cEx.sets) - Number(bEx.sets);

        const parts = [];
        if (diffW !== 0) parts.push(`${diffW > 0 ? '+' : ''}${diffW} ${prefUnit}`);
        if (diffReps !== 0) parts.push(`${diffReps > 0 ? '+' : ''}${diffReps} reps`);
        if (diffSets !== 0) parts.push(`${diffSets > 0 ? '+' : ''}${diffSets} sets`);
        deltaTxt = parts.length ? parts.join(', ') : 'No change';

        if (diffW > 0 || (diffW === 0 && diffReps > 0) || (diffW === 0 && diffReps === 0 && diffSets > 0)) {
          improved++;
          statusBadge = '<span class="badge badge-positive">Improved</span>';
        } else if (diffW < 0 || (diffW === 0 && diffReps < 0) || (diffW === 0 && diffReps === 0 && diffSets < 0)) {
          declined++;
          statusBadge = '<span class="badge badge-danger">Declined</span>';
        } else {
          stable++;
          statusBadge = '<span class="badge">Stable</span>';
        }
      } else if (!cEx && bEx) {
        statusBadge = '<span class="badge badge-warning">Omitted</span>';
      }

      return `
        <tr>
          <td><strong>${esc(exName)}</strong></td>
          <td class="num">${fmtEx(cEx)}</td>
          <td class="num">${fmtEx(bEx)}</td>
          <td class="num">${esc(deltaTxt)}</td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join('');

    resultsEl.innerHTML = `
      <div class="summary-strip">
        <div class="stat-box"><div class="stat-label">Improved</div><div class="metric-value" style="color:var(--positive)">${improved}</div></div>
        <div class="stat-box"><div class="stat-label">Stable</div><div class="metric-value">${stable}</div></div>
        <div class="stat-box"><div class="stat-label">Declined</div><div class="metric-value" style="color:var(--danger)">${declined}</div></div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Exercise</th>
              <th>${esc(cur.date)}</th>
              <th>${esc(base.date)}</th>
              <th>Change</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    `;
  }

  function renderWorkoutHistory() {
    const filterDate = document.getElementById('history-filter-date').value;
    const filterWd = document.getElementById('history-filter-weekday').value;
    const filterExSel = document.getElementById('history-filter-exercise');
    const prevExVal = filterExSel.value;

    const allLoggedNames = Array.from(
      new Set(state.workouts.flatMap((w) => w.exercises.map((e) => e.name)))
    ).sort();
    filterExSel.innerHTML = `<option value="">All exercises</option>${allLoggedNames
      .map((n) => `<option value="${esc(n)}" ${n === prevExVal ? 'selected' : ''}>${esc(n)}</option>`)
      .join('')}`;
    const filterEx = filterExSel.value;

    const filtered = state.workouts
      .filter((w) => {
        if (filterDate && w.date !== filterDate) return false;
        if (filterWd !== '' && String(getWeekdayFromISO(w.date)) !== filterWd) return false;
        if (filterEx && !w.exercises.some((e) => e.name === filterEx)) return false;
        return true;
      })
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

    const container = document.getElementById('workout-history-list');
    if (filtered.length === 0) {
      container.innerHTML = '<div class="empty-state">No workout sessions match the current filters.</div>';
      return;
    }

    container.innerHTML = `<div class="item-list">${filtered
      .map((w) => {
        const wdName = getWeekdayName(getWeekdayFromISO(w.date));
        const totalSets = w.exercises.reduce((s, e) => s + (Number(e.sets) || 0), 0);
        return `
          <div class="list-item">
            <div class="list-item-top">
              <div>
                <div class="list-item-title">${esc(w.title)}</div>
                <div class="list-item-meta">${esc(w.date)} (${wdName}) &middot; ${w.exercises.length} exercises &middot; ${totalSets} sets</div>
              </div>
              <div class="list-item-actions">
                <button type="button" class="btn btn-secondary btn-sm" data-wk-view="${esc(w.id)}">Inspect</button>
                <button type="button" class="btn btn-ghost btn-sm" data-wk-edit="${esc(w.id)}">Edit</button>
                <button type="button" class="btn btn-ghost btn-sm" data-wk-del="${esc(w.id)}">Delete</button>
              </div>
            </div>
            <div class="list-item-meta">${w.exercises.map((e) => esc(e.name)).join(' · ')}</div>
          </div>
        `;
      })
      .join('')}</div>`;

    container.querySelectorAll('[data-wk-view]').forEach((b) => {
      b.addEventListener('click', () => inspectWorkoutModal(b.dataset.wkView));
    });
    container.querySelectorAll('[data-wk-edit]').forEach((b) => {
      b.addEventListener('click', () => editWorkoutSession(b.dataset.wkEdit));
    });
    container.querySelectorAll('[data-wk-del]').forEach((b) => {
      b.addEventListener('click', () => {
        const wk = state.workouts.find((x) => x.id === b.dataset.wkDel);
        if (!wk) return;
        confirmAction({
          title: 'Delete Workout Session',
          message: `Remove "${esc(wk.title)}" on ${esc(wk.date)}? This cannot be undone.`,
          confirmLabel: 'Delete',
          danger: true,
          onConfirm: () => {
            state.workouts = state.workouts.filter((x) => x.id !== wk.id);
            saveState();
            renderWorkouts();
            showToast('Workout deleted.');
          }
        });
      });
    });
  }

  function inspectWorkoutModal(id) {
    const w = state.workouts.find((x) => x.id === id);
    if (!w) return;
    openModal({
      title: `${w.title} — ${w.date}`,
      bodyHtml: `
        <div class="metric-sub">${getWeekdayName(getWeekdayFromISO(w.date))} &middot; ${w.exercises.length} exercises</div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr><th>Exercise</th><th>Equipment</th><th class="table-num">Sets</th><th class="table-num">Reps</th><th class="table-num">Weight</th></tr>
            </thead>
            <tbody>
              ${w.exercises
                .map((ex) => `
                  <tr>
                    <td><strong>${esc(ex.name)}</strong></td>
                    <td>${esc(ex.equipment)}</td>
                    <td class="table-num">${ex.sets}</td>
                    <td class="table-num">${ex.reps}</td>
                    <td class="table-num">${ex.weight !== null && ex.weight !== '' ? `${ex.weight} ${ex.unit}` : 'Bodyweight'}</td>
                  </tr>
                `)
                .join('')}
            </tbody>
          </table>
        </div>
        ${w.notes ? `<div class="stat-box"><div class="stat-label">Notes</div><div style="font-size:0.86rem;margin-top:4px;">${esc(w.notes)}</div></div>` : ''}
      `,
      footerButtons: [
        { label: 'Close', className: 'btn-secondary', onClick: closeModal },
        {
          label: 'Edit Session',
          className: 'btn-primary',
          onClick: () => {
            closeModal();
            editWorkoutSession(w.id);
          }
        }
      ]
    });
  }

  function editWorkoutSession(id) {
    const w = state.workouts.find((x) => x.id === id);
    if (!w) return;
    activateSubtab('workouts', 'workouts-log');
    document.getElementById('workout-edit-id').value = w.id;
    document.getElementById('workout-form-title').textContent = `Edit Session (${w.date})`;
    document.getElementById('workout-submit-btn').textContent = 'Update Workout';
    document.getElementById('workout-cancel-edit').classList.remove('hidden');
    document.getElementById('workout-date').value = w.date;
    document.getElementById('workout-title').value = w.title;
    document.getElementById('workout-notes').value = w.notes || '';
    const rowsEl = document.getElementById('workout-exercise-rows');
    rowsEl.innerHTML = '';
    w.exercises.forEach((ex) => addWorkoutExerciseRow(ex));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderWorkoutSchedule() {
    const grid = document.getElementById('workout-schedule-grid');
    grid.innerHTML = WEEKDAYS.map((wd) => {
      const plan = state.schedule[String(wd.id)] || { title: '', exercises: [] };
      const exercises = Array.isArray(plan.exercises) ? plan.exercises : [];
      const rest = exercises.length === 0;
      return '<div class="schedule-day-card"><div class="flex-between"><strong>' + wd.name + '</strong>' +
        '<button type="button" class="btn btn-secondary btn-sm" data-sched-edit="' + wd.id + '">' + (rest ? 'Set workout' : 'Edit') + '</button></div>' +
        (rest ? '<span class="badge">Rest day</span>' : '<div class="list-item-title">' + esc(plan.title || 'Workout') + '</div><div class="schedule-exercise-list">' +
          exercises.map((ex) => '<div>' + esc(ex.name) + '<small>' + (Number(ex.defaultSets) || 3) + ' × ' + (Number(ex.defaultReps) || 10) + ' reps</small></div>').join('') + '</div>') +
        '</div>';
    }).join('');
    grid.querySelectorAll('[data-sched-edit]').forEach((btn) => btn.addEventListener('click', () => openScheduleEditorModal(btn.dataset.schedEdit)));
  }

  function buildScheduleEditor(weekdayId, dateISO = null) {
    const isDate = Boolean(dateISO);
    const key = isDate ? dateISO : String(weekdayId);
    const original = isDate ? getWorkoutPlanForDate(dateISO) : (state.schedule[key] || { title: '', exercises: [] });
    const isRest = original.type === 'rest' || (!original.exercises || original.exercises.length === 0);
    const list = (original.exercises || []).map((ex) => ({ ...ex, scheduleId: ex.scheduleId || generateId('planex') }));
    function rowsHtml() {
      if (!list.length) return '<div class="empty-state">No exercises added. Choose Rest day or add exercises below.</div>';
      return list.map((ex, i) => '<div class="schedule-edit-row"><div class="schedule-edit-main"><strong>' + esc(ex.name) +
        '</strong><small>' + esc(ex.equipment || 'Equipment not specified') + '</small></div>' +
        '<label>Sets<input type="number" min="1" max="20" value="' + (Number(ex.defaultSets) || 3) + '" data-row-sets="' + i + '"></label>' +
        '<label>Reps<input type="number" min="1" max="100" value="' + (Number(ex.defaultReps) || 10) + '" data-row-reps="' + i + '"></label>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-row-remove="' + i + '" aria-label="Remove ' + esc(ex.name) + '">Remove</button></div>').join('');
    }
    openModal({
      title: isDate ? 'Change — ' + formatDisplayDate(dateISO) : 'Weekly plan — ' + getWeekdayName(key),
      bodyHtml: '<div class="form-stack">' +
        '<div class="form-group"><label for="schedule-plan-type">Plan type</label><select id="schedule-plan-type"><option value="workout"' + (!isRest ? ' selected' : '') + '>Workout</option><option value="rest"' + (isRest ? ' selected' : '') + '>Rest day</option></select></div>' +
        '<div id="schedule-workout-fields">' +
        '<div class="form-group"><label for="sched-title-input">Workout name</label><input type="text" id="sched-title-input" value="' + esc(original.title || '') + '" placeholder="e.g. Upper body, Full body"></div>' +
        '<div class="form-row-3"><div class="form-group" style="grid-column:span 2"><label for="sched-ex-pick">Add exercise</label><select id="sched-ex-pick">' +
        state.exercises.map((e) => '<option value="' + esc(e.id) + '">' + esc(e.name) + ' (' + esc(e.equipment || 'Other') + ')</option>').join('') +
        '</select></div><div class="form-group"><label>&nbsp;</label><button type="button" class="btn btn-secondary btn-block" id="sched-add-ex-btn">+ Add</button></div></div>' +
        '<div id="sched-ex-list" class="schedule-edit-list">' + rowsHtml() + '</div></div></div>',
      footerButtons: [
        { label: 'Cancel', className: 'btn-secondary', onClick: closeModal },
        { label: isDate ? 'Save date override' : 'Save weekly plan', className: 'btn-primary', onClick: () => {
          const type = document.getElementById('schedule-plan-type').value;
          const fields = document.getElementById('schedule-workout-fields');
          if (type === 'workout' && list.length === 0) { showToast('Add at least one exercise or choose Rest day.', true); return; }
          fields.querySelectorAll('[data-row-sets]').forEach((input) => { const i = Number(input.dataset.rowSets); list[i].defaultSets = Math.max(1, Math.min(20, Number(input.value) || 3)); });
          fields.querySelectorAll('[data-row-reps]').forEach((input) => { const i = Number(input.dataset.rowReps); list[i].defaultReps = Math.max(1, Math.min(100, Number(input.value) || 10)); });
          const plan = type === 'rest' ? { type: 'rest', title: '', exercises: [] } : { type: 'custom', title: document.getElementById('sched-title-input').value.trim(), exercises: list };
          if (isDate) state.workoutOverrides[dateISO] = plan;
          else state.schedule[key] = { title: plan.title, exercises: plan.exercises };
          saveState(); closeModal();
          if (isDate) renderWorkoutDay(dateISO); else renderWorkoutSchedule();
          renderHome();
          showToast(isDate ? 'Date-specific plan saved.' : getWeekdayName(key) + ' plan saved.');
        }}
      ],
      onOpen: (body) => {
        const fields = body.querySelector('#schedule-workout-fields');
        const type = body.querySelector('#schedule-plan-type');
        type.addEventListener('change', () => fields.classList.toggle('hidden', type.value === 'rest'));
        const listEl = body.querySelector('#sched-ex-list');
        function bindRows() {
          listEl.querySelectorAll('[data-row-remove]').forEach((button) => button.addEventListener('click', () => {
            const idx = Number(button.dataset.rowRemove); list.splice(idx, 1); listEl.innerHTML = rowsHtml(); bindRows();
          }));
        }
        bindRows();
        body.querySelector('#sched-add-ex-btn').addEventListener('click', () => {
          const found = state.exercises.find((e) => e.id === body.querySelector('#sched-ex-pick').value);
          if (!found) return;
          list.push({ scheduleId: generateId('planex'), exerciseId: found.id, name: found.name, equipment: found.equipment, defaultSets: 3, defaultReps: 10 });
          listEl.innerHTML = rowsHtml(); bindRows();
        });
      }
    });
  }

  function openScheduleEditorModal(weekdayId) { buildScheduleEditor(weekdayId); }
  function openDateWorkoutEditor(dateISO) { buildScheduleEditor(null, dateISO); }

  function renderWeekdayComparison() {
    const select = document.getElementById('compare-weekday-select');
    const results = document.getElementById('weekday-comparison-results');
    if (!select || !results) return;
    const weekday = Number(select.value);
    const today = getTodayISO();
    const dates = new Set([...Object.keys(state.workoutChecklists || {}), ...Object.keys(state.workoutOverrides || {})]);
    const start = shiftISODate(today, -365);
    let rows = [];
    for (let date = start; date <= today; date = shiftISODate(date, 1)) {
      if (getWeekdayFromISO(date) !== weekday) continue;
      const plan = getWorkoutPlanForDate(date);
      if (plan.type === 'rest' || !plan.exercises || !plan.exercises.length) continue;
      const log = state.workoutChecklists[date];
      if (!log || !log.touched) continue;
      const completed = new Set(log.completed || []);
      const done = plan.exercises.filter((ex) => completed.has(ex.scheduleId)).length;
      rows.push({ date, done, total: plan.exercises.length, percent: Math.round(done / plan.exercises.length * 100), status: log.status || (done === plan.exercises.length ? 'completed' : 'in_progress') });
    }
    if (!rows.length) {
      results.innerHTML = '<div class="empty-state">No recorded ' + esc(getWeekdayName(weekday)) + ' workout checklists yet. Complete or mark a scheduled day as missed to build your comparison.</div>';
      return;
    }
    const avg = Math.round(rows.reduce((sum, row) => sum + row.percent, 0) / rows.length);
    const completedDays = rows.filter((row) => row.status === 'completed' || row.percent === 100).length;
    const missedDays = rows.filter((row) => row.status === 'missed').length;
    results.innerHTML = '<div class="summary-strip"><div class="stat-box"><div class="stat-label">Recorded days</div><div class="metric-value">' + rows.length + '</div></div>' +
      '<div class="stat-box"><div class="stat-label">Average completion</div><div class="metric-value">' + avg + '%</div></div>' +
      '<div class="stat-box"><div class="stat-label">Completed days</div><div class="metric-value">' + completedDays + '</div></div>' +
      '<div class="stat-box"><div class="stat-label">Marked missed</div><div class="metric-value">' + missedDays + '</div></div></div>' +
      '<div class="table-wrap"><table class="data-table"><thead><tr><th>Date</th><th>Completed</th><th>Completion</th><th>Status</th></tr></thead><tbody>' +
      rows.sort((a,b) => b.date.localeCompare(a.date)).map((row) => '<tr><td>' + esc(formatDisplayDate(row.date)) + '</td><td>' + row.done + ' / ' + row.total + '</td><td>' + row.percent + '%</td><td>' +
        (row.status === 'missed' ? '<span class="badge badge-warning">Missed</span>' : row.percent === 100 ? '<span class="badge badge-positive">Completed</span>' : '<span class="badge">In progress</span>') +
        '</td></tr>').join('') + '</tbody></table></div>';
  }

  function openScheduleEditorModal(weekdayId) {
    const key = String(weekdayId);
    const plan = state.schedule[key] || { title: '', exercises: [] };
    const workingList = plan.exercises.map((e) => ({ ...e }));

    function buildRowsHtml() {
      if (workingList.length === 0) {
        return '<div class="empty-state">Add exercises to this weekday session.</div>';
      }
      return workingList
        .map(
          (ex, idx) => `
          <div class="list-item" style="flex-direction:row;align-items:center;justify-content:space-between;">
            <div>
              <strong>${esc(ex.name)}</strong>
              <div class="list-item-meta">${esc(ex.equipment)} &middot; ${ex.defaultSets || 3} sets &times; ${ex.defaultReps || 10} reps</div>
            </div>
            <button type="button" class="btn btn-ghost btn-sm" data-sched-rm="${idx}">Remove</button>
          </div>
        `
        )
        .join('');
    }

    openModal({
      title: `Schedule — ${getWeekdayName(key)}`,
      bodyHtml: `
        <div class="form-stack">
          <div class="form-group">
            <label for="sched-title-input">Session Name</label>
            <input type="text" id="sched-title-input" value="${esc(plan.title)}" placeholder="e.g. Lower Body, Push, Full Body">
          </div>
          <div class="form-row-3">
            <div class="form-group" style="grid-column: span 2;">
              <label for="sched-ex-pick">Add Exercise from Library</label>
              <select id="sched-ex-pick">
                ${state.exercises.map((e) => `<option value="${esc(e.id)}">${esc(e.name)} (${esc(e.equipment)})</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>&nbsp;</label>
              <button type="button" class="btn btn-secondary btn-block" id="sched-add-ex-btn">+ Add</button>
            </div>
          </div>
          <div id="sched-ex-list" class="item-list">${buildRowsHtml()}</div>
        </div>
      `,
      footerButtons: [
        { label: 'Cancel', className: 'btn-secondary', onClick: closeModal },
        {
          label: 'Save Schedule',
          className: 'btn-primary',
          onClick: () => {
            state.schedule[key] = {
              title: document.getElementById('sched-title-input').value.trim(),
              exercises: workingList
            };
            saveState();
            closeModal();
            renderWorkoutSchedule();
            showToast(`${getWeekdayName(key)} schedule saved.`);
          }
        }
      ],
      onOpen: (bodyEl) => {
        const listEl = bodyEl.querySelector('#sched-ex-list');
        function bindRemovers() {
          listEl.querySelectorAll('[data-sched-rm]').forEach((btn) => {
            btn.addEventListener('click', () => {
              workingList.splice(Number(btn.dataset.schedRm), 1);
              listEl.innerHTML = buildRowsHtml();
              bindRemovers();
            });
          });
        }
        bindRemovers();
        bodyEl.querySelector('#sched-add-ex-btn').addEventListener('click', () => {
          const exId = bodyEl.querySelector('#sched-ex-pick').value;
          const found = state.exercises.find((e) => e.id === exId);
          if (found) {
            workingList.push({ scheduleId: generateId('planex'), exerciseId: found.id, name: found.name, equipment: found.equipment, defaultSets: 3, defaultReps: 10 });
            listEl.innerHTML = buildRowsHtml();
            bindRemovers();
          }
        });
      }
    });
  }


  function renderExerciseLibrary() {
    const query=(document.getElementById('library-search').value||'').trim().toLowerCase();
    const view=uiState.libraryView||'all', muscle=uiState.libraryMuscle||'';
    const list=state.exercises.filter((ex)=>{if(query&&!String(ex.name||'').toLowerCase().includes(query))return false;if(view==='favorites'&&!ex.favorite)return false;if(muscle&&ex.muscleGroup!==muscle)return false;return true;});
    document.getElementById('library-search-clear').classList.toggle('hidden',!query);
    document.querySelectorAll('[data-library-view]').forEach((b)=>{const active=b.dataset.libraryView===view;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));});
    const groups=document.getElementById('library-muscle-groups');
    groups.innerHTML='<button type="button" class="muscle-chip '+(!muscle?'active':'')+'" data-muscle="">All groups</button>'+MUSCLE_GROUPS.map((g)=>'<button type="button" class="muscle-chip '+(muscle===g?'active':'')+'" data-muscle="'+esc(g)+'">'+esc(g)+'</button>').join('');
    groups.querySelectorAll('[data-muscle]').forEach((b)=>b.addEventListener('click',()=>{uiState.libraryMuscle=b.dataset.muscle;renderExerciseLibrary();}));
    const container=document.getElementById('exercise-library-list');if(!list.length){container.innerHTML='';return;}
    container.innerHTML='<div class="exercise-library-grid">'+list.map((ex)=>{const photo=ex.demoPhoto?'<img src="'+ex.demoPhoto+'" alt="'+esc(ex.name)+' demonstration" loading="lazy">':'<div class="exercise-photo-placeholder"><span>GYMLOG</span><small>Exercise photo</small></div>';return '<article class="exercise-library-item"><button type="button" class="exercise-card-main" data-ex-open="'+esc(ex.id)+'"><div class="exercise-card-photo">'+photo+'</div><div class="exercise-card-copy"><strong>'+esc(ex.name)+'</strong><span>'+esc(ex.muscleGroup||'Uncategorised')+'</span><small>'+esc(ex.equipment||'Equipment not specified')+'</small></div></button><button type="button" class="exercise-favorite-btn '+(ex.favorite?'is-favorite':'')+'" data-ex-fav="'+esc(ex.id)+'" aria-label="'+(ex.favorite?'Remove from':'Add to')+' favourites" aria-pressed="'+String(Boolean(ex.favorite))+'">★</button></article>';}).join('')+'</div>';
    container.querySelectorAll('[data-ex-open]').forEach((b)=>b.addEventListener('click',()=>{const ex=state.exercises.find((x)=>x.id===b.dataset.exOpen);if(ex)openExerciseDetail(ex);}));
    container.querySelectorAll('[data-ex-fav]').forEach((b)=>b.addEventListener('click',()=>{const ex=state.exercises.find((x)=>x.id===b.dataset.exFav);if(!ex)return;ex.favorite=!ex.favorite;saveState();renderExerciseLibrary();}));
  }
  function openExerciseDetail(ex) {
    const photo=ex.demoPhoto?'<img class="exercise-detail-photo" src="'+ex.demoPhoto+'" alt="'+esc(ex.name)+' demonstration">':'<div class="exercise-detail-photo exercise-photo-placeholder"><span>GYMLOG</span><small>Exercise photo not available yet</small></div>';
    const steps=Array.isArray(ex.instructions)&&ex.instructions.length?ex.instructions:['Set up in a stable position and brace before starting.','Move through a comfortable range with controlled technique.','Return slowly and repeat without using momentum.'];
    const mistakes=Array.isArray(ex.commonMistakes)&&ex.commonMistakes.length?ex.commonMistakes:['Using momentum','Losing control of the movement','Using a load that is too heavy'];
    const safety=Array.isArray(ex.safetyTips)&&ex.safetyTips.length?ex.safetyTips:['Start with a manageable load','Use a pain-free range of motion','Stop if you feel sharp pain'];
    openModal({title:ex.name,bodyHtml:photo+'<div class="exercise-detail-meta"><span>'+esc(ex.equipment||'Equipment not specified')+'</span><span>'+esc(ex.muscleGroup||'Uncategorised')+'</span></div>'+(ex.description?'<p>'+esc(ex.description)+'</p>':'')+'<h3>How to perform</h3><ol class="exercise-guide-list">'+steps.map((x)=>'<li>'+esc(x)+'</li>').join('')+'</ol><h3>Common mistakes</h3><ul class="exercise-guide-list">'+mistakes.map((x)=>'<li>'+esc(x)+'</li>').join('')+'</ul><h3>Safety tips</h3><ul class="exercise-guide-list">'+safety.map((x)=>'<li>'+esc(x)+'</li>').join('')+'</ul>'+(ex.custom?'<div class="exercise-detail-actions"><button type="button" class="btn btn-secondary" id="exercise-edit-detail">Edit exercise</button><button type="button" class="btn btn-ghost" id="exercise-delete-detail">Delete</button></div>':''),
      footerButtons:[{label:ex.favorite?'★ Favourited':'☆ Add to favourites',className:'btn-secondary',onClick:()=>{ex.favorite=!ex.favorite;saveState();closeModal();renderExerciseLibrary();}},{label:'Add to schedule',className:'btn-primary',onClick:()=>{closeModal();openAddExerciseToSchedule(ex);}}],
      onOpen:(body)=>{const edit=body.querySelector('#exercise-edit-detail');if(edit)edit.addEventListener('click',()=>{closeModal();openCustomExerciseModal(ex);});const del=body.querySelector('#exercise-delete-detail');if(del)del.addEventListener('click',()=>{closeModal();deleteCustomExercise(ex);});}
    });
  }
  function openAddExerciseToSchedule(ex) {
    openModal({title:'Add to weekly schedule',bodyHtml:'<div class="form-stack"><div class="form-group"><label for="library-add-day">Weekday</label><select id="library-add-day">'+WEEKDAYS.map((d)=>'<option value="'+d.id+'">'+d.name+'</option>').join('')+'</select></div><div class="form-row-2"><div class="form-group"><label for="library-add-sets">Sets</label><input id="library-add-sets" type="number" min="1" max="20" value="3"></div><div class="form-group"><label for="library-add-reps">Reps</label><input id="library-add-reps" type="number" min="1" max="100" value="10"></div></div></div>',
      footerButtons:[{label:'Cancel',className:'btn-secondary',onClick:closeModal},{label:'Add exercise',className:'btn-primary',onClick:()=>{const day=document.getElementById('library-add-day').value,sets=Number(document.getElementById('library-add-sets').value),reps=Number(document.getElementById('library-add-reps').value);if(!Number.isInteger(sets)||sets<1||sets>20||!Number.isInteger(reps)||reps<1||reps>100){showToast('Enter valid sets and reps.',true);return;}const plan=state.schedule[day]||(state.schedule[day]={title:'',exercises:[]});plan.exercises.push({scheduleId:generateId('planex'),exerciseId:ex.id,name:ex.name,equipment:ex.equipment||'',defaultSets:sets,defaultReps:reps});saveState();closeModal();renderWorkoutSchedule();renderHome();showToast(ex.name+' added to '+getWeekdayName(day)+'.');}}]});
  }
  function deleteCustomExercise(ex) {
    if(!ex||!ex.custom)return;
    confirmAction({title:'Delete custom exercise',message:'Delete "'+esc(ex.name)+'" from the library and remove it from all weekly and date-specific schedules? Existing workout history is preserved.',confirmLabel:'Delete exercise',danger:true,onConfirm:()=>{state.exercises=state.exercises.filter((x)=>x.id!==ex.id);[state.schedule,state.workoutOverrides].forEach((obj)=>Object.values(obj||{}).forEach((p)=>{p.exercises=(p.exercises||[]).filter((x)=>x.exerciseId!==ex.id&&x.name!==ex.name);}));saveState();renderWorkouts();renderHome();showToast('Custom exercise deleted from the library and schedules.');}});
  }
  function openCustomExerciseModal(existing=null) {
    let pendingPhoto=existing?(existing.demoPhoto||''):'';
    openModal({title:existing?'Edit custom exercise':'Add custom exercise',bodyHtml:'<form class="form-stack" onsubmit="return false"><div class="form-group"><label for="ce-name">Exercise name *</label><input type="text" id="ce-name" value="'+esc(existing?existing.name:'')+'" placeholder="e.g. Bulgarian Split Squat" required></div><div class="form-group"><label for="ce-muscle">Muscle group *</label><select id="ce-muscle" required><option value="">Choose muscle group</option>'+MUSCLE_GROUPS.map((g)=>'<option value="'+esc(g)+'" '+(existing&&existing.muscleGroup===g?'selected':'')+'>'+esc(g)+'</option>').join('')+'</select></div><div class="form-group"><label for="ce-eq">Equipment (optional)</label><select id="ce-eq"><option value="">Not specified</option>'+EQUIPMENT_TYPES.map((t)=>'<option value="'+esc(t)+'" '+(existing&&existing.equipment===t?'selected':'')+'>'+esc(t)+'</option>').join('')+'</select></div><div class="form-group"><label for="ce-instructions">Instructions (optional, one step per line)</label><textarea id="ce-instructions" rows="4">'+esc((existing&&existing.instructions||[]).join('\\n'))+'</textarea></div><div class="form-group"><label for="ce-photo">Demonstration photo (optional)</label><input type="file" id="ce-photo" accept="image/*"><div id="ce-photo-preview" class="custom-photo-preview">'+(pendingPhoto?'<img src="'+pendingPhoto+'" alt="Exercise photo preview">':'No photo selected')+'</div><button type="button" id="ce-photo-remove" class="btn btn-ghost btn-sm">Remove photo</button></div></form>',
      footerButtons:[{label:'Cancel',className:'btn-secondary',onClick:closeModal},{label:existing?'Save changes':'Add exercise',className:'btn-primary',onClick:()=>{const name=document.getElementById('ce-name').value.trim(),muscleGroup=document.getElementById('ce-muscle').value,equipment=document.getElementById('ce-eq').value;if(!name||!muscleGroup){showToast('Exercise name and muscle group are required.',true);return;}const instructions=document.getElementById('ce-instructions').value.split('\\n').map((x)=>x.trim()).filter(Boolean);if(existing){const oldName=existing.name;Object.assign(existing,{name,muscleGroup,equipment,instructions,demoPhoto:pendingPhoto});[state.schedule,state.workoutOverrides].forEach((obj)=>Object.values(obj||{}).forEach((p)=>(p.exercises||[]).forEach((x)=>{if(x.exerciseId===existing.id||(!x.exerciseId&&x.name===oldName)){x.exerciseId=existing.id;x.name=name;x.equipment=equipment;}})));}else state.exercises.push({id:generateId('ex'),name,muscleGroup,equipment,custom:true,favorite:false,instructions,demoPhoto:pendingPhoto,commonMistakes:[],safetyTips:[]});saveState();closeModal();renderWorkouts();renderHome();showToast(existing?'Exercise updated.':'Custom exercise added.');}}],onOpen:(body)=>{const preview=body.querySelector('#ce-photo-preview');body.querySelector('#ce-photo').addEventListener('change',(ev)=>{const file=ev.target.files&&ev.target.files[0];if(!file)return;if(!file.type.startsWith('image/')){showToast('Choose an image file.',true);return;}const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const scale=Math.min(1,720/Math.max(img.width,img.height)),canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);pendingPhoto=canvas.toDataURL('image/jpeg',0.72);preview.innerHTML='<img src="'+pendingPhoto+'" alt="Exercise photo preview">';};img.src=reader.result;};reader.readAsDataURL(file);});body.querySelector('#ce-photo-remove').addEventListener('click',()=>{pendingPhoto='';preview.textContent='No photo selected';});}
    });
  }

  // -------------------- SECTION 3: NUTRITION --------------------

  function renderNutrition() {
    const dateISO = uiState.nutritionDate;
    document.getElementById('nutrition-date-picker').value = dateISO;
    renderNutritionTargetsProgress(dateISO);
    renderDailyFoodList(dateISO);
    renderSavedFoodsList();
  }

  function renderNutritionTargetsProgress(dateISO) {
    const totals = getNutritionTotalsForDate(dateISO);
    const t = state.targets;
    const container = document.getElementById('nutrition-targets-progress');

    const rows = [
      renderProgressRow('Calories', totals.calories, t.calories, 'kcal', ''),
      renderProgressRow('Protein', totals.protein, t.protein, 'g', ''),
      renderProgressRow('Carbohydrates', totals.carbs, t.carbs, 'g', 'series-2'),
      renderProgressRow('Fats', totals.fat, t.fat, 'g', 'series-3'),
      renderProgressRow('Fibre', totals.fibre, t.fibre, 'g', ''),
      renderProgressRow('Sugar', totals.sugar, t.sugar, 'g', 'series-3'),
      renderProgressRow('Sodium', totals.sodium, t.sodium, 'mg', 'series-2')
    ];

    // Tracked micronutrients (from targets or logged today)
    const microKeys = new Set();
    (t.micronutrients || []).forEach((m) => microKeys.add(m.name.trim().toLowerCase()));
    Object.keys(totals.micronutrients).forEach((k) => microKeys.add(k));

    microKeys.forEach((k) => {
      const targetObj = (t.micronutrients || []).find((m) => m.name.trim().toLowerCase() === k);
      const loggedObj = totals.micronutrients[k];
      const name = (targetObj && targetObj.name) || (loggedObj && loggedObj.name) || k;
      const unit = (targetObj && targetObj.unit) || (loggedObj && loggedObj.unit) || '';
      const curAmt = loggedObj ? roundNum(loggedObj.amount, 1) : 0;
      const tgtAmt = targetObj ? targetObj.target : null;
      rows.push(renderProgressRow(name, curAmt, tgtAmt, unit, ''));
    });

    container.innerHTML = `<div class="form-stack">${rows.join('')}</div>`;
  }

  function renderDailyFoodList(dateISO) {
    const entries = state.nutritionLogs[dateISO] || [];
    const container = document.getElementById('nutrition-food-list');

    if (entries.length === 0) {
      container.innerHTML = '<div class="empty-state">No food entries logged for this day. Add a manual entry or pick from your saved food profiles.</div>';
      return;
    }

    container.innerHTML = `<div class="item-list">${entries
      .map((item) => {        const micros = Array.isArray(item.micronutrients) && item.micronutrients.length
          ? `<div class="list-item-meta">Micronutrients: ${item.micronutrients.map((m) => `${esc(m.name)} ${m.amount}${esc(m.unit || '')}`).join(', ')}</div>`
          : '';
        return `
          <div class="list-item">
            <div class="list-item-top">
              <div>
                <div class="list-item-title">${esc(item.name)} <span class="metric-sub">(${item.quantity} ${esc(item.unit || '')})</span></div>
                <div class="list-item-meta num">
                  <strong>${roundNum(item.calories, 0)} kcal</strong> &middot;
                  P ${roundNum(item.protein, 1)}g &middot;
                  C ${roundNum(item.carbs, 1)}g &middot;
                  F ${roundNum(item.fat, 1)}g
                  ${item.fibre ? ` &middot; Fibre ${roundNum(item.fibre, 1)}g` : ''}
                  ${item.sugar ? ` &middot; Sugar ${roundNum(item.sugar, 1)}g` : ''}
                  ${item.sodium ? ` &middot; Na ${roundNum(item.sodium, 0)}mg` : ''}
                </div>
                ${micros}
              </div>
              <div class="list-item-actions">
                <button type="button" class="btn btn-secondary btn-sm" data-food-edit="${esc(item.id)}">Edit</button>
                <button type="button" class="btn btn-ghost btn-sm" data-food-del="${esc(item.id)}">Delete</button>
              </div>
            </div>
          </div>
        `;
      })
      .join('')}</div>`;

    container.querySelectorAll('[data-food-edit]').forEach((b) => {
      b.addEventListener('click', () => {
        const found = entries.find((x) => x.id === b.dataset.foodEdit);
        if (found) openFoodEntryModal({ mode: 'daily', dateISO, existing: found });
      });
    });
    container.querySelectorAll('[data-food-del]').forEach((b) => {
      b.addEventListener('click', () => {
        state.nutritionLogs[dateISO] = entries.filter((x) => x.id !== b.dataset.foodDel);
        if (state.nutritionLogs[dateISO].length === 0) delete state.nutritionLogs[dateISO];
        saveState();
        renderNutrition();
        showToast('Food entry removed.');
      });
    });
  }

  function openFoodEntryModal({ mode = 'daily', dateISO = uiState.nutritionDate, existing = null }) {
    const isProfile = mode === 'profile';
    const workingMicros = existing && Array.isArray(existing.micronutrients)
      ? existing.micronutrients.map((m) => ({ ...m }))
      : [];

    function renderMicroInputs(container) {
      container.innerHTML = workingMicros
        .map(
          (m, idx) => `
          <div class="form-row-4" style="align-items:end;">
            <div class="form-group" style="grid-column: span 2;">
              <label>Micronutrient</label>
              <input type="text" class="mf-name" data-idx="${idx}" value="${esc(m.name)}" placeholder="e.g. Vitamin D, Iron">
            </div>
            <div class="form-group">
              <label>Amount</label>
              <input type="number" class="mf-amt" data-idx="${idx}" step="0.1" min="0" value="${m.amount}">
            </div>
            <div class="form-group">
              <label>Unit</label>
              <div style="display:flex;gap:4px;">
                <input type="text" class="mf-unit" data-idx="${idx}" value="${esc(m.unit)}" placeholder="mg/mcg">
                <button type="button" class="btn-icon-sm mf-rm" data-idx="${idx}" aria-label="Remove">&times;</button>
              </div>
            </div>
          </div>
        `
        )
        .join('');

      container.querySelectorAll('.mf-name').forEach((el) => {
        el.addEventListener('input', () => { workingMicros[Number(el.dataset.idx)].name = el.value; });
      });
      container.querySelectorAll('.mf-amt').forEach((el) => {
        el.addEventListener('input', () => { workingMicros[Number(el.dataset.idx)].amount = Number(el.value) || 0; });
      });
      container.querySelectorAll('.mf-unit').forEach((el) => {
        el.addEventListener('input', () => { workingMicros[Number(el.dataset.idx)].unit = el.value; });
      });
      container.querySelectorAll('.mf-rm').forEach((el) => {
        el.addEventListener('click', () => {
          workingMicros.splice(Number(el.dataset.idx), 1);
          renderMicroInputs(container);
        });
      });
    }

    openModal({
      title: existing
        ? (isProfile ? 'Edit Saved Food Profile' : 'Edit Food Entry')
        : (isProfile ? 'New Saved Food Profile' : `Add Food Entry (${dateISO})`),
      bodyHtml: `
        <form class="form-stack">
          <div class="form-group">
            <label for="fe-name">Food Name</label>
            <input type="text" id="fe-name" value="${esc(existing ? existing.name : '')}" placeholder="e.g. Oats, Chicken Breast, Whole Eggs" required>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label for="fe-qty">${isProfile ? 'Reference Quantity' : 'Quantity Consumed'}</label>
              <input type="number" id="fe-qty" step="0.1" min="0.01" value="${existing ? (isProfile ? existing.baseQuantity : existing.quantity) : 100}" required>
            </div>
            <div class="form-group">
              <label for="fe-unit">Unit</label>
              <input type="text" id="fe-unit" value="${esc(existing ? existing.unit : 'g')}" placeholder="g, ml, serving, scoop">
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label for="fe-cal">Calories (kcal)</label>
              <input type="number" id="fe-cal" step="1" min="0" value="${existing ? existing.calories : ''}" placeholder="0" required>
            </div>
            <div class="form-group">
              <label for="fe-pro">Protein (g)</label>
              <input type="number" id="fe-pro" step="0.1" min="0" value="${existing ? existing.protein : ''}" placeholder="0">
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label for="fe-carb">Carbohydrates (g)</label>
              <input type="number" id="fe-carb" step="0.1" min="0" value="${existing ? existing.carbs : ''}" placeholder="0">
            </div>
            <div class="form-group">
              <label for="fe-fat">Fats (g)</label>
              <input type="number" id="fe-fat" step="0.1" min="0" value="${existing ? existing.fat : ''}" placeholder="0">
            </div>
          </div>
          <div class="form-row-3">
            <div class="form-group">
              <label for="fe-fibre">Fibre (g)</label>
              <input type="number" id="fe-fibre" step="0.1" min="0" value="${existing ? existing.fibre : ''}" placeholder="0">
            </div>
            <div class="form-group">
              <label for="fe-sugar">Sugar (g)</label>
              <input type="number" id="fe-sugar" step="0.1" min="0" value="${existing ? existing.sugar : ''}" placeholder="0">
            </div>
            <div class="form-group">
              <label for="fe-sodium">Sodium (mg)</label>
              <input type="number" id="fe-sodium" step="1" min="0" value="${existing ? existing.sodium : ''}" placeholder="0">
            </div>
          </div>
          <div class="form-group">
            <div class="flex-between">
              <label>Optional Micronutrients</label>
              <button type="button" class="btn btn-secondary btn-sm" id="fe-add-micro">+ Add Micronutrient</button>
            </div>
            <div id="fe-micro-list" class="micro-rows-list"></div>
          </div>
          ${!isProfile && !existing
            ? `<label class="checkbox-row"><input type="checkbox" id="fe-save-profile"> Also save as reusable food profile</label>`
            : ''
          }
        </form>
      `,
      footerButtons: [
        { label: 'Cancel', className: 'btn-secondary', onClick: closeModal },
        {
          label: existing ? 'Save Changes' : (isProfile ? 'Save Profile' : 'Add Entry'),
          className: 'btn-primary',
          onClick: () => {
            const name = document.getElementById('fe-name').value.trim();
            const qty = parseOptionalNumber(document.getElementById('fe-qty').value);
            const unit = document.getElementById('fe-unit').value.trim() || 'serving';
            const calories = parseOptionalNumber(document.getElementById('fe-cal').value) || 0;
            const protein = parseOptionalNumber(document.getElementById('fe-pro').value) || 0;
            const carbs = parseOptionalNumber(document.getElementById('fe-carb').value) || 0;
            const fat = parseOptionalNumber(document.getElementById('fe-fat').value) || 0;
            const fibre = parseOptionalNumber(document.getElementById('fe-fibre').value) || 0;
            const sugar = parseOptionalNumber(document.getElementById('fe-sugar').value) || 0;
            const sodium = parseOptionalNumber(document.getElementById('fe-sodium').value) || 0;
            const cleanMicros = workingMicros
              .filter((m) => m.name && m.name.trim())
              .map((m) => ({ name: m.name.trim(), amount: Number(m.amount) || 0, unit: (m.unit || '').trim() }));

            if (!name || qty === null || qty <= 0) {
              showToast('Please enter a food name and valid positive quantity.', true);
              return;
            }

            if (isProfile) {
              if (existing) {
                Object.assign(existing, {
                  name,
                  baseQuantity: qty,
                  unit,
                  calories,
                  protein,
                  carbs,
                  fat,
                  fibre,
                  sugar,
                  sodium,
                  micronutrients: cleanMicros
                });
              } else {
                state.savedFoods.push({
                  id: generateId('sf'),
                  name,
                  baseQuantity: qty,
                  unit,
                  calories,
                  protein,
                  carbs,
                  fat,
                  fibre,
                  sugar,
                  sodium,
                  micronutrients: cleanMicros
                });
              }
              showToast(existing ? 'Saved food profile updated.' : 'Food profile saved.');
            } else {
              if (existing) {
                Object.assign(existing, {
                  name,
                  quantity: qty,
                  unit,
                  calories,
                  protein,
                  carbs,
                  fat,
                  fibre,
                  sugar,
                  sodium,
                  micronutrients: cleanMicros
                });
              } else {
                if (!state.nutritionLogs[dateISO]) state.nutritionLogs[dateISO] = [];
                state.nutritionLogs[dateISO].push({
                  id: generateId('fd'),
                  name,
                  quantity: qty,
                  unit,
                  calories,
                  protein,
                  carbs,
                  fat,
                  fibre,
                  sugar,
                  sodium,
                  micronutrients: cleanMicros
                });
                const saveProfileCb = document.getElementById('fe-save-profile');
                if (saveProfileCb && saveProfileCb.checked) {
                  state.savedFoods.push({
                    id: generateId('sf'),
                    name,
                    baseQuantity: qty,
                    unit,
                    calories,
                    protein,
                    carbs,
                    fat,
                    fibre,
                    sugar,
                    sodium,
                    micronutrients: cleanMicros.map((m) => ({ ...m }))
                  });
                }
              }
              showToast(existing ? 'Food entry updated.' : 'Food entry added.');
            }

            saveState();
            closeModal();
            renderActiveSection();
          }
        }
      ],
      onOpen: (bodyEl) => {
        const microListEl = bodyEl.querySelector('#fe-micro-list');
        renderMicroInputs(microListEl);
        bodyEl.querySelector('#fe-add-micro').addEventListener('click', () => {
          workingMicros.push({ name: '', amount: 0, unit: 'mg' });
          renderMicroInputs(microListEl);
        });
      }
    });
  }

  function renderSavedFoodsList() {
    const query = (document.getElementById('saved-food-search').value || '').trim().toLowerCase();
    const list = state.savedFoods.filter((f) => !query || f.name.toLowerCase().includes(query));
    const container = document.getElementById('saved-foods-list');

    if (list.length === 0) {
      container.innerHTML = '<div class="empty-state">No saved food profiles yet. Create profiles for foods you eat often so you can add and scale them in one tap.</div>';
      return;
    }

    container.innerHTML = `<div class="item-list">${list
      .map(
        (sf) => `
        <div class="list-item">
          <div class="list-item-top">
            <div>
              <div class="list-item-title">${esc(sf.name)} <span class="metric-sub">(per ${sf.baseQuantity} ${esc(sf.unit)})</span></div>
              <div class="list-item-meta num">
                ${roundNum(sf.calories, 0)} kcal &middot; P ${roundNum(sf.protein, 1)}g &middot; C ${roundNum(sf.carbs, 1)}g &middot; F ${roundNum(sf.fat, 1)}g
              </div>
            </div>
            <div class="list-item-actions">
              <button type="button" class="btn btn-primary btn-sm" data-sf-add="${esc(sf.id)}">Add to Day</button>
              <button type="button" class="btn btn-secondary btn-sm" data-sf-edit="${esc(sf.id)}">Edit</button>
              <button type="button" class="btn btn-ghost btn-sm" data-sf-del="${esc(sf.id)}">Delete</button>
            </div>
          </div>
        </div>
      `
      )
      .join('')}</div>`;

    container.querySelectorAll('[data-sf-add]').forEach((b) => {
      b.addEventListener('click', () => {
        const sf = state.savedFoods.find((x) => x.id === b.dataset.sfAdd);
        if (sf) openScaleSavedFoodModal(sf, uiState.nutritionDate);
      });
    });
    container.querySelectorAll('[data-sf-edit]').forEach((b) => {
      b.addEventListener('click', () => {
        const sf = state.savedFoods.find((x) => x.id === b.dataset.sfEdit);
        if (sf) openFoodEntryModal({ mode: 'profile', existing: sf });
      });
    });
    container.querySelectorAll('[data-sf-del]').forEach((b) => {
      b.addEventListener('click', () => {
        const sf = state.savedFoods.find((x) => x.id === b.dataset.sfDel);
        if (!sf) return;
        confirmAction({
          title: 'Delete Saved Food Profile',
          message: `Remove "${esc(sf.name)}" from saved foods? Previously logged daily entries remain unchanged.`,
          confirmLabel: 'Delete',
          danger: true,
          onConfirm: () => {
            state.savedFoods = state.savedFoods.filter((x) => x.id !== sf.id);
            saveState();
            renderSavedFoodsList();
            showToast('Saved food profile removed.');
          }
        });
      });
    });
  }

  function openPickSavedFoodModal(dateISO) {
    if (state.savedFoods.length === 0) {
      showToast('No saved food profiles yet. Create one in Saved Foods first.');
      activateSubtab('nutrition', 'nutrition-saved');
      return;
    }
    openModal({
      title: `Add Saved Food to ${dateISO}`,
      bodyHtml: `
        <div class="form-stack">
          <div class="form-group">
            <label for="psf-select">Select Saved Food</label>
            <select id="psf-select">
              ${state.savedFoods.map((sf) => `<option value="${esc(sf.id)}">${esc(sf.name)} (${sf.baseQuantity} ${esc(sf.unit)} · ${roundNum(sf.calories, 0)} kcal)</option>`).join('')}
            </select>
          </div>
        </div>
      `,
      footerButtons: [
        { label: 'Cancel', className: 'btn-secondary', onClick: closeModal },
        {
          label: 'Next: Set Quantity',
          className: 'btn-primary',
          onClick: () => {
            const id = document.getElementById('psf-select').value;
            const sf = state.savedFoods.find((x) => x.id === id);
            closeModal();
            if (sf) openScaleSavedFoodModal(sf, dateISO);
          }
        }
      ]
    });
  }

  function openScaleSavedFoodModal(sf, dateISO) {
    openModal({
      title: `Add ${sf.name} (${dateISO})`,
      bodyHtml: `
        <div class="form-stack">
          <div class="form-group">
            <label for="ssf-qty">Quantity (${esc(sf.unit)}) — Base profile is ${sf.baseQuantity} ${esc(sf.unit)}</label>
            <input type="number" id="ssf-qty" step="0.1" min="0.01" value="${sf.baseQuantity}">
          </div>
          <div id="ssf-preview" class="stat-box"></div>
        </div>
      `,
      footerButtons: [
        { label: 'Cancel', className: 'btn-secondary', onClick: closeModal },
        {
          label: 'Add to Daily Log',
          className: 'btn-primary',
          onClick: () => {
            const qty = parseOptionalNumber(document.getElementById('ssf-qty').value);
            if (qty === null || qty <= 0) {
              showToast('Enter a valid positive quantity.', true);
              return;
            }
            const factor = qty / (sf.baseQuantity || 1);
            if (!state.nutritionLogs[dateISO]) state.nutritionLogs[dateISO] = [];
            state.nutritionLogs[dateISO].push({
              id: generateId('fd'),
              name: sf.name,
              quantity: qty,
              unit: sf.unit,
              calories: roundNum((sf.calories || 0) * factor, 1),
              protein: roundNum((sf.protein || 0) * factor, 1),
              carbs: roundNum((sf.carbs || 0) * factor, 1),
              fat: roundNum((sf.fat || 0) * factor, 1),
              fibre: roundNum((sf.fibre || 0) * factor, 1),
              sugar: roundNum((sf.sugar || 0) * factor, 1),
              sodium: roundNum((sf.sodium || 0) * factor, 1),
              micronutrients: (sf.micronutrients || []).map((m) => ({
                name: m.name,
                unit: m.unit,
                amount: roundNum((Number(m.amount) || 0) * factor, 2)
              }))
            });
            saveState();
            closeModal();
            renderNutrition();
            showToast(`Added ${sf.name} to ${dateISO}.`);
          }
        }
      ],
      onOpen: (bodyEl) => {
        const qtyInput = bodyEl.querySelector('#ssf-qty');
        const preview = bodyEl.querySelector('#ssf-preview');
        function updatePreview() {
          const qty = parseOptionalNumber(qtyInput.value) || 0;
          const factor = qty / (sf.baseQuantity || 1);
          preview.innerHTML = `
            <div class="stat-label">Scaled Nutrition Preview</div>
            <div class="num" style="font-size:0.86rem;margin-top:4px;">
              <strong>${roundNum((sf.calories || 0) * factor, 0)} kcal</strong> &middot;
              P ${roundNum((sf.protein || 0) * factor, 1)}g &middot;
              C ${roundNum((sf.carbs || 0) * factor, 1)}g &middot;
              F ${roundNum((sf.fat || 0) * factor, 1)}g
            </div>
          `;
        }
        updatePreview();
        qtyInput.addEventListener('input', updatePreview);
      }
    });
  }

  // -------------------- SECTION 4: PROGRESS & ANALYTICS --------------------

  function getDateWindow(rangeStr) {
    const endISO = getTodayISO();
    if (rangeStr === 'all') {
      const allDates = [
        ...state.weights.map((w) => w.date),
        ...state.workouts.map((w) => w.date),
        ...Object.keys(state.nutritionLogs),
        ...Object.keys(state.healthLogs)
      ].filter(Boolean).sort();
      if (allDates.length === 0) return [endISO];
      const start = allDates[0];
      const dates = [];
      let cur = start;
      let guard = 0;
      while (cur <= endISO && guard < 1500) {
        dates.push(cur);
        cur = shiftISODate(cur, 1);
        guard++;
      }
      return dates;
    }
    const days = Number(rangeStr) || 30;
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      dates.push(shiftISODate(endISO, -i));
    }
    return dates;
  }

  function bucketSeries(dates, rawValues, granularity) {
    if (granularity === 'daily') {
      return {
        labels: dates.map((d) => formatShortDate(d)),
        values: rawValues
      };
    }
    const buckets = new Map();
    dates.forEach((d, idx) => {
      const dt = parseISODate(d);
      if (!dt) return;
      let key;
      let label;
      if (granularity === 'weekly') {
        const day = dt.getDay();
        const diff = (day === 0 ? -6 : 1 - day);
        const monday = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + diff);
        key = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
        label = `Wk ${formatShortDate(key)}`;
      } else {
        key = d.slice(0, 7);
        label = dt.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
      }
      if (!buckets.has(key)) buckets.set(key, { label, vals: [] });
      const v = rawValues[idx];
      if (v !== null && v !== undefined && Number.isFinite(Number(v))) {
        buckets.get(key).vals.push(Number(v));
      }
    });

    const labels = [];
    const values = [];
    buckets.forEach((b) => {
      labels.push(b.label);
      // Average ONLY over logged entries; missing periods stay null (never fabricated as 0)
      values.push(b.vals.length > 0 ? roundNum(b.vals.reduce((a, c) => a + c, 0) / b.vals.length, 1) : null);
    });
    return { labels, values };
  }

  function calcPeriodStat(values, unit = '') {
    const valid = values.filter((v) => v !== null && v !== undefined && Number.isFinite(Number(v)));
    if (valid.length === 0) return 'No data';
    const avg = roundNum(valid.reduce((a, b) => a + b, 0) / valid.length, 1);
    const latest = roundNum(valid[valid.length - 1], 1);
    return `Latest: ${latest}${unit} · Avg: ${avg}${unit} (${valid.length} logged)`;
  }

  function renderProgress() {
    renderAllProgressCharts();
    renderWeightHistoryTab();
    renderHealthHistoryTab();
    renderPhotoJournalTab();
  }

  function renderAllProgressCharts() {
    const range = uiState.progressRange;
    const gran = uiState.progressGranularity;
    const dates = getDateWindow(range);
    const prefUnit = state.profile.weightUnit;

    // Map latest entry per date for weights
    const weightByDate = {};
    const bmiByDate = {};
    state.weights.forEach((w) => {
      const wPref = roundNum(convertWeight(w.weight, w.unit, prefUnit), 1);
      const wKg = toKg(w.weight, w.unit);
      const h = w.heightCm || state.profile.heightCm;
      weightByDate[w.date] = wPref;
      const bmi = calculateBMI(wKg, h);
      if (bmi !== null) bmiByDate[w.date] = bmi;
    });

    // 1. Body weight over time
    const wRaw = dates.map((d) => (weightByDate[d] !== undefined ? weightByDate[d] : null));
    const wB = bucketSeries(dates, wRaw, gran);
    document.getElementById('stat-weight').textContent = calcPeriodStat(wRaw, ` ${prefUnit}`);
    renderSVGChart(document.getElementById('chart-weight'), {
      labels: wB.labels,
      series: [{ name: 'Body Weight', color: 'var(--accent)', values: wB.values, unit: prefUnit }],
      type: 'line',
      emptyMessage: 'No body weight entries in this period.'
    });

    // 2. BMI over time
    const bmiRaw = dates.map((d) => (bmiByDate[d] !== undefined ? bmiByDate[d] : null));
    const bmiB = bucketSeries(dates, bmiRaw, gran);
    document.getElementById('stat-bmi').textContent = calcPeriodStat(bmiRaw, '');
    renderSVGChart(document.getElementById('chart-bmi'), {
      labels: bmiB.labels,
      series: [{ name: 'BMI', color: 'var(--series-2)', values: bmiB.values, unit: 'kg/m²' }],
      type: 'line',
      emptyMessage: 'No BMI records yet. Log body weight and set your height in Profile.'
    });

    // 3. Calories over time
    const calRaw = dates.map((d) => {
      const tot = getNutritionTotalsForDate(d);
      return tot.hasEntries ? tot.calories : null;
    });
    const calB = bucketSeries(dates, calRaw, gran);
    document.getElementById('stat-calories').textContent = calcPeriodStat(calRaw, ' kcal');
    renderSVGChart(document.getElementById('chart-calories'), {
      labels: calB.labels,
      series: [{ name: 'Calories', color: 'var(--accent)', values: calB.values, unit: 'kcal' }],
      type: 'bar',
      targetValue: state.targets.calories,
      yMinZero: true,
      emptyMessage: 'No calorie logs in this period.'
    });

    // 4. Protein over time
    const proRaw = dates.map((d) => {
      const tot = getNutritionTotalsForDate(d);
      return tot.hasEntries ? tot.protein : null;
    });
    const proB = bucketSeries(dates, proRaw, gran);
    document.getElementById('stat-protein').textContent = calcPeriodStat(proRaw, ' g');
    renderSVGChart(document.getElementById('chart-protein'), {
      labels: proB.labels,
      series: [{ name: 'Protein', color: 'var(--accent)', values: proB.values, unit: 'g' }],
      type: 'line',
      targetValue: state.targets.protein,
      yMinZero: true,
      emptyMessage: 'No protein logs in this period.'
    });

    // 5. Carbs & Fat over time
    const carbRaw = dates.map((d) => {
      const tot = getNutritionTotalsForDate(d);
      return tot.hasEntries ? tot.carbs : null;
    });
    const fatRaw = dates.map((d) => {
      const tot = getNutritionTotalsForDate(d);
      return tot.hasEntries ? tot.fat : null;
    });
    const carbB = bucketSeries(dates, carbRaw, gran);
    const fatB = bucketSeries(dates, fatRaw, gran);
    document.getElementById('stat-carbs-fat').textContent = `C ${calcPeriodStat(carbRaw, 'g').split('·')[0]}`;
    renderSVGChart(document.getElementById('chart-carbs-fat'), {
      labels: carbB.labels,
      series: [
        { name: 'Carbs', color: 'var(--series-2)', values: carbB.values, unit: 'g' },
        { name: 'Fat', color: 'var(--series-3)', values: fatB.values, unit: 'g' }
      ],
      type: 'line',
      yMinZero: true,
      emptyMessage: 'No carbohydrate or fat logs in this period.'
    });

    // 6. Workout performance over time (total sets per day with logged sessions)
    const wkSetsByDate = {};
    state.workouts.forEach((w) => {
      const sets = w.exercises.reduce((acc, ex) => acc + (Number(ex.sets) || 0), 0);
      wkSetsByDate[w.date] = (wkSetsByDate[w.date] || 0) + sets;
    });
    const wkRaw = dates.map((d) => (wkSetsByDate[d] !== undefined ? wkSetsByDate[d] : null));
    const wkB = bucketSeries(dates, wkRaw, gran);
    document.getElementById('stat-workout-perf').textContent = calcPeriodStat(wkRaw, ' sets');
    renderSVGChart(document.getElementById('chart-workout-perf'), {
      labels: wkB.labels,
      series: [{ name: 'Total Sets', color: 'var(--accent)', values: wkB.values, unit: 'sets' }],
      type: 'bar',
      yMinZero: true,
      emptyMessage: 'No workouts logged in this period.'
    });

    // 7. Exercise-specific strength progression
    renderExerciseStrengthChart(dates);

    // 8. Water consumption over time
    const watRaw = dates.map((d) => {
      const l = state.healthLogs[d];
      return l && l.water !== null && l.water !== undefined ? l.water : null;
    });
    const watB = bucketSeries(dates, watRaw, gran);
    document.getElementById('stat-water').textContent = calcPeriodStat(watRaw, ' ml');
    renderSVGChart(document.getElementById('chart-water'), {
      labels: watB.labels,
      series: [{ name: 'Water', color: 'var(--series-2)', values: watB.values, unit: 'ml' }],
      type: 'bar',
      targetValue: state.targets.water,
      yMinZero: true,
      emptyMessage: 'No water entries in this period.'
    });

    // 9. Sleep duration over time
    const slpRaw = dates.map((d) => {
      const l = state.healthLogs[d];
      return l && l.sleep !== null && l.sleep !== undefined ? l.sleep : null;
    });
    const slpB = bucketSeries(dates, slpRaw, gran);
    document.getElementById('stat-sleep').textContent = calcPeriodStat(slpRaw, ' hrs');
    renderSVGChart(document.getElementById('chart-sleep'), {
      labels: slpB.labels,
      series: [{ name: 'Sleep', color: 'var(--series-4)', values: slpB.values, unit: 'hrs' }],
      type: 'line',
      targetValue: state.targets.sleep,
      yMinZero: true,
      emptyMessage: 'No sleep entries in this period.'
    });

    // 10. Daily steps over time
    const stpRaw = dates.map((d) => {
      const l = state.healthLogs[d];
      return l && l.steps !== null && l.steps !== undefined ? l.steps : null;
    });
    const stpB = bucketSeries(dates, stpRaw, gran);
    document.getElementById('stat-steps').textContent = calcPeriodStat(stpRaw, '');
    renderSVGChart(document.getElementById('chart-steps'), {
      labels: stpB.labels,
      series: [{ name: 'Steps', color: 'var(--accent)', values: stpB.values, unit: 'steps' }],
      type: 'bar',
      targetValue: state.targets.steps,
      yMinZero: true,
      emptyMessage: 'No step entries in this period.'
    });
  }

  function renderExerciseStrengthChart(dates) {
    const sel = document.getElementById('chart-exercise-select');
    const loggedExercises = Array.from(
      new Set(state.workouts.flatMap((w) => w.exercises.map((e) => e.name)))
    ).sort();

    if (loggedExercises.length === 0) {
      sel.innerHTML = '<option value="">No exercises logged</option>';
      renderSVGChart(document.getElementById('chart-exercise-strength'), {
        labels: [],
        series: [],
        emptyMessage: 'Log workouts to view exercise-specific strength progression.'
      });
      return;
    }

    if (!loggedExercises.includes(uiState.selectedStrengthExercise)) {
      uiState.selectedStrengthExercise = loggedExercises[0];
    }
    sel.innerHTML = loggedExercises
      .map((n) => `<option value="${esc(n)}" ${n === uiState.selectedStrengthExercise ? 'selected' : ''}>${esc(n)}</option>`)
      .join('');

    const exName = uiState.selectedStrengthExercise;
    const prefUnit = state.profile.weightUnit;
    const minDate = dates[0];
    const maxDate = dates[dates.length - 1];

    const records = [];
    state.workouts
      .filter((w) => w.date >= minDate && w.date <= maxDate)
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
      .forEach((w) => {
        w.exercises
          .filter((e) => e.name === exName)
          .forEach((e) => {
            const isBW = e.equipment === 'Bodyweight' && (e.weight === null || e.weight === '');
            const val = isBW ? Number(e.reps) : roundNum(convertWeight(e.weight, e.unit, prefUnit), 1);
            records.push({
              date: formatShortDate(w.date),
              val,
              unit: isBW ? 'reps' : prefUnit,
              meta: `${e.sets} sets × ${e.reps} reps (${e.equipment})`
            });
          });
      });

    renderSVGChart(document.getElementById('chart-exercise-strength'), {
      labels: records.map((r) => r.date),
      series: [
        {
          name: exName,
          color: 'var(--accent)',
          values: records.map((r) => r.val),
          unit: records[0] ? records[0].unit : prefUnit,
          meta: records.map((r) => r.meta)
        }
      ],
      type: 'line',
      emptyMessage: `No ${exName} entries in the selected date range.`
    });
  }

  function renderWeightHistoryTab() {
    const prefUnit = state.profile.weightUnit;
    const sorted = [...state.weights].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    const summaryEl = document.getElementById('weight-history-summary');
    const tableEl = document.getElementById('weight-history-table');

    if (sorted.length === 0) {
      summaryEl.innerHTML = '';
      tableEl.innerHTML = '<div class="empty-state">No body weight entries recorded yet.</div>';
      return;
    }

    const latest = sorted[0];
    const oldest = sorted[sorted.length - 1];
    const latestW = roundNum(convertWeight(latest.weight, latest.unit, prefUnit), 1);
    const oldestW = roundNum(convertWeight(oldest.weight, oldest.unit, prefUnit), 1);
    const diff = roundNum(latestW - oldestW, 1);
    const latestBMI = calculateBMI(toKg(latest.weight, latest.unit), latest.heightCm || state.profile.heightCm);

    summaryEl.innerHTML = `
      <div class="stat-box"><div class="stat-label">Latest Weight</div><div class="metric-value">${latestW}<span class="metric-unit">${prefUnit}</span></div></div>
      <div class="stat-box"><div class="stat-label">Current BMI</div><div class="metric-value">${latestBMI !== null ? latestBMI : '—'}</div></div>
      <div class="stat-box"><div class="stat-label">Net Change</div><div class="metric-value">${diff > 0 ? '+' : ''}${diff}<span class="metric-unit">${prefUnit}</span></div></div>
      <div class="stat-box"><div class="stat-label">Total Entries</div><div class="metric-value">${sorted.length}</div></div>
    `;

    tableEl.innerHTML = `
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th class="table-num">Recorded</th>
              <th class="table-num">Weight (${prefUnit})</th>
              <th class="table-num">Height (cm)</th>
              <th class="table-num">BMI</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${sorted
              .map((w) => {
                const wPref = roundNum(convertWeight(w.weight, w.unit, prefUnit), 1);
                const h = w.heightCm || state.profile.heightCm;
                const bmi = calculateBMI(toKg(w.weight, w.unit), h);
                return `
                  <tr>
                    <td class="num">${esc(w.date)}</td>
                    <td class="table-num">${w.weight} ${w.unit}</td>
                    <td class="table-num"><strong>${wPref} ${prefUnit}</strong></td>
                    <td class="table-num">${h || '—'}</td>
                    <td class="table-num">${bmi !== null ? bmi : '—'}</td>
                    <td class="table-num">
                      <button type="button" class="btn btn-ghost btn-sm" data-wt-edit="${esc(w.id)}">Edit</button>
                      <button type="button" class="btn btn-ghost btn-sm" data-wt-del="${esc(w.id)}">Delete</button>
                    </td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `;

    tableEl.querySelectorAll('[data-wt-edit]').forEach((b) => {
      b.addEventListener('click', () => {
        const entry = state.weights.find((x) => x.id === b.dataset.wtEdit);
        if (entry) openQuickWeightModal(entry);
      });
    });
    tableEl.querySelectorAll('[data-wt-del]').forEach((b) => {
      b.addEventListener('click', () => {
        state.weights = state.weights.filter((x) => x.id !== b.dataset.wtDel);
        saveState();
        renderProgress();
        showToast('Weight entry deleted.');
      });
    });
  }

  function renderHealthHistoryTab() {
    const dates = Object.keys(state.healthLogs).sort((a, b) => (a < b ? 1 : -1));
    const tableEl = document.getElementById('health-history-table');
    const waterUnit = state.profile.waterUnit;

    if (dates.length === 0) {
      tableEl.innerHTML = '<div class="empty-state">No water, sleep, or step records logged yet.</div>';
      return;
    }

    tableEl.innerHTML = `
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th class="table-num">Water</th>
              <th class="table-num">Sleep</th>
              <th class="table-num">Steps</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${dates
              .map((d) => {
                const l = state.healthLogs[d];
                return `
                  <tr>
                    <td class="num">${esc(d)}</td>
                    <td class="table-num">${l.water !== null && l.water !== undefined ? formatWater(l.water, waterUnit) : '—'}</td>
                    <td class="table-num">${l.sleep !== null && l.sleep !== undefined ? `${roundNum(l.sleep, 1)} hrs` : '—'}</td>
                    <td class="table-num">${l.steps !== null && l.steps !== undefined ? Number(l.steps).toLocaleString() : '—'}</td>
                    <td class="table-num">
                      <button type="button" class="btn btn-ghost btn-sm" data-hl-edit="${esc(d)}">Edit</button>
                      <button type="button" class="btn btn-ghost btn-sm" data-hl-del="${esc(d)}">Delete</button>
                    </td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `;

    tableEl.querySelectorAll('[data-hl-edit]').forEach((b) => {
      b.addEventListener('click', () => openQuickHealthModal('water', b.dataset.hlEdit));
    });
    tableEl.querySelectorAll('[data-hl-del]').forEach((b) => {
      b.addEventListener('click', () => {
        delete state.healthLogs[b.dataset.hlDel];
        saveState();
        renderProgress();
        showToast('Daily health record deleted.');
      });
    });
  }

  // -------------------- Progress Photo Journal --------------------

  function renderStorageBanner(el) {
    if (!el) return;
    const stats = getStorageStats();
    let cls = 'storage-banner';
    let note = 'Local browser storage is healthy.';
    if (stats.pct >= 88) {
      cls += ' crit';
      note = 'Storage is nearly full. Export a JSON backup and delete older progress photos to avoid losing new entries.';
    } else if (stats.pct >= 70) {
      cls += ' warn';
      note = 'Photo storage is approaching browser capacity. Consider exporting a backup soon.';
    }
    el.className = cls;
    el.innerHTML = `
      <div class="flex-between">
        <strong>Local Storage Usage</strong>
        <span class="num">${stats.totalKB} KB / ${stats.budgetMB} MB (${stats.pct}%) · Photos: ${stats.photoKB} KB</span>
      </div>
      <div class="progress-track"><div class="progress-fill ${stats.pct >= 70 ? 'over' : ''}" style="width:${stats.pct}%"></div></div>
      <div class="metric-sub">${note}</div>
    `;
  }

  function renderPhotoJournalTab() {
    renderStorageBanner(document.getElementById('photo-storage-banner'));

    const sorted = [...state.photos].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    const selA = document.getElementById('photo-compare-a');
    const selB = document.getElementById('photo-compare-b');
    const compareView = document.getElementById('photo-compare-view');
    const galleryEl = document.getElementById('photo-gallery-grid');

    if (sorted.length === 0) {
      selA.innerHTML = '<option value="">No photos</option>';
      selB.innerHTML = '<option value="">No photos</option>';
      compareView.innerHTML = '<div class="empty-state" style="grid-column:span 2;">Add at least two progress photos to compare them side by side.</div>';
      galleryEl.innerHTML = '<div class="empty-state" style="grid-column:1 / -1;">No progress photos stored yet. All photos stay strictly on your device.</div>';
      return;
    }

    const opts = sorted.map((p) => `<option value="${esc(p.id)}">${esc(p.date)}${p.note ? ` — ${esc(p.note.slice(0, 28))}` : ''}</option>`).join('');
    selA.innerHTML = opts;
    selB.innerHTML = opts;

    if (sorted.some((p) => p.id === uiState.photoCompareA)) {
      selA.value = uiState.photoCompareA;
    } else {
      selA.value = sorted[sorted.length - 1].id;
      uiState.photoCompareA = selA.value;
    }
    if (sorted.some((p) => p.id === uiState.photoCompareB)) {
      selB.value = uiState.photoCompareB;
    } else {
      selB.value = sorted[0].id;
      uiState.photoCompareB = selB.value;
    }

    const photoA = sorted.find((p) => p.id === selA.value);
    const photoB = sorted.find((p) => p.id === selB.value);

    const renderSlot = (p, label) => {
      if (!p) return `<div class="empty-state">${label}</div>`;
      return `
        <div class="photo-compare-slot">
          <img src="${p.dataUrl}" alt="Progress photo on ${esc(p.date)}">
          <div class="photo-meta">
            <strong>${esc(p.date)}</strong>
            ${p.note ? `<div class="metric-sub">${esc(p.note)}</div>` : ''}
          </div>
        </div>
      `;
    };
    compareView.innerHTML = `${renderSlot(photoA, 'Photo A')}${renderSlot(photoB, 'Photo B')}`;

    galleryEl.innerHTML = sorted
      .map(
        (p) => `
        <div class="photo-card">
          <img src="${p.dataUrl}" alt="Progress photo on ${esc(p.date)}" data-photo-view="${esc(p.id)}">
          <div class="photo-card-footer">
            <strong class="num" style="font-size:0.82rem;">${esc(p.date)}</strong>
            ${p.note ? `<div class="metric-sub">${esc(p.note)}</div>` : ''}
            <button type="button" class="btn btn-ghost btn-sm" data-photo-del="${esc(p.id)}">Delete</button>
          </div>
        </div>
      `
      )
      .join('');
    galleryEl.querySelectorAll('[data-photo-view]').forEach((img) => {
      img.addEventListener('click', () => {
        const p = state.photos.find((x) => x.id === img.dataset.photoView);
        if (!p) return;
        openModal({
          title: `Progress Photo — ${p.date}`,
          bodyHtml: `
            <img src="${p.dataUrl}" alt="Progress photo" style="width:100%;max-height:60vh;object-fit:contain;border-radius:var(--radius-sm);">
            ${p.note ? `<p style="margin:6px 0 0;font-size:0.88rem;">${esc(p.note)}</p>` : ''}
          `,
          footerButtons: [{ label: 'Close', className: 'btn-primary', onClick: closeModal }]
        });
      });
    });

    galleryEl.querySelectorAll('[data-photo-del]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = state.photos.find((x) => x.id === btn.dataset.photoDel);
        if (!p) return;
        confirmAction({
          title: 'Delete Progress Photo',
          message: `Permanently remove the photo from ${esc(p.date)}?`,
          confirmLabel: 'Delete',
          danger: true,
          onConfirm: () => {
            state.photos = state.photos.filter((x) => x.id !== p.id);
            saveState();
            renderPhotoJournalTab();
            showToast('Photo deleted.');
          }
        });
      });
    });
  }

  function compressImageFile(file, maxDim = 800, quality = 0.72) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read image file.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Invalid image file.'));
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w >= h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function openAddPhotoModal() {
    openModal({
      title: 'Add Progress Photo',
      bodyHtml: `
        <form class="form-stack">
          <div class="form-group">
            <label for="ph-file">Select Photograph</label>
            <input type="file" id="ph-file" accept="image/*" required>
          </div>
          <div class="form-group">
            <label for="ph-date">Date</label>
            <input type="date" id="ph-date" value="${getTodayISO()}" required>
          </div>
          <div class="form-group">
            <label for="ph-note">Notes (optional)</label>
            <input type="text" id="ph-note" placeholder="e.g. Morning check-in, Week 8">
          </div>
          <p class="card-note">Photos are compressed locally to save browser storage and are never uploaded externally.</p>
        </form>
      `,
      footerButtons: [
        { label: 'Cancel', className: 'btn-secondary', onClick: closeModal },
        {
          label: 'Save Photo',
          className: 'btn-primary',
          onClick: async () => {
            const fileInput = document.getElementById('ph-file');
            const date = document.getElementById('ph-date').value;
            const note = document.getElementById('ph-note').value.trim();
            if (!fileInput.files || !fileInput.files[0]) {
              showToast('Please select an image file.', true);
              return;
            }
            if (!date) {
              showToast('Please select a date.', true);
              return;
            }
            try {
              const dataUrl = await compressImageFile(fileInput.files[0]);
              const entry = {
                id: generateId('ph'),
                date,
                note,
                dataUrl,
                sizeBytes: new Blob([dataUrl]).size
              };
              state.photos.push(entry);
              const res = saveState();
              if (!res.ok) {
                state.photos.pop();
                return;
              }
              closeModal();
              renderPhotoJournalTab();
              showToast('Progress photo saved locally.');
            } catch (err) {
              showToast(err.message || 'Could not process image.', true);
            }
          }
        }
      ]
    });
  }

  // -------------------- SECTION 5: PROFILE & DATA BACKUP --------------------

  let workingMicroTargets = [];

  function renderProfile() {
    document.getElementById('profile-name').value = state.profile.name || '';
    document.getElementById('profile-height').value = state.profile.heightCm !== null ? state.profile.heightCm : '';
    document.getElementById('profile-weight-unit').value = state.profile.weightUnit;
    document.getElementById('profile-theme').value = state.profile.theme;
    document.getElementById('profile-water-unit').value = state.profile.waterUnit;

    const t = state.targets;
    document.getElementById('target-calories').value = t.calories !== null ? t.calories : '';
    document.getElementById('target-protein').value = t.protein !== null ? t.protein : '';
    document.getElementById('target-carbs').value = t.carbs !== null ? t.carbs : '';
    document.getElementById('target-fat').value = t.fat !== null ? t.fat : '';
    document.getElementById('target-fibre').value = t.fibre !== null ? t.fibre : '';
    document.getElementById('target-sugar').value = t.sugar !== null ? t.sugar : '';
    document.getElementById('target-sodium').value = t.sodium !== null ? t.sodium : '';
    document.getElementById('target-water').value = t.water !== null ? t.water : '';
    document.getElementById('target-sleep').value = t.sleep !== null ? t.sleep : '';
    document.getElementById('target-steps').value = t.steps !== null ? t.steps : '';

    workingMicroTargets = (t.micronutrients || []).map((m) => ({ ...m }));
    renderMicroTargetRows();
    renderStorageBanner(document.getElementById('profile-storage-summary'));
  }

  function renderMicroTargetRows() {
    const container = document.getElementById('micro-targets-rows');
    container.innerHTML = workingMicroTargets
      .map(
        (m, idx) => `
        <div class="form-row-4" style="align-items:end;">
          <div class="form-group" style="grid-column: span 2;">
            <label>Micronutrient</label>
            <input type="text" class="mt-name" data-idx="${idx}" value="${esc(m.name)}" placeholder="e.g. Vitamin D, Iron">
          </div>
          <div class="form-group">
            <label>Daily Target</label>
            <input type="number" class="mt-val" data-idx="${idx}" step="0.1" min="0" value="${m.target !== null ? m.target : ''}">
          </div>
          <div class="form-group">
            <label>Unit</label>
            <div style="display:flex;gap:4px;">
              <input type="text" class="mt-unit" data-idx="${idx}" value="${esc(m.unit)}" placeholder="mg/mcg">
              <button type="button" class="btn-icon-sm mt-rm" data-idx="${idx}" aria-label="Remove">&times;</button>
            </div>
          </div>
        </div>
      `
      )
      .join('');

    container.querySelectorAll('.mt-name').forEach((el) => {
      el.addEventListener('input', () => { workingMicroTargets[Number(el.dataset.idx)].name = el.value; });
    });
    container.querySelectorAll('.mt-val').forEach((el) => {
      el.addEventListener('input', () => { workingMicroTargets[Number(el.dataset.idx)].target = parseOptionalNumber(el.value); });
    });
    container.querySelectorAll('.mt-unit').forEach((el) => {
      el.addEventListener('input', () => { workingMicroTargets[Number(el.dataset.idx)].unit = el.value; });
    });
    container.querySelectorAll('.mt-rm').forEach((el) => {
      el.addEventListener('click', () => {
        workingMicroTargets.splice(Number(el.dataset.idx), 1);
        renderMicroTargetRows();
      });
    });
  }

  function setBackupFeedback(msg, isError = false) {
    const el = document.getElementById('backup-feedback');
    if (!el) return;
    el.textContent = msg;
    el.className = `inline-feedback ${isError ? 'error' : 'success'}`;
  }

  function exportBackupJSON() {
    try {
      const payload = {
        app: 'GymLog',
        exportedAt: new Date().toISOString(),
        schemaVersion: SCHEMA_VERSION,
        data: state
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gymlog-backup-${getTodayISO()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setBackupFeedback(`Backup exported successfully (${a.download}).`, false);
      showToast('JSON backup exported.');
    } catch (err) {
      setBackupFeedback('Failed to export JSON backup.', true);
      showToast('Export failed.', true);
    }
  }

  function validateBackupPayload(parsed) {
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'File does not contain a valid JSON object.' };
    }
    const candidate = parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;
    if (candidate.schemaVersion === undefined && !Array.isArray(candidate.workouts) && !candidate.profile) {
      return { valid: false, error: 'File is not a recognized GymLog backup.' };
    }
    if (candidate.workouts !== undefined && !Array.isArray(candidate.workouts)) {
      return { valid: false, error: 'Invalid workouts structure in backup file.' };
    }
    if (candidate.weights !== undefined && !Array.isArray(candidate.weights)) {
      return { valid: false, error: 'Invalid weights structure in backup file.' };
    }
    if (candidate.photos !== undefined && !Array.isArray(candidate.photos)) {
      return { valid: false, error: 'Invalid photos structure in backup file.' };
    }
    return { valid: true, data: migrateAndNormalizeData(candidate) };
  }

  function handleImportFileSelected(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onerror = () => {
      setBackupFeedback('Could not read the selected file.', true);
      showToast('Import failed.', true);
    };
    reader.onload = () => {
      let parsed;
      try {
        parsed = JSON.parse(reader.result);
      } catch (err) {
        setBackupFeedback('Invalid JSON syntax in the selected file.', true);
        showToast('Invalid JSON file.', true);
        return;
      }

      const check = validateBackupPayload(parsed);
      if (!check.valid) {
        setBackupFeedback(`Import rejected: ${check.error}`, true);
        showToast(check.error, true);
        return;
      }

      const incoming = check.data;
      const curCounts = {
        workouts: state.workouts.length,
        nutritionDays: Object.keys(state.nutritionLogs).length,
        weights: state.weights.length,
        photos: state.photos.length
      };
      const newCounts = {
        workouts: incoming.workouts.length,
        nutritionDays: Object.keys(incoming.nutritionLogs).length,
        weights: incoming.weights.length,
        photos: incoming.photos.length
      };

      openModal({
        title: 'Confirm Backup Restore',
        bodyHtml: `
          <p style="margin:0;font-size:0.88rem;color:var(--text-secondary);">
            Restoring this backup will replace your current local GymLog data. Review the summary before proceeding:
          </p>
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>Record Type</th><th class="table-num">Current</th><th class="table-num">Backup</th></tr></thead>
              <tbody>
                <tr><td>Workouts</td><td class="table-num">${curCounts.workouts}</td><td class="table-num">${newCounts.workouts}</td></tr>
                <tr><td>Nutrition Days</td><td class="table-num">${curCounts.nutritionDays}</td><td class="table-num">${newCounts.nutritionDays}</td></tr>
                <tr><td>Weight Entries</td><td class="table-num">${curCounts.weights}</td><td class="table-num">${newCounts.weights}</td></tr>
                <tr><td>Progress Photos</td><td class="table-num">${curCounts.photos}</td><td class="table-num">${newCounts.photos}</td></tr>
              </tbody>
            </table>
          </div>
        `,
        footerButtons: [
          { label: 'Cancel', className: 'btn-secondary', onClick: closeModal },
          {
            label: 'Replace & Restore',
            className: 'btn-primary',
            id: 'confirm-import-btn',
            onClick: () => {
              state = incoming;
              applyTheme(state.profile.theme, false);
              const res = saveState();
              closeModal();
              if (res.ok) {
                renderActiveSection();
                setBackupFeedback('Backup restored successfully.', false);
                showToast('Backup restored.');
              } else {
                setBackupFeedback('Restore failed: backup exceeds browser storage quota.', true);
              }
            }
          }
        ]
      });
    };
    reader.readAsText(file);
  }

  // -------------------- Event Wiring & Init --------------------

  function bindEvents() {
    // Primary Navigation
    document.querySelectorAll('.nav-btn, .bottom-nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => navigateTo(btn.dataset.section));
    });

    // Sub-tabs
    document.querySelectorAll('.subtab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sectionEl = btn.closest('.page-section');
        if (!sectionEl) return;
        const sectionName = sectionEl.id.replace('section-', '');
        activateSubtab(sectionName, btn.dataset.subtab);
        renderActiveSection();
      });
    });

    // Cross-section link buttons
    document.querySelectorAll('[data-goto]').forEach((btn) => {
      btn.addEventListener('click', () => navigateTo(btn.dataset.goto));
    });

    // Theme toggle
    document.getElementById('theme-toggle-btn').addEventListener('click', () => {
      applyTheme(state.profile.theme === 'dark' ? 'light' : 'dark', true);
    });

    // Modal close
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('modal-backdrop').addEventListener('click', (e) => {
      if (e.target.id === 'modal-backdrop') closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    // Home date controls, trend detail and global quick actions
    document.getElementById('home-prev-day').addEventListener('click', () => {
      uiState.homeDate = shiftISODate(uiState.homeDate, -1);
      renderHome();
    });
    document.getElementById('home-next-day').addEventListener('click', () => {
      uiState.homeDate = shiftISODate(uiState.homeDate, 1);
      renderHome();
    });
    document.getElementById('home-today-btn').addEventListener('click', () => {
      uiState.homeDate = getTodayISO();
      renderHome();
    });
    document.getElementById('home-date-picker').addEventListener('change', (e) => {
      if (e.target.value) {
        uiState.homeDate = e.target.value;
        renderHome();
      }
    });

    document.getElementById('home-expand-trends').addEventListener('click', () => {
      uiState.homeTrendDetailOpen = true;
      document.getElementById('home-dashboard-view').classList.add('hidden');
      document.getElementById('home-trends-detail').classList.remove('hidden');
      renderHomeDetailedCharts();
    });
    document.getElementById('home-trends-back').addEventListener('click', () => {
      uiState.homeTrendDetailOpen = false;
      document.getElementById('home-trends-detail').classList.add('hidden');
      document.getElementById('home-dashboard-view').classList.remove('hidden');
    });

    document.querySelectorAll('[data-home-goto]').forEach((card) => {
      const open = () => navigateTo(card.dataset.homeGoto);
      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });
    });

    const quickToggle = document.getElementById('quick-actions-toggle');
    const quickMenu = document.getElementById('quick-actions-menu');
    quickToggle.addEventListener('click', () => {
      const willOpen = quickMenu.classList.contains('hidden');
      quickMenu.classList.toggle('hidden', !willOpen);
      quickToggle.setAttribute('aria-expanded', String(willOpen));
    });
    document.querySelectorAll('[data-home-quick]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.homeQuick;
        quickMenu.classList.add('hidden');
        quickToggle.setAttribute('aria-expanded', 'false');
        if (action === 'workout') navigateTo('workouts', 'workouts-schedule');
        else if (action === 'water') openQuickHealthModal('water', uiState.homeDate);
        else if (action === 'sleep') openQuickHealthModal('sleep', uiState.homeDate);
        else if (action === 'steps') openQuickHealthModal('steps', uiState.homeDate);
        else if (action === 'weight') openQuickWeightModal();
      });
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.quick-menu-wrap')) {
        quickMenu.classList.add('hidden');
        quickToggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Workouts: daily checklist, recurring schedule and weekday consistency
    const workoutDate = document.getElementById('workout-selected-date');
    workoutDate.value = uiState.workoutDate || getTodayISO();
    workoutDate.addEventListener('change', () => { if (workoutDate.value) { uiState.workoutDate = workoutDate.value; renderWorkoutDay(workoutDate.value); } });
    document.getElementById('workout-date-prev').addEventListener('click', () => {
      workoutDate.value = shiftISODate(workoutDate.value, -1); uiState.workoutDate = workoutDate.value; renderWorkoutDay(workoutDate.value);
    });
    document.getElementById('workout-date-next').addEventListener('click', () => {
      workoutDate.value = shiftISODate(workoutDate.value, 1); uiState.workoutDate = workoutDate.value; renderWorkoutDay(workoutDate.value);
    });
    document.getElementById('compare-weekday-select').value = uiState.compareWeekday;
    document.getElementById('compare-weekday-select').addEventListener('change', (e) => { uiState.compareWeekday = e.target.value; renderWeekdayComparison(); });
    document.getElementById('btn-add-custom-exercise').addEventListener('click', () => openCustomExerciseModal());
    document.getElementById('library-search').addEventListener('input', renderExerciseLibrary);
    document.getElementById('library-search-clear').addEventListener('click', () => { document.getElementById('library-search').value=''; renderExerciseLibrary(); });
    document.querySelectorAll('[data-library-view]').forEach((b) => b.addEventListener('click', () => { uiState.libraryView=b.dataset.libraryView; renderExerciseLibrary(); }));

    // Nutrition events
    document.getElementById('nutrition-prev-day').addEventListener('click', () => {
      uiState.nutritionDate = shiftISODate(uiState.nutritionDate, -1);
      renderNutrition();
    });
    document.getElementById('nutrition-next-day').addEventListener('click', () => {
      uiState.nutritionDate = shiftISODate(uiState.nutritionDate, 1);
      renderNutrition();
    });
    document.getElementById('nutrition-date-picker').addEventListener('change', (e) => {
      if (e.target.value) {
        uiState.nutritionDate = e.target.value;
        renderNutrition();
      }
    });
    document.getElementById('btn-open-food-modal').addEventListener('click', () => {
      openFoodEntryModal({ mode: 'daily', dateISO: uiState.nutritionDate });
    });
    document.getElementById('btn-add-from-saved').addEventListener('click', () => {
      openPickSavedFoodModal(uiState.nutritionDate);
    });
    document.getElementById('btn-create-saved-food').addEventListener('click', () => {
      openFoodEntryModal({ mode: 'profile' });
    });
    document.getElementById('saved-food-search').addEventListener('input', renderSavedFoodsList);

    // Progress events
    document.getElementById('progress-range').addEventListener('change', (e) => {
      uiState.progressRange = e.target.value;
      renderAllProgressCharts();
    });
    document.getElementById('progress-granularity').addEventListener('change', (e) => {
      uiState.progressGranularity = e.target.value;
      renderAllProgressCharts();
    });
    document.getElementById('chart-exercise-select').addEventListener('change', (e) => {
      uiState.selectedStrengthExercise = e.target.value;
      renderExerciseStrengthChart(getDateWindow(uiState.progressRange));
    });
    document.getElementById('btn-add-weight-entry').addEventListener('click', () => openQuickWeightModal());
    document.getElementById('btn-add-photo').addEventListener('click', openAddPhotoModal);
    document.getElementById('photo-compare-a').addEventListener('change', (e) => {
      uiState.photoCompareA = e.target.value;
      renderPhotoJournalTab();
    });
    document.getElementById('photo-compare-b').addEventListener('change', (e) => {
      uiState.photoCompareB = e.target.value;
      renderPhotoJournalTab();
    });

    // Profile events
    document.getElementById('profile-info-form').addEventListener('submit', (e) => {
      e.preventDefault();
      state.profile.name = document.getElementById('profile-name').value.trim();
      state.profile.heightCm = parseOptionalNumber(document.getElementById('profile-height').value);
      state.profile.weightUnit = document.getElementById('profile-weight-unit').value;
      state.profile.waterUnit = document.getElementById('profile-water-unit').value;
      const newTheme = document.getElementById('profile-theme').value;
      applyTheme(newTheme, false);
      saveState();
      renderProfile();
      renderHeaderGreeting();
      showToast('Profile settings saved.');
    });

    document.getElementById('btn-add-micro-target').addEventListener('click', () => {
      workingMicroTargets.push({ name: '', target: null, unit: 'mg' });
      renderMicroTargetRows();
    });

    document.getElementById('profile-targets-form').addEventListener('submit', (e) => {
      e.preventDefault();
      state.targets.calories = parseOptionalNumber(document.getElementById('target-calories').value);
      state.targets.protein = parseOptionalNumber(document.getElementById('target-protein').value);
      state.targets.carbs = parseOptionalNumber(document.getElementById('target-carbs').value);
      state.targets.fat = parseOptionalNumber(document.getElementById('target-fat').value);
      state.targets.fibre = parseOptionalNumber(document.getElementById('target-fibre').value);
      state.targets.sugar = parseOptionalNumber(document.getElementById('target-sugar').value);
      state.targets.sodium = parseOptionalNumber(document.getElementById('target-sodium').value);
      state.targets.water = parseOptionalNumber(document.getElementById('target-water').value);
      state.targets.sleep = parseOptionalNumber(document.getElementById('target-sleep').value);
      state.targets.steps = parseOptionalNumber(document.getElementById('target-steps').value);
      state.targets.micronutrients = workingMicroTargets
        .filter((m) => m.name && m.name.trim())
        .map((m) => ({ name: m.name.trim(), target: m.target, unit: (m.unit || '').trim() }));
      saveState();
      showToast('Daily targets saved.');
    });

    document.getElementById('btn-export-json').addEventListener('click', exportBackupJSON);
    document.getElementById('import-json-input').addEventListener('change', handleImportFileSelected);
    document.getElementById('btn-reset-data').addEventListener('click', () => {
      confirmAction({
        title: 'Reset All Local Data',
        message: 'This will permanently erase all workouts, nutrition logs, weights, health logs, photos, and settings stored in this browser. Export a JSON backup first if you want to keep your history.',
        confirmLabel: 'Erase All Data',
        danger: true,
        onConfirm: () => {
          const currentTheme = state.profile.theme;
          state = createDefaultState();
          state.profile.theme = currentTheme;
          saveState();
          renderActiveSection();
          showToast('All local data cleared.');
        }
      });
    });
  }

  function init() {
    loadState();
    document.getElementById('compare-weekday-select').value = uiState.compareWeekday;
    bindEvents();
    renderActiveSection();
    window.setInterval(updateHomeClock, 30000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();