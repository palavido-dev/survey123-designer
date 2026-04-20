# Survey123 Designer Forum Scan, 2026-04-20

Automated scan of the Esri ArcGIS Survey123 Ideas forum, Questions board, Reddit (r/gis and r/ArcGIS), and GitHub issues on the Survey123 Designer repo. The goal is to surface feature requests and pain points that Survey123 Designer either already addresses or could reasonably implement.

Sources scanned:
- Ideas forum (designer, reports, connect labels plus latest + most-kudoed sorts)
- Survey123 Questions board (most recent 15 topics)
- r/gis and r/ArcGIS (Survey123 keyword, top 25 results each)
- Reddit comments on Matt's launch post (`/r/gis/comments/1so56qu`, 58 upvotes, 17 comments at time of scan)
- GitHub issues on `palavido-dev/survey123-designer` (0 open)

This file merges fresh signals from today's scan with the highest-kudos items captured in prior scans that are still open on the Ideas forum. Kudos counts for historical items come from the earlier archive; new items show the count from today's fetch.

## Summary

Three themes stand out in 2026 activity:

1. **Repeat ergonomics** remain the single largest cluster of unresolved ideas. The stacked-repeats appearance at 175 kudos is still the most-requested Survey123 idea full stop, and four smaller adjacent ideas (#1697168, #1697178, table view, navigation) were filed in just the last two weeks.
2. **Report template authoring** has an active subthread of usability complaints: unhelpful server error messages on unclosed tags, missing `else` branch on `${if}`, no way to suppress empty fields, and rigid report-filename rules. A browser-side linter and richer templating UX would be differentiating.
3. **Discoverability of existing features** came up loudly in Reddit feedback on Matt's launch post. Three separate commenters asked about features Survey123 Designer already supports (multi-page via Field List, grids via w1-w4, pulldata). Clearer palette labels and a "Features you may not know about" doc section would help.

Zero GitHub issues have been filed on the Survey123 Designer repo yet, so the forum and Reddit are the primary signal channels.

## Already Handled

These ideas describe functionality Survey123 Designer already ships. Useful as forum reply material.

| Idea | Kudos | How Designer handles it |
|------|------:|------------------------|
| [Grid theme supported in web app](https://community.esri.com/t5/arcgis-survey123-ideas/) | 84 | w1/w2/w3/w4 group appearances render as CSS grids on canvas |
| [Table view for repeats](https://community.esri.com/t5/arcgis-survey123-ideas/) | 88 | `table-list` group appearance renders as a table with choice column headers |
| [Form organization / reuse](https://community.esri.com/t5/arcgis-survey123-ideas/) | 39 | Template Library with 51 categorized templates and search |
| [Expand/collapse group interface](https://community.esri.com/t5/arcgis-survey123-ideas/) | 20 | Groups and repeats are collapsible on the canvas with visual nesting |
| [Allow repeats in Survey123 web designer](https://community.esri.com/t5/arcgis-survey123-ideas/allow-repeats-in-survey123-web-designer/idi-p/1637247) | 11 | Full drag-and-drop repeat support with compact and field-list variants |
| [Support info/help bubbles (guidance_hint)](https://community.esri.com/t5/arcgis-survey123-ideas/) | 14 | `guidance_hint` column exposed through the Basic property section for all types |
| [Set default photo name in Connect](https://community.esri.com/t5/arcgis-survey123-ideas/) | 125 | `body::esri:filename` bind property exposed in the Body section |
| [Use PullData to populate select_one choices](https://community.esri.com/t5/arcgis-survey123-ideas/) | 37 | Expression builder's function library includes pulldata; JavaScript editor wraps `pulldata("@javascript", ...)` |
| [Improve Connect "Analyze" tool to flag reserved keywords](https://community.esri.com/t5/arcgis-survey123-ideas/improve-survey123-connect-analyze-tool-to-flag/idi-p/1657399) | 3 | Our validation flags reserved words, duplicates, and illegal characters inline with an expandable summary panel |
| PullData support (Reddit comment) | 11 pts | Same as above; answer quickly in the Reddit thread |
| Multi-page surveys, grid arrangement (Reddit comment) | n/a | Field List groups + `style=pages`, plus w1 through w4 grid groups |

## Quick Wins (Small Effort, High Value)

Low-risk items. Items marked "implemented in this run" are included in the same commit as this report.

### 1. Clarify Field List / page-break terminology (implemented in this run)

Reddit commenter **liver_pains** asked for "New Page in Structure." Commenter **prizm5384** asked whether multi-page surveys are supported. Neither recognized that the existing Field List group is Survey123's page-break primitive. Fixed by updating the palette labels to "Field List (Page)" and "Field List Repeat (Page per entry)" and adjusting the descriptions to call out the `style=pages` setting.

### 2. Report syntax reference: add else-workaround and multi-image patterns (implemented in this run)

Idea [#1624527](https://community.esri.com/t5/arcgis-survey123-ideas/reports-add-an-quot-else-quot-option-to-if/idi-p/1624527) (4 kudos) asks Esri for an `else` branch on `${if}`. Users currently write paired inverse conditionals as a workaround. Added two entries to the Syntax Reference panel in the Report Properties Panel so authors discover the pattern without hitting the limitation cold.

### 3. ROADMAP.md: record high-kudos forum items (implemented in this run)

Added a "Community-Requested" section so the roadmap explicitly tracks top forum ideas and marks which are already done. This serves as a landing spot for future scheduled scan results.

### 4. Create an on/off switch (yes_no_toggle) palette card

32 kudos on the Ideas forum. The underlying appearance `yes_no_toggle` already exists in our `validAppearances` table, and is already a palette card (`select_one-yesno`). Worth confirming the card is easy to find; currently listed in the Selection category under "Yes/No Toggle" which is the correct labeling. No code change needed; flag in the report so we can respond on the forum if this idea resurfaces.

### 5. Photo orientation enforcement property

10 kudos. Add a photo-orientation property to the Body section of image questions. Requires a new column mapping; defer to Matt for the specific Esri column name because the Esri docs and the forum thread don't agree on one.

### 6. Guidance hint scrollbar in preview

33 kudos. Verify that our guidance_hint preview on the canvas handles 5+ lines gracefully. Quick visual test; no code change likely required, but worth checking during the next UI pass.

## Medium Effort (Worth Planning)

### Stacked repeats appearance (175 kudos, by far the top unresolved idea)

The community wants repeat entries displayed stacked (expanded) rather than collapsed/card-style. Our canvas already shows repeat children inline, but we could add an explicit preview toggle that switches between "card" and "stacked" presentation to mirror what Survey123 does at runtime. This is marketing-worthy: "The #1 requested Survey123 feature, previewable in Designer."

### Network drive / filesystem workflow (137 kudos)

Users want to edit forms as files on a share, not through a web portal. Our design already exports clean XLSX. We could add File System Access API support so users select a folder once and every save writes back to disk. Good differentiation vs. Esri's web designer.

### Publish to specific AGOL folder (90 kudos), Python publish (40 kudos)

Out of reach until we build AGOL OAuth publish (on the Future list in ROADMAP), but we could ship a companion Python script generator in the meantime (export a `.py` file next to the `.xlsx` that uses `arcgis` API to publish).

### Same-as-last-entry for repeats (17 kudos), auto-populate repeats (32 kudos)

Add a per-field "copy from previous repeat" checkbox in repeat children that generates `indexed-repeat(...)` expressions automatically. Small UI, meaningful XLSForm plumbing.

### Upgrade/migrate deprecated XLSForm syntax (17 kudos)

When importing an XLSX, detect deprecated appearances or syntax and offer to rewrite. Pairs well with the planned "Survey123 Connect XLSX round-trip fidelity" item.

### Report template linter: unclosed-tag detection

Ideas [#1616654](https://community.esri.com/t5/arcgis-survey123-ideas/reports-highlight-problem-areas-in-the-report/idi-p/1616654) and [#1624529](https://community.esri.com/t5/arcgis-survey123-ideas/reports-do-all-of-your-error-checking-up-front/idi-p/1624529) complain that Survey123's server emits unhelpful `${/} is unopened` errors with no line number. A browser-side linter that walks the TipTap document, tracks `${if}` / `${#repeat}` opens against `${/}` closes, and surfaces the mismatch inline would prevent this whole class of frustration. Medium effort because it needs TipTap traversal.

### Hide empty fields in feature reports (3 kudos on [#1658379](https://community.esri.com/t5/arcgis-survey123-ideas/s123-report-hiding-empty-fields/idi-p/1658379))

"Wrap with if(field)" toggle next to every token, plus a "Hide all empty" bulk action that wraps every field token with a conditional.

### Cascading-select-style wizard for select_multiple geometry (idea [#1677465](https://community.esri.com/t5/arcgis-survey123-ideas/support-calculating-geometry-from-select-multiple/idi-p/1677465))

OP describes an advanced but fragile pattern using `count-selected` and `selected-at` inside a repeat with `pulldata` for geometry. A guided wizard (modeled after the existing Cascading Select Wizard) would make this a two-minute operation instead of an afternoon of XLSForm trial-and-error.

### Responsive device preview

Idea [#1685138](https://community.esri.com/t5/arcgis-survey123-ideas/configurable-survey-layouts-for-use-on-different/idi-p/1685138) asks for device-specific layouts. Survey123 runtime can't do that today, but a Designer preview showing the form at phone/tablet/desktop widths would let authors catch squashing issues early.

### User-defined default settings for new forms

Idea [#1694682](https://community.esri.com/t5/arcgis-survey123-ideas/user-defined-default-settings-for-new-surveys/idi-p/1694682). Persist per-user defaults in IndexedDB and apply them whenever "New blank form" is created.

### Terms and Conditions template

Idea [#1680820](https://community.esri.com/t5/arcgis-survey123-ideas/terms-conditions-checkbox-and-legal-disclaimer-at/idi-p/1680820) asks for a disclaimer-and-required-checkbox pattern. Adding a "Consent/Disclaimer" mini-template in the Template Library is a data-only change but deserves Matt's eyes on the wording style. Flagged rather than shipped.

## Out of Scope

Popular but not actionable for a browser-based XLSForm designer.

| Idea | Kudos | Why |
|------|------:|-----|
| [Allow Viewers to fill in surveys](https://community.esri.com/t5/arcgis-survey123-ideas/allow-viewers-to-fill-in-and-submit-surveys-in/idi-p/1200610) | 108 | AGOL sharing/permissions |
| Add feature reports to Enterprise | 97 | Server-side report generation |
| SSO in Survey123 Connect for Windows | 39 | Desktop app auth |
| [Built-in email notifications](https://community.esri.com/t5/arcgis-survey123-ideas/built-in-survey123-email-notifications/idi-p/1693104) | 8 | Server-side / webhook concern |
| [Built-in email confirmation on submit](https://community.esri.com/t5/arcgis-survey123-ideas/built-in-email-confirmation-when-survey-submitted/idi-p/1697121) | 6 | Same as above |
| [Offline Area sharing between Field Maps and Survey123](https://community.esri.com/t5/arcgis-survey123-ideas/allow-and-enable-sharing-of-offline-areas-between/idi-p/1695276) | 3 | Mobile app + AGOL |
| [Enterprise sharing without broadcasting](https://community.esri.com/t5/arcgis-survey123-ideas/enable-users-to-fill-out-surveys-on-an-enterprise/idi-p/1693726) | 2 | Portal permission model |
| [Location sharing custom basemap](https://community.esri.com/t5/arcgis-survey123-ideas/location-sharing-map-allow-selection-of-custom/idi-p/1690293) | 2 | Field app config |
| [Inbox/Outbox rename or hint](https://community.esri.com/t5/arcgis-survey123-ideas/ability-to-change-inbox-outbox-names-or-at-least/idi-p/1694068) | 2 | Field app UX |
| [Populate report generated date in existing field](https://community.esri.com/t5/arcgis-survey123-ideas/ability-to-populate-report-generated-date-in-an/idi-p/1690480) | 1 | Report generation hook |
| [Image location and direction on map in report](https://community.esri.com/t5/arcgis-survey123-ideas/image-location-amp-direction-on-map-in-report/idi-p/1692676) | 1 | Report rendering engine |
| [Better portal separation in Connect](https://community.esri.com/t5/arcgis-survey123-ideas/better-separation-of-surveys-from-different/idi-p/1690809) | 3 | Connect app concern |
| [Keep raw submissions in archive layer](https://community.esri.com/t5/arcgis-survey123-ideas/keep-a-record-of-raw-survey-submissions-in-a/idi-p/1690651) | 0 | Server-side archiving |
| [Survey width in Experience Builder widget](https://community.esri.com/t5/arcgis-survey123-ideas/ability-to-adjust-width-of-surveys-within/idi-p/1689921) | 1 | Experience Builder widget |
| [Type values in date picker on mobile](https://community.esri.com/t5/arcgis-survey123-ideas/enter-data-values-in-addition-to-selection-and/idi-p/1691990) | 0 | Field app bug |
| [Multi-language feature reports](https://community.esri.com/t5/arcgis-survey123-ideas/) | n/a | Report generator would need language hooks |
| Bulk photo upload to Survey123 (Reddit r/ArcGIS) | n/a | Field app workflow |

## Questions Board Signals

Topics on the Survey123 Questions board in the last scan window that hint at recurring pain:

- [Customize geopoint map height in Survey123 web browser](https://community.esri.com/t5/arcgis-survey123-questions/customize-geopoint-map-height-in-survey123-web/td-p/1695392) (we expose `body::esri:style`, worth a doc snippet on web-app limits)
- [Issue with relevant expressions in nested repeats](https://community.esri.com/t5/arcgis-survey123-questions/issue-with-relevant-expressions-in-nested-repeats/td-p/1696388) (Survey123 web bug, but our validation could warn when a relevant references a grandparent repeat)
- [Pulldata for choices](https://community.esri.com/t5/arcgis-survey123-questions/pulldata-for-choices/td-p/1696230) (our expression library covers this, worth making sure the pulldata examples in the library cover the `search()` + inbox scenario)

## Reddit Signals

- **r/gis launch post** ([1so56qu](https://www.reddit.com/r/gis/comments/1so56qu/i_built_a_free_browserbased_xlsform_designer_for/)) landed at 58 upvotes and 17 comments. Questions from commenters:
  - PullData function support (already there, reply on the thread)
  - Multi-page surveys (Field List groups, clearer label shipping in this commit)
  - Grid arrangement (w1 through w4 group appearances, already shipping)
  - Dependent questions (relevant column, already shipping)
  - Multiple photos / locations (supported via the `multiline` appearance on image, or repeats; worth a note)
  - Mobile-friendliness of Designer itself (prizm5384 noted it "doesn't work great on mobile"; expected, since Designer is a desktop-first tool)
  - "Can I list it on thespatialindex.com" (a directory inclusion request)
- **r/gis "Any Survey123 guru" post** (2025-10, 12 pts): table-list layout truncation pain. Our canvas renders table-list with proper column sizing; worth a Reddit reply the next time this comes up.
- **r/ArcGIS open source post** (15 pts, 2026-04-17): separate promotional post, no unique feature signal beyond validation that visibility is good.

## Action Items for Matt

1. Review the palette label changes in Quick Win #1 and confirm the "Page" phrasing reads correctly; open an issue if you'd rather use "Page Break" or "Screen."
2. Decide whether to ship a "Consent/Disclaimer" template in the Template Library (wording is the bike shed).
3. Consider scoping the report template linter (Quick Win #4 above under Medium Effort) since two independent ideas point at the same class of error.
4. If you answer in the Reddit thread, the three talking points are: pulldata support, Field List = page break, and grid groups via w1 through w4 appearance.
5. Consider a short "Features you may not know about" section in the README so the discoverability problem the Reddit comments surfaced doesn't keep reappearing in future scans.

Sources:
- [Allow repeats in Survey123 web designer](https://community.esri.com/t5/arcgis-survey123-ideas/allow-repeats-in-survey123-web-designer/idi-p/1637247)
- [Improve Survey123 Connect Analyze tool](https://community.esri.com/t5/arcgis-survey123-ideas/improve-survey123-connect-analyze-tool-to-flag/idi-p/1657399)
- [Reports: Add "Else" option to ${if}](https://community.esri.com/t5/arcgis-survey123-ideas/reports-add-an-quot-else-quot-option-to-if/idi-p/1624527)
- [Reports: Highlight problem areas in the report template](https://community.esri.com/t5/arcgis-survey123-ideas/reports-highlight-problem-areas-in-the-report/idi-p/1616654)
- [Reports: Do all error checking up front](https://community.esri.com/t5/arcgis-survey123-ideas/reports-do-all-of-your-error-checking-up-front/idi-p/1624529)
- [Report Name option to hardcode attribute](https://community.esri.com/t5/arcgis-survey123-ideas/report-name-option-to-hardcode-attribute/idi-p/1606813)
- [Report titles: Allow IF() expressions](https://community.esri.com/t5/arcgis-survey123-ideas/report-titles-allow-if-expressions/idi-p/1688820)
- [S123 report: hiding empty fields](https://community.esri.com/t5/arcgis-survey123-ideas/s123-report-hiding-empty-fields/idi-p/1658379)
- [Terms/conditions checkbox and legal disclaimer](https://community.esri.com/t5/arcgis-survey123-ideas/terms-conditions-checkbox-and-legal-disclaimer-at/idi-p/1680820)
- [Configurable survey layouts for different devices](https://community.esri.com/t5/arcgis-survey123-ideas/configurable-survey-layouts-for-use-on-different/idi-p/1685138)
- [Support calculating geometry from select_multiple](https://community.esri.com/t5/arcgis-survey123-ideas/support-calculating-geometry-from-select-multiple/idi-p/1677465)
- [User-defined default settings for new surveys](https://community.esri.com/t5/arcgis-survey123-ideas/user-defined-default-settings-for-new-surveys/idi-p/1694682)
- [Reddit launch post on r/gis](https://www.reddit.com/r/gis/comments/1so56qu/i_built_a_free_browserbased_xlsform_designer_for/)
