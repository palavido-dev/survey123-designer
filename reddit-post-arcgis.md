# r/ArcGIS Post

**Title:** Open source Survey123 XLSForm designer that runs in the browser (no AGOL account needed)

**Body:**

Hey everyone. I have been building Survey123 forms for a while now and always found the XLSForm authoring workflow kind of painful. The web designer needs an AGOL account and is limited for complex forms, and Connect is powerful but you are still manually editing spreadsheet rows.

I put together a free, open source form designer that runs entirely in your browser. No account, no install, nothing gets sent to a server. You drag and drop question types onto a canvas, set properties visually, write expressions with a guided builder, and export a .xlsx that is ready to publish through Survey123 Connect.

**Try it here:** [https://palavido-dev.github.io/survey123-designer/](https://palavido-dev.github.io/survey123-designer/)

**Source code:** [https://github.com/palavido-dev/survey123-designer](https://github.com/palavido-dev/survey123-designer)

**Some highlights:**

- 41 question types across 9 categories, with appearance variants broken out as separate cards (Spinner, Signature, Likert, etc.) so you know exactly what you are getting
- Expression builder with field picker, operators, and a function reference for relevant/constraint/calculation
- All the Esri extension columns are supported (bind::esri:fieldType, body::esri:inputMask, etc.)
- Import your existing .xlsx forms and keep editing them visually
- Exports include Connect-style data validation dropdowns, group/repeat row shading, and reference sheets
- Built-in CSV editor for select_one_from_file and select_multiple_from_file questions
- Auto-saves to your browser's storage so a page refresh won't wipe your work
- Report template builder for creating .docx feature report templates with field tokens

**Form builder with properties panel:**

![Form builder](https://raw.githubusercontent.com/palavido-dev/survey123-designer/main/docs/screenshots/01-main-overview.png)

**Expression builder:**

![Expression builder](https://raw.githubusercontent.com/palavido-dev/survey123-designer/main/docs/screenshots/03-expression-builder.png)

**Report template builder:**

![Report builder](https://raw.githubusercontent.com/palavido-dev/survey123-designer/main/docs/screenshots/04-report-builder.png)

This is still a work in progress and something I built primarily for myself, but I wanted to share it in case others find it useful. Would love to hear if it works with your forms or if you run into issues.
