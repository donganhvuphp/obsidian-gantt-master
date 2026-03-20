import { App, WorkspaceLeaf, setIcon } from 'obsidian';

export interface ViewTabInfo {
	type: string;
	name: string;
	icon: string;
}

export const MULTIVIEW_TABS: ViewTabInfo[] = [
	{ type: 'timeline', name: 'Timeline', icon: 'lucide-calendar-range' },
	{ type: 'kanban', name: 'Kanban', icon: 'lucide-columns-3' },
	{ type: 'table-view', name: 'Table', icon: 'lucide-table' },
];

/**
 * Render a horizontal tab bar showing all Gantt Master view types.
 */
export function renderViewTabBar(
	containerEl: HTMLElement,
	activeType: string,
	onSwitch: (type: string) => void,
): HTMLElement {
	const barEl = containerEl.createDiv({ cls: 'multiview-tab-bar' });

	for (const tab of MULTIVIEW_TABS) {
		const isActive = tab.type === activeType;
		const tabEl = barEl.createDiv({ cls: 'multiview-tab-item' });
		if (isActive) tabEl.addClass('multiview-tab-active');

		const iconEl = tabEl.createSpan({ cls: 'multiview-tab-icon' });
		setIcon(iconEl, tab.icon);

		tabEl.createSpan({ cls: 'multiview-tab-label', text: tab.name });

		if (!isActive) {
			tabEl.addEventListener('click', () => onSwitch(tab.type));
		}
	}

	return barEl;
}

/** Find the WorkspaceLeaf that contains the given DOM element. */
function findLeafForEl(app: App, el: HTMLElement): WorkspaceLeaf | null {
	const leaves = app.workspace.getLeavesOfType('bases');
	for (const leaf of leaves) {
		// containerEl is not in public typings but exists at runtime
		const leafEl = (leaf as any).containerEl as HTMLElement | undefined;
		if (leafEl && leafEl.contains(el)) return leaf;
	}
	return null;
}

/**
 * Switch Bases view by updating the leaf's ViewState.
 * Reads the .base file's views array to find the target index.
 */
export function switchBasesView(app: App, containerEl: HTMLElement, targetType: string): void {
	const leaf = findLeafForEl(app, containerEl);
	if (!leaf) return;

	const currentState = leaf.getViewState();
	const state = (currentState.state ?? {}) as Record<string, unknown>;
	const file = state['file'] as string | undefined;
	if (!file) return;

	const baseFile = app.vault.getFileByPath(file);
	if (!baseFile) return;

	// Read .base YAML to find the view name matching the target type
	app.vault.read(baseFile).then(content => {
		// Parse view entries: extract type and name pairs
		const viewBlocks = content.split(/\n\s*-\s*type:\s*/);
		viewBlocks.shift(); // remove content before first view

		for (const block of viewBlocks) {
			const typeMatch = block.match(/^(\S+)/);
			const nameMatch = block.match(/\n\s*name:\s*(.+)/);
			if (typeMatch && typeMatch[1] === targetType && nameMatch) {
				const viewName = nameMatch[1].trim();
				state['viewName'] = viewName;
				leaf.setViewState({ ...currentState, state });
				return;
			}
		}
	});
}
