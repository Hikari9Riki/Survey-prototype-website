/* =========================================================
   Shared data & storage helpers for the Driving/Safety survey
   prototype. This single source of truth defines categories,
   questions, scoring and localStorage helpers.
   ========================================================= */

// Categories that answers map to. Each has a key, label, colour, emoji
// and a short description shown on the result page.
const CATEGORIES = [
  {
    key: "defensive",
    label: "Defensive Driver",
    short: "Defensive",
    emoji: "🛡️",
    color: "#10b981",
    desc: "You anticipate hazards, follow rules and prioritise safety for everyone on the road."
  },
  {
    key: "riskTaker",
    label: "Risk-Taker",
    short: "Risk-Taker",
    emoji: "🎲",
    color: "#ef4444",
    desc: "You enjoy taking chances and often push the limits, sometimes beyond what is safe."
  },
  {
    key: "aggressive",
    label: "Aggressive Driver",
    short: "Aggressive",
    emoji: "😤",
    color: "#f97316",
    desc: "You tend to react emotionally, drive assertively and can be impatient in traffic."
  },
  {
    key: "speeder",
    label: "Speeder",
    short: "Speeder",
    emoji: "⚡",
    color: "#f59e0b",
    desc: "You like to move fast and frequently exceed speed limits to get where you're going."
  },
  {
    key: "cautious",
    label: "Cautious Driver",
    short: "Cautious",
    emoji: "🐢",
    color: "#6366f1",
    desc: "You are careful and measured, sometimes overly hesitant, prioritising safety above all."
  }
];

// Each question's options carry a score map: { categoryKey: points }.
// Points are summed per category, then converted to percentages.
const QUESTIONS = [
  {
    id: "q1",
    text: "When a traffic light turns amber (yellow), what do you usually do?",
    options: [
      { text: "Slow down to stop safely", scores: { defensive: 2, cautious: 1 } },
      { text: "Speed up to beat the red light", scores: { riskTaker: 2, speeder: 1 } },
      { text: "Depends on my mood, sometimes speed", scores: { aggressive: 2 } },
      { text: "Look around first, then decide", scores: { cautious: 2 } }
    ]
  },
  {
    id: "q2",
    text: "What is your typical speed on the highway?",
    options: [
      { text: "Below the speed limit", scores: { cautious: 2 } },
      { text: "Exactly at the speed limit", scores: { defensive: 2 } },
      { text: "10–20 km/h over the limit", scores: { speeder: 2 } },
      { text: "As fast as possible", scores: { riskTaker: 2, aggressive: 1 } }
    ]
  },
  {
    id: "q3",
    text: "How often do you use your turn signals when turning or changing lanes?",
    options: [
      { text: "Always, without fail", scores: { defensive: 2 } },
      { text: "Most of the time", scores: { cautious: 2 } },
      { text: "Only when there are other cars", scores: { aggressive: 2 } },
      { text: "Rarely / never", scores: { riskTaker: 2 } }
    ]
  },
  {
    id: "q4",
    text: "When someone tailgates you, what do you do?",
    options: [
      { text: "Let them pass me safely", scores: { defensive: 2 } },
      { text: "Maintain my speed and stay calm", scores: { cautious: 2 } },
      { text: "Brake-check them to teach a lesson", scores: { aggressive: 2, riskTaker: 1 } },
      { text: "Speed up to get away", scores: { speeder: 2 } }
    ]
  },
  {
    id: "q5",
    text: "What following distance do you usually keep from the car ahead?",
    options: [
      { text: "A large, safe gap", scores: { cautious: 2, defensive: 1 } },
      { text: "A moderate gap", scores: { defensive: 2 } },
      { text: "Fairly close", scores: { aggressive: 2 } },
      { text: "Very close, almost bumper-to-bumper", scores: { riskTaker: 2 } }
    ]
  },
  {
    id: "q6",
    text: "How do you feel about weaving through traffic to get ahead?",
    options: [
      { text: "I never do it", scores: { defensive: 2, cautious: 1 } },
      { text: "Occasionally, if I'm in a hurry", scores: { cautious: 2 } },
      { text: "Sometimes, it feels efficient", scores: { speeder: 2 } },
      { text: "All the time", scores: { riskTaker: 2, aggressive: 1 } }
    ]
  },
  {
    id: "q7",
    text: "When you are stressed or angry, how does your driving change?",
    options: [
      { text: "I stay calm and controlled", scores: { defensive: 2 } },
      { text: "I become more careful and slow", scores: { cautious: 2 } },
      { text: "I drive faster than usual", scores: { speeder: 2 } },
      { text: "I get more aggressive and impatient", scores: { aggressive: 2, riskTaker: 1 } }
    ]
  },
  {
    id: "q8",
    text: "How do you overtake other vehicles?",
    options: [
      { text: "Only when safe with plenty of space", scores: { defensive: 2 } },
      { text: "When I need to, very carefully", scores: { cautious: 2 } },
      { text: "Frequently, to keep moving", scores: { speeder: 2 } },
      { text: "Aggressively, even on curves", scores: { riskTaker: 2, aggressive: 1 } }
    ]
  }
];

