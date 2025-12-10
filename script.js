// ===============================
// CONFIG
// ===============================
const startYear = 1959;
const numYears = 80;
const randomSeed = 42;

// ===============================
// UTILS
// ===============================
function seededRng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = s * 16807 % 2147483647) / 2147483647;
}
const rng = seededRng(randomSeed);
const lerp = (a,b,t) => a + (b-a)*t;

function colorForValue(v, min, max) {
  if (v == null) return "#ccc";
  const t = (v - min) / (max - min);
  const c = Math.max(0, Math.min(1, t));
  const hue = lerp(120, 0, c);
  return `hsl(${hue},80%,55%)`;
}

// ===============================
// STATE DATA
// ===============================
const stateToFIPS = {
  AL:"01", AK:"02", AZ:"04", AR:"05", CA:"06", CO:"08", CT:"09", DE:"10",
  FL:"12", GA:"13", HI:"15", ID:"16", IL:"17", IN:"18", IA:"19", KS:"20",
  KY:"21", LA:"22", ME:"23", MD:"24", MA:"25", MI:"26", MN:"27", MS:"28",
  MO:"29", MT:"30", NE:"31", NV:"32", NH:"33", NJ:"34", NM:"35", NY:"36",
  NC:"37", ND:"38", OH:"39", OK:"40", OR:"41", PA:"42", RI:"44", SC:"45",
  SD:"46", TN:"47", TX:"48", UT:"49", VT:"50", VA:"51", WA:"53", WV:"54",
  WI:"55", WY:"56"
};


// ======================================================
// BASELINE + SPECIES COUNT
// ======================================================
const baseline59 = {
  AL: 4.35, AZ: 10.84, AR: 9.50, CA: 0.09, CO: 0.36, CT: 0.00, DE: 0.00,
  FL: 4.70, GA: 13.44, ID: 0.44, IL: 0.07, IN: 0.04, IA: 0.00, KS: 0.56,
  KY: 7.87, LA: 6.66, MD: 0.11, MA: 0.00, MI: 0.06, MN: 0.00, MS: 8.40,
  MO: 3.07, MT: 0.36, NE: 0.46, NV: 1.13, NH: 0.00, NJ: 0.00, NM: 3.20,
  NY: 0.00, NC: 18.79, ND: 0.00, OH: 0.15, OK: 6.83, OR: 0.40, PA: 0.00,
  RI: 0.00, SC: 11.25, SD: 0.00, TN: 7.83, TX: 14.70, UT: 0.55, VT: 0.00,
  VA: 5.57, WA: 0.12, WV: 3.70, WI: 0.06, WY: 0.57
};

const venomousSpecies = {
  AL:6, AK:0, AZ:13, AR:7, CA:6, CO:3, CT:0, DE:0, FL:6, GA:7, HI:0,
  ID:3, IL:2, IN:2, IA:1, KS:5, KY:4, LA:6, ME:0, MD:2, MA:0, MI:0,
  MN:0, MS:6, MO:5, MT:4, NE:3, NV:5, NH:0, NJ:1, NM:7, NY:1, NC:6,
  ND:1, OH:2, OK:7, OR:3, PA:2, RI:0, SC:6, SD:1, TN:5, TX:15, UT:5,
  VT:0, VA:4, WA:2, WV:3, WI:2, WY:4
};



// ===============================
// LOGISTIC SIM
// ===============================
function simulate() {
  let years = Array.from({length:numYears}, (_,i)=>startYear+i);
  let data = {};

  for (let st in baseline59) {
    let S = baseline59[st];
    let K = S * 2;
    let r = .05;
    data[st] = [S];

    for (let i=1;i<numYears;i++) {
      S = S + r * S * (1 - S/K) + (rng()-.5);
      S = Math.max(0,S);
      data[st].push(+S.toFixed(2));
    }
  }
  return {years, data};
}


