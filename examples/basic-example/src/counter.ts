import { effect, HtmlBuilder, reactive } from "../../../core/mod.ts"

export function counter(root: HtmlBuilder, initialValue: number) {
    const state = reactive({ count: initialValue })

    root.tag("div", ({ attrs, style, tag }) => {
        attrs({ className: "flex flex-row flex-gap flex-even" })
        style({ fontSize: "1.4rem" })

        tag("button", ({ replaceText, on }) => {
            replaceText("−")
            on("mousedown", (_) => state.count--)
        })

        tag("span", ({ replaceHtml }) => {
            effect(state, ({ count }) => replaceHtml(`Count: <strong>${count}</strong>`))
        })

        tag("button", ({ replaceText, on }) => {
            replaceText("+")
            on("mousedown", (_) => state.count++)
        })
    })
}
