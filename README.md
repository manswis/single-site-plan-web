# 🏛️ e-Plan Studio — Automated Single Plot Layout Plan Drafting Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Privacy: 100% Client-Side](https://img.shields.io/badge/Privacy-100%25%20Local-success.svg)](#-100-client-side-privacy-guarantee)
[![Hosting: Cloudflare Pages](https://img.shields.io/badge/Hosting-Cloudflare%20Pages-orange.svg)](https://public.cranbear.workers.dev)
[![Compliance: Sakala B--to--A Khata](https://img.shields.io/badge/Compliance-BBMP%20Sakala-blueviolet.svg)](#-essential-domain-glossary)

> **Instant, 100% client-side vector CAD site plan generator for single plot layout plan drawings.**  
> *Designed for B-to-A Khata conversion, Sakala portal submissions, ADLR 11E survey sketches, and municipal layout plan sanctions in Bengaluru, Karnataka.*

🌐 **Live Production Web Application:** [https://public.cranbear.workers.dev](https://public.cranbear.workers.dev)

---

## 📌 Overview

In Bengaluru, Karnataka, property owners converting a **B-Khata property into an A-Khata certificate** (via BBMP Sakala / e-Aasthi portals) are required to submit an official **Single Plot Layout Plan**.

**e-Plan Studio** is an open-source, zero-dependency, Apple HIG-inspired web application that enables property owners, licensed architects, and surveyors to generate, preview, and export 100% legally compliant, publication-ready **2-Page Architectural Drawing Packages** in under 60 seconds.

---

## ✨ Key Features

- ⚡ **Real-Time Live CAD Renderer:** Watch your 2D site plan drawing update instantly on screen in real-time as you type, complete with vector dimensions, road overlays, hatch patterns, and compass rose.
- 📐 **Automated BBMP RMP-2015 Setbacks:** Calculates mandatory front, rear, and side open space setbacks automatically based on plot area, building height, and road width regulations.
- 🔒 **100% Local Client-Side Privacy:** Zero server uploads or remote database storage. All property survey numbers, eKhata IDs (ePID), addresses, and CAD geometry remain safely inside local browser memory.
- 📱 **Responsive Apple HIG Workbench:** Seamlessly adapts across mobile, tablet, and desktop viewports with frosted-glass navigation controls and automatic dark/light mode switching.
- 📄 **Official 2-Page Sakala PDF Package:** Exports a consolidated 2-page PDF:
  - **Page 1:** 70:30 Split-Frame Architectural Site Plan Drawing + Title Block + ADLR Header + General Notes.
  - **Page 2:** Official Colour & Line Specifications Legend Sheet with licensed architect signature & seal blocks.
- 🚧 **Advanced Constraints & Overlays:** Supports Master Plan road widening reservations, Rajakaluve / stormwater drain buffer zones, lake buffers, and corner plot splay geometries.
- 📊 **Zero-Setup Analytics Counter:** Session-deduplicated live counter tracking total platform visits and generated plan counts without cookies or IP tracking.

---

## 📚 Essential Domain Glossary

| Term | Description |
| :--- | :--- |
| **A-Khata** | The official, fully legal property tax register certificate issued by BBMP. Enables bank home loans, building plan sanctions, and trade licenses. |
| **B-Khata** | A temporary register entry maintained by BBMP to collect property tax from properties with minor planning violations, unapproved layouts, or missing DC conversions. |
| **ePID (Electronic Property ID)** | A mandatory 10–15 digit unique electronic identifier assigned to every e-Khata property (e.g. `1509988776`). Used as the primary lookup key on Karnataka revenue portals. |
| **ADLR 11E Survey Sketch** | An official survey sketch issued by the Assistant Director of Land Records (ADLR) through the Karnataka *Bhoomi Mojini* portal confirming physical plot geometry. |
| **DC Conversion Order** | Official permission issued by the Deputy Commissioner (Bengaluru Urban) allowing agricultural land to be converted for residential non-agricultural use under Section 95 of the KLR Act 1964. |
| **Schedule of Property (Deed DNA)** | The legal description in a Karnataka Sale Deed specifying what borders the site on 4 cardinal sides (*North by*, *South by*, *East by*, *West by*). Under Karnataka law, **boundary descriptions prevail over area measurements in court disputes**. |

---

## 🏗️ Repository Structure

```
singleSitePlan-web/
├── index.html                # Google-style ultra-clean landing page hub
├── studio.html               # 7-step guided setup wizard & live Workbench
├── pricing.html              # Transparent free tier & pro architectural plans
├── legal.html                # Legally binding Terms of Service & MIT License (Section 10)
├── faq.html                  # Interactive field-by-field guide & Sakala FAQ accordions
├── favicon.svg               # Vector SVG blueprint favicon
├── LICENSE                   # Official MIT License
├── README.md                 # Project documentation (This file)
├── css/
│   └── styles.css            # Apple HIG master design system tokens & @media print stylesheet
└── js/
    ├── wizard.js             # 7-step guided wizard state manager & draft auto-persistence
    ├── ui.js                 # DOM interaction handlers & PDF export engine (jsPDF)
    ├── validator.js          # Sakala data validation rules & smooth error focus engine
    ├── renderer.js           # SVG 2D CAD vector graphics rendering engine
    ├── theme.js              # Automatic Dark/Light mode theme manager
    └── analytics.js          # Zero-privacy session deduplicated live stats counter
```

---

## 🛠️ Technology Stack

- **Core Logic & UI:** Semantic HTML5, Vanilla JavaScript (ES6+), Vanilla CSS3 (Apple Design System).
- **Vector Rendering:** Scalable Vector Graphics (SVG) with mathematical coordinate transformations.
- **Document Export:** `jsPDF` + `html2canvas` for client-side vector PDF compilation.
- **Hosting & Deployment:** Cloudflare Pages (Serverless Edge CDN).
- **Fonts & Vector Icons:** Google Fonts (Outfit, Inter) and Material Symbols.

---

## 💻 Local Development Setup

No complex Node.js build steps, Webpack, or npm dependencies are required. The project runs 100% natively in any modern web browser.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/manswis/singleSitePlan-web.git
   cd singleSitePlan-web
   ```

2. **Launch locally:**
   Simply open `index.html` or `studio.html` directly in your web browser:
   ```bash
   # macOS
   open index.html

   # Linux
   xdg-open index.html

   # Windows
   start index.html
   ```

3. **Or serve via any static web server:**
   ```bash
   # Option A: Python 3
   python3 -m http.server 8000

   # Option B: Node npx serve
   npx serve ./
   ```
   Then open `http://localhost:8000` in your browser.

---

## 🤝 How to Contribute

Contributions from architects, civil engineers, software developers, and legal experts are warmly welcome!

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
- 🎨 **CAD Drawing Enhancements:** Corner splays, arc curves, irregular polygon triangulation algorithms.
- 📐 **Municipal Regulatory Formats:** Preset rules for BDA, BMRDA, DTCP, or other municipal corporations in Karnataka.
- 🌐 **Localization:** Adding Kannada language translations for field labels and guide tooltips.
- 🧪 **Automated Testing:** Unit test suites for setback mathematical formulas and SVG coordinate generators.

---

## ⚖️ Legal Terms & Disclaimer

- **MIT License:** Distributed under the permissive [MIT License](LICENSE).
- **Independent Tool:** **e-Plan Studio** is an independent open-source software utility and is NOT affiliated with, authorized by, endorsed by, or connected to Bruhat Bengaluru Mahanagara Palike (BBMP), Bangalore Development Authority (BDA), Sakala Services, Karnataka Revenue Department, ADLR, or the Government of Karnataka.
- **Mandatory Professional Audit:** Layout plans generated by this software serve strictly as preliminary mathematical reference drafts. All final submission packages submitted to municipal authorities must be independently verified, signed, and stamped by a Council of Architecture (COA) registered architect or licensed supervisor.
- **Trademark Acknowledgment:** *"BBMP", "Bruhat Bengaluru Mahanagara Palike", "e-Khata", "ePID", "Sakala", "ADLR", "11E Sketch", "BDA", and "Bhoomi Mojini"* are trademarks or official service acronyms belonging to the Government of Karnataka. Reference to these marks is made strictly for descriptive compatibility purposes (nominative fair use).

---

<p align="center">
Made with ❤️ for property owners, architects, and open-source developers in Bengaluru.
</p>