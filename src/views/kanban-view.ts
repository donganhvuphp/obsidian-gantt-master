import {
	BasesAllOptions,
	BasesEntry,
	BasesPropertyId,
	BasesPropertyOption,
	BasesView,
	BasesViewConfig,
	Menu,
	Notice,
	QueryController,
} from 'obsidian';
import type GanttMasterPlugin from '../main';
import { renderViewTabBar, switchBasesView } from './shared/view-tab-bar';

interface KanbanConfig {
	groupByProp: BasesPropertyId | null;
	labelProp: BasesPropertyId | null;
	colorProp: BasesPropertyId | null;
	colorMap: Record<string, string>;
}

const DEFAULT_COLUMNS = ['todo', 'in-progress', 'review', 'done'];

export class KanbanView extends BasesView {
	type = 'kanban';
	containerEl: HTMLElement;
	private contentEl: HTMLElement;
	plugin: GanttMasterPlugin;

	constructor(controller: QueryController, scrollEl: HTMLElement, plugin: GanttMasterPlugin) {
		super(controller);
		this.plugin = plugin;
		this.containerEl = scrollEl.createDiv({ cls: 'multiview-kanban' });
		renderViewTabBar(this.containerEl, 'kanban', (type) => switchBasesView(this.app, this.containerEl, type));
		this.contentEl = this.containerEl.createDiv({ cls: 'multiview-kanban-content' });
	}

	onload(): void {
		this.contentEl.createDiv({
			cls: 'multiview-loading',
			text: 'Loading...',
		});
	}

	onunload(): void {
		this.containerEl.empty();
	}

	onDataUpdated(): void {
		this.render();
	}

	static getViewOptions(_config: BasesViewConfig): BasesAllOptions[] {
		const propOption = (displayName: string, key: string, placeholder: string): BasesPropertyOption => ({
			displayName,
			type: 'property',
			key,
			placeholder,
		});

		return [
			{
				displayName: 'Fields',
				type: 'group',
				items: [
					propOption('Group by', 'kanbanGroup', 'Status property'),
					propOption('Label', 'label', 'Title property'),
				],
			},
			{
				displayName: 'Display',
				type: 'group',
				items: [
					propOption('Color by', 'colorBy', 'Color property'),
				],
			},
		];
	}

	private getConfig(): KanbanConfig {
		// Use kanbanGroup from view options, or fall back to reading grouped data from Bases
		const groupByProp = this.config.getAsPropertyId('kanbanGroup');
		return {
			groupByProp,
			labelProp: this.config.getAsPropertyId('label'),
			colorProp: this.config.getAsPropertyId('colorBy'),
			colorMap: this.getColorMap(),
		};
	}

	private getColorMap(): Record<string, string> {
		const raw = (this.config as any)?.colorMap;
		if (raw && typeof raw === 'object') return raw;
		return {};
	}

	private getEntryValue(entry: BasesEntry, propId: BasesPropertyId): string {
		const val = entry.getValue(propId);
		if (!val) return '';
		return String(val ?? '');
	}

	private getEntryLabel(entry: BasesEntry, config: KanbanConfig): string {
		if (config.labelProp) {
			const v = this.getEntryValue(entry, config.labelProp);
			if (v) return v;
		}
		return entry.file?.basename ?? '';
	}

