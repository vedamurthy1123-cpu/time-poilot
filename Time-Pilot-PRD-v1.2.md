# Time-Pilot – Product Requirements Document (PRD)

**Version:** 1.2  
**Date:** May 31, 2026  
**Type:** Frontend-Only Web Application  
**Target Users:** Teachers, School Administrators, College Faculty

---

## 1. Executive Summary

Time-Pilot is a frontend-only, AI-powered timetable generation and editing platform for schools and colleges. It enables teachers to generate optimized timetables through a conversational AI interface, edit them with drag-and-drop or natural language commands, dynamically adjust timings, share via link, and export as PDF—all without any backend server or database.

---

## 2. Project Vision

To act as an intelligent timetable assistant that allows teachers to **create, modify, optimize, share, and export timetables** through both manual interaction and AI-powered commands, within a simple, responsive, and visually comfortable frontend application.

---

## 3. Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend Framework** | React.js |
| **Core Language** | JavaScript (ES6+) |
| **Markup & Styling** | HTML5, CSS3, Tailwind CSS |
| **AI Integration** | Google Gemini API |
| **PDF Export** | jsPDF + jspdf-autotable |
| **State Management** | React Context / useReducer (Browser Memory) |
| **Optional Persistence** | Local Storage |
| **Dark Mode** | Tailwind dark mode (class-based) + Local Storage preference |
| **Share via Link** | URL Hash Encoding + Clipboard API |
| **URL Compression** | LZ-String (≈4KB, client-side) |
| **Toast Notifications** | Custom lightweight component (no external lib required) |
| **Backend** | None |
| **Database** | None |

> ⚠️ **API Key Note:** The Gemini API key will be embedded in the client-side bundle. For production deployments, use a build-time environment variable (`VITE_GEMINI_API_KEY` or equivalent) and restrict key usage via Google Cloud Console (HTTP referrer restrictions). Do not commit keys to version control.

---

## 4. User Flow & Pages

### 4.1 Page 1 – Landing Page

**Purpose:** Welcome screen and entry point.

**Elements:**
- Large timetable-related illustration (calendar/scheduling graphic)
- Project logo: **TIME-PILOT**
- Tagline: *"Generate. Optimize. Edit."*
- Subtitle: *"Your AI Timetable Assistant."*
- Description: *"Create smart school and college timetables using AI-powered scheduling and editing."*
- Dark mode toggle icon (sun/moon) in top-right corner
- Primary CTA: **[ Get Started ]** button

**Dark Mode Behavior:**
- Toggle switches between light and dark themes instantly
- Preference saved to Local Storage
- Applies to all pages consistently

**Action:** Clicking "Get Started" navigates to Page 2 (AI Chat Interface).

---

### 4.2 Page 2 – AI Chat Interface

**Purpose:** Collect timetable requirements from the user in a conversational format.

**Header:** "TIME-PILOT AI Assistant" with robot icon.

**Persistent Element:** Dark mode toggle in header/navbar across all pages.

**Welcome Message:**
> 👋 Welcome Teacher! Please provide:
> - Subjects & Teachers
> - Working Days
> - School Timing
> - Break Timing
> - Class Duration

**Chat Area:**
- Scrollable message list (user messages + AI responses)
- Input field at bottom with placeholder text
- **[ Generate ]** button

**Example User Input:**
```
Subjects:
Maths - Ravi
Physics - Sneha
English - John

School Timing: 9 AM - 4 PM
Working Days: Monday - Friday
Lunch: 1 PM - 2 PM
Class Duration: 50 Minutes
```

**Dark Mode Adaptations:**
- Chat bubbles adjust contrast
- Input field background adapts
- Text remains readable in both modes

#### 4.2.1 Input Validation (New)

Before calling the Gemini API, validate the user's message for minimum required fields:

| Required Field | Validation Rule |
|----------------|-----------------|
| At least 1 subject | Must be present |
| School start time | Must be a valid time |
| School end time | Must be after start time |
| Working days | At least 1 day specified |
| Class duration | Must be a positive integer (minutes) |

**If validation fails:**
- Do not call the API
- Show an inline chat message listing the missing fields:
  > ⚠️ Looks like some details are missing. Please also include: **Break Timing**, **School End Time**.

**If the AI returns an unparseable or incomplete response:**
- Show a friendly retry prompt:
  > 🤖 I had trouble understanding that. Could you re-enter the details a little more clearly?

