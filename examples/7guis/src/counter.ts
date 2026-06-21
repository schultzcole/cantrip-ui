import { HtmlBuilder, reactive } from "@cantrip-ui/core"

export function counter(root: HtmlBuilder, initialValue: number) {
    const state = reactive({ count: initialValue })

    root.tag("div", counter => {
        counter.attrs({ className: "flex flex-row flex-gap flex-even" }).style({ fontSize: "1.4rem" })

        counter
            .tag("button")
            .text("−")
            .on("mousedown", () => state.count--)

        counter.tag("span").effect(state, ({ count }, label) => label.replaceHtml(`Count: <strong>${count}</strong>`))

        counter
            .tag("button")
            .text("+")
            .on("mousedown", () => state.count++)
    })
}
