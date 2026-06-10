import { HtmlBuilder } from "../../../core/mod.ts"
import "./style.css"
import { counter } from "./counter.ts"
import { temperatureConverter } from "./temperature-converter.ts"

HtmlBuilder.build(document.getElementById("app")!, ({ tag }) => {
    tag("h1", (heading) => heading.replaceText("FOOF 7GUIs"))
    tag("div", ({ attrs, tag }) => {
        attrs({ className: "flex flex-col flex-gap" })
        tag("div", ({ attrs, html }) => {
            attrs({ className: "panel drop-shadow" })
            html(
                `<p>
                    A demo of Eugen Kiss's <a href="https://eugenkiss.github.io/7guis" target="_blank">7GUIs</a>
                    UI framework benchmark implemented in FOOF.
                </p>`,
            )
        })

        tag("div", ({ attrs, html, component }) => {
            attrs({ className: "panel drop-shadow" })
            html(`<h2>Counter</h2>`)
            component(counter, 42)
        })

        tag("div", ({ attrs, html, component }) => {
            attrs({ className: "panel drop-shadow" })
            html(`<h2>Temperature Converter</h2>`)
            component(temperatureConverter, 0)
        })

        tag("div", ({ attrs, html }) => {
            attrs({ className: "panel drop-shadow" })
            html(`<h2>Flight Booker</h2>`)
        })

        tag("div", ({ attrs, html }) => {
            attrs({ className: "panel drop-shadow" })
            html(`<h2>Timer</h2>`)
        })

        tag("div", ({ attrs, html }) => {
            attrs({ className: "panel drop-shadow" })
            html(`<h2>Address Book</h2>`)
        })

        tag("div", ({ attrs, html }) => {
            attrs({ className: "panel drop-shadow" })
            html(`<h2>Circle Drawer</h2>`)
        })

        tag("div", ({ attrs, html }) => {
            attrs({ className: "panel drop-shadow" })
            html(`<h2>Cells</h2>`)
        })
    })
})
