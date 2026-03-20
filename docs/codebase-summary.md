# Codebase Summary

**Last Updated**: 2026-03-19
**Version**: 0.1.0
**Author**: Lord
**Repository**: obsidian-multiview

## Overview

MultiView for Bases is an Obsidian plugin that extends the native Bases feature with additional view types: a Gantt-style timeline, a Kanban board, and a sortable table. All three views read data from Obsidian Bases and render it interactively within the editor.

## Project Structure

```
obsidian-multiview/
├── src/
│   ├── main.ts                    # Plugin entry point (196 lines)
│   ├── types.d.ts                 # Type declarations
│   └── views/
│       ├── timeline-view.ts       # Gantt timeline view (2361 lines)
│       ├── kanban-view.ts         # Kanban board view (249 lines)
│       └── table-view.ts          # Sortable table view (193 lines)
├── styles.css                     # All view styles (1316 lines)
├── manifest.json                  # Obsidian plugin manifest
├── package.json                   # Node.js config
├── tsconfig.json                  # TypeScript config
├── esbuild.config.mjs             # Build config
├── version-bump.mjs               # Version bump script
├── versions.json                  # Obsidian version compatibility
├── scripts/
│   └── watch.mjs                  # Dev watch script
├── docs/                          # Project documentation
├── .claude/                       # Claude Code configuration
│   └── workflows/                 # Development workflows
├── CLAUDE.md                      # Claude Code instructions
├── README.md                      # Project readme
└── screenshot.jpg                 # Plugin screenshot
```

## Core Technologies

| Category | Technology |
|---|---|
| Language | TypeScript |
| Platform | Obsidian Plugin API |
| Build tool | esbuild |
| Bundle output | Single `main.js` |
| Runtime dependency | html2canvas (PNG export) |
| Dev tools | TypeScript compiler, esbuild, ESLint |

## Key Components

### 1. Plugin Entry (`src/main.ts`)

- **Class**: `MultiViewPlugin` extends `Plugin`
- Registers three `BasesView` types: `timeline`, `kanban`, `table-view`
- Settings: week start day (`monday` / `sunday`)
- Creates a sample base with 8 demo tasks on first run
- **Settings tab class**: `MultiViewSettingTab`

### 2. Timeline View (`src/views/timeline-view.ts`)

- **Class**: `TimelineView` extends `BasesView`
- Gantt-style timeline with 5 time scales: day, week, month, quarter, year
- Drag to move or resize bars; multi-select with Shift+click
- Groups support with drag-between-group capability
- Draw on the timeline to create new date ranges
- Inline label editing; undo/redo with 50-step history
- Color by property; label by property
- Zoom 1–5x, today marker, jump-to-date navigation
- Export current view to PNG via html2canvas
- Right-click context menu: Open, Edit dates, Duplicate, Delete, Clear dates
- Hover preview integration with Obsidian's native link preview
- Performance: async chunked rendering, metadata cache pre-filtering

### 3. Kanban View (`src/views/kanban-view.ts`)

- **Class**: `KanbanView` extends `BasesView`
- Groups entries by a frontmatter property into columns
- Drag-and-drop cards between columns; updates frontmatter via `processFrontMatter`
- Default columns: `todo`, `in-progress`, `review`, `done`
- Color indicators via `colorMap` config
- Supports Bases native `groupBy` or a custom `kanbanGroup` option
- Context menu: Open note, Open in new tab

### 4. Table View (`src/views/table-view.ts`)

- **Class**: `TableView` extends `BasesView`
- Renders all Bases properties as sortable columns
- Click column headers to cycle sort order: asc → desc → none
- Color indicators via `colorBy` + `colorMap`
- Click note name to open the file
- Context menu: Open note, Open in new tab
- Entry count displayed in footer

### 5. Styles (`styles.css`)

- 1316 lines of CSS covering all three views
- Theme-adaptive via Obsidian CSS custom properties
- Responsive layout

## Entry Points

| Audience | Starting Point |
|---|---|
| Users | `README.md`, `manifest.json` |
| Developers | `src/main.ts` → `src/views/` |
| Build output | `main.js`, `styles.css`, `manifest.json` |

## Development Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development build (no type check) |
| `npm run dev:watch` | Watch mode for incremental builds |
| `npm run build` | Production build (type check + bundle) |

Releases are created by running `npm version`, pushing the tag, and letting GitHub Actions handle the rest.

## Dependencies

### Production
- **html2canvas** — captures the timeline DOM node and exports it as a PNG image

### Development
- **obsidian** — Obsidian API type definitions
- **@types/node** — Node.js type definitions
- **typescript** — TypeScript compiler
- **esbuild** — Fast bundler
- **builtin-modules** — List of Node built-ins (used in esbuild config)

## Documentation Standards

All project docs live in `./docs/`:

| File | Purpose |
|---|---|
| `project-overview-pdr.md` | Project overview and product development requirements |
| `code-standards.md` | Coding standards and conventions |
| `codebase-summary.md` | This file |
| `system-architecture.md` | Architecture documentation |
| `project-roadmap.md` | Development roadmap |
| `design-guidelines.md` | UI/UX design guidelines |
| `deployment-guide.md` | Installation and deployment instructions |
