/* Result page: reads the last-submitted response (via session storage
   id), displays the top category and full percentage breakdown. */

(function () {
  const emojiEl = document.getElementById("result-emoji");
  const headlineEl = document.getElementById("result-headline");
  const subtextEl = document.getElementById("result-subtext");
  const barsEl = document.getElementById("result-bars");
  const descEl = document.getElementById("result-desc");
  const tipsEl = document.getElementById("result-tips");

  function loadLastResponse() {
    const id = sessionStorage.getItem("last_response_id");
    if (!id) return null;
    const all = getResponses();
    return all.find(r => r.id === id) || null;
  }

  const response = loadLastResponse();

  if (!response) {
    headlineEl.textContent = "No result yet";
    subtextEl.textContent = "Please complete the survey first.";
    emojiEl.textContent = "🤔";
    descEl.textContent = "Take the survey to see your driving profile.";
    return;
  }

  const top = topCategory(response.percentages);
  const name = response.name || "there";

  emojiEl.textContent = top.emoji;
  headlineEl.textContent = "You are a " + top.label + "!";
  subtextEl.innerHTML =
    "Hi <strong>" + name + "</strong>, here's your driving profile based on your answers.";

  // Sort categories by percentage descending for display.
  const sorted = [...CATEGORIES].sort((a, b) => response.percentages[b.key] - response.percentages[a.key]);

  barsEl.innerHTML = "";
  sorted.forEach(cat => {
    const pct = response.percentages[cat.key] || 0;
    const row = document.createElement("div");
    row.className = "result-bar-row";

    const label = document.createElement("div");
    label.className = "result-bar-name";
    label.textContent = cat.emoji + " " + cat.short;

    const track = document.createElement("div");
    track.className = "result-bar-track";
    const fill = document.createElement("div");
    fill.className = "result-bar-fill";
    fill.style.width = pct + "%";
    fill.style.background = cat.color;
    track.appendChild(fill);

    const val = document.createElement("div");
    val.className = "result-bar-value";
    val.textContent = pct + "%";

    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(val);
    barsEl.appendChild(row);
  });

  descEl.textContent = top.desc;

  // Simple safety tips keyed to the top category.
  const TIPS = {
    defensive: ["Keep up the great habits — always stay alert and anticipate other road users.", "Continue leaving safe following distances and signalling early."],
    riskTaker: ["Remember that every risky move increases your chance of an accident.", "Try to slow down and leave more margin for the unexpected."],
    aggressive: ["Take a breath before reacting to other drivers — patience saves lives.", "Avoid tailgating and brake-checking; give yourself space."],
    speeder: ["Speed limits exist for a reason — obey them, especially in busy areas.", "Arriving a few minutes early is never worth a crash."],
    cautious: ["Your care is a strength — just avoid being so hesitant that you confuse others.", "Keep decisions predictable and smooth for surrounding traffic."]
  };

  tipsEl.innerHTML = "";
  (TIPS[top.key] || []).forEach(t => {
    const li = document.createElement("li");
    li.textContent = t;
    tipsEl.appendChild(li);
  });
})();
