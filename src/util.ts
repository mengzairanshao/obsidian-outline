import { store } from './store'
import {HeadingCache} from 'obsidian'
import type {TreeOption} from 'naive-ui'


export function arrToTree(headers: HeadingCache[]): TreeOption[] {
    const root: TreeOption = { children: [] }
    const stack = [{ node: root, level: -1 }]
    const headCount = [0,0,0,0,0,0]

    if (!headers) return;
    store.line2HeaderNumMap.line2HeaderNumMap.clear();
    headers.forEach((h, i) => {
		headCount[h.level - 1] += 1;
		let headingStr = calcHeaderStr(headCount, h.level);
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

export function calcHeaderStr(headCount: number[], currentLevel: number): string {
    if (!headCount || !currentLevel) return;
    let headingStr = "";
    headCount.forEach((v,j)=>{
        if (j>=currentLevel) {
            headCount[j] = 0;
        } else {
            headingStr += headCount[j] + ".";
        }
    });

    return headingStr;
}

export function getNearestHeader(firstLine: number):string {
    if (!store.headers) return;
    for (var i = store.headers.length - 1; i >= 0; i--) {
        if (firstLine > store.headers[i].position.start.line) {
            var headerStr = store.line2HeaderNumMap?.line2HeaderNumMap?.get(store.headers[i].position.start.line);
            if (headerStr) {
                return headerStr;
            }
            return "0";
        }
    }
    return "0";
}