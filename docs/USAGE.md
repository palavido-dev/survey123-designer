# Survey123 Designer — Usage Guide

This guide walks through every feature of the Survey123 Designer. The app runs entirely in the browser at [palavido-dev.github.io/survey123-designer](https://palavido-dev.github.io/survey123-designer/).

## Layout

The interface is a three-column layout:

- **Left sidebar** — question palette with draggable question type cards, organized by category. Includes a search bar and platform filter toggle (All / Field App / Web App).
- **Center canvas** — the live form preview. Shows how questions will render, with inline editing support. A sticky search bar at the top lets you find questions by name, label, or type.
- **Right panel** — tabbed properties panel. Switches between Properties (per-question settings), Choices (for select types), Media (file references overview), and Settings (form-level config).

## Building a Form

### Adding Questions

Drag a question type card from the left sidebar and drop it onto the canvas. Questions appear in the order you drop them. You can reorder by dragging within the canvas.

Each question card on the canvas shows:

- A subtle type and field name indicator at the top (e.g., *Text · incident_name*)
- The question label (double-click to edit inline)
- The hint text (if set)
- A live preview of the input widget (text field, radio buttons, date picker, etc.)
- Logic badges for Visibility, Calculated, and Constraint expressions
- For CSV-backed questions, a CSV file badge showing the attached file

### Question Types

There are 41 question types across 9 categories. Some types are appearance variants — for example, "Spinner" is an integer question with `spinner` appearance, "Signature" is an image question with `signature` appearance. These are listed as separate cards in the palette so you don't need to memorize appearance strings.

Use the **platform filter** at the top of the sidebar to show only question types supported by your target platform. Web App mode hides barcode, geotrace, audio, file upload, and other field-only types.

### Groups and Repeats

Drag a "Group" or "Repeat" card to create a container. Questions nested inside are visually indented. Click the collapse arrow to collapse a group and see a count of contained questions. The matching "End Group" / "End Repeat" marker is automatically created.

Group variants include Compact Group, Field List, Table List, Compact Repeat, and Field List Repeat — these set the appropriate `appearance` value on the begin row.

### Inline Label Editing

Double-click any question label on the canvas to edit it directly. For Note-type questions, double-clicking opens a rich text editor (TipTap) with bold, italic, underline, links, headings, and bullet list support.

## Properties Panel

Click any question on the canvas to open its properties in the right panel. Properties are organized into collapsible sections:

### Basic

- **Name (field ID)** — the XLSForm column name. Auto-validated for illegal characters, duplicates, and reserved words. A "Fix" button appears for auto-correctable issues.
- **Label** — the question text shown to users. Supports HTML via the rich text editor for note fields.
- **Hint** — secondary help text displayed below the label.
- **Guidance Hint** — expandable guidance text (tap-to-reveal in Survey123).
- **Choice List** — dropdown to select which choice list this select question uses.

### Validation

- **Required** — toggle to make the question mandatory.
- **Required Message** — custom message shown when a required field is skipped.
- **Constraint** — XPath expression that submitted values must satisfy. Opens the expression builder.
- **Constraint Message** — custom message shown when the constraint fails.

### Logic

- **Relevant** — visibility condition. When the expression evaluates to false, the question is hidden. Opens the expression builder.
- **Calculation** — auto-computed value. Opens the expression builder.
- **Default** — default value for the field.
- **Choice Filter** — filter expression for cascading selects.
- **Read Only** — toggle to prevent user input.

### Appearance

Shows a dropdown of valid appearance options for the current question type. Options are filtered based on the XLSForm spec (e.g., `multiline` only appears for text questions, `spinner` only for integers).

### Parameters

Key-value pairs for Survey123 parameters like `max-pixels`, `codec`, `allowText`, etc.

### Media

Image and audio attachment fields (for the `media::image` and `media::audio` XLSForm columns).

### Body (Esri)

Esri-specific extensions: input mask, file type accept filter, visibility, and style.

### Bind (Esri)

Esri-specific bind settings: field type, field length, field alias, bind parameters, workflow, and warnings.

## Expression Builder

The expression builder opens when you click any of the logic badges (Visibility, Calculated, Constraint) on a question card, or from the Logic section in the properties panel.

### Writing Expressions

The left side is a text editor where you type or build your expression. The right side provides three tabs of helpers:

**Fields** — lists every field in your form with its type badge. Click a field name to insert `${field_name}` at the cursor position. Includes a search bar to filter fields.

**Operators** — common comparison operators (`=`, `!=`, `>`, `<`, `>=`, `<=`), logical operators (`and`, `or`, `not`), arithmetic operators (`+`, `-`, `*`, `div`, `mod`), and common values (`''`, `0`, `1`, `true()`, `false()`, `today()`, `now()`).

**Functions** — categorized XLSForm functions with descriptions:

- **Selection** — `selected()`, `count-selected()`, `selected-at()`
- **Text** — `concat()`, `string-length()`, `substr()`, `contains()`, `regex()`
- **Math** — `round()`, `int()`, `number()`, `sum()`, `min()`, `max()`
- **Date** — `today()`, `now()`, `date()`, `format-date()`
- **Logic** — `if()`, `coalesce()`, `once()`, `position()`

Click any function to insert it at the cursor.

## CSV File Support

### Uploading CSVs

For `select_one_from_file` and `select_multiple_from_file` question types, use the CSV File Picker in the properties panel to upload a `.csv` file. The parser auto-detects delimiters (comma, tab, semicolon) and extracts column headers and sample data.

### CSV Editor

Click the green CSV badge on a question card (or click an uploaded file in the Media panel) to open the full CSV editor modal. Features include:

- **Inline cell editing** — click any cell to edit its value
- **Add/remove rows** — buttons to append rows or delete selected ones
- **Add/remove columns** — add columns with custom names or remove existing ones
- **Rename headers** — double-click a column header to rename it
- **Search** — filter across all columns to find specific values
- **Sort** — click column headers to cycle through ascending → descending → no sort
- **Keyboard navigation** — Tab moves to the next cell, Enter moves down, Shift+Tab moves back
- **Alternating row shading** — Excel-style visual zebra striping
- **Replace CSV** — upload a new CSV to replace the current one

Edits are saved back to the form state and the raw CSV content is preserved for export.

## Media Panel

The Media tab in the right panel shows a central overview of all file references in your form:

- Lists every CSV file referenced by `select_*_from_file` questions and `pulldata()` calls in expressions
- Shows upload status: green checkmark for uploaded files, amber warning for missing files
- Displays column previews and which questions reference each file
- Click an uploaded file to open it in the CSV editor
- Upload button on missing files to attach them

## Question Search

The sticky search bar at the top of the canvas searches across question names, labels, and types. As you type:

- Match count and current position are shown (e.g., "3 of 11")
- The canvas auto-scrolls to the matched question and selects it
- Use Enter / Shift+Enter or the arrow buttons to navigate between matches
- Ctrl+F focuses the search bar from anywhere
- Escape clears the search

## XLSX Import & Export

### Opening an Existing Form

Click **Open** in the toolbar and select a `.xlsx` file. The importer reads the `survey`, `choices`, and `settings` sheets and reconstructs the full form in the designer. Supports all standard XLSForm columns plus Esri extensions.

### Exporting

Click **Export XLSX** to download a spec-compliant `.xlsx` file. The export includes:

- `survey` sheet with all XLSForm columns (type, name, label, hint, relevant, constraint, calculation, appearance, parameters, etc.) plus Esri extensions (bind columns, body columns)
- `choices` sheet with list_name, name, and label columns
- `settings` sheet with form_title, form_id, version, style, and default_language

The `type` column correctly formats composite values like `select_one list_name` and `begin group`.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Ctrl+F | Focus search bar |
| Escape | Clear search / close modal |
| Double-click label | Inline edit |
| Tab (in CSV editor) | Next cell |
| Enter (in CSV editor) | Move down |
| Enter (in search) | Next match |
| Shift+Enter (in search) | Previous match |

## Form Settings

Click the gear icon tab in the right panel to access form-level settings:

- **Form Title** — the title shown in the form header
- **Form ID** — unique identifier for the form
- **Version** — form version string
- **Style** — form style (pages, theme-grid, etc.)
- **Default Language** — the default language column
