import './styles.css';

const WEEKS_PER_MONTH = 52 / 12;
const DEFAULT_SIM_MINUTES_PER_SECOND = 1;
const ATV_COLORS = ['#64ffda', '#90caf9', '#ffd54f', '#ff8a80', '#ce93d8', '#80cbc4'];

const DEFAULT_PARAMS = {
  seasonLengthMonths: 5,
  sargassumVolumeM3: 7183.15,
  workDaysPerWeek: 6,
  workHoursPerDay: 5,
  trailerCapacityM3: 2.0,
  timePerWorkerLoadM3Minutes: 25,
  atvSpeedKmh: 3,
  beachLengthM: 600,
  loadTransferTimeMinutes: 11,
};

const DEFAULT_SETTINGS = {
  minutesPerSecond: DEFAULT_SIM_MINUTES_PER_SECOND,
  atvOverrideEnabled: false,
  atvOverrideCount: null,
};

const INPUTS = [
  {
    key: 'seasonLengthMonths',
    label: 'Length of season (months)',
    min: 1,
    max: 12,
    step: 0.1,
    section: 'season',
  },
  {
    key: 'sargassumVolumeM3',
    label: 'Estimated Sargassum volume (m³)',
    min: 0,
    max: 20000,
    step: 10,
    section: 'season',
  },
  {
    key: 'workDaysPerWeek',
    label: 'Working days per week',
    min: 1,
    max: 7,
    step: 1,
    section: 'season',
  },
  {
    key: 'workHoursPerDay',
    label: 'Working hours per day',
    min: 1,
    max: 24,
    step: 0.5,
    section: 'season',
  },
  {
    key: 'trailerCapacityM3',
    label: 'Trailer capacity (m³)',
    min: 0.1,
    max: 5,
    step: 0.1,
    section: 'labor',
  },
  {
    key: 'timePerWorkerLoadM3Minutes',
    label: 'Time to load 1 m³ per worker (minutes)',
    min: 1,
    max: 60,
    step: 1,
    section: 'labor',
  },
  {
    key: 'atvSpeedKmh',
    label: 'ATV speed (km/h)',
    min: 0,
    max: 15,
    step: 0.1,
    section: 'atv',
  },
  {
    key: 'beachLengthM',
    label: 'Beach length (m)',
    min: 60,
    max: 1500,
    step: 10,
    section: 'atv',
  },
  {
    key: 'loadTransferTimeMinutes',
    label: 'Load transfer wait (minutes)',
    min: 0,
    max: 60,
    step: 1,
    section: 'atv',
  },
];

const DERIVED_METRICS = [
  {
    key: 'avgDailyRemoval',
    label: 'Average daily removal (m³)',
    format: (v) => formatNumber(v, { maximumFractionDigits: 2 }),
  },
  {
    key: 'avgHourlyRemoval',
    label: 'Average hourly removal (m³)',
    format: (v) => formatNumber(v, { maximumFractionDigits: 2 }),
  },
  {
    key: 'trailersPerDay',
    label: 'Trailer loads per day',
    format: (v) => formatNumber(v, { maximumFractionDigits: 2 }),
  },
  {
    key: 'timeWorkerLoadHours',
    label: 'Worker hours to load trailers (per day)',
    format: (v) => formatNumber(v, { maximumFractionDigits: 2 }),
  },
  {
    key: 'requiredBeachWorkers',
    label: 'Beach workers required (load crew)',
    format: (v) => formatNumber(v, { maximumFractionDigits: 2 }),
  },
  {
    key: 'timeToLoadTrailerMinutes',
    label: 'Time to load trailer (minutes)',
    format: (v) => formatNumber(v, { maximumFractionDigits: 2 }),
  },
  {
    key: 'timeToLoadingAreaMinutes',
    label: 'Travel to loading area (minutes)',
    format: (v) => formatNumber(v, { maximumFractionDigits: 2 }),
  },
  {
    key: 'totalAtvTimePerLoadMinutes',
    label: 'ATV cycle time per load (minutes)',
    format: (v) => formatNumber(v, { maximumFractionDigits: 2 }),
  },
  {
    key: 'timePerAtvHours',
    label: 'ATV duty time (hours/day)',
    format: (v) => formatNumber(v, { maximumFractionDigits: 2 }),
  },
  {
    key: 'requiredAtvs',
    label: 'Required # of ATVs',
    format: (v) => formatNumber(v, { maximumFractionDigits: 2 }),
  },
  {
    key: 'requiredAtvDrivers',
    label: 'Required # of ATV drivers',
    format: (v) => formatNumber(v, { maximumFractionDigits: 2 }),
  },
  {
    key: 'requiredUnloadWorkers',
    label: 'Required # of unload workers',
    format: (v) => formatNumber(v, { maximumFractionDigits: 2 }),
  },
  {
    key: 'integerLoads',
    label: 'Loads simulated today',
    format: (v) => formatNumber(v, { maximumFractionDigits: 0 }),
  },
  {
    key: 'integerAtvs',
    label: 'ATVs in rotation',
    format: (v) => formatNumber(v, { maximumFractionDigits: 0 }),
  },
  {
    key: 'totalMinutes',
    label: 'Day cycle duration (minutes)',
    format: (v) => formatNumber(v, { maximumFractionDigits: 1 }),
    note: 'Full rotation for busiest ATV within the day',
  },
];

