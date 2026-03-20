# MultiView for Bases (obsidian-multiview) - Project Roadmap

**Last Updated:** 2026-03-19
**Current Version:** 0.1.0
**Repository:** obsidian-multiview
**Status:** Early Development

---

## Executive Summary

MultiView for Bases is an Obsidian plugin that brings multiple visualization views (Timeline, Kanban, Table) to Obsidian Bases. The project is in early development at v0.1.0, with all three core views functional and delivered. The immediate focus is on stability, code quality, and community plugin submission before expanding to additional view types and power features.

This is a solo-developer project targeting the Obsidian community. Timelines are estimates and subject to change based on available bandwidth.

---

## Current Status (v0.1.0)

**Release Date:** 2026-03-19
**Stability:** Alpha - functional but not hardened for production

### Completed Features

#### Timeline View (Gantt-style)
- 5 time scales: day, week, month, quarter, year
- Drag to move and resize bars
- Multi-select with Shift+click
- Groups with drag-between-group support
- Draw to create date ranges
- Inline label editing
- Undo/redo (50-step history)
- Color by property, label by property
- Zoom 1x to 5x
- Today marker, jump-to-date
- Export to PNG
- Right-click context menu
- Hover preview
- Performance optimized rendering

#### Kanban View
- Group by frontmatter property
- Drag-and-drop between columns (updates frontmatter on drop)
- Color indicators per card
- Default column set: todo, in-progress, review, done
- Right-click context menu

#### Table View
- All frontmatter properties displayed as columns
- Sortable columns
- Color indicators
- Right-click context menu

#### Plugin Infrastructure
- Settings: week start day, sample base creation
- Sample base: 8 demo tasks with 3 pre-configured views
- Build system: esbuild + TypeScript
- BRAT-compatible installation

### Known Issues & Technical Debt

| Item | Severity | Notes |
|------|----------|-------|
| `timeline-view.ts` is 2361 lines | Medium | Should be split into focused modules |
| No automated tests | Medium | Manual testing only at this stage |
| No CI/CD pipeline | Low | Release workflow referenced in README but not implemented |
| No inline editing in Kanban cards | Low | Planned for v0.2.x |
| No inline cell editing in Table | Low | Planned for v0.2.x |
| Limited mobile support | Low | Not a near-term priority |

---

## Phase Breakdown

### Phase 1: Foundation & Stability (CURRENT - v0.1.x)

**Goal:** Deliver a stable, well-structured codebase ready for community plugin submission.

**Status:** In Progress

| Item | Status | Notes |
|------|--------|-------|
| Core Timeline View | Done | |
| Core Kanban View | Done | |
| Core Table View | Done | |
| Drag-and-drop in all views | Done | |
| Frontmatter read/write | Done | |
| Sample base creation | Done | |
| Refactor `timeline-view.ts` | Pending | Split into modules < 400 lines each |
| Improve error handling | Pending | Catch and surface frontmatter parse errors |
| Submit to Community Plugins | Pending | Requires passing Obsidian review checklist |

**Exit Criteria:** Plugin passes the Obsidian Community Plugins review process and is publicly listed.

---

### Phase 2: Polish & UX (v0.2.x)

**Goal:** Make the existing views feel complete and professional through inline editing, reordering, and accessibility basics.

**Status:** Planned

| Item | Priority | Notes |
|------|----------|-------|
| Kanban: inline card editing | High | Edit title/properties without opening the note |
| Kanban: card reordering within columns | High | Drag to reorder within same column |
| Table: inline cell editing | High | Edit property values directly in table cells |
| Table: column reordering and hiding | Medium | User-controlled column layout |
| Improved mobile support | Medium | Touch-friendly drag-and-drop |
| Accessibility: keyboard navigation | Medium | Arrow keys, focus management |
| Localization / i18n | Low | English-first, structure for future translations |

**Exit Criteria:** All three views support inline editing. No known regressions from v0.1.x. Community feedback from Phase 1 incorporated.

---

### Phase 3: Advanced Features (v0.3.x)

**Goal:** Expand the view type library and add cross-view functionality.

**Status:** Planned

| Item | Priority | Notes |
|------|----------|-------|
| Calendar view (month grid) | High | Visual date distribution of notes |
| List view (grouped list) | Medium | Simple grouping with collapsible sections |
| Custom color palettes | Medium | User-defined color schemes per view |
| View templates | Medium | Save and reuse view configuration |
| Cross-view navigation | Low | Click item in one view, open in another |
| Batch operations in Kanban/Table | Low | Multi-select actions (bulk status change, etc.) |

**Exit Criteria:** Calendar and List views shipped. View templates allow sharing configurations between bases.

---

### Phase 4: Power Features (v1.0.0)

