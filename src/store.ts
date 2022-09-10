import { initCustomFormatter, reactive } from 'vue'
import { HeadingCache, MarkdownView } from 'obsidian'
import { QuietOutline } from './plugin'


const store = reactive({
    plugin: undefined as QuietOutline,

    activeView() {
        this.plugin.activateView()
        this.refreshTree()
    },

    headers: [] as HeadingCache[],
    line2HeaderNumMap: undefined as Line2HeaderNum,

    dark: false,

    leaf_change: false,
    refreshTree() {
        this.leaf_change = !this.leaf_change
    },

    current_note: null as MarkdownView,

    init() {
        this.line2HeaderNumMap = new Line2HeaderNum;
    }
})

class Line2HeaderNum {
    line2HeaderNumMap:Map<number, string>;
    constructor() {
        this.line2HeaderNumMap = new Map<number, string>();
    }
}

export { store }
