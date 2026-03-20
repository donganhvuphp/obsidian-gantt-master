# Code Standards & Codebase Structure

**Last Updated**: 2026-03-19
**Version**: 0.1.0
**Applies To**: MultiView for Bases (obsidian-multiview) — Obsidian plugin

---

## Overview

This document defines coding standards, file organization, naming conventions, and architecture patterns for the **MultiView for Bases** Obsidian plugin. The plugin provides alternative view types (Timeline/Gantt, Kanban, Table) for Obsidian Bases. All code is TypeScript targeting the Obsidian Plugin API with no UI framework.

---

## Core Development Principles

### YAGNI (You Aren't Gonna Need It)
- Implement only what the current feature requires.
- Do not build infrastructure for hypothetical future view types or configurations.
- Start simple; refactor when a real need emerges.

### KISS (Keep It Simple, Stupid)
- Prefer direct DOM manipulation via Obsidian's API helpers over abstractions.
- Choose readability over cleverness.
- A flat function is often better than a deep class hierarchy.

### DRY (Don't Repeat Yourself)
- Extract shared render helpers only when the same pattern appears in two or more views.
- Maintain a single source of truth for config key names and CSS class prefixes.

---

## Directory Structure

```
obsidian-multiview/
├── src/
│   ├── main.ts                  # Plugin entry point, settings, view registration
│   ├── types.d.ts               # Shared type declarations and ambient augmentations
│   └── views/
│       ├── timeline-view.ts     # Timeline / Gantt view implementation
│       ├── kanban-view.ts       # Kanban board view implementation
│       └── table-view.ts        # Table view implementation
├── docs/                        # Project documentation
│   ├── project-overview-pdr.md
│   ├── code-standards.md        # This file
│   ├── codebase-summary.md
│   ├── system-architecture.md
│   └── ...
├── styles.css                   # All plugin CSS (one file, sectioned per view)
├── manifest.json                # Obsidian plugin manifest
├── package.json
├── esbuild.config.mjs           # Build configuration
├── tsconfig.json
└── .github/
    └── workflows/               # CI/CD (release automation)
```

### File Size Guidance

- **Target**: keep individual files under 200 lines.
- **Acknowledged exception**: `timeline-view.ts` (~2361 lines) due to the complexity of Gantt rendering. If it grows further, extract self-contained sub-concerns (e.g., drag-and-drop handlers, date utilities) into sibling helper files under `src/views/`.
- Auto-generated or bundled output files (`main.js`) are exempt.

---

## Naming Conventions

### TypeScript Identifiers

| Kind | Convention | Example |
|---|---|---|
| Classes | PascalCase | `MultiViewPlugin`, `TimelineView`, `KanbanView`, `TableView` |
| Functions / methods | camelCase | `getConfig()`, `renderCard()`, `onDataUpdated()` |
| Variables | camelCase | `groupByProp`, `labelProp`, `colorProp` |
| Constants (module-level, truly fixed) | UPPER_SNAKE_CASE | `DEFAULT_ROW_HEIGHT` |
| Private class members | camelCase (no underscore prefix) | `this.config`, `this.container` |
| Type aliases / interfaces | PascalCase | `TimelineConfig`, `KanbanEntry` |

### Files and Directories

| Kind | Convention | Example |
|---|---|---|
| Source files | kebab-case | `timeline-view.ts`, `kanban-view.ts` |
| Directories | kebab-case | `src/views/` |

### CSS Classes

- **Prefix**: all plugin-owned classes use `multiview-` to avoid conflicts with Obsidian core or other plugins.
- **Format**: kebab-case after the prefix.
- Examples: `multiview-kanban-card`, `multiview-table-row`, `multiview-timeline-bar`, `multiview-gantt-header`.

### View Type Strings

View type identifiers registered with `registerBasesView()` use kebab-case strings:

```
'timeline'
'kanban'
'table-view'
```

### Config Property Keys

Config keys passed to `config.getAsPropertyId(key)` use camelCase strings matching the option name defined in `getViewOptions()`:

```
groupByProp, labelProp, colorProp, startProp, endProp
```