**Goal:** Deliver a feature set comparable to dedicated project management tools within Obsidian.

**Status:** Future

| Item | Priority | Notes |
|------|----------|-------|
| Task dependencies/links (Timeline) | High | Draw dependency arrows between bars |
| Progress tracking / completion % | High | Aggregate child task progress |
| CSV / JSON import and export | Medium | Data portability |
| Custom formula columns (Table) | Medium | Computed columns based on other properties |
| Resource allocation view | Low | Visualize workload per assignee |
| Plugin API for third-party view extensions | Low | Allow other plugins to register custom views |

**Exit Criteria:** v1.0.0 represents a stable, feature-complete release suitable for daily professional use. Plugin API is documented and at least one external view extension exists as proof-of-concept.

---

## Milestone Tracking

### Near-term (Q1-Q2 2026)

| Milestone | Target | Status |
|-----------|--------|--------|
| Refactor `timeline-view.ts` | 2026-04-15 | Pending |
| Error handling improvements | 2026-04-15 | Pending |
| Submit to Community Plugins | 2026-05-01 | Pending |
| v0.1.1 patch release | 2026-05-15 | Pending |

### Mid-term (Q3 2026)

| Milestone | Target | Status |
|-----------|--------|--------|
| Kanban inline editing | 2026-07-01 | Planned |
| Table inline editing | 2026-07-01 | Planned |
| v0.2.0 release | 2026-08-01 | Planned |
| Keyboard navigation support | 2026-08-31 | Planned |

### Long-term (Q4 2026 - 2027)

| Milestone | Target | Status |
|-----------|--------|--------|
| Calendar view | 2026-10-01 | Planned |
| List view | 2026-11-01 | Planned |
| v0.3.0 release | 2026-12-01 | Planned |
| v1.0.0 release | 2027-Q2 | Future |

---

## Success Metrics

### Adoption
- Listed in Obsidian Community Plugins directory
- GitHub stars: tracking after public release
- Active installs: target 500 within 3 months of listing
- Issue/PR engagement: community contributions within 6 months

### Code Quality
- `timeline-view.ts` and other large files broken into modules under 400 lines
- Zero unhandled promise rejections in normal usage
- Automated test coverage: target > 60% for utility functions by v0.2.0

### User Experience
- All views load within 200ms for bases with up to 500 notes
- Drag-and-drop operations complete without visible lag on average hardware
- No data loss on frontmatter write operations (verified by manual test suite)

### Community
- Accepted to Obsidian Community Plugins (passing review with no required changes)
- Documentation sufficient for users to configure views without consulting source code
- At least one community-contributed bug fix or feature by v0.3.0

---

## Known Constraints

### Technical
- Obsidian plugin API is not stable across major versions; updates may require adaptation
- Frontmatter parsing depends on Obsidian's built-in parser; complex YAML structures may have edge cases
- Canvas/rendering performance degrades for very large bases (500+ notes) without virtualization
- BRAT installation is a workaround; the definitive distribution path is the Community Plugins directory

### Project / Bandwidth
- Solo-developer project: development velocity depends on available personal time
- No dedicated QA resources; testing relies on manual verification and community feedback
- Obsidian Community Plugins review process has variable turnaround time
- Mobile Obsidian has a more constrained API surface; mobile-specific features require extra investigation

### Design
- Views are scoped to Obsidian Bases; they do not apply to arbitrary folders or search results without a Base definition
- Frontmatter is the sole persistence mechanism; no separate database or index
- Plugin does not sync state between devices; Obsidian Sync or third-party sync handles file replication

---

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Obsidian API breaking change | High | Medium | Pin tested API version; monitor Obsidian release notes |
| Community Plugin review rejection | Medium | Low | Follow review checklist before submission; address all lint/manifest requirements |
| `timeline-view.ts` complexity causes bugs | Medium | Medium | Prioritize refactor in v0.1.x before adding features |
| Low adoption after listing | Low | Medium | Actively post in Obsidian forums and Discord on release |
| Solo-developer burnout / reduced bandwidth | Medium | Medium | Keep scope conservative; avoid over-committing to roadmap dates |

---

## Document References

- [Project Overview & PDR](./project-overview-pdr.md)
- [Code Standards](./code-standards.md)
- [System Architecture](./system-architecture.md)
- [Codebase Summary](./codebase-summary.md)
- [Design Guidelines](./design-guidelines.md)

### External Resources
- [Obsidian Plugin Developer Docs](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [Obsidian Community Plugins Submission](https://github.com/obsidianmd/obsidian-releases)
- [BRAT Plugin](https://github.com/TfTHacker/obsidian42-brat)

---

**Maintained By:** obsidian-multiview (solo developer)
**Last Review:** 2026-03-19
**Next Review Target:** 2026-04-19
