# 🏠 BBMP Single Plot Layout Plan Generator

> **Client-Side Web Application for BBMP Karnataka B-Khata to A-Khata Conversion**  
> *Compliant with BBMP Sakala, Namma e-Khata (e-Aasthi), BDA RMP-2015, and KTCP Act 1961 Section 17.*

---

## 📌 1. Project Overview & Background

### Why This Tool Was Built
In Bengaluru, Karnataka, property owners converting a **B-Khata property into an A-Khata property** (via the BBMP Sakala / e-Aasthi portal) are required to submit two primary technical documents:
1. **Building Plan:** Provided by an architect (if construction exists).
2. **Single Plot Layout Plan:** A certified architectural site plan drawing showing exact plot dimensions, cardinal boundaries, abutting public roads, setbacks, and land use.

This project is a lightweight, zero-dependency, 100% client-side web application designed to allow property owners, licensed architects, and engineers to instantly generate, preview, and print legally compliant **Single Plot Layout Plans**.

---

## 📚 2. Essential Domain Glossary (10-Year Future Guide)

If you return to this repository 10 years from now, here is everything you need to know about Karnataka land revenue and BBMP planning terms:

### 📑 What is B-Khata vs. A-Khata?
* **A-Khata:** The official, fully legal property tax register certificate issued by BBMP. Enables home loans, building plan sanctions, and trade licenses.
* **B-Khata:** A temporary register entry maintained by BBMP to collect property tax from properties with minor planning violations, unapproved layouts, or missing DC conversions.
* **B-to-A Conversion:** A special scheme by the Karnataka Government allowing B-Khata property owners to convert to A-Khata by submitting property records, survey sketches, site plans, and paying prescribed betterment charges.

### 🔑 Key Identification Numbers
* **e-Khata / e-Aasthi:** The digitized online property record system introduced by BBMP.
* **EP ID (Electronic Property ID):** A mandatory 10–15 digit unique electronic identifier assigned to every e-Khata property (e.g. `EP-2024-789456`). Used as the primary lookup key on Karnataka revenue portals.
* **BBMP PID Number:** Property Identification Number (e.g. `108-W0045-12`), representing **Ward (108)**, **Street (W0045)**, and **Plot (12)**.
* **ADLR 11E Survey Sketch:** An official survey sketch issued by the Assistant Director of Land Records (ADLR) through the Karnataka *Bhoomi Mojini* portal.
* **DC Conversion Order:** Permission issued by the Deputy Commissioner (Bengaluru Urban) allowing agricultural land to be converted for residential/commercial non-agricultural use under Section 95 of the Karnataka Land Revenue Act 1964.

### 📐 Physical & Urban Planning Concepts
* **Abutting Road Width:** The width (in feet or meters) of the public road physically touching the property line. BBMP uses this width to calculate permissible building height, Floor Area Ratio (FAR), and required front setbacks.
* **Schedule of Property (Deed DNA):** The legal description in a Karnataka Sale Deed specifying what borders the site on 4 sides (*North by*, *South by*, *East by*, *West by*). Under Karnataka law, **boundary descriptions prevail over area measurements in court disputes**.
* **Corner Plot:** A site abutting public roads on 2 adjacent sides (e.g., North Road and East Road).
* **RMP-2015 Road Widening:** BDA Revised Master Plan 2015 reservation requiring property owners to leave a strip of land for future public road widening.
* **Rajakaluve / Nala / Lake Buffer Zone:** Mandatory non-buildable buffer strips along stormwater drains (Primary 50m, Secondary 25m, Tertiary 15m) and lakes (30m).

---

## 🏗️ 3. Architecture & File Breakdown

The project follows strict **Single Responsibility Architecture** with zero external framework dependencies:

