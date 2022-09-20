import {
	debounce,
	MarkdownView,
	Notice,
	Plugin,
	TFile,
	EditorChange,
} from 'obsidian'

import { OutlineView, VIEW_TYPE } from './view'
import { store } from './store'

import { SettingTab, QuietOutlineSettings, DEFAULT_SETTINGS } from "./settings"
import {headerReNumPlugin} from "./renumber"
import { arrToTree } from './util'


export class QuietOutline extends Plugin {
	settings: QuietOutlineSettings;
	current_note: MarkdownView;

	async onload() {
		await this.loadSettings()

		store.init();
		store.plugin = this
		store.dark = document.querySelector('body').classList.contains('theme-dark')
		
		const current_file = this.app.workspace.getActiveFile()
		if (store.line2HeaderNumMap?.line2HeaderNumMap?.size === 0 && current_file) {
			arrToTree(this.app.metadataCache.getFileCache(current_file).headings);
		}

		this.registerMarkdownPostProcessor(async (el, ctx)=> {
			let ele = el.findAll("h1,h2,h3,h4,h5,h6");
			ele.forEach((value, index, array)=>{
				let head = store.line2HeaderNumMap.line2HeaderNumMap.get(ctx.getSectionInfo(value)?.lineStart);
				if (head) value.setText(head + value.getText());
			})
		});

		this.registerView(
			VIEW_TYPE,
			(leaf) => new OutlineView(leaf, this)
		)

		this.registerEditorExtension(headerReNumPlugin);

		// for test
		// this.addRibbonIcon('bot', 'test something', (evt) => {
		// 	const view = this.app.workspace.getActiveViewOfType(MarkdownView)
		// 	console.dir(view.getState())
		// })

		this.addCommand({
			id: "quiet-outline",
			name: "Quiet Outline",
			callback: () => {
				this.activateView()
			}
		})

		this.addCommand({
			id: "quiet-outline-reset",
			name: "Reset expanding level",
			callback: () => {
				dispatchEvent(new CustomEvent("quiet-outline-reset"))
			}
		})

		this.addCommand({
			id: "quiet-remove-all-headers",
			name: "remove all headers",
			callback: () => {
				this.removeAllHeadersNumber();
			}
		})


		this.addSettingTab(new SettingTab(this.app, this))


		// refresh headings
		const refresh_outline = () => {
			const current_file = this.app.workspace.getActiveFile()
			if (current_file) {
				const headers = this.app.metadataCache.getFileCache(current_file).headings
				if (headers) {
					store.headers = headers
					return
				}
			}
			store.headers = []
		}

		const refresh = debounce(refresh_outline, 300, true)
		this.registerEvent(this.app.metadataCache.on('changed', () => {
			refresh()
		}))

		this.registerEvent(this.app.workspace.on('active-leaf-change', async (leaf) => {
			console.log("active-leaf-change")

			let view = this.app.workspace.getActiveViewOfType(MarkdownView)
			if (view) {
				if (this.current_note !== view) {
					store.leaf_change = !store.leaf_change
				}
				refresh_outline()
				this.current_note = view
			}
		}))

		this.registerEvent(this.app.workspace.on('css-change', () => {
			console.log("css-change")
			store.dark = document.querySelector('body').classList.contains('theme-dark')
		}))

		this.app.workspace.onLayoutReady(()=>{
			this.activateView();
		})
		// sync with markdown
	}

	async removeAllHeadersNumber(){
		const cFile = this.app.workspace.getActiveFile();
		if (!cFile) return;
		const headings = this.app.metadataCache.getFileCache(cFile)?.headings;
		const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor
		if (!headings || !editor) return;
		const changes: EditorChange[] = [];
		const cs: number[] = [];
		headings.forEach(element => {
			const headerNumLength = element.heading.match(/^(\d+\.)*\d* */gm)?.at(0).length;
			const lineNum = element.position.start.line;
			if (headerNumLength) {
				cs.push(lineNum);
				changes.push({
					text: '',
					from: {
						line: lineNum,
						ch: element.position.end.col - element.heading.length
					},
					to: {
						line: lineNum,
						ch: element.position.end.col - element.heading.length + headerNumLength
					}
				});
			}
		});
		if (changes.length !== 0) {
			editor.transaction({
				changes: changes
			})
		}
		console.log("changes line:", ...cs);
		new Notice("remove headers number finished");
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE)
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async activateView() {
		if (this.app.workspace.getLeavesOfType(VIEW_TYPE).length === 0) {
			await this.app.workspace.getRightLeaf(false).setViewState({
				type: VIEW_TYPE,
				active: true,
			})
		}
		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]
		)
	}

}