// ---------- Storage helpers ----------
const STORAGE_KEYS = {
  responses: "survey_responses",
  adminLoggedIn: "survey_admin_logged_in"
};

function getResponses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.responses);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveResponses(responses) {
  localStorage.setItem(STORAGE_KEYS.responses, JSON.stringify(responses));
}

function addResponse(response) {
  const all = getResponses();
  response.id = "r" + Date.now() + Math.floor(Math.random() * 1000);
  response.createdAt = new Date().toISOString();
  all.push(response);
  saveResponses(all);
  return response;
}

// Dummy admin users (email login). Google login is a simulated flow.
const ADMIN_USERS = [
  { email: "admin@demo.com", password: "admin123", name: "Admin Demo" },
  { email: "survey@demo.com", password: "123456", name: "Survey Admin" }
];

function setAdminLoggedIn(user) {
  localStorage.setItem(STORAGE_KEYS.adminLoggedIn, JSON.stringify(user));
}

function getAdminLoggedIn() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.adminLoggedIn);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function clearAdminLoggedIn() {
  localStorage.removeItem(STORAGE_KEYS.adminLoggedIn);
}

// ---------- Scoring ----------
// Given an array of { qid, optionIndex }, compute percentage per category.
function computeScores(selectedOptions) {
  const totals = {};
  CATEGORIES.forEach(c => (totals[c.key] = 0));

  selectedOptions.forEach(sel => {
    const q = QUESTIONS.find(q => q.id === sel.qid);
    if (!q) return;
    const opt = q.options[sel.optionIndex];
    if (!opt) return;
    Object.entries(opt.scores).forEach(([key, pts]) => {
      if (totals[key] !== undefined) totals[key] += pts;
    });
  });

  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0) || 1;

  const percentages = {};
  CATEGORIES.forEach(c => {
    percentages[c.key] = Math.round((totals[c.key] / grandTotal) * 100);
  });

  return { totals, percentages, grandTotal };
}

// Determine the top category from percentages.
function topCategory(percentages) {
  let topKey = CATEGORIES[0].key;
  let topVal = -1;
  CATEGORIES.forEach(c => {
    if (percentages[c.key] > topVal) {
      topVal = percentages[c.key];
      topKey = c.key;
    }
  });
  return CATEGORIES.find(c => c.key === topKey);
}

function categoryByKey(key) {
  return CATEGORIES.find(c => c.key === key);
}

// ---------- Export helpers ----------
function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Utility: escape CSV cell.
function csvCell(v) {
  if (v === null || v === undefined) return "";
  v = String(v);
  if (/[",\n]/.test(v)) {
    return '"' + v.replace(/"/g, '""') + '"';
  }
  return v;
}

// Build CSV from an array of objects (keys become columns).
function toCSV(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(csvCell).join(","),
    ...rows.map(r => headers.map(h => csvCell(r[h])).join(","))
  ];
  return "\uFEFF" + lines.join("\n");
}