#### 4.2.2 Loading State During Generation

- Show a typing indicator (animated dots) in the chat while waiting for the AI response
- Show a progress message: *"⏳ Generating your timetable..."*
- Disable the Generate button during processing to prevent duplicate requests
- If the API call takes longer than 10 seconds, show: *"Taking longer than usual… please wait."*

#### 4.2.3 API Error Handling

| Error Type | Message Shown to User |
|------------|-----------------------|
| Network failure | ❌ "No internet connection. Please check your network and try again." |
| Invalid API key | ❌ "AI service unavailable. Please check your API configuration." |
| Rate limit exceeded | ⏳ "Too many requests. Please wait a moment and try again." |
| Unexpected/parse error | ❌ "Something went wrong. Try re-entering your timetable details." |

**Action:** On clicking "Generate" with valid input, the input is processed through the AI pipeline and a timetable is created.

---

### 4.3 Page 3 – Generated Timetable Screen

**Purpose:** Display the generated timetable in an editable, responsive grid.

**Table Structure:**
| Time | Mon | Tue | Wed | Thu | Fri |
|------|-----|-----|-----|-----|-----|
| 9:00–9:50 | Maths | Physics | English | Maths | Physics |
| 9:50–10:40 | English | Maths | Physics | English | Maths |
| ... | ... | ... | ... | ... | ... |
| 🍽️ Lunch | — | — | — | — | — |
| 2:00–2:50 | Physics | English | Maths | Physics | English |

> **Note:** Lunch/break rows are displayed as full-width merged rows with a distinct background. They are non-editable and visually differentiated.

**Page Layout (Top to Bottom):**
1. **Navbar** — Logo, dark mode toggle, Share button
2. **School Name Field** — Editable text input: *"Enter School / College Name"* (used in PDF header)
3. **Dynamic Time Controls** (see Section 7.3)
4. **Timetable Grid** (drag-and-drop enabled)
5. **AI Editing Bar** (see Section 8.1)
6. **Validation Feedback Area**
7. **Action Buttons:** `[ Download PDF ]` `[ Share via Link ]` `[ Continue Editing ]` `[ Regenerate ]`

**Features on this page:**
- Drag-and-drop editing (desktop)
- Touch-and-hold editing (mobile)
- Dynamic time editing controls
- AI prompt-based editing bar
- Undo / Redo controls
- Validation feedback area
- Dark mode toggle

---

## 5. AI Processing Layer

### 5.1 Step 1 – Gemini API Understanding
- Parses natural language input from chat
- Converts unstructured text into structured JSON:
  - Subjects array with teacher mapping
  - School start/end times
  - Working days array
  - Break timing
  - Class duration

### 5.2 Step 2 – Default Rule Engine
- **Check:** Did the user explicitly assign periods per subject?
- **If NO:** Automatically assign periods based on heuristics:
  - Example: Maths → 5 periods, Physics → 4, English → 3
- Output: Period distribution map.

### 5.3 Step 3 – Gemini Recommendation Engine
- Analyzes:
  - Subject priority/weight
  - Available time slots
  - School timing constraints
  - Working days
- Suggests optimized subject distribution (e.g., avoid consecutive same subject, balance across days).

### 5.4 Step 4 – Final Schedule Input
- Merged structured data passed to the Timetable Generation Engine.

---

## 6. Timetable Generation Engine

### 6.1 Algorithm
**Balanced Greedy Scheduling Algorithm**

Responsibilities:
- Create time slots based on school timing + class duration
- Distribute subjects across days/periods
- Balance subject frequency per day
- Avoid back-to-back repetition of same subject
- Respect break timing (no classes during lunch)
- Fill any gap between the last pre-break period and the break start with a short buffer slot (labeled "Free") if the gap is less than one full class duration

### 6.2 Slot Creation Logic
**Input:** Start time, end time, class duration, break window.  
**Output:** Array of period objects with labels and time ranges.

**Gap Handling Rule:** If the time between the last full period and break start is less than the class duration (e.g., 40 minutes when duration is 50 minutes), that gap is marked as a **"Free / Buffer"** slot — not assigned a subject but displayed in the grid.

