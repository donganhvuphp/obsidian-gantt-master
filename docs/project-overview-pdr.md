# Project Overview & Product Development Requirements (PDR)

**Project Name**: MultiView for Bases
**Package Name**: obsidian-multiview
**Version**: 0.1.0
**Last Updated**: 2026-03-19
**Status**: Active Development
**Author**: Lord (github: vudonganh)
**License**: MIT
**Repository**: https://github.com/vudonganh/obsidian-multiview

---

## Executive Summary

MultiView for Bases is an Obsidian plugin that extends the native Bases feature with rich, interactive visual views. It provides three complementary views — Timeline (Gantt-style), Kanban, and Table — that allow users to visualize and directly edit note data stored in Obsidian Bases (`.base` files). All editing is bi-directional: dragging a task on the Timeline updates the note's frontmatter, moving a card between Kanban columns writes the new status back to the file, and sorting a column in Table view reflects actual data properties.

The plugin targets Obsidian power users who rely on Bases for project and task management but need richer visual interfaces than the default Bases UI provides. It requires no external databases, no sync services, and no frameworks — everything runs locally inside Obsidian using its native plugin API and pure DOM manipulation.

---

## Project Purpose

### Vision

Make Obsidian Bases a first-class project management environment by adding the visual views that knowledge workers actually need: Gantt timelines, Kanban boards, and sortable tables — all directly connected to note frontmatter.

### Mission

- Give Obsidian users visual, interactive views for their Bases data without leaving the app
- Keep all data local: every change is written back to note frontmatter, no external storage
- Support both desktop and mobile Obsidian users
- Remain lightweight — no UI frameworks, no heavy dependencies, minimal footprint

### Value Proposition

- **Visual project planning**: See tasks on a Gantt-style Timeline with drag-to-reschedule and resize-to-extend
- **Kanban workflow**: Drag cards between status columns; frontmatter updates instantly
- **Data inspection**: Table view with sortable columns for rapid property review
- **Theme-aware**: Uses Obsidian CSS variables, adapts to any community theme automatically
- **Zero lock-in**: All data stays in standard Markdown frontmatter

---

## Target Users

### Primary Users

1. **Obsidian Bases users** who want visual alternatives to the raw Bases grid
2. **Project managers** using Obsidian to track tasks, sprints, or deliverables
3. **Students and researchers** organizing papers, readings, or assignments with date fields
4. **Knowledge workers** who prefer a Kanban board or Gantt chart over spreadsheet-style views

### User Personas

**Persona 1: The Task Tracker**
- Stores tasks as notes with `startDate`, `dueDate`, and `status` properties
- Wants to see a Gantt Timeline to spot scheduling conflicts at a glance
- Needs drag-and-drop to reschedule without opening each note individually

**Persona 2: The Workflow Manager**
- Uses a Kanban-style status property (`Todo`, `In Progress`, `Done`) across many notes
- Wants to move cards between columns the same way they would in Trello or Notion
- Expects the underlying note to update immediately when a card is moved

**Persona 3: The Data Reviewer**
- Has a large Bases query returning 50+ notes with multiple properties
- Wants a sortable Table to quickly sort by due date, priority, or assignee
- Needs a compact, readable layout that is faster to scan than the default Bases grid

---

## Key Features

### 1. Timeline View (Gantt-style)

- Renders tasks as horizontal bars on a time-axis grid
- **Drag bars** to move start and end dates; frontmatter updates on drop
- **Resize bars** from either edge to extend or shorten duration
- **Zoom controls**: day, week, month, quarter, year granularity
- **Group by property**: collapse/expand task groups
- **Undo/Redo**: multi-step undo for drag and resize operations
- **PNG export**: renders the visible Timeline to a PNG via html2canvas
- **Today line**: visual marker for the current date
- Approximately 2361 lines; the most feature-complete view in the plugin

### 2. Kanban View

- Renders one column per unique value of a configured status property
- **Drag cards** between columns; writes the new status value back to frontmatter
- Compact card display showing relevant note properties
- Approximately 249 lines

### 3. Table View

- Displays Bases query results as a standard HTML table
- **Sortable columns**: click a header to sort ascending/descending
- Configurable property display
- Approximately 193 lines

### 4. Bases Integration

- All views are driven by Obsidian's native `BasesView`, `BasesEntry`, and `QueryController` APIs
- Reads the `.base` file query to determine which notes and properties to show
- Writes changes back via the Obsidian vault API (frontmatter patch), keeping data in standard Markdown
- Configurable per-view options exposed through the Bases "Configure View" panel

### 5. Plugin Settings

- **Week start day**: Monday or Sunday, affects Timeline grid alignment
- **Create sample base**: one-click creation of a sample `.base` file for quick onboarding

