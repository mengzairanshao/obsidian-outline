import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import {
	Decoration,
	DecorationSet,
	EditorView, PluginSpec,
	PluginValue,
	ViewPlugin,
	ViewUpdate, WidgetType,
} from "@codemirror/view";
import {SyntaxNodeRef} from "@lezer/common";
import {editorEditorField, editorViewField, MarkdownView} from "obsidian";
import { store } from './store'

class HeaderReNumPlugin implements PluginValue {
	decorations: DecorationSet;

	constructor(view: EditorView) {
		this.decorations = this.buildDecorations(view);
	}

	update(update: ViewUpdate) {
		if (update.docChanged || update.viewportChanged) {
			this.decorations = this.buildDecorations(update.view);
		}
	}

	buildDecorations(view: EditorView): DecorationSet {
		const builder = new RangeSetBuilder<Decoration>();
		for (let { from, to } of view.visibleRanges) {
			syntaxTree(view.state).iterate({
				from,
				to,
				enter(node :SyntaxNodeRef) {
					if (node.type.name.startsWith("header")) {
						// Position of the '-' or the '*'.
						const listCharFrom = node.from;
						let editor = view.state.field(editorViewField)?.editor;
						if (!editor) return;
						let pos = editor.offsetToPos(listCharFrom);
						let lineStartContent = editor.getLine(pos.line).substring(0, pos.ch).trimEnd();
						if(/^#{1,}$/gm.test(lineStartContent) && store.line2HeaderNumMap?.line2HeaderNumMap?.get(pos.line)) {
							builder.add(
								listCharFrom,
								listCharFrom,
								Decoration.widget({
									widget: new headerNum(store.line2HeaderNumMap?.line2HeaderNumMap.get(pos.line) + " "),
								})
							);
						}
					}
				},
			});
		}

		return builder.finish();
	}

	destroy() {}
}

class headerNum extends WidgetType {
	headerNumStr :string;

	constructor(headerNumStr :string) {
		super();
		this.headerNumStr = headerNumStr;
	}
	toDOM(view: EditorView): HTMLElement {
		let div = document.createElement("span");
		div.setText(this.headerNumStr);
		return div;
	}
}
const pluginSpec: PluginSpec<HeaderReNumPlugin> = {
	decorations: (value: HeaderReNumPlugin) => value.decorations,
};

export const headerReNumPlugin = ViewPlugin.fromClass(
	HeaderReNumPlugin,
	pluginSpec
);
