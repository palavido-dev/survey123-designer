# Survey123 Designer

A standalone, web-based WYSIWYG form designer for building ArcGIS Survey123 XLSForm surveys. Drag-and-drop question types onto a live canvas, configure properties visually, and export a ready-to-publish `.xlsx` file — no XLSForm syntax knowledge required.

![Survey123 Designer](docs/screenshots/hero.png)

## Why This Exists

ArcGIS Survey123 is powerful, but authoring surveys still means wrestling with XLSForm spreadsheets or using Esri's hosted designer (which requires an ArcGIS Online/Enterprise account). This project provides a **free, offline-capable** alternative that runs entirely in the browser.

Key pain points it solves:

- **No spreadsheet editing** — visual drag-and-drop instead of typing into Excel rows
- **Expression building** — guided wizard and field picker for `relevant`, `constraint`, and `calculation` expressions instead of hand-writing XPath
- **Platform awareness** — toggle between Field App and Web App to see only the question types each platform supports
- **Instant preview** — see how questions will look as you build, with live property editing

## Features

### Drag-and-Drop Form Builder
- 41 question types across 9 categories (text, numeric, selection, location, date/time, media, structure, hidden/calculated, metadata)
- Appearance variants as separate draggable cards (e.g., Multiline Text, Spinner, Signature, Likert Scale)
- Reorder questions by dragging within the canvas
- Group and repeat support with visual nesting

### Visual Expression Builder
- **Quick-start templates** — common patterns like "Show when equals", "Required if not empty", "Sum two fields" pre-built per expression type
- **Guided wizard flow** — step-by-step field selection and value input with live preview
- **Field picker** — browse all form fields with type badges, click to insert `${field}` references
- **Operator palette** — comparison, logical, arithmetic operators and common values
- **Function library** — categorized XLSForm functions (math, text, date, select, utility) with descriptions
- **Choice-aware values** — for select fields, pick from the actual choice list options
- **Syntax-highlighted preview** — color-coded tokens showing fields, operators, functions, strings, numbers

![Expression Builder](docs/screenshots/expression-builder.png)

### Platform Filter
Toggle between **All**, **Field App**, and **Web App** to filter the question palette. Web App mode hides field-only types (barcode, geotrace, audio recording, file upload, etc.) so you only see what your target platform supports.

![Platform Filter](docs/screenshots/platform-filter.png)

### Full Property Editor
- **Basic** — name, label, hint, guidance hint, choice list selection
- **Validation** — required toggle, required message, constraint expression, constraint message
- **Logic** — relevant (visibility) expression, calculation, default value, choice filter, read-only toggle
- **Appearance** — type-appropriate appearance options from the Survey123 spec
- **Parameters** — free-form parameters (max-pixels, codec, etc.)
- **Media** — image and audio attachment fields
- **Body (Esri)** — input masks, file type accept, visibility, style
- **Bind (Esri)** — field type, field length, field alias, bind parameters, workflow, warnings

### Choice List Editor
- Create and manage choice lists for select_one, select_multiple, and rank questions
- Add/remove/reorder choices with inline editing
- Choice lists are shared across questions via list_name references

### XLSX Export
- Exports a spec-compliant `.xlsx` file with `survey`, `choices`, and `settings` sheets
- Properly handles `type` column values (e.g., `select_one list_name`, `begin group`)
- Includes all Esri extension columns when populated

### Other
- Undo/Redo with keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z)
- New form / Open existing XLSX import
- Form-level settings (title, form ID, version, style, default language)
- Duplicate and delete questions from the canvas

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| State | Zustand (with temporal undo/redo) |
| Drag & Drop | @dnd-kit (core + sortable) |
| XLSX | SheetJS |
| Icons | Lucide React |

## Getting Started

### Prerequisites
- Node.js 18+ and npm

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

Output goes to `dist/` — deploy to any static hosting (GitHub Pages, Netlify, Vercel, S3, etc.).

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
    xlsxExport.ts                  # XLSX file generation
  components/
    sidebar/QuestionPalette.tsx    # Draggable question cards + platform filter
    canvas/
      FormCanvas.tsx               # Drop zone + sortable list
      SortableQuestionRow.tsx      # Individual question row (drag handle, actions)
      QuestionPreview.tsx          # Live preview rendering per question type
    properties/
      PropertiesPanel.tsx          # Right panel shell (tabs: Properties | Settings)
      QuestionProperties.tsx       # Dynamic property editor
      ExpressionBuilder.tsx        # Visual expression builder with wizard
      ChoiceListEditor.tsx         # Choice list management
      FormSettingsEditor.tsx       # Form-level settings
    toolbar/Toolbar.tsx            # Top bar (New, Open, Export, Undo, Redo)
```

## Supported Question Types

| Category | Types |
|----------|-------|
| Text Input | Text, Multiline Text, Email, Password* |
| Numeric | Integer, Spinner*, Calculator*, Decimal, Range/Slider* |
| Selection | Select One, Dropdown, Autocomplete, Likert Scale, Select Multiple, Rank*, Select from CSV* |
| Location | Geopoint, Geotrace*, Geoshape* |
| Date & Time | Date, Year Only*, Month-Year*, Time, Date & Time |
| Media & Files | Photo, Signature, Draw*, Annotate*, Audio*, File Upload*, Barcode/QR* |
| Structure | Note, Group, Repeat |
| Hidden & Calculated | Calculate, Hidden |
| Metadata | Start Time, End Time, Username, Device ID* |

*\* = Field App only (not available in Web App)*

## Roadmap

- [ ] Survey123 Connect XLSX round-trip (import, edit, export without data loss)
- [ ] Multi-language support (translation columns)
- [ ] Cascading select wizard
- [ ] Form theme / styling options
- [ ] Publish directly to ArcGIS Online (OAuth integration)
- [ ] Collaborative editing
- [ ] Form validation / lint warnings

## License

MIT