### 6. Theme Compatibility

- All colors sourced from Obsidian CSS custom properties (`--color-accent`, `--background-primary`, etc.)
- Works with light and dark themes and any community theme without custom CSS overrides

---

## Technical Requirements

### Functional Requirements

**FR-1: Timeline Rendering**
- Parse `startDate` and `dueDate` (or equivalent configured properties) from BasesEntry objects
- Render task bars proportionally across the visible time range
- Support zoom levels: day / week / month / quarter / year
- Display a "today" marker at the current date

**FR-2: Timeline Editing**
- Drag a task bar horizontally to change its start and end dates
- Resize a task bar from its left edge (changes start date) or right edge (changes end date)
- Write updated date values to the note's frontmatter on drop/resize end
- Provide undo and redo for drag and resize operations

**FR-3: Timeline Groups**
- Group tasks by a configurable property value
- Render collapsible group rows
- Show group-level summary (e.g., date range of contained tasks)

**FR-4: Timeline Export**
- Capture the visible Timeline as a PNG using html2canvas
- Save the PNG to the vault or offer download

**FR-5: Kanban Editing**
- Render one column per distinct status value
- Allow drag-and-drop of cards between columns
- On drop, update the status property in the note's frontmatter immediately

**FR-6: Table Sorting**
- Clicking a column header sorts all rows by that column's values
- Second click on the same header reverses sort order
- Sorting is client-side; no re-query is needed

**FR-7: Bases Data Binding**
- All views must consume data from `BasesView` / `QueryController`
- Changes made in any view must be written back via the Obsidian file API
- Views must refresh when the underlying Bases query result changes

**FR-8: View Configuration**
- Each view exposes configuration options (e.g., which property maps to start date, end date, status, group-by) via the Bases Configure View panel

**FR-9: Plugin Settings**
- Persist week start day preference
- Provide a button to create a sample `.base` file in the vault

**FR-10: Sample Base**
- Creating the sample base should produce a working `.base` file with example notes so a new user can immediately see all three views populated

### Non-Functional Requirements

**NFR-1: Performance**
- Timeline must render up to 200 tasks without perceptible lag on desktop
- Drag operations must feel responsive (no jank at 60 fps)
- Table sort must complete in under 100 ms for up to 500 rows

**NFR-2: Compatibility**
- Minimum Obsidian version: 1.10.0
- Must run on both desktop (Electron) and mobile (iOS / Android) Obsidian
- `isDesktopOnly: false`

