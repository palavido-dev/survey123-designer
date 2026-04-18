# Roadmap

This is a personal project under active development. Features are prioritized based on what I need for my own work, but suggestions and contributions are welcome.

## Completed

- [x] **Drag-and-drop form builder** — 69 appearance-specific palette cards across 9 categories, covering every valid question type + appearance combination
- [x] **Visual expression builder** — field picker, operator palette, and categorized function library for `relevant`, `constraint`, and `calculation` expressions
- [x] **Full property editor** — all XLSForm columns plus Esri extensions (body, bind) through collapsible sections
- [x] **Platform filter** — toggle between All / Field App / Web App to filter question types by target platform
- [x] **CSV file support** — upload, edit (inline cells, add/remove rows/columns, search, sort), and reference CSVs for `select_*_from_file` questions and `pulldata()` expressions
- [x] **Media panel** — central overview of all file references (select_from_file and pulldata) with upload status indicators
- [x] **Question search** — search by name, label, or type with match navigation and auto-scroll (Ctrl+F)
- [x] **Choice list editor** — create and manage shared choice lists with inline editing
- [x] **XLSX import & export** — full round-trip with `survey`, `choices`, and `settings` sheets
- [x] **Survey123 Connect-style Excel output** — data validation dropdowns (type, appearance, required, readonly, bind columns), row shading for groups/repeats, styled header row, reference sheets with named ranges
- [x] **Inline label editing** — double-click question labels on the canvas; rich text editor for Notes
- [x] **Inline field name editing** — edit field names directly on the canvas with real-time validation and reserved keyword warnings
- [x] **Variable reference pills** — `${fieldname}` tokens render as teal pill badges in labels, with a field picker to insert variables in any question label or note
- [x] **Rename propagation** — renaming a field updates `${oldName}` references in labels, hints, and all expressions across the form
- [x] **Auto-save & recovery** — automatic IndexedDB persistence with recovery banner on page reload
- [x] **Report template builder** — create Survey123 Feature Report `.docx` templates with field token palette, rich text editor, syntax reference, and `.docx` import/export
- [x] **Undo / Redo** — full undo/redo stack with Ctrl+Z / Ctrl+Shift+Z keyboard shortcuts
- [x] **Groups and repeats** — collapsible group/repeat containers with drag-and-drop nesting support
- [x] **Visual grid layouts** — groups with `w1`-`w4` appearances render children in a CSS grid; `table-list` groups render as tables with choice column headers; `field-list` groups show page number badges
- [x] **Block-aware drag and move** — dragging a group moves the entire block (header, children, end marker); dropping onto a group header nests inside it
- [x] **Form-level settings** — title, form ID, version, style, and default language

## Up Next

- [ ] **Comprehensive form validation** — validate the entire form before export: duplicate names, missing labels, orphaned choice lists, broken expression references, circular dependencies. Visual error/warning indicators with a summary panel.
- [ ] **Full XLSX + media zip export** — bundle the `.xlsx` with all referenced CSV files into a `.zip` ready to drop into Survey123 Connect
- [ ] **Cascading select wizard** — guided setup for cascading/filtered selects with visual parent-child relationship builder and `choice_filter` auto-generation

## Planned

- [ ] **Survey123 Connect XLSX round-trip fidelity** — preserve all metadata when importing and re-exporting Connect-generated files without data loss
- [ ] **Expression validation** — real-time syntax checking and auto-complete for XPath expressions
- [ ] **Template library** — pre-built form templates for common survey patterns (inspections, inventories, incident reports)
- [ ] **Form theme / styling options** — preview different Survey123 themes and set `style` options visually
- [ ] **Keyboard-first workflow** — full keyboard navigation for power users (arrow keys, shortcuts for common actions)
- [ ] **Offline PWA** — service worker for full offline capability as a Progressive Web App
- [ ] **Dark mode** — because of course

## Future

- [ ] **Multi-language support** — translation columns (`label::language`, `hint::language`) with a language management UI
- [ ] **Publish directly to ArcGIS Online** — OAuth integration to publish forms without leaving the designer
- [ ] **Collaborative editing** — real-time multi-user editing (requires backend)

## Ideas (No Timeline)

- [ ] Form preview mode (simulate filling out the form)
- [ ] Diff viewer for comparing two `.xlsx` form versions
- [ ] AI-assisted form building (describe what you want, get a form structure)
- [ ] Integration with ArcGIS Field Maps and other Esri products
- [ ] Plugin system for custom question types or validators
