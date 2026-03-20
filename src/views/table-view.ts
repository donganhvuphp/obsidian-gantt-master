import {
	BasesAllOptions,
	BasesEntry,
	BasesPropertyId,
	BasesPropertyOption,
	BasesView,
	BasesViewConfig,
	Menu,
	QueryController,
} from 'obsidian';
import type GanttMasterPlugin from '../main';
import { renderViewTabBar, switchBasesView } from './shared/view-tab-bar';

type SortDir = 'asc' | 'desc' | null;

export class TableView extends BasesView {
	type = 'table-view';
	containerEl: HTMLElement;
	private contentEl: HTMLElement;
	plugin: GanttMasterPlugin;
	private _sortCol: string | null = null;
	private _sortDir: SortDir = null;

	constructor(controller: QueryController, scrollEl: HTMLElement, plugin: GanttMasterPlugin) {
		super(controller);
		this.plugin = plugin;
		this.containerEl = scrollEl.createDiv({ cls: 'multiview-table' });
		renderViewTabBar(this.containerEl, 'table-view', (type) => switchBasesView(this.app, this.containerEl, type));
		this.contentEl = this.containerEl.createDiv({ cls: 'multiview-table-content' });
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

		const columnOptions = Array.from({ length: 8 }, (_, i) =>
			propOption(`Column ${i + 1}`, `col${i + 1}`, `Column ${i + 1}`),
		);

		return [
			{
				displayName: 'Display',
				type: 'group',
				items: [
					propOption('Label', 'label', 'Title property'),
					propOption('Color by', 'colorBy', 'Color property'),
				],
			},
			{
				displayName: 'Columns',
				type: 'group',
				items: columnOptions,
			},
		];
	}

	private getColorMap(): Record<string, string> {
		const raw = (this.config as any)?.colorMap;
		if (raw && typeof raw === 'object') return raw;
		return {};
	}

	private getEntryValue(entry: BasesEntry, propId: BasesPropertyId): string {
		const val = entry.getValue(propId);
		if (!val) return '';
		return String(val);
	}

	private getEntryLabel(entry: BasesEntry): string {
		const labelProp = this.config.getAsPropertyId('label');
		if (labelProp) {
			const v = this.getEntryValue(entry, labelProp);
			if (v) return v;
		}
		return entry.file?.basename ?? '';
	}

	render(): void {
		this.contentEl.empty();

		const entries = [...(this.data?.data ?? [])];
		const selectedCols: BasesPropertyId[] = [];
		for (let i = 1; i <= 8; i++) {
			const col = this.config.getAsPropertyId(`col${i}`);
			if (col) selectedCols.push(col);
		}
		const visibleProps = selectedCols.length > 0 ? selectedCols : (this.allProperties ?? []);
		const colorProp = this.config.getAsPropertyId('colorBy');
		const colorMap = this.getColorMap();

		if (entries.length === 0) {
			this.contentEl.createDiv({ cls: 'multiview-table-empty', text: 'No entries found.' });
			return;
		}

		// Sort entries
		if (this._sortCol && this._sortDir) {
			const col = this._sortCol;
			const dir = this._sortDir === 'asc' ? 1 : -1;
			entries.sort((a, b) => {
				const va = col === '__name__' ? (a.file?.basename ?? '') : this.getEntryValue(a, col as BasesPropertyId);
				const vb = col === '__name__' ? (b.file?.basename ?? '') : this.getEntryValue(b, col as BasesPropertyId);
				return va.localeCompare(vb) * dir;
			});
		}

		// Build table
		const wrapperEl = this.contentEl.createDiv({ cls: 'multiview-table-wrapper' });
		const tableEl = wrapperEl.createEl('table', { cls: 'multiview-table-el' });

		// Header
		const theadEl = tableEl.createEl('thead');
		const headerRow = theadEl.createEl('tr');

		// Name column
		const nameThEl = headerRow.createEl('th', { cls: 'multiview-table-th multiview-table-th-name', text: 'Name' });
		nameThEl.addEventListener('click', () => this.toggleSort('__name__'));
		if (this._sortCol === '__name__') {
			nameThEl.createSpan({ cls: 'multiview-table-sort-icon', text: this._sortDir === 'asc' ? ' ↑' : ' ↓' });
		}

		// Property columns
		for (const propId of visibleProps) {
			const propName = String(propId).replace(/^note\./, '').replace(/^file\./, '');
			const thEl = headerRow.createEl('th', { cls: 'multiview-table-th', text: propName });
			thEl.addEventListener('click', () => this.toggleSort(String(propId)));
			if (this._sortCol === String(propId)) {
				thEl.createSpan({ cls: 'multiview-table-sort-icon', text: this._sortDir === 'asc' ? ' ↑' : ' ↓' });
			}
		}

		// Body
		const tbodyEl = tableEl.createEl('tbody');
		for (const entry of entries) {
			const rowEl = tbodyEl.createEl('tr', { cls: 'multiview-table-row' });

			// Color
			if (colorProp) {
				const colorVal = this.getEntryValue(entry, colorProp);
				const color = colorMap[colorVal];
				if (color) {
					rowEl.style.borderLeftColor = color;
					rowEl.addClass('multiview-table-row-colored');
				}
			}

			// Name cell
			const label = this.getEntryLabel(entry);
			const nameTdEl = rowEl.createEl('td', { cls: 'multiview-table-td multiview-table-td-name' });
			const linkEl = nameTdEl.createEl('a', { cls: 'multiview-table-link', text: label });
			linkEl.addEventListener('click', (e) => {
				e.preventDefault();
				if (entry.file) this.app.workspace.getLeaf(false).openFile(entry.file);
			});

			// Property cells
			for (const propId of visibleProps) {
				const val = this.getEntryValue(entry, propId);
				rowEl.createEl('td', { cls: 'multiview-table-td', text: val });
			}

			// Context menu
			rowEl.addEventListener('contextmenu', (e) => {
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

		// Footer
		const footerEl = this.contentEl.createDiv({ cls: 'multiview-table-footer' });
		footerEl.createSpan({ text: `${entries.length} entries` });
	}

	private toggleSort(col: string): void {
		if (this._sortCol === col) {
			if (this._sortDir === 'asc') this._sortDir = 'desc';
			else { this._sortCol = null; this._sortDir = null; }
		} else {
			this._sortCol = col;
			this._sortDir = 'asc';
		}
		this.render();
	}
}