Example (9 AM – 4 PM, 50-min classes, Lunch 1:00–2:00 PM):
```
P1: 9:00  – 9:50
P2: 9:50  – 10:40
P3: 10:40 – 11:30
P4: 11:30 – 12:20
[Buffer: 12:20 – 1:00] ← Free/Buffer (40 min gap, < 50 min class)
Lunch: 1:00 – 2:00
P5: 2:00  – 2:50
P6: 2:50  – 3:40
[Buffer: 3:40 – 4:00] ← Free/Buffer (20 min gap before end)
```

---

## 7. Smart Editing Features

### 7.1 Drag & Drop Editing (Desktop)
- Users can drag a subject cell and drop it onto another period slot.
- Swaps the two subjects.
- Visual feedback during drag (highlight, shadow, opacity change).
- Works in both light and dark modes.

### 7.2 Mobile Touch Editing
- Touch and hold a cell to initiate drag.
- Drag to target cell and release to swap.
- Fully touch-responsive with haptic-style visual feedback.

### 7.3 Dynamic Time Editing
Located in a collapsible panel **above the timetable grid** on Page 3, labeled **"⚙️ Adjust Timing"**.

Controls:
- School start time (time picker)
- School end time (time picker)
- Break start time (time picker)
- Break end time (time picker)
- Class duration (number input, in minutes)

**Behavior:** All period timings recalculate automatically on change. Subject assignments persist where possible; conflicts trigger the validation engine.

### 7.4 Undo / Redo (New)

**Purpose:** Allow users to reverse or reapply any manual or AI-driven edit.

**UI:** Two icon buttons in the timetable toolbar:
- ↩ Undo (Ctrl+Z / Cmd+Z)
- ↪ Redo (Ctrl+Y / Cmd+Y)

**Implementation:**
- Maintain an edit history stack in React state (max depth: 30 actions)
- Each action (drag-and-drop, AI edit, dynamic time change) pushes the previous state onto the undo stack
- Undo pops the undo stack and pushes onto the redo stack
- Any new manual edit clears the redo stack
- Buttons are disabled when their respective stacks are empty

---

## 8. AI Prompt-Based Editing

### 8.1 Interface
Located below the timetable grid:
```
Ask Time-Pilot AI: [_______________________] [ Apply ]
```

### 8.2 Supported Commands
| Command Example | Action |
|-----------------|--------|
| "Move Maths to Tuesday morning" | Relocate subject |
| "Swap Physics and English" | Exchange two subjects |
| "Give Ravi Sir a free period after lunch" | Adjust teacher schedule |
| "Avoid consecutive Maths classes" | Redistribute to prevent clustering |
| "Move all science subjects before lunch" | Bulk subject relocation |

### 8.3 Gemini AI Editor Logic
- Gemini interprets the natural language instruction.
- Outputs a structured action JSON:

```json
{
  "action": "swap",
  "subject1": "Physics",
  "subject2": "English"
}
```

**Supported action types:** `swap`, `move`, `redistribute`, `free_period`, `bulk_move`

- JavaScript engine applies the action to the timetable state.
- The action is pushed to the undo history stack before applying.

### 8.4 AI Edit Error Handling
If Gemini cannot interpret the command or returns an invalid action:
> 🤖 "I couldn't understand that instruction. Try something like: 'Swap Physics and English' or 'Move Maths to Friday.'"

---

## 9. Validation Engine

**Runs before every change (manual or AI-driven):**

| Rule | Description |
|------|-------------|
| **Teacher Clash** | Same teacher cannot be assigned to two simultaneous periods. |
| **Duplicate Assignment** | One slot cannot contain multiple subjects. |
| **Break Conflict** | Classes cannot overlap lunch/break timing. |
| **Time Validation** | Class must fit within school operating hours. |

### 9.1 Validation Response Behavior (Clarified)

| Outcome | Behavior |
|---------|----------|
| **Validation passes** | Change is applied immediately |
| **Validation fails** | Change is **blocked and rolled back**; the timetable remains unchanged |
| **Error display** | Red inline message shown in the Validation Feedback Area below the grid |

**Example error message:**
> ❌ Cannot move Physics here. Teacher Sneha is already assigned during that period on Tuesday.

### 9.2 Smart Error Messages
Errors are contextual and actionable. They specify the subject, teacher, and the conflicting slot where possible.

---

## 10. Real-Time Update System

- Every edit (manual, dynamic, or AI) instantly updates:
  - Timetable grid
  - Period timings
  - Subject distribution summary
  - Teacher allocation view
- No page refresh required.
- State managed entirely in browser memory.
- Updates also reflected in shared link data when "Share" is triggered.

