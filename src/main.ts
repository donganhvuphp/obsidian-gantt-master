import { App, Notice, Plugin, PluginSettingTab, Setting, normalizePath } from 'obsidian';
import { TimelineView } from './views/timeline-view';
import { KanbanView } from './views/kanban-view';
import { TableView } from './views/table-view';

interface GanttMasterPluginSettings {
	defaultWeekStart: 'monday' | 'sunday';
}

const DEFAULT_SETTINGS: GanttMasterPluginSettings = {
	defaultWeekStart: 'monday',
};

export default class GanttMasterPlugin extends Plugin {
	settings: GanttMasterPluginSettings = DEFAULT_SETTINGS;

	async onload() {
		await this.loadSettings();

		// Register Timeline (Gantt) view
		this.registerBasesView('timeline', {
			name: 'Timeline',
			icon: 'lucide-calendar-range',
			factory: (controller, containerEl) => new TimelineView(controller, containerEl, this),
			options: TimelineView.getViewOptions,
		});

		// Register Kanban view
		this.registerBasesView('kanban', {
			name: 'Kanban',
			icon: 'lucide-columns-3',
			factory: (controller, containerEl) => new KanbanView(controller, containerEl, this),
			options: KanbanView.getViewOptions,
		});

		// Register Table view
		this.registerBasesView('table-view', {
			name: 'Table',
			icon: 'lucide-table',
			factory: (controller, containerEl) => new TableView(controller, containerEl, this),
			options: TableView.getViewOptions,
		});

		this.addSettingTab(new GanttMasterSettingTab(this.app, this));
	}

	async createSampleBase(): Promise<void> {
		const folder      = 'Gantt Master Sample';
		const notesFolder = `${folder}/Notes`;
		const basePath    = normalizePath(`${folder}/Project Tasks.base`);

		if (!await this.app.vault.adapter.exists(folder)) {
			await this.app.vault.createFolder(folder);
		}
		if (!await this.app.vault.adapter.exists(notesFolder)) {
			await this.app.vault.createFolder(notesFolder);
		}

		const today = new Date();
		const fmt = (d: Date) => d.toISOString().slice(0, 10);
		const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

		const statuses = ['todo', 'in-progress', 'review', 'done'];
		const tasks: { name: string; start: number; duration: number; priority: 'High' | 'Medium' | 'Low'; status: string }[] = [
			{ name: 'Setup project repo',         start: 0,  duration: 1, priority: 'High',   status: 'done' },
			{ name: 'Design database schema',     start: 1,  duration: 3, priority: 'High',   status: 'done' },
			{ name: 'Implement auth API',          start: 3,  duration: 4, priority: 'High',   status: 'in-progress' },
			{ name: 'Build dashboard UI',          start: 5,  duration: 5, priority: 'Medium', status: 'in-progress' },
			{ name: 'Write unit tests',            start: 7,  duration: 3, priority: 'Medium', status: 'todo' },
			{ name: 'Setup CI/CD pipeline',        start: 10, duration: 2, priority: 'Low',    status: 'todo' },
			{ name: 'Code review',                 start: 12, duration: 2, priority: 'High',   status: 'todo' },
			{ name: 'Deploy to staging',           start: 14, duration: 1, priority: 'Medium', status: 'todo' },
		];

		for (const task of tasks) {
			const startDate = addDays(today, task.start);
			const endDate   = addDays(today, task.start + task.duration);
			const filePath  = normalizePath(`${notesFolder}/${task.name}.md`);
			const content   = `---\nstart_date: ${fmt(startDate)}\nend_date: ${fmt(endDate)}\npriority: ${task.priority}\nstatus: ${task.status}\n---\n\n# ${task.name}\n`;
			if (!await this.app.vault.adapter.exists(filePath)) {
				await this.app.vault.create(filePath, content);
			}
		}

		const baseContent = `filters:
  and:
    - "!start_date.isEmpty()"
views:
  - type: timeline
    name: Timeline View
    filters:
      and:
        - file.folder == "${notesFolder}"
    sort:
      - property: start_date
        direction: ASC
    startDate: note.start_date
    endDate: note.end_date
    label: note.title
    colorBy: note.status
    colorMap:
      done: "#2f9e44"
      in-progress: "#1c7ed6"
      review: "#f59f00"
      todo: "#868e96"
    timeScale: day
    zoom: 1
  - type: kanban
    name: Kanban View
    filters:
      and:
        - file.folder == "${notesFolder}"
    groupBy: note.status
    label: note.title
    colorBy: note.priority
    colorMap:
      High: "#e03131"
      Medium: "#f59f00"
      Low: "#2f9e44"
  - type: table-view
    name: Table View
    filters:
      and:
        - file.folder == "${notesFolder}"
    sort:
      - property: start_date
        direction: ASC
`;
		if (!await this.app.vault.adapter.exists(basePath)) {
			await this.app.vault.create(basePath, baseContent);
		}

		new Notice(`Sample base created in "${folder}" — open Project Tasks.base to view.`);

		const file = this.app.vault.getFileByPath(basePath);
		if (file) {
			await this.app.workspace.getLeaf(false).openFile(file);
		}
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	onunload() {}
}

class GanttMasterSettingTab extends PluginSettingTab {
	plugin: GanttMasterPlugin;

	constructor(app: App, plugin: GanttMasterPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Gantt Master' });

		new Setting(containerEl)
			.setName('Default week starts on')
			.setDesc('Used by Timeline views unless overridden in the view options.')
			.addDropdown(dropdown => dropdown
				.addOption('monday', 'Monday')
				.addOption('sunday', 'Sunday')
				.setValue(this.plugin.settings.defaultWeekStart)
				.onChange(async (value: 'monday' | 'sunday') => {
					this.plugin.settings.defaultWeekStart = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Create sample base')
			.setDesc('Creates a sample folder with tasks and a .base file containing Timeline, Kanban, and Table views.')
			.addButton(btn => btn
				.setButtonText('Create sample')
				.setCta()
				.onClick(async () => {
					btn.setDisabled(true);
					btn.setButtonText('Creating…');
					try {
						await this.plugin.createSampleBase();
					} finally {
						btn.setDisabled(false);
						btn.setButtonText('Create sample');
					}
				}));
	}
}