```
BBMPBToAKhata/
├── index.html                            # Semantic HTML5 Form & SVG Canvas
├── css/
│   └── styles.css                        # CSS Design System & Print Styles
├── js/
│   ├── ui.js                             # DOM Interaction & Auto-Sync Logic
│   ├── validator.js                      # Sakala Data Validation Engine
│   ├── renderer.js                       # SVG Vector Graphics Generator
│   └── samples.js                        # Reference Test Preset Loaders
├── improvement.md                        # Master Roadmap & Technical Checklist
├── README.md                             # Comprehensive Documentation (This File)
├── SINGLE PLOT LAYOUT PLAN - LEGEND.pdf  # BBMP Official Colour Specifications
└── SINGLE SITE PLAN SAMPLE FORMATS.pdf   # Approved BBMP Sample Drawing Packages
```

### Module Responsibilities:

#### 📄 `index.html`
Organized into 7 semantic form sections:
1. **Section 1: Revenue Records & Identifiers** (`ownerName`, `epId`, `pidNo`, `sasNo`, `adlrNo`, `dcOrderNo`, `dcOrderDate`, `dcAuthority`).
2. **Section 2: Location & BBMP Administration** (`surveyNo`, `bbmpZone`, `wardNo`, `wardName`, `address`).
3. **Section 3: Plot Measurements & Cardinal Boundaries** (`plotArea`, `roadWidth`, `roadFacing`, `scale`, `sideNorth`, `sideSouth`, `sideEast`, `sideWest`, `oddSiteCheck`).
4. **Section 4: Structure & Custom Setbacks** (`floorsCount`, `builtUpArea`, `bldgWidth`, `bldgLength`, `setbackFront`, `setbackRear`, `setbackLeft`, `setbackRight`).
5. **Section 5: Schedule of Property (Boundary Adjacencies)** (4 Cardinal Boundary Cards with 9 exhaustive boundary categories).
6. **Section 6: Road Widening & Buffer Constraints** (`roadWideningCheck`, `proposedRoadWidth`, `roadWideningStripWidth`, `bufferCheck`, `bufferType`, `bufferWidth`).
7. **Section 7: Document Options & Challan Details** (`includeLegendPage`, `challanFee`, `challanNo`, `challanDate`).

#### 🎨 `css/styles.css`
* **Uniform Form Controls:** Enforces exact 38px height, `box-sizing: border-box`, and custom SVG chevron dropdown indicators on all `<input>` and `<select>` controls.
* **Educational Infoboxes:** Styled guidance tooltips (`.info-tooltip-box`) explaining technical terms to everyday users.
* **Print Optimization:** `@media print` rules hiding form cards and printing crisp, vector-clear layout plans.

#### ⚙️ `js/ui.js`
* **Cardinal Side Auto-Sync (`syncOppositeSides`):** In Rectangular Plot mode, typing into **North** automatically syncs **South**, and typing into **East** automatically syncs **West**.
* **Area Calculator (`calculatePlotAreaFromSides`):** Automatically computes Plot Area sq.ft from side measurements.
* **Boundary Visibility Toggle (`toggleBoundaryType`):** Switches boundary card inputs between Road Name/Width fields and Neighboring Site description fields.
* **Panel Toggles:** Manages Road Widening, Buffer Zone, and Odd Site visibility.

#### 🛡️ `js/validator.js`
* Evaluates all mandatory BBMP Sakala fields (Owner Name, e-Khata EP ID, PID Number, Survey No, BBMP Zone, Ward Details, Address, Plot Area, Road Width, Road Facing Direction, 4-Side Cardinal Dimensions, and 4-Side Boundary Types).
* Displays inline field warnings and smooth-scrolls to the validation error summary box.

#### 🎨 `js/renderer.js`
* Converts physical measurements into pixel scaling ratios (`ratio = min(maxW / side, maxH / side)`).
* Computes vector vertices for regular rectangles and irregular quad polygons.
* **Multi-Road SVG Renderer:** Dynamically draws public roads on 1, 2 (Corner Plot), 3, or 4 sides with custom road names and widths.
* Renders dimension lines, setback callouts, cardinal boundary labels (`N: 30'-0"`, etc.), North rosette, scale bar, and output summary table.

