# One Patient, One Plan — static demonstration

A frontend-only proof of concept for patient-specific warfarin stable-dose assessment in adults with non-valvular atrial fibrillation.

## Stack

- Semantic HTML
- Handcrafted responsive CSS
- Vanilla JavaScript
- Browser `localStorage` and `sessionStorage`
- Hash-based routing for static hosting
- A 100-question intake bank with 10 concern pathways and 10/20/30/40/50 checkpoints
- Parameter-magnitude scales with transparent severity thresholds
- Doctor-editable medication and dosage review with verified/unverified status
- Fixed public home fallback with transient profile-state isolation on sign-in and sign-out
- Doctor dashboard queue for every unverified medication plan
- A pre-generated simulated-AI medication table with three ranked candidates, fit percentages and the status “Waiting for Doctor's Approval!”

## Demo accounts

All accounts use the password `demo123`.

| Role | Email |
| --- | --- |
| Doctor | `doctor@demo.local` |
| Patient | `patient@demo.local` |
| Clinical Assistant | `assistant@demo.local` |

## Run locally

No installation or build step is required.

### Option 1: Python

From the extracted project directory, run:

```bash
python3 -m http.server 8080 --directory dist
```

Then open `http://localhost:8080`.

### Option 2: Node.js

If you have Node.js and `npx`, run:

```bash
npx serve dist
```

You can also open `dist/index.html` directly, although a local web server provides more consistent browser storage behaviour.

## Demonstration sequence

1. Open **Free health intake** without signing in, complete the questions, and review the pre-generated AI draft table beneath the severity scales; or sign in as Patient and start from the questionnaire-first dashboard.
2. Sign in as Clinical Assistant and verify a pending fictional PGx report.
3. Sign in as Doctor, use the dashboard's pending medication-verification queue, open a patient, and enter or revise the medicine, dosage and schedule.
4. Record the clinician decision and follow-up date.
5. Sign in as Patient to view only the clinician-approved summary and submit follow-up information.
6. Return to the Doctor portal to see the shared local-state update and try the delete controls.

## Deploy to Render

The repository includes a `render.yaml` Blueprint for a Render static site.

1. Push the complete project directory to a Git repository.
2. In Render, select **New > Blueprint** and connect the repository.
3. Render reads `render.yaml`, runs the no-op build command and publishes `./dist`.

For manual Static Site setup, use:

- Build command: `echo "Static site ready"`
- Publish directory: `dist`

No environment variables, server process or database are required.

## Architecture

```text
one-patient-one-plan/
├── .openai/
│   └── hosting.json
├── dist/
│   ├── assets/
│   │   ├── css/
│   │   │   └── styles.css
│   │   ├── images/
│   │   │   ├── consultation.jpg
│   │   │   ├── laboratory.jpg
│   │   │   └── medical-review.jpg
│   │   └── js/
│   │       ├── app.js
│   │       ├── data.js
│   │       └── question-bank.js
│   └── index.html
├── README.md
└── render.yaml
```

- `dist/index.html` is the single static entrypoint.
- `dist/assets/css/styles.css` contains the visual system and responsive layouts.
- `dist/assets/js/data.js` contains fictional users, reports, medication-plan drafts, preset responses and seeded activity.
- `dist/assets/js/question-bank.js` contains the adaptive guided-intake bank.
- `dist/assets/js/app.js` contains routing, rendering, browser persistence, severity scaling, role workflows and the deterministic preset engine.

## Safety boundary

This project uses fictional data and stored responses. The “AI-generated” medication table is a deterministic simulation with presentation-only fit scores; no AI API is connected. It does not diagnose, prescribe, secure real health information, or replace INR monitoring and qualified clinical judgement.