function formatNumber(value, options = {}) {
  if (!Number.isFinite(value)) {
    return '—';
  }
  const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    ...options,
  });
  return formatter.format(value);
}

function computeDerived(params) {
  const workingWeeks = params.seasonLengthMonths * WEEKS_PER_MONTH;
  const workingDaysSeason = workingWeeks * params.workDaysPerWeek;

  const avgDailyRemoval = workingDaysSeason > 0 ? params.sargassumVolumeM3 / workingDaysSeason : 0;
  const avgHourlyRemoval = params.workHoursPerDay > 0 ? avgDailyRemoval / params.workHoursPerDay : 0;

  const trailersPerDay = params.trailerCapacityM3 > 0 ? avgDailyRemoval / params.trailerCapacityM3 : 0;
  const timeWorkerLoadMinutes = params.timePerWorkerLoadM3Minutes * avgDailyRemoval;
  const timeWorkerLoadHours = timeWorkerLoadMinutes / 60;
  const requiredBeachWorkers = params.workHoursPerDay > 0 ? timeWorkerLoadHours / params.workHoursPerDay : 0;

  const timeToLoadTrailerMinutes = requiredBeachWorkers > 0
    ? (params.trailerCapacityM3 * params.timePerWorkerLoadM3Minutes) / requiredBeachWorkers
    : 0;

  const metersPerMinute = params.atvSpeedKmh * 1000 / 60;
  const avgDistanceToLoadingAreaM = params.beachLengthM / 2;
  const timeToLoadingAreaMinutes = metersPerMinute > 0
    ? avgDistanceToLoadingAreaM / metersPerMinute
    : 0;

  const timeBackMinutes = timeToLoadingAreaMinutes;
  const totalAtvTimePerLoadMinutes = timeToLoadingAreaMinutes + timeToLoadTrailerMinutes + timeBackMinutes;
  const timePerAtvHours = totalAtvTimePerLoadMinutes * trailersPerDay / 60;
  const requiredAtvs = params.workHoursPerDay > 0 ? timePerAtvHours / params.workHoursPerDay : 0;
  const requiredAtvDrivers = requiredAtvs;

  const requiredUnloadWorkers = params.workHoursPerDay > 0
    ? (trailersPerDay * timeToLoadTrailerMinutes / 60) / params.workHoursPerDay
    : 0;

  const integerLoads = Math.max(1, Math.round(trailersPerDay));
  const integerAtvs = Math.max(1, Math.ceil(requiredAtvs));

  return {
    workingWeeks,
    workingDaysSeason,
    avgDailyRemoval,
    avgHourlyRemoval,
    trailersPerDay,
    timeWorkerLoadHours,
    requiredBeachWorkers,
    timeToLoadTrailerMinutes,
    timeToLoadingAreaMinutes,
    totalAtvTimePerLoadMinutes,
    timePerAtvHours,
    requiredAtvs,
    requiredAtvDrivers,
    requiredUnloadWorkers,
    integerLoads,
    integerAtvs,
  };
}

