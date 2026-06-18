import { HtmlBuilder, reactive } from "../../../core/mod.ts"

export function counter(root: HtmlBuilder, initialValue: number) {
    const state = reactive({ count: initialValue })

    root.tag("div", (counter) => {
        counter
            .attrs({ className: "flex flex-row flex-gap flex-even" })
            .style({ fontSize: "1.4rem" })

        counter.tag("button")
            .text("−")
            .on("mousedown", (_) => state.count--)

        counter.tag("span", (countSpan) => {
            countSpan.effect(state, ({ count }) => countSpan.replaceHtml(`Count: <strong>${count}</strong>`))
        })

        counter.tag("button")
            .text("+")
            .on("mousedown", (_) => state.count++)
    })
}
