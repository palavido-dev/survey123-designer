# Roadmap

This is a personal project under active development. Features are prioritized based on what I need for my own work, but suggestions and contributions are welcome.

## Completed

- [x] **Drag-and-drop form builder** — 41 question types across 9 categories with appearance variants as separate palette cards
- [x] **Visual expression builder** — field picker, operator palette, and categorized function library for `relevant`, `constraint`, and `calculation` expressions
- [x] **Full property editor** — all XLSForm columns plus Esri extensions (body, bind) through collapsible sections
- [x] **Platform filter** — toggle between All / Field App / Web App to filter question types by target platform
- [x] **CSV file support** — upload, edit (inline cells, add/remove rows/columns, search, sort), and reference CSVs for `select_*_from_file` questions
- [x] **Media panel** — central overview of all file references with upload status indicators
- [x] **Question search** — search by name, label, or type with match navigation and auto-scroll (Ctrl+F)
- [x] **Choice list editor** — create and manage shared choice lists with inline editing
- [x] **XLSX import & export** — full round-trip with `survey`, `choices`, and `settings` sheets
- [x] **Survey123 Connect-style Excel output** — data validation dropdowns (type, appearance, required, readonly, bind columns), row shading for groups/repeats, styled header row, reference sheets with named ranges
- [x] **Inline label editing** — double-click question labels on the canvas; rich text editor for Notes
- [x] **Inline field name editing** — edit field names in the properties panel with real-time validation
- [x] **Auto-save & recovery** — automatic IndexedDB persistence with recovery banner on page reload
- [x] **Report template builder** — create Survey123 Feature Report `.docx` templates with field token palette, rich text editor, syntax reference, and `.docx` import/export
- [x] **Undo / Redo** — full undo/redo stack with Ctrl+Z / Ctrl+Shift+Z keyboard shortcuts
- [x] **Groups and repeats** — collapsible group/repeat containers with visual nesting, including compact and field list variants
- [x] **Form-level settings** — title, form ID, version, style, and default language

## In Progress

- [ ] **Better screenshots** — capture populated-form screenshots for documentation
- [ ] **Survey123 Connect XLSX round-trip fidelity** — preserve all metadata when importing and re-exporting Connect-generated files without data loss
- [ ] **Comprehensive form validation** — validate the entire form for common issues before export (missing names, duplicate names, orphaned choice lists, invalid expressions)

## Planned

- [ ] **Multi-language support** — translation columns (`label::language`, `hint::language`) with a language management UI
- [ ] **Cascading select wizard** — guided setup for cascading/filtered selects with visual preview
- [ ] **Form theme / styling options** — preview different Survey123 themes and set `style` options visually
- [ ] **Publish directly to ArcGIS Online** — OAuth integration to publish forms without leaving the designer
- [ ] **Collaborative editing** — real-time multi-user editing (requires backend)
- [ ] **Full XLSX + media zip export** — bundle the `.xlsx` with all referenced media and CSV files into a `.zip`
- [ ] **Template library** — pre-built form templates for common survey patterns (inspections, inventories, incident reports)
- [ ] **Expression validation** — real-time syntax checking and auto-complete for XPath expressions
- [ ] **Keyboard-first workflow** — full keyboard navigation for power users (arrow keys to move between questions, shortcuts for common actions)
- [ ] **Offline PWA** — service worker for full offline capability as a Progressive Web App
- [ ] **Dark mode** — because of course

## Ideas (No Timeline)

- [ ] Form preview mode (simulate filling out the form)
- [ ] Diff viewer for comparing two `.xlsx` form versions
- [ ] AI-assisted form building (describe what you want, get a form structure)
- [ ] Integration with ArcGIS field maps and other Esri products
- [ ] Plugin system for custom question types or validators