function buildSimulation(params, derived, options = {}) {
  const numLoads = derived.integerLoads;
  const rawOverrideAtvs = Number(options.overrideAtvCount);
  const manualAtvs = Number.isFinite(rawOverrideAtvs) && rawOverrideAtvs > 0
    ? Math.max(1, Math.round(rawOverrideAtvs))
    : null;
  const numAtvs = manualAtvs ?? derived.integerAtvs;
  const loadMarkers = [];
  const loadStates = [];
  const segmentsByAtv = Array.from({ length: numAtvs }, () => []);
  const availability = Array.from({ length: numAtvs }, () => 0);
  const loadTransferTime = Math.max(0, params.loadTransferTimeMinutes ?? 0);

  if (numLoads <= 0 || numAtvs <= 0) {
    return {
      loadMarkers,
      segmentsByAtv,
      totalMinutes: 0,
      numLoads: 0,
      numAtvs,
      loadStates,
    };
  }

  const segmentLength = params.beachLengthM / numLoads;
  const loadTimeMinutes = derived.timeToLoadTrailerMinutes;
  const speedMPerMin = params.atvSpeedKmh > 0 ? (params.atvSpeedKmh * 1000) / 60 : 0;
  let transferAvailable = 0;

  let totalMinutes = 0;

  const baseSegments = Array.from({ length: numLoads }, (_, idx) => {
    const startPos = idx * segmentLength;
    const endPos = (idx + 1) * segmentLength;
    const center = startPos + segmentLength / 2;
    return {
      loadIndex: idx + 1,
      startPosM: startPos,
      endPosM: endPos,
      centerPosM: center,
    };
  });

  loadMarkers.push(...baseSegments.map((segment) => segment.centerPosM).sort((a, b) => a - b));

  const orderedSegments = [];
  let left = 0;
  let right = numLoads - 1;
  let useLeft = true;

  while (left <= right) {
    if (useLeft) {
      orderedSegments.push({ ...baseSegments[left], crew: 'West crew' });
      left += 1;
    } else {
      orderedSegments.push({ ...baseSegments[right], crew: 'East crew' });
      right -= 1;
    }
    useLeft = !useLeft;
  }

  if (orderedSegments.length && numLoads % 2 === 1) {
    orderedSegments[orderedSegments.length - 1].crew = 'Both crews';
  }

  orderedSegments.forEach((segmentPlan) => {
    const distance = segmentPlan.centerPosM;
    const startPos = segmentPlan.startPosM;
    const endPos = segmentPlan.endPosM;
    const waitPos = Math.min(distance, 5);
    const outboundTravel = speedMPerMin > 0 ? distance / speedMPerMin : 0;
    const returnToHoldTravel = speedMPerMin > 0 ? Math.max(distance - waitPos, 0) / speedMPerMin : 0;
    const finalApproachTravel = speedMPerMin > 0 ? waitPos / speedMPerMin : 0;

    let targetAtv = 0;
    let bestTime = availability[0];
    for (let atv = 1; atv < numAtvs; atv += 1) {
      if (availability[atv] < bestTime - Number.EPSILON) {
        bestTime = availability[atv];
        targetAtv = atv;
      }
    }

    const startTime = availability[targetAtv];
    const outboundEnd = startTime + outboundTravel;
    const loadingEnd = outboundEnd + loadTimeMinutes;

    const returnToHoldEnd = loadingEnd + returnToHoldTravel;
    const baseArrival = returnToHoldEnd + finalApproachTravel;

    let holdDuration = 0;
    let transferEntry = baseArrival;
    if (transferEntry < transferAvailable) {
      holdDuration = transferAvailable - transferEntry;
      transferEntry = transferAvailable;
    }
    const transferEnd = transferEntry + loadTransferTime;

    const addSegment = (segment) => {
      segmentsByAtv[targetAtv].push(segment);
      totalMinutes = Math.max(totalMinutes, segment.endMin);
    };

    addSegment({
      atvId: targetAtv,
      loadId: segmentPlan.loadIndex,
      phase: 'outbound',
      startMin: startTime,
      endMin: outboundEnd,
      startPosM: 0,
      endPosM: distance,
    });

    addSegment({
      atvId: targetAtv,
      loadId: segmentPlan.loadIndex,
      phase: 'loading',
      startMin: outboundEnd,
      endMin: loadingEnd,
      startPosM: distance,
      endPosM: distance,
    });

    if (returnToHoldTravel > 0) {
      addSegment({
        atvId: targetAtv,
        loadId: segmentPlan.loadIndex,
        phase: 'return',
        startMin: loadingEnd,
        endMin: returnToHoldEnd,
        startPosM: distance,
        endPosM: waitPos,
      });
    } else {
      // no travel needed, reuse loading end time
      addSegment({
        atvId: targetAtv,
        loadId: segmentPlan.loadIndex,
        phase: 'return',
        startMin: loadingEnd,
        endMin: loadingEnd,
        startPosM: distance,
        endPosM: waitPos,
      });
    }

    if (holdDuration > 0) {
      addSegment({
        atvId: targetAtv,
        loadId: segmentPlan.loadIndex,
        phase: 'hold',
        startMin: returnToHoldEnd,
        endMin: returnToHoldEnd + holdDuration,
        startPosM: waitPos,
        endPosM: waitPos,
      });
    }

    addSegment({
      atvId: targetAtv,
      loadId: segmentPlan.loadIndex,
      phase: 'approach',
      startMin: returnToHoldEnd + holdDuration,
      endMin: transferEntry,
      startPosM: waitPos,
      endPosM: 0,
    });

    addSegment({
      atvId: targetAtv,
      loadId: segmentPlan.loadIndex,
      phase: 'transfer',
      startMin: transferEntry,
      endMin: transferEnd,
      startPosM: 0,
      endPosM: 0,
    });

    availability[targetAtv] = transferEnd;
    transferAvailable = transferEnd;

    loadStates.push({
      startPosM: startPos,
      endPosM: endPos,
      arrivalMin: outboundEnd,
      cleanedAtMinute: loadingEnd,
      crew: segmentPlan.crew,
      loadId: segmentPlan.loadIndex,
    });
  });

  return {
    loadMarkers,
    segmentsByAtv: segmentsByAtv.map((segments) => segments.sort((a, b) => a.startMin - b.startMin)),
    totalMinutes,
    numLoads,
    numAtvs,
    loadStates,
    overrideAtvCount: manualAtvs,
  };
}