#### 🧪 `js/samples.js`
Contains pre-filled reference test presets:
* `loadSampleRegular()` — Standard $30' \times 40'$ site with 1 public road.
* `loadSampleCornerPlot()` — $40' \times 60'$ 2-side Corner Plot (North $30'$ road & East $60'$ main road).
* `loadSampleOdd()` — Irregular trapezoid quadrilateral site.
* `loadSampleRoadWidening()` — Site subject to RMP-2015 road widening.

---

## 🌟 4. Features & Key Capabilities

1. **Universal 4-Side Cardinal Boundary System:**
   * Uses **North Side**, **South Side**, **East Side**, and **West Side** as primary inputs for all plots, eliminating "Width vs Length" confusion.
2. **Exhaustive 9 Boundary Categories:**
   * Supports all real-world Karnataka deed boundaries:
     1. 🛣️ Public Road / Street / Highway
     2. 🏠 Neighboring Site / Private Plot
     3. 🌊 Stormwater Drain / Rajakaluve
     4. 🏞️ Lake / Water Body / Lake Buffer
     5. 🌳 Park / CA Civic Amenity Site
     6. 🌾 Vacant Survey Land / Agri Plot
     7. 🚪 Private Passage / Common Lane
     8. 🚂 Railway Track / Metro Line
     9. 🏢 Government / Institutional Property
3. **Multi-Road & Corner Plot Support:**
   * Seamlessly renders plots abutting roads on **1 side**, **2 sides (Corner Plot)**, **3 sides**, or **all 4 sides (Island Plot)**.
4. **Educational Infoboxes:**
   * Built-in guidance tooltips explaining terms like *Abutting Road Width* and *Deed Schedule Accuracy*.
5. **No Pre-selected Dropdown Defaults:**
   * Every dropdown starts at `-- Select ... --` forcing explicit user confirmation to prevent accidental default submissions.

---

## 🚀 5. How to Run Locally

Since this is a lightweight client-side application:

1. Clone the repository:
   ```bash
   git clone https://github.com/manswis/singleSitePlan-web.git
   ```
2. Open `index.html` directly in any web browser (Chrome, Firefox, Safari, Edge):
   ```bash
   open index.html
   ```
3. No Node.js, server setup, or npm installation required!

---

## 🗺️ 6. Master Technical Roadmap (Phases 1–5)

Refer to [improvement.md](file:///Users/manojbiswas/Documents/Projects/BBMPBToAKhata/improvement.md) for full phase-by-phase implementation specifications:

- [x] **Phase 1: Form & Input Fields Expansion (COMPLETED)** — 7 form sections, universal N/S/E/W cardinal inputs, multi-road corner plot controls, 9 boundary categories, input validation, and preset loaders.
- [ ] **Phase 2: Sheet Layout Re-engineering (70:30 Split Frame)** — Redesign layout into $70\%$ left drawing canvas and $30\%$ right vertical title block containing 8 mandatory BBMP panels (ADLR bar, Key Plan, DC Order, 15 General Conditions, Land Use Analysis Table, Legend, Signatures & Seal, Title Block).
- [ ] **Phase 3: Official BBMP SVG Graphics Engine & Feet-Inches Formatter** — Architectural feet-inches formatter (`40'-0"`), dash-dot-dot plot boundary stroke (`- . . -`), Cobalt Blue $45^\circ$ diagonal building hatch, Grey road widening hatch, center line of road (`C/L OF ROAD`), and corner splays.
- [ ] **Phase 4: Multi-Page Merged PDF Export** — Consolidated 2-page print/PDF export (Page 1 = 70:30 Site Plan, Page 2 = Official BBMP Colour & Line Specifications Sheet `LEGEND.pdf`).
- [ ] **Phase 5: Automated Testing & Verification Suite.**

---

## 📄 License & Legal Disclaimer

* **Disclaimer:** This tool generates sample Single Plot Layout Plans for reference. Final plans submitted to BBMP for B-to-A Khata conversion must be reviewed, signed, and stamped by a licensed Architect or Engineer registered with BBMP / Council of Architecture (COA).