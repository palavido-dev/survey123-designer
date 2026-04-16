# Survey123 Designer

A standalone, web-based WYSIWYG form designer for building ArcGIS Survey123 XLSForm surveys. Drag-and-drop question types onto a live canvas, configure properties visually, and export a ready-to-publish `.xlsx` file — no XLSForm syntax knowledge required.

**[Try it live](https://palavido-dev.github.io/survey123-designer/)** — runs entirely in the browser, no install needed.

<!-- Screenshots: see docs/screenshots/ once captured -->

## Why This Exists

ArcGIS Survey123 is powerful, but authoring surveys still means wrestling with XLSForm spreadsheets or using Esri's hosted designer (which requires an ArcGIS Online/Enterprise account). This project provides a free, offline-capable alternative that runs entirely in the browser.

It solves a few key pain points: visual drag-and-drop instead of typing into Excel rows, a guided expression builder instead of hand-writing XPath, platform-aware question filtering (Field App vs. Web App), and instant preview of how questions will look as you build.

## Features at a Glance

### Drag-and-Drop Form Builder

41 question types across 9 categories — text, numeric, selection, location, date/time, media, structure, hidden/calculated, and metadata. Appearance variants show up as separate draggable cards (Multiline Text, Spinner, Signature, Likert Scale, etc.), so you always know what you're getting. Reorder questions by dragging within the canvas, and nest them inside groups and repeats.

### Visual Expression Builder

Build `relevant`, `constraint`, and `calculation` expressions without memorizing XPath syntax. The expression builder provides a field picker (browse all form fields with type badges, click to insert `${field}` references), an operator palette (comparison, logical, arithmetic, and common values), and a categorized function library covering selection, text, math, date, and logic functions — each with a description of what it does.

### Platform Filter

Toggle between **All**, **Field App**, and **Web App** in the sidebar to filter the question palette. Web App mode hides field-only types (barcode, geotrace, audio recording, file upload, etc.) so you only see what your target platform actually supports.

### Full Property Editor

Every XLSForm column is supported through collapsible sections in the right-side properties panel: Basic (name, label, hint, guidance hint, choice list), Validation (required, constraint), Logic (relevant, calculation, default, choice filter, read-only), Appearance, Parameters, Media, Body (Esri extensions like input masks and styles), and Bind (Esri field type, length, alias, and workflow settings).

### CSV File Support

For `select_one_from_file` and `select_multiple_from_file` questions, upload CSV files directly in the designer. A built-in CSV editor lets you modify data inline — edit cells, add or remove rows and columns, rename headers, search across all columns, and sort by clicking column headers. CSV badge indicators on question cards give quick access to the editor.

### Media Panel

A dedicated Media tab in the properties panel shows all file and CSV references across your form at a glance, with upload status indicators (green checkmark for uploaded, amber warning for missing). Click any uploaded file to open it in the CSV editor.

### Question Search

A persistent search bar at the top of the form canvas lets you find questions by name, label, or type. Results show a match count with previous/next navigation, and the canvas auto-scrolls to each match. Ctrl+F focuses the search bar from anywhere.

### Choice List Editor

Create and manage choice lists for select_one, select_multiple, and rank questions. Add, remove, and reorder choices with inline editing. Choice lists are shared across questions via `list_name` references, just like in XLSForm.

### XLSX Import & Export

Open any existing Survey123 `.xlsx` form to continue editing, or start from scratch. Export produces a spec-compliant `.xlsx` file with `survey`, `choices`, and `settings` sheets, including all Esri extension columns when populated.

### Other

Undo/Redo with keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z), inline label editing (double-click any question label on the canvas), question type and field name indicators on each card, collapsible groups, and form-level settings (title, form ID, version, style, default language).

## Getting Started

### Prerequisites

Node.js 18+ and npm.

### Install & Run

```bash
git clone https://github.com/palavido-dev/survey123-designer.git
cd survey123-designer
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

Output goes to `dist/`. Deploy to any static hosting (GitHub Pages, Netlify, Vercel, S3, etc.).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| State | Zustand (with temporal undo/redo) |
| Drag & Drop | @dnd-kit (core + sortable) |
| Rich Text | TipTap |
| XLSX | SheetJS |
| Icons | Lucide React |

## Project Structure

```
src/
  App.tsx                          # Root layout (3-column: palette | canvas | properties)
  main.tsx                         # Entry point
  types/survey.ts                  # Full XLSForm type definitions
  data/questionTypes.ts            # Question catalog, appearances, row factory
  store/surveyStore.ts             # Zustand store with undo/redo
  utils/
    icons.tsx                      # Lucide icon resolver
    xlsxExport.ts                  # XLSX file generation + import parsing
    validation.ts                  # Row & expression validation
  components/
    sidebar/QuestionPalette.tsx    # Draggable question cards + platform filter
    canvas/
      FormCanvas.tsx               # Drop zone, sortable list, sticky search
      SortableQuestionRow.tsx      # Question row with live preview + inline editing
    properties/
      PropertiesPanel.tsx          # Right panel shell (tabs: Properties | Media | Settings)
      QuestionProperties.tsx       # Dynamic property editor
      ExpressionBuilder.tsx        # Visual expression builder with wizard + functions
      ChoiceListEditor.tsx         # Choice list management
      CsvFilePicker.tsx            # CSV upload with delimiter auto-detection
      CsvEditorModal.tsx           # Spreadsheet-style CSV editor
      MediaPanel.tsx               # Media references overview + upload status
      FormSettingsEditor.tsx       # Form-level settings
      RichTextEditor.tsx           # TipTap rich text for note fields
      ParameterBuilder.tsx         # Key-value parameter editor
    toolbar/Toolbar.tsx            # Top bar (New, Open, Export, Undo, Redo)
```

## Supported Question Types

| Category | Types |
|----------|-------|
| Structure | Note, Group, Compact Group, Field List, Table List, Repeat, Compact Repeat, Field List Repeat |
| Text Input | Text, Multiline Text, Geocode, Predictive Text, No Predictive, Email, Password |
| Numeric | Integer, Spinner, Calculator, Decimal, Distress Scale, Range/Slider |
| Selection | Autocomplete, Compact Select, CSV Autocomplete, Dropdown, Likert Scale, Rank, Select Multiple, Select Multiple (CSV), Select One, Select One (CSV) |
| Location | Geopoint, Geotrace*, Geoshape* |
| Date & Time | Date, Year Only*, Month-Year*, Time, Date & Time |
| Media & Files | Photo, Signature, Draw*, Annotate*, Audio*, File Upload*, Barcode/QR* |
| Hidden & Calculated | Calculate, Hidden |
| Metadata | Start Time, End Time, Username, Device ID* |

*\* = Field App only (hidden in Web App mode)*

## Roadmap

- [ ] Survey123 Connect XLSX round-trip (import → edit → export without data loss)
- [ ] Multi-language support (translation columns)
- [ ] Cascading select wizard
- [ ] Form theme / styling options
- [ ] Publish directly to ArcGIS Online (OAuth integration)
- [ ] Collaborative editing
- [ ] Full XLSX + media zip export

## License

MIT
