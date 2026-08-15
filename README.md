# 🏛️ e-Plan Studio — Automated Single Plot Layout Plan Drafting Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Privacy: 100% Client-Side](https://img.shields.io/badge/Privacy-100%25%20Local%20CAD-success.svg)](#-data-privacy--architectural-integrity)
[![Infrastructure: Cloudflare Workers + D1](https://img.shields.io/badge/Infrastructure-Cloudflare%20Workers%20%2B%20D1-orange.svg)](https://single-site-plan.cranbear.workers.dev)
[![Compliance: Sakala BBMP B--to--A Khata](https://img.shields.io/badge/Compliance-BBMP%20Sakala-blueviolet.svg)](#-essential-domain-glossary)

> **Instant, 100% client-side vector CAD site plan generator for single plot layout drawings.**  
> *Designed for B-to-A Khata conversions, Sakala portal submissions, ADLR 11E survey sketches, and municipal layout plan sanctions in Bengaluru, Karnataka.*

🌐 **Live Production Web Application:** [https://single-site-plan.cranbear.workers.dev](https://single-site-plan.cranbear.workers.dev)  
📦 **GitHub Repository:** [https://github.com/manswis/singleSitePlan-web](https://github.com/manswis/singleSitePlan-web)

---

## 📌 Overview

In Bengaluru, Karnataka, property owners converting a **B-Khata property into an A-Khata certificate** (via BBMP Sakala / e-Aasthi portals) are required to submit an official **Single Plot Layout Plan**.

**e-Plan Studio** is an open-source, zero-dependency, Apple HIG-inspired web CAD application that enables property owners, licensed architects, and surveyors to generate, preview, and export 100% legally compliant, publication-ready **2-Page Architectural Drawing Packages** in under 60 seconds.

---

## ✨ Key Features

- ⚡ **Real-Time Live 2D CAD Canvas:** Watch your site plan drawing update on screen as you type, complete with vector dimensions, road overlays, hatch patterns, and compass rose.
- 📐 **Automated BBMP RMP-2015 Setbacks:** Calculates mandatory front, rear, and side open space setbacks automatically based on plot area, building height, and road width regulations.
- 🔷 **Regular & Irregular Plot Geometries:** Supports rectangular, trapezoidal, and complex surveyor polygons with custom diagonal measurements and splay boundaries.
- 🔒 **100% Local Client-Side Privacy:** Zero server uploads for CAD math. All property survey numbers, eKhata IDs (ePID), addresses, and CAD geometry remain exclusively inside local browser memory (`localStorage`).
- 📄 **Official 2-Page Sakala PDF Package:** Exports a consolidated 2-page vector PDF:
  - **Page 1:** 70:30 Split-Frame Architectural Site Plan Drawing + Title Block + ADLR Header + General Notes.
  - **Page 2:** Official Colour & Line Specifications Legend Sheet with licensed architect signature & seal blocks.
- 💬 **Live Support Desk & Timeline Tracker:** Integrated issue resolution and feature request hub with real-time status tracking, Apple-style consent dialog, and verified developer conversation threads.
- 📱 **Responsive Apple HIG Workbench:** Seamlessly adapts across mobile, tablet, and desktop viewports with dark/light mode switching.

---

## 🏛️ System Architecture

e-Plan Studio employs a decoupled, privacy-first architectural paradigm:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CLIENT BROWSER (100% Offline-First)                    │
│                                                                             │
│   ┌─────────────────────┐   ┌──────────────────────┐   ┌────────────────┐   │
│   │   Interactive CAD   │   │  BBMP Setback Math   │   │  jsPDF Vector  │   │
│   │   Canvas (SVG 2D)   │◄──┤  Calculation Engine  │──►│  PDF Exporter  │   │
│   └─────────────────────┘   └──────────────────────┘   └────────────────┘   │
│              ▲                                                               │
│              │ (Zero Telemetry / Persisted locally)                          │
│              ▼                                                               │
│   ┌────────────────────────────────────────────────┐                        │
│   │  Device LocalStorage (Isolated on User Device)  │                        │
│   └────────────────────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                      (Voluntary Support Inquiries Only)
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│               SERVERLESS EDGE BACKEND (Cloudflare Workers + D1)             │
│                                                                             │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │ Cloudflare Worker API Gateway (_worker.js)                           │  │
│   │  - Anti-Spam Honeypot Trap                                           │  │
│   │  - Daily Salted SHA-256 IP Rate Limiter (Max 5/hr)                   │  │
│   │  - Zero-PII Public Status Endpoint (/api/tickets/:id)                │  │
│   └──────────────────────────────────┬───────────────────────────────────┘  │
│                                      │ (Parameterized SQL)                  │
│                                      ▼                                      │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │ Cloudflare D1 SQL Database (APAC Edge Cluster)                       │  │
│   │  - Table: tickets (Encrypted in transit & at rest)                   │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Repository Structure

```
singleSitePlan-web/
├── index.html                # Google-style landing page hub & 7-step wizard
├── studio.html               # Live 2D CAD Workbench with interactive controls
├── contact.html              # Support & issue tracker with timeline conversation
├── pricing.html              # Transparent free tier & pro architectural plans
├── legal.html                # Legally binding Terms of Service & Privacy (DPDP compliant)
├── faq.html                  # Interactive field-by-field guide & Sakala FAQ accordions
├── _worker.js                # Cloudflare Workers serverless API router & D1 bindings
├── schema.sql                # Standalone D1 database table and index definitions
├── wrangler.toml             # Cloudflare Workers & D1 deployment manifest
├── .assetsignore             # Excludes backend worker files from public static assets
├── favicon.svg               # Vector SVG blueprint favicon
├── LICENSE                   # Official MIT Open Source License
├── README.md                 # Project documentation (This file)
├── css/
│   └── styles.css            # Apple HIG master design system tokens & print styles
└── js/
    ├── wizard.js             # 7-step guided wizard state manager & draft persistence
    ├── studio.js             # CAD Workbench UI and real-time state synchronizer
    ├── ui.js                 # DOM interaction handlers & PDF export engine (jsPDF)
    ├── validator.js          # Sakala data validation rules & error focus engine
    ├── renderer.js           # SVG 2D CAD vector graphics rendering engine
    ├── theme.js              # Automatic Dark/Light mode theme manager
    ├── analytics.js          # Zero-privacy session deduplicated live stats counter
    └── contact.js            # Helpdesk controller, consent modal & timeline renderer
```

---

## 🛠️ Technology Stack

- **Frontend Core:** Semantic HTML5, Vanilla JavaScript (ES6+), Vanilla CSS3 (Apple Design System).
- **Vector CAD Engine:** Scalable Vector Graphics (SVG) with mathematical coordinate transformations.
- **Document Generation:** `jsPDF` + `html2canvas` for client-side vector PDF compilation.
- **Serverless API & Edge Hosting:** Cloudflare Workers with Static Assets.
- **Database:** Cloudflare D1 (Distributed Serverless SQLite).
- **Typography & Icons:** Google Fonts (Outfit, Inter) and Google Material Symbols.

---

## 💻 Local Development Setup

No complex Node.js build tools or heavy dependencies are required. The frontend runs 100% natively in any modern web browser.

### Option A: Static Frontend Only (No Backend)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/manswis/singleSitePlan-web.git
   cd singleSitePlan-web
   ```

2. **Serve locally via Python or Node:**
   ```bash
   # Using Python 3
   python3 -m http.server 8000

   # Or using npx serve
   npx serve ./
   ```
   Open `http://localhost:8000` in your web browser.

---

### Option B: Full-Stack with Cloudflare D1 & Worker API

To test the support desk API and database integration locally using Wrangler:

1. **Install Wrangler CLI:**
   ```bash
   npm install -g wrangler
   ```

2. **Authenticate with Cloudflare (one-time):**
   ```bash
   npx wrangler login
   ```

3. **Initialize the local D1 SQLite database:**
   ```bash
   npx wrangler d1 execute single_site_plan_support_tickets_db --local --file=schema.sql
   ```

4. **Start the local edge development server:**
   ```bash
   npx wrangler dev
   ```
   Open `http://localhost:8787` in your browser. Both static CAD drafting and `/api/tickets` will run locally with instant hot-reloading.

---

## 🗄️ Cloudflare D1 Database Integration & Deployment Guide

If you fork this repository to deploy your own instance, follow these steps to connect your Cloudflare D1 database:

### 1. Create a D1 Database
Run the following command to create a serverless D1 instance in your Cloudflare account:
```bash
npx wrangler d1 create single_site_plan_support_tickets_db
```

Wrangler will output your unique `database_id`, for example:
```toml
[[d1_databases]]
binding = "DB"
database_name = "single_site_plan_support_tickets_db"
database_id = "your-database-uuid-here"
```

### 2. Update `wrangler.toml`
Paste your database details into `wrangler.toml`:
```toml
name = "single-site-plan"
main = "_worker.js"
compatibility_date = "2024-09-23"

[assets]
directory = "."
binding = "ASSETS"

[[d1_databases]]
binding = "DB"
database_name = "single_site_plan_support_tickets_db"
database_id = "your-database-uuid-here"
```

### 3. Run Remote Database Migrations
Execute `schema.sql` against your remote Cloudflare database:
```bash
npx wrangler d1 execute single_site_plan_support_tickets_db --remote --file=schema.sql
```

### 4. Deploy to Production
```bash
npx wrangler deploy
```

---

## 🛡️ Admin Ticket Triage & Response Workflow

Admins can triage, review, and reply to user support inquiries directly from the Cloudflare Dashboard D1 Console or via Wrangler CLI:

### 1. View Recent Inquiries:
```sql
SELECT id, type, priority, status, name, email, subject, message, created_at 
FROM tickets 
ORDER BY created_at DESC 
LIMIT 20;
```

### 2. Post a Verified Response to the User's Timeline:

#### Option A: Post a Structured JSON Multi-Message Thread:
```sql
UPDATE tickets 
SET status = 'in_progress',
    public_response = '[
      {
        "text": "Hi! We investigated your setback report and identified the corner splay formula bug.", 
        "time": "2026-08-15 17:35:00", 
        "author": "e-Plan Studio Engineering Team"
      },
      {
        "text": "Fix deployed in v1.2. Please re-generate your PDF and let us know if it matches your survey sketch.", 
        "time": "2026-08-15 17:50:00", 
        "author": "Lead Developer"
      }
    ]',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'REQ-BCE5-T923';
```

#### Option B: Quick Multi-Line Reply (using `---` separator):
```sql
UPDATE tickets 
SET status = 'resolved',
    public_response = 'We updated the setback schedule for your ward.
---
Patch deployed and verified on production.',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'REQ-BCE5-T923';
```

When the user visits `contact.html?track=REQ-BCE5-T923`, the timeline conversation thread will automatically render your verified replies with timestamps!

---

## 🤝 How to Contribute

Contributions from software engineers, civil engineers, architects, and legal experts are warmly welcome!

### Contribution Workflow:
1. **Fork** the repository on GitHub.
2. **Create a Feature Branch:**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit Your Changes:**
   ```bash
   git commit -m "Add amazing new feature"
   ```
4. **Push to the Branch:**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request:** Navigate to the repository on GitHub and click **New Pull Request**.

### Areas Where You Can Help:
- 📐 **Municipal Regulatory Formats:** Preset rules for BDA, BMRDA, DTCP, or other municipal corporations in India.
- 🎨 **CAD Drawing Algorithms:** Splayed road junctions, arc curves, irregular polygon triangulation.
- 🌐 **Localization:** Adding Kannada (ಕನ್ನಡ) language translations for field labels and guide tooltips.
- 🧪 **Automated Testing:** Unit test suites for setback mathematical formulas and SVG coordinate generators.

---

## 📚 Essential Domain Glossary

| Term | Description |
| :--- | :--- |
| **A-Khata** | The official, fully legal property tax register certificate issued by BBMP. Enables bank home loans, building plan sanctions, and trade licenses. |
| **B-Khata** | A temporary register entry maintained by BBMP to collect property tax from properties with minor planning violations, unapproved layouts, or missing DC conversions. |
| **ePID (Electronic Property ID)** | A mandatory 10–15 digit unique electronic identifier assigned to every e-Khata property (e.g. `150200101402200142`). Used as the primary lookup key on Karnataka revenue portals. |
| **ADLR 11E Survey Sketch** | An official survey sketch issued by the Assistant Director of Land Records (ADLR) through the Karnataka *Bhoomi Mojini* portal confirming physical plot geometry. |
| **DC Conversion Order** | Official permission issued by the Deputy Commissioner allowing agricultural land to be converted for residential non-agricultural use under Section 95 of the KLR Act 1964. |
| **Schedule of Property (Deed DNA)** | The legal description in a Karnataka Sale Deed specifying what borders the site on 4 cardinal sides (*North by*, *South by*, *East by*, *West by*). Under Karnataka law, **boundary descriptions prevail over area measurements in court disputes**. |

---

## ⚖️ Legal Terms & Disclaimer

- **MIT License:** Distributed under the permissive [MIT License](LICENSE).
- **Independent Open-Source Tool:** **e-Plan Studio** is an independent open-source software utility and is NOT affiliated with, authorized by, endorsed by, or connected to Bruhat Bengaluru Mahanagara Palike (BBMP), Bangalore Development Authority (BDA), Sakala Services, Karnataka Revenue Department, ADLR, or the Government of Karnataka.
- **Mandatory Professional Audit:** Layout plans generated by this software serve strictly as preliminary mathematical reference drafts. All final submission packages submitted to municipal authorities must be independently verified, signed, and stamped by a Council of Architecture (COA) registered architect or licensed supervisor.
- **Trademark Acknowledgment:** *"BBMP", "Bruhat Bengaluru Mahanagara Palike", "e-Khata", "ePID", "Sakala", "ADLR", "11E Sketch", "BDA", and "Bhoomi Mojini"* are trademarks or official service acronyms belonging to the Government of Karnataka. Reference to these marks is made strictly for descriptive compatibility purposes (nominative fair use).

---

<p align="center">
Made with ❤️ for property owners, architects, and open-source developers in Bengaluru.
</p>