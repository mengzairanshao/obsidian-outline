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
import {editorViewField} from "obsidian";
import { store } from './store'
import { arrToTree, calcHeaderStr, getNearestHeader } from "./util";

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
		let header = [0,0,0,0,0,0];
		let lastLine = -1;
		const editor = view.state.field(editorViewField)?.editor;
		if (!editor) return builder.finish();
		const firstLineInView = editor.offsetToPos(view.viewport.from).line;
		const firstHeaderInView = getNearestHeader(firstLineInView);
		firstHeaderInView?.split(".").filter(e => e).map((e, i) => {
			header[i] = +e;
		});
		for (let { from, to } of view.visibleRanges) {
			syntaxTree(view.state).iterate({
				from,
				to,
				enter(node :SyntaxNodeRef) {
					if (node.type.name.startsWith("header_header")) {
						const pos = editor.offsetToPos(node.from);
						if (lastLine === pos.line) return;
						lastLine = pos.line
						const currentLevel = +node.type.name.substring("header_header-".length, "header_header-".length + 1)
						header[currentLevel - 1] += 1;
						const headerStr = calcHeaderStr(header, currentLevel);
						let headerEndPos = editor.getLine(pos.line).match(/^#+\s/gm)?.at(0).length;
						builder.add(
							editor.posToOffset({
								line: pos.line,
								ch: headerEndPos
							}),
							editor.posToOffset({
								line: pos.line,
								ch: headerEndPos
							}),
							Decoration.widget({
								widget: new headerNum(headerStr),
							})
						);
						
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
		div.className = "plugin-outline-heading";
		div.setText(this.headerNumStr);
		return div;
	}

	updateDOM(dom: HTMLElement): boolean {
		dom.setText(this.headerNumStr);
		return true;
	}
}
const pluginSpec: PluginSpec<HeaderReNumPlugin> = {
	decorations: (value: HeaderReNumPlugin) => value.decorations,
};

export const headerReNumPlugin = ViewPlugin.fromClass(
	HeaderReNumPlugin,
	pluginSpec
);