---

## 11. Dark Mode Feature

### 11.1 Toggle Mechanism
- **Location:** Persistent icon button in top-right corner of all pages
- **Icon States:**
  - ☀️ Sun icon = currently light mode (click to switch to dark)
  - 🌙 Moon icon = currently dark mode (click to switch to light)
- **Behavior:** Instant theme switch using Tailwind `dark:` classes

### 11.2 Persistence
- User preference saved to `localStorage` key: `timepilot-theme`
- On app load, reads preference and applies accordingly
- Default: Respects system `prefers-color-scheme` if no saved preference

### 11.3 Design Tokens

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Page Background | `#f8fafc` (slate-50) | `#0f172a` (slate-900) |
| Card Background | `white` | `#1e293b` (slate-800) |
| Primary Text | `#1e293b` (slate-800) | `#f1f5f9` (slate-100) |
| Secondary Text | `#64748b` (slate-500) | `#94a3b8` (slate-400) |
| Table Borders | `#e2e8f0` (slate-200) | `#334155` (slate-700) |
| Table Cell BG | `white` | `#1e293b` (slate-800) |
| Chat AI Bubble | `#f1f5f9` (slate-100) | `#334155` (slate-700) |
| Input Fields | `white` | `#334155` (slate-700) |
| Accent Color | `#4f46e5` (indigo-600) | `#818cf8` (indigo-400) |
| Break Row BG | `#fef9c3` (yellow-100) | `#422006` (yellow-950) |
| Buffer Row BG | `#f1f5f9` (slate-100) | `#1e293b` (slate-800) |

### 11.4 Accessibility
- All contrast ratios meet WCAG AA standards in both modes
- Focus rings visible in both themes
- Transition duration: 200ms for smooth color changes

---

## 12. Share via Link Feature

### 12.1 Overview
Users can generate a shareable URL that encodes the complete timetable state, allowing recipients to view (and optionally edit) the same timetable without any backend.

### 12.2 Sharing Mechanism

**Encoding Method:** URL Hash + LZ-String Compression + Base64

**Process:**
1. Serialize timetable state to JSON:
   ```json
   {
     "subjects": [...],
     "teachers": [...],
     "schedule": [[...], ...],
     "timings": {...},
     "days": [...],
     "v": 1
   }
   ```
2. Compress JSON string using LZ-String (`LZString.compressToEncodedURIComponent`)
3. Append as URL hash fragment

**Example URL:**
```
https://timepilot.app/#timetable=N4IgzgLgTghgFzGEA...
```

### 12.3 UI Components

**Share Button:**
- Location: Page 3 toolbar and Final Review Screen
- Icon: 🔗 share icon
- Label: "Share Timetable"

**Click Behavior:**
1. Generates encoded URL
2. Copies to clipboard using Clipboard API
3. Shows toast notification:
   > ✅ Link copied! Share this URL to let others view your timetable.

**Fallback:**
- If Clipboard API unavailable, display URL in a modal with a manual "Select All & Copy" button

### 12.4 Loading Shared Timetable

**On App Load:**
1. Check URL for `#timetable=` hash fragment
2. If present:
   - Decompress using `LZString.decompressFromEncodedURIComponent`
   - Parse JSON
   - Validate structure (version check — see 12.4.1)
   - Load timetable into application state
   - Navigate directly to Page 3 (Timetable Screen)
3. Display banner: *"📋 Viewing shared timetable. Edits are local to your browser."*

#### 12.4.1 Version Mismatch Handling (New)

| Scenario | Behavior |
|----------|----------|
| `v` field matches current schema version | Load normally |
| `v` field is older but compatible | Load with a warning: *"⚠️ This timetable was created with an older version of Time-Pilot. Some features may not work as expected."* |
| `v` field is missing or unrecognized | Block load. Show: *"❌ This link is invalid or from an incompatible version. Please ask the sender for a new link."* |
| URL hash is malformed/undecodable | Block load. Show: *"❌ Could not read this link. It may be corrupted or incomplete."* |

### 12.5 Shared Timetable Permissions

| Action | Allowed? |
|--------|----------|
| View timetable | ✅ Yes |
| Drag-and-drop edit | ✅ Yes |
| AI prompt editing | ✅ Yes |
| Dynamic time editing | ✅ Yes |
| Download PDF | ✅ Yes |
| Regenerate with AI | ✅ Yes |
| Share again | ✅ Yes |
| Save to original creator | ❌ No (local only) |

