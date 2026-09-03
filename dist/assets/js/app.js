(function () {
  "use strict";

  const STORAGE_KEY = "one_patient_one_plan_demo_v5";
  const SESSION_KEY = "one_patient_one_plan_session";
  const app = document.getElementById("app");
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));

  let state = loadState();
  let session = loadSession();
  let ui = { wizardStep: 1, toastTimer: null, scopeTab: "context", intake: null };

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : clone(window.ONE_PLAN_SEED);
    } catch (_) {
      return clone(window.ONE_PLAN_SEED);
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadSession() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null;
    } catch (_) {
      return null;
    }
  }

  function saveSession(value) {
    session = value;
    if (value) sessionStorage.setItem(SESSION_KEY, JSON.stringify(value));
    else sessionStorage.removeItem(SESSION_KEY);
  }

  function resetTransientUi() {
    clearTimeout(ui.toastTimer);
    ui = { wizardStep: 1, toastTimer: null, scopeTab: "context", intake: null };
  }

  function currentUser() {
    return state.users.find((user) => user.id === session?.userId) || null;
  }

  function initials(name) {
    return String(name).split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  }

  function getPatient(id) {
    return state.patients.find((patient) => patient.id === id) || state.patients[0];
  }

  function getReport(patient) {
    return state.reports.find((report) => report.id === patient.reportId);
  }

  function getAssessment(patientId) {
    return [...state.assessments].reverse().find((assessment) => assessment.patientId === patientId);
  }

  function getMedicationPlan(patientId) {
    return [...(state.medicationPlans || [])].reverse().find((plan) => plan.patientId === patientId) || null;
  }

  function routeInfo() {
    const raw = location.hash.replace(/^#/, "") || "/welcome";
    const [path, query = ""] = raw.split("?");
    return { path, params: new URLSearchParams(query) };
  }

  function navigate(path) {
    if (location.hash === `#${path}`) render();
    else location.hash = path;
  }

  function statusClass(value) {
    const text = String(value).toLowerCase();
    if (text.includes("pending") || text.includes("waiting") || text.includes("incomplete") || text.includes("unreviewed") || text.includes("unverified")) return "pending";
    if (text.includes("verified") || text.includes("approved") || text.includes("ready") || text.includes("benchmark")) return "verified";
    if (text.includes("block") || text.includes("reject")) return "blocked";
    if (text.includes("guideline") || text.includes("evidence") || text.includes("clinical")) return "info";
    return "";
  }

  function statusBadge(text, extra = "") {
    return `<span class="status ${statusClass(text)} ${extra}">${escapeHtml(text)}</span>`;
  }

  function brand(inSidebar = false) {
    return `<a class="brand" href="#/welcome" data-route="/welcome" aria-label="One Patient, One Plan home">
      <span class="brand-mark">1P</span>
      <span class="brand-copy">One Patient, One Plan<small>${inSidebar ? "Care workspace" : "Clinical decision support"}</small></span>
    </a>`;
  }

  function publicNav() {
    return `<nav class="public-nav" aria-label="Public navigation">
      ${brand(false)}
      <div class="public-nav-actions">
        <button class="btn ghost" data-route="/intake">Free health intake</button>
        <button class="btn ghost" data-route="/about">About the PoC</button>
        <button class="btn secondary" data-role-login="doctor">Open demo</button>
      </div>
    </nav>`;
  }

  function publicFooter() {
    return `<footer class="public-footer"><span>One Patient, One Plan · eDC Hackathon</span><span>Educational prototype · intake results require professional assessment</span></footer>`;
  }

  function roleIcon(role) {
    const labels = { doctor: "DR", patient: "PT", assistant: "CA" };
    return `<span class="role-icon ${role}">${labels[role]}</span>`;
  }

  function landingView() {
    return `<div class="public-shell">${publicNav()}
      <main id="main-content" class="hero">
        <section>
          <span class="eyebrow">Personalised anticoagulation</span>
          <h1>One patient.<br><span>One considered plan.</span></h1>
          <p class="hero-lead">A simulated clinical workflow that translates patient characteristics and verified pharmacogenomic information into an explainable warfarin stable-dose assessment for clinician review.</p>
          <div class="hero-actions">
            <button class="btn primary" data-role-login="doctor">Start guided demonstration <span aria-hidden="true">→</span></button>
            <button class="btn secondary" data-route="/about">Review proof-of-concept scope</button>
            <button class="btn ghost" data-route="/intake">Try free health intake</button>
          </div>
          <p class="scope-note"><strong>Scope:</strong> adults with non-valvular atrial fibrillation after a clinician has selected warfarin. This prototype does not diagnose, prescribe, or replace INR monitoring.</p>
        </section>
        <section class="role-panel" aria-labelledby="role-heading">
          <div class="role-panel-head"><h2 id="role-heading">Continue as a demonstration user</h2><p>Each role sees the same fictional care journey from a different perspective.</p></div>
          <div class="role-grid">
            ${roleCard("doctor", "Doctor", "Assess a patient and record a clinical decision")}
            ${roleCard("patient", "Patient", "Submit information and view an approved plan")}
            ${roleCard("assistant", "Clinical Assistant", "Verify PGx reports and review data provenance")}
          </div>
        </section>
      </main>
      <section class="home-intake"><div><span class="eyebrow">No sign-in required</span><h2>Start with the questions that matter.</h2><p>A guided intake adapts to each response, pauses at clear checkpoints and highlights the strongest concern pattern for professional follow-up.</p></div><button class="btn primary" data-route="/intake">Begin guided intake <span aria-hidden="true">→</span></button></section>
      ${publicFooter()}
    </div>`;
  }

  function roleCard(role, title, description) {
    return `<button class="role-card" data-role-login="${role}">${roleIcon(role)}<span><strong>${title}</strong><p>${description}</p></span><span class="arrow" aria-hidden="true">→</span></button>`;
  }

  function loginView(role) {
    const config = {
      doctor: ["Doctor", "Review verified information and generate an assessment."],
      patient: ["Patient", "Share relevant information and view the clinician-approved plan."],
      assistant: ["Clinical Assistant", "Verify reports and maintain the evidence registry."]
    }[role] || ["Doctor", "Review the demonstration workflow."];
    const demoUser = state.users.find((user) => user.role === role);
    return `<div class="public-shell">${publicNav()}<main id="main-content" class="login-wrap">
      <form class="login-card" id="login-form" data-role="${role}">
        ${roleIcon(role)}
        <h1>${config[0]} demonstration sign-in</h1>
        <p>${config[1]}</p>
        <div id="login-error" class="form-error" role="alert">The demonstration credentials do not match this role.</div>
        <div class="field"><label for="email">Demo email</label><input class="input" id="email" name="email" type="email" autocomplete="username" required></div>
        <div class="field" style="margin-top:.8rem"><label for="password">Demo password</label><input class="input" id="password" name="password" type="password" autocomplete="current-password" required></div>
        <div class="demo-credentials"><strong>Demonstration account</strong><br>${escapeHtml(demoUser.email)} · password: demo123</div>
        <button type="button" class="btn secondary wide" data-fill-demo="${role}">Fill demo credentials</button>
        <button type="submit" class="btn primary wide" style="margin-top:.6rem">Sign in to demo</button>
      </form>
    </main>${publicFooter()}</div>`;
  }

  function aboutView() {
    const stories = {
      context: { label: "Patient context", title: "The story starts before the calculation.", text: "Age, body size, current medicines, previous response and patient-reported information remain visible with their source. The doctor can see what is known, what is missing and who supplied it.", image: "./assets/images/consultation.jpg", alt: "Doctor consulting a patient at a desk", credit: "Vitaly Gariev · Unsplash" },
      evidence: { label: "Verified evidence", title: "Laboratory evidence enters through a clear gate.", text: "A clinical assistant records report provenance and verifies the PGx values. Verification does not become prescribing: interpretation and the final decision remain with the doctor.", image: "./assets/images/laboratory.jpg", alt: "Clinical laboratory workbench and equipment", credit: "NIAID · Unsplash" },
      review: { label: "Clinician review", title: "The output explains itself and waits for approval.", text: "The clinician sees a stored response, contributing factors, limitations and completeness before accepting, modifying or deferring. Only the approved summary appears in the patient portal.", image: "./assets/images/medical-review.jpg", alt: "Healthcare professional reviewing a medical form", credit: "MART PRODUCTION · Pexels" }
    };
    const active = stories[ui.scopeTab] || stories.context;
    return `<div class="public-shell">${publicNav()}<main id="main-content" class="poc-page">
      <section class="poc-hero"><div><span class="eyebrow">Proof of concept</span><h1>From scattered evidence to one considered plan.</h1><p>A bounded, explainable workflow for bringing patient context and verified pharmacogenomic evidence into a clinician-controlled warfarin maintenance-dose assessment.</p><div class="hero-actions"><button class="btn primary" data-role-login="doctor">Open clinical workflow</button><button class="btn secondary" data-route="/intake">Try guided intake</button></div></div><figure><img src="./assets/images/consultation.jpg" alt="Doctor discussing care with a patient"><figcaption>Patient context stays connected to the decision.</figcaption></figure></section>

      <section class="poc-section"><div class="section-intro"><span class="eyebrow">Why it matters</span><h2>Personalised care needs more than an average.</h2><p>The selected demonstration focuses on one bounded use case: adult patients with non-valvular atrial fibrillation after a clinician has selected warfarin. It shows how clinical characteristics, medicines and optional PGx evidence can be reviewed together without removing professional control.</p></div><div class="about-grid">
        ${aboutCard("01", "Problem", "Average dosing can overlook differences in genetics, metabolism, interacting medicines, age and body size. Those differences can influence treatment response and harm.")}
        ${aboutCard("02", "Innovation", "One shared, role-aware pathway connects patient-reported information, laboratory verification, clinician assessment and explainable evidence at the decision point.")}
        ${aboutCard("03", "Working modality", "Clinical and optional PGx inputs pass through eligibility and completeness gates before a transparent stored response is shown for clinician review.")}
        ${aboutCard("04", "Clinical feasibility", "The doctor retains the final decision, can modify or defer, and records monitoring. Patients receive only a clinician-approved summary.")}
      </div></section>

      <section class="poc-section story-section"><div class="section-intro"><span class="eyebrow">One connected journey</span><h2>See the same care story from three perspectives.</h2></div><div class="story-tabs" role="tablist" aria-label="Care journey perspectives">${Object.entries(stories).map(([id, item]) => `<button role="tab" aria-selected="${ui.scopeTab === id}" class="story-tab ${ui.scopeTab === id ? "active" : ""}" data-scope-tab="${id}">${item.label}</button>`).join("")}</div><article class="story-panel"><img src="${active.image}" alt="${active.alt}"><div><span class="story-count">${String(Object.keys(stories).indexOf(ui.scopeTab) + 1).padStart(2, "0")}</span><h3>${active.title}</h3><p>${active.text}</p><small>Photo: ${active.credit}</small></div></article></section>

      <section class="poc-section"><div class="section-intro"><span class="eyebrow">Designed around governance</span><h2>Every role has a clear boundary.</h2></div><div class="role-boundaries"><article><span>PT</span><h3>Patient</h3><p>Confirms personal information, submits follow-up and views the approved plan.</p></article><article><span>CA</span><h3>Clinical assistant</h3><p>Checks report provenance and values without interpreting the prescription.</p></article><article><span>DR</span><h3>Doctor</h3><p>Reviews evidence, records a decision and owns the monitoring plan.</p></article></div></section>

      <section class="poc-section"><div class="section-intro"><span class="eyebrow">Feasibility and validation</span><h2>What the demonstration covers—and what comes next.</h2></div><div class="about-grid">
        ${aboutCard("05", "Technical feasibility", "This static demonstration proves the navigation, information architecture and decision checkpoints. A production system requires secure identity, encrypted storage, validated services, audit infrastructure and hospital integration.")}
        ${aboutCard("06", "Sustainability", "A future deployment can use institutional licensing with implementation, training and local-validation support. Commercial assumptions must be tested with partner hospitals.")}
        ${aboutCard("07", "Competitive focus", "The differentiator is a condition–medicine-specific, evidence-linked workflow that remains usable when PGx testing is unavailable, rather than a generic health score.")}
        ${aboutCard("08", "Validation path", "Reproduce the international benchmark, measure subgroup error, collect an ethically approved Indian calibration cohort, recalibrate and prospectively validate before clinical use.")}
      </div></section>

      <section class="poc-section poc-cta"><div><span class="eyebrow">Explore the flow</span><h2>Choose a role or begin the guided health intake.</h2><p>The public intake identifies concern patterns and care priority. The authenticated pathway demonstrates how verified evidence can support a clinician-owned medicine decision.</p></div><div class="hero-actions"><button class="btn primary" data-role-login="doctor">Doctor workflow</button><button class="btn secondary" data-route="/intake">Public health intake</button></div></section>
      <section class="image-credits"><strong>Image credits</strong><a href="https://unsplash.com/photos/doctor-consulting-with-a-patient-in-an-office-MJmsLpeHPfg" target="_blank" rel="noreferrer">Vitaly Gariev on Unsplash</a><a href="https://unsplash.com/photos/a-room-filled-with-lots-of-medical-supplies-0MLeFkfWolk" target="_blank" rel="noreferrer">NIAID on Unsplash</a><a href="https://www.pexels.com/photo/hands-doctor-health-anonymous-7088834/" target="_blank" rel="noreferrer">MART PRODUCTION on Pexels</a></section>
    </main>${publicFooter()}</div>`;
  }

  function aboutCard(number, title, text) {
    return `<article class="card about-card"><span class="number">${number}</span><h2>${title}</h2><p>${text}</p></article>`;
  }

  function startIntake() {
    ui.intake = { position: 0, answers: [], phase: "question", checkpoint: 0, result: null };
    render();
  }

  const severityBands = [
    { max: 14, label: "Minimal", className: "minimal", guidance: "No prominent signal in this area" },
    { max: 34, label: "Mild", className: "mild", guidance: "Occasional or low-level concern" },
    { max: 54, label: "Moderate", className: "moderate", guidance: "Recurring concern worth discussing" },
    { max: 74, label: "High", className: "high", guidance: "Prompt professional review advised" },
    { max: 100, label: "Severe", className: "severe", guidance: "Strong concern requiring timely assessment" }
  ];

  function severityFor(percent, urgent = false) {
    if (urgent) return { label: "Critical warning", className: "critical", guidance: "Immediate professional assessment advised" };
    return severityBands.find((band) => percent <= band.max) || severityBands[severityBands.length - 1];
  }

  function severityLegend() {
    return `<div class="severity-legend" aria-label="Severity thresholds">${severityBands.map((band, index) => `<span><i class="${band.className}"></i><strong>${band.label}</strong><small>${index ? `${severityBands[index - 1].max + 1}–${band.max}%` : `0–${band.max}%`}</small></span>`).join("")}</div>`;
  }

  function intakeEvaluation() {
    const bank = window.ONE_PLAN_QUESTION_BANK;
    const scores = Object.fromEntries(bank.tracks.map((track) => [track.id, 0]));
    const counts = Object.fromEntries(bank.tracks.map((track) => [track.id, 0]));
    let urgentAnswer = null;
    ui.intake.answers.forEach((answer) => {
      const question = bank.questions.find((item) => item.id === answer.questionId);
      scores[question.track] += answer.score;
      counts[question.track] += 1;
      if (question.urgentThreshold !== null && answer.score >= question.urgentThreshold) urgentAnswer = question;
    });
    const parameterScales = bank.tracks.map((track) => {
      const count = counts[track.id];
      const percent = count ? Math.round(scores[track.id] / (count * 3) * 100) : 0;
      return { ...track, score: scores[track.id], count, percent, severity: count ? severityFor(percent) : { label: "Not assessed", className: "unassessed", guidance: "No response captured" } };
    });
    const ranked = [...parameterScales].sort((a, b) => b.percent - a.percent || b.score - a.score);
    const answered = ui.intake.answers.length;
    const rounds = Math.max(1, answered / 10);
    const strong = ranked[0].score >= Math.max(3, rounds * 2) && ranked[0].score - ranked[1].score >= Math.max(2, Math.floor(rounds));
    const total = Object.values(scores).reduce((sum, value) => sum + value, 0);
    const priority = urgentAnswer ? "Urgent assessment now" : strong || total >= answered * .75 ? "Prompt appointment" : total ? "Routine clinical discussion" : "No prominent pattern reported";
    const assessed = parameterScales.filter((item) => item.count);
    const averagePercent = assessed.length ? assessed.reduce((sum, item) => sum + item.percent, 0) / assessed.length : 0;
    const overallPercent = urgentAnswer ? 100 : Math.round(ranked[0].percent * .65 + averagePercent * .35);
    const overallSeverity = severityFor(overallPercent, Boolean(urgentAnswer));
    return { scores, ranked, parameterScales, answered, strong, urgentAnswer, total, priority, overallPercent, overallSeverity };
  }

  function aiMedicationDraftRows(evaluation, patient, medicationPlan) {
    const leadingFit = Math.min(92, 58 + Math.round(evaluation.ranked[0].percent * .34));
    const reviewRows = patient ? [
      {
        medicine: medicationPlan?.medicine || "Warfarin",
        fit: leadingFit,
        dose: medicationPlan?.dose || "Doctor to determine",
        basis: `${patient.indication} · existing care pathway`
      },
      {
        medicine: "Alternative anticoagulant candidate",
        fit: Math.max(38, leadingFit - 16),
        dose: "Doctor to determine",
        basis: "Requires renal, interaction and contraindication review"
      },
      {
        medicine: "Monitoring-first option",
        fit: Math.max(24, leadingFit - 31),
        dose: "Not applicable",
        basis: "Clinician may defer medicine change pending examination"
      }
    ] : [
      {
        medicine: "Candidate medicine A",
        fit: leadingFit,
        dose: "Doctor to determine",
        basis: "Requires a confirmed diagnosis and clinical examination"
      },
      {
        medicine: "Candidate medicine B",
        fit: Math.max(38, leadingFit - 16),
        dose: "Doctor to determine",
        basis: "Requires allergy, interaction and test-result review"
      },
      {
        medicine: "Candidate medicine C",
        fit: Math.max(24, leadingFit - 31),
        dose: "Doctor to determine",
        basis: "Requires clinician comparison with non-drug options"
      }
    ];
    return reviewRows;
  }

  function intakeView(user = null) {
    const bank = window.ONE_PLAN_QUESTION_BANK;
    const patient = user?.patientId ? getPatient(user.patientId) : null;
    if (!ui.intake) {
      const content = `<section class="intake-intro"><div><span class="eyebrow">Guided health intake</span><h1>A clearer starting point for your care conversation.</h1><p>Answer simple symptom and wellbeing questions. The intake reviews ten clinical concern areas, checks progress at short intervals and stops when a pattern is strong enough to summarise.</p><div class="intake-facts"><span><strong>Adaptive</strong> question sequence</span><span><strong>10</strong> concern pathways</span><span><strong>Clear</strong> progress checkpoints</span></div><button class="btn primary" data-start-intake>Start health intake <span aria-hidden="true">→</span></button></div><aside><h2>Before you begin</h2><ul><li>Choose the closest answer for how you feel now or recently.</li><li>New or severe warning signs trigger an urgent-care message.</li><li>The summary supports a clinical conversation; it does not diagnose or prescribe.</li></ul><div class="warning important"><span class="warning-icon">!</span><div><strong>Emergency symptoms?</strong><p>Seek immediate local emergency care instead of completing this form.</p></div></div></aside></section>`;
      return user ? content : `<div class="public-shell">${publicNav()}<main id="main-content" class="intake-page">${content}</main>${publicFooter()}</div>`;
    }

    const evaluation = intakeEvaluation();
    if (ui.intake.phase === "result") {
      const top = evaluation.ranked[0];
      const second = evaluation.ranked[1];
      const urgent = evaluation.urgentAnswer;
      const medicationPlan = patient ? getMedicationPlan(patient.id) : null;
      const aiMedicationRows = aiMedicationDraftRows(evaluation, patient, medicationPlan);
      const content = `<section class="intake-result">
        <div class="result-heading ${urgent ? "urgent" : ""}"><span class="eyebrow">Intake summary</span><h1>${evaluation.priority}</h1><p>${urgent ? `Your answer to “${escapeHtml(urgent.prompt)}” may represent a warning sign. Stop here and seek immediate professional assessment.` : `The strongest pattern in your answers relates to ${escapeHtml(top.title.toLowerCase())}. This summary describes reported concern intensity and is not a confirmed diagnosis.`}</p></div>
        <section class="overall-scale ${evaluation.overallSeverity.className}"><div><span>Overall concern scale</span><strong>${evaluation.overallSeverity.label}</strong><p>${evaluation.overallSeverity.guidance}</p></div><div class="overall-score"><strong>${evaluation.overallPercent}</strong><span>/ 100</span></div><div class="scale-track ${evaluation.overallSeverity.className}"><span style="width:${evaluation.overallPercent}%"></span></div></section>
        ${severityLegend()}
        <section class="card card-pad parameter-card"><div class="card-head"><div><h2>Parameter magnitude profile</h2><p>Each scale reflects the answers captured for that concern area.</p></div>${statusBadge(`${evaluation.answered} answered`, "info")}</div><div class="parameter-scales">${evaluation.parameterScales.map((item) => `<article class="parameter-scale"><div class="parameter-top"><span class="parameter-icon">${item.icon}</span><div><strong>${item.title}</strong><small>${item.severity.guidance}</small></div><b class="severity-label ${item.severity.className}">${item.severity.label}</b></div><div class="scale-track ${item.severity.className}"><span style="width:${item.percent}%"></span></div><div class="parameter-foot"><span>${item.count ? `${item.score} response points` : "Not reached"}</span><strong>${item.count ? `${item.percent}%` : "—"}</strong></div></article>`).join("")}</div></section>
        <section class="card medication-table-card"><div class="card-pad"><div class="card-head"><div><span class="ai-draft-label"><i>AI</i> Pre-generated medication draft</span><h2>AI medication candidate table</h2><p>The preset assessment engine ranks review candidates; a doctor must approve or replace every row.</p></div><div class="page-actions">${statusBadge("AI-generated draft · simulated", "violet")}${statusBadge("Waiting for Doctor's Approval!")}</div></div></div><div class="table-wrap"><table class="data-table medication-table"><thead><tr><th>Medicine candidate</th><th>AI fit</th><th>Draft dosage</th><th>Review basis</th><th>Report status</th></tr></thead><tbody>${aiMedicationRows.map((row) => `<tr><td><strong>${escapeHtml(row.medicine)}</strong></td><td><div class="ai-fit"><strong>${row.fit}%</strong><span><i style="width:${row.fit}%"></i></span></div></td><td>${escapeHtml(row.dose)}</td><td>${escapeHtml(row.basis)}</td><td>${statusBadge("Waiting for Doctor's Approval!")}</td></tr>`).join("")}</tbody></table></div><div class="medication-table-note"><strong>How this preview works:</strong> the displayed AI output is a deterministic, pre-generated simulation; no live AI service is connected. Match percentages are presentation scores, not treatment probabilities. Dosage remains for the doctor to enter or approve.</div></section>
        <div class="grid two result-columns"><section class="card card-pad"><div class="card-head"><div><h2>Strongest concern patterns</h2><p>Use these to guide the clinical conversation.</p></div></div><div class="concern-rank"><div><span>${top.icon}</span><p><strong>${top.title}</strong>${top.guidance}</p><b>${top.percent}%</b></div>${second.score ? `<div><span>${second.icon}</span><p><strong>${second.title}</strong>${second.guidance}</p><b>${second.percent}%</b></div>` : ""}</div></section><aside class="card card-pad"><h2>Recommended next step</h2><p class="result-guidance">${urgent ? "Contact local emergency services or go to the nearest emergency department now. Do not wait for an online response." : evaluation.priority === "Prompt appointment" ? "Arrange a clinician appointment soon and share this summary, symptom timing, medicines and relevant records." : "Discuss recurring or worsening symptoms with a qualified clinician, even if this intake found no strong pattern."}</p></aside></div>
        <div class="form-actions intake-actions"><button class="btn secondary" data-restart-intake>Start again</button><div>${patient ? `<button class="btn primary" data-save-intake="${patient.id}">Save scales to my care record</button>` : `<button class="btn primary" data-role-login="patient">Sign in to save</button>`}</div></div>
      </section>`;
      return user ? content : `<div class="public-shell">${publicNav()}<main id="main-content" class="intake-page">${content}</main>${publicFooter()}</div>`;
    }

    if (ui.intake.phase === "checkpoint") {
      const top = evaluation.ranked[0];
      const content = `<section class="checkpoint-card"><span class="checkpoint-number">${evaluation.answered}</span><span class="eyebrow">Progress checkpoint</span><h1>We have a clearer picture, but not a strong single pattern yet.</h1><p>Your answers currently lean most toward <strong>${escapeHtml(top.title.toLowerCase())}</strong>. Continue with the next ten questions for a more useful care-navigation summary.</p><div class="progress dark"><span style="width:${evaluation.answered / 50 * 100}%"></span></div><div class="form-actions"><button class="btn secondary" data-restart-intake>Restart</button><button class="btn primary" data-continue-intake>Continue to ${evaluation.answered + 10} questions</button></div></section>`;
      return user ? content : `<div class="public-shell">${publicNav()}<main id="main-content" class="intake-page">${content}</main>${publicFooter()}</div>`;
    }

    const question = bank.questions[ui.intake.position];
    const track = bank.tracks.find((item) => item.id === question.track);
    const blockStart = Math.floor(ui.intake.position / 10) * 10 + 1;
    const blockEnd = Math.min(blockStart + 9, bank.maximumAsked);
    const content = `<section class="question-shell"><header><div><span class="eyebrow">${track.title}</span><h1>${escapeHtml(question.prompt)}</h1><p>Choose the answer that is closest to your recent experience.</p></div><div class="question-count"><strong>${ui.intake.position + 1}</strong><span>of at most 50</span></div></header><div class="question-progress"><span style="width:${(ui.intake.position + 1) / 50 * 100}%"></span></div><div class="checkpoint-label">Current set: questions ${blockStart}–${blockEnd}</div><div class="option-grid">${question.options.map((option, index) => `<button class="answer-option" data-intake-answer="${index}"><span class="option-key">${String.fromCharCode(65 + index)}</span><span><strong>${option.label}</strong><small>${option.detail}</small></span></button>`).join("")}</div><div class="intake-note">If this is a severe or rapidly worsening symptom, choose “Severe / now.” Urgent warning signs end the intake immediately.</div></section>`;
    return user ? content : `<div class="public-shell">${publicNav()}<main id="main-content" class="intake-page">${content}</main>${publicFooter()}</div>`;
  }

  const navConfig = {
    doctor: [
      ["Dashboard", "/doctor/dashboard"],
      ["Patients", "/doctor/patients"],
      ["Evidence", "/doctor/evidence"]
    ],
    patient: [
      ["My care", "/patient/dashboard"],
      ["Health intake", "/patient/intake"],
      ["Profile questionnaire", "/patient/questionnaire"],
      ["Approved plan", "/patient/plan"],
      ["Follow-up", "/patient/followup"],
      ["Feedback", "/patient/feedback"]
    ],
    assistant: [
      ["Work queue", "/assistant/dashboard"],
      ["Report verification", "/assistant/reports"],
      ["Data registry", "/assistant/datasets"],
      ["Feedback centre", "/assistant/feedback"]
    ]
  };

  function roleShell(user, body, path) {
    const labels = { doctor: "Doctor portal", patient: "Patient portal", assistant: "Clinical assistant portal" };
    return `<div class="app-shell">
      <aside class="sidebar" id="sidebar">
        ${brand(true)}
        <div class="role-badge"><strong>${escapeHtml(user.name)}</strong>${escapeHtml(user.subtitle)}</div>
        <nav class="side-nav" aria-label="${labels[user.role]}">
          <div class="nav-label">Workspace</div>
          ${navConfig[user.role].map(([label, route]) => `<button class="nav-item ${path.startsWith(route) ? "active" : ""}" data-route="${route}">${label}</button>`).join("")}
          <div class="nav-label">Project</div>
          <button class="nav-item" data-route="/about">About the PoC</button>
        </nav>
        <div class="sidebar-foot">
          <button class="btn small" data-logout>Sign out</button>
        </div>
      </aside>
      <div class="app-main">
        <header class="topbar">
          <div style="display:flex;align-items:center;gap:.7rem"><button class="btn secondary small mobile-menu" data-mobile-menu aria-label="Open navigation">Menu</button><div class="topbar-title"><strong>${labels[user.role]}</strong><span>Role-specific care workspace</span></div></div>
          <div class="topbar-actions">${statusBadge("Session active", "info")}<span class="avatar">${initials(user.name)}</span></div>
        </header>
        <main id="main-content" class="content">${body}</main>
      </div>
    </div>`;
  }

  function pageHead(title, description, actions = "") {
    return `<div class="page-head"><div><h1>${title}</h1><p>${description}</p></div>${actions ? `<div class="page-actions">${actions}</div>` : ""}</div>`;
  }

  function doctorDashboard() {
    const pending = state.patients.filter((p) => p.status !== "Assessment complete").length;
    const unverified = state.reports.filter((r) => r.status !== "verified").length;
    const newFollowUps = state.followUps.filter((f) => f.status === "new").length;
    const pendingMedicationPlans = (state.medicationPlans || []).filter((plan) => plan.status !== "verified");
    return `${pageHead("Clinical overview", "Pending medication reviews, patient reports and follow-up activity are prioritised here.", `<button class="btn primary" data-route="/doctor/assessment?id=P-1048">Start assessment</button>`)}
      <section class="grid metrics" aria-label="Clinical overview metrics">
        ${metric("Medication plans", pendingMedicationPlans.length, "Pending verification")}
        ${metric("Need review", pending, "Assessment queue")}
        ${metric("Reports pending", unverified, "Verification gate")}
        ${metric("New follow-ups", newFollowUps, "Patient submitted")}
      </section>
      <section class="card pending-review-card"><div class="card-pad"><div class="card-head"><div><span class="eyebrow compact">Doctor action</span><h2>Pending medication verifications</h2><p>Review the patient context, enter or change the dosage, and verify only when the plan is ready.</p></div>${statusBadge(`${pendingMedicationPlans.length} pending`, pendingMedicationPlans.length ? "pending" : "verified")}</div></div>${pendingMedicationPlans.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Patient</th><th>Medicine</th><th>Proposed dosage</th><th>Status</th><th>Action</th></tr></thead><tbody>${pendingMedicationPlans.map((plan) => { const patient = getPatient(plan.patientId); return `<tr><td><div class="patient-cell"><span class="patient-avatar">${patient.initials}</span><span><strong>${escapeHtml(patient.name)}</strong><small>${patient.id}</small></span></div></td><td>${escapeHtml(plan.medicine)}</td><td>${escapeHtml(plan.dose)}<br><small>${escapeHtml(plan.schedule)}</small></td><td>${statusBadge("Waiting for Doctor's Approval!")}</td><td><button class="btn primary small" data-route="/doctor/patient?id=${patient.id}">Review plan</button></td></tr>`; }).join("")}</tbody></table></div>` : `<div class="empty compact"><strong>All medication plans reviewed</strong>New patient submissions will appear here automatically.</div>`}</section>
      <div class="grid two">
        <section class="card"><div class="card-pad"><div class="card-head"><div><h2>Assessment queue</h2><p>Open a patient to review the shared record.</p></div><button class="btn ghost small" data-route="/doctor/patients">View all</button></div></div>${patientsTable(state.patients)}</section>
        <aside class="section-stack">
          <section class="card card-pad"><div class="card-head"><div><h2>Attention today</h2><p>Items requiring clinical review.</p></div></div><div class="task-list">
            ${pendingMedicationPlans.length ? task(`Medication plan for ${getPatient(pendingMedicationPlans[0].patientId).name}`, "Dose and schedule awaiting doctor verification", "Pending", "amber") : ""}
            ${task("New follow-up from Asha Rao", "No doses missed; no new concerns", "08:54")}
            ${task("Report pending for Kabir Das", "PGx result awaiting verification", "08:15", "amber")}
            ${task("Dataset limitation", "Indian calibration remains pending", "Ongoing", "blue")}
          </div></section>
          <section class="card card-pad"><div class="card-head"><div><h2>Decision-support status</h2><p>Transparent demonstration configuration.</p></div>${statusBadge("Ready")}</div><dl class="details"><div class="detail"><dt>Decision table</dt><dd>${state.meta.decisionTable}</dd></div><div class="detail"><dt>Last reviewed</dt><dd>${state.meta.reviewed}</dd></div><div class="detail full"><dt>Inference</dt><dd>Preset lookup; no AI API</dd></div></dl></section>
        </aside>
      </div>`;
  }

  function metric(label, value, note) {
    return `<article class="card metric-card"><span class="metric-label">${label}</span><strong>${value}</strong><small>${note}</small></article>`;
  }

  function task(title, description, time, tone = "teal") {
    return `<div class="task"><span class="task-marker" style="background:${tone === "amber" ? "var(--amber)" : tone === "blue" ? "var(--blue)" : "var(--teal)"}"></span><div><strong>${title}</strong><p>${description}</p></div><time>${time}</time></div>`;
  }

  function patientsTable(patients) {
    return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Patient</th><th>Clinical context</th><th>PGx report</th><th>Status</th><th>Updated</th></tr></thead><tbody>${patients.map((p) => `<tr data-patient-row="${p.id}" tabindex="0"><td><div class="patient-cell"><span class="patient-avatar">${p.initials}</span><span><strong>${escapeHtml(p.name)}</strong><small>${p.id}</small></span></div></td><td>${p.indication}<br><small style="color:var(--muted)">Target INR ${p.targetInr || "missing"}</small></td><td>${statusBadge(p.reportStatus)}</td><td>${statusBadge(p.status)}</td><td>${p.updated}</td></tr>`).join("")}</tbody></table></div>`;
  }

  function doctorPatients() {
    return `${pageHead("Patients", "Fictional records prepared to demonstrate the shared clinical workflow.", `<button class="btn secondary" data-route="/doctor/dashboard">Return to overview</button>`)}<section class="card">${patientsTable(state.patients)}</section>`;
  }

  function patientBanner(patient, action = "") {
    return `<section class="patient-banner"><div class="patient-banner-main"><span class="patient-avatar">${patient.initials}</span><div><h2>${escapeHtml(patient.name)} <small style="font-weight:500;color:#a9c8d5">${patient.id}</small></h2><p>${patient.indication} · ${patient.department}</p></div></div>${action}</section>`;
  }

  function doctorPatient(patient) {
    const report = getReport(patient);
    const assessment = getAssessment(patient.id);
    const followUps = state.followUps.filter((item) => item.patientId === patient.id);
    const audit = state.audit.filter((event) => event.patientId === patient.id);
    const latestIntake = [...(state.intakes || [])].reverse().find((item) => item.patientId === patient.id);
    const medicationPlan = getMedicationPlan(patient.id);
    return `${pageHead("Patient record", "Review provenance and completeness before starting an assessment.", `<button class="btn primary" data-route="/doctor/assessment?id=${patient.id}">New assessment</button>`)}
      ${patientBanner(patient, statusBadge(patient.status))}
      <div class="grid two">
        <div class="section-stack">
          <section class="card card-pad"><div class="card-head"><div><h2>Clinical context</h2><p>Sources remain visible at the decision point.</p></div></div><dl class="details">
            ${detail("Age", `${patient.age} years`, "patient")}${detail("Sex", patient.sex, "patient")}${detail("Height / weight", `${patient.height} cm / ${patient.weight} kg`, "patient")}${detail("Target INR", patient.targetInr || "Missing", "doctor")}${detail("Smoking", patient.smoking, "patient")}${detail("Ancestry", patient.ancestry, "patient")}${detail("Comorbidities", patient.comorbidities.join(", ") || "None recorded", "doctor", true)}${detail("Current medicines", patient.medications.join(", "), "reconciled", true)}${detail("Previous response", patient.previousResponse, "doctor", true)}
          </dl></section>
          <section class="card card-pad"><div class="card-head"><div><h2>Pharmacogenomic evidence</h2><p>Assistant verification is distinct from clinician interpretation.</p></div>${statusBadge(report.status)}</div><dl class="details">${detail("Report", report.id, "laboratory")}${detail("Laboratory", report.laboratory, "report")}${detail("CYP2C9", report.cyp2c9, "verified")}${detail("VKORC1", report.vkorc1, "verified")}${detail("Collected", report.collected, "report")}${detail("Verified by", report.verifiedBy || "Pending", "assistant")}</dl></section>
          <section class="card card-pad"><div class="card-head"><div><h2>Latest assessment</h2><p>Only a clinician-approved result becomes part of the patient plan.</p></div></div>${assessment ? `<div class="plan-band"><strong>${assessment.status}</strong><h3>${state.presets[assessment.preset].band}</h3><p>${escapeHtml(assessment.clinicianNote || "Awaiting clinician decision")}</p></div>` : `<div class="empty"><strong>No assessment saved</strong>Start the assessment wizard after reviewing the record.</div>`}</section>
          <section class="card card-pad"><div class="card-head"><div><h2>Guided health intake</h2><p>Patient-submitted magnitude and care-priority summary.</p></div>${latestIntake ? statusBadge(`${latestIntake.answered} answers`, "info") : ""}</div>${latestIntake ? `<div class="intake-record-head"><div><span>Overall concern</span><strong>${escapeHtml(latestIntake.overallSeverity || latestIntake.priority)}</strong><small>${escapeHtml(latestIntake.primary)} · Saved by ${escapeHtml(latestIntake.actor)}</small></div><b>${latestIntake.overallPercent ?? "—"}${latestIntake.overallPercent !== undefined ? "%" : ""}</b></div>${latestIntake.scales ? `<div class="record-scales">${latestIntake.scales.filter((item) => item.percent > 0).sort((a, b) => b.percent - a.percent).slice(0, 4).map((item) => `<div><span>${escapeHtml(item.title)}</span><div class="scale-track ${String(item.severity).toLowerCase()}"><i style="width:${item.percent}%"></i></div><strong>${item.percent}%</strong></div>`).join("")}</div>` : ""}` : `<div class="empty"><strong>No guided intake saved</strong>The patient can complete this from the patient portal.</div>`}</section>
          <section class="card card-pad medication-review"><div class="card-head"><div><h2>Medication and dosage review</h2><p>Enter or suggest changes, then control whether the patient can see the plan as verified.</p></div>${statusBadge(medicationPlan?.status || "Unverified")}</div><form id="medication-plan-form" data-patient-id="${patient.id}"><div class="form-grid"><div class="field"><label for="planMedicine">Medicine</label><input class="input" id="planMedicine" name="medicine" value="${escapeHtml(medicationPlan?.medicine || "")}" placeholder="Clinician-selected medicine" required></div><div class="field"><label for="planDose">Dose</label><input class="input" id="planDose" name="dose" value="${escapeHtml(medicationPlan?.dose || "")}" placeholder="Enter clinician-reviewed dose" required></div><div class="field full"><label for="planSchedule">Schedule / administration</label><input class="input" id="planSchedule" name="schedule" value="${escapeHtml(medicationPlan?.schedule || "")}" placeholder="Frequency, timing and duration" required></div><div class="field full"><label for="planRationale">Clinician rationale or suggested change</label><textarea class="textarea" id="planRationale" name="rationale" required>${escapeHtml(medicationPlan?.rationale || "")}</textarea></div><div class="field"><label for="planStatus">Doctor verification</label><select class="select" id="planStatus" name="status"><option value="unverified" ${medicationPlan?.status !== "verified" ? "selected" : ""}>Unverified — draft</option><option value="verified" ${medicationPlan?.status === "verified" ? "selected" : ""}>Verified by doctor</option></select></div></div><div class="form-actions"><span class="form-hint">Symptom scales do not select the medicine or dose.</span><button class="btn primary" type="submit">Save medication review</button></div></form></section>
        </div>
        <aside class="section-stack">
          <section class="card card-pad"><div class="card-head"><div><h2>Patient follow-up</h2><p>Submitted directly by the patient.</p></div>${followUps.length ? statusBadge(`${followUps.length} received`, "info") : ""}</div>${followUps.length ? `<div class="followup-list">${followUps.map((f) => `<article class="followup-item"><div><strong>Adherence: ${escapeHtml(f.adherence)}</strong><p>${escapeHtml(f.newMedicines)} · ${escapeHtml(f.symptoms)} · INR ${escapeHtml(f.inr)}</p><small>${escapeHtml(f.createdAt)}</small></div><button class="icon-button danger" data-delete-followup="${f.id}" aria-label="Delete follow-up ${f.id}">Delete</button></article>`).join("")}</div>` : `<div class="empty"><strong>No follow-up received</strong></div>`}</section>
          <section class="card card-pad"><div class="card-head"><div><h2>Audit trail</h2><p>Who added, verified or approved information.</p></div></div><div class="timeline">${audit.length ? audit.map((e) => `<div class="timeline-item"><strong>${escapeHtml(e.action)}</strong><p>${escapeHtml(e.actor)} · ${escapeHtml(e.createdAt || e.updatedAt || e.time || e.at || "Recorded")}</p></div>`).join("") : `<div class="empty"><strong>No events recorded</strong></div>`}</div></section>
        </aside>
      </div>`;
  }

  function detail(label, value, source, full = false) {
    return `<div class="detail ${full ? "full" : ""}"><dt>${label}</dt><dd>${escapeHtml(value)}<span class="source-label">${source}</span></dd></div>`;
  }

  const wizardSteps = ["Scope", "Patient", "Medicines", "PGx", "Review", "Generate"];

  function doctorAssessment(patient) {
    const step = ui.wizardStep;
    return `${pageHead("New warfarin assessment", "Confirm the scope, review patient-level evidence and generate a transparent preset response.", `<button class="btn secondary" data-route="/doctor/patient?id=${patient.id}">Exit assessment</button>`)}
      ${patientBanner(patient, statusBadge(patient.reportStatus))}
      <nav class="stepper" aria-label="Assessment steps">${wizardSteps.map((label, index) => `<button class="step ${step === index + 1 ? "active" : step > index + 1 ? "complete" : ""}" data-wizard-go="${index + 1}"><span class="step-number">${step > index + 1 ? "✓" : index + 1}</span><span>${label}</span></button>`).join("")}</nav>
      <section class="card form-card">${wizardStepContent(patient, step)}</section>`;
  }

  function wizardStepContent(patient, step) {
    const report = getReport(patient);
    const back = step > 1 ? `<button class="btn secondary" data-wizard-back>Back</button>` : `<span></span>`;
    const next = step < 6 ? `<button class="btn primary" data-wizard-next>Continue</button>` : `<button class="btn primary" data-generate-assessment="${patient.id}">Generate simulated assessment</button>`;
    let body = "";
    if (step === 1) body = `<div class="form-section-head"><h2>Scope and eligibility</h2><p>The decision support starts only after a clinician has selected warfarin.</p></div><div class="form-grid">
      <div class="check-row full"><input type="checkbox" checked disabled><div><strong>Adult with clinician-confirmed non-valvular atrial fibrillation</strong><p>This demonstration does not perform diagnosis.</p></div></div>
      <div class="check-row full"><input type="checkbox" checked disabled><div><strong>Warfarin selected by the clinician</strong><p>The system assesses dose requirement; it does not choose the medicine.</p></div></div>
      <div class="field"><label for="targetInr">Clinician-selected target INR</label><input id="targetInr" class="input" type="number" step="0.1" data-patient-field="targetInr" value="${patient.targetInr || ""}" placeholder="Required"></div>
      <div class="field"><label for="assessmentType">Assessment type</label><select id="assessmentType" class="select"><option>Initial stable-dose assessment</option><option>Reassessment</option></select></div>
    </div>`;
    if (step === 2) body = `<div class="form-section-head"><h2>Patient characteristics</h2><p>Confirm dose-relevant demographic and clinical information.</p></div><div class="form-grid">
      ${inputField("Age", "age", patient.age, "number")}${selectField("Sex", "sex", ["Female", "Male", "Other / not recorded"], patient.sex)}${inputField("Height (cm)", "height", patient.height, "number")}${inputField("Weight (kg)", "weight", patient.weight, "number")}${selectField("Smoking", "smoking", ["No", "Former", "Current", "Not recorded"], patient.smoking)}${inputField("Ancestry / ethnicity", "ancestry", patient.ancestry)}
      <div class="field full"><label for="comorbidities">Relevant comorbidities</label><textarea id="comorbidities" class="textarea" data-patient-field="comorbidities">${escapeHtml(patient.comorbidities.join(", "))}</textarea><small>For this demonstration, separate conditions with commas.</small></div>
    </div>`;
    if (step === 3) body = `<div class="form-section-head"><h2>Medicines and previous response</h2><p>Interactions and previous outcomes must remain visible rather than disappearing into one score.</p></div><div class="form-grid">
      <div class="field full"><label for="medications">Current medicines and supplements</label><textarea id="medications" class="textarea" data-patient-field="medications">${escapeHtml(patient.medications.join(", "))}</textarea><small>Medication reconciliation is simulated.</small></div>
      <div class="field full"><label for="previousResponse">Previous warfarin response</label><textarea id="previousResponse" class="textarea" data-patient-field="previousResponse">${escapeHtml(patient.previousResponse)}</textarea></div>
      <div class="check-row full"><input type="checkbox" ${patient.medications.some((m) => /amiodarone/i.test(m)) ? "checked" : ""} disabled><div><strong>Amiodarone interaction check</strong><p>Derived visibly from the reconciled medicine list.</p></div></div>
      <div class="check-row full"><input type="checkbox" ${patient.medications.some((m) => /carbamazepine|phenytoin|rifamp/i.test(m)) ? "checked" : ""} disabled><div><strong>Enzyme-inducer interaction check</strong><p>Triggers a caution or completeness gate in the demonstration table.</p></div></div>
    </div>`;
    if (step === 4) body = `<div class="form-section-head"><h2>Pharmacogenomic information</h2><p>Results are entered and verified by the clinical assistant; the doctor reviews their relevance.</p></div><div class="form-grid">
      ${inputField("CYP2C9", "cyp2c9", report.cyp2c9, "text", true)}${inputField("VKORC1", "vkorc1", report.vkorc1, "text", true)}${inputField("Report ID", "reportId", report.id, "text", true)}${inputField("Laboratory", "laboratory", report.laboratory, "text", true)}
      <div class="field full"><label>Verification</label><div class="check-row"><input type="checkbox" ${report.status === "verified" ? "checked" : ""} disabled><div><strong>${report.status === "verified" ? "Report verified" : "Verification pending"}</strong><p>${report.verifiedBy ? `Verified by ${escapeHtml(report.verifiedBy)} on ${escapeHtml(report.verifiedAt)}` : "The result can be viewed, but it cannot support the PGx-enhanced pathway until verified."}</p></div></div></div>
    </div>`;
    if (step === 5) body = `<div class="form-section-head"><h2>Review and completeness</h2><p>Each data source and limitation remains visible before a response is generated.</p></div><div class="review-groups">
      ${reviewCard("Clinician context", [`Indication: ${patient.indication}`, `Target INR: ${patient.targetInr || "Missing"}`, `Previous response: ${patient.previousResponse}`])}
      ${reviewCard("Patient characteristics", [`Age: ${patient.age}`, `Height / weight: ${patient.height} cm / ${patient.weight} kg`, `Smoking: ${patient.smoking}`])}
      ${reviewCard("Medicines", patient.medications.length ? patient.medications : ["No medicines recorded"])}
      ${reviewCard("Laboratory evidence", [`CYP2C9: ${report.cyp2c9}`, `VKORC1: ${report.vkorc1}`, `Status: ${report.status}`])}
    </div><div class="disclosure" style="margin-top:1rem"><strong>Pre-generation check:</strong> ${patient.targetInr && report.status === "verified" ? "The record can enter the PGx-enhanced preset pathway." : patient.targetInr ? "A clinical-only pathway may be available; PGx verification is incomplete." : "A critical value is missing. The engine will return a manual-review state."}</div>`;
    if (step === 6) body = `<div class="form-section-head"><h2>Generate the demonstration response</h2><p>The browser will run a deterministic lookup—no model, API or hidden calculation is used.</p></div><div class="grid equal">
      <div class="review-card"><h3>Eligibility gate</h3><ul><li>Clinician selected warfarin</li><li>Adult NVAF demonstration scope</li><li>Target INR ${patient.targetInr ? "recorded" : "missing"}</li></ul></div>
      <div class="review-card"><h3>Response route</h3><ul><li>${report.status === "verified" ? "PGx-enhanced data available" : "PGx verification incomplete"}</li><li>Preset scenario: ${escapeHtml(patient.scenario)}</li><li>Fallback: manual review</li></ul></div>
    </div><div class="disclosure" style="margin-top:1rem">The displayed dose band is an illustrative, stored response. It is not a treatment instruction and must not be used for patient care.</div>`;
    return `${body}<div class="form-actions">${back}${next}</div>`;
  }

  function inputField(label, field, value, type = "text", readonly = false) {
    return `<div class="field"><label for="${field}">${label}</label><input id="${field}" name="${field}" class="input" type="${type}" data-patient-field="${field}" value="${escapeHtml(value)}" ${readonly ? "readonly" : ""}></div>`;
  }

  function selectField(label, field, options, selected) {
    return `<div class="field"><label for="${field}">${label}</label><select id="${field}" name="${field}" class="select" data-patient-field="${field}">${options.map((option) => `<option ${option === selected ? "selected" : ""}>${option}</option>`).join("")}</select></div>`;
  }

  function reviewCard(title, items) {
    return `<div class="review-card"><h3>${title}</h3><ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>`;
  }

  function runEngine(patient) {
    const report = getReport(patient);
    if (!patient.targetInr || !patient.age || !patient.weight) return "blocked";
    if (report.status !== "verified") return "clinical";
    if (patient.scenario === "sensitive") return "sensitive";
    if (patient.scenario === "typical") return "typical";
    return "clinical";
  }

  function doctorResult(patient) {
    const assessment = getAssessment(patient.id);
    if (!assessment) return `${pageHead("No assessment available", "Generate a demonstration assessment first.")}<div class="card empty"><strong>Assessment not generated</strong><button class="btn primary" style="margin-top:1rem" data-route="/doctor/assessment?id=${patient.id}">Open assessment wizard</button></div>`;
    const result = state.presets[assessment.preset];
    const symbol = { down: "↓", warn: "!", flat: "–" };
    return `${pageHead("Assessment result", "Review the stored response, its drivers, limitations and evidence before recording a decision.", `<button class="btn secondary" data-route="/doctor/assessment?id=${patient.id}">Review inputs</button>`)}
      ${patientBanner(patient, statusBadge(result.mode, result.mode.includes("PGx") ? "violet" : "info"))}
      <section class="result-hero"><div><span class="result-kicker">Illustrative stable-dose assessment</span><h2>${result.band}</h2><div class="result-range">${result.range}</div><p class="result-summary">${result.summary}</p></div><div class="result-meter"><span class="result-meter-label">Data completeness</span><strong>${result.completeness}%</strong><div class="progress"><span style="width:${result.completeness}%"></span></div><span class="result-meter-label" style="display:block;margin-top:.55rem">${result.match}</span></div></section>
      <div class="dose-scale"><div class="dose-track"><span></span><span></span><span></span></div><div class="dose-labels"><span>Lower</span><span>Typical</span><span>Higher</span></div></div>
      <div class="grid two" style="margin-top:1rem">
        <div class="section-stack">
          <section class="card card-pad"><div class="card-head"><div><h2>Why this result?</h2><p>Visible factors from the curated scenario—never a hidden global score.</p></div></div><div class="factor-grid">${result.factors.map((factor) => `<div class="factor"><span class="factor-symbol ${factor.tone}">${symbol[factor.tone] || "–"}</span><div><strong>${factor.label}</strong><span>${factor.effect}</span></div></div>`).join("")}</div></section>
          <section class="card card-pad"><div class="card-head"><div><h2>Warnings and limitations</h2><p>Important context remains separate from the dose band.</p></div></div><div class="warning-list">${result.warnings.map((warning) => `<div class="warning ${warning.level}"><span class="warning-icon">${warning.level === "critical" ? "×" : warning.level === "important" ? "!" : "i"}</span><div><strong>${warning.title}</strong><p>${warning.text}</p></div></div>`).join("")}</div></section>
          <section class="card card-pad"><div class="card-head"><div><h2>Evidence trace</h2><p>What the simulated response is designed to represent.</p></div>${statusBadge(state.meta.decisionTable, "info")}</div><dl class="details">${detail("Benchmark", "IWPC warfarin cohort", "ClinPGx")}${detail("Guidance", "CPIC warfarin pharmacogenetics", "evidence")}${detail("Inference", "Stored decision-table response", "demo")}${detail("Indian status", "Calibration pending", "limitation")}</dl></section>
        </div>
        <aside class="card card-pad decision-card"><div class="card-head"><div><h2>Clinician decision</h2><p>The patient sees a plan only after clinical confirmation.</p></div></div>
          <form id="decision-form" data-patient-id="${patient.id}"><div class="radio-stack">
            ${assessment.preset === "blocked" ? radio("Deferred / no decision", "Critical information must be completed before reassessment", assessment.decision || "Deferred / no decision") : `${radio("Accepted for demonstration", "Use the result as an illustrative assessment", assessment.decision)}${radio("Modified by clinician", "Record a different clinical interpretation", assessment.decision)}${radio("Deferred / no decision", "Request more information or specialist review", assessment.decision)}`}
          </div>
          <div class="field" style="margin-top:1rem"><label for="clinicianNote">Clinical note</label><textarea class="textarea" id="clinicianNote" name="clinicianNote" required>${escapeHtml(assessment.clinicianNote || "")}</textarea></div>
          <div class="field" style="margin-top:.8rem"><label for="followUp">Monitoring / follow-up date</label><input class="input" id="followUp" name="followUp" type="date" value="${isoDate(assessment.followUp)}"></div>
          <div class="check-row" style="margin-top:.8rem"><input id="clinicalConfirm" type="checkbox" required><div><strong>I reviewed the inputs and limitations</strong><p>This remains a fictional proof-of-concept decision.</p></div></div>
          <button class="btn primary wide" style="margin-top:1rem" type="submit">Save clinician decision</button></form>
        </aside>
      </div>`;
  }

  function radio(value, description, selected) {
    return `<label class="radio-option"><input type="radio" name="decision" value="${value}" ${selected === value ? "checked" : ""} required><span><strong>${value}</strong><small>${description}</small></span></label>`;
  }

  function isoDate(value) {
    if (!value) return "";
    const match = String(value).match(/(\d{1,2})\s([A-Za-z]{3})\s(\d{4})/);
    if (!match) return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
    const months = { Jan:"01",Feb:"02",Mar:"03",Apr:"04",May:"05",Jun:"06",Jul:"07",Aug:"08",Sep:"09",Oct:"10",Nov:"11",Dec:"12" };
    return `${match[3]}-${months[match[2]]}-${match[1].padStart(2,"0")}`;
  }

  function evidenceView() {
    return `${pageHead("Evidence and data registry", "Authoritative sources, implementation resources and limitations are kept distinct.", `<button class="btn primary" data-route="/doctor/assessment?id=P-1048">Open assessment</button>`)}
      <div class="disclosure" style="margin-bottom:1rem"><strong>Dataset integrity:</strong> GitHub and package copies of IWPC are implementation resources—not independent patient cohorts.</div>
      <section class="grid">${state.datasets.map(datasetCard).join("")}</section>
      <section class="card card-pad" style="margin-top:1rem"><div class="card-head"><div><h2>External references</h2><p>Open the source pages used to define the demonstration.</p></div></div><div class="page-actions"><a class="btn secondary" href="https://www.clinpgx.org/page/iwpc" target="_blank" rel="noreferrer">ClinPGx IWPC source</a><a class="btn secondary" href="https://pmc.ncbi.nlm.nih.gov/articles/PMC2722908/" target="_blank" rel="noreferrer">Original IWPC study</a><a class="btn secondary" href="https://www.clinpgx.org/chemical/PA451906/guidelineAnnotation/PA166104949" target="_blank" rel="noreferrer">CPIC guidance</a></div></section>`;
  }

  function datasetCard(dataset) {
    return `<article class="card dataset-card"><div class="dataset-top"><div><h3>${escapeHtml(dataset.name)}</h3><p class="dataset-org">${escapeHtml(dataset.organisation)}</p></div><div class="card-actions">${statusBadge(dataset.status)}${dataset.locked ? "" : `<button class="icon-button danger" data-delete-dataset="${dataset.id}">Delete</button>`}</div></div><div class="dataset-facts"><div class="dataset-fact"><span>Records</span><strong>${escapeHtml(dataset.records)}</strong></div><div class="dataset-fact"><span>Target</span><strong>${escapeHtml(dataset.target)}</strong></div><div class="dataset-fact"><span>Reviewed</span><strong>${escapeHtml(dataset.reviewed)}</strong></div></div><div class="limitation"><strong>Limitation:</strong> ${escapeHtml(dataset.limitation)}</div></article>`;
  }

  function patientDashboard(user) {
    const patient = getPatient(user.patientId);
    const assessment = getAssessment(patient.id);
    const approved = assessment?.status === "approved";
    const latestIntake = [...(state.intakes || [])].reverse().find((item) => item.patientId === patient.id);
    const medicationPlan = getMedicationPlan(patient.id);
    return `${pageHead(`Welcome, ${escapeHtml(patient.name.split(" ")[0])}`, "Start with your questionnaire. Your care status and verified plan remain organised below.")}
      <section class="portal-hero questionnaire-first"><div><span class="portal-kicker">First step</span><h2>${latestIntake ? "Review or update your health questionnaire" : "Complete your health questionnaire"}</h2><p>${latestIntake ? `Your latest report recorded ${escapeHtml(latestIntake.overallSeverity || latestIntake.priority)} overall concern. You can begin again if your symptoms have changed.` : "Answer the guided questions to create a parameter-severity report for your doctor to review."}</p><div class="portal-meta">${latestIntake ? `<span>Latest: ${escapeHtml(latestIntake.createdAt)}</span><span>Primary: ${escapeHtml(latestIntake.primary)}</span>` : `<span>Adaptive questions</span><span>Clear severity scales</span>`}</div></div><button class="btn" data-route="/patient/intake">${latestIntake ? "Open questionnaire" : "Start questionnaire"} <span aria-hidden="true">→</span></button></section>
      <section class="grid metrics" style="margin-top:1rem">${metric("Report", patient.reportStatus === "verified" ? "Verified" : "Pending", "Clinical assistant")}${metric("Plan", approved ? "Approved" : "Pending", "Clinician controlled")}${metric("Follow-ups", state.followUps.filter((f) => f.patientId === patient.id).length, "Submitted")}${metric("Target INR", patient.targetInr || "—", "Clinician selected")}</section>
      <section class="card card-pad care-status"><div class="card-head"><div><h2>Care plan status</h2><p>Questionnaire findings and medication approval remain separate.</p></div><div class="page-actions">${statusBadge(medicationPlan?.status === "verified" ? "Medication verified" : "Medication unverified")}${statusBadge(approved ? "Assessment approved" : "Assessment pending")}</div></div><div class="page-actions"><button class="btn secondary" data-route="/patient/questionnaire">Review profile information</button><button class="btn primary" data-route="/patient/plan">View care plan</button></div></section>
      <div class="grid equal" style="margin-top:1rem"><section class="card card-pad"><div class="card-head"><div><h2>What your care team has</h2><p>Review the source of each item.</p></div></div><dl class="details">${detail("Current medicines", patient.medications.join(", "), "shared record", true)}${detail("PGx report", patient.reportStatus, "assistant")}${detail("Next action", approved ? "Follow approved plan" : "Clinician review", "care team")}</dl></section><section class="card card-pad"><div class="card-head"><div><h2>Need attention?</h2><p>This website cannot assess an emergency.</p></div></div><div class="warning important"><span class="warning-icon">!</span><div><strong>New or severe symptoms</strong><p>Seek immediate professional care according to local emergency guidance. Do not wait for an online response.</p></div></div></section></div>`;
  }

  function patientQuestionnaire(user) {
    const patient = getPatient(user.patientId);
    return `${pageHead("Pre-assessment questionnaire", "Confirm information that may affect the clinician's assessment.")}<form id="patient-questionnaire" class="card form-card" data-patient-id="${patient.id}"><div class="form-grid">
      ${selectField("Smoking status", "smoking", ["No", "Former", "Current", "Not recorded"], patient.smoking)}${inputField("Height (cm)", "height", patient.height, "number")}${inputField("Weight (kg)", "weight", patient.weight, "number")}
      <div class="field full"><label for="patientMeds">Current medicines and supplements</label><textarea class="textarea" id="patientMeds" name="medications" required>${escapeHtml(patient.medications.join(", "))}</textarea></div>
      <div class="field full"><label for="patientHistory">Previous problems or response to warfarin</label><textarea class="textarea" id="patientHistory" name="previousResponse">${escapeHtml(patient.previousResponse)}</textarea></div>
      <div class="check-row full"><input type="checkbox" name="consent" required><div><strong>I confirm this fictional information can be shared with the demonstration care team</strong><p>No real health information should be entered in this prototype.</p></div></div>
    </div><div class="form-actions"><button type="button" class="btn secondary" data-route="/patient/dashboard">Cancel</button><button class="btn primary" type="submit">Save questionnaire</button></div></form>`;
  }

  function patientPlan(user) {
    const patient = getPatient(user.patientId);
    const assessment = getAssessment(patient.id);
    const medicationPlan = getMedicationPlan(patient.id);
    const medicationCard = `<section class="card card-pad medication-patient-card"><div class="card-head"><div><h2>Medicine and dosage</h2><p>${medicationPlan?.status === "verified" ? `Reviewed by ${escapeHtml(medicationPlan.reviewedBy)}` : "Awaiting doctor verification"}</p></div>${statusBadge(medicationPlan?.status || "Unverified")}</div>${medicationPlan?.status === "verified" ? `<div class="medication-display"><div><span>Medicine</span><strong>${escapeHtml(medicationPlan.medicine)}</strong></div><div><span>Dose</span><strong>${escapeHtml(medicationPlan.dose)}</strong></div><div><span>Schedule</span><strong>${escapeHtml(medicationPlan.schedule)}</strong></div></div><p class="medication-note">${escapeHtml(medicationPlan.rationale)}</p>` : `<div class="empty compact"><strong>Medication plan not yet verified</strong>The doctor can enter or suggest changes to the medicine, dosage and schedule before verifying it.</div>`}</section>`;
    if (!assessment || assessment.status !== "approved") return `${pageHead("Approved plan", "Only clinician-verified information is shown as an active plan.")}<section class="card empty"><strong>No approved assessment yet</strong>Your care team is still reviewing the current assessment.<br><button class="btn secondary" style="margin-top:1rem" data-route="/patient/dashboard">Return to my care</button></section><div style="margin-top:1rem">${medicationCard}</div>`;
    const result = state.presets[assessment.preset];
    return `${pageHead("Clinician-approved plan", "This is a fictional demonstration record and must not be used for treatment.")}
      <section class="card card-pad"><div class="card-head"><div><h2>Approved assessment summary</h2><p>Confirmed by ${escapeHtml(state.users.find((u) => u.role === "doctor").name)}.</p></div>${statusBadge("Approved")}</div><div class="plan-band"><strong>${result.mode}</strong><h3>${result.band}</h3><p>${escapeHtml(assessment.clinicianNote)}</p></div><dl class="details" style="margin-top:1rem">${detail("Illustrative band", result.range, "clinician reviewed")}${detail("Follow-up", assessment.followUp || "To be confirmed", "clinician")}${detail("Monitoring", "INR-guided clinical review remains required", "care plan", true)}</dl></section>
      <div style="margin-top:1rem">${medicationCard}</div>
      <div class="warning critical" style="margin-top:1rem"><span class="warning-icon">!</span><div><strong>Do not change a medicine based on this page</strong><p>This interface is a simulation. Real dose changes require a qualified clinician and appropriate monitoring.</p></div></div>`;
  }

  function patientFollowUp(user) {
    const patient = getPatient(user.patientId);
    return `${pageHead("Follow-up", "Share adherence, medicine changes and new concerns with the demonstration care team.")}<form id="followup-form" class="card form-card" data-patient-id="${patient.id}"><div class="form-grid">
      ${selectField("Doses since last review", "adherence", ["No doses missed", "One dose missed", "More than one dose missed", "Not sure"], "No doses missed")}
      <div class="field"><label for="followupInr">Recent INR</label><input class="input" id="followupInr" name="inr" placeholder="Enter value or leave unavailable"></div>
      <div class="field full"><label for="newMedicines">New medicines or supplements</label><textarea class="textarea" id="newMedicines" name="newMedicines" placeholder="None"></textarea></div>
      <div class="field full"><label for="symptoms">New symptoms or concerns</label><textarea class="textarea" id="symptoms" name="symptoms" placeholder="Describe concerns for clinician review"></textarea></div>
      <div class="warning critical full"><span class="warning-icon">!</span><div><strong>This form does not provide emergency assessment</strong><p>For severe bleeding, breathing difficulty, weakness, collapse or another emergency, seek immediate professional care.</p></div></div>
    </div><div class="form-actions"><button type="button" class="btn secondary" data-route="/patient/dashboard">Cancel</button><button class="btn primary" type="submit">Send follow-up</button></div></form>`;
  }

  function patientFeedback() {
    return `${pageHead("Feedback", "Tell us whether the demonstration workflow is clear and accessible.")}<form id="feedback-form" class="card form-card"><div class="form-grid"><div class="field"><label for="rating">Ease of use</label><select class="select" id="rating" name="rating"><option value="5">5 — Very easy</option><option value="4">4 — Easy</option><option value="3">3 — Neutral</option><option value="2">2 — Difficult</option><option value="1">1 — Very difficult</option></select></div><div class="field"><label for="topic">Topic</label><select class="select" id="topic" name="topic"><option>Clarity</option><option>Accessibility</option><option>Navigation</option><option>Care workflow</option></select></div><div class="field full"><label for="feedbackText">Comments</label><textarea class="textarea" id="feedbackText" name="text" required></textarea></div></div><div class="form-actions"><span></span><button class="btn primary" type="submit">Submit feedback</button></div></form>`;
  }

  function assistantDashboard() {
    const pending = state.reports.filter((report) => report.status !== "verified");
    return `${pageHead("Verification work queue", "Confirm report provenance before pharmacogenomic information enters the clinician workflow.", `<button class="btn primary" data-route="/assistant/reports">Review reports</button>`)}
      <section class="grid metrics">${metric("Pending reports", pending.length, "Needs action")}${metric("Verified reports", state.reports.length - pending.length, "Demo records")}${metric("Dataset records", state.datasets.length, "Registry only")}${metric("Feedback items", state.feedback.length, "Across roles")}</section>
      <div class="grid two"><section class="card"><div class="card-pad"><div class="card-head"><div><h2>Report queue</h2><p>Verification changes are visible to the doctor immediately.</p></div></div></div>${reportsTable(state.reports)}</section><aside class="card card-pad"><div class="card-head"><div><h2>Role boundary</h2><p>Clinical assistants verify evidence, not prescriptions.</p></div></div><div class="warning"><span class="warning-icon">i</span><div><strong>Verification is not interpretation</strong><p>The assistant may confirm report identity and values. Only the clinician records the dose-assessment decision.</p></div></div></aside></div>`;
  }

  function reportsTable(reports) {
    return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Report</th><th>Patient</th><th>Results</th><th>Laboratory</th><th>Status</th><th>Action</th></tr></thead><tbody>${reports.map((report) => { const patient = getPatient(report.patientId); return `<tr><td><strong>${report.id}</strong><br><small>${report.collected}</small></td><td>${escapeHtml(patient.name)}<br><small>${patient.id}</small></td><td>CYP2C9 ${report.cyp2c9}<br>VKORC1 ${report.vkorc1}</td><td>${escapeHtml(report.laboratory)}</td><td>${statusBadge(report.status)}</td><td>${report.status === "verified" ? `<button class="btn ghost small" disabled>Verified</button>` : `<button class="btn primary small" data-verify-report="${report.id}">Verify</button>`}</td></tr>`; }).join("")}</tbody></table></div>`;
  }

  function assistantReports() {
    return `${pageHead("Report verification", "Review report metadata and mark fictional results as verified.")}<section class="card">${reportsTable(state.reports)}</section><div class="disclosure" style="margin-top:1rem"><strong>Prototype limitation:</strong> file contents are not uploaded, parsed or authenticated. Verification actions only update local demonstration state.</div>`;
  }

  function assistantDatasets() {
    return `${pageHead("Dataset and evidence registry", "Track provenance and limitations without implying that a model was automatically retrained.", `<button class="btn primary" data-open-dataset-modal>Add registry record</button>`)}<section class="grid">${state.datasets.map(datasetCard).join("")}</section>`;
  }

  function assistantFeedback() {
    return `${pageHead("Feedback centre", "Patient and clinician feedback is kept separate from clinical evidence.")}<section class="grid equal">${state.feedback.map(feedbackCard).join("")}</section>`;
  }

  function feedbackCard(item) {
    return `<article class="card feedback-card"><div class="dataset-top"><span class="status ${item.role === "patient" ? "info" : "violet"}">${escapeHtml(item.role)}</span><div class="card-actions"><span class="stars" aria-label="${item.rating} out of 5">${"★".repeat(item.rating)}${"☆".repeat(5 - item.rating)}</span><button class="icon-button danger" data-delete-feedback="${item.id}">Delete</button></div></div><blockquote>“${escapeHtml(item.text)}”</blockquote><footer>${escapeHtml(item.topic)} · ${escapeHtml(item.createdAt)}</footer></article>`;
  }

  function datasetModal() {
    return `<div class="modal-backdrop" data-modal-backdrop><form id="dataset-form" class="modal"><h2>Add a simulated registry record</h2><p>This records metadata locally. It does not upload patient data or retrain a model.</p><div class="field"><label for="datasetName">Dataset name</label><input class="input" id="datasetName" name="name" required></div><div class="field" style="margin-top:.7rem"><label for="datasetOrg">Source organisation</label><input class="input" id="datasetOrg" name="organisation" required></div><div class="field" style="margin-top:.7rem"><label for="datasetTarget">Target variable</label><input class="input" id="datasetTarget" name="target" required></div><div class="modal-actions"><button type="button" class="btn secondary" data-close-modal>Cancel</button><button class="btn primary" type="submit">Add record</button></div></form></div>`;
  }

  function renderProtected(route) {
    const user = currentUser();
    if (!user) return landingView();
    if (!route.path.startsWith(`/${user.role}`) && route.path !== "/about") {
      navigate(`/${user.role}/dashboard`);
      return "";
    }
    if (route.path === "/about") return aboutView();
    const patientId = route.params.get("id") || "P-1048";
    const patient = getPatient(patientId);
    let body;
    if (user.role === "doctor") {
      if (route.path === "/doctor/patients") body = doctorPatients();
      else if (route.path === "/doctor/patient") body = doctorPatient(patient);
      else if (route.path === "/doctor/assessment") body = doctorAssessment(patient);
      else if (route.path === "/doctor/result") body = doctorResult(patient);
      else if (route.path === "/doctor/evidence") body = evidenceView();
      else body = doctorDashboard();
    }
    if (user.role === "patient") {
      if (route.path === "/patient/intake") body = intakeView(user);
      else if (route.path === "/patient/questionnaire") body = patientQuestionnaire(user);
      else if (route.path === "/patient/plan") body = patientPlan(user);
      else if (route.path === "/patient/followup") body = patientFollowUp(user);
      else if (route.path === "/patient/feedback") body = patientFeedback();
      else body = patientDashboard(user);
    }
    if (user.role === "assistant") {
      if (route.path === "/assistant/reports") body = assistantReports();
      else if (route.path === "/assistant/datasets") body = assistantDatasets();
      else if (route.path === "/assistant/feedback") body = assistantFeedback();
      else body = assistantDashboard();
    }
    return roleShell(user, body, route.path);
  }

  function render() {
    const route = routeInfo();
    const publicPaths = new Set(["/welcome", "/login", "/intake", "/about"]);
    let renderedPath = route.path;
    if (!session && !publicPaths.has(route.path)) {
      history.replaceState(null, "", "#/welcome");
      app.innerHTML = landingView();
      renderedPath = "/welcome";
    }
    else if (route.path === "/welcome") app.innerHTML = landingView();
    else if (route.path === "/login") app.innerHTML = loginView(route.params.get("role") || "doctor");
    else if (route.path === "/intake") app.innerHTML = intakeView();
    else if (route.path === "/about" && !session) app.innerHTML = aboutView();
    else app.innerHTML = renderProtected(route);
    document.title = renderedPath === "/welcome" ? "One Patient, One Plan" : `${pageTitle(renderedPath)} — One Patient, One Plan`;
    window.scrollTo(0, 0);
  }

  function pageTitle(path) {
    const item = [...Object.values(navConfig).flat()].find(([, route]) => path.startsWith(route));
    if (path.includes("assessment")) return "Assessment";
    if (path.includes("intake")) return "Guided health intake";
    if (path.includes("result")) return "Assessment result";
    if (path.includes("patient?id")) return "Patient record";
    if (path === "/about") return "About the PoC";
    return item?.[0] || "Clinical demo";
  }

  function showToast(title, message) {
    document.querySelector(".toast")?.remove();
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(message)}</span>`;
    document.body.appendChild(toast);
    clearTimeout(ui.toastTimer);
    ui.toastTimer = setTimeout(() => toast.remove(), 3600);
  }

  app.addEventListener("click", (event) => {
    const routeButton = event.target.closest("[data-route]");
    if (routeButton) { event.preventDefault(); navigate(routeButton.dataset.route); return; }

    const roleButton = event.target.closest("[data-role-login]");
    if (roleButton) { navigate(`/login?role=${roleButton.dataset.roleLogin}`); return; }

    const fill = event.target.closest("[data-fill-demo]");
    if (fill) {
      const user = state.users.find((item) => item.role === fill.dataset.fillDemo);
      document.getElementById("email").value = user.email;
      document.getElementById("password").value = user.password;
      return;
    }

    if (event.target.closest("[data-logout]")) {
      saveSession(null);
      resetTransientUi();
      history.replaceState(null, "", "#/welcome");
      render();
      return;
    }
    if (event.target.closest("[data-mobile-menu]")) { document.getElementById("sidebar")?.classList.toggle("open"); return; }

    const scopeTab = event.target.closest("[data-scope-tab]");
    if (scopeTab) { ui.scopeTab = scopeTab.dataset.scopeTab; render(); return; }

    if (event.target.closest("[data-start-intake]")) { startIntake(); return; }
    if (event.target.closest("[data-restart-intake]")) { ui.intake = null; render(); return; }
    if (event.target.closest("[data-continue-intake]")) { ui.intake.phase = "question"; render(); return; }

    const answerButton = event.target.closest("[data-intake-answer]");
    if (answerButton && ui.intake) {
      const bank = window.ONE_PLAN_QUESTION_BANK;
      const question = bank.questions[ui.intake.position];
      const option = question.options[Number(answerButton.dataset.intakeAnswer)];
      ui.intake.answers.push({ questionId: question.id, score: option.score, label: option.label });
      ui.intake.position += 1;
      const evaluation = intakeEvaluation();
      if (evaluation.urgentAnswer || ui.intake.position >= bank.maximumAsked || (bank.checkpoints.includes(ui.intake.position) && evaluation.strong)) ui.intake.phase = "result";
      else if (bank.checkpoints.includes(ui.intake.position)) ui.intake.phase = "checkpoint";
      render();
      return;
    }

    const saveIntake = event.target.closest("[data-save-intake]");
    if (saveIntake && ui.intake) {
      const evaluation = intakeEvaluation();
      const patient = getPatient(saveIntake.dataset.saveIntake);
      state.intakes = state.intakes || [];
      state.intakes.push({ id: `IN-${Date.now()}`, patientId: patient.id, answered: evaluation.answered, priority: evaluation.priority, primary: evaluation.ranked[0].title, secondary: evaluation.ranked[1].score ? evaluation.ranked[1].title : "No secondary pattern", overallPercent: evaluation.overallPercent, overallSeverity: evaluation.overallSeverity.label, scales: evaluation.parameterScales.map((item) => ({ id: item.id, title: item.title, percent: item.percent, severity: item.severity.label })), urgent: Boolean(evaluation.urgentAnswer), actor: patient.name, createdAt: "Just now" });
      state.medicationPlans = state.medicationPlans || [];
      const existingPlan = getMedicationPlan(patient.id);
      if (!existingPlan) state.medicationPlans.push({ id: `MP-${Date.now()}`, patientId: patient.id, medicine: patient.indication.includes("atrial fibrillation") ? "Warfarin" : "Awaiting clinician selection", dose: "Awaiting clinician entry", schedule: "Awaiting clinician entry", rationale: "Created for clinician review from the existing confirmed-care context; no medicine or dose was inferred from symptom answers.", status: "unverified", reviewedBy: "Not yet reviewed", updatedAt: "Just now" });
      else { existingPlan.status = "unverified"; existingPlan.reviewedBy = "Pending review after new questionnaire"; existingPlan.updatedAt = "Just now"; }
      state.audit.unshift({ id: `AUD-${Date.now()}`, patientId: patient.id, action: `Saved guided health intake (${evaluation.answered} answers)`, actor: patient.name, createdAt: "Just now" });
      saveState(); render();
      showToast("Intake saved", "The care team can now review the concern summary and medication-review status.");
      return;
    }

    const deleteFollowUp = event.target.closest("[data-delete-followup]");
    if (deleteFollowUp) {
      if (window.confirm("Delete this follow-up from the local record?")) {
        state.followUps = state.followUps.filter((item) => item.id !== deleteFollowUp.dataset.deleteFollowup);
        saveState(); render(); showToast("Follow-up deleted", "The local follow-up record was removed.");
      }
      return;
    }

    const deleteFeedback = event.target.closest("[data-delete-feedback]");
    if (deleteFeedback) {
      if (window.confirm("Delete this feedback item?")) {
        state.feedback = state.feedback.filter((item) => item.id !== deleteFeedback.dataset.deleteFeedback);
        saveState(); render(); showToast("Feedback deleted", "The feedback item was removed.");
      }
      return;
    }

    const deleteDataset = event.target.closest("[data-delete-dataset]");
    if (deleteDataset) {
      if (window.confirm("Delete this unreviewed registry record?")) {
        state.datasets = state.datasets.filter((item) => item.id !== deleteDataset.dataset.deleteDataset);
        saveState(); render(); showToast("Registry record deleted", "The unreviewed local record was removed.");
      }
      return;
    }

    const row = event.target.closest("[data-patient-row]");
    if (row) { navigate(`/doctor/patient?id=${row.dataset.patientRow}`); return; }

    const go = event.target.closest("[data-wizard-go]");
    if (go) { ui.wizardStep = Number(go.dataset.wizardGo); render(); return; }
    if (event.target.closest("[data-wizard-next]")) { ui.wizardStep = Math.min(6, ui.wizardStep + 1); render(); return; }
    if (event.target.closest("[data-wizard-back]")) { ui.wizardStep = Math.max(1, ui.wizardStep - 1); render(); return; }

    const generate = event.target.closest("[data-generate-assessment]");
    if (generate) {
      const patient = getPatient(generate.dataset.generateAssessment);
      const preset = runEngine(patient);
      const existing = getAssessment(patient.id);
      if (existing && existing.status !== "approved") {
        existing.preset = preset;
        existing.createdAt = "Just now";
      } else {
        state.assessments.push({ id: `A-${Math.floor(1000 + Math.random() * 8999)}`, patientId: patient.id, preset, createdAt: "Just now", status: "draft", decision: "", clinicianNote: "", followUp: "" });
      }
      state.audit.unshift({ id: `AUD-${Date.now()}`, patientId: patient.id, action: `Generated preset response ${state.presets[preset].id}`, actor: currentUser().name, createdAt: "Just now" });
      saveState();
      navigate(`/doctor/result?id=${patient.id}`);
      setTimeout(() => showToast("Assessment generated", "A stored decision-table response has been matched."), 50);
      return;
    }

    const verify = event.target.closest("[data-verify-report]");
    if (verify) {
      const report = state.reports.find((item) => item.id === verify.dataset.verifyReport);
      report.status = "verified";
      report.verifiedBy = currentUser().name;
      report.verifiedAt = "Just now";
      const patient = getPatient(report.patientId);
      patient.reportStatus = "verified";
      if (patient.targetInr) patient.status = "Ready for assessment";
      state.audit.unshift({ id: `AUD-${Date.now()}`, patientId: patient.id, action: `Verified PGx report ${report.id}`, actor: currentUser().name, createdAt: "Just now" });
      saveState(); render(); showToast("Report verified", `${report.id} is now visible as verified in the doctor portal.`); return;
    }

    if (event.target.closest("[data-open-dataset-modal]")) { document.body.insertAdjacentHTML("beforeend", datasetModal()); return; }
    if (event.target.closest("[data-close-modal]") || event.target.matches("[data-modal-backdrop]")) { document.querySelector(".modal-backdrop")?.remove(); return; }
  });

  app.addEventListener("input", (event) => {
    const field = event.target.closest("[data-patient-field]");
    if (!field || field.readOnly) return;
    const route = routeInfo();
    if (!route.path.startsWith("/doctor/assessment")) return;
    const patient = getPatient(route.params.get("id") || currentUser()?.patientId || "P-1048");
    let value = field.value;
    if (["age", "height", "weight", "targetInr"].includes(field.dataset.patientField)) value = value === "" ? null : Number(value);
    if (["medications", "comorbidities"].includes(field.dataset.patientField)) value = value.split(",").map((item) => item.trim()).filter(Boolean);
    patient[field.dataset.patientField] = value;
    saveState();
  });

  document.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.target;
    if (form.id === "login-form") {
      const data = new FormData(form);
      const user = state.users.find((item) => item.role === form.dataset.role && item.email === data.get("email") && item.password === data.get("password"));
      if (!user) { document.getElementById("login-error").classList.add("show"); return; }
      resetTransientUi();
      saveSession({ userId: user.id, role: user.role });
      navigate(`/${user.role}/dashboard`);
      return;
    }

    if (form.id === "decision-form") {
      const patient = getPatient(form.dataset.patientId);
      const assessment = getAssessment(patient.id);
      const data = new FormData(form);
      assessment.decision = data.get("decision");
      assessment.clinicianNote = data.get("clinicianNote");
      assessment.followUp = data.get("followUp");
      assessment.status = data.get("decision") === "Deferred / no decision" ? "deferred" : "approved";
      patient.status = assessment.status === "approved" ? "Assessment complete" : "Needs review";
      state.audit.unshift({ id: `AUD-${Date.now()}`, patientId: patient.id, action: `Clinician decision: ${assessment.decision}`, actor: currentUser().name, createdAt: "Just now" });
      saveState(); render(); showToast("Decision saved", assessment.status === "approved" ? "The approved summary is now visible in the patient portal." : "The assessment remains unavailable to the patient as a plan.");
      return;
    }

    if (form.id === "medication-plan-form") {
      const data = new FormData(form);
      const patient = getPatient(form.dataset.patientId);
      state.medicationPlans = state.medicationPlans || [];
      let plan = getMedicationPlan(patient.id);
      if (!plan) {
        plan = { id: `MP-${Date.now()}`, patientId: patient.id };
        state.medicationPlans.push(plan);
      }
      plan.medicine = data.get("medicine");
      plan.dose = data.get("dose");
      plan.schedule = data.get("schedule");
      plan.rationale = data.get("rationale");
      plan.status = data.get("status");
      plan.reviewedBy = plan.status === "verified" ? currentUser().name : `Draft updated by ${currentUser().name}`;
      plan.updatedAt = "Just now";
      state.audit.unshift({ id: `AUD-${Date.now()}`, patientId: patient.id, action: plan.status === "verified" ? `Verified medication plan ${plan.id}` : `Suggested changes to medication plan ${plan.id}`, actor: currentUser().name, createdAt: "Just now" });
      saveState(); render(); showToast(plan.status === "verified" ? "Medication plan verified" : "Draft changes saved", plan.status === "verified" ? "The verified medicine, dose and schedule are now available in the patient plan." : "The medication plan remains unverified.");
      return;
    }

    if (form.id === "patient-questionnaire") {
      const patient = getPatient(form.dataset.patientId);
      const data = new FormData(form);
      patient.smoking = data.get("smoking");
      patient.height = Number(data.get("height"));
      patient.weight = Number(data.get("weight"));
      patient.medications = String(data.get("medications")).split(",").map((item) => item.trim()).filter(Boolean);
      patient.previousResponse = data.get("previousResponse");
      patient.updated = "Just now";
      state.audit.unshift({ id: `AUD-${Date.now()}`, patientId: patient.id, action: "Patient updated pre-assessment questionnaire", actor: patient.name, createdAt: "Just now" });
      saveState(); navigate("/patient/dashboard"); setTimeout(() => showToast("Questionnaire saved", "The demonstration care team can now review the updated information."), 50); return;
    }

    if (form.id === "followup-form") {
      const data = new FormData(form);
      const patientId = form.dataset.patientId;
      state.followUps.push({ id: `F-${Date.now()}`, patientId, adherence: data.get("adherence"), newMedicines: data.get("newMedicines") || "No new medicines", inr: data.get("inr") || "Not available", symptoms: data.get("symptoms") || "No new concerns", createdAt: "Just now", status: "new" });
      state.audit.unshift({ id: `AUD-${Date.now()}`, patientId, action: "Patient submitted follow-up", actor: getPatient(patientId).name, createdAt: "Just now" });
      saveState(); navigate("/patient/dashboard"); setTimeout(() => showToast("Follow-up sent", "It is now visible in the doctor portal."), 50); return;
    }

    if (form.id === "feedback-form") {
      const data = new FormData(form);
      const user = currentUser();
      state.feedback.unshift({ id: `FB-${Date.now()}`, role: user.role, from: user.patientId || user.id, rating: Number(data.get("rating")), topic: data.get("topic"), text: data.get("text"), createdAt: "Today" });
      saveState(); form.reset(); showToast("Feedback recorded", "The clinical assistant feedback centre has been updated."); return;
    }

    if (form.id === "dataset-form") {
      const data = new FormData(form);
      state.datasets.push({ id: `DS-${Date.now()}`, name: data.get("name"), organisation: data.get("organisation"), records: "Not inspected", target: data.get("target"), licence: "To be verified", status: "Unreviewed", reviewed: "Not reviewed", limitation: "Metadata only; not connected to the demonstration decision table.", locked: false });
      saveState(); document.querySelector(".modal-backdrop")?.remove(); render(); showToast("Registry record added", "No model retraining or data upload occurred."); return;
    }
  });

  window.addEventListener("hashchange", render);
  window.addEventListener("keydown", (event) => {
    const row = event.target.closest?.("[data-patient-row]");
    if (row && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); navigate(`/doctor/patient?id=${row.dataset.patientRow}`); }
    if (event.key === "Escape") document.querySelector(".modal-backdrop")?.remove();
  });

  render();
})();