**NFR-3: Reliability**
- Frontmatter writes must be atomic (use Obsidian's `app.fileManager.processFrontMatter`)
- Undo stack must not exceed a configurable maximum to prevent memory growth
- No data loss on plugin reload or Obsidian restart

**NFR-4: Maintainability**
- TypeScript throughout; strict mode preferred
- No UI frameworks (React, Vue, Svelte) — pure DOM via Obsidian API
- Single build output: `main.js`, `styles.css`, `manifest.json`

**NFR-5: Bundle Size**
- Keep the production bundle small; html2canvas is the only significant runtime dependency
- Use esbuild tree-shaking to eliminate unused code

**NFR-6: Accessibility**
- Keyboard navigation for Table column sorting
- Sufficient color contrast for Timeline bars against both light and dark themes

---

## Technical Architecture

### Overview

```
obsidian-multiview/
├── src/
│   ├── main.ts              # Plugin entry point, registers views and settings
│   ├── views/
│   │   ├── TimelineView.ts  # Gantt Timeline (~2361 lines)
│   │   ├── KanbanView.ts    # Kanban board (~249 lines)
│   │   └── TableView.ts     # Sortable Table (~193 lines)
│   └── settings.ts          # Plugin settings tab and defaults
├── styles.css               # CSS using Obsidian CSS variables
├── manifest.json            # Plugin metadata
├── esbuild.config.mjs       # Build configuration
└── tsconfig.json
```

### Key Components

**Plugin Entry (`main.ts`)**
- Registers the three view types with Obsidian
- Loads and saves `PluginSettings` (week start, sample base flag)
- Adds the Settings tab

**TimelineView**
- Extends `BasesView` (Obsidian Bases API)
- Owns the drag/resize event loop and undo stack
- Delegates date formatting and grid math to internal helpers
- Calls `html2canvas` for PNG export

**KanbanView**
- Extends `BasesView`
- Renders columns from distinct status values in the query result
- Uses HTML5 drag events for card movement
- Calls `app.fileManager.processFrontMatter` to write status changes

**TableView**
- Extends `BasesView`
- Builds an HTML `<table>` from query result entries
- Tracks sort state (column + direction) in component state

### Data Flow

```
.base file (query definition)
    ↓  QueryController
BasesEntry[] (note data + frontmatter)
    ↓
View renders (Timeline / Kanban / Table)
    ↓  user interaction (drag, resize, card move, sort)
Frontmatter write via app.fileManager.processFrontMatter
    ↓
Note file updated on disk
    ↓
QueryController notifies view → re-render
```

### Build System

| Command | Purpose |
|---|---|
| `node esbuild.config.mjs` | Development build with watch mode |
| `tsc -noEmit -skipLibCheck && node esbuild.config.mjs production` | Type-check then production bundle |
| `npm version patch/minor/major` | Bump version and trigger release |

### Release Pipeline

GitHub Actions triggers on version tags pushed after `npm version`. It packages `main.js`, `styles.css`, and `manifest.json` into a GitHub Release asset. No NPM publishing.

### Runtime Dependencies

| Dependency | Purpose |
|---|---|
| `obsidian` | Plugin API (types only, provided at runtime) |
| `html2canvas` | PNG export from Timeline DOM |

---

## Use Cases

### UC-1: Schedule Tasks on a Timeline

**Actor**: Project manager
**Precondition**: A `.base` file exists querying notes that have `startDate` and `dueDate` frontmatter
**Flow**:
1. Open the `.base` file and switch to the Timeline view
2. Tasks appear as bars on the Gantt grid
3. Drag a bar left or right to reschedule; release to commit
4. The note's frontmatter updates; the bar snaps to the new dates

**Outcome**: Task dates updated without opening any individual note

### UC-2: Move a Task Through a Kanban Workflow

**Actor**: Knowledge worker
**Precondition**: Notes have a `status` property with values like `Todo`, `In Progress`, `Done`
**Flow**:
1. Open the `.base` file in Kanban view
2. Columns appear for each status value
3. Drag a card from `Todo` to `In Progress`
4. The card moves; the note's `status` frontmatter is updated to `In Progress`

**Outcome**: Workflow status updated visually and persistently

### UC-3: Sort and Inspect Data in Table View

**Actor**: Researcher
**Precondition**: A `.base` file queries a collection of notes with multiple properties
**Flow**:
1. Open the `.base` file in Table view
2. All notes appear as rows with property columns
3. Click the `dueDate` column header to sort ascending
4. Click again to sort descending

**Outcome**: Quickly identify the next due item without scripting or manual filtering

### UC-4: Undo an Accidental Drag

**Actor**: Any Timeline user
**Precondition**: User accidentally dragged a task bar to the wrong position
**Flow**:
1. Use the Undo action (keyboard shortcut or button in Timeline toolbar)
2. The task bar returns to its previous position
3. Frontmatter is reverted to the previous date values

**Outcome**: Accidental edit recovered without manually editing frontmatter

### UC-5: Onboard a New User with a Sample Base

**Actor**: First-time user
**Flow**:
1. Open Plugin Settings → MultiView for Bases
2. Click "Create sample base"
3. A sample `.base` file and example notes are created in the vault
4. User opens the sample base and explores all three views with real data

**Outcome**: User understands the plugin's capabilities within minutes, without manual setup

### UC-6: Export Timeline to PNG

**Actor**: Project manager presenting a schedule
**Flow**:
1. Open Timeline view and navigate to the desired date range
2. Click the Export button in the Timeline toolbar
3. html2canvas captures the visible Timeline
4. PNG is saved to the vault or downloaded

**Outcome**: Shareable project schedule image generated from live vault data

---

## Constraints

### Technical Constraints

- Must use only APIs available in Obsidian 1.10.0+; no private/undocumented API usage that could break on Obsidian updates
- The Bases API (`BasesView`, `BasesEntry`, `QueryController`) is still relatively new and may change; views must be resilient to minor API shape changes
- No React, Vue, or other component frameworks — DOM manipulation must use the Obsidian API or vanilla JS/TS
- html2canvas is the only runtime dependency beyond the Obsidian API; additional dependencies require explicit justification

### Platform Constraints

- Must run on Obsidian desktop (Windows, macOS, Linux via Electron) and Obsidian mobile (iOS, Android)
- Mobile has limited screen real estate; Timeline and Kanban must degrade gracefully on small screens
- No Node.js-specific APIs in plugin runtime code (only in build scripts)

### Data Constraints

- All data lives in note frontmatter; no external database, no plugin-specific storage format
- Date fields must be stored in a format that Bases can parse (ISO 8601 preferred)
- The plugin must not corrupt note body content when writing frontmatter

### Distribution Constraints

- Plugin must pass Obsidian Community Plugin review requirements to be listed in the community plugin directory
- `manifest.json` must remain accurate and up-to-date with each release

---

## Risks & Mitigation

### Risk 1: Bases API Instability
**Impact**: High — any breaking change to `BasesView` or `QueryController` could disable all views
**Likelihood**: Medium — Bases is a relatively new Obsidian feature
**Mitigation**: Abstract Bases API calls behind thin adapter functions; monitor Obsidian release notes; pin tested minimum version in `manifest.json`

### Risk 2: Frontmatter Write Conflicts
**Impact**: High — concurrent writes could corrupt note files
**Likelihood**: Low — single-user local app
**Mitigation**: Always use `app.fileManager.processFrontMatter` (provides built-in file locking); never write raw file content

### Risk 3: Mobile Performance
**Impact**: Medium — Timeline with many tasks may be slow on older mobile hardware
**Likelihood**: Medium
**Mitigation**: Implement virtual rendering (only render visible bars) in Timeline; provide a reduced-feature mode on mobile if necessary

### Risk 4: html2canvas Compatibility
**Impact**: Low — export is a convenience feature, not core functionality
**Likelihood**: Low
**Mitigation**: Wrap export in a try/catch; display a user-friendly error if html2canvas fails; keep dependency updated

### Risk 5: Community Plugin Review Rejection
**Impact**: Medium — limits discoverability
**Likelihood**: Low
**Mitigation**: Follow all Obsidian plugin guidelines; avoid `eval`, dangerous DOM patterns, or network requests to non-user-configured endpoints

---

## Future Roadmap

### v0.1.0 — Initial Release (Current)
- Timeline View: drag, resize, zoom, groups, undo, PNG export
- Kanban View: drag cards between status columns
- Table View: sortable columns, property display
- Plugin settings: week start day, sample base creation
- Desktop + Mobile support

### v0.2.0 — Timeline Polish
- Configurable color coding by property (e.g., color bars by assignee or priority)
- Milestone markers (zero-duration tasks displayed as diamonds)
- Dependency arrows between linked tasks
- Improved mobile touch handling for drag operations

### v0.3.0 — Kanban Enhancements
- Swimlanes (group rows within a Kanban column)
- Card quick-edit popup (edit properties without opening the note)
- Column WIP limits with visual warnings
- Collapsed column support

### v0.4.0 — Table Enhancements
- Inline cell editing for simple property types (text, number, checkbox)
- Column visibility toggle
- Column reordering via drag-and-drop
- Pagination or virtual scrolling for large result sets

### v0.5.0 — Cross-View Features
- Shared filter bar affecting all three views simultaneously
- "Jump to note" from any view item
- Keyboard navigation throughout all views
- Accessibility improvements (ARIA labels, focus management)

### v1.0.0 — Stable Release
- All views stable and feature-complete
- Full community plugin directory listing
- Comprehensive user documentation
- Performance validated on 500+ task datasets

---

## Dependencies & Integration

### Runtime Dependencies

| Package | Version | Purpose |
|---|---|---|
| `html2canvas` | latest | PNG export from Timeline DOM |
| `obsidian` | 1.10.0+ | Plugin API (types provided by Obsidian at runtime) |

### Build Dependencies

| Package | Purpose |
|---|---|
| `esbuild` | Fast TypeScript/JS bundling |
| `typescript` | Type checking |
| `@types/node` | Node types for build scripts |

### Obsidian API Surface Used

- `BasesView` — base class for all three views
- `BasesEntry` — typed access to note data and frontmatter
- `QueryController` — drives the Bases query and notifies views of changes
- `app.fileManager.processFrontMatter` — safe frontmatter writes
- `app.vault` — vault file operations
- `Plugin`, `PluginSettingTab`, `Setting` — standard plugin lifecycle

---

## Glossary

| Term | Definition |
|---|---|
| **Bases** | Obsidian's built-in database-like feature for querying notes by frontmatter properties |
| **BasesView** | Obsidian API class that plugin views extend to integrate with Bases |
| **BasesEntry** | An individual note entry returned by a Bases query, including its frontmatter |
| **QueryController** | Obsidian API object that manages the Bases query lifecycle and change notifications |
| **.base file** | A file in the vault that defines a Bases query and its view configuration |
| **frontmatter** | YAML metadata block at the top of an Obsidian Markdown note, delimited by `---` |
| **Timeline View** | Gantt-style visual view; tasks rendered as horizontal bars on a date axis |
| **Kanban View** | Board view; notes displayed as cards grouped into status columns |
| **Table View** | Tabular view; notes as rows with frontmatter properties as sortable columns |
| **html2canvas** | JavaScript library that renders DOM elements to a `<canvas>` for PNG export |

---

## Related Documentation

- [Codebase Summary](./codebase-summary.md)
- [Code Standards](./code-standards.md)
- [System Architecture](./system-architecture.md)
- [Project Roadmap](./project-roadmap.md)
