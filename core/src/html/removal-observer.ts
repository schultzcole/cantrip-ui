import type HtmlBuilder from "./html-builder.js"

/**
 * Keeps track of node removals in a document, and if any belong to a registered HtmlBuilder, detach that builder.
 */
export class RemovalObserver {
    private readonly _observer: MutationObserver
    private readonly _map: WeakMap<Element, HtmlBuilder> = new WeakMap()

    constructor(public readonly document: Document) {
        this._observer = new MutationObserver((records) => {
            for (const record of records) {
                if (!record.removedNodes?.length) continue
                for (const removedNode of record.removedNodes) {
                    if (!(removedNode instanceof HTMLElement)) continue
                    this.detachChildren(removedNode)
                }
            }
        })
        this._observer.observe(document, { childList: true, subtree: true })
    }

    registerBuilder(builder: HtmlBuilder): void {
        this._map.getOrInsert(builder.element, builder)
    }

    private detachChildren(element: Element): void {
        const builder = this._map.get(element)

        for (const child of element.children) {
            this.detachChildren(child)
        }

        if (builder) {
            builder.detach()
            this._map.delete(element)
        }
    }
}
