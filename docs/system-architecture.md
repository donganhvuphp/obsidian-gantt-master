# System Architecture

**Last Updated**: 2026-03-19
**Version**: 0.1.0
**Project**: MultiView for Bases (obsidian-multiview)

## Overview

MultiView for Bases is an Obsidian plugin that extends Obsidian Bases with three custom view types: Timeline (Gantt-style), Kanban (column-based), and Table (sortable grid). The architecture follows Obsidian's plugin API patterns, integrating tightly with the Bases engine for data querying and the Obsidian metadata cache for reactivity.

---

## High-Level Architecture

```
Obsidian App
└── MultiViewPlugin  (extends Plugin)
    ├── registerBasesView('timeline',    TimelineView)
    ├── registerBasesView('kanban',      KanbanView)
    ├── registerBasesView('table-view',  TableView)
    └── MultiViewSettingTab  (extends PluginSettingTab)
```

### Architectural Principles

- **Obsidian-native integration**: All views extend `BasesView` from the Obsidian Bases API; no custom data stores.
- **Reactive rendering**: Views re-render in response to `onDataUpdated()` callbacks from the Bases engine.
- **Frontmatter-driven state**: User interactions (drag, drop, inline edit) write back to note frontmatter via `app.fileManager.processFrontMatter`.
- **Config-per-view**: Each view reads its own options from the `.base` YAML configuration through `BasesViewConfig`.
- **Single bundle output**: TypeScript source is compiled and bundled by esbuild into a single `main.js`.

---

## Component Hierarchy

```
BasesView  (Obsidian API base class)
├── TimelineView
│   ├── QueryController      (data source provided by Bases engine)
│   ├── BasesViewConfig      (per-view YAML config accessor)
│   └── DOM rendering        (Gantt chart, absolutely positioned elements)
│
├── KanbanView
│   ├── QueryController
│   ├── BasesViewConfig
│   └── DOM rendering        (columns + draggable cards)
│
└── TableView
    ├── QueryController
    ├── BasesViewConfig
    └── DOM rendering        (sortable table)
```

---

## Source Layout

```
obsidian-multiview/
├── src/
│   ├── main.ts                  # Plugin entry point; view registration + settings
│   └── views/
│       ├── timeline-view.ts     # TimelineView (~2361 lines)
│       ├── kanban-view.ts       # KanbanView  (~249 lines)
│       └── table-view.ts        # TableView   (~193 lines)
├── styles.css                   # All view styles (~1316 lines, prefix: multiview-)
├── manifest.json                # Plugin metadata
├── esbuild.config.mjs           # Build configuration
├── tsconfig.json
└── package.json
```

---

## Data Flow

```
.base file  (YAML config)
    │  defines views, filters, sort, groupBy
    ↓
Obsidian Bases Engine
    │  queries vault metadata (frontmatter, file properties)
    ↓
QueryController
    │  provides BasesData { entries[], groupedData }
    ↓
BasesView subclass  (reads config + data)
    │
    ↓
DOM Rendering
    │  user interaction: drag, click, resize, inline edit
    ↓
app.fileManager.processFrontMatter()
    │  writes updated property to note frontmatter
    ↓
Obsidian metadata cache update
    │  triggers Bases engine refresh
    ↓
onDataUpdated()  →  re-render
```

### Reactivity Loop

Every BasesView subclass implements `onDataUpdated(data: BasesData)`. When frontmatter is mutated (by any mechanism — the plugin itself or an external edit), the Bases engine calls this callback and the view re-renders with fresh data. No manual subscription or polling is required.

---

## Component Details

### 1. MultiViewPlugin — `src/main.ts`

**Responsibilities:**
- Plugin lifecycle: `onload()` registers the three view types and a settings tab; `onunload()` performs cleanup.
- Persists plugin-level settings via `Plugin.loadData()` / `Plugin.saveData()`.
- Provides a "Create Sample Base" command that generates a demo folder with sample task notes and a `.base` file pre-configured with all three view types.

**Plugin Settings:**

```typescript
interface MultiViewPluginSettings {
    defaultWeekStart: 'monday' | 'sunday';
}
```

**View Registration:**

```typescript
this.registerBasesView('timeline',   (leaf) => new TimelineView(leaf, this));
this.registerBasesView('kanban',     (leaf) => new KanbanView(leaf, this));
this.registerBasesView('table-view', (leaf) => new TableView(leaf, this));
```

---

### 2. TimelineView — `src/views/timeline-view.ts`

The most complex view (~2361 lines). Renders a Gantt-style horizontal timeline where each note with start/end date properties appears as a draggable, resizable bar.

**Internal State:**

| State field       | Description                                  |
|-------------------|----------------------------------------------|
| `timeScale`       | Current scale: `day`, `week`, `month`, `year`|
| `zoom`            | Zoom multiplier (column width)               |
| `scrollPosition`  | Horizontal scroll offset                     |
| `selectedEntries` | Set of currently selected note paths         |
| `undoHistory`     | Array of up to 50 past frontmatter snapshots |

