import { effect, HtmlBuilder, reactive } from "../../../core/mod.ts"

export function counter(root: HtmlBuilder, initialValue: number) {
    const state = reactive({ count: initialValue })

    root.tag("div", (counter, { tag }) => {
        counter
            .attrs({ className: "flex flex-row flex-gap flex-even" })
            .style({ fontSize: "1.4rem" })

        tag("button", (button) => {
            button
                .replaceText("−")
                .on("mousedown", (_) => state.count--)
        })

        tag("span", (countSpan) => {
            effect(state, ({ count }) => countSpan.replaceHtml(`Count: <strong>${count}</strong>`))
        })

        tag("button", (button) => {
            button
                .replaceText("+")
                .on("mousedown", (_) => state.count++)
        })
    })
}