function createLayout() {
  const app = document.querySelector('#app');
  app.innerHTML = `
    <section class="controls">
      <div class="control-header">
        <h1>HMB Beach Cleanup Model</h1>
        <p>Set the season-scale inputs from the spreadsheet; the animation shows how one workday plays out with those assumptions.</p>
      </div>
      <div class="controls-groups">
        <div class="control-group">
          <h2>Season Parameters</h2>
          <div class="input-grid" data-section="season"></div>
        </div>
        <div class="control-group">
          <h2>Trailer &amp; Labor</h2>
          <div class="input-grid" data-section="labor"></div>
        </div>
        <div class="control-group">
          <h2>ATV Operations</h2>
          <div class="input-grid" data-section="atv"></div>
          <div class="field override-field">
            <label for="atvOverrideToggle">Override # of ATVs</label>
            <div class="override-controls">
              <select id="atvOverrideToggle">
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
              <input
                type="number"
                id="atvOverrideInput"
                min="1"
                step="1"
                placeholder="Manual count"
              />
            </div>
            <span class="field-note" id="atvOverrideHint"></span>
          </div>
        </div>
      </div>
      <div class="derived-section" id="derivedSection">
        <div class="derived-header">
          <h2>Derived Metrics</h2>
          <button type="button" class="toggle-derived" id="toggleDerived">Hide metrics</button>
        </div>
        <ul class="metrics-list" id="derivedMetrics"></ul>
      </div>
      <div class="status" id="status"></div>
    </section>
    <section class="simulation">
      <div class="canvas-container">
        <canvas id="beachCanvas" width="960" height="520"></canvas>
        <div class="canvas-overlay canvas-overlay-top">
          <span id="timeLabel" class="sim-time">Sim time 00:00</span>
          <div class="speed-slider">
            <input type="range" id="speedSlider" min="1" max="60" step="1" />
            <span id="speedValue"></span>
          </div>
        </div>
        <div class="canvas-overlay canvas-overlay-bottom">
          <span id="detailsLabel"></span>
        </div>
      </div>
    </section>
  `;

  return {
    canvas: document.querySelector('#beachCanvas'),
    derivedList: document.querySelector('#derivedMetrics'),
    status: document.querySelector('#status'),
    timeLabel: document.querySelector('#timeLabel'),
    detailsLabel: document.querySelector('#detailsLabel'),
    derivedSection: document.querySelector('#derivedSection'),
    derivedToggle: document.querySelector('#toggleDerived'),
    speedSlider: document.querySelector('#speedSlider'),
    speedValue: document.querySelector('#speedValue'),
    atvOverrideToggle: document.querySelector('#atvOverrideToggle'),
    atvOverrideInput: document.querySelector('#atvOverrideInput'),
    atvOverrideHint: document.querySelector('#atvOverrideHint'),
  };
}

