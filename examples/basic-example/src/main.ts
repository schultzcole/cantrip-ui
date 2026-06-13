import { HtmlBuilder } from "../../../core/mod.ts"
import "./style.css"
import { counter } from "./counter.ts"
import { temperatureConverter } from "./temperature-converter.ts"
import { flightBooker } from "./flight-booker.ts"

HtmlBuilder.build(document.getElementById("app")!, (_, { tag }) => {
    tag("h1", (heading) => heading.replaceText("Demystica 7GUIs"))
    tag<"div">("div", (col, { tag }) => {
        col.attrs({ className: "flex flex-col flex-gap" })

        tag("div", (panel) => {
            panel
                .attrs({ className: "panel drop-shadow" })
                .html(
                    `<p>
                        A demo of Eugen Kiss's <a href="https://eugenkiss.github.io/7guis" target="_blank">7GUIs</a>
                        UI framework benchmark implemented in Demystica.
                    </p>`,
                )
        })

        tag("div", (panel) => {
            panel
                .attrs({ className: "panel drop-shadow" })
                .html(`<h2>Counter</h2>`)
                .component(counter, 42)
        })

        tag("div", (panel) => {
            panel
                .attrs({ className: "panel drop-shadow" })
                .html(`<h2>Temperature Converter</h2>`)
                .component(temperatureConverter, 0)
        })

        tag("div", (panel) => {
            panel
                .attrs({ className: "panel drop-shadow" })
                .html(`<h2>Flight Booker</h2>`)
                .component(flightBooker, Temporal.Now.plainDateISO())
        })

        tag("div", (panel) => {
            panel.attrs({ className: "panel drop-shadow" }).html(`<h2>Timer</h2>`)
        })

        tag("div", (panel) => {
            panel.attrs({ className: "panel drop-shadow" }).html(`<h2>Address Book</h2>`)
        })

        tag("div", (panel) => {
            panel.attrs({ className: "panel drop-shadow" }).html(`<h2>Circle Drawer</h2>`)
        })

        tag("div", (panel) => {
            panel.attrs({ className: "panel drop-shadow" }).html(`<h2>Cells</h2>`)
        })
    })
})
