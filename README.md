# 305 HACKSHELLS: Miami-Dade Single Mother Financial Stability Agent 🌟
> **Empowering Public School Families through Autonomous Subsidies & Benefits Routing in Miami-Dade County (The 305)**

Built for the **305 Hackathon (September 2026)**, this AI agent serves single mothers and primary caregivers of children enrolled in or applying to **Miami-Dade County Public Schools (M-DCPS)** in South Florida.

---

## 🎯 The Mission & Problem Statement
Navigating public assistance in Miami-Dade County is a fragmented, bureaucratic maze. A low-income single mother attempting to stabilize her family must juggle multiple disconnected agencies:
- **Early Learning Coalition (ELC) of Miami-Dade/Monroe** for School Readiness child care subsidies and waitlists.
- **DCF ACCESS Florida** for SNAP (Food Stamps), TANF cash assistance, and Medicaid healthcare.
- **Miami-Dade Community Action and Human Services (CAHSD)** for FPL electric and water crisis grants (LIHEAP).
- **Miami-Dade Transit (MDT)** to coordinate late-shift Metrobus and Metrorail commutes around daycare closing times.

Missing a single deadline notice, experiencing a temporary drop below 20 work hours, or misplacing one document can trigger immediate benefits cancellation.

**The Solution:** The 305 Stability Agent turns fragmented local help into a **short, doable plan**. Every response speaks like a calm, straight neighbor (not a government brochure) and concludes with **at most THREE concrete next actions**—specifying what to do, where, by when, and what to bring.

---

## ⚡ The 6 Specialized Functions

| Function | Name | Description | Key Capabilities |
| :---: | :--- | :--- | :--- |
| **1** | **Letter Reader & Document Audit** | Decodes official letters & notices | Audits warning letters, flags termination deadlines, and lists exact documents required (e.g. 4 consecutive weeks of pay stubs or signed Cash Employment Logs). |
| **2** | **Subsidies Eligibility Map** | Evaluates local assistance | Evaluates likely eligibility for School Readiness, VPK (free for 4-year-olds), SNAP, and Medicaid using minimal inputs (ZIP, children's ages, hours) without asking for SSNs. |
| **3** | **Revalidation Tracker** | Waitlist & status protector | Clarifies that "Active" means waiting list, tracks 6-month recertification deadlines, and guides mothers on filing a "Change in Purpose of Care" when work hours fluctuate. |
| **4** | **Document Checklist Builder** | Zero-defect application prep | Distinguishes between what documents the mother has vs. what is missing (e.g., rejecting old leases, providing official ELC Cash Employment Logs for cleaning/informal work). |
| **5** | **Shift & Transit Planner** | Hospitality & airport night care | Routes night/evening shifts (South Beach, Brickell, MIA) around Miami-Dade Transit (MDT) schedules and directs mothers to licensed Family Child Care Homes (FCCH) offering overnight care. |
| **6** | **Private Phone Teammate** | Safe mobile consultation | Enables safe, confidential inquiry between shifts from a phone in a parking lot. Clarifies that citizen children qualify regardless of parental immigration status and that child benefits do not trigger public charge. |

---

## 🚨 Built-in Crisis Safeguards & Geofencing

### 1. Safety & Child Abuse Emergency Trigger
- Immediate detection of child danger or domestic violence (`hit`, `beaten`, `unsafe`, `scared`, `danger`).
- Instantly bypasses paperwork to provide **911**, the **Florida Abuse Hotline (1-800-96-ABUSE / 1-800-962-2873)**, and confidential transfers to Miami-Dade domestic violence shelters (*The Lodge* & *Safespace Foundation*) via **JCS 211**.

### 2. Immediate Eviction & Emergency Food Trigger
- Triggers when a mother faces homelessness tonight or cannot feed her children today.
- Directly routes to the **Miami-Dade Homeless Trust Helpline (1-877-994-4357)** for emergency family shelter beds, **JCS 211** for food pantries open today, and **M-DCPS Project UP-START (305-995-7558)** for McKinney-Vento student rights.

### 3. Hard South Florida Geofence
- Strictly blocks out-of-area programs and hotlines:
  - **Rejects texting 898211** (redirects to calling **211** or visiting `211miami.org` for Jewish Community Services of South Florida).
  - **Corrects California references** (CalFresh / CalWORKs ➔ Florida DCF ACCESS).
  - **Corrects Orlando / Orange County references** (OCPS / Lynx ➔ M-DCPS and Miami-Dade Transit).

---

## 🗣️ Trilingual Cultural Grounding (The 305)
Miami-Dade is home to diverse English-, Spanish-, and Haitian Creole-speaking communities:
- Full native Spanish support with culturally attuned tone and vocabulary.
- Haitian Creole terminology and direct referrals to Creole-speaking specialists at the ELC Miami-Dade customer service line (**305-646-7220**, Press 3 for Creole).

---

## 🏗️ Architecture & Technology Stack

```
305HACKSHELLS-September2026/
├── src/
│   ├── App.tsx             # Interactive React UI with scenario playground & live badges
│   ├── main.tsx            # Application entrypoint
│   └── index.css           # Tailwind CSS styling & animations
├── server.ts               # Node.js/Express backend with Gemini 2.5 Flash & Dynamic 305 Engine
├── docs/
│   └── production_and_evaluation_blueprint.md  # Production roadmap, eval rubric & pitch
├── index.html              # HTML5 template
├── package.json            # Project dependencies & scripts
├── vite.config.ts          # Vite build & bundler configuration
└── .gitattributes          # Git LFS tracking for demo media
```

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide React icons.
- **Backend**: Express.js server in TypeScript, with dual-mode reasoning:
  1. **Google Gemini 2.5 Flash API**: Live multimodal LLM reasoning grounded in M-DCPS system instructions.
  2. **Dynamic 305 Offline Reasoner Engine**: Resilient, instant fallback engine delivering localized guidance without external latency or outages.

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- Node.js 18+ (Node 20+ recommended)
- npm or bun

### Installation
```bash
# Clone the repository
git clone https://github.com/whatsgooglyKP/305HACKSHELLS-September2026.git
cd 305HACKSHELLS-September2026

# Install dependencies
npm install

# (Optional) Add your Gemini API key to .env
# GEMINI_API_KEY=your_gemini_api_key_here

# Start the development server
npm run dev
```

Open your browser at **`http://localhost:3000`** to interact with the live assistant and the 6 interactive scenarios.

---

## 📊 Evaluation & Quality Flywheel
See [`docs/production_and_evaluation_blueprint.md`](docs/production_and_evaluation_blueprint.md) for the full LLM-as-a-judge evaluation suite, rubric definitions, and the 305 Hackathon pitch slide deck.

---

## 📜 License
MIT License. Built with ❤️ for Miami-Dade County Public School families.
