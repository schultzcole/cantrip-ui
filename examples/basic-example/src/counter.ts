import { HtmlBuilder, reactive } from "../../../core/mod.ts"

export function counter(root: HtmlBuilder, initialValue: number) {
    const state = reactive({ count: initialValue })

    root.tag("div", { className: "flex flex-row flex-gap flex-even" }, (div) => {
        div
            .style({ fontSize: "1.4rem" })
            .tag("button", (button) => {
                button.text("-").on("mousedown", (_) => state.count--)
            })
            .tag("span", (span) => {
                span.reactive(state, ({ count }) => span.html`Count: <strong>${count}</strong>`)
            })
            .tag("button", (button) => {
                button.text("+").on("mousedown", (_) => state.count++)
            })
    })
}