**Note:** Edits made on a shared timetable are local to the viewer's browser and do not sync back to the original.

### 12.6 URL Size Considerations
- Safe URL length for all major modern browsers: up to ~8,000 characters
- Typical timetable encodes to ~500–800 characters (well within limits)
- Large or complex timetables (many subjects, many days) may approach ~3,000–4,000 characters — still safe
- If encoded URL exceeds 7,500 characters, display a warning:
  > ⚠️ This timetable is very large. The link was generated but may not open on some older browsers.

### 12.7 Technical Dependencies
- **LZ-String** for compression (`LZString.compressToEncodedURIComponent` / `decompressFromEncodedURIComponent`)
- **Clipboard API** for copy functionality (with `document.execCommand` fallback)
- **URL Hash** routing handled by React state on mount

---

## 13. Final Review Screen

After editing is complete, display:
```
✅ Timetable Ready

[ Download PDF ]
[ Share via Link ]
[ Continue Editing ]
[ Regenerate Timetable ]
```

---

## 14. PDF Export Module

**Trigger:** Click "Download PDF"

**Generated PDF Contents:**
- **Header:** School Name (taken from the editable field on Page 3; defaults to *"School Timetable"* if left blank)
- **Title:** "Timetable"
- **Table:** Full timetable grid with days, times, subjects, and teacher names
- **Break rows:** Clearly labeled (e.g., "🍽️ Lunch Break")
- **Footer:** "Generated Using Time-Pilot"

**Technical Implementation:**
- jsPDF for document creation
- jspdf-autotable for table rendering
- Styled to match on-screen appearance
- PDF always uses light/print-optimized colors regardless of current theme (white background forced for print)

---

## 15. Non-Functional Requirements

| Requirement | Detail |
|-------------|--------|
| **Performance** | Timetable generation < 3 seconds (including AI calls) |
| **Responsiveness** | Works on mobile (320px) to desktop (1440px+) |
| **Offline Capability** | Core scheduling works offline; AI features require internet |
| **Theme Persistence** | Dark/light preference saved across sessions |
| **Share Reliability** | URL encoding works cross-browser; graceful fallback for clipboard and version mismatches |
| **Accessibility** | Semantic HTML, ARIA labels, keyboard navigation, focus management |
| **Browser Support** | Chrome, Firefox, Safari, Edge (latest 2 versions) |
| **API Key Security** | API key stored as build-time env variable; never hardcoded in source |
| **Undo Depth** | Minimum 30 actions in history |
| **Error Recovery** | All AI failures show user-friendly messages with retry guidance |

---

## 16. Unique Features Checklist

- ✅ No backend required
- ✅ No database required
- ✅ AI-powered timetable generation (Gemini)
- ✅ Default rule-based period distribution
- ✅ Gemini smart recommendations
- ✅ Drag-and-drop editing (desktop)
- ✅ Mobile touch editing
- ✅ Dynamic time recalculation
- ✅ Natural language timetable editing
- ✅ Real-time validation with error messages and rollback
- ✅ PDF export with school name header
- ✅ Fully responsive design
- ✅ 100% frontend architecture
- ✅ Dark mode with persistence
- ✅ Share timetable via encoded link
- ✅ Clipboard copy with toast notification
- ✅ **Undo / Redo (30-step history)**
- ✅ **Input validation before AI call**
- ✅ **Loading and error states for all AI operations**
- ✅ **Gap/buffer slot handling in schedule generation**
- ✅ **Version-safe shared link loading**

---

## 17. Future Enhancements (Out of Scope v1)

| Feature | Priority |
|---------|----------|
| Local storage persistence for multiple saved timetables | Medium |
| Multiple timetable management (tabs) | Medium |
| Teacher-wise schedule view | Medium |
| Room/classroom allocation | Low |
| Share with edit permissions (peer-to-peer via WebRTC) | Low |
| Print-friendly view optimization | Low |
| Export to Excel/CSV | Low |
| Multi-language support | Low |

---

*Version 1.2 — Improvements over v1.1: Added LZ-String to tech stack, API key security note, Undo/Redo feature, input validation + error/loading states for AI calls, gap/buffer slot logic in schedule generation, School Name field placement, Dynamic Time Controls UI placement, validation rollback behavior, URL length correction, version mismatch handling for shared links, and updated design tokens for break/buffer rows.*
