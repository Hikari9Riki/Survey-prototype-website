/* Survey page logic: two-step wizard (details -> questions),
   renders questions from QUESTIONS, validates, computes scores,
   stores the response, then redirects to the result page. */

(function () {
  const stepDetails = document.getElementById("step-details");
  const stepQuestions = document.getElementById("step-questions");
  const questionsContainer = document.getElementById("questions-container");
  const progressStep = document.getElementById("progress-step");
  const progressPct = document.getElementById("progress-pct");
  const progressFill = document.getElementById("progress-fill");

  const nameInput = document.getElementById("name");
  const ageInput = document.getElementById("age");
  const vehicleInput = document.getElementById("vehicle");
  const emailInput = document.getElementById("email");

  const detailsNext = document.getElementById("details-next");
  const questionsBack = document.getElementById("questions-back");
  const questionsSubmit = document.getElementById("questions-submit");

  // Store the user's answer selections by question id.
  const selections = {};

  function toast(msg, type) {
    const c = document.getElementById("toast-container");
    const t = document.createElement("div");
    t.className = "toast " + (type || "");
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }

  function updateProgress(step, total) {
    const pct = Math.round(((step - 1) / total) * 100);
    progressStep.textContent = "Step " + step + " of " + total;
    progressPct.textContent = pct + "%";
    progressFill.style.width = pct + "%";
  }

  // Render the questions as selectable option cards.
  function renderQuestions() {
    questionsContainer.innerHTML = "";
    QUESTIONS.forEach((q, qi) => {
      const wrap = document.createElement("div");
      wrap.className = "card";
      wrap.style.marginBottom = "16px";

      const title = document.createElement("div");
      title.className = "card-title";
      title.style.fontSize = "17px";
      title.innerHTML = "Q" + (qi + 1) + ". " + q.text;
      wrap.appendChild(title);

      q.options.forEach((opt, oi) => {
        const label = document.createElement("label");
        label.className = "option-card";
        if (selections[q.id] === oi) label.classList.add("selected");

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = q.id;
        radio.value = oi;
        radio.checked = selections[q.id] === oi;

        const span = document.createElement("span");
        span.textContent = opt.text;

        label.appendChild(radio);
        label.appendChild(span);
        label.addEventListener("click", function () {
          selections[q.id] = oi;
          renderQuestions(); // re-render to update selection highlight
        });

        wrap.appendChild(label);
      });

      questionsContainer.appendChild(wrap);
    });
  }

  function goToDetails() {
    stepQuestions.classList.add("hidden");
    stepDetails.classList.remove("hidden");
    updateProgress(1, 2);
  }

  function goToQuestions() {
    // Validate details
    const name = nameInput.value.trim();
    const age = ageInput.value.trim();
    if (!name) {
      toast("Please enter your name.", "error");
      nameInput.focus();
      return;
    }
    if (!age || isNaN(age) || age < 10 || age > 99) {
      toast("Please enter a valid age (10–99).", "error");
      ageInput.focus();
      return;
    }
    stepDetails.classList.add("hidden");
    stepQuestions.classList.remove("hidden");
    renderQuestions();
    updateProgress(2, 2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateAllAnswers() {
    for (let i = 0; i < QUESTIONS.length; i++) {
      if (selections[QUESTIONS[i].id] === undefined) {
        return { ok: false, question: QUESTIONS[i], index: i };
      }
    }
    return { ok: true };
  }

  function submitSurvey() {
    const v = validateAllAnswers();
    if (!v.ok) {
      toast("Please answer question " + (v.index + 1) + ".", "error");
      const cards = questionsContainer.querySelectorAll(".card");
      if (cards[v.index]) {
        cards[v.index].scrollIntoView({ behavior: "smooth", block: "center" });
        cards[v.index].style.boxShadow = "0 0 0 3px rgba(239,68,68,0.35)";
        setTimeout(() => (cards[v.index].style.boxShadow = ""), 1500);
      }
      return;
    }

    const name = nameInput.value.trim();
    const age = parseInt(ageInput.value, 10);
    const vehicle = vehicleInput.value;
    const email = emailInput.value.trim();

    const selectedOptions = Object.entries(selections).map(([qid, optionIndex]) => ({ qid, optionIndex }));
    const scores = computeScores(selectedOptions);

    const response = {
      name,
      age,
      vehicle,
      email: email || "",
      selections,
      ...scores
    };

    // Save the response locally (prototype storage) and store the last id for the result page.
    const saved = addResponse(response);
    sessionStorage.setItem("last_response_id", saved.id);

    window.location.href = "result.html";
  }

  // Wire up listeners
  detailsNext.addEventListener("click", goToQuestions);
  questionsBack.addEventListener("click", goToDetails);
  questionsSubmit.addEventListener("click", submitSurvey);

  // Allow Enter key on name/age to continue.
  [nameInput, ageInput].forEach(inp => {
    inp.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        goToQuestions();
      }
    });
  });

  updateProgress(1, 2);
})();