**Rendering Approach:**
DOM elements are absolutely positioned inside a scroll container to simulate canvas-like layout. The header row (date labels) and the body rows (bars) are rendered separately and scroll-synchronized.

**User Interactions:**

| Interaction        | Mechanism                                        |
|--------------------|--------------------------------------------------|
| Move bar           | Mousedown → mousemove → mouseup drag             |
| Resize bar         | Drag resize handle on bar edge                   |
| Multi-select       | Shift-click or rubber-band drag selection        |
| Draw to create     | Click-drag on empty row creates a new date range |
| Inline edit label  | Double-click on bar opens an input               |
| Undo / Redo        | 50-step history stack; Ctrl+Z / Ctrl+Shift+Z     |
| Export to PNG      | html2canvas captures DOM; downloads PNG file     |

**Performance Techniques:**
- Async chunked rendering to avoid blocking the UI thread.
- Metadata cache pre-filtering: skips notes that cannot possibly be in the visible date range before full DOM creation.
- Minimal DOM overhead: only visible rows are fully rendered.

**View Options (from `.base` YAML):**

| Option      | Type              | Description                              |
|-------------|-------------------|------------------------------------------|
| `startDate` | property id       | Frontmatter field for bar start          |
| `endDate`   | property id       | Frontmatter field for bar end            |
| `label`     | property id       | Text shown on bar                        |
| `colorBy`   | property id       | Field used to select bar color           |
| `colorMap`  | `{value: color}`  | Maps field values to hex/CSS colors      |
| `timeScale` | `day/week/month/year` | Initial time scale                   |
| `zoom`      | number            | Initial zoom level                       |

---

### 3. KanbanView — `src/views/kanban-view.ts`

Column-based board (~249 lines). Notes are displayed as cards grouped into columns based on a frontmatter property value.

**Column Source:**
Columns are derived from one of two sources in priority order:
1. Bases native `groupBy` field from the `.base` config.
2. `kanbanGroup` view option (explicit override).

If neither is configured, default columns are used: `todo`, `in-progress`, `review`, `done`.

**Drag-and-Drop:**
Uses the HTML5 drag API (`dragstart`, `dragover`, `dragleave`, `drop` events). Dropping a card on a column calls `processFrontMatter` to update the note's group property to the target column value.

**View Options (from `.base` YAML):**

| Option        | Type        | Description                               |
|---------------|-------------|-------------------------------------------|
| `kanbanGroup` | property id | Frontmatter field defining the column     |
| `label`       | property id | Card display text                         |
| `colorBy`     | property id | Field used for card color accent          |

---

### 4. TableView — `src/views/table-view.ts`

Standard sortable table (~193 lines). Columns are discovered automatically from `allProperties` provided by the BasesView base class.

**Sorting:**
Client-side sort triggered by clicking a column header. String values use `localeCompare`; numeric/date values fall back to string comparison. Sort state (field + direction) is stored in component memory and reapplied on each re-render.

**View Options (from `.base` YAML):**

| Option    | Type        | Description                        |
|-----------|-------------|------------------------------------|
| `label`   | property id | Primary display column             |
| `colorBy` | property id | Field used for row color accent    |

---

## Configuration Architecture

### Plugin-Level Settings

Stored via `Plugin.loadData()` / `Plugin.saveData()` in Obsidian's plugin data directory.

```typescript
interface MultiViewPluginSettings {
    defaultWeekStart: 'monday' | 'sunday';  // default: 'monday'
}
```

### Per-View Configuration

Stored in the `.base` file as YAML. Each view block can carry view-specific options alongside standard Bases fields (`filter`, `sort`, `groupBy`, etc.). View options are accessed at runtime via `this.config.getAsPropertyId(key)`.

### Sample `.base` File

```yaml
views:
  - type: timeline
    name: Timeline View
    startDate: note.start_date
    endDate: note.end_date
    label: note.title
    colorBy: note.status
    colorMap:
      done: "#2f9e44"
      in-progress: "#1c7ed6"
    timeScale: day
    zoom: 1

  - type: kanban
    name: Kanban View
    groupBy: note.status
    label: note.title
    colorBy: note.priority

  - type: table-view
    name: Table View
```

---

## Styling Architecture

```
styles.css  (~1316 lines)
├── Global / shared variables
├── TimelineView styles     (.multiview-timeline-*)
├── KanbanView styles       (.multiview-kanban-*)
└── TableView styles        (.multiview-table-*)
```

**Conventions:**
- CSS class prefix: `multiview-`
- Theme adaptation: all colors reference Obsidian CSS variables (`--background-primary`, `--text-normal`, `--interactive-accent`, etc.) so the plugin inherits both light and dark themes automatically.
- Palette accent colors are defined as CSS custom properties (`--multiview-color-*`) to allow theme-level overrides.

