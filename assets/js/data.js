window.ONE_PLAN_SEED = {
  meta: {
    version: "POC 1.4",
    decisionTable: "IWPC-DEMO-01",
    reviewed: "03 Sep 2026",
    title: "One Patient, One Plan"
  },
  users: [
    { id: "U-D01", role: "doctor", name: "Dr. Meera Kapoor", email: "doctor@demo.local", password: "demo123", subtitle: "Cardiology" },
    { id: "U-P01", role: "patient", name: "Asha Rao", email: "patient@demo.local", password: "demo123", subtitle: "Patient ID P-1048", patientId: "P-1048" },
    { id: "U-A01", role: "assistant", name: "Neel Sharma", email: "assistant@demo.local", password: "demo123", subtitle: "Clinical Laboratory" }
  ],
  patients: [
    {
      id: "P-1048",
      name: "Asha Rao",
      initials: "AR",
      age: 68,
      sex: "Female",
      height: 158,
      weight: 54,
      indication: "Non-valvular atrial fibrillation",
      department: "Cardiology",
      targetInr: 2.5,
      smoking: "No",
      ancestry: "South Asian / Indian",
      comorbidities: ["Hypertension"],
      medications: ["Amiodarone", "Atorvastatin"],
      previousResponse: "No previous warfarin exposure recorded",
      cyp2c9: "*1/*3",
      vkorc1: "A/A",
      reportStatus: "verified",
      reportId: "R-2218",
      status: "Ready for assessment",
      updated: "Today, 09:42",
      scenario: "sensitive"
    },
    {
      id: "P-2051",
      name: "Vikram Sen",
      initials: "VS",
      age: 57,
      sex: "Male",
      height: 174,
      weight: 74,
      indication: "Non-valvular atrial fibrillation",
      department: "Cardiology",
      targetInr: 2.5,
      smoking: "Former",
      ancestry: "South Asian / Indian",
      comorbidities: ["Type 2 diabetes"],
      medications: ["Metformin", "Atorvastatin"],
      previousResponse: "No previous adverse response recorded",
      cyp2c9: "*1/*1",
      vkorc1: "A/G",
      reportStatus: "verified",
      reportId: "R-2194",
      status: "Assessment complete",
      updated: "Yesterday, 16:20",
      scenario: "typical"
    },
    {
      id: "P-3094",
      name: "Kabir Das",
      initials: "KD",
      age: 46,
      sex: "Male",
      height: 181,
      weight: 88,
      indication: "Non-valvular atrial fibrillation",
      department: "Cardiology",
      targetInr: null,
      smoking: "No",
      ancestry: "South Asian / Indian",
      comorbidities: ["Epilepsy"],
      medications: ["Carbamazepine"],
      previousResponse: "Not available",
      cyp2c9: "*1/*1",
      vkorc1: "G/G",
      reportStatus: "pending",
      reportId: "R-2230",
      status: "Information incomplete",
      updated: "Today, 08:15",
      scenario: "incomplete"
    }
  ],
  reports: [
    { id: "R-2218", patientId: "P-1048", type: "Warfarin PGx panel", laboratory: "Dendrite Reference Laboratory", collected: "28 Aug 2026", status: "verified", cyp2c9: "*1/*3", vkorc1: "A/A", verifiedBy: "Neel Sharma", verifiedAt: "03 Sep 2026, 09:42" },
    { id: "R-2194", patientId: "P-2051", type: "Warfarin PGx panel", laboratory: "Dendrite Reference Laboratory", collected: "25 Aug 2026", status: "verified", cyp2c9: "*1/*1", vkorc1: "A/G", verifiedBy: "Neel Sharma", verifiedAt: "02 Sep 2026, 16:20" },
    { id: "R-2230", patientId: "P-3094", type: "Warfarin PGx panel", laboratory: "Partner Laboratory", collected: "02 Sep 2026", status: "pending", cyp2c9: "*1/*1", vkorc1: "G/G", verifiedBy: null, verifiedAt: null }
  ],
  presets: {
    sensitive: {
      id: "S-L01",
      mode: "PGx-enhanced",
      band: "Lower requirement",
      range: "Below 21 mg/week",
      tone: "amber",
      completeness: 96,
      match: "Curated scenario matched",
      summary: "This profile is associated with increased warfarin sensitivity. Begin with careful clinician review and retain INR-guided adjustment.",
      factors: [
        { label: "CYP2C9 *1/*3", effect: "Lower clearance pattern", tone: "down" },
        { label: "VKORC1 A/A", effect: "Higher sensitivity pattern", tone: "down" },
        { label: "Amiodarone", effect: "Interaction requires caution", tone: "warn" },
        { label: "Age 68", effect: "May lower dose requirement", tone: "down" }
      ],
      warnings: [
        { level: "important", title: "Bleeding-risk caution", text: "The combined clinical and PGx pattern warrants cautious clinician-led initiation and close INR monitoring." },
        { level: "info", title: "Indian validation pending", text: "The international benchmark is a proof-of-concept starting point and is not yet calibrated for an Indian clinical population." }
      ]
    },
    typical: {
      id: "S-T01",
      mode: "PGx-enhanced",
      band: "Typical requirement",
      range: "21–49 mg/week",
      tone: "teal",
      completeness: 93,
      match: "Curated scenario matched",
      summary: "No major preset sensitivity or high-requirement pattern was matched. The range remains illustrative and requires INR-guided clinician adjustment.",
      factors: [
        { label: "CYP2C9 *1/*1", effect: "Reference metabolism pattern", tone: "flat" },
        { label: "VKORC1 A/G", effect: "Intermediate sensitivity pattern", tone: "flat" },
        { label: "No major inducer", effect: "No preset upward interaction", tone: "flat" }
      ],
      warnings: [
        { level: "info", title: "Monitoring remains essential", text: "A typical dose-requirement band does not remove the need for INR monitoring and clinician review." }
      ]
    },
    clinical: {
      id: "S-C01",
      mode: "Clinical-only",
      band: "Clinical estimate only",
      range: "Dose band requires clinician review",
      tone: "blue",
      completeness: 78,
      match: "Clinical-only fallback",
      summary: "The clinical pathway can support a preliminary assessment, but verified pharmacogenomic information is unavailable.",
      factors: [
        { label: "Clinical variables", effect: "Available", tone: "flat" },
        { label: "PGx report", effect: "Not verified", tone: "warn" }
      ],
      warnings: [
        { level: "important", title: "PGx data unavailable", text: "Use the clinical-only result with greater uncertainty and follow the clinician's monitoring protocol." }
      ]
    },
    blocked: {
      id: "S-X01",
      mode: "No recommendation",
      band: "Manual review required",
      range: "No simulated dose range",
      tone: "red",
      completeness: 58,
      match: "Critical-data gate triggered",
      summary: "The preset engine cannot return a dose-assessment response because essential information is incomplete or unverified.",
      factors: [
        { label: "Target INR", effect: "Missing", tone: "warn" },
        { label: "PGx report", effect: "Awaiting verification", tone: "warn" },
        { label: "Carbamazepine", effect: "Potential interaction", tone: "warn" }
      ],
      warnings: [
        { level: "critical", title: "Assessment blocked", text: "Enter the clinician-selected target INR and resolve the report and interaction review before proceeding." }
      ]
    }
  },
  assessments: [
    {
      id: "A-8801",
      patientId: "P-2051",
      preset: "typical",
      createdAt: "02 Sep 2026, 16:26",
      status: "approved",
      decision: "Accepted for demonstration",
      clinicianNote: "Use as an illustrative starting assessment; adjust only through INR-guided clinical review.",
      followUp: "09 Sep 2026"
    }
  ],
  followUps: [
    { id: "F-310", patientId: "P-1048", adherence: "No doses missed", newMedicines: "No new medicines", inr: "2.4", symptoms: "No new concerns", createdAt: "Today, 08:54", status: "new" },
    { id: "F-311", patientId: "P-2051", adherence: "One dose missed", newMedicines: "No new medicines", inr: "2.1", symptoms: "Mild bruising noted for review", createdAt: "Yesterday, 18:10", status: "reviewed" },
    { id: "F-312", patientId: "P-3094", adherence: "Not started", newMedicines: "Carbamazepine already recorded", inr: "Not available", symptoms: "No new concerns", createdAt: "Today, 08:31", status: "new" }
  ],
  intakes: [],
  medicationPlans: [
    { id: "MP-401", patientId: "P-1048", medicine: "Warfarin", dose: "Awaiting clinician entry", schedule: "Awaiting clinician entry", rationale: "Medicine was selected for the confirmed NVAF pathway before the guided health intake.", status: "unverified", reviewedBy: "Not yet reviewed", updatedAt: "Today, 09:44" },
    { id: "MP-402", patientId: "P-2051", medicine: "Warfarin", dose: "Clinician-approved dose recorded in the care plan", schedule: "Follow the clinician-issued schedule", rationale: "Reviewed alongside clinical variables, verified PGx evidence and INR monitoring requirements.", status: "verified", reviewedBy: "Dr. Meera Kapoor", updatedAt: "Yesterday, 16:31" }
  ],
  feedback: [
    { id: "FB-91", role: "patient", from: "P-2051", rating: 4, topic: "Clarity", text: "The approved plan was easy to understand.", createdAt: "02 Sep 2026" },
    { id: "FB-92", role: "doctor", from: "U-D01", rating: 5, topic: "Workflow", text: "Report verification is visible at the decision point.", createdAt: "03 Sep 2026" }
  ],
  datasets: [
    { id: "DS-1", name: "IWPC Warfarin Cohort", organisation: "International Warfarin Pharmacogenetics Consortium / ClinPGx", records: "~5,700", target: "Stable therapeutic warfarin dose", licence: "ClinPGx data-use policy", status: "Benchmark", reviewed: "03 Sep 2026", limitation: "International cohort; India-specific calibration required.", locked: true },
    { id: "DS-2", name: "CPIC Warfarin Guidance", organisation: "Clinical Pharmacogenetics Implementation Consortium", records: "Clinical guideline", target: "CYP2C9 / VKORC1-guided interpretation", licence: "Source terms apply", status: "Evidence", reviewed: "03 Sep 2026", limitation: "Guideline evidence, not a patient-level training dataset.", locked: true },
    { id: "DS-3", name: "Indian Calibration Cohort", organisation: "Future partner hospitals", records: "Not collected", target: "Prospective local validation", licence: "Ethics and governance required", status: "Future", reviewed: "Not started", limitation: "Must not be represented as completed or clinically validated.", locked: true }
  ],
  audit: [
    { id: "EV-1", patientId: "P-1048", at: "Today, 09:42", actor: "Neel Sharma", action: "Verified PGx report R-2218" },
    { id: "EV-2", patientId: "P-1048", at: "Today, 08:54", actor: "Asha Rao", action: "Submitted pre-assessment update" },
    { id: "EV-3", patientId: "P-2051", at: "Yesterday, 16:31", actor: "Dr. Meera Kapoor", action: "Approved illustrative assessment A-8801" },
    { id: "EV-4", patientId: "P-3094", at: "Just now", actor: "Neel Sharma", action: "Received PGx report R-2230 for verification" },
    { id: "EV-5", patientId: "P-3094", at: "Today, 08:31", actor: "Kabir Das", action: "Submitted follow-up information" },
    { id: "EV-6", patientId: "P-2051", at: "Yesterday, 18:14", actor: "Dr. Meera Kapoor", action: "Reviewed follow-up F-311" }
  ]
};
