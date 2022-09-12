import { store } from './store'
import {HeadingCache} from 'obsidian'
import type {TreeOption} from 'naive-ui'


export function arrToTree(headers: HeadingCache[]): TreeOption[] {
    const root: TreeOption = { children: [] }
    const stack = [{ node: root, level: -1 }]
    const headCount = [0,0,0,0,0,0]

    if (!headers) return;
    headers.forEach((h, i) => {
		headCount[h.level - 1] += 1;
		let headingStr = ""
		headCount.forEach((v,j)=>{
			if (j>=h.level) {
				headCount[j] = 0;
			} else {
				headingStr += headCount[j] + "."
			}
		});
		store.line2HeaderNumMap.line2HeaderNumMap.set(h.position.start.line, headingStr);
        let node: TreeOption = {
            label: headingStr + " " + h.heading,
            key: "item-" + h.level + "-" + i,
            line: h.position.start.line,
			headStr: headingStr,
        }

        while (h.level <= stack.last().level) {
            stack.pop()
        }

        let parent = stack.last().node
        if (parent.children === undefined) {
            parent.children = []
        }
        parent.children.push(node)
        stack.push({ node, level: h.level })
    })

    return root.children
}