function renderInputs(params, onChange) {
  INPUTS.forEach((config) => {
    const parent = document.querySelector(`[data-section="${config.section}"]`);
    if (!parent) {
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'field';

    const label = document.createElement('label');
    label.textContent = config.label;

    let input;

    if (config.type === 'select' && Array.isArray(config.options)) {
      input = document.createElement('select');
      config.options.forEach((option) => {
        const optEl = document.createElement('option');
        optEl.value = String(option.value);
        optEl.textContent = option.label;
        input.append(optEl);
      });
      input.value = String(params[config.key]);
      input.addEventListener('change', () => {
        const raw = input.value;
        const numeric = Number(raw);
        const allNumeric = config.options.every((option) => typeof option.value === 'number');
        const value = allNumeric && Number.isFinite(numeric) ? numeric : raw;
        onChange(config.key, value);
      });
    } else {
      input = document.createElement('input');
      const inputType = config.type === 'text' ? 'text' : 'number';
      input.type = inputType;

      if (config.key === 'trailerCapacityM3') {
        input.value = Number(params[config.key] ?? 0).toFixed(1);
      } else {
        input.value = String(params[config.key] ?? '');
      }

      if (config.placeholder) {
        input.placeholder = config.placeholder;
      }

      if (inputType === 'number') {
        if (config.min !== undefined) input.min = String(config.min);
        if (config.max !== undefined) input.max = String(config.max);
        if (config.step !== undefined) input.step = String(config.step);

        const handleUpdate = () => {
          const value = Number(input.value);
          if (!Number.isFinite(value)) {
            return;
          }
          onChange(config.key, value);
          if (config.key === 'trailerCapacityM3') {
            input.value = value.toFixed(1);
          }
        };

        if (config.key === 'trailerCapacityM3') {
          input.addEventListener('change', handleUpdate);
          input.addEventListener('blur', handleUpdate);
        } else {
          input.addEventListener('input', handleUpdate);
        }
      } else {
        input.addEventListener('input', () => {
          onChange(config.key, input.value);
        });
      }
    }

    wrapper.append(label, input);
    parent.append(wrapper);
  });
}

function renderSpeedControl(settings, onChange) {
  const slider = document.querySelector('#speedSlider');
  const valueEl = document.querySelector('#speedValue');
  if (!slider || !valueEl) {
    return;
  }

  const applyValue = (value) => {
    const rounded = Math.max(1, Math.round(value));
    valueEl.textContent = `1 s → ${rounded} min`;
    onChange(value);
  };

  slider.value = String(settings.minutesPerSecond);
  applyValue(settings.minutesPerSecond);

  slider.addEventListener('input', () => {
    const parsed = Number(slider.value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return;
    }
    settings.minutesPerSecond = parsed;
    applyValue(parsed);
  });
}

function renderAtvOverrideControl(settings, refresh, elements = {}) {
  const toggle = elements.toggle ?? document.querySelector('#atvOverrideToggle');
  const input = elements.input ?? document.querySelector('#atvOverrideInput');
  if (!toggle || !input) {
    return;
  }

  const syncInputDisabled = (enabled) => {
    input.disabled = !enabled;
    if (!enabled) {
      settings.atvOverrideCount = null;
      input.value = '';
    }
  };

  toggle.value = settings.atvOverrideEnabled ? 'yes' : 'no';

  if (settings.atvOverrideCount != null) {
    input.value = String(settings.atvOverrideCount);
  }
  syncInputDisabled(settings.atvOverrideEnabled);

  toggle.addEventListener('change', () => {
    const enabled = toggle.value === 'yes';
    settings.atvOverrideEnabled = enabled;
    if (enabled && !input.value) {
      const computed = Number(toggle.dataset.computedAtvs);
      if (Number.isFinite(computed) && computed > 0) {
        settings.atvOverrideCount = Math.max(1, Math.round(computed));
        input.value = String(settings.atvOverrideCount);
      }
    }
    syncInputDisabled(enabled);
    refresh();
  });

  const commitInputValue = () => {
    if (!settings.atvOverrideEnabled) {
      return;
    }

    const parsed = Number(input.value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      settings.atvOverrideCount = null;
      input.value = '';
      refresh();
      return;
    }

    settings.atvOverrideCount = Math.round(parsed);
    input.value = String(settings.atvOverrideCount);
    refresh();
  };

  input.addEventListener('blur', commitInputValue);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      commitInputValue();
    }
  });
}

function renderDerived(listEl, derived, totals) {
  listEl.innerHTML = '';
  DERIVED_METRICS.forEach((metric) => {
    let value;
    if (metric.key === 'totalMinutes') {
      value = totals.totalMinutes;
    } else if (metric.key === 'integerAtvs') {
      value = totals.integerAtvs ?? derived.integerAtvs;
    } else {
      value = derived[metric.key];
    }
    const li = document.createElement('li');
    li.className = 'metric-card';

    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = metric.label;

    const valueEl = document.createElement('span');
    valueEl.className = 'value';
    valueEl.textContent = metric.format ? metric.format(value) : String(value);

    li.append(label, valueEl);

    if (metric.key === 'integerAtvs' && totals.overrideAtvs) {
      const note = document.createElement('span');
      note.className = 'note';
      const computedLabel = formatNumber(totals.computedIntegerAtvs, { maximumFractionDigits: 0 });
      note.textContent = `Manual override active (computed ${computedLabel})`;
      li.append(note);
    } else if (metric.note) {
      const note = document.createElement('span');
      note.className = 'note';
      note.textContent = metric.note;
      li.append(note);
    }

    listEl.append(li);
  });
}

