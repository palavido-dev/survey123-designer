# r/gis Post

**Title:** I built a free, browser-based XLSForm designer for Survey123 (open source)

**Body:**

Hey all. I work with Survey123 a lot and got tired of authoring forms directly in Excel spreadsheets. Esri's web designer is fine for simple stuff but you need an AGOL account, and Survey123 Connect is great but the XLSForm editing is still just... Excel.

So I built a standalone drag-and-drop form designer that runs entirely in the browser. No login, no install, no data sent anywhere. You drag question types onto a canvas, configure properties visually, and export a spec-compliant .xlsx file you can publish through Connect.

**Live demo:** [https://palavido-dev.github.io/survey123-designer/](https://palavido-dev.github.io/survey123-designer/)

**GitHub repo:** [https://github.com/palavido-dev/survey123-designer](https://github.com/palavido-dev/survey123-designer)

**What it does:**

- 41 question types with appearance variants as separate draggable cards (so you don't have to memorize appearance strings)
- Visual expression builder for relevant, constraint, and calculation fields with a field picker and function library
- Platform filter to show only Field App or Web App compatible question types
- Full property editor covering every XLSForm column plus the Esri extensions
- CSV file support with a built-in spreadsheet editor for select_from_file questions
- Import any existing .xlsx form to keep editing it
- Exported files include Survey123 Connect-style data validation dropdowns and row shading
- Auto-saves to your browser so you don't lose work if the page refreshes
- Report template builder for creating .docx feature report templates

Here is what it looks like:

**Form builder with properties panel:**

![Form builder](https://raw.githubusercontent.com/palavido-dev/survey123-designer/main/docs/screenshots/01-main-overview.png)

**Expression builder:**

![Expression builder](https://raw.githubusercontent.com/palavido-dev/survey123-designer/main/docs/screenshots/03-expression-builder.png)

**Report template builder:**

![Report builder](https://raw.githubusercontent.com/palavido-dev/survey123-designer/main/docs/screenshots/04-report-builder.png)

This is a personal project I built for my own use and it is still a work in progress, but it has gotten to the point where I figured it might be useful to other people too. Sharing it in case anyone else is in the same boat with XLSForm authoring.

Happy to answer any questions or hear feedback. If you try importing one of your existing forms and something breaks, I would genuinely like to know about it.
