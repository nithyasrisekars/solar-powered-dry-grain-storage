// Safe thresholds (adjust for your scenario)
const SAFE_TEMP_MIN = 24;     // °C -> Heater ON when temp < SAFE_TEMP_MIN
const SAFE_HUMIDITY_MAX = 60; // %  -> Fan ON when humidity > SAFE_HUMIDITY_MAX (matched to label)

// Elements
const solarEl = document.getElementById('solarValue');
const tempEl = document.getElementById('tempValue');
const humidityEl = document.getElementById('humidityValue');
const heaterEl = document.getElementById('heaterStatus');
const fanEl = document.getElementById('fanStatus');
const lastUpdatedEl = document.getElementById('lastUpdated');
const tempThresholdEl = document.getElementById('tempThreshold');
const humidityThresholdEl = document.getElementById('humidityThreshold');

// Simulation Controls elements
const btnStart = document.getElementById('btnStart');
const btnStop = document.getElementById('btnStop');
const speedRangeEl = document.getElementById('speedRange');
const speedLabelEl = document.getElementById('speedLabel');
const btnSunny = document.getElementById('btnSunny');
const btnRainy = document.getElementById('btnRainy');
const btnColdNight = document.getElementById('btnColdNight');

// Initialize thresholds in UI
tempThresholdEl.textContent = SAFE_TEMP_MIN;
humidityThresholdEl.textContent = SAFE_HUMIDITY_MAX;

// Simulation state
let t = 0;                 // simulation time for solar
let temperature = 28.0;    // starting temp °C
let humidity = 55.0;       // starting humidity %
let solarPower = 0;        // W

// Simulation timer + speed
let simTimer = null;
let simSpeed = 1;

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function formatTime(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function updateAutomationStatus() {
  const heaterOn = temperature < SAFE_TEMP_MIN;
  const fanOn = humidity > SAFE_HUMIDITY_MAX;

  heaterEl.textContent = heaterOn ? 'ON' : 'OFF';
  heaterEl.classList.toggle('on', heaterOn);
  heaterEl.classList.toggle('off', !heaterOn);

  fanEl.textContent = fanOn ? 'ON' : 'OFF';
  fanEl.classList.toggle('on', fanOn);
  fanEl.classList.toggle('off', !fanOn);
}

function updateUI() {
  solarEl.textContent = `${solarPower} W`;
  tempEl.textContent = `${temperature.toFixed(1)} °C`;
  humidityEl.textContent = `${humidity.toFixed(1)} %`;
  lastUpdatedEl.textContent = formatTime(new Date());
  updateAutomationStatus();
}

function simulateStep() {
  // Simulate solar power with a smooth day-like curve + small noise
  t += 0.06; // speed
  const base = Math.max(0, Math.sin(t)); // daytime curve (0..1)
  const noise = (Math.random() - 0.5) * 60; // +/- 30 W
  solarPower = Math.round(clamp(800 * base + noise, 0, 1000)); // 0..1000 W

  // Simulate temperature with gentle drift and clamp
  temperature += (Math.random() - 0.5) * 1.2; // +/- 0.6 °C
  // Solar could add mild warming effect
  temperature += base * 0.1;
  temperature = clamp(temperature, 18, 40);

  // Simulate humidity with gentle drift and clamp
  humidity += (Math.random() - 0.5) * 1.6; // +/- 0.8 %
  // Fan effect: if fan is ON, humidity drops slightly faster
  if (humidity > SAFE_HUMIDITY_MAX) humidity -= 0.4 + Math.random() * 0.3;
  humidity = clamp(humidity, 30, 90);

  updateUI();
}

// Start/Stop controls
function startSimulation() {
  if (simTimer) return;
  simTimer = setInterval(simulateStep, Math.round(2000 / simSpeed));
}

function stopSimulation() {
  if (!simTimer) return;
  clearInterval(simTimer);
  simTimer = null;
}

// Speed control
speedRangeEl?.addEventListener('input', (e) => {
  simSpeed = parseFloat(e.target.value);
  speedLabelEl.textContent = `${simSpeed.toFixed(1)}×`;
  if (simTimer) {
    clearInterval(simTimer);
    simTimer = setInterval(simulateStep, Math.round(2000 / simSpeed));
  }
});

// Scenario buttons
btnSunny?.addEventListener('click', () => {
  // Bright sunny noon: higher solar, slightly warmer, lower humidity
  t = Math.PI / 2; // near solar peak
  temperature = clamp(temperature + 2, 18, 40);
  humidity = clamp(humidity - 8, 30, 90);
  updateUI();
});

btnRainy?.addEventListener('click', () => {
  // Rainy day: lower solar, humidity spikes, temp dips slightly
  t = 0.2; // low solar
  temperature = clamp(temperature - 1.5, 18, 40);
  humidity = clamp(humidity + 10, 30, 90);
  updateUI();
});

btnColdNight?.addEventListener('click', () => {
  // Cold night: minimal solar, temp drops, humidity modestly rises
  t = 0; // night
  temperature = clamp(temperature - 3, 18, 40);
  humidity = clamp(humidity + 4, 30, 90);
  updateUI();
});

// Initial render
updateUI();

// Start in idle until user clicks Start (or uncomment to auto-start)
// setInterval(simulateStep, 2000);
// Auto-start:
startSimulation();