function createAnimator(canvas, timeLabel, detailsLabel) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const padding = 70;

  let simulation = {
    loadMarkers: [],
    loadStates: [],
    segmentsByAtv: [],
    totalMinutes: 1,
    numAtvs: 0,
    numLoads: 0,
    beachLength: DEFAULT_PARAMS.beachLengthM,
  };

  let paramsRef = { ...DEFAULT_PARAMS };
  let animationStart = null;
  let minutesPerSecond = DEFAULT_SIM_MINUTES_PER_SECOND;
  let orientationByAtv = [];

  const beachTop = height * 0.3;
  const beachBottom = height * 0.7;

  function updateSimulation(newSimulation, params) {
    simulation = {
      ...newSimulation,
      beachLength: params.beachLengthM,
    };
    paramsRef = { ...params };
    animationStart = null;
    orientationByAtv = new Array(simulation.numAtvs).fill(1);
  }

  function updateSpeed(value) {
    minutesPerSecond = value;
  }

  function drawTimestamp(simMinutes) {
    const hours = Math.floor(simMinutes / 60);
    const minutes = Math.floor(simMinutes % 60);
    const seconds = Math.floor((simMinutes % 1) * 60);
    const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    if (timeLabel) {
      timeLabel.textContent = `Sim time ${timeString}`;
    }
  }

  function drawBackground() {
    ctx.fillStyle = '#0f2034';
    ctx.fillRect(0, 0, width, height);

    const grad = ctx.createLinearGradient(0, beachTop, 0, beachBottom);
    grad.addColorStop(0, 'rgba(230, 254, 255, 0.08)');
    grad.addColorStop(0.5, 'rgba(110, 192, 230, 0.18)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');

    ctx.fillStyle = grad;
    ctx.fillRect(padding, beachTop, width - padding * 2, beachBottom - beachTop);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, beachBottom);
    ctx.lineTo(width - padding, beachBottom);
    ctx.stroke();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '16px "Inter", sans-serif';
    const labelY = Math.min(height - 12, beachBottom + 28);
    const beachLengthLabel = formatNumber(paramsRef.beachLengthM, { maximumFractionDigits: 0 });
    ctx.fillText(`Beach length = ${beachLengthLabel} m`, width / 2, labelY);
    ctx.restore();
  }

  function drawSargassum(simMinutes) {
    const widthAvailable = width - padding * 2;
    const beachHeight = beachBottom - beachTop;
    const sargassumHeight = beachHeight * 0.25;
    const sargassumTop = beachBottom - sargassumHeight;

    simulation.loadStates.forEach((state) => {
      const xStart = padding + (state.startPosM / simulation.beachLength) * widthAvailable;
      const xEnd = padding + (state.endPosM / simulation.beachLength) * widthAvailable;
      const arrival = state.arrivalMin;
      const cleaned = state.cleanedAtMinute;

      if (cleaned <= 0 || simMinutes >= cleaned) {
        return;
      }

      let alpha = 1;
      if (simMinutes > arrival) {
        const duration = Math.max(cleaned - arrival, 0.01);
        const progress = Math.min(Math.max((simMinutes - arrival) / duration, 0), 1);
        alpha = Math.max(0, 1 - progress);
      }

      ctx.save();
      ctx.globalAlpha = alpha;
      const grad = ctx.createLinearGradient(xStart, sargassumTop, xEnd, beachBottom);
      grad.addColorStop(0, 'rgba(121, 85, 72, 0.92)');
      grad.addColorStop(0.5, 'rgba(93, 64, 55, 0.95)');
      grad.addColorStop(1, 'rgba(121, 85, 72, 0.92)');
      ctx.fillStyle = grad;
      ctx.fillRect(xStart, sargassumTop, xEnd - xStart, sargassumHeight);
      ctx.restore();
    });
  }

  function getAtvState(segments, simMinutes, prevDirection = 1) {
    if (!segments.length) {
      return { position: 0, phase: 'idle', loadId: null, direction: prevDirection };
    }

    const totalDuration = segments[segments.length - 1].endMin;
    if (totalDuration === 0) {
      return { position: 0, phase: 'idle', loadId: null, direction: prevDirection };
    }

    let t = simMinutes % totalDuration;
    let direction = prevDirection;

    for (let i = 0; i < segments.length; i += 1) {
      const segment = segments[i];
      if (t < segment.startMin) {
        return {
          position: segment.startPosM,
          phase: 'idle',
          loadId: segment.loadId,
          direction,
        };
      }
      if (t <= segment.endMin || segment.endMin === segment.startMin) {
        const duration = segment.endMin - segment.startMin;
        const progress = duration > 0 ? (t - segment.startMin) / duration : 1;
        const position = segment.startPosM + (segment.endPosM - segment.startPosM) * progress;
        const segmentDirection = Math.sign(segment.endPosM - segment.startPosM);
        if (segmentDirection !== 0) {
          direction = segmentDirection;
        }
        return {
          position,
          phase: segment.phase,
          loadId: segment.loadId,
          direction,
        };
      }
    }

    const finalSegment = segments[segments.length - 1];
    const segmentDirection = Math.sign(finalSegment.endPosM - finalSegment.startPosM);
    if (segmentDirection !== 0) {
      direction = segmentDirection;
    }
    return {
      position: finalSegment.endPosM,
      phase: 'idle',
      loadId: finalSegment.loadId,
      direction,
    };
  }

  function drawLoads() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 8]);

    simulation.loadMarkers.forEach((distance) => {
      const x = padding + (distance / simulation.beachLength) * (width - padding * 2);
      ctx.beginPath();
      ctx.moveTo(x, beachTop);
      ctx.lineTo(x, beachBottom);
      ctx.stroke();
    });

    ctx.setLineDash([]);
  }

  function drawAtvWithTrailer(x, y, color, direction = 1) {
    ctx.save();

    const wheelRadius = 5;
    const bodyWidth = 28; // compact ATV body
    const bodyHeight = 12;
    const trailerWidth = 36; // larger trailer footprint
    const trailerHeight = 14;
    const hitchLength = 8;

    const forward = direction >= 0 ? 1 : -1;

    const bodyLeft = x - bodyWidth / 2;
    const bodyTop = y - wheelRadius - bodyHeight;
    const bodyRight = bodyLeft + bodyWidth;

    const trailerTop = y - wheelRadius - trailerHeight + 2;
    let trailerLeft;
    let trailerRight;
    let hitchStartX;
    let hitchEndX;

    if (forward >= 0) {
      trailerRight = bodyLeft - hitchLength;
      trailerLeft = trailerRight - trailerWidth;
      hitchStartX = bodyLeft;
      hitchEndX = trailerRight;
    } else {
      trailerLeft = bodyRight + hitchLength;
      trailerRight = trailerLeft + trailerWidth;
      hitchStartX = bodyRight;
      hitchEndX = trailerLeft;
    }

    ctx.fillStyle = color;
    ctx.fillRect(bodyLeft, bodyTop, bodyWidth, bodyHeight);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(bodyLeft + 6, bodyTop + 3, 12, bodyHeight - 6);

    ctx.fillStyle = color;
    ctx.fillRect(trailerLeft, trailerTop, trailerWidth, trailerHeight);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hitchStartX, y - wheelRadius - 2);
    ctx.lineTo(hitchEndX, y - wheelRadius + 1);
    ctx.stroke();

    const hubColor = 'rgba(15, 32, 52, 0.85)';

    const wheels = [
      { x: bodyLeft + bodyWidth * 0.25, y },
      { x: bodyRight - bodyWidth * 0.25, y },
      { x: trailerLeft + trailerWidth * 0.2, y: y + 1 },
      { x: trailerRight - trailerWidth * 0.2, y: y + 1 },
    ];

    ctx.fillStyle = hubColor;
    wheels.forEach((wheel) => {
      ctx.beginPath();
      ctx.arc(wheel.x, wheel.y, wheelRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.arc(wheel.x, wheel.y, wheelRadius * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = hubColor;
    });

    ctx.fillStyle = 'rgba(15, 32, 52, 0.85)';
    const seatWidth = 12;
    const seatX = forward >= 0 ? bodyRight - seatWidth + 2 : bodyLeft - 2;
    ctx.fillRect(seatX, bodyTop - 6, seatWidth, 6);

    ctx.beginPath();
    if (forward >= 0) {
      ctx.moveTo(bodyRight - bodyWidth * 0.7, bodyTop);
      ctx.lineTo(bodyRight - bodyWidth * 0.4, bodyTop - 8);
      ctx.lineTo(bodyRight - bodyWidth * 0.15, bodyTop - 8);
      ctx.lineTo(bodyRight - bodyWidth * 0.3, bodyTop);
    } else {
      ctx.moveTo(bodyLeft + bodyWidth * 0.7, bodyTop);
      ctx.lineTo(bodyLeft + bodyWidth * 0.4, bodyTop - 8);
      ctx.lineTo(bodyLeft + bodyWidth * 0.15, bodyTop - 8);
      ctx.lineTo(bodyLeft + bodyWidth * 0.3, bodyTop);
    }
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawAtvs(simMinutes) {
    const details = [];

    simulation.segmentsByAtv.forEach((segments, index) => {
      const prevDirection = orientationByAtv[index] ?? 1;
      const { position, phase, loadId, direction } = getAtvState(segments, simMinutes, prevDirection);
      orientationByAtv[index] = direction || prevDirection || 1;
      const color = ATV_COLORS[index % ATV_COLORS.length];
      const x = padding + (position / simulation.beachLength) * (width - padding * 2);
      const y = beachBottom - 30 - (index * 18);

      drawAtvWithTrailer(x, y, color, orientationByAtv[index]);

      ctx.fillStyle = color;
      ctx.font = '12px "Inter", sans-serif';
      ctx.fillText(`ATV ${index + 1}`, x - 20, y + 22);

      const loadState = loadId
        ? simulation.loadStates.find((state) => state.loadId === loadId)
        : undefined;
      const crewLabel = loadState?.crew ?? 'Crew';
      const capacityLabel = formatNumber(paramsRef.trailerCapacityM3, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
      details.push(`ATV ${index + 1}: ${phase} load ${loadId ?? '—'} (${crewLabel}, capacity ${capacityLabel} m³)`);
    });

    detailsLabel.textContent = details.join('  •  ');
  }

  function loop(timestamp) {
    if (!animationStart) {
      animationStart = timestamp;
    }

    const elapsedSeconds = (timestamp - animationStart) / 1000;
    const totalMinutes = Math.max(simulation.totalMinutes, 1);
    const simMinutes = (elapsedSeconds * minutesPerSecond) % totalMinutes;

    drawBackground();
    drawSargassum(simMinutes);
    drawLoads();
    drawAtvs(simMinutes);
    drawTimestamp(simMinutes);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);

  return {
    update: updateSimulation,
    updateSpeed,
  };
}

function updateStatus(element, params, derived) {
  if (params.atvSpeedKmh <= 0) {
    element.textContent = 'Increase ATV speed above zero to animate the transport cycle.';
    return;
  }
  if (derived.trailersPerDay <= 0 || derived.requiredAtvs <= 0) {
    element.textContent = 'Adjust inputs to produce a non-zero workload for ATVs.';
    return;
  }
  element.textContent = '';
}

function main() {
  const params = { ...DEFAULT_PARAMS };
  const settings = { ...DEFAULT_SETTINGS };
  const {
    canvas,
    derivedList,
    status,
    timeLabel,
    detailsLabel,
    derivedSection,
    derivedToggle,
    atvOverrideToggle,
    atvOverrideInput,
    atvOverrideHint,
  } = createLayout();
  const animator = createAnimator(canvas, timeLabel, detailsLabel);
  let derivedCollapsed = false;

  function refresh() {
    const derived = computeDerived(params);
    const overrideAtvCount = settings.atvOverrideEnabled ? settings.atvOverrideCount : null;
    const simulation = buildSimulation(params, derived, { overrideAtvCount });
    const totals = {
      totalMinutes: simulation.totalMinutes,
      integerAtvs: simulation.numAtvs,
      overrideAtvs: simulation.overrideAtvCount != null,
      computedIntegerAtvs: derived.integerAtvs,
    };

    renderDerived(derivedList, derived, totals);
    updateStatus(status, params, derived);
    animator.update(simulation, params);

    if (atvOverrideHint) {
      const computedLabel = formatNumber(derived.integerAtvs, { maximumFractionDigits: 0 });
      if (simulation.overrideAtvCount != null) {
        const manualLabel = formatNumber(simulation.overrideAtvCount, { maximumFractionDigits: 0 });
        atvOverrideHint.textContent = `Manual override active (${manualLabel} ATVs, computed ${computedLabel}).`;
      } else {
        atvOverrideHint.textContent = `Using computed requirement (${computedLabel} ATVs).`;
      }
    }

    if (atvOverrideToggle) {
      atvOverrideToggle.dataset.computedAtvs = String(derived.integerAtvs);
    }

    if (atvOverrideInput) {
      const computedLabel = formatNumber(derived.integerAtvs, { maximumFractionDigits: 0 });
      if (!settings.atvOverrideEnabled || settings.atvOverrideCount == null) {
        atvOverrideInput.placeholder = `Computed ${computedLabel}`;
      }
    }
  }

  renderInputs(params, (key, value) => {
    params[key] = value;
    refresh();
  });

  renderSpeedControl(settings, (value) => {
    animator.updateSpeed(value);
  });

  renderAtvOverrideControl(settings, refresh, {
    toggle: atvOverrideToggle,
    input: atvOverrideInput,
  });

  derivedToggle.addEventListener('click', () => {
    derivedCollapsed = !derivedCollapsed;
    derivedSection.classList.toggle('collapsed', derivedCollapsed);
    derivedToggle.textContent = derivedCollapsed ? 'Show metrics' : 'Hide metrics';
  });

  refresh();
}

main();