	render(): void {
		this.contentEl.empty();

		const config = this.getConfig();
		const entries = this.data?.data ?? [];
		const groupedData = this.data?.groupedData ?? [];

		// Build column map
		const columnMap = new Map<string, BasesEntry[]>();
		for (const col of DEFAULT_COLUMNS) {
			columnMap.set(col, []);
		}

		if (groupedData.length > 1) {
			// Use Bases native groupBy
			for (const group of groupedData) {
				const key = group.hasKey() ? String(group.key ?? 'Uncategorized') : 'Uncategorized';
				if (!columnMap.has(key)) columnMap.set(key, []);
				for (const entry of group.entries) {
					columnMap.get(key)!.push(entry);
				}
			}
		} else if (config.groupByProp) {
			// Use kanbanGroup from view options
			for (const entry of entries) {
				const val = this.getEntryValue(entry, config.groupByProp) || 'Uncategorized';
				if (!columnMap.has(val)) columnMap.set(val, []);
				columnMap.get(val)!.push(entry);
			}
		} else {
			this.contentEl.createDiv({
				cls: 'multiview-kanban-empty',
				text: 'Configure "Group by" in view options or add groupBy to .base config.',
			});
			return;
		}

		// Render board
		const boardEl = this.contentEl.createDiv({ cls: 'multiview-kanban-board' });

		for (const [colName, colEntries] of columnMap) {
			if (colEntries.length === 0 && !DEFAULT_COLUMNS.includes(colName)) continue;

			const columnEl = boardEl.createDiv({ cls: 'multiview-kanban-column' });

			// Header
			const headerEl = columnEl.createDiv({ cls: 'multiview-kanban-column-header' });
			headerEl.createSpan({ cls: 'multiview-kanban-column-title', text: colName });
			headerEl.createSpan({ cls: 'multiview-kanban-column-count', text: `${colEntries.length}` });

			// Cards container (drop zone)
			const cardsEl = columnEl.createDiv({ cls: 'multiview-kanban-cards' });
			cardsEl.dataset.column = colName;

			cardsEl.addEventListener('dragover', (e) => {
				e.preventDefault();
				cardsEl.addClass('multiview-kanban-drop-target');
			});
			cardsEl.addEventListener('dragleave', () => {
				cardsEl.removeClass('multiview-kanban-drop-target');
			});
			cardsEl.addEventListener('drop', (e) => {
				e.preventDefault();
				cardsEl.removeClass('multiview-kanban-drop-target');
				const filePath = e.dataTransfer?.getData('text/plain');
				if (filePath && config.groupByProp) {
					this.moveEntry(filePath, config.groupByProp, colName);
				}
			});

			for (const entry of colEntries) {
				this.renderCard(cardsEl, entry, config);
			}
		}
	}

	private renderCard(parent: HTMLElement, entry: BasesEntry, config: KanbanConfig): void {
		const cardEl = parent.createDiv({ cls: 'multiview-kanban-card' });
		cardEl.draggable = true;

		// Color indicator
		if (config.colorProp) {
			const colorVal = this.getEntryValue(entry, config.colorProp);
			const color = config.colorMap[colorVal];
			if (color) {
				cardEl.style.borderLeftColor = color;
				cardEl.addClass('multiview-kanban-card-colored');
			}
		}

		// Title
		const label = this.getEntryLabel(entry, config);
		cardEl.createDiv({ cls: 'multiview-kanban-card-title', text: label });

		// Drag
		const filePath = entry.file?.path ?? '';
		cardEl.addEventListener('dragstart', (e) => {
			e.dataTransfer?.setData('text/plain', filePath);
			cardEl.addClass('multiview-kanban-card-dragging');
		});
		cardEl.addEventListener('dragend', () => {
			cardEl.removeClass('multiview-kanban-card-dragging');
		});

		// Click to open
		cardEl.addEventListener('click', () => {
			if (entry.file) {
				this.app.workspace.getLeaf(false).openFile(entry.file);
			}
		});

		// Context menu
		cardEl.addEventListener('contextmenu', (e) => {
			e.preventDefault();
			const menu = new Menu();
			menu.addItem(item => item
				.setTitle('Open note')
				.setIcon('lucide-file-text')
				.onClick(() => { if (entry.file) this.app.workspace.getLeaf(false).openFile(entry.file); }));
			menu.addItem(item => item
				.setTitle('Open in new tab')
				.setIcon('lucide-external-link')
				.onClick(() => { if (entry.file) this.app.workspace.getLeaf(true).openFile(entry.file); }));
			menu.showAtMouseEvent(e);
		});
	}

	private moveEntry(filePath: string, groupByProp: BasesPropertyId, newValue: string): void {
		const entries = this.data?.data ?? [];
		const entry = entries.find(e => e.file?.path === filePath);
		if (!entry) return;

		// Write back to frontmatter
		const file = entry.file;
		if (file) {
			this.app.fileManager.processFrontMatter(file, (fm: any) => {
				// Extract the property name from BasesPropertyId (e.g., "note.status" -> "status")
				const propName = String(groupByProp).replace(/^note\./, '');
				fm[propName] = newValue;
			});
			new Notice(`Moved to ${newValue}`);
		}
	}
}