---

## Architecture Patterns

### Plugin Entry (`main.ts`)

`MultiViewPlugin` extends Obsidian's `Plugin` class. Responsibilities:

1. Register each view type via `this.registerBasesView(viewId, ViewClass)`.
2. Load and save plugin settings via `loadData()` / `saveData()`.
3. Add settings tab if configuration UI is needed.

Keep `main.ts` thin: no rendering logic, no data processing.

### View Classes (`src/views/`)

Each view is a class that extends `BasesView` from the Obsidian API.

**Standard interface every view must implement:**

```typescript
class ExampleView extends BasesView {
  // Receives controller, containerEl, and plugin reference
  constructor(controller: QueryController, containerEl: HTMLElement, plugin: MultiViewPlugin) { ... }

  // Called once after the view is mounted — perform initial render
  onload(): void { ... }

  // Called when the view is removed — clear DOM and event listeners
  onunload(): void {
    this.containerEl.empty();
  }

  // Called by the framework whenever underlying data changes — re-render
  onDataUpdated(): void { ... }

  // Returns the BasesAllOptions[] array that drives the view config UI
  static getViewOptions(): BasesAllOptions[] { ... }

  // Reads typed config values from this.config
  private getConfig(): ExampleConfig { ... }

  // Builds the full DOM inside this.containerEl
  private render(): void { ... }
}
```

**Rules:**
- `onunload()` must call `this.containerEl.empty()` to prevent DOM leaks.
- `render()` must be a pure DOM build — clear container first, then rebuild.
- Never store DOM references across renders; rebuild from data each time.

### Data Access Patterns

```typescript
// Flat (ungrouped) entries
const entries = this.data?.data ?? [];

// Grouped entries (when groupByProp is configured)
const groups = this.data?.groupedData ?? [];

// Resolve a config key to a property ID
const propId = this.config.getAsPropertyId('labelProp');

// Read a value from an entry
const value = entry.getValue(propId);

// Access the underlying TFile
const file = entry.file;
```

### Frontmatter Updates

Use Obsidian's file manager to update note frontmatter. Property names are extracted from `BasesPropertyId` by stripping the `note.` prefix:

```typescript
const propName = propId.replace(/^note\./, '');
await this.app.fileManager.processFrontMatter(file, (fm) => {
  fm[propName] = newValue;
});
```

---

## Error Handling

### Null Safety

Use optional chaining and nullish coalescing for all data access:

```typescript
const title = entry.getValue(propId)?.toString() ?? '';
const items = this.data?.data ?? [];
```

### Try-Catch

Wrap async operations that can fail (file writes, frontmatter updates) in try-catch blocks:

```typescript
try {
  await this.app.fileManager.processFrontMatter(file, (fm) => {
    fm[propName] = newValue;
  });
} catch (error) {
  new Notice(`Failed to update ${propName}: ${error.message}`);
}
```

### User Feedback

Use `new Notice(message)` for user-facing errors. Do not silently swallow errors that affect the user's data.

---

## Styling Standards

### Single CSS File

All styles live in `styles.css` at the project root. Sections are separated by comments:

```css
/* ============================================================
   Timeline View
   ============================================================ */

/* ... timeline styles ... */

/* ============================================================
   Kanban View
   ============================================================ */

/* ... kanban styles ... */
```

### CSS Variables

Prefer Obsidian's CSS custom properties for colors, spacing, and typography so the plugin respects the user's theme:

```css
.multiview-kanban-card {
  background-color: var(--background-secondary);
  color: var(--text-normal);
  border: 1px solid var(--background-modifier-border);
  border-radius: var(--radius-m);
}
```

Only use hardcoded values when a visual property is intrinsic to the view's structure (e.g., a fixed minimum column width).

### Class Naming

All classes use the `multiview-` prefix followed by a descriptive kebab-case name:

```
multiview-timeline-container
multiview-timeline-bar
multiview-gantt-header
multiview-kanban-board
multiview-kanban-column
multiview-kanban-card
multiview-table-container
multiview-table-row
multiview-table-cell
```

---

## DOM Construction

