# BBMP Single Plot Layout Plan Generator — Master Technical Specification & Roadmap

This document is the **master implementation blueprint** to transform [index.html](file:///Users/manojbiswas/Documents/Projects/BBMPBToAKhata/index.html) into an official, 100% bulletproof **BBMP Single Plot Layout Plan Generator** for B-Khata to A-Khata conversion. It combines all initial functional requirements with the exact legal, graphical, and architectural standards extracted from official BBMP/BDA PDF sample documents (`SINGLE PLOT LAYOUT PLAN - LEGEND.pdf` and `SINGLE SITE PLAN SAMPLE FORMATS.pdf`).

---

## 🎯 Primary Goal
Generate legally valid, architect-sealed **Single Plot Layout Plans** in standard **A3 / A4 PDF** format that strictly comply with:
1. **BBMP Sakala & Namma e-Khata** portal requirements (2025–2026 Special Drive & KTCP Act 1961 Section 17).
2. **BBMP Colour Coding & Line Type Specifications** (`SINGLE PLOT LAYOUT PLAN - LEGEND.pdf`).
3. **Official BDA / BBMP Approved Single Site Plan Formats** (`SINGLE SITE PLAN SAMPLE FORMATS.pdf`).

---

## 🔍 Comparative Analysis: Official BBMP Standard vs. Current Code

| Feature / Element | Official BBMP PDF Standard (`SINGLE SITE PLAN SAMPLE FORMATS.pdf` & `LEGEND.pdf`) | Current `index.html` Implementation | Status / Action Required |
| :--- | :--- | :--- | :--- |
| **Sheet Layout Frame** | Architectural 70:30 Split (70% Drawing Canvas on Left, 30% Structured Vertical Title Block on Right) | Stacked single column (Table on top, SVG in middle, Legend on bottom) | 🔴 **Major Re-layout Needed (Phase 2)** |
| **Merged Multi-Page PDF Export** | Generate a single consolidated multi-page PDF (Page 1 = Site Plan, Page 2 = BBMP Colour & Line Legend Sheet) | Checkbox added (`#includeLegendPage`) | 🟢 **Phase 1 Controls Ready** |
| **Feet & Inches Formatting** | Standard Architectural Feet-Inches notation (`40'-0"`, `40'-6"`, `12'-3"`) for all plot, setback & building dimensions | Raw numbers / basic strings | 🔴 **Add Ft'-In" Formatter (Phase 3)** |
| **Plot Boundary Line Style** | **Black Dash-Dot-Dot Line** (`- . . - . . -`) | Plain solid line | 🔴 **Fix SVG Stroke Style (Phase 3)** |
| **Building Hatching** | **Cobalt Blue** outline with $45^\circ$ diagonal stroke fill | Plain light-blue fill (`#bfdbfe`) | 🔴 **Fix SVG Pattern Hatch (Phase 3)** |
| **Building Setbacks** | Explicit Front, Rear, Left, Right setback dimensions & positioning | Form controls added (`#setbackFront`, etc.) | 🟢 **Phase 1 Controls Ready** |
| **Road Widening (RMP 2015)** | Dedicated hatched strip (`ROAD WIDENING AREA`), Center Line (`C/L OF ROAD`), area calculation | Controls & toggle added (`#roadWideningCheck`) | 🟢 **Phase 1 Controls Ready** |
| **ADLR 11E Sketch Bar** | Header bar referencing ADLR 11E survey sketch (Bhoomi Mojini System) | Input field added (`#adlrNo`) | 🟢 **Phase 1 Controls Ready** |
| **Key Plan (Locational Sketch)** | Mini key plan thumbnail pointing to `SITE IN QUESTION` | Missing | 🔴 **Add Key Plan Box (Phase 2)** |
| **DC Conversion Order** | DC Conversion Order No., Date, and Authority box | Input fields added (`#dcOrderNo`, etc.) | 🟢 **Phase 1 Controls Ready** |
| **Land Use Analysis Table** | Detailed table breaking down: Residential Area, Road Widening Area, Buffer Area, Total Area with **Area (Sqm)** and **Percentage (%)** | Simple key-value text table | 🔴 **Update Table Component (Phase 2)** |
| **15 General Conditions** | Mandatory 15 legal conditions panel (KTCP Act Sec 17, RWH, Tree planting, FAR limits) | 1-line note | 🔴 **Add 15-Point Legal Panel (Phase 2)** |
| **Adjacent Site Labels** | Explicit `SITE NO. A`, `SITE NO. B`, `SITE NO. C` callouts on plot boundaries | Input fields added (`#adjNorth`, etc.) | 🟢 **Phase 1 Controls Ready** |
| **Challan / Payment Box** | Remitted Fee Challan No., Date, and Approval Order No. box | Input fields added (`#challanNo`, etc.) | 🟢 **Phase 1 Controls Ready** |
| **Drain / Buffer Zones** | Blue wavy line for Nala/Drain, dashed blue line with dotted fill for Drain/Lake Buffer | Controls & toggle added (`#bufferCheck`) | 🟢 **Phase 1 Controls Ready** |

---

## 📐 Detailed Technical Specifications

### 1. Architectural Sheet Frame Layout (70 : 30 Grid)
Official BBMP layout drawings use a standard architectural frame:

```
+-------------------------------------------------------+-----------------------------------------------+
|                                                       |  ADLR SKETCH REFERENCE BAR                    |
|                                                       +-----------------------------------------------+
|                                                       |  KEY PLAN (LOCATIONAL SKETCH)                 |
|                                                       +-----------------------------------------------+
|                                                       |  DC CONVERSION ORDER DETAILS                  |
|                                                       +-----------------------------------------------+
|                                                       |  GENERAL CONDITIONS OF APPROVAL (15 POINTS)   |
|                 DRAWING CANVAS (70%)                  +-----------------------------------------------+
|                                                       |  LAND USE ANALYSIS TABLE (Sqm & %)            |
|  * Property Boundary Line (- . . - . . -)             +-----------------------------------------------+
|  * Existing Building (Cobalt Blue + Hatch)            |  LEGEND BOX (Standard Symbols)                |
|  * Road & Road Widening Strip (Hatched)               +-----------------------------------------------+
|  * Center Line of Road (C/L)                          |  SIGNATURES & SEAL BLOCK                      |
|  * Adjacent Plot Labels (Site A, B, C)                |  (Owner + Architect + Sanction Authority)     |
|  * Setback lines & Dimensions                         +-----------------------------------------------+
|                                                       |  DRAWING TITLE, PID, WARD, NORTH & SCALE      |
|                                                       +-----------------------------------------------+
|                                                       |  REMITTED FEE & CHALLAN NOTE BOX              |
+-------------------------------------------------------+-----------------------------------------------+
```

---

### 2. Merged Multi-Page PDF Generation Feature
When the user checks the option **`[x] Include BBMP Line & Colour Legend Sheet (Page 2)`**, the application generates a **single combined multi-page document**:

* **Page 1:** The official 70:30 Single Plot Layout Plan (Drawing canvas + Title Block).
* **Page 2:** The official BBMP Line & Colour Specifications Sheet (`SINGLE PLOT LAYOUT PLAN - LEGEND.pdf`), containing:
  - Table of Line Types, Hatch Types, and Colors (Black dash-dot plot boundary, Cobalt Blue diagonal hatch building, Red survey line, Grey road widening hatch, etc.).
  - Digital Submission Requirements (AutoCAD & PDF format, A3/A4 size, Scale 1:100/1:200/1:250 up to 10 Guntas).
  - Page break rule (`page-break-before: always;`) ensures a clean, single merged PDF file when exporting/printing.

---

### 3. BBMP Regulatory Compliance & Metadata Expansion
BBMP e-Khata scrutiny officers require comprehensive property identification and schedule details to cross-verify against revenue records (e-Swathu / Sakala / KAVERII 2.0).

- **PID & SAS Application Number:**
  - **Property Identification Number (PID)** field (10-digit BBMP PID).
  - **SAS (Self Assessment Scheme) Khata / Application Number** field.
- **ADLR 11E Sketch & DC Conversion Details:**
  - **ADLR 11E Survey Sketch Number** (issued via Bhoomi Mojini portal).
  - **DC Conversion Order Number, Date, and Authority** (Deputy Commissioner Urban).
- **Zone & Ward Details:**
  - **BBMP Zone** dropdown (East, West, South, Mahadevapura, Yelahanka, Dasarahalli, Bommanahalli, Rajarajeshwari Nagar).
  - **Ward Name** text field (e.g., *Malleshwaram*, *Indiranagar*, *JP Nagar*) alongside Ward Number.
- **Schedule of Property (Boundary Adjacencies):**
  - Explicit user inputs for the 4 boundaries:
    - **North Boundary / Site No:** [e.g., SITE NO. B / Public Road]
    - **South Boundary / Site No:** [e.g., MAIN ROAD / SITE NO. D]
    - **East Boundary / Site No:** [e.g., SITE NO. C]
    - **West Boundary / Site No:** [e.g., SITE NO. A]
- **Building Specifications:**
  - **Number of Floors** dropdown/input (e.g., *Vacant Plot*, *Stilt + Ground*, *G + 1 Floor*, *G + 2 Floors*, *G + 3 Floors*).
  - **Total Built-up Area** (sq.ft / sq.m) field to verify Floor Area Ratio (FAR).

---

### 4. Custom Setbacks & Dynamic Building Positioning Engine
In actual construction, buildings are placed according to front, rear, left, and right setbacks specified by BBMP Bye-laws.

- **Explicit Custom Setback Inputs:**
  - **Front Setback (ft / m)**
  - **Rear Setback (ft / m)**
  - **Left Setback (ft / m)**
  - **Right Setback (ft / m)**
- **Dynamic Footprint Placement:**
  $$\text{Building } X = \text{Plot } X + \text{Left Setback} \times \text{scaleRatio}$$
  $$\text{Building } Y = \text{Plot } Y + \text{Front Setback} \times \text{scaleRatio}$$
- **BBMP Bye-Law Compliance Check:**
  - Real-time validation of setbacks against BBMP Building Bye-Laws (2003 / RMP 2015) based on road width and plot size, displaying warning badges if setbacks are less than prescribed minimums.
- **Corner Plot / Multi-Road & Splay Support:**
  - Support for **Corner Plots** (plots abutting 2 roads, e.g., North and East).
  - Render **Corner Splay** (chamfered plot corner at road intersections as required by BBMP).

---

### 5. BBMP Official Line Types & Colour Coding (`LEGEND.pdf`)

All SVG visual rendering must adhere strictly to BBMP palette rules:

```xml
<defs>
  <!-- Building Diagonal Hatch Pattern -->
  <pattern id="bldgHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
    <line x1="0" y1="0" x2="0" y2="8" stroke="#2563eb" stroke-width="1.5" />
  </pattern>
  
  <!-- Road Widening Hatch Pattern -->
  <pattern id="roadWideningHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
    <line x1="0" y1="0" x2="0" y2="8" stroke="#64748b" stroke-width="1.5" />
  </pattern>

  <!-- Drain Buffer Pattern -->
  <pattern id="bufferHatch" width="6" height="6" patternUnits="userSpaceOnUse">
    <circle cx="3" cy="3" r="1" fill="#0284c7" />
  </pattern>
</defs>
```

* **Plot Boundary:** `stroke="#000000"` `stroke-width="2"` `stroke-dasharray="12,3,3,3,3,3"` (Dash-Dot-Dot).
* **Existing Building:** `stroke="#1d4ed8"` `fill="url(#bldgHatch)"`.
* **Road Widening Area:** `stroke="#475569"` `fill="url(#roadWideningHatch)"`.
* **Survey Boundary Line:** `stroke="#dc2626"` `stroke-width="1.5"` (Solid Red).
* **Center Line of Road:** `stroke="#000000"` `stroke-dasharray="10,3,2,3"` (`C/L OF ROAD`).

---

### 6. Irregular Quad Geometry Math, Feet-Inches Formatting & Dual Units
- **Irregular / Odd Quad Geometry Math:**
  - Calculate true vertex points $(x_0, y_0), (x_1, y_1), (x_2, y_2), (x_3, y_3)$ when side lengths differ:
    $$\text{Top-Left} = (x_{\text{off}} + \Delta_x, y_{\text{off}})$$
    $$\text{Top-Right} = (x_{\text{off}} + N \cdot r, y_{\text{off}})$$
    $$\text{Bottom-Right} = (x_{\text{off}} + S \cdot r, y_{\text{off}} + E \cdot r)$$
    $$\text{Bottom-Left} = (x_{\text{off}}, y_{\text{off}} + W \cdot r)$$
- **Standard Feet & Inches Notation (`ft' in"`):**
  - Implement a dedicated dimension formatter `formatFeetInches(decimalFeet)`:
    - Converts decimal feet (e.g. `40.5`) to architectural notation: `40'-6"` ($40\text{ ft } 6\text{ in}$).
    - Converts whole feet (e.g. `40`) to `40'-0"`.
    - Applied universally across all SVG dimension lines, side callouts, setback labels, and output summary tables.
- **Dual Unit Display:**
  - Display dimensions in Imperial (`40'-0"`) and Metric (`12.19 m`) simultaneously on the output plan table and legend.
- **Compass & Linear Scale Bar:**
  - North Rosette symbol with clean vector paths.
  - Graphical linear scale bar (0m - 5m - 10m) in addition to text scale ratio (`1:100`).

---

### 7. Land Use Analysis Table & Road Widening Calculations
The layout plan automatically computes developable area:

$$\text{Net Developable Area} = \text{Total Site Area} - \text{Road Widening Area} - \text{Buffer Area}$$

| SL. No | PARTICULARS | AREA (Sqm) | % |
| :---: | :--- | :---: | :---: |
| 1 | RESIDENTIAL / NON-RESIDENTIAL AREA | $A_{\text{net}}$ | $\frac{A_{\text{net}}}{A_{\text{total}}} \times 100$ |
| 2 | ROAD WIDENING AREA (RMP-2015) | $A_{\text{road}}$ | $\frac{A_{\text{road}}}{A_{\text{total}}} \times 100$ |
| 3 | DRAIN / LAKE BUFFER AREA | $A_{\text{buffer}}$ | $\frac{A_{\text{buffer}}}{A_{\text{total}}} \times 100$ |
| **TOTAL** | **TOTAL SITE AREA** | $A_{\text{total}}$ | **100.00%** |

---

### 8. 15 Mandatory General Conditions of Approval
The plan sheet sidebar includes the 15 standard BBMP legal conditions:

1. The single plot layout plan is approved based on the survey sketch certified by the Assistant Director of Land Records (ADLR).
2. Building construction shall be undertaken only after obtaining approval for the building plan from the city corporation as per the approved single site plan.
3. The existing width of road abutting the site in question is marked in the plan. At the time of building plan approval, the authority approving the building plan shall allow the maximum FAR permissible considering the minimum width of the road at any stretch towards any one side which shall join a road of equal or higher width.
4. The owner shall provide drinking water, waste water discharge system, solid waste management system and drainage system for the site in question. During the building plan approval the owner shall submit a design to implement the rain water harvesting to collect the rain water from the entire site area.
5. Approval of single site layout plan shall not be a document to claim title to the property. In case of pending cases under the Land Reforms Act/Section 136(3) of the Land Revenue Act, 1964, approval of single site layout plan shall be subject to final order. The applicant shall be bound by the final order of the court in this regard and in no case the fees paid for the approval of the single site layout plan will be refunded.
6. If it is found that the land proposed by the applicant includes any land belonging to the Government or any other private land, in such a case, the Authority reserves the rights to modify the single site layout plan or to withdraw the plan.
7. If it is proved that the applicant has provided any false documents or forged documents for the plan sanction, the plan sanction shall stand canceled automatically.
8. The applicant shall be bound to all subsequent orders and the decision relating to payment of fees as required by the Authority.
9. Adequate provisions shall be made to segregate wet waste, dry waste and plastics. Area should be reserved for composting of wet waste, dry waste etc.
10. No Objection Certificates/Approvals for the building plan should be obtained from the competent authorities prior to construction of building on the approved single site.
11. Sewage shall not be discharged into open spaces/vacant areas but should be reused for gardening, cleaning of common areas and various other uses.
12. If the owner wishes to modify the single site layout plan to multi-plot residential layout, the owner shall submit a request to the Greater Bengaluru Authority and obtain approval for the multi-plot residential layout plan as per the zoning regulations.
13. One tree for every 240.0 sq.m. of the total floor area shall be planted and nurtured at the site in question.
14. Prior permission should be obtained from the competent authority before constructing a culvert on the storm water drain between the land in question and the existing road attached to it if any.
15. To abide by such other conditions as may be imposed by the Authority from time to time.

---

## 📋 Master Implementation Checklist

### Phase 1: Form & Input Fields Expansion (COMPLETED)
- [x] Add **ADLR 11E Sketch Number** input field (`#adlrNo`).
- [x] Add **DC Conversion Order Details** inputs:
  - [x] Order Number (`#dcOrderNo`)
  - [x] Order Date (`#dcOrderDate`)
  - [x] Issuing Authority (`#dcAuthority`, e.g., *Deputy Commissioner, Bengaluru Urban*)
- [x] Add **BBMP PID Number** input (`#pidNo`).
- [x] Add **SAS Khata Application / Fee Challan Details**:
  - [x] Remitted Fee Amount (`#challanFee`)
  - [x] Challan Number (`#challanNo`)
  - [x] Challan Date (`#challanDate`)
- [x] Add **BBMP Zone** dropdown (`#bbmpZone`) & **Ward Name** input (`#wardName`).
- [x] Add **Schedule of Property / Adjacent Plot Labels**:
  - [x] North Boundary / Site No (`#adjNorth`, e.g., *SITE NO. B*)
  - [x] South Boundary / Site No (`#adjSouth`, e.g., *MAIN ROAD*)
  - [x] East Boundary / Site No (`#adjEast`, e.g., *SITE NO. C*)
  - [x] West Boundary / Site No (`#adjWest`, e.g., *SITE NO. A*)
- [x] Add **Custom Setback Input Fields**:
  - [x] Front Setback (`#setbackFront`)
  - [x] Rear Setback (`#setbackRear`)
  - [x] Left Setback (`#setbackLeft`)
  - [x] Right Setback (`#setbackRight`)
- [x] Add **RMP-2015 Road Widening Controls**:
  - [x] Enable Road Widening Checkbox (`#roadWideningCheck`)
  - [x] Proposed Road Width in RMP-2015 (`#proposedRoadWidth`, e.g., *18.0 m*)
  - [x] Road Widening Strip Width (`#roadWideningStripWidth`, e.g., *3.0 m*)
- [x] Add **Drain / Lake Buffer Zone Controls**:
  - [x] Enable Buffer Checkbox (`#bufferCheck`)
  - [x] Buffer Type (Nala / Drain / Lake)
  - [x] Buffer Width (`#bufferWidth`, e.g., *7.0 m*)
- [x] Add **"Include BBMP Line & Colour Legend Sheet (Page 2)"** checkbox (`#includeLegendPage`).

### Phase 2: Sheet Layout Re-engineering (70:30 Split Frame) (COMPLETED)
- [x] Redesign `.plan-sheet` layout to 2-column grid ($70\% : 30\%$).
- [x] Implement Right Sidebar containing all 8 BBMP mandatory panels:
  - [x] Panel 1: ADLR 11E Sketch Reference Header.
  - [x] Panel 2: SVG Key Plan (Locational Sketch thumbnail).
  - [x] Panel 3: DC Conversion Order Details Box.
  - [x] Panel 4: 15 General Conditions of Approval Box.
  - [x] Panel 5: Land Use Analysis Table (Sqm & % breakdown).
  - [x] Panel 6: BBMP Official Legend Box.
  - [x] Panel 7: Signatures & Seal Block (Owner, Architect with COA No, Sanction Authority).
  - [x] Panel 8: Title Block (Sy No, Village, Taluk, PID, Ward, North Arrow, Scale, Challan Note).

### Phase 3: Official BBMP SVG Graphics Engine & Feet-Inches Formatter (`LEGEND.pdf`) (COMPLETED)
- [x] Implement `formatFeetInches(decimalFeet)` helper function (`40'-0"`, `40'-6"`, `12'-3"`) for all dimensions.
- [x] Implement Dash-Dot-Dot SVG line style for plot boundary (`- . . - . . -`).
- [x] Implement Cobalt Blue $45^\circ$ diagonal hatch pattern for building footprint.
- [x] Implement Grey diagonal hatch pattern for Road Widening Area.
- [x] Implement Center Line of Road (`C/L OF ROAD`) dash pattern and callout arrow.
- [x] Render explicit adjacent site text labels (`SITE NO. A`, `SITE NO. B`, `SITE NO. C`).
- [x] Render Drain / Nala Wavy lines and Buffer zone dots if enabled.
- [x] Implement dynamic building placement based on custom setback inputs.
- [x] Implement Corner Splay (cut corner) geometry renderer in SVG.
- [x] Implement dynamic Land Use Analysis math ($A_{\text{residential}}$, $A_{\text{road\_widening}}$, $A_{\text{buffer}}$, $A_{\text{total}}$).

### Phase 4: A3 / A4 PDF Export & Multi-Page Merged Export (COMPLETED)
- [x] Add explicit **"📥 Download PDF / Print Plan"** button.
- [x] Implement Multi-Page Merged PDF layout:
  - [x] Page 1: Single Site Layout Plan (70:30 Frame).
  - [x] Page 2: BBMP Official Colour Coding & Line Specifications Sheet (when `#includeLegendPage` is checked).
- [x] Add `@media print` CSS rules with `page-break-before: always;` optimized for A4/A3 single-file PDF generation.

### Phase 5: Testing & Sample Presets (COMPLETED)
- [x] Add sample pre-fill preset 1: **Standard 30x40 Site (1-Road)**
- [x] Add sample pre-fill preset 2: **2-Side Corner Plot (North 30' Road & East 60' Main Road)**
- [x] Add sample pre-fill preset 3: **Irregular / Odd Shaped Plot (Trapezoid Geometry)**
- [x] Add sample pre-fill preset 4: **Road Widening Site (10' Strip Widening under RMP-2015)**
- [x] Add sample pre-fill preset 5: **Full 2-Page Consolidated BBMP Submission Package (Page 1 Layout + Page 2 Legend Sheet)**