function getBiteColor(val) {
  if (val === 0 || val == null || isNaN(val)) return "#d3d3d3"; // grey for zero / no data

  if (val <= 0.2) return "#f9feffff";
  if (val <= 0.4) return "#ccece6";
  if (val <= 0.6) return "rgba(202, 253, 241, 1)";
  if (val <= 0.8) return "#b6fce6ff";
  if (val <= 1.0) return "#71e4a8ff";

  if (val <= 1.2) return "#5ee3a3";
  if (val <= 1.4) return "#46e7a1ff";
  if (val <= 1.6) return "#32ed93";
  if (val <= 1.8) return "#27f96dff";
  if (val <= 2.0) return "#1cff5a";

  if (val <= 2.2) return "#42ff3b";
  if (val <= 2.4) return "#7dff29";
  if (val <= 2.6) return "#c3fd22ff";
  if (val <= 2.8) return "#e8fe1a";
  if (val <= 3.0) return "rgba(238, 255, 51, 1)";

  if (val <= 3.2) return "#ffec3d";
  if (val <= 3.4) return "#ffe033";
  if (val <= 3.6) return "#ffd726";
  if (val <= 3.8) return "#ffcd1a";
  if (val <= 4.0) return "#fff017ff";

  if (val <= 4.2) return "#ffdf00";
  if (val <= 4.4) return "#ffcc00";
  if (val <= 4.6) return "#ffb700";
  if (val <= 4.8) return "#ffa200";
  if (val <= 5.0) return "#ff8c00";

  if (val <= 6.0) return "#ff6a00";
  if (val <= 8.0) return "#ff4800";
  if (val <= 10.0) return "#ff2500";
  if (val <= 12.0) return "#ff0000";
  if (val <= 14.0) return "#d10000";

  if (val <= 16.0) return "#a80000";
  if (val <= 18.0) return "#7f0000";
  return "#4b0000";  // ≥ 20
}

// ===============================
// GLOBAL STATE
// ===============================
let bitesData = {};
let ratioData = {};
let years = [];
let mode = "bites";

// ===============================
// LOAD MAP
// ===============================
fetch("svg-gen/us-states.svg")
  .then(r => r.text())
  .then(svg => {
    document.getElementById("map").innerHTML = svg;
    const sim = simulate();
    years = sim.years;
    bitesData = sim.data;

    for (let st in bitesData) {
      ratioData[st] = bitesData[st].map(v =>
        venomousSpecies[st] ? +(v / venomousSpecies[st]).toFixed(2) : null
      );
    }

    setupUI();
    updateMap(0);
  });

// ===============================
// UPDATE MAP
// ===============================
function updateMap(index) {
  document.getElementById("year-label").textContent = years[index];
  let dataset =
    mode === "bites" ? bitesData :
    mode === "ratio" ? ratioData :
    venomousSpecies;

  let vals = Object.values(dataset)
    .flat()
    .filter(v => v != null);

  let min = Math.min(...vals);
  let max = Math.max(...vals);

  for (let st in dataset) {
    const val = Array.isArray(dataset[st]) ? dataset[st][index] : dataset[st];
    const fips = stateToFIPS[st];
    const path = document.getElementById(fips);
    if (!path) continue;

    path.style.fill = getBiteColor(val);
    path.dataset.value = val;
  }
}

// ===============================
// UI
// ===============================
// choose which year index you want to show (0 = 1959, years.length-1 = last year)
let currentIndex = 0;   // or years.length - 1, if you want the final year

function setupUI() {
  // initial draw
  updateMap(currentIndex);

  // wire buttons
  setupButton("btn-bites", "bites");
  setupButton("btn-species", "species");
  setupButton("btn-ratio", "ratio");

  function setupButton(id, val) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.onclick = () => {
      mode = val;
      // toggle active class
      document.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      // redraw using the fixed index
      updateMap(currentIndex);
    };
  }

  // tooltip
  document.addEventListener("mousemove", e => {
    if (e.target.tagName !== "path") {
      tooltip.style.display = "none";
      return;
    }
    const fips = e.target.id;
    const st = Object.keys(stateToFIPS).find(k => stateToFIPS[k] === fips);
    tooltip.style.display = "block";
    tooltip.textContent = `${st}: ${e.target.dataset.value}`;
    tooltip.style.left = e.clientX + 10 + "px";
    tooltip.style.top = e.clientY + 10 + "px";
  });
}