Use Obsidian's DOM helpers instead of raw `document.createElement`:

```typescript
// Preferred
const card = this.containerEl.createDiv({ cls: 'multiview-kanban-card' });
const title = card.createEl('span', { cls: 'multiview-kanban-title', text: label });

// Acceptable for event-driven elements
const btn = createEl('button', { cls: 'multiview-action-btn', text: 'Save' });
btn.addEventListener('click', () => this.handleSave());
```

Avoid `innerHTML` for dynamic content to prevent XSS from untrusted note data.

---

## Build Process

### Stack

| Tool | Purpose |
|---|---|
| `esbuild` | Bundle `src/main.ts` → `main.js` (single output file) |
| `tsc --noEmit` | Type-check without emitting (run before release) |

### Scripts (package.json)

```json
{
  "scripts": {
    "dev": "node esbuild.config.mjs",
    "build": "tsc --noEmit && node esbuild.config.mjs production",
    "typecheck": "tsc --noEmit"
  }
}
```

### Build Output

- `main.js` — bundled plugin code, loaded by Obsidian.
- `styles.css` — copied as-is (not bundled).
- `manifest.json` — copied as-is.

### Type Checking

Run `npm run typecheck` before every commit and release. The build does not fail on type errors by default (esbuild strips types); the `tsc --noEmit` step is the gate.

---

## Testing

There is currently no automated test framework in place. When tests are introduced:

- Place tests under `tests/` mirroring the `src/` structure.
- Use a framework compatible with the browser-like Obsidian environment (e.g., Vitest with jsdom).
- Focus first on pure utility functions (date calculations, config parsing) that do not require the Obsidian API.
- Mock `BasesView`, `QueryController`, and `app` for view-level tests.

---

## Git Standards

### Commit Messages

Follow [Conventional Commits](https://conventionalcommits.org/):

```
type(scope): short description

[optional body — explain WHY]

[optional footer — closes #issue, BREAKING CHANGE: ...]
```

**Types:**

| Type | Use |
|---|---|
| `feat` | New view feature or config option |
| `fix` | Bug fix |
| `refactor` | Code restructure without behavior change |
| `style` | CSS / visual-only changes |
| `docs` | Documentation changes |
| `chore` | Build, tooling, dependency updates |
| `perf` | Performance improvement |

**Rules:**
- Subject line: imperative mood, lowercase, no trailing period, max 72 characters.
- Body: explain motivation and context, not what the diff already shows.
- No AI attribution or co-author signatures.

**Examples:**

```
feat(timeline): add drag-to-resize for gantt bars

Allows users to change task end dates by dragging the right edge of a bar.
Updates frontmatter via processFrontMatter on drop.

fix(kanban): prevent empty column header when groupByProp is unset

style(table): tighten row padding using --size-4-2 variable

chore: bump obsidian API dependency to 1.8.0
```

### Versioning and Release

- Version format: plain `X.Y.Z` — **no `v` prefix** in tags (e.g., `0.1.0`, not `v0.1.0`).
- Bump version: `npm version patch|minor|major` (updates `package.json` and `manifest.json`).
- Release: push the version tag; GitHub Actions packages and publishes the release.
- `manifest.json` `minAppVersion` must be kept in sync with the minimum Obsidian version tested against.

### Branch Naming

```
feature/kanban-swimlanes
fix/timeline-date-overflow
refactor/table-view-cleanup
docs/gantt-config-options
```

---

## Pre-Commit Checklist

- No secrets, tokens, or personal vault paths committed.
- No debug `console.log` statements left in production code.
- `npm run typecheck` passes with no errors.
- CSS classes follow the `multiview-` prefix convention.
- Commit message follows Conventional Commits format.
- `manifest.json` version matches `package.json` version (on version bump commits).

---

## References

- [Obsidian Plugin Developer Docs](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [Obsidian API Type Definitions](https://github.com/obsidianmd/obsidian-api)
- [Conventional Commits](https://conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Project Overview PDR](./project-overview-pdr.md)
- [System Architecture](./system-architecture.md)
- [Codebase Summary](./codebase-summary.md)
