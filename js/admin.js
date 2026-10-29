/* Admin dashboard: auth guard, summary + individual views, detail modal,
   report generation (print/PDF) and CSV/Excel export. */

(function () {
  // ---------- Auth guard ----------
  const admin = getAdminLoggedIn();
  if (!admin) {
    window.location.href = "admin-login.html";
    return;
  }

  const identityEl = document.getElementById("admin-identity");
  identityEl.textContent = (admin.name || "Admin") + " · " + (admin.provider === "google" ? "Google" : "Email");

  // ---------- Element refs ----------
  const sidebarLinks = document.querySelectorAll(".sidebar-link[data-view]");
  const viewTitle = document.getElementById("view-title");
  const viewSummary = document.getElementById("view-summary");
  const viewIndividual = document.getElementById("view-individual");

  const statTotal = document.getElementById("stat-total");
  const statAge = document.getElementById("stat-age");
  const statCar = document.getElementById("stat-car");
  const statBike = document.getElementById("stat-bike");
  const summaryBars = document.getElementById("summary-bars");
  const summaryEmpty = document.getElementById("summary-empty");
  const summaryTopCat = document.getElementById("summary-top-cat");

  const individualTable = document.getElementById("individual-table");
  const individualTbody = individualTable.querySelector("tbody");
  const individualEmpty = document.getElementById("individual-empty");

  const detailModal = document.getElementById("detail-modal");
  const detailName = document.getElementById("detail-name");
  const detailBody = document.getElementById("detail-body");
  const detailClose = document.getElementById("detail-close");

  const reportModal = document.getElementById("report-modal");
  const reportPreview = document.getElementById("report-preview");
  const reportClose = document.getElementById("report-close");
  const reportClose2 = document.getElementById("report-close2");
  const reportPrint = document.getElementById("report-print");

  const toastContainer = document.getElementById("toast-container");
  const exportCsvBtn = document.getElementById("export-csv");
  const exportXlsxBtn = document.getElementById("export-xlsx");
  const logoutBtn = document.getElementById("logout-btn");
  const reportLink = document.getElementById("report-link");
  const sampleLink = document.getElementById("sample-data-link");
  const clearLink = document.getElementById("clear-data-link");

  // ---------- Helpers ----------
  function toast(msg, type) {
    const t = document.createElement("div");
    t.className = "toast " + (type || "");
    t.textContent = msg;
    toastContainer.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }

  function vehicleLabel(v) {
    if (v === "motorcycle") return "Motorcycle";
    if (v === "both") return "Both";
    return "Car";
  }

  function fmtDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function switchView(view) {
    sidebarLinks.forEach(l => l.classList.toggle("active", l.getAttribute("data-view") === view));
    viewSummary.classList.toggle("hidden", view !== "summary");
    viewIndividual.classList.toggle("hidden", view !== "individual");
    viewTitle.textContent = view === "summary" ? "Summary" : "Individual Results";
  }

  // ---------- Rendering ----------
  function renderAll() {
    const responses = getResponses();
    renderSummary(responses);
    renderIndividual(responses);
  }

  function renderSummary(responses) {
    const n = responses.length;
    statTotal.textContent = n;

    if (n === 0) {
      statAge.textContent = "–";
      statCar.textContent = "0";
      statBike.textContent = "0";
      summaryEmpty.classList.remove("hidden");
      summaryBars.innerHTML = "";
      summaryTopCat.textContent = "–";
      return;
    }
    summaryEmpty.classList.add("hidden");

    // stats
    const ages = responses.map(r => r.age).filter(a => typeof a === "number");
    const avgAge = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : "–";
    statAge.textContent = avgAge;
    statCar.textContent = responses.filter(r => r.vehicle === "car").length;
    statBike.textContent = responses.filter(r => r.vehicle === "motorcycle").length;

    // average percentages per category
    const avg = {};
    CATEGORIES.forEach(c => (avg[c.key] = 0));
    responses.forEach(r => {
      CATEGORIES.forEach(c => {
        avg[c.key] += (r.percentages && r.percentages[c.key]) || 0;
      });
    });
    CATEGORIES.forEach(c => (avg[c.key] = Math.round(avg[c.key] / n)));

    // top category by average
    let topKey = CATEGORIES[0].key;
    let topVal = -1;
    CATEGORIES.forEach(c => {
      if (avg[c.key] > topVal) { topVal = avg[c.key]; topKey = c.key; }
    });
    summaryTopCat.textContent = topCategory(avg).emoji + " " + topCategory(avg).label + " (" + topVal + "%)";

    // bars
    const sorted = [...CATEGORIES].sort((a, b) => avg[b.key] - avg[a.key]);
    summaryBars.innerHTML = "";
    sorted.forEach(cat => {
      const row = document.createElement("div");
      row.className = "result-bar-row";
      const label = document.createElement("div");
      label.className = "result-bar-name";
      label.textContent = cat.emoji + " " + cat.short;
      const track = document.createElement("div");
      track.className = "result-bar-track";
      const fill = document.createElement("div");
      fill.className = "result-bar-fill";
      fill.style.width = avg[cat.key] + "%";
      fill.style.background = cat.color;
      track.appendChild(fill);
      const val = document.createElement("div");
      val.className = "result-bar-value";
      val.textContent = avg[cat.key] + "%";
      row.appendChild(label); row.appendChild(track); row.appendChild(val);
      summaryBars.appendChild(row);
    });
  }

  function renderIndividual(responses) {
    individualTbody.innerHTML = "";
    if (responses.length === 0) {
      individualEmpty.classList.remove("hidden");
      return;
    }
    individualEmpty.classList.add("hidden");

    responses.forEach(r => {
      const top = topCategory(r.percentages);
      const tr = document.createElement("tr");
      tr.style.cursor = "pointer";

      const cells = [
        r.name || "Anonymous",
        r.age || "–",
        vehicleLabel(r.vehicle),
        top.emoji + " " + top.label,
        (r.percentages.defensive || 0) + "%",
        (r.percentages.riskTaker || 0) + "%",
        (r.percentages.aggressive || 0) + "%",
        (r.percentages.speeder || 0) + "%",
        (r.percentages.cautious || 0) + "%"
      ];

      cells.forEach(text => {
        const td = document.createElement("td");
        td.textContent = text;
        tr.appendChild(td);
      });

      tr.addEventListener("click", () => openDetail(r));
      individualTbody.appendChild(tr);
    });
  }

  function openDetail(r) {
    const top = topCategory(r.percentages);
    detailName.innerHTML = r.name + " <span class='badge badge-primary'>" + top.emoji + " " + top.label + "</span>";

    let html = "<p class='muted mb-20'>" + vehicleLabel(r.vehicle) + " · Age " + (r.age || "–") +
      (r.email ? " · " + r.email : "") + " · " + fmtDate(r.createdAt) + "</p>";

    // category bars
    const sorted = [...CATEGORIES].sort((a, b) => r.percentages[b.key] - r.percentages[a.key]);
    html += "<div class='result-bars'>";
    sorted.forEach(cat => {
      const pct = r.percentages[cat.key] || 0;
      html +=
        "<div class='result-bar-row'>" +
        "<div class='result-bar-name'>" + cat.emoji + " " + cat.short + "</div>" +
        "<div class='result-bar-track'><div class='result-bar-fill' style='width:" + pct + "%;background:" + cat.color + ";'></div></div>" +
        "<div class='result-bar-value'>" + pct + "%</div>" +
        "</div>";
    });
    html += "</div>";

    // answers
    html += "<div class='card-title' style='font-size:15px;margin-top:8px;'>Their answers</div><ol style='padding-left:20px;color:var(--text-muted);'>";
    QUESTIONS.forEach(q => {
      const sel = r.selections ? r.selections[q.id] : undefined;
      let answerText = "—";
      if (sel !== undefined && q.options[sel]) answerText = q.options[sel].text;
      html += "<li style='margin-bottom:4px;'>" + q.text + " <br/><strong>" + answerText + "</strong></li>";
    });
    html += "</ol>";

    detailBody.innerHTML = html;
    detailModal.classList.add("open");
  }

  // ---------- Report ----------
  function computeReportData() {
    const responses = getResponses();
    const n = responses.length;
    const avg = {};
    CATEGORIES.forEach(c => (avg[c.key] = 0));
    responses.forEach(r => CATEGORIES.forEach(c => (avg[c.key] += (r.percentages && r.percentages[c.key]) || 0)));
    CATEGORIES.forEach(c => (avg[c.key] = n ? Math.round(avg[c.key] / n) : 0));
    return { responses, avg, n };
  }

  function buildReportHTML() {
    const { responses, avg, n } = computeReportData();
    const now = new Date().toLocaleString();
    const top = topCategory(avg);

    let html = "";
    html += "<h2 style='margin-bottom:4px;'>RoadSense Driver/Rider Survey Report</h2>";
    html += "<p style='color:#64748b;margin-bottom:16px;'>Generated: " + now + "</p>";

    html += "<div style='display:flex;gap:24px;margin-bottom:20px;flex-wrap:wrap;'>";
    html += "<div><strong>Total respondents:</strong> " + n + "</div>";
    const carCount = responses.filter(r => r.vehicle === "car").length;
    const bikeCount = responses.filter(r => r.vehicle === "motorcycle").length;
    html += "<div><strong>Car drivers:</strong> " + carCount + "</div>";
    html += "<div><strong>Motorcycle riders:</strong> " + bikeCount + "</div>";
    html += "<div><strong>Most common style:</strong> " + top.emoji + " " + top.label + "</div>";
    html += "</div>";

    // average bars
    html += "<h3 style='margin-bottom:8px;'>Average category distribution</h3>";
    html += "<div style='margin-bottom:20px;'>";
    CATEGORIES.forEach(c => {
      const pct = avg[c.key];
      html += "<div style='margin-bottom:8px;'>";
      html += "<div style='display:flex;justify-content:space-between;font-size:13px;'><span>" + c.emoji + " " + c.label + "</span><span>" + pct + "%</span></div>";
      html += "<div style='background:#f1f5f9;height:16px;border-radius:50px;overflow:hidden;'><div style='height:100%;width:" + pct + "%;background:" + c.color + ";'></div></div>";
      html += "</div>";
    });
    html += "</div>";

    // individual table
    html += "<h3 style='margin-bottom:8px;'>Individual results</h3>";
    html += "<table style='width:100%;border-collapse:collapse;font-size:12px;'>";
    html += "<thead><tr style='background:#f8fafc;text-align:left;'>";
    ["Name", "Age", "Vehicle", "Top Style", "Defensive", "Risk-Taker", "Aggressive", "Speeder", "Cautious"]
      .forEach(h => { html += "<th style='padding:6px 10px;border-bottom:1px solid #e2e8f0;'>" + h + "</th>"; });
    html += "</tr></thead><tbody>";
    responses.forEach(r => {
      const t = topCategory(r.percentages);
      html += "<tr>";
      [r.name, r.age, vehicleLabel(r.vehicle), t.short,
        r.percentages.defensive + "%", r.percentages.riskTaker + "%",
        r.percentages.aggressive + "%", r.percentages.speeder + "%",
        r.percentages.cautious + "%"].forEach(v => {
          html += "<td style='padding:6px 10px;border-bottom:1px solid #e2e8f0;'>" + v + "</td>";
        });
      html += "</tr>";
    });
    html += "</tbody></table>";

    return html;
  }

  function openReport() {
    reportPreview.innerHTML = buildReportHTML();
    reportModal.classList.add("open");
  }

  function printReport() {
    const { responses } = computeReportData();
    const inner = buildReportHTML();
    const w = window.open("", "_blank", "width=820,height=900");
    if (!w) {
      toast("Please allow pop-ups to print the report.", "error");
      return;
    }
    w.document.write(
      "<!DOCTYPE html><html><head><meta charset='utf-8'><title>RoadSense Report</title>" +
      "<style>body{font-family:Segoe UI,system-ui,Arial,sans-serif;color:#0f172a;padding:32px;line-height:1.5;}" +
      "h2{margin:0;}table{width:100%;border-collapse:collapse;font-size:12px;}td,th{padding:6px 10px;border-bottom:1px solid #e2e8f0;text-align:left;}" +
      "@media print{body{padding:10px;}}</style></head><body>" + inner + "</body></html>"
    );
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  }

  // ---------- Export ----------
  function flattenResponses(responses) {
    return responses.map(r => {
      const top = topCategory(r.percentages);
      return {
        Name: r.name || "",
        Age: r.age ?? "",
        Vehicle: vehicleLabel(r.vehicle),
        Email: r.email || "",
        "Top Style": top.label,
        "Defensive %": r.percentages.defensive || 0,
        "Risk-Taker %": r.percentages.riskTaker || 0,
        "Aggressive %": r.percentages.aggressive || 0,
        "Speeder %": r.percentages.speeder || 0,
        "Cautious %": r.percentages.cautious || 0,
        "Submitted At": fmtDate(r.createdAt)
      };
    });
  }

  function exportCSV() {
    const responses = getResponses();
    if (!responses.length) { toast("No data to export.", "error"); return; }
    downloadBlob(toCSV(flattenResponses(responses)), "roadsense_survey_results.csv", "text/csv;charset=utf-8");
    toast("CSV exported.", "success");
  }

  function exportXLSX() {
    const responses = getResponses();
    if (!responses.length) { toast("No data to export.", "error"); return; }
    if (!window.XLSX) {
      toast("Excel library unavailable — exporting CSV instead.", "error");
      return exportCSV();
    }
    const rows = flattenResponses(responses);
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, "roadsense_survey_results.xlsx");
    toast("Excel file exported.", "success");
  }

  // ---------- Sample data ----------
  function buildSampleProfile(name, age, vehicle, optionIndices) {
    const selections = {};
    QUESTIONS.forEach((q, i) => { selections[q.id] = optionIndices[i]; });
    const selectedOptions = Object.entries(selections).map(([qid, optionIndex]) => ({ qid, optionIndex }));
    const scores = computeScores(selectedOptions);
    return { name, age, vehicle, email: "", selections, ...scores };
  }

  const SAMPLE_PROFILES = [
    { name: "Aiman Aziz", age: 28, vehicle: "car", indices: [0, 1, 0, 0, 1, 0, 0, 0] },
    { name: "Siti Nurhaliza", age: 34, vehicle: "car", indices: [3, 0, 1, 1, 0, 1, 1, 1] },
    { name: "Raj Kumar", age: 22, vehicle: "motorcycle", indices: [1, 3, 3, 2, 3, 3, 3, 3] },
    { name: "Mei Ling", age: 19, vehicle: "motorcycle", indices: [1, 2, 2, 3, 2, 2, 2, 2] },
    { name: "Daniel Wong", age: 41, vehicle: "car", indices: [2, 3, 2, 2, 2, 3, 3, 3] },
    { name: "Farah Anis", age: 26, vehicle: "car", indices: [0, 1, 0, 0, 0, 0, 0, 0] },
    { name: "Hafiz Ibrahim", age: 31, vehicle: "motorcycle", indices: [3, 0, 1, 1, 0, 1, 1, 1] },
    { name: "Amirah Zain", age: 24, vehicle: "car", indices: [1, 2, 2, 3, 1, 2, 2, 2] }
  ];

  function loadSampleData() {
    const existing = getResponses();
    if (existing.length > 0) {
      if (!confirm("This will replace your current data with sample data. Continue?")) return;
    }
    const samples = SAMPLE_PROFILES.map(p => buildSampleProfile(p.name, p.age, p.vehicle, p.indices));
    saveResponses(samples);
    renderAll();
    toast("Sample data loaded (" + samples.length + " respondents).", "success");
  }

  function clearAllData() {
    if (getResponses().length === 0) { toast("No data to clear.", "error"); return; }
    if (!confirm("Delete ALL survey responses? This cannot be undone.")) return;
    saveResponses([]);
    renderAll();
    toast("All data cleared.", "success");
  }

  // ---------- Events ----------
  sidebarLinks.forEach(l => l.addEventListener("click", () => switchView(l.getAttribute("data-view"))));
  detailClose.addEventListener("click", () => detailModal.classList.remove("open"));
  detailModal.addEventListener("click", e => { if (e.target === detailModal) detailModal.classList.remove("open"); });
  reportLink.addEventListener("click", openReport);
  reportClose.addEventListener("click", () => reportModal.classList.remove("open"));
  reportClose2.addEventListener("click", () => reportModal.classList.remove("open"));
  reportModal.addEventListener("click", e => { if (e.target === reportModal) reportModal.classList.remove("open"); });
  reportPrint.addEventListener("click", printReport);
  exportCsvBtn.addEventListener("click", exportCSV);
  exportXlsxBtn.addEventListener("click", exportXLSX);
  sampleLink.addEventListener("click", loadSampleData);
  clearLink.addEventListener("click", clearAllData);
  logoutBtn.addEventListener("click", () => { clearAdminLoggedIn(); window.location.href = "admin-login.html"; });

  // initial render
  renderAll();
})();