---

## Build Architecture

```
TypeScript Source (src/)
    │
    ↓ tsc  (type checking only; no emit)
    │
    ↓ esbuild  (bundle + transpile)
    │
    ├── main.js          (plugin bundle, output to project root)
    ├── styles.css       (copied from source)
    └── manifest.json    (copied from source)
```

**esbuild configuration highlights:**
- Entry point: `src/main.ts`
- Format: `cjs` (CommonJS, required by Obsidian)
- External: `obsidian`, `electron`, Node built-ins (provided by Obsidian runtime)
- Minification: disabled in development, enabled for release builds

**NPM scripts:**

| Script          | Description                                      |
|-----------------|--------------------------------------------------|
| `npm run dev`   | Watch mode, rebuilds on source change            |
| `npm run build` | Production build (type check + bundle)           |

---

## Dependency Map

### Runtime Dependencies

| Package      | Version | Purpose                           |
|--------------|---------|-----------------------------------|
| html2canvas  | ^1.x    | DOM-to-PNG export in TimelineView |

### Development Dependencies

| Package              | Purpose                              |
|----------------------|--------------------------------------|
| typescript           | Type safety + IDE support            |
| esbuild              | Fast bundler                         |
| @types/obsidian      | Obsidian API type definitions        |
| eslint               | Code linting                         |
| builtin-modules      | Enumerate Node built-ins for esbuild |

### Platform Requirement

- Obsidian >= 1.10.0 (required for Bases API / `registerBasesView`)

---

## Interaction Sequence: Drag-and-Drop in KanbanView

```
User drags card from "todo" → "in-progress"
    │
    ↓ dragstart event fires on card element
KanbanView stores dragged entry reference
    │
    ↓ dragover fires on target column
KanbanView adds visual drop-target highlight
    │
    ↓ drop fires on target column
KanbanView calls:
    app.fileManager.processFrontMatter(file, (fm) => {
        fm[groupField] = targetColumnValue;
    })
    │
    ↓ Obsidian writes frontmatter to disk
    │
    ↓ Obsidian metadata cache invalidates
    │
    ↓ Bases engine detects change
    │
    ↓ onDataUpdated(newData) called on KanbanView
    │
    ↓ Board re-renders; card appears in new column
```

---

## Interaction Sequence: Timeline Bar Move

```
User drags bar horizontally
    │
    ↓ mousedown on bar body
TimelineView records: entry, initial mouse X, original startDate/endDate
    │
    ↓ mousemove
TimelineView recomputes dates from pixel delta + timeScale
TimelineView updates bar position in DOM (no frontmatter write yet)
    │
    ↓ mouseup
TimelineView commits:
    app.fileManager.processFrontMatter(file, (fm) => {
        fm[startDateField] = newStartDate;
        fm[endDateField]   = newEndDate;
    })
TimelineView pushes previous state to undoHistory stack
    │
    ↓ onDataUpdated() → re-render
```

---

## Undo Architecture (TimelineView)

```
undoHistory: Array<UndoState>  (max 50 entries)

UndoState {
    filePath: string
    field:    string
    value:    string  // previous frontmatter value
}

Ctrl+Z  →  pop UndoState → processFrontMatter to restore value
Ctrl+Shift+Z  →  redo stack (symmetric)
```

Any frontmatter-mutating operation (move, resize, draw-to-create, inline edit) pushes to this stack before writing. The 50-entry cap prevents unbounded memory growth.

---

## PNG Export Flow (TimelineView)

```
User clicks "Export PNG" button
    │
    ↓
html2canvas(timelineContainerElement, { ... })
    │  captures DOM subtree as canvas
    ↓
canvas.toDataURL('image/png')
    │
    ↓
Programmatic <a download="timeline.png"> click
    │
    ↓
Browser downloads PNG file
```

`html2canvas` is the only non-Obsidian runtime dependency. It is bundled into `main.js` by esbuild.

---

## CSS Variable Reference

Key Obsidian variables consumed by the plugin:

| Variable                    | Usage context                         |
|-----------------------------|---------------------------------------|
| `--background-primary`      | View background                       |
| `--background-secondary`    | Column/header backgrounds             |
| `--text-normal`             | Default text                          |
| `--text-muted`              | Secondary / placeholder text         |
| `--interactive-accent`      | Selected bar / active element         |
| `--color-base-30`           | Borders, dividers                     |

Plugin-defined palette variables (`--multiview-color-*`) are declared in `styles.css` and can be overridden by Obsidian themes or CSS snippets.

---

## References

- [Project Overview PDR](./project-overview-pdr.md)
- [Codebase Summary](./codebase-summary.md)
- [Code Standards](./code-standards.md)
- [Obsidian Plugin API](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [Obsidian Bases Documentation](https://help.obsidian.md/bases)
